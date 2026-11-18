/* ═════════ ธีมทั้งเว็บ: เทศกาล + ฤดูกาล — ใช้ได้ทุกหน้า (เกมคำถาม · โหมดห้องเรียน · สมุดคะแนน · หน้านักเรียน) ═════════
   โหลดแบบ <script src=".../festival.js?v=..." defer> (ไม่ต้องเป็น module)
   เฉพาะครูเปลี่ยนได้: อัตโนมัติตามวันที่ / ลอยกระทง / ฤดูร้อน / กลางคืน / ฝน / ปิด — เก็บที่ Firebase quiz/site/festival
   ฉากหลังอยู่ "ด้านหลัง" เนื้อหา (z-index:-1) ส่วนเอฟเฟกต์ด้านหน้า (โคมลอย ฝน หิ่งห้อย) แตะทะลุได้ ไม่บังการกด */
(function () {
  'use strict';
  const DB_URL = 'https://quizlive-wcw-default-rtdb.asia-southeast1.firebasedatabase.app';
  const PATH = '/quiz/site/festival.json';
  const KEY = 'gc_fest';
  const VER = '20261118d';
  const SRC = document.currentScript && document.currentScript.src;
  const ART = import(new URL('ghost.js?v=' + VER, SRC || location.href).href).catch(() => null);

  /* ── ธีมที่รองรับ ── windows = ช่วงแสดงอัตโนมัติ (เฉพาะเทศกาลที่มีวันที่) */
  const FESTS = {
    loykrathong: { name: 'ลอยกระทง', emoji: '🪷', greet: '🪷 สุขสันต์วันลอยกระทง 🌕', tag: '🪷 เทศกาลลอยกระทง', pose: 'krathong',
      windows: [['2026-11-17', '2026-11-25']],   // ลอยกระทง 2569 = อังคาร 24 พ.ย. 2569
      hub: ['สุขสันต์วันลอยกระทง 🪷', 'ลอยความทุกข์ไปกับสายน้ำ~', 'ขอให้เรียนเก่ง ๆ นะ 🌕', 'ไปลอยกระทงกัน!'],
      play: ['ลอยกระทงกัน! 🪷', 'ขอให้ตอบถูกทุกข้อ 🌕', 'ลอยความเครียดไปกับน้ำ~', 'พร้อมยัง?'],
      hello: '🪷 สุขสันต์วันลอยกระทง 2569 🌕', playHello: '🪷 ลอยกระทงนี้ ตอบไว ตอบถูก! 🏮' },
    summer: { name: 'ฤดูร้อน', emoji: '☀️', greet: '☀️ ฤดูร้อนแสนสดใส 🍉', tag: '☀️ ธีมฤดูร้อน', pose: 'summer', windows: [],
      hub: ['ร้อนนี้เรียนสนุก ☀️', 'ไอติมสักแท่งไหม? 🍦', 'ดื่มน้ำเยอะ ๆ นะ 💧', 'ไปทะเลกัน! 🏖️'],
      play: ['ร้อนแค่ไหนก็ตอบได้! ☀️', 'เย็นใจ ตอบให้ถูก 🍦', 'พร้อมยัง?'],
      hello: '☀️ ฤดูร้อนแสนสดใส · ห้องเรียนสนุก 🍉', playHello: '☀️ ร้อนนี้ ตอบไว ตอบถูก! 🍦' },
    night: { name: 'กลางคืน', emoji: '🌙', greet: '🌙 ราตรีสวัสดิ์ ✨', tag: '🌙 ธีมกลางคืน', pose: 'night', windows: [],
      hub: ['คืนนี้ดาวสวยจัง ✨', 'ทบทวนบทเรียนก่อนนอนนะ 📚', 'ฝันดีนะ 🌙', 'หิ่งห้อยมาเยี่ยมแล้ว~'],
      play: ['ใต้แสงจันทร์ ตอบให้ถูก 🌙', 'ดาวเป็นกำลังใจให้ ✨', 'พร้อมยัง?'],
      hello: '🌙 ราตรีแสนสงบ ดาวเต็มฟ้า ✨', playHello: '🌙 คืนนี้ ตอบไว ตอบถูก! ✨' },
    rain: { name: 'ฝนพรำ', emoji: '☔', greet: '☔ หน้าฝนพกร่มด้วยนะ 🌧️', tag: '☔ ธีมหน้าฝน', pose: 'umbrella', windows: [],
      hub: ['ฝนตกแล้ว กางร่มก่อน ☔', 'ฟังเสียงฝนแล้วตั้งใจเรียน 🌧️', 'อย่าลืมพกร่มนะ!', 'หลังฝนมีรุ้งเสมอ 🌈'],
      play: ['ฝนตก ใจไม่ตก! ☔', 'ตอบถูก รุ้งจะมา 🌈', 'พร้อมยัง?'],
      hello: '☔ หน้าฝนแสนชุ่มฉ่ำ หลังฝนมีรุ้ง 🌈', playHello: '☔ ฝนตก ใจไม่ตก ตอบถูก! 🌈' },
  };

  /* ── อ่าน/เขียนการตั้งค่า ── */
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
  const write = (v) => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} };
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  function activeFest(cfg) {
    const mode = cfg.mode || 'auto';
    if (mode === 'off') return null;
    if (FESTS[mode]) return mode;
    const t = today();
    return Object.keys(FESTS).find((k) => FESTS[k].windows.some(([a, b]) => t >= a && t <= b)) || null;
  }

  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  let current = null, seq = 0;
  async function apply(cfg) {
    const f = activeFest(cfg);
    if (f === current) return;
    const my = ++seq;
    clear(); current = f;
    if (!f) { delete document.documentElement.dataset.fest; window.dispatchEvent(new CustomEvent('gc-fest', { detail: { fest: null, mode: cfg.mode || 'auto' } })); return; }
    document.documentElement.dataset.fest = f;
    const art = await ART; if (my !== seq) return;
    render(f, art); introTheme(f, art);
    window.dispatchEvent(new CustomEvent('gc-fest', { detail: { fest: f, mode: cfg.mode || 'auto' } }));
  }
  function clear() {
    ['gcFest', 'gcFestHi', 'gcFestFront'].forEach((id) => document.getElementById(id)?.remove());
    document.querySelectorAll('.lk-tag').forEach((e) => e.remove());
    const hg = document.getElementById('heroGhost'); if (hg && hg.dataset.orig) { hg.innerHTML = hg.dataset.orig; delete hg.dataset.orig; }
    undoIntro();
  }

  /* ═════════ ภาพประกอบ ═════════ */
  const lantern = `<svg viewBox="0 0 40 52" aria-hidden="true"><defs><radialGradient id="gfL" cx=".5" cy=".7" r=".7"><stop offset="0" stop-color="#FFF1B8"/><stop offset=".55" stop-color="#FFB547"/><stop offset="1" stop-color="#F27B2E"/></radialGradient></defs>
    <path d="M6 6 Q20 -2 34 6 L30 44 Q20 48 10 44 Z" fill="url(#gfL)"/><path d="M10 44 Q20 48 30 44" stroke="#C4581F" stroke-width="1.5" fill="none"/><ellipse cx="20" cy="47" rx="3" ry="2.4" fill="#FFE07A"/></svg>`;
  const cloud = (c = '#fff') => `<svg viewBox="0 0 120 56" aria-hidden="true"><g fill="${c}"><circle cx="34" cy="34" r="20"/><circle cx="62" cy="24" r="24"/><circle cx="90" cy="34" r="18"/><rect x="16" y="32" width="90" height="22" rx="11"/></g></svg>`;
  const palm = `<svg viewBox="0 0 160 220" aria-hidden="true"><path d="M86 220 C84 160 78 110 90 64" stroke="#B9824E" stroke-width="12" fill="none" stroke-linecap="round"/>
    <path d="M86 220 C84 160 78 110 90 64" stroke="#D9A46E" stroke-width="4" fill="none" stroke-dasharray="6 10"/>
    ${[[-150, '#3FAE5C'], [-110, '#56C26F'], [-60, '#3FAE5C'], [-20, '#56C26F'], [20, '#3FAE5C']].map(([r, c]) => `<path transform="translate(90 64) rotate(${r})" d="M0 0 C20 -10 46 -10 70 8 C48 2 26 6 0 0 Z" fill="${c}"/>`).join('')}
    <circle cx="84" cy="70" r="7" fill="#8A5A2B"/><circle cx="96" cy="72" r="7" fill="#A06A35"/></svg>`;
  const gull = `<svg viewBox="0 0 40 16" aria-hidden="true"><path d="M2 12 Q11 2 20 10 Q29 2 38 12" stroke="#4B4F7A" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`;

  /* ═════════ ฉากหลังทุกหน้า ═════════ */
  const CSS = `
  #gcFest{position:fixed;inset:0;z-index:-1;pointer-events:none;overflow:hidden}
  html[data-fest] .sky::before,html[data-fest] .sky::after{z-index:-2}
  #gcFestFront{position:fixed;inset:0;z-index:40;pointer-events:none;overflow:hidden}
  .gf-tint{position:absolute;inset:0}
  .gf-lan{position:absolute;bottom:-70px;width:clamp(20px,2.8vw,32px);filter:drop-shadow(0 0 10px rgba(255,180,70,.75));animation:gf-rise var(--d) linear var(--w) infinite}
  .gf-lan svg{width:100%;display:block;animation:gf-sway 3.6s ease-in-out infinite alternate}
  @keyframes gf-rise{0%{transform:translateY(0);opacity:0}8%{opacity:.95}80%{opacity:.85}100%{transform:translateY(calc(-100vh - 140px)) translateX(var(--x));opacity:0}}
  @keyframes gf-sway{from{transform:rotate(-6deg)}to{transform:rotate(6deg)}}
  .gf-moon{position:absolute;top:max(14px,4vh);right:max(14px,5vw);width:clamp(54px,9vw,110px);aspect-ratio:1;border-radius:50%;
    background:radial-gradient(circle at 38% 36%,#FFFDF0 0 30%,#FFF1BF 62%,#FFE08A 100%);box-shadow:0 0 30px 10px rgba(255,226,140,.45),0 0 90px 40px rgba(255,214,120,.22);opacity:.95}
  .gf-cres{position:absolute;top:max(14px,4vh);right:max(14px,6vw);width:clamp(46px,7vw,90px);aspect-ratio:1;border-radius:50%;box-shadow:inset -14px 8px 0 0 #FFE9A6;filter:drop-shadow(0 0 16px rgba(255,230,160,.7));transform:rotate(-20deg)}
  .gf-water{position:absolute;left:0;right:0;bottom:0;height:clamp(54px,9vh,92px);background:linear-gradient(180deg,rgba(120,190,255,0),rgba(98,170,245,.45) 30%,rgba(70,140,230,.62))}
  .gf-wave{position:absolute;left:-50%;width:200%;height:14px;top:22%;opacity:.55;background:radial-gradient(14px 6px at 14px 7px,transparent 60%,rgba(255,255,255,.95) 64%,transparent 72%) 0 0/28px 14px repeat-x;animation:gf-wv 9s linear infinite}
  .gf-wave.w2{top:55%;opacity:.35;animation-duration:13s;animation-direction:reverse}
  @keyframes gf-wv{to{transform:translateX(-112px)}}
  .gf-k{position:absolute;bottom:calc(clamp(54px,9vh,92px) * .12);width:clamp(70px,10vw,120px);left:-130px;animation:gf-drift var(--d) linear var(--w) infinite}
  .gf-k svg{display:block;width:100%;animation:gf-bob 2.8s ease-in-out infinite alternate;transform-origin:50% 90%}
  @keyframes gf-drift{to{left:calc(100vw + 130px)}}
  @keyframes gf-bob{from{transform:translateY(0) rotate(-2.5deg)}to{transform:translateY(-5px) rotate(2.5deg)}}
  .gf-flame{transform-box:fill-box;transform-origin:50% 90%;animation:gf-flick .5s ease-in-out infinite alternate}
  .gf-glow{animation:gf-glowp 1.3s ease-in-out infinite alternate}
  @keyframes gf-flick{from{transform:scale(1,1)}to{transform:scale(.86,1.12)}}
  @keyframes gf-glowp{from{opacity:.55}to{opacity:1}}
  .gf-spark{position:absolute;width:5px;height:5px;border-radius:50%;background:#FFE9A0;box-shadow:0 0 8px 2px rgba(255,225,140,.8);animation:gf-tw 2.4s ease-in-out var(--w) infinite alternate}
  .gf-star{position:absolute;width:3px;height:3px;border-radius:50%;background:#fff;box-shadow:0 0 6px 1px rgba(255,255,255,.9);animation:gf-tw 2.6s ease-in-out var(--w) infinite alternate}
  @keyframes gf-tw{from{opacity:.15;transform:scale(.6)}to{opacity:1;transform:scale(1.1)}}
  .gf-sun{position:absolute;top:max(10px,3vh);right:max(10px,4vw);width:clamp(70px,10vw,130px);aspect-ratio:1}
  .gf-sun i{position:absolute;inset:18%;border-radius:50%;background:radial-gradient(circle at 40% 38%,#FFF7C2,#FFD23D 60%,#FFB21C);box-shadow:0 0 40px 14px rgba(255,200,60,.45)}
  .gf-sun b{position:absolute;inset:0;border-radius:50%;background:repeating-conic-gradient(rgba(255,206,70,.55) 0 10deg,transparent 10deg 30deg);mask:radial-gradient(circle,transparent 46%,#000 48%,#000 68%,transparent 70%);-webkit-mask:radial-gradient(circle,transparent 46%,#000 48%,#000 68%,transparent 70%);animation:gf-spin 24s linear infinite}
  @keyframes gf-spin{to{transform:rotate(360deg)}}
  .gf-cl{position:absolute;width:var(--s);left:-200px;opacity:var(--o,.9);filter:drop-shadow(0 6px 10px rgba(80,100,160,.15));animation:gf-cl var(--d) linear var(--w) infinite}
  .gf-cl svg{display:block;width:100%}
  @keyframes gf-cl{to{left:calc(100vw + 40px)}}
  .gf-sea{position:absolute;left:0;right:0;bottom:0;height:clamp(60px,10vh,100px);background:linear-gradient(180deg,rgba(80,200,230,0),rgba(64,190,226,.5) 28%,rgba(46,160,214,.55) 62%,rgba(255,226,160,.85) 64%,#FFE3A6)}
  .gf-palm{position:absolute;bottom:0;width:clamp(90px,12vw,170px);opacity:.92}
  .gf-gull{position:absolute;width:clamp(26px,3vw,40px);left:-60px;animation:gf-fly var(--d) linear var(--w) infinite}
  .gf-gull svg{display:block;width:100%;animation:gf-flap .5s ease-in-out infinite alternate;transform-origin:50% 70%}
  @keyframes gf-fly{0%{left:-60px;transform:translateY(0)}50%{transform:translateY(-30px)}100%{left:calc(100vw + 60px);transform:translateY(10px)}}
  @keyframes gf-flap{to{transform:scaleY(.55)}}
  .gf-fly{position:absolute;width:7px;height:7px;border-radius:50%;background:#F8FF9A;box-shadow:0 0 10px 4px rgba(230,255,120,.75);animation:gf-ff var(--d) ease-in-out var(--w) infinite alternate,gf-tw 1.6s ease-in-out infinite alternate}
  @keyframes gf-ff{to{transform:translate(var(--x),var(--y))}}
  .gf-shoot{position:absolute;top:12%;left:70%;width:120px;height:2px;background:linear-gradient(90deg,#fff,transparent);transform:rotate(-24deg);opacity:0;animation:gf-sh 7s ease-in var(--w) infinite}
  @keyframes gf-sh{0%,88%{opacity:0;translate:0 0}90%{opacity:1}100%{opacity:0;translate:-300px 130px}}
  .gf-drop{position:absolute;top:-30px;width:2px;height:clamp(16px,2.6vh,26px);border-radius:2px;background:linear-gradient(180deg,rgba(130,170,230,0),rgba(96,140,215,.6));transform:rotate(12deg);animation:gf-fall var(--d) linear var(--w) infinite}
  @keyframes gf-fall{to{translate:-18vh 112vh}}
  .gf-rip{position:absolute;bottom:var(--b);width:44px;height:12px;border-radius:50%;border:2px solid rgba(120,160,220,.55);opacity:0;animation:gf-rp 2.6s ease-out var(--w) infinite}
  @keyframes gf-rp{0%{transform:scale(.2);opacity:.9}100%{transform:scale(1.8);opacity:0}}
  .gf-puddle{position:absolute;left:0;right:0;bottom:0;height:clamp(40px,7vh,70px);background:linear-gradient(180deg,rgba(150,180,220,0),rgba(120,150,200,.35))}
  @media (prefers-reduced-motion:reduce){#gcFest *,#gcFest *::before{animation:none!important}#gcFestFront{display:none}.gf-lan{bottom:auto;top:var(--top)}.gf-k{left:var(--l)}.gf-cl{left:var(--l)}}
  @media print{#gcFest,#gcFestFront,#gcFestHi{display:none!important}}
  #gcFestHi{position:fixed;left:50%;bottom:calc(clamp(54px,9vh,92px) + 14px + env(safe-area-inset-bottom));transform:translateX(-50%) translateY(20px);z-index:60;
    display:flex;align-items:center;gap:10px;padding:10px 12px 10px 16px;border-radius:999px;background:rgba(255,255,255,.95);color:#3A2E5C;
    box-shadow:0 10px 30px rgba(60,48,130,.22);font:600 15px/1.3 'IBM Plex Sans Thai Looped','Noto Sans Thai',system-ui,sans-serif;opacity:0;transition:opacity .4s,transform .4s;width:max-content;max-width:calc(100vw - 24px);white-space:nowrap}
  #gcFestHi.on{opacity:1;transform:translateX(-50%) translateY(0)}
  #gcFestHi button{border:0;background:#F1EEFC;color:#3A2E5C;width:30px;height:30px;border-radius:50%;font-size:15px;cursor:pointer;flex:none}
  @media (max-width:700px){#gcFestHi{bottom:calc(84px + env(safe-area-inset-bottom))}}
  .lk-tag{display:inline-flex;align-items:center;gap:6px;margin-left:6px;padding:4px 12px;border-radius:999px;background:linear-gradient(90deg,var(--ft1,#FFB347),var(--ft2,#FF6FA0));color:#fff;font-weight:700;font-size:.85em;box-shadow:0 4px 12px rgba(255,140,80,.35)}`;

  const N = (phone, a, b) => (phone ? a : b);
  const lanterns = (n, cls = 'gf-lan') => [...Array(n)].map((_, i) => `<div class="${cls}" style="left:${(4 + i * (92 / n) + (i % 2) * 3).toFixed(0)}vw;--d:${20 + (i % 4) * 5}s;--w:${-(i * 3.1 + 1).toFixed(1)}s;--x:${(i % 2 ? 1 : -1) * (20 + i * 3)}px;--top:${(18 + (i * 37) % 55)}vh">${lantern}</div>`).join('');
  const stars = (n, cls = 'gf-star', maxTop = 60) => [...Array(n)].map((_, i) => `<i class="${cls}" style="left:${(7 + i * 83) % 97}%;top:${(4 + i * 29) % maxTop}%;--w:${-(i * .53).toFixed(2)}s"></i>`).join('');
  const clouds = (n, c, o) => [...Array(n)].map((_, i) => `<div class="gf-cl" style="top:${(3 + i * 11) % 34}%;--s:${120 + (i % 3) * 50}px;--d:${70 + i * 18}s;--w:${-(i * 23)}s;--o:${o};--l:${(10 + i * 27) % 90}vw">${cloud(c)}</div>`).join('');

  const SCENES = {
    loykrathong(phone, art) {
      const hues = ['#FF9CC0', '#FFB4C8', '#C9B8FF', '#FFC2D6', '#FFD08A'];
      const ks = [...Array(N(phone, 3, 5))].map((_, i) => `<div class="gf-k" style="--d:${36 + i * 7}s;--w:${-(i * 13)}s;--l:${(8 + i * 18)}vw">${art.krathongSVG({ lotus: hues[i % 5] })}</div>`).join('');
      return { back: `<div class="gf-tint" style="background:linear-gradient(180deg,rgba(124,92,255,.16),rgba(255,170,120,.12) 45%,rgba(255,214,150,.10) 70%,rgba(80,130,230,.18))"></div><div class="gf-moon"></div>${stars(N(phone, 6, 12), 'gf-spark')}${lanterns(N(phone, 5, 9))}<div class="gf-water"><i class="gf-wave"></i><i class="gf-wave w2"></i></div>${ks}`,
        front: lanterns(N(phone, 4, 7)), ft: ['#FFB347', '#FF6FA0'] };
    },
    summer(phone) {
      const gulls = [...Array(N(phone, 2, 4))].map((_, i) => `<div class="gf-gull" style="top:${10 + i * 9}%;--d:${22 + i * 6}s;--w:${-(i * 7)}s">${gull}</div>`).join('');
      return { back: `<div class="gf-tint" style="background:linear-gradient(180deg,rgba(90,200,255,.22),rgba(170,230,255,.12) 50%,rgba(255,226,150,.18))"></div><div class="gf-sun"><b></b><i></i></div>${clouds(N(phone, 2, 4), '#fff', .9)}
        <div class="gf-sea"><i class="gf-wave" style="top:18%"></i><i class="gf-wave w2" style="top:40%"></i></div><div class="gf-palm" style="left:-10px">${palm}</div>${phone ? '' : `<div class="gf-palm" style="right:-14px;transform:scaleX(-1)">${palm}</div>`}`,
        front: gulls, ft: ['#FFB21C', '#FF7A59'] };
    },
    night(phone) {
      const flies = [...Array(N(phone, 6, 11))].map((_, i) => `<i class="gf-fly" style="left:${(9 + i * 37) % 92}%;top:${(30 + i * 23) % 64 + 20}%;--d:${5 + (i % 4)}s;--w:${-(i * .9).toFixed(1)}s;--x:${(i % 2 ? 1 : -1) * (30 + i * 6)}px;--y:${(i % 3 ? -1 : 1) * (24 + i * 4)}px"></i>`).join('');
      return { back: `<div class="gf-tint" style="background:linear-gradient(180deg,rgba(38,28,110,.38),rgba(70,56,150,.24) 45%,rgba(120,110,200,.14))"></div><div class="gf-cres"></div>${stars(N(phone, 26, 50), 'gf-star', 70)}<i class="gf-shoot" style="--w:-2s"></i><i class="gf-shoot" style="--w:-5.5s;top:22%;left:40%"></i>`,
        front: flies, ft: ['#8B6CFF', '#5B8CFF'] };
    },
    rain(phone) {
      const drops = [...Array(N(phone, 26, 54))].map((_, i) => `<i class="gf-drop" style="left:${((i * 41) % 104)}%;--d:${(.8 + (i % 5) * .14).toFixed(2)}s;--w:${-(i * .23).toFixed(2)}s"></i>`).join('');
      const rips = [...Array(N(phone, 4, 8))].map((_, i) => `<i class="gf-rip" style="left:${(6 + i * 29) % 92}%;--b:${8 + (i % 3) * 10}px;--w:${-(i * .7).toFixed(1)}s"></i>`).join('');
      return { back: `<div class="gf-tint" style="background:linear-gradient(180deg,rgba(110,130,170,.30),rgba(150,170,205,.16) 50%,rgba(140,170,215,.2))"></div>${clouds(N(phone, 3, 6), '#E9EEF7', .95)}<div class="gf-puddle"></div>${rips}`,
        front: drops, ft: ['#4FB3FF', '#6C7CFF'] };
    },
  };

  function render(f, art) {
    if (!art) return;
    if (!document.getElementById('gcFestCss')) { const st = document.createElement('style'); st.id = 'gcFestCss'; st.textContent = CSS; document.head.append(st); }
    const phone = innerWidth < 700, sc = SCENES[f](phone, art);
    const el = document.createElement('div'); el.id = 'gcFest'; el.setAttribute('aria-hidden', 'true'); el.innerHTML = sc.back; document.body.prepend(el);
    const fr = document.createElement('div'); fr.id = 'gcFestFront'; fr.setAttribute('aria-hidden', 'true'); fr.innerHTML = sc.front; document.body.append(fr);
    document.documentElement.style.setProperty('--ft1', sc.ft[0]); document.documentElement.style.setProperty('--ft2', sc.ft[1]);
    // หน้าเมนูรวม: ผีน้อยในแบนเนอร์เปลี่ยนท่าตามธีม + ป้ายธีม
    const hg = document.getElementById('heroGhost');
    if (hg) { if (!hg.dataset.orig) hg.dataset.orig = hg.innerHTML; hg.innerHTML = art.ghost(FESTS[f].pose); }
    const ht = document.querySelector('.hero-tag');
    if (ht && !document.querySelector('.lk-tag')) ht.insertAdjacentHTML('afterend', `<span class="lk-tag">${FESTS[f].tag}</span>`);
    if (reduce()) return;
    const it = document.getElementById('intro'); if (it && !it.hidden) return;   // หน้าที่มี INTRO ทักทายใน INTRO แล้ว
    let shown = false; try { shown = sessionStorage.getItem('gc_fest_hi_' + f) === '1'; sessionStorage.setItem('gc_fest_hi_' + f, '1'); } catch (e) {}
    if (shown) return;
    const hi = document.createElement('div'); hi.id = 'gcFestHi'; hi.setAttribute('role', 'status');
    hi.innerHTML = `<span>${FESTS[f].greet}</span><button type="button" aria-label="ปิด">✕</button>`;
    document.body.append(hi);
    const close = () => { hi.classList.remove('on'); setTimeout(() => hi.remove(), 450); };
    hi.querySelector('button').onclick = close;
    setTimeout(() => hi.classList.add('on'), 700); setTimeout(close, 6500);
  }

  /* ═════════ INTRO ตามธีม (หน้าเมนูรวม .gc-intro และหน้าเข้าเกม .intro) ═════════ */
  const ICSS = `
  #intro.fx{isolation:isolate;animation:none!important}
  #intro.fx .fx-layer{position:absolute;inset:0;z-index:-1;pointer-events:none;overflow:hidden}
  #intro.fx .fx-layer .gf-moon{top:max(5vh,28px);left:50%;right:auto;translate:-50% 0;width:clamp(120px,30vmin,260px)}
  #intro.fx .fx-layer .gf-sun{top:max(5vh,28px);left:50%;right:auto;translate:-50% 0;width:clamp(150px,36vmin,300px)}
  #intro.fx .fx-layer .gf-cres{top:max(6vh,30px);left:58%;right:auto;width:clamp(100px,24vmin,200px);box-shadow:inset -26px 14px 0 0 #FFE9A6}
  #intro.fx .gf-water{height:24vh}#intro.fx .gf-sea{height:24vh}#intro.fx .gf-puddle{height:16vh}
  #intro.fx .gf-k{width:clamp(70px,13vmin,120px);bottom:calc(24vh * var(--y));animation-duration:var(--d)}
  #intro.fx .gf-lan,#intro.fx .gf-drop{position:absolute}
  .gc-intro.fx .fog{opacity:.2}.gc-intro.fx .mini-ghosts{display:none}
  .gc-intro.fx .in-stage{margin-top:min(16vh,150px)}
  .gc-intro.fx .in-title{margin-top:calc(8px + min(3vh,24px))}
  .gc-intro.fx .in-bubble{background:#FFF8E6}
  .fx-hello{display:block;margin-top:4px;font:600 clamp(15px,3.6vw,19px)/1.4 'IBM Plex Sans Thai Looped',system-ui,sans-serif}
  .intro.fx .dawn,.intro.fx .clouds,.intro.fx .bubbles{display:none}
  .intro.fx .lk-moon{display:none}
  /* ลอยกระทง & กลางคืน: ฟ้ามืด ตัวหนังสือสว่าง */
  #intro.fx-loykrathong{background:linear-gradient(180deg,#120F33 0%,#241D5C 38%,#4A3787 66%,#2E4C9A 100%)!important}
  #intro.fx-night{background:linear-gradient(180deg,#0B0A26 0%,#1C1850 45%,#33287A 80%,#3D3290 100%)!important}
  #intro.fx-loykrathong .in-title span,#intro.fx-night .in-title span{color:#FFE7A3;text-shadow:0 0 18px rgba(255,214,120,.55),0 4px 0 #2A2363}
  #intro.fx-loykrathong .in-title span:nth-child(n+7){color:#FFB9D3}#intro.fx-night .in-title span:nth-child(n+7){color:#C9B8FF}
  #intro.fx-loykrathong :is(.in-sub,.intro-tag,.intro-hint),#intro.fx-night :is(.in-sub,.intro-tag,.intro-hint){color:#EDE6FF}
  #intro.fx-loykrathong .fx-hello{color:#FFE7A3;text-shadow:0 0 12px rgba(255,214,120,.6)}#intro.fx-night .fx-hello{color:#E3D9FF;text-shadow:0 0 12px rgba(180,160,255,.6)}
  #intro.fx-loykrathong .in-skip,#intro.fx-night .in-skip{background:rgba(255,255,255,.16);color:#fff}
  #intro.fx-loykrathong .intro-title span,#intro.fx-night .intro-title span{text-shadow:0 0 16px rgba(255,255,255,.35),0 5px 0 #2A2363}
  #intro.fx-loykrathong .hill{background:radial-gradient(ellipse at 50% 30%,rgba(255,230,160,.5),rgba(255,230,160,.12) 60%,transparent 72%)}
  #intro.fx-night .hill{background:radial-gradient(ellipse at 50% 30%,rgba(200,190,255,.45),rgba(200,190,255,.1) 60%,transparent 72%)}
  #intro.fx-loykrathong :is(.in-go,.intro-go){background:linear-gradient(135deg,#FFB347,#FF6FA0);box-shadow:0 8px 0 #B84F2E,0 14px 34px rgba(255,170,80,.5)}
  #intro.fx-night :is(.in-go,.intro-go){background:linear-gradient(135deg,#8B6CFF,#5B8CFF);box-shadow:0 8px 0 #3F2FB0,0 14px 34px rgba(120,110,255,.5)}
  /* ฤดูร้อน: ฟ้าสด ทะเล ทราย */
  #intro.fx-summer{background:linear-gradient(180deg,#5EC8FF 0%,#9FE0FF 45%,#D9F4FF 72%,#FFE7AE 100%)!important}
  #intro.fx-summer .in-title span{color:#FF7A1A;text-shadow:0 4px 0 #fff,0 8px 18px rgba(255,140,40,.35)}#intro.fx-summer .in-title span:nth-child(n+7){color:#FF4F8B}
  #intro.fx-summer :is(.in-sub,.intro-tag,.intro-hint){color:#184A6B}#intro.fx-summer .fx-hello{color:#E8590C}
  #intro.fx-summer :is(.in-go,.intro-go){background:linear-gradient(135deg,#FFB21C,#FF6F61);box-shadow:0 8px 0 #C44A1E,0 14px 34px rgba(255,150,60,.45)}
  #intro.fx-summer .in-skip{background:rgba(255,255,255,.6);color:#184A6B}
  /* ฝน: ฟ้าครึ้ม เม็ดฝน แอ่งน้ำ */
  #intro.fx-rain{background:linear-gradient(180deg,#6F82A8 0%,#94A7C8 40%,#C3D2E8 78%,#D9E4F2 100%)!important}
  #intro.fx-rain .in-title span{color:#fff;text-shadow:0 4px 0 #4D6A9E,0 8px 22px rgba(40,70,130,.4)}#intro.fx-rain .in-title span:nth-child(n+7){color:#BFE3FF}
  #intro.fx-rain :is(.in-sub,.intro-tag,.intro-hint){color:#1F3358}#intro.fx-rain .fx-hello{color:#1E5FA8}
  #intro.fx-rain :is(.in-go,.intro-go){background:linear-gradient(135deg,#4FB3FF,#6C7CFF);box-shadow:0 8px 0 #2C4FB0,0 14px 34px rgba(80,140,255,.45)}
  #intro.fx-rain .in-skip{background:rgba(255,255,255,.5);color:#1F3358}
  #intro.fx-rain .gf-drop{background:linear-gradient(180deg,rgba(255,255,255,0),rgba(255,255,255,.8))}
  @media (prefers-reduced-motion:reduce){#intro.fx *{animation-duration:.01s!important;animation-iteration-count:1!important}#intro.fx .gf-lan{bottom:auto;top:var(--top)}#intro.fx .gf-k{left:var(--l)}}
  @media (max-height:640px){.gc-intro.fx .in-stage{margin-top:min(12vh,90px)}}`;

  function introScene(f, phone, art) {
    if (f === 'loykrathong') {
      const hues = ['#FF9CC0', '#FFD08A', '#C9B8FF', '#FFB4C8'];
      const ks = [...Array(N(phone, 3, 5))].map((_, i) => `<div class="gf-k" style="--y:${[.1, .38, .2, .48, .28][i]};--d:${22 + i * 5}s;--w:${-(i * 6.3).toFixed(1)}s;--l:${10 + i * 18}%">${art.krathongSVG({ lotus: hues[i % 4] })}</div>`).join('');
      return `${stars(N(phone, 26, 46), 'gf-star', 62)}<div class="gf-moon"></div>${lanterns(N(phone, 7, 12))}<div class="gf-water"><i class="gf-wave" style="top:16%"></i><i class="gf-wave w2" style="top:48%"></i></div>${ks}`;
    }
    if (f === 'summer') return `<div class="gf-sun"><b></b><i></i></div>${clouds(N(phone, 3, 5), '#fff', .95)}<div class="gf-sea"><i class="gf-wave" style="top:14%"></i><i class="gf-wave w2" style="top:34%"></i></div><div class="gf-palm" style="left:-14px;width:clamp(120px,22vmin,220px)">${palm}</div><div class="gf-palm" style="right:-18px;transform:scaleX(-1);width:clamp(120px,22vmin,220px)">${palm}</div>${[...Array(3)].map((_, i) => `<div class="gf-gull" style="top:${12 + i * 8}%;--d:${16 + i * 5}s;--w:${-(i * 5)}s">${gull}</div>`).join('')}`;
    if (f === 'night') return `${stars(N(phone, 40, 80), 'gf-star', 75)}<div class="gf-cres"></div><i class="gf-shoot" style="--w:-1s"></i><i class="gf-shoot" style="--w:-4s;top:20%;left:35%"></i>${[...Array(N(phone, 8, 14))].map((_, i) => `<i class="gf-fly" style="left:${(9 + i * 37) % 92}%;top:${(40 + i * 23) % 50 + 40}%;--d:${4 + (i % 4)}s;--w:${-(i * .9).toFixed(1)}s;--x:${(i % 2 ? 1 : -1) * (30 + i * 6)}px;--y:${(i % 3 ? -1 : 1) * (24 + i * 4)}px"></i>`).join('')}`;
    if (f === 'rain') return `${clouds(N(phone, 4, 7), '#EEF2F9', .95)}${[...Array(N(phone, 40, 80))].map((_, i) => `<i class="gf-drop" style="left:${((i * 41) % 104)}%;--d:${(.7 + (i % 5) * .12).toFixed(2)}s;--w:${-(i * .19).toFixed(2)}s"></i>`).join('')}<div class="gf-puddle"></div>${[...Array(N(phone, 5, 9))].map((_, i) => `<i class="gf-rip" style="left:${(6 + i * 29) % 92}%;--b:${8 + (i % 3) * 14}px;--w:${-(i * .6).toFixed(1)}s"></i>`).join('')}`;
    return '';
  }

  function introTheme(f, art) {
    const intro = document.getElementById('intro');
    if (!intro || !art || intro.classList.contains('fx-' + f)) return;
    if (intro.hidden) {
      // หน้าเมนูรวม: INTRO ปกติเคยเล่นแล้ว → เล่น INTRO ของธีมนี้ให้ดู 1 ครั้งต่อเครื่อง
      let seen = true; try { seen = localStorage.getItem('gc_fx_intro_' + f) === '1'; } catch (e) {}
      if (seen || !window.gcOpenIntro || reduce()) return;
      try { localStorage.setItem('gc_fx_intro_' + f, '1'); } catch (e) {}
      window.gcOpenIntro();
    }
    try { localStorage.setItem('gc_fx_intro_' + f, '1'); } catch (e) {}
    undoIntro();
    if (!document.getElementById('gcFestCss')) { const st = document.createElement('style'); st.id = 'gcFestCss'; st.textContent = CSS; document.head.append(st); }
    if (!document.getElementById('gcFxCss')) { const st = document.createElement('style'); st.id = 'gcFxCss'; st.textContent = ICSS; document.head.append(st); }
    const hub = intro.classList.contains('gc-intro'), phone = innerWidth < 700;
    const layer = document.createElement('div'); layer.className = 'fx-layer'; layer.setAttribute('aria-hidden', 'true');
    layer.innerHTML = introScene(f, phone, art);
    intro.prepend(layer);
    intro.classList.add('fx', 'fx-' + f);
    if (hub) {
      const g = intro.querySelector('#inGhost'); if (g) { if (!g.dataset.orig) g.dataset.orig = g.innerHTML; g.innerHTML = art.ghost(FESTS[f].pose); }
      const sub = intro.querySelector('.in-sub'); if (sub) sub.insertAdjacentHTML('beforeend', `<span class="fx-hello">${FESTS[f].hello}</span>`);
    } else {
      const tag = intro.querySelector('.intro-tag'); if (tag) tag.insertAdjacentHTML('beforeend', `<span class="fx-hello">${FESTS[f].playHello}</span>`);
    }
    window.dispatchEvent(new CustomEvent('gc-fest-intro', { detail: { fest: f, lines: hub ? FESTS[f].hub : FESTS[f].play } }));
  }
  function undoIntro() {
    const intro = document.getElementById('intro'); if (!intro) return;
    [...intro.classList].filter((c) => c === 'fx' || c.startsWith('fx-')).forEach((c) => intro.classList.remove(c));
    intro.querySelectorAll('.fx-layer,.fx-hello').forEach((e) => e.remove());
    const g = intro.querySelector('#inGhost'); if (g && g.dataset.orig) { g.innerHTML = g.dataset.orig; delete g.dataset.orig; }
  }

  /* ── เริ่มทำงาน: ใช้ค่าที่จำไว้ก่อน (เร็ว) แล้วค่อยถามเซิร์ฟเวอร์ ── */
  function start() {
    apply(read());
    fetch(DB_URL + PATH, { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).then((v) => {
      if (v && typeof v === 'object' && v.mode) { write(v); apply(v); }
    }).catch(() => {});
  }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);

  /* ── API สำหรับหน้าตั้งค่าของครู ── */
  window.GCFest = {
    FESTS: Object.fromEntries(Object.entries(FESTS).map(([k, f]) => [k, { name: f.name, emoji: f.emoji, windows: f.windows }])),
    get: () => ({ mode: read().mode || 'auto', active: current }),
    decorateIntro: async () => { if (current) introTheme(current, await ART); },
    /** บันทึกโหมด ('auto' | 'off' | ชื่อธีม) — ต้องส่ง idToken ของครู ทุกเครื่องจึงเห็นตรงกัน */
    async set(mode, idToken) {
      const v = { mode, at: Date.now() };
      write(v); await apply(v);
      if (!idToken) return { ok: false, local: true };
      try {
        const r = await fetch(`${DB_URL}${PATH}?auth=${encodeURIComponent(idToken)}`, { method: 'PUT', body: JSON.stringify(v) });
        return r.ok ? { ok: true } : { ok: false, local: true, status: r.status };
      } catch (e) { return { ok: false, local: true }; }
    },
  };
})();
