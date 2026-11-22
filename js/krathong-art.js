// กระทงแบบตกแต่งเองได้ (SVG ล้วน) — ใช้ทั้งหน้าทำกระทงของนักเรียนและจอแม่น้ำของครู
// d = { base, leaf, shape, top, side:'a,b', candle, incense, coin, ghost }
let uid = 0;
const PFX = 'kt' + Math.random().toString(36).slice(2, 6);

export const OPTIONS = {
  base: [
    { id: 'banana', emoji: '🍌', name: 'หยวกกล้วย', desc: 'แบบดั้งเดิม ย่อยสลายได้' },
    { id: 'bread', emoji: '🍞', name: 'ขนมปัง', desc: 'ปลากินได้ ไม่เป็นขยะ' },
    { id: 'coconut', emoji: '🥥', name: 'กะลามะพร้าว', desc: 'ทนทาน ลอยได้นาน' },
  ],
  leaf: [
    { id: 'fresh', name: 'ใบตองสด', c: ['#8EDB86', '#3FA34D', '#256F35'], crease: '#BDEDB5' },
    { id: 'young', name: 'ใบตองอ่อน', c: ['#D2F29A', '#8CCB4E', '#558F2C'], crease: '#EBFAC9' },
    { id: 'deep', name: 'ใบตองแก่', c: ['#68BF6C', '#2E7D32', '#1B4D20'], crease: '#9ED7A0' },
    { id: 'pandan', name: 'ใบเตย', c: ['#86E8B4', '#23A26C', '#126B45'], crease: '#C4F5DA' },
  ],
  shape: [
    { id: 'pointed', emoji: '🔺', name: 'กลีบพนม', desc: 'พับแหลม 2 ชั้น' },
    { id: 'round', emoji: '🌹', name: 'กลีบกุหลาบ', desc: 'พับมน อ่อนช้อย' },
    { id: 'tall', emoji: '🏯', name: 'ทรงสูง 3 ชั้น', desc: 'อลังการ' },
  ],
  top: [
    { id: 'lotus-pink', emoji: '🪷', name: 'บัวชมพู' },
    { id: 'lotus-white', emoji: '🤍', name: 'บัวขาว' },
    { id: 'lotus-purple', emoji: '💜', name: 'บัวสาย' },
    { id: 'rose', emoji: '🌹', name: 'กุหลาบแดง' },
    { id: 'orchid', emoji: '🌸', name: 'กล้วยไม้' },
    { id: 'marigold', emoji: '🌼', name: 'ดาวเรืองกลุ่ม' },
  ],
  side: [
    { id: 'marigold', emoji: '🌼', name: 'ดาวเรือง' },
    { id: 'jasmine', emoji: '🤍', name: 'มะลิ' },
    { id: 'globe', emoji: '🟣', name: 'บานไม่รู้โรย' },
    { id: 'orchid', emoji: '🌸', name: 'กล้วยไม้' },
    { id: 'rose', emoji: '🌹', name: 'กุหลาบจิ๋ว' },
  ],
  extra: [
    { id: 'candle', emoji: '🕯️', name: 'เทียน' },
    { id: 'incense', emoji: '🥢', name: 'ธูป 3 ดอก' },
    { id: 'coin', emoji: '🪙', name: 'เหรียญ' },
    { id: 'ghost', emoji: '👻', name: 'ผีน้อยนั่งเรือ' },
  ],
};
export const DEFAULT = { base: 'banana', leaf: 'fresh', shape: 'pointed', top: 'lotus-pink', side: 'marigold,jasmine', candle: true, incense: true, coin: false, ghost: false };
const pick = (list, id) => list.find((o) => o.id === id) || list[0];
export function normalize(d = {}) {
  const o = { ...DEFAULT, ...d };
  o.base = pick(OPTIONS.base, o.base).id; o.leaf = pick(OPTIONS.leaf, o.leaf).id; o.shape = pick(OPTIONS.shape, o.shape).id; o.top = pick(OPTIONS.top, o.top).id;
  o.side = String(o.side || '').split(',').filter((k) => OPTIONS.side.some((s) => s.id === k)).slice(0, 5).join(',');
  for (const k of ['candle', 'incense', 'coin', 'ghost']) o[k] = !!o[k];
  return o;
}
export function randomDesign() {
  const r = (l) => l[Math.floor(Math.random() * l.length)].id;
  const side = OPTIONS.side.filter(() => Math.random() < 0.5).map((s) => s.id);
  return normalize({ base: r(OPTIONS.base), leaf: r(OPTIONS.leaf), shape: r(OPTIONS.shape), top: r(OPTIONS.top), side: (side.length ? side : ['marigold']).join(','), candle: true, incense: Math.random() < 0.8, coin: Math.random() < 0.4, ghost: Math.random() < 0.3 });
}

const f1 = (n) => n.toFixed(1);
const rad = (a) => (a * Math.PI) / 180;

/* ── ดอกไม้ ── */
const marigold = (x, y, r) => `<g><circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="#F38B00"/>${[0, 60, 120, 180, 240, 300].map((a) => `<circle cx="${f1(x + r * .55 * Math.cos(rad(a)))}" cy="${f1(y + r * .5 * Math.sin(rad(a)))}" r="${f1(r * .46)}" fill="#FFB12E"/>`).join('')}${[30, 150, 270].map((a) => `<circle cx="${f1(x + r * .3 * Math.cos(rad(a)))}" cy="${f1(y + r * .3 * Math.sin(rad(a)) - r * .15)}" r="${f1(r * .32)}" fill="#FFC94D"/>`).join('')}<circle cx="${f1(x)}" cy="${f1(y - r * .2)}" r="${f1(r * .22)}" fill="#E67600"/></g>`;
const jasmine = (x, y, s = 1) => `<g transform="translate(${f1(x)} ${f1(y)}) scale(${s})">${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="${f1(2.4 * Math.cos(rad(a)))}" cy="${f1(2.4 * Math.sin(rad(a)))}" rx="2.4" ry="1.5" fill="#FFFFFF" stroke="#E8E4D4" stroke-width=".4" transform="rotate(${a} ${f1(2.4 * Math.cos(rad(a)))} ${f1(2.4 * Math.sin(rad(a)))})"/>`).join('')}<circle r="1.2" fill="#F5D65B"/></g>`;
const globe = (x, y, r = 3.6) => `<g><circle cx="${f1(x)}" cy="${f1(y)}" r="${r}" fill="#B23AC9"/><circle cx="${f1(x - r * .3)}" cy="${f1(y - r * .35)}" r="${f1(r * .4)}" fill="#D77BE6"/>${[0, 1, 2, 3, 4, 5].map((i) => `<circle cx="${f1(x + Math.cos(i) * r * .6)}" cy="${f1(y + Math.sin(i * 1.7) * r * .55)}" r=".5" fill="#7E1E92"/>`).join('')}</g>`;
const orchidS = (x, y, s = 1, c = '#B85BD6') => `<g transform="translate(${f1(x)} ${f1(y)}) scale(${s})">${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-3.6" rx="2.6" ry="3.8" fill="${c}" transform="rotate(${a})"/>`).join('')}<ellipse cx="0" cy="1.6" rx="2.4" ry="2" fill="#6D1F8C"/><circle r="1.3" fill="#FFF3B0"/></g>`;
const roseS = (x, y, r = 4.2, c = '#D61F3C') => `<g><circle cx="${f1(x)}" cy="${f1(y)}" r="${r}" fill="${c}"/><path d="M${f1(x - r * .55)} ${f1(y)} a${f1(r * .55)} ${f1(r * .55)} 0 1 1 ${f1(r * .9)} ${f1(r * .2)} a${f1(r * .35)} ${f1(r * .35)} 0 1 1 -${f1(r * .55)} -${f1(r * .3)}" stroke="#8E0F25" stroke-width=".8" fill="none"/></g>`;
const SIDE = { marigold: (x, y) => marigold(x, y, 5.6), jasmine: (x, y) => jasmine(x, y, 1.1), globe: (x, y) => globe(x, y), orchid: (x, y) => orchidS(x, y, .95), rose: (x, y) => roseS(x, y) };

/* ── ใบตองพับ ── */
function fold(x, y, w, h, lean, g, crease, round) {
  const L = x - w / 2, R = x + w / 2, tx = x + lean, ty = y - h;
  const body = round
    ? `M${f1(L)} ${f1(y)} C${f1(L - 1)} ${f1(y - h * .7)} ${f1(tx - w * .42)} ${f1(ty)} ${f1(tx)} ${f1(ty)} C${f1(tx + w * .42)} ${f1(ty)} ${f1(R + 1)} ${f1(y - h * .7)} ${f1(R)} ${f1(y)} Z`
    : `M${f1(L)} ${f1(y)} Q${f1(L + 1)} ${f1(y - h * .62)} ${f1(tx)} ${f1(ty)} Q${f1(R - 1)} ${f1(y - h * .62)} ${f1(R)} ${f1(y)} Z`;
  const fold2 = round
    ? `<path d="M${f1(x - w * .3)} ${f1(y - 1)} Q${f1(tx)} ${f1(ty + h * .25)} ${f1(x + w * .3)} ${f1(y - 1)}" stroke="${crease}" stroke-width="1" fill="none" opacity=".9"/>`
    : `<path d="M${f1(x)} ${f1(y - 1)} Q${f1(x + lean * .4)} ${f1(y - h * .55)} ${f1(tx)} ${f1(ty + 1.5)}" stroke="${crease}" stroke-width="1.1" fill="none" opacity=".9"/>`;
  return `<path d="${body}" fill="url(#${g})" stroke="#1E5E2E" stroke-width=".8" stroke-linejoin="round"/>${fold2}`;
}
function ring(cx, cy, rx, ry, n, w, h, g, crease, round, part) {
  let out = '';
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / n + Math.PI / n, s = Math.sin(a);
    if ((part === 'back') !== (s < 0)) continue;
    const depth = (s + 1) / 2;
    out += fold(cx + rx * Math.cos(a), cy + ry * s, w * (.82 + depth * .28), h * (.84 + depth * .2), Math.cos(a) * 6, g, crease, round);
  }
  return out;
}

/* ── ดอกกลาง ── */
function topFlower(kind, id) {
  if (kind.startsWith('lotus')) {
    const c = { 'lotus-pink': ['#FF8DB6', '#FFD3E4', '#E2577F'], 'lotus-white': ['#F4F1E6', '#FFFFFF', '#C9C2A8'], 'lotus-purple': ['#A98BFF', '#E5DBFF', '#7154D1'] }[kind];
    const petal = (dx, y, r, s, back) => `<path transform="translate(${100 + dx} ${y}) rotate(${r}) scale(${s})" d="M0 0 C-8 -6 -7 -19 0 -27 C7 -19 8 -6 0 0 Z" fill="url(#${id}lo)" stroke="${c[2]}" stroke-width=".9" opacity="${back ? .92 : 1}"/><path transform="translate(${100 + dx} ${y}) rotate(${r}) scale(${s})" d="M0 -3 L0 -22" stroke="${c[2]}" stroke-width=".6" opacity=".45"/>`;
    return {
      defs: `<linearGradient id="${id}lo" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${c[1]}"/><stop offset=".5" stop-color="${c[1]}"/><stop offset="1" stop-color="${c[0]}"/></linearGradient>`,
      back: [[-14, 86, -28, .9], [14, 86, 28, .9], [0, 84, 0, .95]].map(([a, b, r, s]) => petal(a, b, r, s, true)).join(''),
      front: [[-32, 96, -72, .85], [-22, 92, -46, 1], [-9, 90, -16, 1.08], [9, 90, 16, 1.08], [22, 92, 46, 1], [32, 96, 72, .85]].map(([a, b, r, s]) => petal(a, b, r, s)).join('') + `<ellipse cx="100" cy="88" rx="5" ry="2.6" fill="#F6C945"/>`,
    };
  }
  if (kind === 'rose') {
    const big = (x, y, r) => `<g><circle cx="${x}" cy="${y}" r="${r}" fill="#C8102E"/><circle cx="${x}" cy="${y - 1}" r="${r * .72}" fill="#E0233F"/><path d="M${x - r * .55} ${y} a${r * .55} ${r * .55} 0 1 1 ${r * .95} ${r * .25} a${r * .38} ${r * .38} 0 1 1 -${r * .6} -${r * .35} a${r * .2} ${r * .2} 0 1 1 ${r * .3} ${r * .12}" stroke="#7A0A1E" stroke-width="1.1" fill="none"/></g>`;
    return { defs: '', back: big(86, 84, 9) + big(114, 84, 9), front: big(100, 90, 12) + `<path d="M74 94 q6 -6 12 -2 q-6 4 -12 2 Z M126 94 q-6 -6 -12 -2 q6 4 12 2 Z" fill="#2E7D32"/>` };
  }
  if (kind === 'orchid') {
    return { defs: '', back: orchidS(86, 82, 2, '#C77DEB') + orchidS(114, 82, 2, '#C77DEB'), front: orchidS(100, 88, 2.6, '#A84BCF') + orchidS(80, 92, 1.4, '#E2A6F5') + orchidS(120, 92, 1.4, '#E2A6F5') };
  }
  // ดาวเรืองกลุ่มทรงพุ่ม
  return { defs: '', back: marigold(88, 80, 8) + marigold(112, 80, 8) + marigold(100, 74, 8), front: marigold(80, 90, 8) + marigold(100, 88, 9) + marigold(120, 90, 8) };
}

/** วาดกระทง — คืนค่า <svg> (viewBox 200×170) */
export function krathongSVG(raw, { cls = '' } = {}) {
  const d = normalize(raw), id = PFX + (++uid);
  const L = pick(OPTIONS.leaf, d.leaf), round = d.shape === 'round', tall = d.shape === 'tall';
  const base = {
    banana: { side: ['#E9F0CC', '#C9D99A'], top: '#F3F7DF', line: '#B7C98A', tex: (y) => [74, 90, 110, 126].map((x) => `<path d="M${x} ${y + 3} v10" stroke="#B9CC8C" stroke-width="1" opacity=".6"/>`).join('') },
    bread: { side: ['#E6A75A', '#B86E2A'], top: '#F2C98B', line: '#9A5A22', tex: (y) => [[66, 6], [84, 9], [104, 5], [124, 8], [140, 4]].map(([x, o]) => `<ellipse cx="${x}" cy="${y + o}" rx="1.6" ry="1" fill="#8A4F1C" opacity=".5"/>`).join('') },
    coconut: { side: ['#8A5A33', '#5A361A'], top: '#A87648', line: '#3E2410', tex: (y) => [60, 72, 84, 96, 108, 120, 132, 144].map((x) => `<path d="M${x} ${y + 2} q2 6 0 12" stroke="#3E2410" stroke-width=".8" fill="none" opacity=".5"/>`).join('') },
  }[d.base];
  const tf = topFlower(d.top, id);
  const sides = d.side ? d.side.split(',') : [];
  const spots = [[66, 100], [134, 100], [76, 104], [124, 104], [88, 106], [112, 106], [58, 96], [142, 96]];
  const sideBack = sides.length ? [[72, 94], [128, 94], [86, 92], [114, 92]].map(([x, y], i) => SIDE[sides[i % sides.length]](x, y)).join('') : '';
  const sideFront = sides.length ? spots.map(([x, y], i) => SIDE[sides[(i + 1) % sides.length]](x, y)).join('') : '';
  const g1 = id + 'g1', g2 = id + 'g2', g3 = id + 'g3';
  const candle = d.candle ? `<rect x="96.5" y="48" width="7" height="36" rx="2.5" fill="url(#${id}cd)" stroke="#E2BE63" stroke-width=".8"/><path d="M97 52 q2 4 0 7" stroke="#F5E2A8" stroke-width="2" fill="none"/><path d="M100 48 v-3" stroke="#3A2A1A" stroke-width="1"/>` : '';
  const flame = d.candle ? `<circle cx="100" cy="36" r="22" fill="url(#${id}gl)" class="kt-glow"/><g class="kt-flame"><path d="M100 24 C106 32 107 39 100 45 C93 39 94 32 100 24 Z" fill="url(#${id}fl)"/><ellipse cx="100" cy="40" rx="2.2" ry="3.4" fill="#FFFDE8"/></g>` : '';
  const incense = d.incense ? `<path d="M112 86 L121 44 M115 86 L127 47 M118 87 L133 51" stroke="#9A5B2E" stroke-width="1.6" stroke-linecap="round"/><circle cx="121" cy="43.5" r="1.6" fill="#FF5A2A"/><circle cx="127" cy="46.5" r="1.6" fill="#FF5A2A"/><circle cx="133" cy="50.5" r="1.6" fill="#FF5A2A"/>
    <g class="kt-smoke" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".38"><path d="M122 41 q-4 -7 1 -12 q4 -5 0 -11"/><path d="M128 44 q4 -6 -1 -11 q-4 -5 1 -10"/></g>` : '';
  const coin = d.coin ? `<g transform="translate(70 110)"><ellipse rx="6.5" ry="4" fill="#E8B923" stroke="#A67C00" stroke-width="1"/><ellipse rx="4.2" ry="2.4" fill="none" stroke="#FFE27A" stroke-width=".8"/></g>` : '';
  const ghost = d.ghost ? `<g transform="translate(132 104) scale(.42)"><path d="M0 -30 C18 -30 26 -16 26 6 L26 26 Q22 32 17 27 Q12 22 8 28 Q4 33 0 28 Q-4 22 -9 28 Q-14 33 -18 27 Q-23 22 -26 26 L-26 6 C-26 -16 -18 -30 0 -30 Z" fill="#fff" stroke="#3A2E5C" stroke-width="3.5"/><circle cx="-8" cy="-6" r="3.6" fill="#3A2E5C"/><circle cx="8" cy="-6" r="3.6" fill="#3A2E5C"/><ellipse cx="-14" cy="3" rx="4" ry="2.4" fill="#FF8FB1" opacity=".7"/><ellipse cx="14" cy="3" rx="4" ry="2.4" fill="#FF8FB1" opacity=".7"/><path d="M-4 4 q4 4 8 0" stroke="#3A2E5C" stroke-width="2.5" fill="none" stroke-linecap="round"/></g>` : '';
  return `<svg class="kt ${cls}" viewBox="0 0 200 170" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>
    <linearGradient id="${g1}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${L.c[0]}"/><stop offset=".55" stop-color="${L.c[1]}"/><stop offset="1" stop-color="${L.c[2]}"/></linearGradient>
    <linearGradient id="${g2}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${L.c[0]}"/><stop offset="1" stop-color="${L.c[1]}"/></linearGradient>
    <linearGradient id="${g3}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".4" stop-color="${L.c[0]}"/><stop offset="1" stop-color="${L.c[1]}"/></linearGradient>
    <linearGradient id="${id}bs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${base.side[0]}"/><stop offset="1" stop-color="${base.side[1]}"/></linearGradient>
    <linearGradient id="${id}cd" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFF9E6"/><stop offset=".6" stop-color="#FFF1C9"/><stop offset="1" stop-color="#EBD290"/></linearGradient>
    <radialGradient id="${id}gl"><stop offset="0" stop-color="#FFE9A0" stop-opacity=".85"/><stop offset="1" stop-color="#FFC93D" stop-opacity="0"/></radialGradient>
    <radialGradient id="${id}fl" cx=".5" cy=".7" r=".6"><stop offset="0" stop-color="#FFF9C4"/><stop offset=".5" stop-color="#FFC93D"/><stop offset="1" stop-color="#FF8A1C"/></radialGradient>
    ${tf.defs}</defs>
    <ellipse cx="100" cy="140" rx="84" ry="11" fill="#000" opacity=".16"/>
    <path d="M18 120 L20 132 A80 15 0 0 0 180 132 L182 120 Z" fill="url(#${id}bs)"/>${base.tex(120)}
    <ellipse cx="100" cy="120" rx="82" ry="16" fill="${base.top}" stroke="${base.line}" stroke-width="1"/>
    ${d.base === 'banana' ? '<ellipse cx="100" cy="120" rx="60" ry="11" fill="none" stroke="#DCE6B8" stroke-width="1"/><ellipse cx="100" cy="120" rx="38" ry="7" fill="none" stroke="#DCE6B8" stroke-width="1"/>' : ''}
    ${ring(100, 117, 76, 14, 20, 19, 20, g1, L.crease, round, 'back')}
    ${ring(100, 106, 56, 10.5, 16, 17, 17, g2, L.crease, round, 'back')}
    ${tall ? ring(100, 97, 38, 7.5, 12, 14, 14, g3, L.crease, false, 'back') : ''}
    <ellipse cx="100" cy="${tall ? 94 : 100}" rx="${tall ? 34 : 46}" ry="${tall ? 7 : 10}" fill="${L.c[1]}"/><ellipse cx="100" cy="${tall ? 92 : 98}" rx="${tall ? 28 : 40}" ry="${tall ? 5.5 : 8}" fill="${L.c[0]}" opacity=".8"/>
    ${sideBack}${tf.back}${candle}${incense}${tf.front}${flame}
    ${tall ? ring(100, 97, 38, 7.5, 12, 14, 14, g3, L.crease, false, 'front') : ''}
    ${ring(100, 106, 56, 10.5, 16, 17, 17, g2, L.crease, round, 'front')}
    ${sideFront}
    ${ring(100, 117, 76, 14, 20, 19, 20, g1, L.crease, round, 'front')}
    ${coin}${ghost}
  </svg>`;
}
