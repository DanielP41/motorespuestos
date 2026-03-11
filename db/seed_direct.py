"""seed_direct.py - Seed database directly via psycopg2. Run: python db/seed_direct.py"""
import psycopg2
from psycopg2.extras import execute_values

conn = psycopg2.connect(
    host="localhost", port=5432,
    dbname="moto_repuestos", user="moto_user", password="moto_pass_2026"
)
conn.autocommit = False
cur = conn.cursor()

print("[1/4] Inserting categories...")
cats = [
    ("Motor","motor"),("Transmision","transmision"),("Frenos","frenos"),
    ("Suspension","suspension"),("Electrico","electrico"),
    ("Carroceria","carroceria"),("Lubricantes","lubricantes"),("Filtros","filtros")
]
execute_values(cur,
    "INSERT INTO categoria (nombre, slug, activa) VALUES %s ON CONFLICT (slug) DO NOTHING",
    [(n, s, True) for n, s in cats])
conn.commit()

# Get category IDs
cur.execute("SELECT nombre, id FROM categoria")
cat_ids = {r[0]: r[1] for r in cur.fetchall()}
print(f"  Categories: {cat_ids}")

print("[2/4] Inserting units...")
units = [("UND","Unidad"),("PAR","Par"),("LT","Litro"),("JGO","Juego")]
execute_values(cur,
    "INSERT INTO unidad_medida (codigo, nombre) VALUES %s ON CONFLICT (codigo) DO NOTHING",
    units)
conn.commit()

cur.execute("SELECT codigo, id FROM unidad_medida")
uid = {r[0]: r[1] for r in cur.fetchall()}
print(f"  Units: {uid}")

def c(n): return cat_ids.get(n, list(cat_ids.values())[0])
def u(k): return uid.get(k, list(uid.values())[0])

print("[3/4] Inserting products...")
products = [
    ("P-CB125-STD","Piston STD Honda CB 125F",c("Motor"),u("UND"),45000,85000,75000,12,3,True),
    ("P-CG150-STD","Piston STD Honda CG 150",c("Motor"),u("UND"),52000,95000,85000,8,2,True),
    ("P-NS200-STD","Piston STD Bajaj NS 200",c("Motor"),u("UND"),65000,120000,108000,5,2,True),
    ("ANI-CB125","Juego Anillos Honda CB 125F",c("Motor"),u("JGO"),18000,38000,33000,20,5,True),
    ("CIL-CG150","Cilindro Honda CG 150",c("Motor"),u("UND"),120000,220000,195000,4,1,True),
    ("EMP-CUL-CG","Empaque Culata Honda CG 150",c("Motor"),u("UND"),22000,45000,39000,25,5,True),
    ("EMP-CUL-190","Empaque Culata Honda CB 190R",c("Motor"),u("UND"),28000,58000,50000,10,3,True),
    ("CAD-428-130","Cadena 428 x 130 Eslabones",c("Transmision"),u("UND"),35000,65000,58000,22,5,False),
    ("CAD-520-MX","Kit Transmision 520 MX",c("Transmision"),u("JGO"),98000,189000,165000,8,2,False),
    ("PIN-DEL-190","Pinon Delantero Honda CB 190 14T",c("Transmision"),u("UND"),12000,22000,19000,30,8,False),
    ("COR-CG150","Corona 37T Honda CG 150",c("Transmision"),u("UND"),28000,52000,46000,15,4,False),
    ("KIT-CAD-YBR","Kit Cadena Yamaha YBR 125",c("Transmision"),u("JGO"),75000,142000,125000,6,2,True),
    ("DIS-EMB-NS","Juego Discos Embrague Bajaj NS200",c("Transmision"),u("JGO"),68000,125000,110000,7,2,True),
    ("CAB-EMB-CG","Cable Embrague Honda CG 150",c("Transmision"),u("UND"),10000,18500,16000,35,8,False),
    ("PAS-DEL-190","Pastillas Freno Delantero CB 190R",c("Frenos"),u("PAR"),28000,55000,48000,18,4,False),
    ("PAS-CB125","Pastillas Freno Honda CB 125F",c("Frenos"),u("PAR"),18000,35000,30000,25,6,False),
    ("DSC-DEL-190","Disco Freno Delantero CB 190R",c("Frenos"),u("UND"),55000,105000,92000,6,2,False),
    ("DSC-MT03","Disco Freno Delantero Yamaha MT03",c("Frenos"),u("UND"),62000,118000,104000,4,1,False),
    ("BOB-CB125","Bobina Encendido Honda CB 125F",c("Electrico"),u("UND"),32000,62000,55000,9,2,True),
    ("REC-CG150","Rectificador Regulador CG 150",c("Electrico"),u("UND"),28000,55000,48000,11,3,False),
    ("BAT-YTX7","Bateria YTX7A-BS 12V 6Ah",c("Electrico"),u("UND"),55000,98000,85000,14,3,False),
    ("FOC-LED-H4","Foco LED H4 Universal 35W",c("Electrico"),u("UND"),18000,35000,30000,40,10,False),
    ("ACE-10W40","Aceite Motor 4T 10W-40 1L",c("Lubricantes"),u("LT"),12000,22000,19000,60,15,False),
    ("ACE-20W50","Aceite Motor 4T 20W-50 1L",c("Lubricantes"),u("LT"),15000,28000,24000,50,12,False),
    ("GRA-CAD-SP","Grasa de Cadena Spray 400ml",c("Lubricantes"),u("UND"),18000,32000,28000,30,8,False),
    ("FIL-ACE-125","Filtro de Aceite Honda CB 125F",c("Filtros"),u("UND"),8000,15000,13000,45,10,True),
    ("FIL-ACE-150","Filtro de Aceite Honda CG 150",c("Filtros"),u("UND"),9000,17000,15000,38,10,True),
    ("FIL-AIR-125","Filtro de Aire Honda CB 125F",c("Filtros"),u("UND"),12000,22000,19000,28,6,False),
    ("FIL-AIR-200","Filtro de Aire Bajaj NS 200",c("Filtros"),u("UND"),14000,26000,22000,20,5,True),
    ("KIT-FIL-190","Kit Filtros Honda CB 190R",c("Filtros"),u("JGO"),28000,52000,46000,12,3,False),
    ("ESC-CB125L","Espadin Izq Honda CB 125",c("Carroceria"),u("UND"),35000,65000,58000,7,2,False),
    ("FAR-CG150","Faro Delantero Honda CG 150",c("Carroceria"),u("UND"),45000,88000,78000,5,1,False),
    ("MAL-38L","Maleta Trasera Moto 38 Litros",c("Carroceria"),u("UND"),85000,159000,140000,8,2,False),
]

execute_values(cur, """
    INSERT INTO repuesto (sku, nombre, categoria_id, unidad_medida_id,
        precio_compra, precio_venta, precio_venta_min, stock_actual, stock_minimo, es_original, estado)
    VALUES %s ON CONFLICT (sku) DO NOTHING
""", [(r[0],r[1],r[2],r[3],r[4],r[5],r[6],r[7],r[8],r[9],'activo') for r in products])
conn.commit()

cur.execute("SELECT count(*) FROM repuesto")
rep_count = cur.fetchone()[0]
print(f"  Products in DB: {rep_count}")

print("[4/4] Verifying clients...")
cur.execute("SELECT count(*) FROM cliente")
cli_count = cur.fetchone()[0]
print(f"  Clients in DB: {cli_count}")

cur.close()
conn.close()
print(f"\n{'='*40}")
print(f"  SEED DIRECT COMPLETE!")
print(f"  Repuestos: {rep_count}")
print(f"  Clientes:  {cli_count}")
print(f"{'='*40}")
