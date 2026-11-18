/* ═════════ ของตกแต่งตามเทศกาล — ใช้ได้ทุกหน้า (เกมคำถาม · โหมดห้องเรียน · สมุดคะแนน · หน้านักเรียน) ═════════
   โหลดแบบ <script src=".../festival.js" defer> (ไม่ต้องเป็น module)
   ครูตั้งค่าได้: อัตโนมัติตามวันที่ / เปิดตลอด / ปิด — เก็บที่ Firebase quiz/site/festival (ทุกเครื่องเห็นตรงกัน)
   ของตกแต่งอยู่ "ด้านหลัง" เนื้อหาเสมอ (z-index:-1, pointer-events:none) จึงไม่บังปุ่มใด ๆ */
(function () {
  'use strict';
  const DB_URL = 'https://quizlive-wcw-default-rtdb.asia-southeast1.firebasedatabase.app';
  const PATH = '/quiz/site/festival.json';
  const KEY = 'gc_fest';

  // เทศกาลที่รองรับ — เพิ่มเทศกาลใหม่ได้ที่นี่ (from/to = ช่วงแสดงอัตโนมัติ, รูปแบบ YYYY-MM-DD)
  const FESTS = {
    loykrathong: {
      name: 'ลอยกระทง', emoji: '🪷', greet: 'สุขสันต์วันลอยกระทง',
      // วันลอยกระทง 2569 = อังคาร 24 พ.ย. 2569 (ขึ้น 15 ค่ำ เดือน 12) → แสดงล่วงหน้า 1 สัปดาห์
      windows: [['2026-11-17', '2026-11-25']],
      render: renderLoyKrathong,
    },
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

  let current = null;
  function apply(cfg) {
    const f = activeFest(cfg);
    if (f === current) return;
    clear(); current = f;
    if (f) { document.documentElement.dataset.fest = f; FESTS[f].render(); if (f === 'loykrathong') introLoyKrathong(); }
    else { delete document.documentElement.dataset.fest; undoIntro(); }
    window.dispatchEvent(new CustomEvent('gc-fest', { detail: { fest: f, mode: cfg.mode || 'auto' } }));
  }
  function clear() { ['gcFest', 'gcFestHi', 'gcFestFront'].forEach((id) => document.getElementById(id)?.remove()); document.querySelectorAll('.lk-hero,.lk-tag').forEach((e) => e.remove()); }

  /* ── ลอยกระทง ── */
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const krathong = (hue, candle = true) => `<svg viewBox="0 0 120 96" aria-hidden="true">
    <ellipse cx="60" cy="80" rx="54" ry="11" fill="#2E9E6A"/>
    ${[...Array(9)].map((_, i) => { const x = 12 + i * 12; return `<path d="M${x - 7} 80 Q${x} 58 ${x + 7} 80 Z" fill="${i % 2 ? '#43B581' : '#36A372'}"/>`; }).join('')}
    <ellipse cx="60" cy="74" rx="40" ry="8" fill="#5BC793"/>
    ${[[-30, 0], [-18, -6], [-6, -9], [6, -9], [18, -6], [30, 0]].map(([dx, dy], i) => `<path d="M${60 + dx - 8} ${70 + dy} Q${60 + dx} ${46 + dy} ${60 + dx + 8} ${70 + dy} Q${60 + dx} ${62 + dy} ${60 + dx - 8} ${70 + dy} Z" fill="${i % 2 ? hue : '#FFF4F8'}" stroke="#F19CBB" stroke-width="1.2"/>`).join('')}
    <circle cx="44" cy="58" r="3.2" fill="#FFD45E"/><circle cx="76" cy="58" r="3.2" fill="#FFD45E"/><circle cx="60" cy="54" r="3.2" fill="#FF8FB1"/>
    ${candle ? `<rect x="57" y="30" width="6" height="24" rx="2" fill="#FFF6D8" stroke="#E9C46A" stroke-width="1"/>
    <line x1="70" y1="52" x2="76" y2="30" stroke="#B5651D" stroke-width="1.6"/><line x1="73" y1="52" x2="80" y2="32" stroke="#B5651D" stroke-width="1.6"/>
    <circle cx="76" cy="29.5" r="1.4" fill="#FF6B3D"/><circle cx="80" cy="31.5" r="1.4" fill="#FF6B3D"/>
    <g class="gf-flame"><ellipse cx="60" cy="24" rx="4.2" ry="7.5" fill="#FFB43D"/><ellipse cx="60" cy="26" rx="2.2" ry="4" fill="#FFF3B0"/></g>
    <circle cx="60" cy="24" r="12" fill="#FFD45E" opacity=".22" class="gf-glow"/>` : ''}
  </svg>`;
  const lantern = `<svg viewBox="0 0 40 52" aria-hidden="true"><defs><radialGradient id="gfL" cx=".5" cy=".7" r=".7"><stop offset="0" stop-color="#FFF1B8"/><stop offset=".55" stop-color="#FFB547"/><stop offset="1" stop-color="#F27B2E"/></radialGradient></defs>
    <path d="M6 6 Q20 -2 34 6 L30 44 Q20 48 10 44 Z" fill="url(#gfL)"/><path d="M10 44 Q20 48 30 44" stroke="#C4581F" stroke-width="1.5" fill="none"/>
    <ellipse cx="20" cy="47" rx="3" ry="2.4" fill="#FFE07A"/></svg>`;

  function renderLoyKrathong() {
    const css = `
      #gcFest{position:fixed;inset:0;z-index:-1;pointer-events:none;overflow:hidden}
      html[data-fest] .sky::before,html[data-fest] .sky::after{z-index:-2}
      #gcFest .gf-moon{position:absolute;top:max(14px,4vh);right:max(14px,5vw);width:clamp(54px,9vw,110px);aspect-ratio:1;border-radius:50%;
        background:radial-gradient(circle at 38% 36%,#FFFDF0 0 30%,#FFF1BF 62%,#FFE08A 100%);
        box-shadow:0 0 30px 10px rgba(255,226,140,.45),0 0 90px 40px rgba(255,214,120,.22);opacity:.95}
      #gcFest .gf-moon::before,#gcFest .gf-moon::after{content:"";position:absolute;border-radius:50%;background:rgba(232,200,120,.35)}
      #gcFest .gf-moon::before{width:18%;height:18%;left:30%;top:52%}#gcFest .gf-moon::after{width:11%;height:11%;left:60%;top:30%}
      #gcFest .gf-lan,#gcFestFront .gf-lan{position:absolute;bottom:-70px;width:clamp(22px,3vw,34px);filter:drop-shadow(0 0 10px rgba(255,180,70,.75));animation:gf-rise var(--d) linear var(--w) infinite}
      #gcFest .gf-lan svg,#gcFestFront .gf-lan svg{width:100%;display:block;animation:gf-sway 3.6s ease-in-out infinite alternate}
      @keyframes gf-rise{0%{transform:translateY(0);opacity:0}8%{opacity:.95}80%{opacity:.85}100%{transform:translateY(calc(-100vh - 140px)) translateX(var(--x));opacity:0}}
      @keyframes gf-sway{from{transform:rotate(-6deg)}to{transform:rotate(6deg)}}
      #gcFest .gf-dusk{position:absolute;inset:0;background:linear-gradient(180deg,rgba(124,92,255,.16) 0%,rgba(255,170,120,.12) 45%,rgba(255,214,150,.10) 70%,rgba(80,130,230,.18) 100%)}
      #gcFestFront{position:fixed;inset:0;z-index:40;pointer-events:none;overflow:hidden}
      #gcFestFront .gf-lan{opacity:.9;width:clamp(18px,2.4vw,28px)}
      @media (prefers-reduced-motion:reduce){#gcFestFront{display:none}}
      .lk-hero{position:absolute;left:-12%;width:124%;bottom:-16%;pointer-events:none;animation:gf-bob 2.8s ease-in-out infinite alternate}
      .lk-hero svg{display:block;width:100%}
      .lk-tag{display:inline-flex;align-items:center;gap:6px;margin-left:6px;padding:4px 12px;border-radius:999px;background:linear-gradient(90deg,#FFB347,#FF6FA0);color:#fff;font-weight:700;font-size:.85em;box-shadow:0 4px 12px rgba(255,140,80,.35)}
      #gcFest .gf-water{position:absolute;left:0;right:0;bottom:0;height:clamp(54px,9vh,92px);
        background:linear-gradient(180deg,rgba(120,190,255,.0),rgba(98,170,245,.45) 30%,rgba(70,140,230,.62));}
      #gcFest .gf-wave{position:absolute;left:-50%;width:200%;height:14px;top:22%;opacity:.55;
        background:radial-gradient(14px 6px at 14px 7px,transparent 60%,rgba(255,255,255,.95) 64%,transparent 72%) 0 0/28px 14px repeat-x;animation:gf-wave 9s linear infinite}
      #gcFest .gf-wave.w2{top:55%;opacity:.35;animation-duration:13s;animation-direction:reverse}
      @keyframes gf-wave{to{transform:translateX(-112px)}}
      #gcFest .gf-k{position:absolute;bottom:calc(clamp(54px,9vh,92px) * .28);width:clamp(62px,9vw,104px);left:-120px;animation:gf-drift var(--d) linear var(--w) infinite}
      #gcFest .gf-k svg{display:block;width:100%;animation:gf-bob 2.8s ease-in-out infinite alternate;transform-origin:50% 90%}
      @keyframes gf-drift{to{left:calc(100vw + 120px)}}
      @keyframes gf-bob{from{transform:translateY(0) rotate(-2.5deg)}to{transform:translateY(-5px) rotate(2.5deg)}}
      #gcFest .gf-flame{transform-origin:60px 30px;animation:gf-flick .5s ease-in-out infinite alternate}
      #gcFest .gf-glow{animation:gf-glowp 1.3s ease-in-out infinite alternate}
      @keyframes gf-flick{from{transform:scale(1,1)}to{transform:scale(.86,1.12)}}
      @keyframes gf-glowp{from{opacity:.14}to{opacity:.32}}
      #gcFest .gf-spark{position:absolute;width:5px;height:5px;border-radius:50%;background:#FFE9A0;box-shadow:0 0 8px 2px rgba(255,225,140,.8);animation:gf-tw 2.4s ease-in-out var(--w) infinite alternate}
      @keyframes gf-tw{from{opacity:.15;transform:scale(.6)}to{opacity:1;transform:scale(1.1)}}
      @media (prefers-reduced-motion:reduce){#gcFest *,#gcFest *::before{animation:none!important}#gcFest .gf-lan{bottom:auto;top:var(--top)}#gcFest .gf-k{left:var(--l)}}
      @media print{#gcFest,#gcFestHi{display:none!important}}
      #gcFestHi{position:fixed;left:50%;bottom:calc(clamp(54px,9vh,92px) + 14px + env(safe-area-inset-bottom));transform:translateX(-50%) translateY(20px);z-index:60;
        display:flex;align-items:center;gap:10px;padding:10px 12px 10px 16px;border-radius:999px;background:rgba(255,255,255,.95);color:#3A2E5C;
        box-shadow:0 10px 30px rgba(60,48,130,.22);font:600 15px/1.3 'IBM Plex Sans Thai Looped','Noto Sans Thai',system-ui,sans-serif;opacity:0;transition:opacity .4s,transform .4s;width:max-content;max-width:calc(100vw - 24px);white-space:nowrap}
      #gcFestHi.on{opacity:1;transform:translateX(-50%) translateY(0)}
      #gcFestHi button{border:0;background:#F1EEFC;color:#3A2E5C;width:30px;height:30px;border-radius:50%;font-size:15px;cursor:pointer;flex:none}
      @media (max-width:700px){#gcFestHi{bottom:calc(84px + env(safe-area-inset-bottom))}}`;
    const phone = innerWidth < 700, rm = reduce();
    const nK = phone ? 3 : 5, nL = phone ? 5 : 9, hues = ['#FFB4C8', '#FFD08A', '#C9B8FF', '#9FE3C4', '#FFC2D6'];
    const ks = [...Array(nK)].map((_, i) => `<div class="gf-k" style="--d:${34 + i * 7}s;--w:${-(i * (34 / nK) * 1.9).toFixed(1)}s;--l:${(8 + i * (84 / nK)).toFixed(0)}vw">${krathong(hues[i % hues.length])}</div>`).join('');
    const ls = [...Array(nL)].map((_, i) => `<div class="gf-lan" style="left:${(4 + i * (92 / nL) + (i % 2) * 3).toFixed(0)}vw;--d:${22 + (i % 4) * 5}s;--w:${-(i * 3.1).toFixed(1)}s;--x:${(i % 2 ? 1 : -1) * (20 + i * 3)}px;--top:${(18 + (i * 37) % 55)}vh">${lantern}</div>`).join('');
    const sp = [...Array(phone ? 6 : 12)].map((_, i) => `<i class="gf-spark" style="left:${(7 + i * 83) % 96}vw;top:${(6 + i * 29) % 60}vh;--w:${-(i * .7).toFixed(1)}s"></i>`).join('');
    const el = document.createElement('div'); el.id = 'gcFest'; el.setAttribute('aria-hidden', 'true');
    el.innerHTML = `<style>${css}</style><div class="gf-dusk"></div><div class="gf-moon"></div>${sp}${ls}<div class="gf-water"><i class="gf-wave"></i><i class="gf-wave w2"></i></div>${ks}`;
    document.body.prepend(el);
    // โคมลอยเล็ก ๆ ลอยผ่าน "ด้านหน้า" เนื้อหา (แตะทะลุได้ ไม่บังการกด) → เห็นบรรยากาศเทศกาลชัดทุกหน้า
    const nF = phone ? 4 : 7;
    const fr = document.createElement('div'); fr.id = 'gcFestFront'; fr.setAttribute('aria-hidden', 'true');
    fr.innerHTML = [...Array(nF)].map((_, i) => `<div class="gf-lan" style="left:${(8 + i * (84 / nF) + (i % 2) * 5).toFixed(0)}vw;--d:${18 + (i % 3) * 6}s;--w:${-(i * 4.3 + 2).toFixed(1)}s;--x:${(i % 2 ? 1 : -1) * (24 + i * 4)}px">${lantern}</div>`).join('');
    document.body.append(fr);
    // หน้าเมนูรวม: ผีน้อยในแบนเนอร์นั่งกระทง + ป้ายเทศกาล
    const hg = document.getElementById('heroGhost');
    if (hg && !hg.querySelector('.lk-hero')) { hg.style.position = 'relative'; hg.insertAdjacentHTML('beforeend', `<div class="lk-hero">${krathong('#FFB4C8', false)}</div>`); }
    const ht = document.querySelector('.hero-tag');
    if (ht && !document.querySelector('.lk-tag')) ht.insertAdjacentHTML('afterend', '<span class="lk-tag">🪷 เทศกาลลอยกระทง</span>');
    if (rm) return;
    // หน้าที่มี INTRO อยู่ (เมนูรวม/เข้าเกม) ทักทายใน INTRO แล้ว — ไม่แสดงป้ายซ้ำ เพื่อไม่บังปุ่มเริ่ม
    const it = document.getElementById('intro'); if (it && !it.hidden) return;
    // ทักทายสั้น ๆ ครั้งเดียวต่อการเปิดเว็บ (ต่อเซสชัน)
    let shown = false; try { shown = sessionStorage.getItem('gc_fest_hi') === '1'; sessionStorage.setItem('gc_fest_hi', '1'); } catch (e) {}
    if (shown) return;
    const hi = document.createElement('div'); hi.id = 'gcFestHi'; hi.setAttribute('role', 'status');
    hi.innerHTML = `<span>🪷 สุขสันต์วันลอยกระทง 🌕</span><button type="button" aria-label="ปิด">✕</button>`;
    document.body.append(hi);
    const close = () => { hi.classList.remove('on'); setTimeout(() => hi.remove(), 450); };
    hi.querySelector('button').onclick = close;
    setTimeout(() => hi.classList.add('on'), 700); setTimeout(close, 6500);
  }

  /* ── INTRO แบบลอยกระทง (หน้าเมนูรวม .gc-intro และหน้าเข้าเกม .intro) ── */
  function introLoyKrathong() {
    const intro = document.getElementById('intro');
    if (!intro || intro.classList.contains('lk')) return;
    if (intro.hidden) {
      // หน้าเมนูรวม: ถ้า INTRO ปกติเคยเล่นไปแล้ว ให้เล่น INTRO ลอยกระทงอีก 1 ครั้งต่อเครื่อง
      let seen = true; try { seen = localStorage.getItem('gc_lk_intro_2569') === '1'; } catch (e) {}
      if (seen || !window.gcOpenIntro || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      try { localStorage.setItem('gc_lk_intro_2569', '1'); } catch (e) {}
      window.gcOpenIntro();
    }
    try { localStorage.setItem('gc_lk_intro_2569', '1'); } catch (e) {}
    const hub = intro.classList.contains('gc-intro');
    if (!document.getElementById('gcLkCss')) {
      const st = document.createElement('style'); st.id = 'gcLkCss';
      st.textContent = `
      #intro.lk{isolation:isolate;background:linear-gradient(180deg,#120F33 0%,#241D5C 38%,#4A3787 66%,#2E4C9A 100%)!important;animation:none!important}
      #intro.lk .lk-layer{position:absolute;inset:0;z-index:-1;pointer-events:none;overflow:hidden}
      .lk-star{position:absolute;width:3px;height:3px;border-radius:50%;background:#fff;box-shadow:0 0 6px 1px rgba(255,255,255,.8);animation:lk-tw 2.6s ease-in-out var(--w) infinite alternate}
      @keyframes lk-tw{from{opacity:.2}to{opacity:1}}
      .lk-moon{position:absolute;top:max(5vh,28px);left:50%;translate:-50% 0;width:clamp(120px,30vmin,260px);aspect-ratio:1;border-radius:50%;
        background:radial-gradient(circle at 40% 38%,#FFFDF2 0 28%,#FFF0C2 60%,#FFDB86 100%);box-shadow:0 0 50px 18px rgba(255,224,140,.45),0 0 140px 70px rgba(255,200,110,.2);
        opacity:0;animation:lk-moon 1.6s ease .1s forwards}
      .lk-moon::before,.lk-moon::after{content:"";position:absolute;border-radius:50%;background:rgba(226,190,110,.32)}
      .lk-moon::before{width:16%;height:16%;left:26%;top:56%}.lk-moon::after{width:10%;height:10%;left:62%;top:28%}
      @keyframes lk-moon{from{opacity:0;transform:translateY(30px) scale(.8)}to{opacity:1;transform:none}}
      .lk-water{position:absolute;left:0;right:0;bottom:0;height:24vh;background:linear-gradient(180deg,rgba(70,110,200,.0),#3A5DB0 18%,#22397A 100%)}
      .lk-water::before{content:"";position:absolute;left:50%;top:6%;width:min(36vw,220px);height:80%;translate:-50% 0;
        background:repeating-linear-gradient(180deg,rgba(255,230,160,.55) 0 4px,transparent 4px 12px);filter:blur(1px);opacity:.7;
        mask:radial-gradient(ellipse at 50% 0,#000 30%,transparent 70%);-webkit-mask:radial-gradient(ellipse at 50% 0,#000 30%,transparent 70%);animation:lk-shim 2.2s ease-in-out infinite alternate}
      @keyframes lk-shim{to{opacity:.35;transform:scaleX(1.15)}}
      .lk-wave{position:absolute;left:-50%;width:200%;height:12px;opacity:.4;background:radial-gradient(12px 5px at 12px 6px,transparent 60%,#fff 64%,transparent 72%) 0 0/24px 12px repeat-x;animation:lk-wv 8s linear infinite}
      @keyframes lk-wv{to{transform:translateX(-96px)}}
      .lk-k{position:absolute;bottom:calc(24vh * var(--y));width:clamp(56px,11vmin,96px);left:-110px;animation:lk-drift var(--d) linear var(--w) infinite}
      .lk-k svg,.lk-ride svg{display:block;width:100%}
      .lk-k svg{animation:lk-bob 2.6s ease-in-out infinite alternate}
      @keyframes lk-drift{to{left:calc(100% + 110px)}}
      @keyframes lk-bob{from{transform:translateY(0) rotate(-3deg)}to{transform:translateY(-5px) rotate(3deg)}}
      .lk-lan{position:absolute;bottom:-60px;width:clamp(20px,4vmin,34px);filter:drop-shadow(0 0 12px rgba(255,180,70,.85));animation:lk-rise var(--d) linear var(--w) infinite}
      .lk-lan svg{display:block;width:100%;animation:lk-sway 3.4s ease-in-out infinite alternate}
      @keyframes lk-rise{0%{transform:translateY(0);opacity:0}10%{opacity:1}85%{opacity:.85}100%{transform:translateY(-105vh) translateX(var(--x));opacity:0}}
      @keyframes lk-sway{from{transform:rotate(-7deg)}to{transform:rotate(7deg)}}
      .lk-k .gf-flame,.lk-ride .gf-flame{transform-origin:60px 30px;animation:lk-fl .5s ease-in-out infinite alternate}
      @keyframes lk-fl{from{transform:scale(1)}to{transform:scale(.85,1.14)}}
      /* หน้าเมนูรวม */
      .gc-intro.lk .fog{opacity:.18}
      .gc-intro.lk .mini-ghosts{display:none}
      .gc-intro.lk .in-stage{margin-top:min(16vh,150px)}
      .gc-intro.lk .lk-ride{position:absolute;left:-14%;width:128%;bottom:-24%;opacity:0;animation:g-pop .9s cubic-bezier(.34,1.7,.5,1) .55s forwards}
      .gc-intro.lk .lk-ride svg{animation:lk-bob 2.6s ease-in-out 1.5s infinite alternate}
      .gc-intro.lk .in-title{margin-top:calc(8px + min(5vh,40px))}
      .gc-intro.lk .poof i{background:#FFE7A3;box-shadow:0 0 14px rgba(255,214,120,.8)}
      .gc-intro.lk .in-title span{color:#FFE7A3;text-shadow:0 0 18px rgba(255,214,120,.55),0 4px 0 #3B2F7A}
      .gc-intro.lk .in-title span:nth-child(n+7){color:#FFB9D3}
      .gc-intro.lk .in-sub{color:#EDE6FF}
      .gc-intro.lk .in-skip{background:rgba(255,255,255,.16);color:#fff}
      .gc-intro.lk .in-go{background:linear-gradient(135deg,#FFB347,#FF6FA0);box-shadow:0 8px 0 #B84F2E,0 14px 34px rgba(255,170,80,.5)}
      .gc-intro.lk .in-bubble{background:#FFF8E6}
      /* หน้าเข้าเกม (นักเรียน) */
      .intro.lk .dawn,.intro.lk .clouds,.intro.lk .bubbles{display:none}
      .intro.lk .intro-title span{text-shadow:0 0 16px rgba(255,255,255,.35),0 5px 0 #2A2363}
      .intro.lk .intro-tag,.intro.lk .intro-hint{color:#EDE6FF}
      .intro.lk .hill{background:radial-gradient(ellipse at 50% 30%,rgba(255,230,160,.5),rgba(255,230,160,.12) 60%,transparent 72%)}
      .intro.lk .intro-go{background:linear-gradient(90deg,#FFB347,#FF6FA0);box-shadow:0 8px 0 #B84F2E,0 14px 30px rgba(255,170,80,.5)}
      .intro.lk .lk-moon{left:auto;right:max(6vw,16px);translate:0 0;width:clamp(80px,22vmin,170px)}
      .intro.lk .lk-water{height:20vh}
      .lk-hello{display:block;margin-top:4px;font:600 clamp(15px,3.6vw,19px)/1.4 'IBM Plex Sans Thai Looped',system-ui,sans-serif;color:#FFE7A3;text-shadow:0 0 12px rgba(255,214,120,.6)}
      @media (prefers-reduced-motion:reduce){#intro.lk *{animation-duration:.01s!important;animation-iteration-count:1!important}.lk-lan{bottom:auto;top:var(--top)}.lk-k{left:var(--l)}}
      @media (max-height:640px){.gc-intro.lk .in-stage{margin-top:min(12vh,90px)}}`;
      document.head.append(st);
    }
    const phone = innerWidth < 700;
    const hues = ['#FFB4C8', '#FFD08A', '#C9B8FF', '#9FE3C4'];
    const stars = [...Array(phone ? 26 : 46)].map((_, i) => `<i class="lk-star" style="left:${(i * 37 + 11) % 100}%;top:${(i * 53 + 7) % 62}%;--w:${-(i * .37).toFixed(2)}s;transform:scale(${(.6 + (i % 4) * .25).toFixed(2)})"></i>`).join('');
    const lans = [...Array(phone ? 7 : 12)].map((_, i) => `<div class="lk-lan" style="left:${(5 + i * (90 / (phone ? 7 : 12))).toFixed(0)}%;--d:${11 + (i % 4) * 3}s;--w:${-(i * 1.7).toFixed(1)}s;--x:${(i % 2 ? 1 : -1) * (14 + i * 3)}px;--top:${15 + (i * 29) % 50}%">${lantern}</div>`).join('');
    const ks = [...Array(phone ? 3 : 5)].map((_, i) => `<div class="lk-k" style="--y:${[.12, .42, .24, .52, .3][i]};--d:${20 + i * 5}s;--w:${-(i * 6.3).toFixed(1)}s;--l:${10 + i * 18}%">${krathong(hues[i % 4])}</div>`).join('');
    const layer = document.createElement('div'); layer.className = 'lk-layer'; layer.setAttribute('aria-hidden', 'true');
    layer.innerHTML = `${stars}<div class="lk-moon"></div>${lans}<div class="lk-water"><i class="lk-wave" style="top:16%"></i><i class="lk-wave" style="top:48%;animation-duration:12s;animation-direction:reverse"></i></div>${ks}`;
    intro.prepend(layer);
    intro.classList.add('lk');
    if (hub) {
      const g = intro.querySelector('#inGhost');
      if (g && !intro.querySelector('.lk-ride')) { const r = document.createElement('div'); r.className = 'lk-ride'; r.setAttribute('aria-hidden', 'true'); r.innerHTML = krathong('#FFB4C8', false); g.after(r); }
      const sub = intro.querySelector('.in-sub'); if (sub && !sub.querySelector('.lk-hello')) sub.insertAdjacentHTML('beforeend', '<span class="lk-hello">🪷 สุขสันต์วันลอยกระทง 2569 🌕</span>');
    } else {
      const tag = intro.querySelector('.intro-tag'); if (tag && !tag.querySelector('.lk-hello')) tag.insertAdjacentHTML('beforeend', '<span class="lk-hello">🪷 ลอยกระทงนี้ ตอบไว ตอบถูก! 🏮</span>');
    }
    window.dispatchEvent(new CustomEvent('gc-fest-intro', { detail: { fest: 'loykrathong', lines: hub
      ? ['สุขสันต์วันลอยกระทง 🪷', 'ลอยความทุกข์ไปกับสายน้ำ~', 'ขอให้เรียนเก่ง ๆ นะ 🌕', 'ไปลอยกระทงกัน!']
      : ['ลอยกระทงกัน! 🪷', 'ขอให้ตอบถูกทุกข้อ 🌕', 'ลอยความเครียดไปกับน้ำ~', 'พร้อมยัง?'] } }));
  }
  function undoIntro() {
    const intro = document.getElementById('intro'); if (!intro) return;
    intro.classList.remove('lk'); intro.querySelectorAll('.lk-layer,.lk-ride,.lk-hello').forEach((e) => e.remove());
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
    decorateIntro: () => { if (current === 'loykrathong') introLoyKrathong(); },
    /** บันทึกโหมด ('auto' | 'off' | ชื่อเทศกาล) — ต้องส่ง idToken ของครูเพื่อให้ทุกเครื่องเห็น; ถ้าไม่สำเร็จจะใช้เฉพาะเครื่องนี้ */
    async set(mode, idToken) {
      const v = { mode, at: Date.now() };
      write(v); apply(v);
      if (!idToken) return { ok: false, local: true };
      try {
        const r = await fetch(`${DB_URL}${PATH}?auth=${encodeURIComponent(idToken)}`, { method: 'PUT', body: JSON.stringify(v) });
        return r.ok ? { ok: true } : { ok: false, local: true, status: r.status };
      } catch (e) { return { ok: false, local: true }; }
    },
  };
})();
