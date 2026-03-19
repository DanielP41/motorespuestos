#!/bin/bash
# deploy.sh — Actualiza y reinicia la app en el VPS
# Uso: ./deploy.sh

set -e  # aborta si cualquier comando falla

COMPOSE="docker compose -f docker-compose.prod.yml"
MAX_WAIT=60   # segundos máximos esperando al backend

echo "========================================"
echo " Moto Repuestos — Deploy"
echo "========================================"

# 1. Verificar que existe el .env
if [ ! -f .env ]; then
    echo "[ERROR] No se encontró el archivo .env"
    echo "        Copia .env.example a .env y completa los valores."
    exit 1
fi

# 2. Obtener últimos cambios del repo
echo ""
echo "[1/5] Obteniendo cambios del repositorio..."
git pull

# 3. Construir imágenes y levantar servicios
echo ""
echo "[2/5] Construyendo imágenes y levantando servicios..."
$COMPOSE up -d --build

# 4. Esperar a que el backend esté saludable (health check real)
echo ""
echo "[3/5] Esperando que el backend esté listo (máx ${MAX_WAIT}s)..."
elapsed=0
until $COMPOSE exec -T backend python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" > /dev/null 2>&1; do
    if [ $elapsed -ge $MAX_WAIT ]; then
        echo "[ERROR] El backend no respondió en ${MAX_WAIT}s."
        echo "        Revisá los logs: $COMPOSE logs backend"
        exit 1
    fi
    sleep 2
    elapsed=$((elapsed + 2))
    echo "  ...esperando (${elapsed}s)"
done
echo "  Backend OK"

# 5. Crear usuario admin inicial (idempotente: no falla si ya existe)
echo ""
echo "[4/5] Creando usuario admin inicial (si no existe)..."
$COMPOSE exec backend python -m app.scripts.create_admin

# 6. Mostrar estado y limpiar imágenes viejas
echo ""
echo "[5/5] Limpiando imágenes sin uso..."
docker image prune -f

echo ""
$COMPOSE ps

echo ""
echo "========================================"
echo " Deploy completado."
echo " Logs: $COMPOSE logs -f"
echo "========================================"
