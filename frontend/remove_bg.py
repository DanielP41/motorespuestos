from PIL import Image
import numpy as np

src = r'C:\Users\Dell\.gemini\antigravity\brain\21751575-0e5f-47af-b102-a8db7cfa9940\uploaded_image_1772652136422.jpg'
dst = r'C:\Users\Dell\.gemini\antigravity\scratch\motorespuestos-master\frontend\src\assets\logo.png'

img = Image.open(src).convert('RGBA')
data = np.array(img)

r, g, b = data[...,0], data[...,1], data[...,2]
# Quitar fondo blanco y gris claro (checkerboard)
mask = (r > 200) & (g > 200) & (b > 200)
data[mask, 3] = 0

Image.fromarray(data).save(dst, 'PNG')
print('OK - logo.png guardado con fondo transparente')
