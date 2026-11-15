export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// สัญลักษณ์ประจำตัวเลือก (รูปร่าง + สี ช่วยให้เด็กตาบอดสีแยกได้)
export const SHAPES = [
  '<svg viewBox="0 0 24 24"><path d="M12 2.5l2.8 6.3 6.9.6-5.2 4.6 1.6 6.8L12 17.2l-6.1 3.6 1.6-6.8-5.2-4.6 6.9-.6z"/></svg>',
  '<svg viewBox="0 0 24 24"><path d="M12 21s-7.6-4.6-9.6-9.4C1 8.3 3.1 4.6 6.7 4.6c2.1 0 3.5 1.1 5.3 3 1.8-1.9 3.2-3 5.3-3 3.6 0 5.7 3.7 4.3 7C19.6 16.4 12 21 12 21z"/></svg>',
  '<svg viewBox="0 0 24 24"><path d="M20.5 14.6A8.6 8.6 0 0 1 9.4 3.5a8.6 8.6 0 1 0 11.1 11.1z"/></svg>',
  '<svg viewBox="0 0 24 24"><path d="M13.5 2L4 13.8h6.4L9.2 22l9.8-12.3h-6.6z"/></svg>',
];

export function show(id) {
  $$('.screen').forEach((s) => s.classList.toggle('on', s.id === 'scr-' + id));
  window.scrollTo(0, 0);
}

export function toast(msg, ms = 2400) {
  let t = $('#toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.append(t); }
  t.textContent = msg;
  t.classList.add('on');
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove('on'), ms);
}

export function countUp(node, from, to, ms = 1200) {
  const t0 = performance.now();
  const step = (t) => {
    const k = Math.min(1, (t - t0) / ms);
    const e = 1 - Math.pow(1 - k, 3);
    node.textContent = Math.round(from + (to - from) * e).toLocaleString('th-TH');
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// พลุกระดาษ
export function confetti(n = 160, ms = 4500) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = document.createElement('canvas');
  c.className = 'confetti';
  document.body.append(c);
  const x = c.getContext('2d');
  const dpr = devicePixelRatio || 1;
  const W = (c.width = innerWidth * dpr), H = (c.height = innerHeight * dpr);
  const cols = ['#FF5D73', '#3BA3FF', '#FFC93C', '#22C58B', '#C084FC', '#fff'];
  const ps = Array.from({ length: n }, () => ({
    x: W / 2 + (Math.random() - 0.5) * W * 0.3, y: H * 0.35,
    vx: (Math.random() - 0.5) * 26 * dpr, vy: (-Math.random() * 22 - 8) * dpr,
    r: (5 + Math.random() * 7) * dpr, a: Math.random() * 6, va: (Math.random() - 0.5) * 0.4,
    c: cols[(Math.random() * cols.length) | 0],
  }));
  const t0 = performance.now();
  (function frame(t) {
    x.clearRect(0, 0, W, H);
    for (const p of ps) {
      p.vy += 0.55 * dpr; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.a += p.va;
      x.save(); x.translate(p.x, p.y); x.rotate(p.a); x.fillStyle = p.c;
      x.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); x.restore();
    }
    if (t - t0 < ms) requestAnimationFrame(frame); else c.remove();
  })(t0);
}

export function rankScores(players) {
  return Object.entries(players || {})
    .map(([uid, p]) => ({ uid, ...p, score: p.score || 0 }))
    .sort((a, b) => b.score - a.score || (a.name || '').localeCompare(b.name || '', 'th'));
}
