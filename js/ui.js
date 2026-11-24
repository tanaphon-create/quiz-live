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

// โหมดเกม
export const MODES = {
  classic: { icon: '🏆', name: 'แข่งเดี่ยว', desc: 'ตอบถูก + เร็ว ได้คะแนนมาก' },
  team: { icon: '👥', name: 'แข่งเป็นทีม', desc: 'แบ่งทีมอัตโนมัติ คะแนนทีม = ค่าเฉลี่ยสมาชิก' },
  survival: { icon: '❤️', name: 'เอาตัวรอด', desc: 'ตอบผิดเสียหัวใจ หมดหัวใจตกรอบ คนรอดสุดท้ายชนะ' },
};
export const TEAMS = [
  { name: 'ทีมแดง', c: '#FF5D73', e: '🔥' },
  { name: 'ทีมฟ้า', c: '#3BA3FF', e: '🌊' },
  { name: 'ทีมเหลือง', c: '#F5A524', e: '⚡' },
  { name: 'ทีมเขียว', c: '#22C58B', e: '🍀' },
];
export const hearts = (n, max = 3) => '❤️'.repeat(Math.max(0, n)) + '🤍'.repeat(Math.max(0, max - n));
// เรียงผู้เล่นตามโหมด: เอาตัวรอด = ผู้ที่ยังรอดก่อน แล้วผู้ที่ตกรอบทีหลังก่อน
export function sortPlayers(list, mode) {
  return list.sort((a, b) => {
    if (mode === 'survival') {
      const A = (a.hearts ?? 1) > 0, B = (b.hearts ?? 1) > 0;
      if (A !== B) return A ? -1 : 1;
      if (!A && a.outAt !== b.outAt) return (b.outAt ?? -1) - (a.outAt ?? -1);
    }
    return (b.score || 0) - (a.score || 0) || (a.name || '').localeCompare(b.name || '', 'th');
  });
}

// โหมดทีมโหวต: นักเรียนใส่เลขทีมเอง สมาชิกโหวต เสียงข้างมากคือคำตอบทีม
MODES.vote = { icon: '🗳️', name: 'ทีมโหวต', desc: 'ใส่เลขทีมเอง สมาชิกโหวต เสียงข้างมากคือคำตอบทีม' };
export const VCOLORS = ['#FF5D73', '#3BA3FF', '#F5A524', '#22C58B', '#A66BFF', '#FF8A3D', '#14B8A6', '#EC4899'];
const NUM_E = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣'];
export const teamInfo = (mode, k) => (mode === 'vote' ? { name: `ทีม ${k + 1}`, c: VCOLORS[k % 8], e: NUM_E[k] || '#' } : TEAMS[k]);
// votes = [{ choice, at }] — คืนตัวเลือกที่ได้เสียงมากที่สุด ถ้าเสมอ เลือกตัวที่ได้เสียงครบจำนวนนั้นก่อน (เร็วกว่า)
export function teamDecision(votes) {
  if (!votes.length) return null;
  const sorted = [...votes].sort((a, b) => a.at - b.at);
  const cnt = {}, reach = {};
  for (const v of sorted) { cnt[v.choice] = (cnt[v.choice] || 0) + 1; (reach[v.choice] ||= []).push(v.at); }
  const max = Math.max(...Object.values(cnt));
  const tied = Object.keys(cnt).filter((c) => cnt[c] === max).sort((a, b) => reach[a][max - 1] - reach[b][max - 1]);
  const c = +tied[0];
  return { choice: c, count: max, at: reach[c][max - 1], counts: cnt, tie: tied.length > 1 };
}

// มาสคอตประจำกลุ่ม (โหมดห้องเรียน) — กลุ่มเดียวกันได้ตัวเดิมเสมอ
export const MASCOTS = [
  { shape: 'bear', body: '#FFB4C2', eyes: 'sparkle', mouth: 'cat', hat: 'bow', acc: 'none' },
  { shape: 'bunny', body: '#A8E1FF', eyes: 'happy', mouth: 'smile', hat: 'none', acc: 'scarf' },
  { shape: 'cat', body: '#FFE38A', eyes: 'sparkle', mouth: 'open', hat: 'crown', acc: 'none' },
  { shape: 'chick', body: '#FFC89B', eyes: 'dot', mouth: 'o', hat: 'sprout', acc: 'none' },
  { shape: 'dino', body: '#B8F0C8', eyes: 'wink', mouth: 'grin', hat: 'cap', acc: 'none' },
  { shape: 'round', body: '#B9B8FF', eyes: 'star', mouth: 'smile', hat: 'wizard', acc: 'none' },
  { shape: 'bean', body: '#FFC89B', eyes: 'heart', mouth: 'kiss', hat: 'flower', acc: 'none' },
  { shape: 'ghost', body: '#FFFFFF', eyes: 'sparkle', mouth: 'cat', hat: 'halo', acc: 'none' },
  { shape: 'bear', body: '#D9C3A5', eyes: 'happy', mouth: 'tongue', hat: 'party', acc: 'none' },
  { shape: 'bunny', body: '#FFB4C2', eyes: 'sparkle', mouth: 'o', hat: 'flower', acc: 'none' },
  { shape: 'cat', body: '#E0B8FF', eyes: 'dot', mouth: 'cat', hat: 'beanie', acc: 'none' },
  { shape: 'dino', body: '#9EE6DF', eyes: 'sparkle', mouth: 'smile', hat: 'frog', acc: 'none' },
];
export const mascotOf = (g) => g?.avatar || MASCOTS[((g?.no || 1) - 1) % MASCOTS.length];

// โหมดยึดพื้นที่: สุ่มฝั่ง แต่ละคนตอบคำถามบนมือถือตัวเอง ถูก 1 ข้อ = ยึด 1 ช่อง
MODES.land = { icon: '🗺️', name: 'ยึดพื้นที่', desc: 'สุ่มฝั่ง ตอบบนมือถือตัวเอง ถูก 1 ข้อ ยึด 1 ช่อง พื้นที่มากกว่าชนะ' };
export const LAND_LOCK = 3000; // ตอบผิด รอ 3 วินาที
export const LAND_STEAL = 3;   // ถูกติดกันครบ 3 ข้อ แย่งช่องจากฝั่งตรงข้ามได้อีก 1 ช่อง
const hash32 = (s) => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const rng = (seed) => { let a = seed | 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const shuf = (n, r) => { const a = [...Array(n).keys()]; for (let i = n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
// ข้อที่ n ของนักเรียนคนนี้ (สุ่มลำดับใหม่ทุกรอบที่วนครบชุด) — ครูกับนักเรียนคำนวณได้ตรงกัน
export const landQ = (uid, n, N) => shuf(N, rng(hash32(uid + ':' + Math.floor(n / N))))[n % N];
// สลับตำแหน่งตัวเลือกทุกครั้ง (จำตำแหน่งไม่ได้ ต้องจำเนื้อหา)
export const landPerm = (uid, n, k) => shuf(k, rng(hash32(uid + '#' + n)));
