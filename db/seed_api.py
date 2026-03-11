"""seed_api.py - Load test data via REST API. Run: python db/seed_api.py"""
import urllib.request, urllib.parse, json, sys

BASE = "http://localhost:8001"

def post(path, data, token=None):
    url = f"{BASE}{path}"
    body = json.dumps(data).encode("utf-8")
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return json.loads(r.read())
    except Exception as e:
        return None

def get(path, token=None):
    url = f"{BASE}{path}"
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return json.loads(r.read())
    except:
        return []

# 1. Auth
print("[1/5] Getting admin token...")
try:
    form = b"username=admin&password=admin123"
    req = urllib.request.Request(f"{BASE}/auth/token", data=form,
        headers={"Content-Type": "application/x-www-form-urlencoded"}, method="POST")
    with urllib.request.urlopen(req, timeout=10) as r:
        tok = json.loads(r.read())["access_token"]
    print("  OK")
except Exception as e:
    print(f"  ERROR: {e}"); sys.exit(1)

# 2. Categories
print("[2/5] Creating categories...")
cats_raw = [("Motor","motor"),("Transmision","transmision"),("Frenos","frenos"),
            ("Suspension","suspension"),("Electrico","electrico"),("Carroceria","carroceria"),
            ("Lubricantes","lubricantes"),("Filtros","filtros")]
cat_ids = {}
for nombre, slug in cats_raw:
    r = post("/categorias/", {"nombre": nombre, "slug": slug, "activa": True}, tok)
    if r and "id" in r:
        cat_ids[nombre] = r["id"]
        print(f"  OK {nombre} -> {r['id']}")
    else:
        print(f"  SKIP {nombre}")

for c in get("/categorias/", tok):
    cat_ids[c["nombre"]] = c["id"]
    simple = (c["nombre"].replace("\u00f3","o").replace("\u00e9","e")
              .replace("\u00fa","u").replace("\u00e1","a").replace("\u00ed","i")
              .replace("\u00f1","n"))
    cat_ids[simple] = c["id"]

def cid(n): return cat_ids.get(n, 1)

# 3. Units
print("[3/5] Creating units...")
unit_ids = {}
for u in [{"codigo":"UND","nombre":"Unidad"},{"codigo":"PAR","nombre":"Par"},
          {"codigo":"LT","nombre":"Litro"},{"codigo":"JGO","nombre":"Juego"}]:
    r = post("/unidades/", u, tok)
    if r and "id" in r:
        unit_ids[u["codigo"]] = r["id"]
        print(f"  OK {u['codigo']} -> {r['id']}")
    else:
        print(f"  SKIP {u['codigo']}")
for u in get("/unidades/", tok):
    unit_ids[u["codigo"]] = u["id"]

def uid(c): return unit_ids.get(c, 1)

# 4. Products
print("[4/5] Creating products...")
products = [
    # Motor
    {"sku":"P-CB125-STD","nombre":"Piston STD Honda CB 125F","categoria_id":cid("Motor"),"unidad_medida_id":uid("UND"),"precio_compra":45000,"precio_venta":85000,"precio_venta_min":75000,"stock_actual":12,"stock_minimo":3,"es_original":True},
    {"sku":"P-CG150-STD","nombre":"Piston STD Honda CG 150","categoria_id":cid("Motor"),"unidad_medida_id":uid("UND"),"precio_compra":52000,"precio_venta":95000,"precio_venta_min":85000,"stock_actual":8,"stock_minimo":2,"es_original":True},
    {"sku":"P-NS200-STD","nombre":"Piston STD Bajaj NS 200","categoria_id":cid("Motor"),"unidad_medida_id":uid("UND"),"precio_compra":65000,"precio_venta":120000,"precio_venta_min":108000,"stock_actual":5,"stock_minimo":2,"es_original":True},
    {"sku":"ANI-CB125","nombre":"Juego Anillos Honda CB 125F","categoria_id":cid("Motor"),"unidad_medida_id":uid("JGO"),"precio_compra":18000,"precio_venta":38000,"precio_venta_min":33000,"stock_actual":20,"stock_minimo":5,"es_original":True},
    {"sku":"CIL-CG150","nombre":"Cilindro Honda CG 150","categoria_id":cid("Motor"),"unidad_medida_id":uid("UND"),"precio_compra":120000,"precio_venta":220000,"precio_venta_min":195000,"stock_actual":4,"stock_minimo":1,"es_original":True},
    {"sku":"EMP-CUL-CG","nombre":"Empaque Culata Honda CG 150","categoria_id":cid("Motor"),"unidad_medida_id":uid("UND"),"precio_compra":22000,"precio_venta":45000,"precio_venta_min":39000,"stock_actual":25,"stock_minimo":5,"es_original":True},
    {"sku":"EMP-CUL-190","nombre":"Empaque Culata Honda CB 190R","categoria_id":cid("Motor"),"unidad_medida_id":uid("UND"),"precio_compra":28000,"precio_venta":58000,"precio_venta_min":50000,"stock_actual":10,"stock_minimo":3,"es_original":True},
    # Transmision
    {"sku":"CAD-428-130","nombre":"Cadena 428 x 130 Eslabones","categoria_id":cid("Transmision"),"unidad_medida_id":uid("UND"),"precio_compra":35000,"precio_venta":65000,"precio_venta_min":58000,"stock_actual":22,"stock_minimo":5,"es_original":False},
    {"sku":"CAD-520-MX","nombre":"Kit Transmision 520 MX","categoria_id":cid("Transmision"),"unidad_medida_id":uid("JGO"),"precio_compra":98000,"precio_venta":189000,"precio_venta_min":165000,"stock_actual":8,"stock_minimo":2,"es_original":False},
    {"sku":"PIN-DEL-190","nombre":"Pinon Delantero Honda CB 190 14T","categoria_id":cid("Transmision"),"unidad_medida_id":uid("UND"),"precio_compra":12000,"precio_venta":22000,"precio_venta_min":19000,"stock_actual":30,"stock_minimo":8,"es_original":False},
    {"sku":"COR-CG150","nombre":"Corona 37T Honda CG 150","categoria_id":cid("Transmision"),"unidad_medida_id":uid("UND"),"precio_compra":28000,"precio_venta":52000,"precio_venta_min":46000,"stock_actual":15,"stock_minimo":4,"es_original":False},
    {"sku":"KIT-CAD-YBR","nombre":"Kit Cadena Yamaha YBR 125","categoria_id":cid("Transmision"),"unidad_medida_id":uid("JGO"),"precio_compra":75000,"precio_venta":142000,"precio_venta_min":125000,"stock_actual":6,"stock_minimo":2,"es_original":True},
    {"sku":"DIS-EMB-NS","nombre":"Juego Discos Embrague Bajaj NS200","categoria_id":cid("Transmision"),"unidad_medida_id":uid("JGO"),"precio_compra":68000,"precio_venta":125000,"precio_venta_min":110000,"stock_actual":7,"stock_minimo":2,"es_original":True},
    {"sku":"CAB-EMB-CG","nombre":"Cable Embrague Honda CG 150","categoria_id":cid("Transmision"),"unidad_medida_id":uid("UND"),"precio_compra":10000,"precio_venta":18500,"precio_venta_min":16000,"stock_actual":35,"stock_minimo":8,"es_original":False},
    # Frenos
    {"sku":"PAS-DEL-190","nombre":"Pastillas Freno Delantero CB 190R","categoria_id":cid("Frenos"),"unidad_medida_id":uid("PAR"),"precio_compra":28000,"precio_venta":55000,"precio_venta_min":48000,"stock_actual":18,"stock_minimo":4,"es_original":False},
    {"sku":"PAS-CB125","nombre":"Pastillas Freno Honda CB 125F","categoria_id":cid("Frenos"),"unidad_medida_id":uid("PAR"),"precio_compra":18000,"precio_venta":35000,"precio_venta_min":30000,"stock_actual":25,"stock_minimo":6,"es_original":False},
    {"sku":"DSC-DEL-190","nombre":"Disco Freno Delantero CB 190R","categoria_id":cid("Frenos"),"unidad_medida_id":uid("UND"),"precio_compra":55000,"precio_venta":105000,"precio_venta_min":92000,"stock_actual":6,"stock_minimo":2,"es_original":False},
    {"sku":"DSC-MT03","nombre":"Disco Freno Delantero Yamaha MT03","categoria_id":cid("Frenos"),"unidad_medida_id":uid("UND"),"precio_compra":62000,"precio_venta":118000,"precio_venta_min":104000,"stock_actual":4,"stock_minimo":1,"es_original":False},
    # Electrico
    {"sku":"BOB-CB125","nombre":"Bobina Encendido Honda CB 125F","categoria_id":cid("Electrico"),"unidad_medida_id":uid("UND"),"precio_compra":32000,"precio_venta":62000,"precio_venta_min":55000,"stock_actual":9,"stock_minimo":2,"es_original":True},
    {"sku":"REC-CG150","nombre":"Rectificador Regulador CG 150","categoria_id":cid("Electrico"),"unidad_medida_id":uid("UND"),"precio_compra":28000,"precio_venta":55000,"precio_venta_min":48000,"stock_actual":11,"stock_minimo":3,"es_original":False},
    {"sku":"BAT-YTX7","nombre":"Bateria YTX7A-BS 12V 6Ah","categoria_id":cid("Electrico"),"unidad_medida_id":uid("UND"),"precio_compra":55000,"precio_venta":98000,"precio_venta_min":85000,"stock_actual":14,"stock_minimo":3,"es_original":False},
    {"sku":"FOC-LED-H4","nombre":"Foco LED H4 Universal 35W","categoria_id":cid("Electrico"),"unidad_medida_id":uid("UND"),"precio_compra":18000,"precio_venta":35000,"precio_venta_min":30000,"stock_actual":40,"stock_minimo":10,"es_original":False},
    # Lubricantes
    {"sku":"ACE-10W40","nombre":"Aceite Motor 4T 10W-40 1L","categoria_id":cid("Lubricantes"),"unidad_medida_id":uid("LT"),"precio_compra":12000,"precio_venta":22000,"precio_venta_min":19000,"stock_actual":60,"stock_minimo":15,"es_original":False},
    {"sku":"ACE-20W50","nombre":"Aceite Motor 4T 20W-50 1L","categoria_id":cid("Lubricantes"),"unidad_medida_id":uid("LT"),"precio_compra":15000,"precio_venta":28000,"precio_venta_min":24000,"stock_actual":50,"stock_minimo":12,"es_original":False},
    {"sku":"GRA-CAD-SP","nombre":"Grasa de Cadena Spray 400ml","categoria_id":cid("Lubricantes"),"unidad_medida_id":uid("UND"),"precio_compra":18000,"precio_venta":32000,"precio_venta_min":28000,"stock_actual":30,"stock_minimo":8,"es_original":False},
    # Filtros
    {"sku":"FIL-ACE-125","nombre":"Filtro de Aceite Honda CB 125F","categoria_id":cid("Filtros"),"unidad_medida_id":uid("UND"),"precio_compra":8000,"precio_venta":15000,"precio_venta_min":13000,"stock_actual":45,"stock_minimo":10,"es_original":True},
    {"sku":"FIL-ACE-150","nombre":"Filtro de Aceite Honda CG 150","categoria_id":cid("Filtros"),"unidad_medida_id":uid("UND"),"precio_compra":9000,"precio_venta":17000,"precio_venta_min":15000,"stock_actual":38,"stock_minimo":10,"es_original":True},
    {"sku":"FIL-AIR-125","nombre":"Filtro de Aire Honda CB 125F","categoria_id":cid("Filtros"),"unidad_medida_id":uid("UND"),"precio_compra":12000,"precio_venta":22000,"precio_venta_min":19000,"stock_actual":28,"stock_minimo":6,"es_original":False},
    {"sku":"FIL-AIR-200","nombre":"Filtro de Aire Bajaj NS 200","categoria_id":cid("Filtros"),"unidad_medida_id":uid("UND"),"precio_compra":14000,"precio_venta":26000,"precio_venta_min":22000,"stock_actual":20,"stock_minimo":5,"es_original":True},
    {"sku":"KIT-FIL-190","nombre":"Kit Filtros Honda CB 190R","categoria_id":cid("Filtros"),"unidad_medida_id":uid("JGO"),"precio_compra":28000,"precio_venta":52000,"precio_venta_min":46000,"stock_actual":12,"stock_minimo":3,"es_original":False},
    # Carroceria
    {"sku":"ESC-CB125L","nombre":"Espadin Izq Honda CB 125","categoria_id":cid("Carroceria"),"unidad_medida_id":uid("UND"),"precio_compra":35000,"precio_venta":65000,"precio_venta_min":58000,"stock_actual":7,"stock_minimo":2,"es_original":False},
    {"sku":"FAR-CG150","nombre":"Faro Delantero Honda CG 150","categoria_id":cid("Carroceria"),"unidad_medida_id":uid("UND"),"precio_compra":45000,"precio_venta":88000,"precio_venta_min":78000,"stock_actual":5,"stock_minimo":1,"es_original":False},
    {"sku":"MAL-38L","nombre":"Maleta Trasera Moto 38 Litros","categoria_id":cid("Carroceria"),"unidad_medida_id":uid("UND"),"precio_compra":85000,"precio_venta":159000,"precio_venta_min":140000,"stock_actual":8,"stock_minimo":2,"es_original":False},
]

ok, skip = 0, 0
for p in products:
    r = post("/repuestos/", p, tok)
    if r and "id" in r:
        print(f"  OK {p['sku']}"); ok += 1
    else:
        print(f"  SKIP {p['sku']}"); skip += 1
print(f"  -> {ok} created, {skip} skipped")

# 5. Clients
print("[5/5] Creating test clients...")
clients = [
    {"tipo":"N","documento_tipo":"CC","documento_nro":"10245678","nombre":"Carlos Andres Mendez","telefono":"3012345678","email":"carlos.mendez@email.com","password":"prueba123","credito_habilitado":False},
    {"tipo":"N","documento_tipo":"CC","documento_nro":"52987654","nombre":"Maria Fernanda Lopez","telefono":"3109876543","email":"mariafe@gmail.com","password":"prueba123","credito_habilitado":True},
    {"tipo":"J","documento_tipo":"NIT","documento_nro":"900123456-7","nombre":"Taller Moto Express SAS","telefono":"6011234567","email":"compras@motoexpress.com","password":"prueba123","credito_habilitado":True},
    {"tipo":"N","documento_tipo":"CC","documento_nro":"71654321","nombre":"Andres Felipe Gomez","telefono":"3187654321","email":"andres.gomez@hotmail.com","password":"prueba123","credito_habilitado":False},
    {"tipo":"J","documento_tipo":"NIT","documento_nro":"830456789-1","nombre":"Distribuidora Moto Partes","telefono":"6044561234","email":"ventas@motopartes.co","password":"prueba123","credito_habilitado":True},
]
for c in clients:
    r = post("/clientes/", c, tok)
    if r and "id" in r:
        print(f"  OK {c['nombre']}")
    else:
        print(f"  SKIP {c['nombre']}")

reps = get("/repuestos/?limit=200")
clts = get("/clientes/", tok)
print(f"\n{'='*40}")
print(f"  SEED COMPLETE!")
print(f"  Repuestos in DB: {len(reps)}")
print(f"  Clientes in DB:  {len(clts)}")
print(f"{'='*40}")
