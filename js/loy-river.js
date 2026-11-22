// ฉากแม่น้ำคืนวันเพ็ญ: ฟ้า ดาว พระจันทร์ เงาจันทร์บนน้ำ ฝั่งวัด โคมลอย + กระทงทุกใบลอยไปตามสายน้ำ
import { krathongSVG } from './krathong-art.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const hash = (s) => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967295; };
const lantern = `<svg viewBox="0 0 40 52" aria-hidden="true"><defs><radialGradient id="lrL" cx=".5" cy=".7" r=".7"><stop offset="0" stop-color="#FFF1B8"/><stop offset=".55" stop-color="#FFB547"/><stop offset="1" stop-color="#F27B2E"/></radialGradient></defs><path d="M6 6 Q20 -2 34 6 L30 44 Q20 48 10 44 Z" fill="url(#lrL)"/><ellipse cx="20" cy="47" rx="3" ry="2.4" fill="#FFE07A"/></svg>`;
// ฝั่งตรงข้าม: แนวไม้ เจดีย์ ศาลา และไฟดวงเล็ก ๆ
const shore = `<svg viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true">
  <path d="M0 92 C40 70 70 84 100 74 C130 60 160 80 190 70 C230 54 260 76 300 66 L300 120 L0 120 Z M880 70 C920 50 950 72 990 62 C1030 48 1060 70 1100 60 C1140 52 1170 70 1200 64 L1200 120 L880 120 Z" fill="#0A0F2B"/>
  <path d="M560 96 L560 70 L572 70 L574 52 Q588 40 590 24 L592 6 L594 24 Q596 40 610 52 L612 70 L624 70 L624 96 Z" fill="#0A0F2B"/>
  <path d="M640 96 L640 78 L700 78 L712 66 L628 66 L640 78 Z M650 78 h50 v18 h-50 Z" fill="#0A0F2B"/>
  <path d="M0 100 L1200 96 L1200 120 L0 120 Z" fill="#0A0F2B"/>
  ${[[120, 92], [210, 88], [330, 96], [470, 98], [590, 60], [676, 86], [760, 97], [930, 88], [1040, 84], [1150, 90]].map(([x, y], i) => `<circle class="lr-sh-l" style="--w:${-i * .7}s" cx="${x}" cy="${y}" r="2.6" fill="#FFC86B"/>`).join('')}
</svg>`;

export function createRiver(root, { showWish = true, max = 150, compact = false } = {}) {
  root.classList.add('lr'); if (compact) root.classList.add('lr-compact');
  const stars = [...Array(compact ? 30 : 70)].map((_, i) => `<i class="lr-star" style="left:${(i * 37.7) % 100}%;top:${(i * 23.3) % 40}%;--w:${-(i * .41).toFixed(2)}s;--s:${1 + (i % 3)}px"></i>`).join('');
  const lans = [...Array(compact ? 5 : 11)].map((_, i) => `<div class="lr-lan" style="left:${(6 + i * 8.7) % 96}%;--d:${26 + (i % 4) * 7}s;--w:${-(i * 4.3).toFixed(1)}s;--x:${(i % 2 ? 1 : -1) * (20 + i * 4)}px;--sz:${10 + (i % 3) * 5}px">${lantern}</div>`).join('');
  const glints = [...Array(compact ? 14 : 26)].map((_, i) => `<i class="lr-glint" style="top:${(i * 3.9) % 100}%;--w:${-(i * .37).toFixed(2)}s;--l:${(i * 17) % 60 - 30}px;width:${20 + (i % 5) * 14}px"></i>`).join('');
  root.innerHTML = `<div class="lr-sky">${stars}<div class="lr-moon"><b></b></div>${lans}</div>
    <div class="lr-shore">${shore}</div>
    <div class="lr-water"><div class="lr-moonpath">${glints}</div><i class="lr-wave w1"></i><i class="lr-wave w2"></i><i class="lr-wave w3"></i><div class="lr-boats"></div></div>
    <div class="lr-bubble" hidden></div>`;
  const boats = root.querySelector('.lr-boats'), bubble = root.querySelector('.lr-bubble');
  const els = new Map(); let items = {}, wishOn = showWish, wishH = null;

  function place(el, uid, it, fresh) {
    const depth = 0.1 + hash(uid + 'd') * 0.88;              // 0 = ไกล (ใกล้ฝั่ง) · 1 = ใกล้คนดู
    const dur = (compact ? 70 : 110) - depth * 45;
    const phase = fresh ? 0.22 + Math.random() * 0.4 : hash(uid + 'p');
    el.style.cssText = `--top:${(depth * 74).toFixed(1)}%;--w:${(compact ? 15 : 5.5) + depth * (compact ? 18 : 8.5)}%;--d:${dur.toFixed(1)}s;--delay:${(-dur * phase).toFixed(1)}s;--bob:${(2.6 + hash(uid) * 1.6).toFixed(2)}s;z-index:${Math.round(depth * 100)}`;
  }
  function render(uid, it) {
    let el = els.get(uid); const key = JSON.stringify([it.d, it.name, it.wish, it.showWish]);
    if (el && el.dataset.k === key) return;
    const fresh = !el && rendered;
    if (!el) { el = document.createElement('div'); el.className = 'lr-k'; els.set(uid, el); boats.append(el); place(el, uid, it, fresh); }
    el.dataset.k = key;
    el.innerHTML = `<div class="lr-bob">${krathongSVG(it.d)}<i class="lr-ref"></i></div><span class="lr-name">${esc(it.name)}</span>`;
    if (fresh) { el.classList.add('lr-new'); setTimeout(() => el.classList.remove('lr-new'), 7000); say(it, el, 6500); }
  }
  let rendered = false;
  function update(next) {
    items = next || {};
    const list = Object.entries(items).filter(([, it]) => it && it.d).sort((a, b) => (b[1].at || 0) - (a[1].at || 0)).slice(0, max);
    const keep = new Set(list.map(([u]) => u));
    for (const [u, el] of els) if (!keep.has(u)) { el.remove(); els.delete(u); }
    list.forEach(([u, it]) => render(u, it));
    rendered = true;
  }
  function say(it, el, ms = 5000) {
    const wish = wishOn && it.showWish && it.wish ? `<p>“${esc(it.wish)}”</p>` : '';
    bubble.innerHTML = `<b>🪷 ${esc(it.name)}</b>${wish}`; bubble.hidden = false; bubble.classList.remove('on'); void bubble.offsetWidth; bubble.classList.add('on');
    const r = el.getBoundingClientRect(), R = root.getBoundingClientRect();
    bubble.style.left = Math.min(Math.max(r.left - R.left + r.width / 2, 130), R.width - 130) + 'px';
    bubble.style.top = Math.max(r.top - R.top - 8, 60) + 'px';
    clearTimeout(say.h); say.h = setTimeout(() => bubble.classList.remove('on'), ms);
  }
  // หมุนแสดงคำอธิษฐาน (เฉพาะคนที่ยอมให้แสดง)
  function cycle() {
    clearInterval(wishH);
    wishH = setInterval(() => {
      const pool = [...els.entries()].filter(([u]) => items[u]?.showWish && items[u]?.wish && !els.get(u).classList.contains('lr-new'));
      if (!wishOn || !pool.length) return;
      const [u, el] = pool[Math.floor(Math.random() * pool.length)];
      const r = el.getBoundingClientRect(), R = root.getBoundingClientRect();
      if (r.left < R.left + 40 || r.right > R.right - 40) return;
      say(items[u], el, 5200);
    }, 7000);
  }
  cycle();
  return {
    update,
    setShowWish(v) { wishOn = !!v; if (!v) bubble.classList.remove('on'); },
    count: () => els.size,
    destroy() { clearInterval(wishH); root.innerHTML = ''; els.clear(); },
  };
}
