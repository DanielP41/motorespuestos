import os
import uuid
import hmac
import hashlib
import mercadopago
from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks, status
from pydantic import BaseModel, field_validator, model_validator
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db, SessionLocal
from ..models import Venta, ItemVenta, Repuesto, Cliente
from ..logger import logger
from .auth import get_current_user

router = APIRouter()

MP_ACCESS_TOKEN = os.getenv("MP_ACCESS_TOKEN", "")
MP_WEBHOOK_SECRET = os.getenv("MP_WEBHOOK_SECRET", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8001")


# ── Schemas ──────────────────────────────────────────────────────────────────

class ItemPreferencia(BaseModel):
    repuesto_id: int
    cantidad: int
    descuento_pct: float = 0.0

    @field_validator("cantidad")
    @classmethod
    def cantidad_positiva(cls, v: int) -> int:
        if v < 1:
            raise ValueError("La cantidad debe ser al menos 1")
        return v

    @field_validator("descuento_pct")
    @classmethod
    def descuento_valido(cls, v: float) -> float:
        if not (0 <= v <= 100):
            raise ValueError("El descuento debe estar entre 0 y 100")
        return v


class PreferenciaCreate(BaseModel):
    items: List[ItemPreferencia]
    payer_email: str
    payer_name: Optional[str] = None
    notas: Optional[str] = None
    impuesto_pct: float = 0.0
    cliente_id: Optional[int] = None

    @field_validator("items")
    @classmethod
    def items_no_vacios(cls, v: list) -> list:
        if not v:
            raise ValueError("El pedido debe tener al menos un ítem")
        return v

    @field_validator("impuesto_pct")
    @classmethod
    def impuesto_valido(cls, v: float) -> float:
        if not (0 <= v <= 100):
            raise ValueError("El impuesto debe estar entre 0 y 100")
        return v


class PreferenciaOut(BaseModel):
    init_point: str
    venta_id: int
    numero_factura: str


# ── Helpers ───────────────────────────────────────────────────────────────────

def _verificar_firma_mp(body: bytes, signature_header: str, request_id: str, payment_id: str) -> bool:
    """Verifica la firma HMAC-SHA256 enviada por MercadoPago en el header x-signature."""
    try:
        parts = dict(p.split("=", 1) for p in signature_header.split(","))
        ts = parts.get("ts", "")
        v1 = parts.get("v1", "")
    except Exception:
        return False

    if not ts or not v1:
        return False

    manifest = f"id:{payment_id};request-id:{request_id};ts:{ts}"
    expected = hmac.new(
        MP_WEBHOOK_SECRET.encode(),
        manifest.encode(),
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, v1)


def _procesar_pago(payment_id: str):
    """Consulta el pago en MP y actualiza el estado de la venta.
    Crea su propia sesión de BD — no reutiliza la del request (ya cerrada)."""
    if not MP_ACCESS_TOKEN:
        return

    sdk = mercadopago.SDK(MP_ACCESS_TOKEN)
    resultado = sdk.payment().get(payment_id)

    if resultado["status"] != 200:
        logger.error("MP webhook: no se pudo obtener pago {} — status {}", payment_id, resultado["status"])
        return

    pago = resultado["response"]
    mp_status = pago.get("status")
    external_ref = pago.get("external_reference")

    if not external_ref:
        logger.warning("MP webhook: pago {} sin external_reference", payment_id)
        return

    try:
        venta_id = int(external_ref)
    except ValueError:
        logger.warning("MP webhook: external_reference inválido '{}'", external_ref)
        return

    # Sesión propia — la del request ya está cerrada cuando esto corre
    db = SessionLocal()
    try:
        venta = db.query(Venta).filter(Venta.id == venta_id).first()
        if not venta:
            logger.warning("MP webhook: venta {} no encontrada", venta_id)
            return

        venta.mp_payment_id = str(payment_id)

        TRANSICIONES = {
            "pendiente":  {"pagada", "anulada"},
            "pagada":     {"anulada"},
            "en_credito": {"pagada", "anulada"},
            "anulada":    set(),
        }

        if mp_status == "approved" and "pagada" in TRANSICIONES.get(venta.estado, set()):
            venta.estado = "pagada"
            logger.info("MP webhook: venta {} marcada como pagada (payment {})", venta_id, payment_id)
        elif mp_status in ("rejected", "cancelled") and "anulada" in TRANSICIONES.get(venta.estado, set()):
            venta.estado = "anulada"
            logger.info("MP webhook: venta {} anulada (payment {} status {})", venta_id, payment_id, mp_status)
        else:
            logger.info("MP webhook: pago {} status '{}' — sin cambio en venta {}", payment_id, mp_status, venta_id)

        db.commit()
    except Exception as e:
        db.rollback()
        logger.error("MP webhook: error procesando pago {} — {}", payment_id, e)
    finally:
        db.close()


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/crear-preferencia", response_model=PreferenciaOut, status_code=status.HTTP_201_CREATED)
def crear_preferencia(
    body: PreferenciaCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if not MP_ACCESS_TOKEN:
        raise HTTPException(status_code=503, detail="Pagos con MercadoPago no configurados")

    # FIX: cliente_id solo puede ser el propio usuario — previene IDOR
    if body.cliente_id is not None:
        if isinstance(current_user, Cliente) and current_user.id != body.cliente_id:
            raise HTTPException(status_code=403, detail="No podés asociar la compra a otro cliente")

    # 1. Verificar stock y construir ítems usando precio de BD (nunca del cliente)
    mp_items = []
    items_venta = []

    for item in body.items:
        repuesto = db.query(Repuesto).filter(Repuesto.id == item.repuesto_id).with_for_update().first()
        if not repuesto:
            db.rollback()
            raise HTTPException(status_code=404, detail=f"Repuesto {item.repuesto_id} no encontrado")
        if repuesto.estado != "activo":
            db.rollback()
            raise HTTPException(status_code=400, detail=f"'{repuesto.nombre}' no está disponible")
        if repuesto.stock_actual < item.cantidad:
            db.rollback()
            raise HTTPException(
                status_code=400,
                detail=f"Stock insuficiente para '{repuesto.nombre}'. Disponible: {repuesto.stock_actual}"
            )

        # FIX: precio siempre de la BD, nunca del cliente
        precio_base = float(repuesto.precio_venta)
        precio_final = round(precio_base * (1 - item.descuento_pct / 100), 2)

        mp_items.append({
            "id": str(repuesto.id),
            "title": repuesto.nombre,
            "quantity": item.cantidad,
            "unit_price": precio_final,
            "currency_id": "ARS",
        })
        items_venta.append((item, repuesto, precio_base, precio_final))

    # 2. Crear la venta en BD con estado "pendiente"
    factura_nro = f"FAC-{str(uuid.uuid4())[:8].upper()}"
    db_venta = Venta(
        numero_factura=factura_nro,
        usuario=getattr(current_user, "username", getattr(current_user, "email", "publico")),
        cliente_id=body.cliente_id,
        metodo_pago="mercadopago",
        notas=body.notas,
        impuesto_pct=body.impuesto_pct,
        estado="pendiente",
        total=0,
    )
    db.add(db_venta)
    db.flush()

    for item, repuesto, precio_base, precio_final in items_venta:
        db_item = ItemVenta(
            venta_id=db_venta.id,
            repuesto_id=item.repuesto_id,
            cantidad=item.cantidad,
            precio_unitario=precio_base,
            subtotal=round(precio_final * item.cantidad, 2),
        )
        db.add(db_item)

    # 3. Crear preferencia en MercadoPago
    sdk = mercadopago.SDK(MP_ACCESS_TOKEN)
    preferencia_data = {
        "items": mp_items,
        "payer": {
            "email": body.payer_email,
            "name": body.payer_name or "",
        },
        "back_urls": {
            "success": f"{FRONTEND_URL}/pedido-exitoso",
            "failure": f"{FRONTEND_URL}/pedido-fallido",
            "pending": f"{FRONTEND_URL}/pedido-pendiente",
        },
        "auto_return": "approved",
        "external_reference": str(db_venta.id),
        "notification_url": f"{API_BASE_URL}/pagos/webhook",
        "statement_descriptor": "Moto Repuestos",
    }

    resultado = sdk.preference().create(preferencia_data)
    if resultado["status"] not in (200, 201):
        db.rollback()
        logger.error("Error al crear preferencia MP: {}", resultado)
        raise HTTPException(status_code=502, detail="Error al conectar con MercadoPago")

    init_point = resultado["response"]["init_point"]
    preference_id = resultado["response"]["id"]

    db_venta.mp_preference_id = preference_id
    db.commit()
    db.refresh(db_venta)

    logger.info("Preferencia MP creada — venta={} factura={} preference={}", db_venta.id, factura_nro, preference_id)
    return PreferenciaOut(init_point=init_point, venta_id=db_venta.id, numero_factura=factura_nro)


@router.post("/webhook", status_code=status.HTTP_200_OK)
async def webhook_mercadopago(
    request: Request,
    background_tasks: BackgroundTasks,
):
    """Recibe notificaciones de pago de MercadoPago."""
    body = await request.body()

    try:
        data = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Body inválido")

    if data.get("type") != "payment":
        return {"status": "ignored"}

    payment_id = str(data.get("data", {}).get("id", ""))
    if not payment_id:
        return {"status": "ignored"}

    # FIX: si MP_WEBHOOK_SECRET está configurado, la firma es OBLIGATORIA
    if MP_WEBHOOK_SECRET:
        signature_header = request.headers.get("x-signature", "")
        request_id = request.headers.get("x-request-id", "")
        if not signature_header:
            logger.warning("MP webhook: request sin x-signature rechazado (payment {})", payment_id)
            raise HTTPException(status_code=401, detail="Firma requerida")
        if not _verificar_firma_mp(body, signature_header, request_id, payment_id):
            logger.warning("MP webhook: firma inválida para payment {}", payment_id)
            raise HTTPException(status_code=401, detail="Firma inválida")

    # FIX: _procesar_pago crea su propia sesión — no depende de la del request
    background_tasks.add_task(_procesar_pago, payment_id)
    return {"status": "ok"}
