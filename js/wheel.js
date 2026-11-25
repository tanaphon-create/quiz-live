// วงล้อสุ่ม (ยกมาจากสมุดคะแนน) — ใช้ในโหมดห้องเรียน · สุ่มกลุ่ม
const calm = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return true; } };
const WHEEL_COLORS = ['#FF8FB1','#FFC94D','#7FD8BE','#8FB8FF','#C3A6FF','#FFA877','#9BE07A','#FF9CE0','#6FD3F0','#FFD98A'];
let wheelAC = null;
function wheelSound(kind){
  try{
    wheelAC = wheelAC || new (window.AudioContext||window.webkitAudioContext)();
    const ac = wheelAC, t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
    const cfg = { tick:[1400,.03,.05,'square'], boing:[220,.35,.12,'sine'], win:[880,.5,.12,'triangle'], huh:[300,.25,.08,'sawtooth'] }[kind];
    o.type = cfg[3]; o.frequency.setValueAtTime(cfg[0], t);
    if(kind==='boing') o.frequency.exponentialRampToValueAtTime(660, t+cfg[1]);
    if(kind==='huh') o.frequency.exponentialRampToValueAtTime(180, t+cfg[1]);
    if(kind==='win'){ o.frequency.setValueAtTime(660,t); o.frequency.setValueAtTime(880,t+.12); o.frequency.setValueAtTime(1320,t+.24); }
    g.gain.setValueAtTime(cfg[2], t); g.gain.exponentialRampToValueAtTime(.0001, t+cfg[1]);
    o.connect(g).connect(ac.destination); o.start(t); o.stop(t+cfg[1]+.05);
  }catch(e){}
}

// opt: items() ช่องที่อยู่ในวง · all() ใช้วาดแบบจางเมื่อสุ่มครบ · weight · label · color · tease() · maxFs · ink · rot0 มุมเริ่มต้น
export function makeWheel(cv, say, opt){
  const W = opt.weight || (()=>1), maxFs = opt.maxFs || 30;
  let rot = opt.rot0 || 0, slices = [], faded = false;
  const layout = () => { let p = opt.items(); faded = !p.length && !!opt.all; if(faded) p = opt.all(); const tot = p.reduce((a,s)=>a+W(s),0) || 1; let a = 0; slices = p.map((s,i)=>{ const w = W(s)/tot*Math.PI*2; const sl = {s, a0:a, a1:a+w, col:(opt.color && opt.color(s,i)) || WHEEL_COLORS[i%WHEEL_COLORS.length]}; a += w; return sl; }); };
  const at = r => { const th = ((-Math.PI/2 - r) % (Math.PI*2) + Math.PI*4) % (Math.PI*2); return slices.findIndex(x=>th>=x.a0 && th<x.a1); };
  const draw = (hi=-1) => {
    const g = cv.getContext('2d'), N = cv.width, R = N/2 - 6;
    g.clearRect(0,0,N,N); g.save(); g.translate(N/2,N/2); g.rotate(rot);
    if(!slices.length){ g.restore(); return; }
    slices.forEach((x,i)=>{
      g.beginPath(); g.moveTo(0,0); g.arc(0,0,R,x.a0,x.a1); g.closePath();
      g.fillStyle = x.col; g.fill(); g.lineWidth = 2; g.strokeStyle = '#fff'; g.stroke();
      if(i===hi){ g.fillStyle='rgba(255,255,255,.35)'; g.fill(); }
      if(faded){ g.fillStyle='rgba(255,255,255,.62)'; g.fill(); }
      const span = x.a1 - x.a0, fs = Math.max(10, Math.min(maxFs, span*R*0.55));
      if(span*R < 9) return;
      const lab = opt.label(x.s), mid = (x.a0+x.a1)/2;
      if(String(lab).length <= 3){   // เลขสั้น ๆ: วางแบบหน้าปัดนาฬิกา หัวตั้งออกด้านนอก อ่านง่าย
        const f2 = Math.max(14, Math.min(maxFs*1.6, span*R*0.5));
        g.save(); g.rotate(mid); g.translate(R*0.7, 0); g.rotate(Math.PI/2); g.textAlign='center'; g.textBaseline='middle'; g.fillStyle=opt.ink||'#2B2350'; if(opt.ink){ g.shadowColor='rgba(0,0,0,.45)'; g.shadowBlur=6; }
        g.font = `800 ${f2}px 'IBM Plex Sans Thai Looped','Noto Sans Thai',system-ui,sans-serif`; g.fillText(lab, 0, 2); g.restore(); return;
      }
      g.save(); g.rotate(mid); g.textAlign='right'; g.textBaseline='middle'; g.fillStyle=opt.ink||'#2B2350'; if(opt.ink){ g.shadowColor='rgba(0,0,0,.45)'; g.shadowBlur=6; }
      g.font = `700 ${fs}px 'IBM Plex Sans Thai Looped','Noto Sans Thai',system-ui,sans-serif`;
      let t = String(lab); const maxW = R*0.68;
      while(g.measureText(t).width > maxW && t.length > 2) t = t.slice(0,-1);
      g.fillText(t, R-14, 1); g.restore();
    });
    g.restore();
    g.beginPath(); g.arc(N/2,N/2,R,0,Math.PI*2); g.lineWidth = 8; g.strokeStyle = '#2B2350'; g.stroke();
  };
  const talk = (t, ms=1400) => { say.textContent = t; say.classList.add('on'); clearTimeout(talk.h); talk.h = setTimeout(()=>say.classList.remove('on'), ms); };
  const animate = (from, to, ms, ease) => new Promise(res => {
    const t0 = performance.now(); let lastI = at(from);
    const step = now => {
      const p = Math.min(1, (now - t0)/ms); rot = from + (to - from)*ease(p);
      const i = at(rot); if(i !== lastI){ lastI = i; wheelSound('tick'); }
      draw(); if(p < 1) requestAnimationFrame(step); else res();
    };
    if(calm()){ rot = to; draw(); res(); } else requestAnimationFrame(step);
  });
  const outCubic = p => 1 - Math.pow(1-p,3), inOut = p => p<.5 ? 2*p*p : 1-Math.pow(-2*p+2,2)/2;
  const wait = ms => new Promise(r=>setTimeout(r, calm()?0:ms));
  const rotFor = (phi, base, turns) => { const target = -Math.PI/2 - phi; let d = ((target - base) % (Math.PI*2) + Math.PI*4) % (Math.PI*2); return base + turns*Math.PI*2 + d; };
  const inside = (x, f) => x.a0 + (x.a1 - x.a0) * f;
  async function spin(){
    layout(); if(!slices.length || faded) return null;
    const tot = slices.reduce((a,x)=>a+(x.a1-x.a0),0); let r = Math.random()*tot, wi = 0;
    for(let i=0;i<slices.length;i++){ r -= (slices[i].a1-slices[i].a0); if(r<=0){ wi=i; break; } }
    const win = slices[wi], n = slices.length;
    const roll = Math.random();
    const plan = !opt.tease() || n < 2 ? 'none' : roll < .4 ? 'back' : roll < .75 ? 'creep' : roll < .88 ? 'double' : 'none';
    const turns = 5 + Math.floor(Math.random()*3);
    if(plan === 'back'){            // เลยไปช่องถัดไป แล้วหมุนย้อนกลับ
      const nb = slices[(wi - 1 + n) % n];
      await animate(rot, rotFor(inside(nb, .5), rot, turns), 5200, outCubic);
      talk('ได้แล้ว… เอ๊ะ?!', 1200); wheelSound('huh'); await wait(1100);
      talk('⏪ หมุนกลับ~', 1300); await animate(rot, rotFor(inside(win, .5), rot, 0) - Math.PI*2, 1500, inOut);
    } else if(plan === 'creep'){    // หยุดก่อนถึง แล้วค่อย ๆ คืบไป
      const nb = slices[(wi + 1) % n];
      await animate(rot, rotFor(inside(nb, .25), rot, turns), 5000, outCubic);
      talk('จบแล้ว?', 1000); await wait(1200);
      talk('ยังงง~ คืบไปอีกนิด 🐌', 1500); wheelSound('boing'); await animate(rot, rotFor(inside(win, .5), rot, 0), 2000, inOut);
    } else if(plan === 'double'){   // ทำเป็นหยุด แล้วหมุนต่ออีกรอบ
      await animate(rot, rot + Math.PI*2*3 + Math.random(), 3200, outCubic);
      talk('ล้อเล่น! หมุนต่อ 😜', 1300); wheelSound('boing'); await wait(700);
      await animate(rot, rotFor(inside(win, .3 + Math.random()*.4), rot, 3), 3800, outCubic);
    } else {
      await animate(rot, rotFor(inside(win, .2 + Math.random()*.6), rot, turns), 5200, outCubic);
    }
    draw(wi); wheelSound('win');
    return win.s;
  }
  return { layout, draw, spin, rot: () => rot, size: () => slices.length, hi: it => it ? slices.findIndex(x=>x.s===it) : -1 };
}
