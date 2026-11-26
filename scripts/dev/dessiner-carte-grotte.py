# Carte originale « Grotte des naufrageurs » (5.16), dessinée par programme avec une graine fixe : image identique à chaque génération.
# Usage : python3 scripts/dev/dessiner-carte-grotte.py assets/aventures/grotte-des-naufrageurs.webp
from PIL import Image,ImageDraw,ImageFilter
import random,math,sys
W,H,C=1200,880,40
R=random.Random(1724)  # graine fixe : image identique à chaque génération
im=Image.new('RGB',(W,H),(38,34,30));d=ImageDraw.Draw(im)
for _ in range(9000):
    x,y=R.randrange(W),R.randrange(H);g=R.randrange(-10,12);d.point((x,y),fill=(46+g,41+g,36+g))
def blob(cx,cy,rx,ry,n=28,jit=.16):
    pts=[]
    for i in range(n):
        a=2*math.pi*i/n;k=1+R.uniform(-jit,jit);pts.append((cx+math.cos(a)*rx*k,cy+math.sin(a)*ry*k))
    return pts
floor=(132,112,86);floor2=(118,99,75)
for poly in [blob(560,470,330,250),blob(170,190,130,110),blob(110,760,120,80),blob(260,700,150,90),blob(930,150,150,105),blob(760,230,120,80),blob(275,265,90,55)]:
    d.polygon(poly,fill=floor)
d.polygon(blob(560,470,280,200,jit=.1),fill=floor2)
# eau de la crique (droite)
water=(42,82,104)
d.polygon(blob(1010,560,230,260,jit=.12),fill=water)
d.polygon([(1200,330),(1200,880),(960,880),(1000,700)],fill=water)
for i in range(60):
    x,y=R.randrange(850,1200),R.randrange(330,880);d.line([(x,y),(x+R.randrange(10,26),y)],fill=(70,118,140),width=2)
# ponton
d.rectangle([780,520,960,560],fill=(104,74,48));
for x in range(784,960,16):d.line([(x,520),(x,560)],fill=(76,52,34),width=2)
# barque
d.ellipse([990,600,1110,650],fill=(92,64,42),outline=(60,40,26),width=3);d.line([(1000,625),(1100,625)],fill=(60,40,26),width=2)
# escalier vers la crypte (en haut à droite)
d.rectangle([880,60,1000,150],fill=(96,96,104))
for i,y in enumerate(range(64,150,12)):d.line([(884+i*3,y),(996-i*3,y)],fill=(70,70,78),width=3)
# cage (en haut à gauche)
d.rectangle([110,130,230,240],outline=(30,30,30),width=4)
for x in range(122,230,14):d.line([(x,130),(x,240)],fill=(40,40,40),width=3)
# caisses et tonneaux
for (x,y) in [(520,300),(560,300),(540,340),(640,320),(330,560),(370,580)]:
    d.rectangle([x,y,x+34,y+34],fill=(122,84,50),outline=(70,46,26),width=3);d.line([(x,y),(x+34,y+34)],fill=(70,46,26),width=2)
for (x,y) in [(700,420),(735,440),(300,350)]:
    d.ellipse([x,y,x+30,y+30],fill=(110,74,44),outline=(64,42,24),width=3);d.ellipse([x+8,y+8,x+22,y+22],outline=(64,42,24),width=2)
# feu de camp
d.ellipse([440,500,490,550],fill=(70,50,40));d.ellipse([452,512,478,538],fill=(232,140,52));d.ellipse([460,520,470,530],fill=(252,214,110))
# couchages
for (x,y) in [(390,430),(560,560),(610,470)]:d.rounded_rectangle([x,y,x+60,y+26],radius=8,fill=(92,104,78),outline=(60,70,50),width=2)
im=im.filter(ImageFilter.GaussianBlur(.6))
# Pas de quadrillage dessiné : Chroniques trace la grille (30 cases en largeur) par-dessus la carte.
im.save(sys.argv[1],'WEBP',quality=82)
print(im.size)
