from PIL import Image, ImageDraw
import os
os.makedirs('src/assets', exist_ok=True)
os.makedirs('public/assets', exist_ok=True)
W, H = 2000, 700
im = Image.new('RGBA', (W,H), (5,5,5,255))
d = ImageDraw.Draw(im)
# gradient
for i in range(H):
    alpha = int(20 + (i/H)*60)
    d.line([(0,i),(W,i)], fill=(10,10,10,alpha))
# draw candlesticks on right half
import random
x = W-900
for i in range(20):
    w = 18
    x += 30
    top = random.randint(150, 320)
    bottom = random.randint(360, 520)
    # body
    d.rectangle([x-w, top, x+w, bottom], fill=(255,255,255,230))
    # wick
    d.line([(x, top-30),(x, bottom+30)], fill=(255,255,255,200), width=3)
# draw subtle circuit lines left
for y in range(80, H-80, 40):
    d.line([(50,y),(W-1100,y)], fill=(255,255,255,80), width=6)
# save
im.save('src/assets/vincorp_banner_bg.png')
im.save('public/assets/vincorp_banner_bg.png')
print('banner created')
