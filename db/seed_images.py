import psycopg2
from psycopg2.extras import execute_values

def seed_images():
    conn = psycopg2.connect(
        host="localhost", port=5432,
        dbname="moto_repuestos", user="moto_user", password="moto_pass_2026"
    )
    cur = conn.cursor()

    # Image mapping based on category slugs or names
    # { 'substring_in_name_or_category': 'image_url' }
    img_map = {
        'Motor': '/products/piston_studio.png',
        'Piston': '/products/piston_studio.png',
        'Transmision': '/products/cadena_transmision.png',
        'Cadena': '/products/cadena_transmision.png',
        'Frenos': '/products/disco_freno.png',
        'Pastillas': '/products/pastillas_freno.png',
        'Disco': '/products/disco_freno.png',
        'Filtro': '/products/filtro_aire.png',
        'Lubricantes': '/products/aceite_motor.png',
        'Aceite': '/products/aceite_motor.png',
        'Electrico': '/products/piston_studio.png', # Fallback
        'Carroceria': '/products/piston_studio.png', # Fallback
        'Suspension': '/products/piston_studio.png', # Fallback
    }

    print("Fetching products and categories...")
    cur.execute("""
        SELECT r.id, r.nombre, r.sku, c.nombre as cat_nombre 
        FROM repuesto r 
        JOIN categoria c ON r.categoria_id = c.id
    """)
    products = cur.fetchall()

    image_inserts = []
    for pid, pnombre, psku, cnombre in products:
        # Determine image
        url = None
        # Check specific keywords first
        low_nombre = pnombre.lower()
        if 'pastillas' in low_nombre: url = img_map['Pastillas']
        elif 'disco' in low_nombre: url = img_map['Disco']
        elif 'cadena' in low_nombre: url = img_map['Cadena']
        elif 'aceite' in low_nombre: url = img_map['Aceite']
        elif 'piston' in low_nombre: url = img_map['Piston']
        elif 'filtro' in low_nombre: url = img_map['Filtro']
        
        # Fallback to category
        if not url:
            url = img_map.get(cnombre, '/products/piston_studio.png')
        
        image_inserts.append((pid, url, 0, True))

    print(f"Inserting {len(image_inserts)} image mappings...")
    # Clear existing images if any (to avoid duplicates)
    cur.execute("DELETE FROM repuesto_imagen")
    
    execute_values(cur,
        "INSERT INTO repuesto_imagen (repuesto_id, url, orden, es_principal) VALUES %s",
        image_inserts)

    conn.commit()
    cur.close()
    conn.close()
    print("Image seeding complete!")

if __name__ == "__main__":
    seed_images()
