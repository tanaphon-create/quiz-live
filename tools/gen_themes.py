import urllib.parse, math
def uri(svg):
    svg = ' '.join(svg.split())
    return "url(\"data:image/svg+xml," + urllib.parse.quote(svg, safe=" =:/;,'()-.") + "\")"
def tile(w, h, body): return f"<svg xmlns='http://www.w3.org/2000/svg' width='{w}' height='{h}' viewBox='0 0 {w} {h}'>{body}</svg>"
# ── shapes ──
def ghost(x,y,s,c,o=1,eye='#3A2E5C'):
    return (f"<g transform='translate({x} {y}) scale({s})' opacity='{o}'><path d='M-14 6 C-14 -12 -7 -18 0 -18 C7 -18 14 -12 14 6 L14 16 Q11 20 8 16 Q4 12 0 16 Q-4 20 -8 16 Q-11 12 -14 16 Z' fill='{c}' stroke='#C9B8FF' stroke-width='2.2'/>"
            f"<circle cx='-5' cy='-3' r='2.6' fill='{eye}'/><circle cx='5' cy='-3' r='2.6' fill='{eye}'/><ellipse cx='-9' cy='3' rx='3' ry='1.8' fill='#FF8FB1' opacity='.6'/><ellipse cx='9' cy='3' rx='3' ry='1.8' fill='#FF8FB1' opacity='.6'/></g>")
def star(x,y,r,c,o=1,rot=0):
    p=[]
    for i in range(10):
        rr = r if i%2==0 else r*.48; a = math.pi/5*i - math.pi/2
        p.append(f"{x+rr*math.cos(a):.1f},{y+rr*math.sin(a):.1f}")
    return f"<polygon points='{' '.join(p)}' fill='{c}' opacity='{o}' stroke-linejoin='round' transform='rotate({rot} {x} {y})'/>"
def heart(x,y,s,c,o=1,rot=0): return f"<path transform='translate({x} {y}) rotate({rot}) scale({s})' d='M0 6 C-8 0 -10 -6 -5 -9 C-2 -11 0 -9 0 -6 C0 -9 2 -11 5 -9 C10 -6 8 0 0 6 Z' fill='{c}' opacity='{o}'/>"
def dot(x,y,r,c,o=1): return f"<circle cx='{x}' cy='{y}' r='{r}' fill='{c}' opacity='{o}'/>"
def ring(x,y,r,c,w=2,o=1): return f"<circle cx='{x}' cy='{y}' r='{r}' fill='none' stroke='{c}' stroke-width='{w}' opacity='{o}'/>"
def sprinkle(x,y,rot,c): return f"<rect x='{x-6}' y='{y-2}' width='12' height='4' rx='2' fill='{c}' transform='rotate({rot} {x} {y})'/>"
def flower(x,y,s,c,mid='#FFD45E',o=1):
    pet=''.join(f"<ellipse cx='0' cy='-7' rx='4.5' ry='7' fill='{c}' transform='rotate({a})'/>" for a in range(0,360,72))
    return f"<g transform='translate({x} {y}) scale({s})' opacity='{o}'>{pet}<circle r='4' fill='{mid}'/></g>"
def leaf(x,y,rot,c,o=1): return f"<path transform='translate({x} {y}) rotate({rot})' d='M0 0 C6 -10 16 -10 20 0 C16 10 6 10 0 0 Z' fill='{c}' opacity='{o}'/>"
def cloud(x,y,s,c='#fff',o=1): return f"<g transform='translate({x} {y}) scale({s})' opacity='{o}' fill='{c}'><circle cx='-12' cy='4' r='9'/><circle cx='0' cy='-3' r='12'/><circle cx='13' cy='3' r='9'/><rect x='-21' y='3' width='43' height='10' rx='5'/></g>"
def fish(x,y,s,c,o=1,flip=1): return f"<g transform='translate({x} {y}) scale({s*flip} {s})' opacity='{o}'><ellipse cx='0' cy='0' rx='12' ry='8' fill='{c}'/><path d='M10 0 L20 -7 L20 7 Z' fill='{c}'/><circle cx='-5' cy='-2' r='1.8' fill='#2A3B5C'/></g>"
def planet(x,y,r,c,ringc,o=1): return f"<g opacity='{o}'><circle cx='{x}' cy='{y}' r='{r}' fill='{c}'/><ellipse cx='{x}' cy='{y}' rx='{r*1.75}' ry='{r*.45}' fill='none' stroke='{ringc}' stroke-width='3' transform='rotate(-18 {x} {y})'/></g>"
def berry(x,y,s,o=1): return (f"<g transform='translate({x} {y}) scale({s})' opacity='{o}'><path d='M0 12 C-11 4 -11 -6 -6 -8 C-3 -9 0 -8 0 -8 C0 -8 3 -9 6 -8 C11 -6 11 4 0 12 Z' fill='#FF6B8B'/>"
    f"<path d='M-6 -8 L-2 -12 L0 -9 L2 -12 L6 -8 Z' fill='#4CC38A'/><circle cx='-3' cy='-2' r='.9' fill='#FFE9A8'/><circle cx='3' cy='1' r='.9' fill='#FFE9A8'/><circle cx='0' cy='5' r='.9' fill='#FFE9A8'/></g>")
def orange(x,y,s,o=1): return f"<g transform='translate({x} {y}) scale({s})' opacity='{o}'><circle r='9' fill='#FFA94D'/><circle r='6.5' fill='#FFD08A'/><path d='M0 -6.5 V6.5 M-6.5 0 H6.5 M-4.6 -4.6 L4.6 4.6 M4.6 -4.6 L-4.6 4.6' stroke='#FFA94D' stroke-width='1.2'/></g>"
def bubble(x,y,r,o=1): return f"<g opacity='{o}'><circle cx='{x}' cy='{y}' r='{r}' fill='rgba(255,255,255,.35)' stroke='#fff' stroke-width='1.6'/><circle cx='{x-r*.35}' cy='{y-r*.35}' r='{r*.22}' fill='#fff'/></g>"
def squiggle(x,y,c,o=1): return f"<path d='M{x} {y} q5 -6 10 0 t10 0 t10 0' fill='none' stroke='{c}' stroke-width='2.4' stroke-linecap='round' opacity='{o}'/>"
def pumpkin(x,y,s,o=1): return f"<g transform='translate({x} {y}) scale({s})' opacity='{o}'><ellipse cx='-5' cy='0' rx='7' ry='8' fill='#FFA24C'/><ellipse cx='5' cy='0' rx='7' ry='8' fill='#FFA24C'/><ellipse cx='0' cy='0' rx='6' ry='8.5' fill='#FFB86B'/><rect x='-1.2' y='-12' width='2.4' height='5' rx='1' fill='#4CC38A'/></g>"
def moon(x,y,s,c,o=1): return f"<path transform='translate({x} {y}) scale({s})' d='M4 -10 A11 11 0 1 0 10 6 A8 8 0 1 1 4 -10 Z' fill='{c}' opacity='{o}'/>"

# ── ทหาร/สงคราม ──
def helmet(x,y,s,c='#7A8B4A',o=1): return (f"<g transform='translate({x} {y}) scale({s})' opacity='{o}'><path d='M-15 4 C-15 -11 -7 -17 0 -17 C7 -17 15 -11 15 4 Z' fill='{c}'/>"
    f"<rect x='-19' y='2' width='38' height='6' rx='3' fill='#5E6E36'/><path d='M-9 -9 L9 -9 M-11 -3 L11 -3 M-4 -15 L-4 2 M4 -15 L4 2' stroke='#5E6E36' stroke-width='1.3' opacity='.55'/></g>")
def roundel(x,y,r,o=1): return f"<g opacity='{o}'><circle cx='{x}' cy='{y}' r='{r}' fill='#6B7F3A'/>{star(x,y,r*.68,'#F6F1DE')}</g>"
def biplane(x,y,s,c='#8C6B3E',o=1): return (f"<g transform='translate({x} {y}) scale({s})' opacity='{o}'><rect x='-6' y='-14' width='12' height='28' rx='2' fill='{c}' transform='rotate(90)'/>"
    f"<rect x='-4' y='-20' width='8' height='40' rx='3' fill='#A4844E'/><rect x='-14' y='-6' width='6' height='12' rx='2' fill='#A4844E' transform='translate(28 0)'/>"
    f"<path d='M16 -7 L18 0 L16 7' stroke='#5E4A2A' stroke-width='2' fill='none'/><circle cx='-6' cy='0' r='2' fill='#F6F1DE'/></g>")
def flagpole(x,y,s,c='#C2410C',o=1): return f"<g transform='translate({x} {y}) scale({s})' opacity='{o}'><rect x='-1' y='-22' width='2' height='34' fill='#7A6440'/><path d='M1 -22 Q8 -25 16 -21 Q22 -18 26 -20 L26 -8 Q20 -6 15 -9 Q8 -12 1 -10 Z' fill='{c}'/><circle cx='0' cy='-23' r='2' fill='#D9B44A'/></g>"
def tank(x,y,s,o=1): return (f"<g transform='translate({x} {y}) scale({s})' opacity='{o}'><rect x='-18' y='0' width='36' height='10' rx='5' fill='#5E6E36'/>"
    f"<circle cx='-11' cy='5' r='3' fill='#8C9A5E'/><circle cx='0' cy='5' r='3' fill='#8C9A5E'/><circle cx='11' cy='5' r='3' fill='#8C9A5E'/>"
    f"<rect x='-15' y='-7' width='30' height='8' rx='3' fill='#7A8B4A'/><rect x='-7' y='-13' width='14' height='7' rx='3' fill='#7A8B4A'/><rect x='6' y='-11' width='16' height='3' rx='1.5' fill='#5E6E36'/></g>")
def mapline(x,y,o=1): return f"<g opacity='{o}'><path d='M{x} {y} q14 -16 30 -4 t30 -6' fill='none' stroke='#A4844E' stroke-width='2' stroke-dasharray='4 5' stroke-linecap='round'/><path d='M{x+56} {y-16} l8 8 M{x+64} {y-16} l-8 8' stroke='#C2410C' stroke-width='2.6' stroke-linecap='round'/></g>"

T = {}
# id: name, emoji, bg (base gradient), blobs(before), tile(after), accent, hi, swatch
T['ghost'] = dict(name='ผีน้อยพาสเทล', emoji='👻', accent='#6C4DFF', hi='#E8467A',
  bg='linear-gradient(160deg,#F4EFFF 0%,#FCEFF7 55%,#EAF6FF 100%)',
  blobs='radial-gradient(34vmax 26vmax at 8% 8%,rgba(255,143,177,.22),transparent 70%),radial-gradient(34vmax 26vmax at 95% 10%,rgba(139,108,255,.20),transparent 70%),radial-gradient(34vmax 28vmax at 90% 95%,rgba(79,179,255,.18),transparent 70%)',
  tile=tile(220,220, ghost(40,46,1.1,'#fff',.95)+ghost(160,150,.85,'#fff',.9)+star(150,40,7,'#FFC23D',.55)+star(60,170,5,'#FF8FB1',.6)+dot(110,100,3,'#B9A6FF',.6)+dot(200,90,2.5,'#FF8FB1',.6)+heart(100,190,.9,'#FF8FB1',.45,-12)), size=220)
T['candy'] = dict(name='ร้านขนมหวาน', emoji='🍭', accent='#E8467A', hi='#D6336C',
  bg='linear-gradient(160deg,#FFF0F6 0%,#FFF6EC 60%,#F3EDFF 100%)',
  blobs='radial-gradient(30vmax 24vmax at 10% 10%,rgba(255,111,145,.22),transparent 70%),radial-gradient(30vmax 24vmax at 92% 88%,rgba(255,194,61,.22),transparent 70%),radial-gradient(28vmax 22vmax at 90% 8%,rgba(167,139,250,.18),transparent 70%)',
  tile=tile(180,180, sprinkle(20,30,30,'#FF6F91')+sprinkle(70,18,-20,'#4FB3FF')+sprinkle(130,40,60,'#FFC23D')+sprinkle(160,100,-40,'#3DD6A8')+sprinkle(40,120,80,'#A78BFA')+sprinkle(100,150,10,'#FF9F43')+sprinkle(150,160,-70,'#FF6F91')+sprinkle(90,90,45,'#4FB3FF')
       + f"<g opacity='.85'><circle cx='50' cy='75' r='13' fill='#FFB4C8'/><circle cx='50' cy='75' r='5' fill='#FFF0F6'/></g>" + heart(140,130,1.1,'#FF8FB1',.6,10)), size=180)
T['ocean'] = dict(name='โลกใต้ทะเล', emoji='🐠', accent='#1C7ED6', hi='#E8467A',
  bg='linear-gradient(180deg,#E8F8FF 0%,#D6F1FB 55%,#CDEFF0 100%)',
  blobs='radial-gradient(40vmax 20vmax at 50% -5%,rgba(255,255,255,.9),transparent 70%),radial-gradient(30vmax 24vmax at 6% 90%,rgba(61,214,168,.22),transparent 70%),radial-gradient(30vmax 24vmax at 96% 70%,rgba(79,179,255,.22),transparent 70%)',
  tile=tile(240,240, bubble(30,40,9,.9)+bubble(48,22,5,.9)+bubble(190,120,11,.85)+bubble(206,98,5,.85)+bubble(110,200,7,.9)+fish(140,50,1.1,'#FFA94D',.75)+fish(60,140,.9,'#FF8FB1',.7,-1)+fish(200,200,.8,'#7C6CFF',.6)), size=240)
T['garden'] = dict(name='สวนดอกไม้', emoji='🌸', accent='#12B886', hi='#E8467A',
  bg='linear-gradient(160deg,#F0FFF6 0%,#FFFBEA 60%,#FFF0F5 100%)',
  blobs='radial-gradient(32vmax 26vmax at 8% 90%,rgba(61,214,168,.22),transparent 70%),radial-gradient(30vmax 24vmax at 92% 10%,rgba(255,143,177,.20),transparent 70%),radial-gradient(28vmax 22vmax at 90% 90%,rgba(255,212,94,.20),transparent 70%)',
  tile=tile(200,200, flower(36,40,1.1,'#FFB4C8',o=.85)+flower(150,70,.9,'#B9A6FF',o=.8)+flower(80,160,1,'#FFD08A','#FF8FB1',.85)+leaf(110,30,-30,'#8CE0B4',.7)+leaf(20,120,40,'#8CE0B4',.6)+leaf(170,170,-60,'#8CE0B4',.6)+dot(100,100,3,'#FFC23D',.6)+dot(180,20,2.5,'#FF8FB1',.6)), size=200)
T['sky'] = dict(name='ฟ้าใสสายรุ้ง', emoji='🌈', accent='#4263EB', hi='#E8467A',
  bg='linear-gradient(180deg,#DDF0FF 0%,#EEF7FF 55%,#FFF4F8 100%)',
  blobs='radial-gradient(70vmax 70vmax at 50% 125%,transparent 54%,rgba(255,111,145,.20) 55%,rgba(255,159,67,.20) 58%,rgba(255,212,94,.20) 61%,rgba(61,214,168,.20) 64%,rgba(79,179,255,.20) 67%,rgba(167,139,250,.20) 70%,transparent 71%),radial-gradient(26vmax 20vmax at 92% 8%,rgba(255,224,102,.45),transparent 70%)',
  tile=tile(260,220, cloud(50,50,1.3)+cloud(190,140,1.05)+cloud(110,200,.8,o=.9)+star(200,40,5,'#FFD45E',.7)+heart(30,150,.8,'#FF8FB1',.5)), size=260)
T['space'] = dict(name='อวกาศพาสเทล', emoji='🪐', accent='#7048E8', hi='#E8467A',
  bg='linear-gradient(170deg,#ECE8FF 0%,#E4EEFF 55%,#F7EDFF 100%)',
  blobs='radial-gradient(32vmax 26vmax at 12% 15%,rgba(139,108,255,.24),transparent 70%),radial-gradient(30vmax 24vmax at 90% 85%,rgba(79,179,255,.22),transparent 70%),radial-gradient(26vmax 20vmax at 85% 12%,rgba(255,143,177,.18),transparent 70%)',
  tile=tile(240,240, planet(60,60,13,'#FFB4C8','#B9A6FF',.8)+planet(180,170,9,'#9FD8FF','#FFD08A',.75)+star(170,40,7,'#FFC23D',.75)+star(40,190,5,'#B9A6FF',.8)+star(120,120,3.5,'#FFC23D',.7)+dot(220,90,2,'#8B6CFF',.6)+dot(100,220,2,'#8B6CFF',.6)+dot(20,110,1.6,'#8B6CFF',.6)+moon(120,30,.9,'#FFD45E',.6)), size=240)
T['fruit'] = dict(name='ผลไม้สดใส', emoji='🍓', accent='#F76707', hi='#E03131',
  bg='linear-gradient(160deg,#FFF9E6 0%,#FFF1EC 55%,#F2FFF4 100%)',
  blobs='radial-gradient(30vmax 24vmax at 8% 10%,rgba(255,169,77,.22),transparent 70%),radial-gradient(30vmax 24vmax at 92% 90%,rgba(255,107,139,.18),transparent 70%),radial-gradient(28vmax 22vmax at 92% 10%,rgba(140,224,180,.22),transparent 70%)',
  tile=tile(200,200, berry(40,46,1.2,.85)+orange(150,60,1.1,.8)+berry(150,160,.95,.8)+orange(50,150,.85,.75)+leaf(95,100,20,'#8CE0B4',.6)+dot(100,20,3,'#FFC23D',.5)+dot(190,110,2.5,'#FF8FB1',.5)), size=200)
T['notebook'] = dict(name='สมุดวาดเล่น', emoji='📒', accent='#5C7CFA', hi='#E8467A',
  bg='#FFFDF6',
  blobs='linear-gradient(90deg,transparent 46px,rgba(255,107,139,.35) 46px,rgba(255,107,139,.35) 48px,transparent 48px),repeating-linear-gradient(180deg,transparent 0 31px,rgba(79,140,255,.16) 31px 32px)',
  tile=tile(260,260, f"<g fill='none' stroke-linecap='round' stroke-linejoin='round' stroke-width='2.4'>"
       f"<polygon points='{' '.join(f'{200+10*(1 if i%2==0 else .48)*math.cos(math.pi/5*i-math.pi/2):.1f},{50+10*(1 if i%2==0 else .48)*math.sin(math.pi/5*i-math.pi/2):.1f}' for i in range(10))}' stroke='#FFC23D'/>"
       f"<path transform='translate(70 170) scale(1.4)' d='M0 6 C-8 0 -10 -6 -5 -9 C-2 -11 0 -9 0 -6 C0 -9 2 -11 5 -9 C10 -6 8 0 0 6 Z' stroke='#FF6B8B'/>"
       f"<circle cx='190' cy='200' r='10' stroke='#3DD6A8'/></g>" + squiggle(60,60,'#A78BFA',.8)+squiggle(130,120,'#4FB3FF',.7)+f"<g transform='translate(130 230) scale(.7)'><path d='M-14 6 C-14 -12 -7 -18 0 -18 C7 -18 14 -12 14 6 L14 16 Q11 20 8 16 Q4 12 0 16 Q-4 20 -8 16 Q-11 12 -14 16 Z' fill='none' stroke='#8B6CFF' stroke-width='3'/><circle cx='-5' cy='-3' r='2.2' fill='#8B6CFF'/><circle cx='5' cy='-3' r='2.2' fill='#8B6CFF'/></g>"), size=260)
T['spooky'] = dict(name='ฮาโลวีนน่ารัก', emoji='🎃', accent='#7048E8', hi='#F76707',
  bg='linear-gradient(165deg,#F3EDFF 0%,#FFF1E2 60%,#F0EAFF 100%)',
  blobs='radial-gradient(32vmax 26vmax at 90% 10%,rgba(255,169,77,.24),transparent 70%),radial-gradient(32vmax 26vmax at 8% 88%,rgba(139,108,255,.22),transparent 70%)',
  tile=tile(230,230, pumpkin(46,50,1.3,.85)+ghost(170,70,.95,'#fff',.95)+pumpkin(160,180,1,.8)+ghost(60,170,.8,'#fff',.9)+moon(110,110,.9,'#FFD45E',.6)+star(210,20,5,'#B9A6FF',.7)+dot(20,110,2.5,'#8B6CFF',.5)), size=230)

T['war'] = dict(name='สมรภูมิสงคราม', emoji='⚔️', accent='#4D6B1F', hi='#B45309',
  bg='linear-gradient(165deg,#F3EEDC 0%,#E8EBD3 55%,#F1E5CF 100%)',
  blobs='radial-gradient(22vmax 14vmax at 10% 14%,rgba(107,127,58,.20),transparent 70%),radial-gradient(18vmax 12vmax at 30% 70%,rgba(140,107,62,.16),transparent 70%),radial-gradient(24vmax 15vmax at 88% 20%,rgba(94,110,54,.18),transparent 70%),radial-gradient(20vmax 13vmax at 72% 88%,rgba(107,127,58,.18),transparent 70%),radial-gradient(16vmax 10vmax at 55% 40%,rgba(164,132,78,.12),transparent 70%)',
  tile=tile(260,260, helmet(48,54,1.1,o=.8)+ghost(196,170,.9,'#fff',.95)+helmet(196,154,.62,o=.95)+biplane(180,50,1,o=.6)+tank(70,200,1.05,.65)+roundel(120,120,9,.55)+flagpole(240,240,.8,o=.6)+mapline(20,120,.6)+star(30,240,5,'#B45309',.45)+star(240,100,4,'#6B7F3A',.5)), size=260)

# ขาวดำคลาสสิก: ทั้งหน้าเป็นขาวดำแบบหนังเก่า (ปุ่มคำตอบยังมีรูปทรงบอก) — เพิ่ม filter: grayscale ด้านล่าง
def mono_ghost(x,y,s): return (f"<g transform='translate({x} {y}) scale({s})'><path d='M-14 6 C-14 -12 -7 -18 0 -18 C7 -18 14 -12 14 6 L14 16 Q11 20 8 16 Q4 12 0 16 Q-4 20 -8 16 Q-11 12 -14 16 Z' fill='#fff' stroke='#222' stroke-width='2.2'/>"
  "<circle cx='-5' cy='-3' r='2.6' fill='#222'/><circle cx='5' cy='-3' r='2.6' fill='#222'/><ellipse cx='-9' cy='3' rx='3' ry='1.8' fill='#999' opacity='.6'/><ellipse cx='9' cy='3' rx='3' ry='1.8' fill='#999' opacity='.6'/></g>")
def mono_star(x,y,r,o): return f"<path d='M{x} {y-r} L{x+r*.3:.1f} {y-r*.3:.1f} L{x+r} {y} L{x+r*.3:.1f} {y+r*.3:.1f} L{x} {y+r} L{x-r*.3:.1f} {y+r*.3:.1f} L{x-r} {y} L{x-r*.3:.1f} {y-r*.3:.1f} Z' fill='#222' opacity='{o}'/>"
mono_film = ("<g transform='translate(176 60) rotate(-12)' opacity='.55'><rect x='-30' y='-16' width='60' height='32' rx='3' fill='#2A2A2A'/>"
  + ''.join(f"<rect x='{-26+i*11}' y='-13' width='6' height='4' rx='1' fill='#fff'/><rect x='{-26+i*11}' y='9' width='6' height='4' rx='1' fill='#fff'/>" for i in range(5))
  + "<rect x='-24' y='-6' width='20' height='12' fill='#bbb'/><rect x='2' y='-6' width='20' height='12' fill='#ddd'/></g>")
T['mono'] = dict(name='ขาวดำคลาสสิก', emoji='🎬', accent='#1A1A1A', hi='#555555',
  bg='linear-gradient(165deg,#FFFFFF 0%,#EDEDED 55%,#F6F6F6 100%)',
  blobs='radial-gradient(30vmax 22vmax at 8% 10%,rgba(0,0,0,.07),transparent 70%),radial-gradient(30vmax 24vmax at 92% 90%,rgba(0,0,0,.08),transparent 70%),radial-gradient(60vmax 50vmax at 50% 50%,transparent 60%,rgba(0,0,0,.10) 100%)',
  tile=tile(240,240, mono_ghost(50,56,1.15)+mono_ghost(186,178,.85)+mono_film+mono_star(120,120,8,.45)+mono_star(34,200,5,.35)+mono_star(214,118,4,.35)+mono_star(96,26,4,.3)
    +"<path d='M20 140 q14 -14 30 -4 t30 -4' fill='none' stroke='#555' stroke-width='2' stroke-dasharray='4 5' stroke-linecap='round' opacity='.5'/><circle cx='140' cy='210' r='5' fill='none' stroke='#444' stroke-width='2' opacity='.4'/>"), size=240)
T['plain'] = dict(name='เรียบง่าย', emoji='🤍', accent='#475569', hi='#94A3B8',
  bg='linear-gradient(180deg,#FAFAF9 0%,#F3F4F6 100%)',
  blobs='linear-gradient(transparent,transparent)',
  tile=tile(240,240, "<circle cx='60' cy='60' r='1.6' fill='#CBD5E1'/><circle cx='180' cy='180' r='1.6' fill='#CBD5E1'/>"), size=240)
GRAY = ['mono']   # ธีมที่ทำให้ทั้งหน้าเป็นขาวดำ

ORDER = ['ghost','candy','ocean','garden','sky','space','fruit','notebook','spooky','war','mono','plain']
css = ["/* ═════════ ธีมเกมคำถาม: พื้นหลังน่ารักหลายแบบ + ตัวอักษรอ่านง่าย (สร้างจาก gen/themes.py — โหลดเป็นไฟล์สุดท้าย) ═════════ */",
"""
/* ── ตัวอักษร: แบบมีหัว (Looped) อ่านง่ายสำหรับนักเรียน ── */
:root { --font-read: 'IBM Plex Sans Thai Looped', 'Prompt', 'Noto Sans Thai', system-ui, sans-serif; }
body.qz { font-family: var(--font-read); line-height: 1.6; letter-spacing: .005em; }
body.qz .q-title, body.qz .ready-q, body.qz .q-mini, body.qz .q-mini-card, body.qz .ans, body.qz .ans .lbl {
  font-family: var(--font-read); font-weight: 700; letter-spacing: .01em; }
body.qz .ready-q { line-height: 1.4; }
body.qz .q-title { line-height: 1.45; }
body.qz .ans .lbl, body.qz .ans { line-height: 1.4; text-shadow: 0 1px 2px rgba(0,0,0,.18); }
body.qz .q-mini-card, body.qz .q-mini { line-height: 1.5; font-size: max(1.05rem, 1em); }
body.qz .muted, body.qz .hint, body.qz small { font-weight: 500; }
body.qz .pans .ans { font-size: 1.3rem; }
@media (min-width: 600px) { body.qz .pans .ans { font-size: 1.55rem; } }
body.qz input, body.qz button, body.qz select, body.qz textarea { font-family: inherit; }
/* ข้อความที่วางบนพื้นหลังโดยตรง ให้มีขอบขาวบาง ๆ อ่านชัดทุกธีม */
body.qz .ready-q, body.qz .ready-num, body.qz .board-h, body.qz h1, body.qz h2 { text-shadow: 0 2px 0 rgba(255,255,255,.85), 0 0 18px rgba(255,255,255,.9); }

/* ── พื้นหลังตามธีม ── */
body.qz { background: var(--th-bg); background-attachment: fixed; }
body.qz.sky::before { inset: 0; filter: none; opacity: 1; animation: none; background-image: var(--th-blobs); background-size: auto; }
body.qz.sky::after { inset: -260px; opacity: .72; background-image: var(--th-tile); background-size: var(--th-size) var(--th-size); animation: th-drift 90s linear infinite; }
@keyframes th-drift { to { transform: translate(var(--th-size), calc(var(--th-size) * .5)); } }
@media (prefers-reduced-motion: reduce) { body.qz.sky::after { animation: none; } }
"""]
for k in ORDER:
    t=T[k]
    sel = f"html[data-theme='{k}'] body.qz" + (", html[data-fest='plain'][data-theme='ghost'] body.qz, html[data-fest='plain']:not([data-theme]) body.qz" if k == 'plain' else '')
    css.append(f"{sel} {{ --th-bg: {t['bg']}; --th-blobs: {t['blobs']}; --th-tile: {uri(t['tile'])}; --th-size: {t['size']}px; --accent: {t['accent']}; --hi: {t['hi']}; }}")
    if k in GRAY: css.append(f"html[data-theme='{k}'] {{ filter: grayscale(1); }}")
css.append("""
/* ── ตัวเลือกธีม ── */
.th-pick { display: grid; grid-template-columns: repeat(auto-fill, minmax(118px, 1fr)); gap: 10px; }
.th-card { position: relative; display: grid; gap: 6px; padding: 6px 6px 8px; border-radius: 18px; background: #fff; border: 3px solid transparent; box-shadow: 0 4px 14px rgba(60,48,130,.10); cursor: pointer; font: inherit; color: var(--ink); text-align: center; transition: transform .15s, border-color .15s; }
.th-card:hover { transform: translateY(-2px); }
.th-card[aria-pressed='true'] { border-color: var(--accent, #6C4DFF); }
.th-card[aria-pressed='true']::after { content: '✓'; position: absolute; top: 4px; right: 6px; width: 24px; height: 24px; border-radius: 50%; background: var(--accent, #6C4DFF); color: #fff; font-weight: 800; display: grid; place-items: center; font-size: .85rem; }
.th-card i { display: block; height: 70px; border-radius: 13px; background-size: 110px 110px, auto; }
.th-card b { font-size: .95rem; font-weight: 600; line-height: 1.3; }
.th-dlg { border: 0; border-radius: 24px; padding: 18px; width: min(640px, calc(100vw - 24px)); max-height: calc(100dvh - 24px); overflow-y: auto; overscroll-behavior: contain; box-shadow: 0 30px 80px rgba(30,20,80,.35); color: var(--ink); background: #fff; }
.th-dlg::backdrop { background: rgba(30,20,70,.35); backdrop-filter: blur(3px); }
.th-dlg h3 { margin: 0 0 4px; font-size: 1.3rem; }
.th-dlg p { margin: 0 0 12px; color: var(--ink2); font-size: .95rem; }
.th-dlg .th-foot { display: flex; justify-content: flex-end; margin-top: 14px; }
@media (max-width: 420px) { .th-pick { grid-template-columns: repeat(2, 1fr); } }
""")
for k in ORDER:
    t=T[k]
    css.append(f".th-card[data-th='{k}'] i {{ background-image: {uri(t['tile'])}, {t['bg'] if t['bg'].startswith('linear') else 'linear-gradient('+t['bg']+','+t['bg']+')'}; }}")
    if k in GRAY: css[-1] = css[-1][:-2] + ' filter: grayscale(1); }'
open('/Users/thanaphonchintana/Desktop/Claude/quiz-live/css/themes.css','w',encoding='utf-8').write('\n'.join(css)+'\n')
js = "// รายชื่อธีมเกมคำถาม (สีพื้นหลัง/ลายอยู่ใน css/themes.css)\nexport const THEMES = [\n" + ',\n'.join(f"  {{ id: '{k}', name: '{T[k]['name']}', emoji: '{T[k]['emoji']}' }}" for k in ORDER) + "\n];\n"
open('/Users/thanaphonchintana/Desktop/Claude/quiz-live/js/themes-list.js','w',encoding='utf-8').write(js)
print('ok', len('\n'.join(css)))
