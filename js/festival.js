/* ═════════ ธีมทั้งเว็บ: เทศกาล + ฤดูกาล — ใช้ได้ทุกหน้า (เกมคำถาม · โหมดห้องเรียน · สมุดคะแนน · หน้านักเรียน) ═════════
   โหลดแบบ <script src=".../festival.js?v=..." defer> (ไม่ต้องเป็น module)
   เฉพาะครูเปลี่ยนได้: อัตโนมัติตามวันที่ / ลอยกระทง / ฤดูร้อน / กลางคืน / ฝน / สงคราม / ปิด — เก็บที่ Firebase quiz/site/festival
   ฉากหลังอยู่ "ด้านหลัง" เนื้อหา (z-index:-1) ส่วนเอฟเฟกต์ด้านหน้า (โคมลอย ฝน หิ่งห้อย) แตะทะลุได้ ไม่บังการกด */
(function () {
  'use strict';
  const DB_URL = 'https://quizlive-wcw-default-rtdb.asia-southeast1.firebasedatabase.app';
  const PATH = '/quiz/site/festival.json';
  const KEY = 'gc_fest';
  const VER = '20261125a';
  const SRC = document.currentScript && document.currentScript.src;
  const ART = Promise.all([import(new URL('ghost.js?v=' + VER, SRC || location.href).href), import(new URL('krathong-art.js?v=' + VER, SRC || location.href).href).catch(() => null)])
    .then(([g, k]) => ({ ...g, kt: k })).catch(() => null);

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
    war: { name: 'สงคราม', emoji: '⚔️', greet: '⚔️ เรียนรู้สงคราม เพื่อรักษาสันติภาพ 🕊️', tag: '⚔️ ธีมสงคราม', pose: 'soldier', windows: [],
      hub: ['ทหารผีน้อยพร้อมแล้ว! 🪖', 'เรียนประวัติศาสตร์ เพื่อสันติภาพ 🕊️', 'จัดแถว! ตรงไปข้างหน้า~', 'ภารกิจวันนี้: ตั้งใจเรียน ⭐'],
      play: ['ทหารกล้า ตอบให้ถูก! 🪖', 'บุกไปข้างหน้า! ⚔️', 'ชัยชนะอยู่ไม่ไกล ⭐', 'พร้อมรบยัง?'],
      hello: '⚔️ เรียนรู้สงคราม เพื่อรักษาสันติภาพ 🕊️', playHello: '🪖 ทหารกล้า ตอบไว ตอบถูก! ⭐' },
    mono: { name: 'ขาวดำ', emoji: '🎬', greet: '🎬 ขาวดำคลาสสิก แบบหนังเก่า 🎞️', tag: '🎬 ธีมขาวดำ', pose: 'peek', windows: [],
      hub: ['ฉากนี้ขาวดำ แต่ใจยังสดใส 🎬', 'แอ็กชัน! เริ่มเรียนได้ 🎞️', 'ผีน้อยยุคหนังเงียบ~', 'พร้อมเข้าฉากยัง?'],
      play: ['แอ็กชัน! ตอบเลย 🎬', 'ฉากนี้ต้องตอบถูก 🎞️', 'พร้อมยัง?'],
      hello: '🎬 ขาวดำคลาสสิก · หนังเก่าแสนอบอุ่น 🎞️', playHello: '🎬 แอ็กชัน! ตอบไว ตอบถูก 🎞️' },
    christmas: { name: 'คริสต์มาส', emoji: '🎄', greet: '🎄 Merry Christmas! สุขสันต์วันคริสต์มาส ⛄', tag: '🎄 เทศกาลคริสต์มาส', pose: 'santa',
      windows: [['2026-12-15', '2026-12-31'], ['2027-12-15', '2027-12-31']],
      hub: ['Merry Christmas! 🎄', 'ซานต้าผีน้อยมาแล้ว 🎅', 'หิมะตกแล้ว~ ❄️', 'ของขวัญคือความตั้งใจเรียน 🎁'],
      play: ['Ho ho ho! ตอบเลย 🎅', 'ตอบถูกได้ของขวัญ 🎁', 'หิมะตกแล้ว พร้อมยัง? ❄️'],
      hello: '🎄 Merry Christmas · สุขสันต์วันคริสต์มาส ⛄', playHello: '🎅 คริสต์มาสนี้ ตอบไว ตอบถูก! 🎁' },
    plain: { name: 'เรียบง่าย', emoji: '🤍', greet: '🤍 ธีมเรียบง่าย สบายตา', tag: '🤍 ธีมเรียบง่าย', pose: 'hello', windows: [], calm: true,
      hub: ['วันนี้สอนอะไรดี?', 'พร้อมแล้ว เริ่มได้เลย', 'ตั้งใจเรียนนะ'], play: ['พร้อมยัง?', 'ตั้งใจตอบนะ'],
      hello: '', playHello: '' },
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
    render(f, art); if (!FESTS[f].calm) introTheme(f, art);
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
  const plane = `<svg viewBox="0 0 80 40" aria-hidden="true"><path d="M8 22 Q6 14 14 14 L58 16 Q66 17 66 22 Q66 27 58 28 L14 30 Q6 30 8 22 Z" fill="#7A8B4A" stroke="#3E4A22" stroke-width="2"/>
    <rect x="26" y="5" width="12" height="30" rx="4" fill="#9AAB66" stroke="#3E4A22" stroke-width="2"/><path d="M8 22 L2 12 L12 16 Z" fill="#5E6E36" stroke="#3E4A22" stroke-width="2" stroke-linejoin="round"/>
    <circle cx="48" cy="22" r="5" fill="#F6F1DE" stroke="#3E4A22" stroke-width="1.5"/><circle cx="48" cy="22" r="2.4" fill="#C2410C"/><path d="M60 19 Q64 18 64 22" fill="#BFE3FF" stroke="#3E4A22" stroke-width="1.2"/>
    <rect class="gf-prop" x="66" y="10" width="4" height="24" rx="2" fill="#5E4A2A"/></svg>`;
  const tank = `<svg viewBox="0 0 120 70" aria-hidden="true"><rect x="10" y="44" width="100" height="22" rx="11" fill="#4A5728" stroke="#2F3818" stroke-width="2.5"/>
    ${[24, 44, 64, 84, 98].map((x) => `<circle cx="${x}" cy="55" r="7" fill="#8C9A5E" stroke="#2F3818" stroke-width="2"/>`).join('')}
    <rect x="16" y="30" width="88" height="18" rx="7" fill="#7A8B4A" stroke="#2F3818" stroke-width="2.5"/><rect x="38" y="14" width="40" height="20" rx="9" fill="#8C9A5E" stroke="#2F3818" stroke-width="2.5"/>
    <rect x="74" y="20" width="42" height="6" rx="3" fill="#5E6E36" stroke="#2F3818" stroke-width="2"/><circle cx="58" cy="24" r="5" fill="#F6F1DE"/><circle cx="58" cy="24" r="2.3" fill="#C2410C"/>
    <path d="M52 14 L52 2" stroke="#5E4A2A" stroke-width="2"/><path d="M52 2 L66 6 L52 10 Z" fill="#C2410C"/></svg>`;
  const hills = `<svg viewBox="0 0 1200 140" preserveAspectRatio="none" aria-hidden="true"><path d="M0 70 Q150 20 320 60 T640 50 T960 64 T1200 44 L1200 140 L0 140 Z" fill="#8C9A5E" opacity=".55"/>
    <path d="M0 100 Q200 70 420 96 T820 88 T1200 92 L1200 140 L0 140 Z" fill="#6B7F3A" opacity=".75"/>
    ${[...Array(16)].map((_, i) => `<ellipse cx="${30 + i * 76}" cy="124" rx="34" ry="13" fill="#C8B88A" stroke="#8C6B3E" stroke-width="2"/>`).join('')}
    ${[...Array(15)].map((_, i) => `<ellipse cx="${68 + i * 76}" cy="108" rx="32" ry="12" fill="#D6C79A" stroke="#8C6B3E" stroke-width="2"/>`).join('')}</svg>`;
  const flag = (c) => `<svg viewBox="0 0 40 60" aria-hidden="true"><rect x="3" y="2" width="3" height="58" rx="1.5" fill="#7A6440"/><path class="gf-wave-flag" d="M6 4 Q16 0 24 5 Q31 9 38 5 L38 24 Q31 28 24 24 Q16 19 6 23 Z" fill="${c}"/></svg>`;
  const gull = `<svg viewBox="0 0 40 16" aria-hidden="true"><path d="M2 12 Q11 2 20 10 Q29 2 38 12" stroke="#4B4F7A" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`;

  /* ═════════ ฉากหลังทุกหน้า ═════════ */
  const CSS = `
  #gcFest{position:fixed;inset:0;z-index:-1;pointer-events:none;overflow:hidden}
  html[data-fest="mono"]{filter:grayscale(1)}
  .gf-snow{position:absolute;top:-12px;width:var(--s,6px);height:var(--s,6px);border-radius:50%;background:#fff;box-shadow:0 0 4px rgba(140,180,230,.9);opacity:.95;animation:gf-snowfall var(--d) linear var(--w) infinite}
  @keyframes gf-snowfall{0%{transform:translate(0,0)}50%{transform:translate(var(--x),55vh)}100%{transform:translate(0,112vh)}}
  .gf-lights{position:absolute;top:0;left:0;right:0;height:44px}
  .gf-lights svg{position:absolute;inset:0;width:100%;height:40px}
  .gf-bulb{position:absolute;top:13px;width:13px;height:17px;margin-left:-6.5px;border-radius:50%/46% 46% 54% 54%;background:radial-gradient(circle at 35% 30%,#fff 0 18%,var(--c) 30%);box-shadow:0 0 12px 3px var(--c);animation:gf-blink 1.6s ease-in-out var(--w) infinite alternate}
  .gf-bulb::before{content:'';position:absolute;top:-4px;left:3px;width:7px;height:5px;border-radius:2px;background:#8E7BC4}
  @keyframes gf-blink{from{opacity:.45;box-shadow:0 0 3px 1px var(--c)}to{opacity:1}}
  .gf-tree{position:absolute;bottom:0;width:clamp(90px,11vw,170px)}
  .gf-snowman,.gf-gifts{position:absolute;bottom:0}.gf-snowman svg,.gf-gifts svg{display:block;width:100%}
  .gf-sway{transform-origin:50% 100%;animation:gf-sway var(--sw,4s) ease-in-out infinite alternate}
  @keyframes gf-sway{from{transform:rotate(-2.2deg)}to{transform:rotate(2.2deg)}}
  .gf-twinkle{animation:gf-twk 1.8s ease-in-out infinite alternate}@keyframes gf-twk{from{transform:scale(.9) rotate(-6deg)}to{transform:scale(1.08) rotate(6deg)}}
  .gf-wave-arm{transform-origin:28px 104px;animation:gf-arm 1.1s ease-in-out infinite alternate}@keyframes gf-arm{from{transform:rotate(-14deg)}to{transform:rotate(10deg)}}
  .gf-hop{animation:gf-hop 1.6s ease-in-out var(--w,0s) infinite}@keyframes gf-hop{0%,70%,100%{transform:translateY(0)}80%{transform:translateY(-6px)}}
  .gf-flk{position:absolute;top:-24px;width:var(--s);height:var(--s);opacity:.9;filter:drop-shadow(0 0 3px rgba(150,170,255,.8));animation:gf-snowfall var(--d) linear var(--w) infinite}
  .gf-flk svg{display:block;width:100%;height:100%;animation:gf-spin 6s linear infinite}@keyframes gf-spin{to{transform:rotate(360deg)}}
  .gf-tree svg{display:block;width:100%}
  .gf-orn{animation:gf-blink 1.3s ease-in-out var(--w,0s) infinite alternate}
  .gf-snowbank{position:absolute;left:0;right:0;bottom:0;height:clamp(40px,7vh,70px);background:radial-gradient(ellipse 30% 90% at 12% 100%,#fff 60%,transparent 61%),radial-gradient(ellipse 34% 100% at 48% 100%,#FAFCFF 60%,transparent 61%),radial-gradient(ellipse 30% 85% at 86% 100%,#fff 60%,transparent 61%),linear-gradient(180deg,transparent 50%,#fff 51%);filter:drop-shadow(0 -3px 8px rgba(170,150,240,.3))}
  html[data-fest="plain"] body:not(.qz){background:#F6F6F4!important}
  html[data-fest="plain"] body:not(.qz).sky::before,html[data-fest="plain"] body:not(.qz).sky::after,html[data-fest="plain"] :is(.fog,.mini-ghosts,.sparkles,.bubbles,.clouds,.dawn){display:none!important}
  html[data-fest="plain"] svg.ghost .gh-body{animation:none!important}
  html[data-fest="plain"] .gc-intro,html[data-fest="plain"] #intro.intro{background:#F6F6F4!important}
  html[data-fest="plain"] .gc-hero{background:#fff;color:#2B2F3A;box-shadow:0 1px 0 #E5E7EB,0 6px 18px rgba(15,23,42,.05);border:1px solid #E5E7EB}
  html[data-fest="plain"] .gc-hero::before,html[data-fest="plain"] .gc-hero::after{display:none}
  html[data-fest="plain"] .gc-hero .hero-tag{background:#F1F5F9;color:#475569}
  html[data-fest="plain"] .gc-hero p{color:#64748B;opacity:1}
  html[data-fest="plain"] .gtile{box-shadow:0 1px 0 #E5E7EB,0 4px 12px rgba(15,23,42,.04)!important}
  .gf-grain{position:absolute;inset:-20%;opacity:.09;background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\");animation:gfGrain 1.2s steps(4) infinite}
  @keyframes gfGrain{0%{transform:translate(0,0)}25%{transform:translate(-3%,2%)}50%{transform:translate(2%,-3%)}75%{transform:translate(-2%,-1%)}}
  .gf-scr{position:absolute;top:0;bottom:0;width:2px;background:rgba(0,0,0,.16);opacity:0;animation:gfScr var(--d,4s) linear infinite;animation-delay:var(--w,0s)}
  @keyframes gfScr{0%,100%{opacity:0;transform:translateX(0)}8%{opacity:.8}45%{opacity:.25;transform:translateX(26px)}70%{opacity:.7}90%{opacity:0;transform:translateX(-12px)}}
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
  .gf-moon::after{content:'';position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle at 62% 40%,rgba(214,190,120,.35) 0 9%,transparent 10%),radial-gradient(circle at 40% 66%,rgba(214,190,120,.3) 0 7%,transparent 8%),radial-gradient(circle at 72% 70%,rgba(214,190,120,.22) 0 5%,transparent 6%)}
  .gf-shore{position:absolute;left:0;right:0;bottom:calc(clamp(54px,9vh,92px) - 1px);height:clamp(16px,3vh,30px);opacity:.42}
  .gf-shore svg{display:block;width:100%;height:100%}
  .gf-shl{animation:gf-tw 1.8s ease-in-out var(--w) infinite alternate}
  .gf-mpath{position:absolute;top:4%;bottom:0;width:90px;translate:-50% 0}
  .gf-gl{position:absolute;left:calc(50% + var(--l));height:2px;border-radius:2px;translate:-50% 0;background:linear-gradient(90deg,transparent,#FFF0BD,transparent);opacity:.25;animation:gf-glt 2.2s ease-in-out var(--w) infinite alternate}
  @keyframes gf-glt{to{opacity:.95;transform:scaleX(1.4)}}
  .gf-k .gf-kref{position:absolute;left:50%;top:66%;width:16%;height:60%;translate:-50% 0;border-radius:50%;background:radial-gradient(ellipse at 50% 20%,rgba(255,200,100,.6),rgba(255,170,60,.12) 55%,transparent 72%);filter:blur(1.5px)}
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
  .gf-beam{position:absolute;bottom:0;width:22vw;height:115vh;background:linear-gradient(0deg,rgba(255,248,200,.42),rgba(255,248,200,0) 85%);clip-path:polygon(46% 100%,54% 100%,100% 0,0 0);transform-origin:50% 100%;transform:rotate(-24deg);animation:gf-sweep 11s ease-in-out var(--w) infinite alternate}
  @keyframes gf-sweep{to{transform:rotate(24deg)}}
  .gf-hills{position:absolute;left:0;right:0;bottom:0;height:clamp(60px,11vh,110px)}.gf-hills svg{width:100%;height:100%;display:block}
  .gf-flag{position:absolute;bottom:clamp(44px,8vh,84px);width:clamp(30px,3.6vw,46px)}.gf-flag svg{display:block;width:100%}
  .gf-wave-flag{transform-box:fill-box;transform-origin:0 50%;animation:gf-flagw 1.4s ease-in-out infinite alternate}
  @keyframes gf-flagw{to{transform:skewY(-6deg) scaleX(.9)}}
  .gf-tank{position:absolute;bottom:clamp(8px,2vh,20px);width:clamp(80px,9vw,130px);left:-140px;animation:gf-drift var(--d) linear var(--w) infinite}.gf-tank svg{display:block;width:100%;animation:gf-bob .5s ease-in-out infinite alternate}
  .gf-plane{position:absolute;width:clamp(60px,6vw,90px);left:-100px;animation:gf-fly var(--d) linear var(--w) infinite}.gf-plane svg{display:block;width:100%}
  .gf-prop{transform-box:fill-box;transform-origin:50% 50%;animation:gf-propsp .12s linear infinite alternate}
  @keyframes gf-propsp{to{transform:scaleY(.15)}}
  @media (prefers-reduced-motion:reduce){#gcFest *,#gcFest *::before{animation:none!important}#gcFestFront{display:none}.gf-snow{top:var(--top,30%)}.gf-lan{bottom:auto;top:var(--top)}.gf-k{left:var(--l)}.gf-cl{left:var(--l)}.gf-tank{left:var(--l)}}
  @media print{#gcFest,#gcFestFront,#gcFestHi{display:none!important}}
  #gcFestHi{position:fixed;left:50%;bottom:calc(clamp(54px,9vh,92px) + 14px + env(safe-area-inset-bottom));transform:translateX(-50%) translateY(20px);z-index:60;
    display:flex;align-items:center;gap:10px;padding:10px 12px 10px 16px;border-radius:999px;background:rgba(255,255,255,.95);color:#3A2E5C;
    box-shadow:0 10px 30px rgba(60,48,130,.22);font:600 15px/1.3 'IBM Plex Sans Thai Looped','Noto Sans Thai',system-ui,sans-serif;opacity:0;transition:opacity .4s,transform .4s;width:max-content;max-width:calc(100vw - 24px);white-space:nowrap}
  #gcFestHi.on{opacity:1;transform:translateX(-50%) translateY(0)}
  #gcFestHi button{border:0;background:#F1EEFC;color:#3A2E5C;width:30px;height:30px;border-radius:50%;font-size:15px;cursor:pointer;flex:none}
  @media (max-width:700px){#gcFestHi{bottom:calc(84px + env(safe-area-inset-bottom))}}
  .lk-tag{display:inline-flex;align-items:center;gap:6px;margin-left:6px;padding:4px 12px;border-radius:999px;background:linear-gradient(90deg,var(--ft1,#FFB347),var(--ft2,#FF6FA0));color:#fff;font-weight:700;font-size:.85em;box-shadow:0 4px 12px rgba(255,140,80,.35)}`;

  const N = (phone, a, b) => (phone ? a : b);
  const scratches = (n) => [...Array(n)].map((_, i) => `<i class="gf-scr" style="left:${(13 + i * 31) % 94}%;--d:${3 + (i % 3) * 1.4}s;--w:${-(i * 1.7).toFixed(1)}s"></i>`).join('');
  const lanterns = (n, cls = 'gf-lan') => [...Array(n)].map((_, i) => `<div class="${cls}" style="left:${(4 + i * (92 / n) + (i % 2) * 3).toFixed(0)}vw;--d:${20 + (i % 4) * 5}s;--w:${-(i * 3.1 + 1).toFixed(1)}s;--x:${(i % 2 ? 1 : -1) * (20 + i * 3)}px;--top:${(18 + (i * 37) % 55)}vh">${lantern}</div>`).join('');
  const stars = (n, cls = 'gf-star', maxTop = 60) => [...Array(n)].map((_, i) => `<i class="${cls}" style="left:${(7 + i * 83) % 97}%;top:${(4 + i * 29) % maxTop}%;--w:${-(i * .53).toFixed(2)}s"></i>`).join('');
  const clouds = (n, c, o) => [...Array(n)].map((_, i) => `<div class="gf-cl" style="top:${(3 + i * 11) % 34}%;--s:${120 + (i % 3) * 50}px;--d:${70 + i * 18}s;--w:${-(i * 23)}s;--o:${o};--l:${(10 + i * 27) % 90}vw">${cloud(c)}</div>`).join('');

  const snow = (n, sm = 1) => [...Array(n)].map((_, i) => `<i class="gf-snow" style="left:${(3 + i * 37) % 99}%;--s:${((3 + (i % 4) * 2) * sm + 2).toFixed(1)}px;--d:${9 + (i % 5) * 3}s;--w:${-(i * 1.9).toFixed(1)}s;--x:${(i % 2 ? 1 : -1) * (14 + (i % 4) * 8)}px"></i>`).join('');
  const lights = (n) => { const cs = ['#FF4D5E', '#FFD23D', '#3BD17A', '#4FB3FF', '#FF8FD0'];
    const segs = [...Array(n)].map((_, i) => { const x0 = (i / n) * 1000, x1 = ((i + 1) / n) * 1000; return `M${x0.toFixed(1)} 3 Q${((x0 + x1) / 2).toFixed(1)} 34 ${x1.toFixed(1)} 3`; }).join(' ');
    return `<div class="gf-lights"><svg viewBox="0 0 1000 40" preserveAspectRatio="none"><path d="${segs}" stroke="#1E8A4C" stroke-width="3" fill="none" vector-effect="non-scaling-stroke"/></svg>${[...Array(n)].map((_, i) => `<i class="gf-bulb" style="left:${((i + .5) / n * 100).toFixed(2)}%;--c:${cs[i % 5]};--w:${-(i * .37).toFixed(2)}s"></i>`).join('')}</div>`; };
  // คริสต์มาสสไตล์น่ารัก: ต้นคริสต์มาสหน้ายิ้ม ตุ๊กตาหิมะ กล่องของขวัญ ไม้เท้าลูกกวาด
  const kface = (x, y, k = 1, ink = '#3A2E5C') => `<g transform="translate(${x} ${y}) scale(${k})"><ellipse cx="-9" cy="0" rx="3.4" ry="4.2" fill="${ink}"/><ellipse cx="9" cy="0" rx="3.4" ry="4.2" fill="${ink}"/><circle cx="-8" cy="-1.6" r="1.3" fill="#fff"/><circle cx="10" cy="-1.6" r="1.3" fill="#fff"/><ellipse cx="-15" cy="6" rx="4.6" ry="2.8" fill="#FF8FB1" opacity=".75"/><ellipse cx="15" cy="6" rx="4.6" ry="2.8" fill="#FF8FB1" opacity=".75"/><path d="M-4 5 Q-2 8.5 0 5.5 Q2 8.5 4 5" stroke="${ink}" stroke-width="1.8" fill="none" stroke-linecap="round"/></g>`;
  const tree = `<svg viewBox="0 0 140 190" aria-hidden="true" class="gf-sway">
    <path d="M44 156 h52 l-6 28 q-1 4 -5 4 h-30 q-4 0 -5 -4 Z" fill="#E8243F" stroke="#A8102E" stroke-width="3" stroke-linejoin="round"/><rect x="42" y="152" width="56" height="10" rx="5" fill="#FFD23D" stroke="#A8102E" stroke-width="3"/>
    <path d="M70 92 C92 112 118 128 126 146 Q128 156 116 156 H24 Q12 156 14 146 C22 128 48 112 70 92 Z" fill="#1FA85C" stroke="#0E6E3C" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M70 56 C88 72 106 86 112 102 Q114 112 103 112 H37 Q26 112 28 102 C34 86 52 72 70 56 Z" fill="#2BC26E" stroke="#0E6E3C" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M70 24 C82 36 94 48 98 62 Q100 70 91 70 H49 Q40 70 42 62 C46 48 58 36 70 24 Z" fill="#43D985" stroke="#0E6E3C" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M30 104 Q38 98 46 104 Q54 98 62 104 Q70 98 78 104 Q86 98 94 104 Q102 98 110 104" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".95"/>
    <path d="M44 63 Q51 58 58 63 Q64 58 70 63 Q76 58 82 63 Q89 58 96 63" stroke="#fff" stroke-width="4.5" fill="none" stroke-linecap="round" opacity=".95"/>
    ${kface(70, 128, 1.15)}
    <path d="M30 140 Q70 152 112 138" stroke="#FFC21A" stroke-width="3" fill="none" stroke-dasharray="1 7" stroke-linecap="round"/>
    ${[[50, 86, '#FF2E55'], [90, 90, '#2E9BFF'], [70, 44, '#FFC21A'], [36, 146, '#B15CFF'], [104, 146, '#FF2E55'], [60, 98, '#FFC21A']].map(([x, y, c], i) => `<g class="gf-orn" style="--w:${-i * .45}s"><circle cx="${x}" cy="${y}" r="5.6" fill="${c}" stroke="#fff" stroke-width="1.6"/><circle cx="${x - 1.8}" cy="${y - 1.8}" r="1.6" fill="#fff" opacity=".9"/></g>`).join('')}
    <g class="gf-twinkle" style="transform-origin:70px 16px"><path d="M70 1 L75 11 L86 12 L78 19 L80 30 L70 25 L60 30 L62 19 L54 12 L65 11 Z" fill="#FFC21A" stroke="#E8A93A" stroke-width="2.4" stroke-linejoin="round"/><circle cx="66.5" cy="16" r="1.4" fill="#5A3E1B"/><circle cx="73.5" cy="16" r="1.4" fill="#5A3E1B"/><path d="M68 19.5 Q70 21 72 19.5" stroke="#5A3E1B" stroke-width="1.2" fill="none" stroke-linecap="round"/></g></svg>`;
  const snowman = `<svg viewBox="0 0 130 170" aria-hidden="true" class="gf-sway" style="--sw:3s">
    <path class="gf-wave-arm" d="M28 104 L6 86 M14 93 L8 98" stroke="#9A6B47" stroke-width="4" stroke-linecap="round" fill="none"/>
    <path d="M102 104 L122 92 M115 96 L120 104" stroke="#9A6B47" stroke-width="4" stroke-linecap="round" fill="none"/>
    <ellipse cx="65" cy="163" rx="46" ry="6" fill="#B9D6F2" opacity=".6"/>
    <circle cx="65" cy="122" r="40" fill="#fff" stroke="#A9C8EC" stroke-width="3.5"/>
    <circle cx="65" cy="112" r="3.6" fill="#E8243F"/><circle cx="65" cy="128" r="3.6" fill="#E8243F"/><circle cx="65" cy="144" r="3.6" fill="#E8243F"/>
    <circle cx="65" cy="62" r="30" fill="#fff" stroke="#A9C8EC" stroke-width="3.5"/>
    ${kface(65, 62, 1.05)}
    <path d="M65 69 l11 2.5 -11 2.5 Z" fill="#FF9A3D" stroke="#E07B1E" stroke-width="1.2" stroke-linejoin="round"/>
    <path d="M38 88 Q65 100 92 88 L92 96 Q65 108 38 96 Z" fill="#E8243F" stroke="#A8102E" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M78 96 l4 24 -10 0 -2 -22 Z" fill="#E8243F" stroke="#A8102E" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M44 92 l0 6 M52 95 l0 6 M60 97 l0 6 M70 97 l0 6 M80 95 l0 6" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
    <path d="M36 40 Q38 18 62 16 Q86 14 96 30 L104 24" fill="none" stroke="#E8243F" stroke-width="0"/>
    <path d="M38 42 Q44 14 70 18 Q90 22 98 40 Z" fill="#E8243F" stroke="#A8102E" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M70 18 Q96 4 110 24" fill="none" stroke="#E8243F" stroke-width="9" stroke-linecap="round"/>
    <circle cx="111" cy="27" r="7" fill="#fff" stroke="#DCE8F5" stroke-width="2"/>
    <rect x="34" y="38" width="68" height="11" rx="5.5" fill="#fff" stroke="#DCE8F5" stroke-width="2"/></svg>`;
  const gifts = `<svg viewBox="0 0 120 80" aria-hidden="true">
    <g class="gf-hop" style="--w:-.3s"><rect x="6" y="34" width="50" height="42" rx="7" fill="#FF2E55" stroke="#A8102E" stroke-width="3"/><rect x="26" y="34" width="10" height="42" fill="#FFE14D"/><rect x="6" y="48" width="50" height="9" fill="#FFE14D"/><path d="M31 34 C20 20 12 30 26 34 Z M31 34 C42 20 50 30 36 34 Z" fill="#FFE14D" stroke="#E8A93A" stroke-width="2"/>${kface(31, 66, .55)}</g>
    <g class="gf-hop" style="--w:-1.1s"><rect x="62" y="44" width="50" height="32" rx="7" fill="#43D985" stroke="#0E6E3C" stroke-width="3"/><rect x="82" y="44" width="10" height="32" fill="#FFC21A"/><path d="M87 44 C76 32 70 40 82 44 Z M87 44 C98 32 104 40 92 44 Z" fill="#FFC21A" stroke="#E8A93A" stroke-width="2"/></g>
    <g transform="translate(50 6) rotate(-12)"><path d="M10 74 V20 Q10 4 24 4 Q38 4 38 18" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round"/><path d="M10 74 V20 Q10 4 24 4 Q38 4 38 18" fill="none" stroke="#E8243F" stroke-width="9" stroke-linecap="round" stroke-dasharray="6 7"/></g></svg>`;
  const flakeSvg = `<svg viewBox="-12 -12 24 24"><g stroke="#fff" stroke-width="2.4" stroke-linecap="round"><path d="M0 -10 V10 M-8.7 -5 L8.7 5 M-8.7 5 L8.7 -5"/><path d="M-3 -7.5 L0 -5 L3 -7.5 M-3 7.5 L0 5 L3 7.5" fill="none"/></g></svg>`;
  const flakes = (n) => [...Array(n)].map((_, i) => `<i class="gf-flk" style="left:${(11 + i * 43) % 97}%;--s:${12 + (i % 3) * 6}px;--d:${12 + (i % 4) * 3}s;--w:${-(i * 2.3).toFixed(1)}s;--x:${(i % 2 ? 1 : -1) * (20 + (i % 3) * 10)}px">${flakeSvg}</i>`).join('');
  const xmasScene = (phone, big = false) => `${lights(N(phone, 8, 16))}${snow(N(phone, 18, big ? 50 : 30))}${flakes(N(phone, 5, big ? 14 : 9))}<div class="gf-snowbank"${big ? ` style="height:${phone ? 8 : 13}vh"` : ''}></div>
    <div class="gf-tree" style="left:${phone ? '1vw' : '1.5vw'};width:${phone ? '72px' : big ? 'clamp(130px,22vmin,230px)' : 'clamp(100px,11vw,170px)'}">${tree}</div>
    ${phone ? '' : `<div class="gf-gifts" style="left:calc(1.5vw + ${big ? 'clamp(120px,20vmin,210px)' : 'clamp(92px,10vw,155px)'});width:${big ? 'clamp(90px,13vmin,150px)' : 'clamp(70px,7vw,110px)'}">${gifts}</div>`}
    <div class="gf-snowman" style="right:${phone ? '1vw' : '2vw'};width:${phone ? '62px' : big ? 'clamp(110px,18vmin,190px)' : 'clamp(80px,9vw,140px)'}">${snowman}</div>`;

  const KDES = [{ top: 'lotus-pink', side: 'marigold,jasmine' }, { base: 'bread', leaf: 'young', shape: 'round', top: 'rose', side: 'jasmine' }, { leaf: 'pandan', shape: 'tall', top: 'lotus-white', side: 'globe,jasmine' }, { base: 'coconut', top: 'orchid', side: 'orchid,marigold', coin: true }, { leaf: 'deep', top: 'marigold', side: 'marigold', ghost: true }];
  const kSvg = (art, i) => (art.kt ? art.kt.krathongSVG({ ...KDES[i % KDES.length], candle: true, incense: i % 2 === 0 }) : art.krathongSVG({ lotus: ['#FF9CC0', '#FFD08A', '#C9B8FF', '#FFB4C8'][i % 4] }));
  const glints = (n) => [...Array(n)].map((_, i) => `<i class="gf-gl" style="top:${(i * 9.7) % 92}%;--w:${-(i * .37).toFixed(2)}s;--l:${(i * 17) % 40 - 20}px;width:${16 + (i % 4) * 12}px"></i>`).join('');
  const shoreSvg = `<svg viewBox="0 0 1200 60" preserveAspectRatio="none" aria-hidden="true"><path d="M0 46 C50 30 90 42 130 34 C170 24 200 40 240 32 C280 22 320 40 360 36 L360 60 L0 60 Z M840 36 C880 22 920 38 960 30 C1000 20 1040 36 1080 28 C1120 22 1160 34 1200 30 L1200 60 L840 60 Z" fill="#3B2F7A"/>
    <path d="M560 60 L560 40 L570 40 L572 28 Q584 20 586 10 L588 0 L590 10 Q592 20 604 28 L606 40 L616 40 L616 60 Z M630 60 L630 46 L690 46 L700 38 L620 38 L630 46 Z" fill="#3B2F7A"/><path d="M0 54 L1200 52 L1200 60 L0 60 Z" fill="#3B2F7A"/>
    ${[[100, 44], [220, 40], [330, 48], [588, 30], [660, 50], [900, 40], [1050, 38], [1150, 42]].map(([x, y], i) => `<circle class="gf-shl" style="--w:${-i * .6}s" cx="${x}" cy="${y}" r="3" fill="#FFC86B"/>`).join('')}</svg>`;

  const SCENES = {
    loykrathong(phone, art) {
      const ks = [...Array(N(phone, 3, 5))].map((_, i) => `<div class="gf-k" style="--d:${36 + i * 7}s;--w:${-(i * 13)}s;--l:${(8 + i * 18)}vw">${kSvg(art, i)}<i class="gf-kref"></i></div>`).join('');
      return { back: `<div class="gf-tint" style="background:linear-gradient(180deg,rgba(60,50,170,.20),rgba(124,92,255,.12) 40%,rgba(255,170,120,.10) 70%,rgba(60,110,220,.20))"></div><div class="gf-moon"></div>${stars(N(phone, 8, 16), 'gf-spark')}${lanterns(N(phone, 5, 9))}
        <div class="gf-shore">${shoreSvg}</div><div class="gf-water"><div class="gf-mpath" style="left:calc(100% - max(14px,5vw) - clamp(27px,4.5vw,55px))">${glints(N(phone, 6, 10))}</div><i class="gf-wave"></i><i class="gf-wave w2"></i></div>${ks}`,
        front: '', ft: ['#FFB347', '#FF6FA0'] };
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
    war(phone) {
      const planes = [...Array(N(phone, 1, 2))].map((_, i) => `<div class="gf-plane" style="top:${12 + i * 14}%;--d:${26 + i * 9}s;--w:${-(i * 11)}s">${plane}</div>`).join('');
      return { back: `<div class="gf-tint" style="background:linear-gradient(180deg,rgba(150,140,90,.22),rgba(200,185,130,.14) 50%,rgba(120,130,80,.18))"></div>
        <i class="gf-beam" style="left:12%;--w:-2s"></i><i class="gf-beam" style="left:72%;--w:-6s;animation-direction:alternate-reverse"></i>${clouds(N(phone, 2, 3), '#EFEADB', .85)}
        <div class="gf-hills">${hills}</div><div class="gf-flag" style="left:6%">${flag('#C2410C')}</div>${phone ? '' : `<div class="gf-flag" style="right:7%">${flag('#6B7F3A')}</div>`}
        <div class="gf-tank" style="--d:70s;--w:-20s;--l:30vw">${tank}</div>${planes}`,
        front: '', ft: ['#6B7F3A', '#B45309'] };
    },
    christmas(phone) {
      return { back: `<div class="gf-tint" style="background:linear-gradient(180deg,rgba(255,46,85,.13),rgba(255,200,60,.08) 50%,rgba(31,168,92,.15))"></div>${xmasScene(phone)}`,
        front: snow(N(phone, 3, 6), .4), ft: ['#FF6F8E', '#3FBF84'] };
    },
    plain() { return { back: '', front: '', ft: ['#64748B', '#475569'] }; },
    mono(phone) {
      return { back: `<div class="gf-tint" style="background:radial-gradient(ellipse at 50% 45%,transparent 50%,rgba(0,0,0,.22))"></div><div class="gf-grain"></div>${scratches(N(phone, 2, 4))}`,
        front: '', ft: ['#222222', '#777777'] };
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
    if (reduce() || FESTS[f].calm) return;
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
  #intro.fx-loykrathong .gf-water{background:linear-gradient(180deg,#2B2A7A 0%,#1D2668 35%,#121B4E 100%)}#intro.fx-loykrathong .gf-wave{opacity:.3}
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
  /* สงคราม: ฟ้ายามเย็นสีกากี ไฟฉายส่อง เครื่องบิน รถถัง */
  #intro.fx-christmas{background:linear-gradient(180deg,#06164A 0%,#0B2F86 30%,#1859C9 56%,#3E95F0 78%,#A9DBFF 92%,#EAF7FF 100%)!important}
  #intro.fx-christmas .gf-aur{position:absolute;left:-20%;right:-20%;top:-6%;height:46%;background:linear-gradient(100deg,transparent 8%,rgba(46,255,160,.55) 26%,rgba(60,210,255,.42) 42%,rgba(190,90,255,.4) 58%,rgba(255,70,150,.48) 72%,transparent 90%);filter:blur(30px);opacity:.75;border-radius:50%;animation:gf-aur 11s ease-in-out infinite alternate}
  #intro.fx-christmas .gf-aur.a2{top:6%;height:30%;opacity:.5;animation-duration:15s;animation-direction:alternate-reverse;background:linear-gradient(80deg,transparent 12%,rgba(255,220,80,.45) 34%,rgba(46,255,160,.45) 54%,rgba(60,210,255,.35) 70%,transparent 88%)}
  @keyframes gf-aur{from{transform:translateX(-7%) skewX(-8deg) scaleY(.9)}to{transform:translateX(7%) skewX(8deg) scaleY(1.12)}}
  #intro.fx-christmas .gf-glow{position:absolute;left:50%;top:52%;width:min(90vw,820px);height:min(56vh,480px);translate:-50% -50%;background:radial-gradient(closest-side,rgba(255,214,90,.42),rgba(255,120,90,.16) 55%,transparent);animation:gf-glow 3.2s ease-in-out infinite alternate}
  @keyframes gf-glow{from{opacity:.65;scale:.94}to{opacity:1;scale:1.05}}
  #intro.fx-christmas .gf-star{background:#FFE36B;box-shadow:0 0 8px 2px rgba(255,227,107,.85)}
  #intro.fx-christmas .gf-bulb{width:15px;height:20px;margin-left:-7.5px;box-shadow:0 0 16px 5px var(--c)}
  #intro.fx-christmas :is(.in-title,.intro-title) span{color:#FF2E55;-webkit-text-stroke:5px #fff;paint-order:stroke fill;text-shadow:0 6px 0 #A8102E,0 10px 22px rgba(0,0,30,.45),0 0 26px rgba(255,255,255,.45)}
  #intro.fx-christmas :is(.in-title,.intro-title) span:nth-child(3n+2){color:#FFB800;text-shadow:0 6px 0 #B86E00,0 10px 22px rgba(0,0,30,.45),0 0 26px rgba(255,255,255,.45)}
  #intro.fx-christmas :is(.in-title,.intro-title) span:nth-child(3n){color:#18B85E;text-shadow:0 6px 0 #0B6B35,0 10px 22px rgba(0,0,30,.45),0 0 26px rgba(255,255,255,.45)}
  #intro.fx-christmas :is(.in-sub,.intro-tag,.intro-hint){color:#fff;text-shadow:0 2px 8px rgba(0,10,60,.55)}
  #intro.fx-christmas .fx-hello{display:inline-block;margin-top:6px;padding:5px 16px;border-radius:99px;color:#fff;font-weight:700;background:linear-gradient(90deg,#E8243F,#FF7A1A 50%,#18B85E);box-shadow:0 4px 0 rgba(0,0,0,.18),0 0 18px rgba(255,180,60,.5);text-shadow:0 1px 2px rgba(0,0,0,.3)}
  #intro.fx-christmas :is(.in-go,.intro-go){color:#fff;background:repeating-linear-gradient(-45deg,rgba(255,255,255,.2) 0 12px,transparent 12px 24px),linear-gradient(135deg,#FF2E55,#FF6A2E 55%,#FFB020);box-shadow:0 8px 0 #A8102E,0 14px 34px rgba(255,60,80,.55),0 0 0 4px #fff}
  #intro.fx-christmas .in-skip{background:rgba(255,255,255,.2);color:#fff}
  #intro.fx-christmas .hill{background:radial-gradient(ellipse at 50% 30%,rgba(255,255,255,.65),rgba(255,255,255,.15) 60%,transparent 72%)}
  #intro .fx-bell{position:absolute;z-index:6;left:14px;top:calc(env(safe-area-inset-top,0px) + 54px);display:inline-flex;align-items:center;gap:6px;border:0;border-radius:99px;padding:9px 16px;font:700 15px/1.2 inherit;font-family:inherit;color:#7A1020;cursor:pointer;background:linear-gradient(135deg,#FFF06B,#FFC21A);box-shadow:0 4px 0 #C98A00,0 8px 22px rgba(0,0,40,.35);animation:fx-ring 1.4s ease-in-out infinite}
  #intro .fx-bell.on{color:#fff;background:linear-gradient(135deg,#25C46B,#13924B);box-shadow:0 4px 0 #0B6B35,0 8px 22px rgba(0,0,40,.35);animation:none}
  #intro .fx-bell:focus-visible{outline:3px solid #fff;outline-offset:3px}
  @keyframes fx-ring{0%,60%,100%{transform:rotate(0)}70%{transform:rotate(-7deg)}80%{transform:rotate(6deg)}90%{transform:rotate(-3deg)}}
  #intro.fx .gf-snow{position:absolute}
  #intro.fx-war{background:linear-gradient(180deg,#56653A 0%,#83915A 38%,#C4BC88 72%,#E6DCB4 100%)!important}
  #intro.fx-war .in-title span{color:#FFF4D6;text-shadow:0 4px 0 #3E4A22,0 8px 22px rgba(40,50,20,.45)}#intro.fx-war .in-title span:nth-child(n+7){color:#FFC56B}
  #intro.fx-war :is(.in-sub,.intro-tag,.intro-hint){color:#2F3818}#intro.fx-war .fx-hello{color:#7C2D12}
  #intro.fx-war .intro-title span{text-shadow:0 5px 0 #3E4A22}
  #intro.fx-war :is(.in-go,.intro-go){background:linear-gradient(135deg,#6B7F3A,#B45309);box-shadow:0 8px 0 #3E4A22,0 14px 34px rgba(80,90,40,.45)}
  #intro.fx-war .in-skip{background:rgba(255,255,255,.5);color:#2F3818}
  #intro.fx-war .hill{background:radial-gradient(ellipse at 50% 30%,rgba(255,240,190,.5),rgba(255,240,190,.1) 60%,transparent 72%)}
  /* ขาวดำ: จอหนังเก่า เม็ดฟิล์ม รอยขีด */
  #intro.fx-mono{background:radial-gradient(ellipse at 50% 40%,#5C5C5C 0%,#2B2B2B 60%,#0E0E0E 100%)!important}
  #intro.fx-mono .in-title span{color:#fff;text-shadow:0 4px 0 #000,0 0 18px rgba(255,255,255,.35)}#intro.fx-mono .in-title span:nth-child(n+7){color:#D4D4D4}
  #intro.fx-mono :is(.in-sub,.intro-tag,.intro-hint){color:#EDEDED}#intro.fx-mono .fx-hello{color:#fff;text-shadow:0 0 12px rgba(255,255,255,.4)}
  #intro.fx-mono .intro-title span{text-shadow:0 5px 0 #000}
  #intro.fx-mono :is(.in-go,.intro-go){background:linear-gradient(135deg,#F4F4F4,#A0A0A0);color:#111;box-shadow:0 8px 0 #000,0 14px 34px rgba(0,0,0,.55)}
  #intro.fx-mono .in-skip{background:rgba(255,255,255,.16);color:#fff}
  #intro.fx-mono .hill{background:radial-gradient(ellipse at 50% 30%,rgba(255,255,255,.3),rgba(255,255,255,.07) 60%,transparent 72%)}
  #intro.fx-mono .gf-scr{background:rgba(255,255,255,.28)}#intro.fx-mono .gf-grain{opacity:.14}
  #intro.fx .gf-hills{height:20vh}#intro.fx .gf-tank{bottom:3vh;width:clamp(100px,16vmin,160px)}#intro.fx .gf-flag{bottom:14vh}
  @media (prefers-reduced-motion:reduce){#intro.fx *{animation-duration:.01s!important;animation-iteration-count:1!important}#intro.fx .gf-lan{bottom:auto;top:var(--top)}#intro.fx .gf-k{left:var(--l)}}
  @media (max-height:640px){.gc-intro.fx .in-stage{margin-top:min(12vh,90px)}}`;

  function introScene(f, phone, art) {
    if (f === 'loykrathong') {
      const ks = [...Array(N(phone, 3, 5))].map((_, i) => `<div class="gf-k" style="--y:${[.1, .38, .2, .48, .28][i]};--d:${22 + i * 5}s;--w:${-(i * 6.3).toFixed(1)}s;--l:${10 + i * 18}%">${kSvg(art, i)}<i class="gf-kref"></i></div>`).join('');
      return `${stars(N(phone, 26, 46), 'gf-star', 62)}<div class="gf-moon"></div>${lanterns(N(phone, 7, 12))}<div class="gf-shore" style="bottom:calc(24vh - 1px);height:5vh;opacity:.9">${shoreSvg.replace(/#3B2F7A/g, '#120F33')}</div><div class="gf-water"><div class="gf-mpath" style="left:50%;width:140px">${glints(N(phone, 10, 16))}</div><i class="gf-wave" style="top:16%"></i><i class="gf-wave w2" style="top:48%"></i></div>${ks}`;
    }
    if (f === 'summer') return `<div class="gf-sun"><b></b><i></i></div>${clouds(N(phone, 3, 5), '#fff', .95)}<div class="gf-sea"><i class="gf-wave" style="top:14%"></i><i class="gf-wave w2" style="top:34%"></i></div><div class="gf-palm" style="left:-14px;width:clamp(120px,22vmin,220px)">${palm}</div><div class="gf-palm" style="right:-18px;transform:scaleX(-1);width:clamp(120px,22vmin,220px)">${palm}</div>${[...Array(3)].map((_, i) => `<div class="gf-gull" style="top:${12 + i * 8}%;--d:${16 + i * 5}s;--w:${-(i * 5)}s">${gull}</div>`).join('')}`;
    if (f === 'night') return `${stars(N(phone, 40, 80), 'gf-star', 75)}<div class="gf-cres"></div><i class="gf-shoot" style="--w:-1s"></i><i class="gf-shoot" style="--w:-4s;top:20%;left:35%"></i>${[...Array(N(phone, 8, 14))].map((_, i) => `<i class="gf-fly" style="left:${(9 + i * 37) % 92}%;top:${(40 + i * 23) % 50 + 40}%;--d:${4 + (i % 4)}s;--w:${-(i * .9).toFixed(1)}s;--x:${(i % 2 ? 1 : -1) * (30 + i * 6)}px;--y:${(i % 3 ? -1 : 1) * (24 + i * 4)}px"></i>`).join('')}`;
    if (f === 'rain') return `${clouds(N(phone, 4, 7), '#EEF2F9', .95)}${[...Array(N(phone, 40, 80))].map((_, i) => `<i class="gf-drop" style="left:${((i * 41) % 104)}%;--d:${(.7 + (i % 5) * .12).toFixed(2)}s;--w:${-(i * .19).toFixed(2)}s"></i>`).join('')}<div class="gf-puddle"></div>${[...Array(N(phone, 5, 9))].map((_, i) => `<i class="gf-rip" style="left:${(6 + i * 29) % 92}%;--b:${8 + (i % 3) * 14}px;--w:${-(i * .6).toFixed(1)}s"></i>`).join('')}`;
    if (f === 'war') return `<i class="gf-beam" style="left:8%;--w:-1s"></i><i class="gf-beam" style="left:70%;--w:-5s;animation-direction:alternate-reverse"></i>${clouds(N(phone, 2, 4), '#EFEADB', .9)}${[...Array(N(phone, 2, 3))].map((_, i) => `<div class="gf-plane" style="top:${10 + i * 12}%;--d:${14 + i * 5}s;--w:${-(i * 4)}s">${plane}</div>`).join('')}<div class="gf-hills">${hills}</div><div class="gf-flag" style="left:5%">${flag('#C2410C')}</div><div class="gf-flag" style="right:6%">${flag('#6B7F3A')}</div><div class="gf-tank" style="--d:30s;--w:-8s;--l:20vw">${tank}</div>`;
    if (f === 'mono') return `<div class="gf-grain"></div>${scratches(N(phone, 3, 5))}`;
    if (f === 'christmas') return `<i class="gf-aur"></i><i class="gf-aur a2"></i><i class="gf-glow"></i>${stars(N(phone, 18, 34), 'gf-star', 50)}${xmasScene(phone, true)}`;
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
    if (f === 'christmas') bellBtn(intro);
    window.dispatchEvent(new CustomEvent('gc-fest-intro', { detail: { fest: f, lines: hub ? FESTS[f].hub : FESTS[f].play } }));
  }
  /* ปุ่ม 🔔 เปิดเพลง Jingle Bells (เบราว์เซอร์เล่นเสียงได้หลังผู้ใช้แตะเท่านั้น) · ปิดเองเมื่อออกจาก INTRO */
  let bellObs = null;
  function bellBtn(intro) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'fx-bell';
    const set = (on) => { b.classList.toggle('on', on); b.textContent = on ? '🔕 หยุดเพลง' : '🔔 เปิดเพลง Jingle Bells'; };
    set(false);
    let snd = null;
    const stop = () => { if (snd && snd.currentSong() === 'jingle') snd.music(null); set(false); };
    b.onclick = async (e) => {
      e.stopPropagation();
      snd = snd || await import(new URL('sound.js', SRC || location.href).href).catch(() => null);
      if (!snd) return;
      window.dispatchEvent(new CustomEvent('gc-intro-hold'));   // หน้าเมนูรวม: ไม่ปิด INTRO เองระหว่างฟังเพลง
      if (snd.currentSong() === 'jingle') return stop();
      snd.unlock(); snd.music('jingle'); set(snd.currentSong() === 'jingle');
    };
    intro.append(b);
    bellObs?.disconnect();
    bellObs = new MutationObserver(() => { if (intro.hidden || intro.classList.contains('leave')) stop(); });
    bellObs.observe(intro, { attributes: true, attributeFilter: ['class', 'hidden'] });
  }
  function undoIntro() {
    const intro = document.getElementById('intro'); if (!intro) return;
    [...intro.classList].filter((c) => c === 'fx' || c.startsWith('fx-')).forEach((c) => intro.classList.remove(c));
    intro.querySelectorAll('.fx-layer,.fx-hello,.fx-bell').forEach((e) => e.remove());
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
    decorateIntro: async () => { if (current && !FESTS[current].calm) introTheme(current, await ART); },
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
