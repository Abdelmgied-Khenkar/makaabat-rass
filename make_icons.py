# Root : لفظ المعماري 2026-10-10 «on android and apple if possible to my kids» — أيقونات التثبيت بلا حزم (zlib فقط)
import zlib, struct
def png(path, n):
    bg=(0xf6,0xef,0xe4); cols=[(0xe3,0x8b,0x6d),(0xe9,0xb9,0x49),(0x8c,0xbf,0x7a),(0x6f,0xa9,0xc9)]
    grid=[[0,1,None],[2,3,0],[None,1,2]]  # قطع ملونة على خلفية دافية
    pad=n*0.18; cell=(n-2*pad)/3; gap=cell*0.08
    rows=[]
    for y in range(n):
        row=bytearray([0])
        for x in range(n):
            px=bg
            gx=int((x-pad)//cell); gy=int((y-pad)//cell)
            if 0<=gx<3 and 0<=gy<3 and x>=pad and y>=pad:
                lx=(x-pad)-gx*cell; ly=(y-pad)-gy*cell
                k=grid[gy][gx]
                if k is not None and gap<lx<cell-gap and gap<ly<cell-gap: px=cols[k]
            row+=bytes(px)
        rows.append(bytes(row))
    raw=b''.join(rows)
    def chunk(t,d): return struct.pack('>I',len(d))+t+d+struct.pack('>I',zlib.crc32(t+d)&0xffffffff)
    data=b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',n,n,8,2,0,0,0))+chunk(b'IDAT',zlib.compress(raw,9))+chunk(b'IEND',b'')
    open(path,'wb').write(data)
for name,n in [('icon-192.png',192),('icon-512.png',512),('apple-touch-icon.png',180)]: png(name,n)
