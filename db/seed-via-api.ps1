# seed-via-api.ps1
# Carga datos de prueba usando la API REST del backend
# Uso: .\db\seed-via-api.ps1

$BASE = "http://localhost:8001"
$headers = @{ "Content-Type" = "application/json" }

# ── 1. Obtener token de admin ──────────────────────────────────
Write-Host "`n[1/5] Autenticando como admin..." -ForegroundColor Cyan
$tokenResp = Invoke-RestMethod -Uri "$BASE/auth/token" -Method POST `
    -ContentType "application/x-www-form-urlencoded" `
    -Body "username=admin&password=admin123"

$token = $tokenResp.access_token
$authHeaders = @{
    "Content-Type"  = "application/json"
    "Authorization" = "Bearer $token"
}
Write-Host "  ✓ Token obtenido" -ForegroundColor Green

# ── 2. Crear categorías raíz ───────────────────────────────────
Write-Host "`n[2/5] Creando categorías..." -ForegroundColor Cyan
$cats = @("Motor", "Transmisión", "Frenos", "Suspensión", "Eléctrico", "Carrocería", "Lubricantes", "Filtros")
$catIds = @{}
foreach ($c in $cats) {
    $slug = $c.ToLower() -replace '[áéíóú]', '' -replace '\s', '-'
    try {
        $res = Invoke-RestMethod -Uri "$BASE/categorias/" -Method POST -Headers $authHeaders `
            -Body (@{ nombre = $c; slug = $slug; activa = $true } | ConvertTo-Json)
        $catIds[$c] = $res.id
        Write-Host "  ✓ $c (id=$($res.id))" -ForegroundColor Green
    }
    catch {
        # Podría ya existir, obtener la lista
        Write-Host "  ~ $c ya existe" -ForegroundColor Yellow
    }
}

# Obtener IDs actuales de categorías
$catsExist = Invoke-RestMethod -Uri "$BASE/categorias/" -Method GET -Headers $authHeaders
foreach ($c in $catsExist) { $catIds[$c.nombre] = $c.id }

# ── 3. Crear unidades de medida ────────────────────────────────
Write-Host "`n[3/5] Creando unidades de medida..." -ForegroundColor Cyan
$unidades = @(
    @{codigo = "UND"; nombre = "Unidad" },
    @{codigo = "PAR"; nombre = "Par" },
    @{codigo = "LT"; nombre = "Litro" },
    @{codigo = "JGO"; nombre = "Juego" }
)
$unidadIds = @{}
foreach ($u in $unidades) {
    try {
        $res = Invoke-RestMethod -Uri "$BASE/unidades/" -Method POST -Headers $authHeaders `
            -Body ($u | ConvertTo-Json)
        $unidadIds[$u.codigo] = $res.id
        Write-Host "  ✓ $($u.codigo)" -ForegroundColor Green
    }
    catch {
        Write-Host "  ~ $($u.codigo) ya existe" -ForegroundColor Yellow
    }
}
$undsExist = Invoke-RestMethod -Uri "$BASE/unidades/" -Method GET -Headers $authHeaders
foreach ($u in $undsExist) { $unidadIds[$u.codigo] = $u.id }

# ── 4. Crear repuestos ─────────────────────────────────────────
Write-Host "`n[4/5] Creando repuestos..." -ForegroundColor Cyan

# Determinar IDs de categorías con fallback
$catMotor = if ($catIds["Motor"]) { $catIds["Motor"] }       else { 1 }
$catTrans = if ($catIds["Transmision"]) { $catIds["Transmision"] } else { 2 }
$catFreno = if ($catIds["Frenos"]) { $catIds["Frenos"] }      else { 3 }
$catElec = if ($catIds["Electrico"]) { $catIds["Electrico"] }   else { 5 }
$catCarr = if ($catIds["Carroceria"]) { $catIds["Carroceria"] }  else { 6 }
$catLub = if ($catIds["Lubricantes"]) { $catIds["Lubricantes"] } else { 7 }
$catFilt = if ($catIds["Filtros"]) { $catIds["Filtros"] }     else { 8 }

$undId = if ($unidadIds["UND"]) { $unidadIds["UND"] } else { 1 }
$ltrId = if ($unidadIds["LT"]) { $unidadIds["LT"] }  else { 3 }
$jgoId = if ($unidadIds["JGO"]) { $unidadIds["JGO"] } else { 4 }

$repuestos = @(
    @{sku = "P-CB125-STD"; nombre = "Pistón STD Honda CB 125F"; categoria_id = $catMotor; unidad_medida_id = $undId; precio_compra = 45000; precio_venta = 85000; precio_venta_min = 75000; stock_actual = 12; stock_minimo = 3 },
    @{sku = "P-CG150-STD"; nombre = "Pistón STD Honda CG 150"; categoria_id = $catMotor; unidad_medida_id = $undId; precio_compra = 52000; precio_venta = 95000; precio_venta_min = 85000; stock_actual = 8; stock_minimo = 2 },
    @{sku = "P-NS200-STD"; nombre = "Pistón STD Bajaj NS 200"; categoria_id = $catMotor; unidad_medida_id = $undId; precio_compra = 65000; precio_venta = 120000; precio_venta_min = 108000; stock_actual = 5; stock_minimo = 2 },
    @{sku = "ANI-CB125"; nombre = "Juego de Anillos Honda CB 125F"; categoria_id = $catMotor; unidad_medida_id = $jgoId; precio_compra = 18000; precio_venta = 38000; precio_venta_min = 33000; stock_actual = 20; stock_minimo = 5 },
    @{sku = "CIL-CG150"; nombre = "Cilindro Honda CG 150"; categoria_id = $catMotor; unidad_medida_id = $undId; precio_compra = 120000; precio_venta = 220000; precio_venta_min = 195000; stock_actual = 4; stock_minimo = 1 },
    @{sku = "EMP-CUL-CG150"; nombre = "Empaque Culata Honda CG 150"; categoria_id = $catMotor; unidad_medida_id = $undId; precio_compra = 22000; precio_venta = 45000; precio_venta_min = 39000; stock_actual = 25; stock_minimo = 5 },
    @{sku = "EMP-CUL-CB190"; nombre = "Empaque Culata Honda CB 190R"; categoria_id = $catMotor; unidad_medida_id = $undId; precio_compra = 28000; precio_venta = 58000; precio_venta_min = 50000; stock_actual = 10; stock_minimo = 3 },
    @{sku = "CAD-428-130"; nombre = "Cadena 428 x 130 Eslabones"; categoria_id = $catTrans; unidad_medida_id = $undId; precio_compra = 35000; precio_venta = 65000; precio_venta_min = 58000; stock_actual = 22; stock_minimo = 5 },
    @{sku = "CAD-520-MX"; nombre = "Kit Transmisión 520 MX"; categoria_id = $catTrans; unidad_medida_id = $jgoId; precio_compra = 98000; precio_venta = 189000; precio_venta_min = 165000; stock_actual = 8; stock_minimo = 2 },
    @{sku = "PIN-DEL-CB190"; nombre = "Piñón Delantero Honda CB 190 14T"; categoria_id = $catTrans; unidad_medida_id = $undId; precio_compra = 12000; precio_venta = 22000; precio_venta_min = 19000; stock_actual = 30; stock_minimo = 8 },
    @{sku = "COR-TRA-CG150"; nombre = "Corona 37T Honda CG 150"; categoria_id = $catTrans; unidad_medida_id = $undId; precio_compra = 28000; precio_venta = 52000; precio_venta_min = 46000; stock_actual = 15; stock_minimo = 4 },
    @{sku = "KIT-CAD-YBR"; nombre = "Kit Cadena Yamaha YBR 125"; categoria_id = $catTrans; unidad_medida_id = $jgoId; precio_compra = 75000; precio_venta = 142000; precio_venta_min = 125000; stock_actual = 6; stock_minimo = 2 },
    @{sku = "DIS-EMB-NS200"; nombre = "Juego Discos Embrague NS 200"; categoria_id = $catTrans; unidad_medida_id = $jgoId; precio_compra = 68000; precio_venta = 125000; precio_venta_min = 110000; stock_actual = 7; stock_minimo = 2 },
    @{sku = "CAB-EMB-CG150"; nombre = "Cable de Embrague Honda CG 150"; categoria_id = $catTrans; unidad_medida_id = $undId; precio_compra = 10000; precio_venta = 18500; precio_venta_min = 16000; stock_actual = 35; stock_minimo = 8 },
    @{sku = "PAS-DEL-CB190"; nombre = "Pastillas Freno Delantero CB 190R"; categoria_id = $catFreno; unidad_medida_id = $undId; precio_compra = 28000; precio_venta = 55000; precio_venta_min = 48000; stock_actual = 18; stock_minimo = 4 },
    @{sku = "PAS-CB125"; nombre = "Pastillas Freno Honda CB 125F"; categoria_id = $catFreno; unidad_medida_id = $undId; precio_compra = 18000; precio_venta = 35000; precio_venta_min = 30000; stock_actual = 25; stock_minimo = 6 },
    @{sku = "DSC-DEL-CB190"; nombre = "Disco Freno Delantero CB 190R"; categoria_id = $catFreno; unidad_medida_id = $undId; precio_compra = 55000; precio_venta = 105000; precio_venta_min = 92000; stock_actual = 6; stock_minimo = 2 },
    @{sku = "DSC-DEL-MT03"; nombre = "Disco Freno Delantero Yamaha MT-03"; categoria_id = $catFreno; unidad_medida_id = $undId; precio_compra = 62000; precio_venta = 118000; precio_venta_min = 104000; stock_actual = 4; stock_minimo = 1 },
    @{sku = "BOB-ENC-CB125"; nombre = "Bobina de Encendido CB 125F"; categoria_id = $catElec; unidad_medida_id = $undId; precio_compra = 32000; precio_venta = 62000; precio_venta_min = 55000; stock_actual = 9; stock_minimo = 2 },
    @{sku = "REC-REG-CG150"; nombre = "Rectificador Regulador CG 150"; categoria_id = $catElec; unidad_medida_id = $undId; precio_compra = 28000; precio_venta = 55000; precio_venta_min = 48000; stock_actual = 11; stock_minimo = 3 },
    @{sku = "BAT-YTX7"; nombre = "Batería YTX7A-BS 12V 6Ah"; categoria_id = $catElec; unidad_medida_id = $undId; precio_compra = 55000; precio_venta = 98000; precio_venta_min = 85000; stock_actual = 14; stock_minimo = 3 },
    @{sku = "FOC-LED-H4"; nombre = "Foco LED H4 Universal 35W"; categoria_id = $catElec; unidad_medida_id = $undId; precio_compra = 18000; precio_venta = 35000; precio_venta_min = 30000; stock_actual = 40; stock_minimo = 10 },
    @{sku = "ACE-4T-10W40"; nombre = "Aceite Motor 4T 10W-40 1L"; categoria_id = $catLub; unidad_medida_id = $ltrId; precio_compra = 12000; precio_venta = 22000; precio_venta_min = 19000; stock_actual = 60; stock_minimo = 15 },
    @{sku = "ACE-4T-20W50"; nombre = "Aceite Motor 4T 20W-50 1L"; categoria_id = $catLub; unidad_medida_id = $ltrId; precio_compra = 15000; precio_venta = 28000; precio_venta_min = 24000; stock_actual = 50; stock_minimo = 12 },
    @{sku = "GRA-CAD-400ML"; nombre = "Grasa de Cadena Spray 400ml"; categoria_id = $catLub; unidad_medida_id = $undId; precio_compra = 18000; precio_venta = 32000; precio_venta_min = 28000; stock_actual = 30; stock_minimo = 8 },
    @{sku = "FIL-ACE-CB125"; nombre = "Filtro de Aceite Honda CB 125F"; categoria_id = $catFilt; unidad_medida_id = $undId; precio_compra = 8000; precio_venta = 15000; precio_venta_min = 13000; stock_actual = 45; stock_minimo = 10 },
    @{sku = "FIL-ACE-CG150"; nombre = "Filtro de Aceite Honda CG 150"; categoria_id = $catFilt; unidad_medida_id = $undId; precio_compra = 9000; precio_venta = 17000; precio_venta_min = 15000; stock_actual = 38; stock_minimo = 10 },
    @{sku = "FIL-AIR-CB125"; nombre = "Filtro de Aire Honda CB 125F"; categoria_id = $catFilt; unidad_medida_id = $undId; precio_compra = 12000; precio_venta = 22000; precio_venta_min = 19000; stock_actual = 28; stock_minimo = 6 },
    @{sku = "FIL-AIR-NS200"; nombre = "Filtro de Aire Bajaj NS 200"; categoria_id = $catFilt; unidad_medida_id = $undId; precio_compra = 14000; precio_venta = 26000; precio_venta_min = 22000; stock_actual = 20; stock_minimo = 5 },
    @{sku = "FIL-COM-CB190"; nombre = "Kit Filtros Honda CB 190R"; categoria_id = $catFilt; unidad_medida_id = $jgoId; precio_compra = 28000; precio_venta = 52000; precio_venta_min = 46000; stock_actual = 12; stock_minimo = 3 },
    @{sku = "ESC-CB125-IZQ"; nombre = "Espadín Izquierdo Honda CB 125"; categoria_id = $catCarr; unidad_medida_id = $undId; precio_compra = 35000; precio_venta = 65000; precio_venta_min = 58000; stock_actual = 7; stock_minimo = 2 },
    @{sku = "FAR-CB150"; nombre = "Faro Delantero Honda CG 150"; categoria_id = $catCarr; unidad_medida_id = $undId; precio_compra = 45000; precio_venta = 88000; precio_venta_min = 78000; stock_actual = 5; stock_minimo = 1 },
    @{sku = "MAL-38L"; nombre = "Maleta Trasera Moto 38 Litros"; categoria_id = $catCarr; unidad_medida_id = $undId; precio_compra = 85000; precio_venta = 159000; precio_venta_min = 140000; stock_actual = 8; stock_minimo = 2 }
)

$created = 0; $skipped = 0
foreach ($r in $repuestos) {
    try {
        $body = $r | ConvertTo-Json
        Invoke-RestMethod -Uri "$BASE/repuestos/" -Method POST -Headers $authHeaders -Body $body | Out-Null
        Write-Host "  ✓ $($r.sku)" -ForegroundColor Green
        $created++
    }
    catch {
        Write-Host "  ~ $($r.sku) ya existe o error" -ForegroundColor Yellow
        $skipped++
    }
}
Write-Host "  Repuestos: $created creados, $skipped omitidos" -ForegroundColor Cyan

# ── 5. Crear clientes ─────────────────────────────────────────
Write-Host "`n[5/5] Creando clientes de prueba..." -ForegroundColor Cyan
$clientes = @(
    @{tipo = "N"; documento_tipo = "CC"; documento_nro = "10245678"; nombre = "Carlos Andrés Méndez"; telefono = "3012345678"; email = "carlos.mendez@email.com"; password = "prueba123"; credito_habilitado = $false },
    @{tipo = "N"; documento_tipo = "CC"; documento_nro = "52987654"; nombre = "María Fernanda López"; telefono = "3109876543"; email = "mariafe@gmail.com"; password = "prueba123"; credito_habilitado = $true },
    @{tipo = "J"; documento_tipo = "NIT"; documento_nro = "900123456-7"; nombre = "Taller Moto Express SAS"; telefono = "6011234567"; email = "compras@motoexpress.com"; password = "prueba123"; credito_habilitado = $true },
    @{tipo = "N"; documento_tipo = "CC"; documento_nro = "71654321"; nombre = "Andrés Felipe Gómez"; telefono = "3187654321"; email = "andres.gomez@hotmail.com"; password = "prueba123"; credito_habilitado = $false },
    @{tipo = "J"; documento_tipo = "NIT"; documento_nro = "830456789-1"; nombre = "Distribuidora Moto Partes"; telefono = "6044561234"; email = "ventas@motopartes.co"; password = "prueba123"; credito_habilitado = $true }
)

foreach ($c in $clientes) {
    try {
        Invoke-RestMethod -Uri "$BASE/clientes/" -Method POST -Headers $authHeaders -Body ($c | ConvertTo-Json) | Out-Null
        Write-Host "  ✓ $($c.nombre)" -ForegroundColor Green
    }
    catch {
        Write-Host "  ~ $($c.nombre) ya existe o error" -ForegroundColor Yellow
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Seed completado exitosamente! " -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

# Verificar totales
$reps = Invoke-RestMethod -Uri "$BASE/repuestos/?limit=200" -Method GET
$clts = Invoke-RestMethod -Uri "$BASE/clientes/" -Method GET -Headers $authHeaders
$repCount = $reps.Count
$cltCount = $clts.Count
Write-Host "  Repuestos en DB: $repCount"
Write-Host "  Clientes en DB:  $cltCount"

