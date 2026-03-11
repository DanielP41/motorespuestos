from PIL import Image
import os

# Paths
assets_dir = r'c:\Users\Dell\.gemini\antigravity\scratch\motorespuestos-master\frontend\src\assets'
src = os.path.join(assets_dir, 'logo-footer.png')
dst = os.path.join(assets_dir, 'logo_motos_final.png')

print(f"Opening {src}...")
img = Image.open(src).convert('RGBA')
datas = img.getdata()

newData = []
# Threshold for white removal
threshold = 240
for item in datas:
    if item[0] > threshold and item[1] > threshold and item[2] > threshold:
        newData.append((255, 255, 255, 0))
    else:
        newData.append(item)

img.putdata(newData)

# CROP TRANSPARENT BORDERS
bbox = img.getbbox()
if bbox:
    img = img.crop(bbox)
    print(f"Logo cropped to {bbox}")

# SAVE
img.save(dst, 'PNG')
print(f"OK - {dst} saved, transparent and cropped.")
