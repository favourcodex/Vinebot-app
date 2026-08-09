import os, zlib, struct
os.makedirs('src/assets', exist_ok=True)
os.makedirs('public/assets', exist_ok=True)
W=1600; H=600
pixels = bytearray()
for y in range(H):
    row = bytearray()
    for x in range(W):
        # base dark
        r=g=b=10
        a=255
        # draw simple candlesticks on right
        if x>W-700 and (x%40)<18:
            # vertical bar
            if 150 < y < 450 and ((x//40)%2==0):
                r=g=b=255
        # faint horizontal circuit lines on left
        if x<500 and y%40==20:
            r=g=b=60
            a=60
        row += bytes((r,g,b,a))
    pixels.extend(b'\x00'+row)
png = b'\x89PNG\r\n\x1a\n'
def chunk(t,d):
    return struct.pack('!I', len(d))+t+d+struct.pack('!I', zlib.crc32(t+d)&0xffffffff)
ihdr=struct.pack('!IIBBBBB', W, H, 8, 6, 0, 0, 0)
png += chunk(b'IHDR', ihdr)
png += chunk(b'IDAT', zlib.compress(pixels,9))
png += chunk(b'IEND', b'')
for path in ['src/assets/vincorp_banner_bg.png','public/assets/vincorp_banner_bg.png']:
    with open(path,'wb') as f:
        f.write(png)
print('banner written')
