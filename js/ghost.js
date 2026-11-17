// มาสคอต Ghost Class: ผีน้อยน่ารักมีเขี้ยว + ท่าทางต่าง ๆ (SVG ล้วน ไม่ต้องโหลดรูป)
const INK = '#3A2E5C';
const BODY = '#FFFFFF';
const SHADE = '#E6DEFF';
const PINK = '#FF8FB1';

// ท่าทาง: แขน (ซ้าย/ขวา) · ตา · ปาก · ของถือ
const POSES = {
  hello:   { l: 'down', r: 'wave', eyes: 'open', mouth: 'smile' },
  wave:    { l: 'down', r: 'wave', eyes: 'open', mouth: 'open' },
  cheer:   { l: 'up', r: 'up', eyes: 'happy', mouth: 'open', fx: 'sparkle' },
  book:    { l: 'hold', r: 'hold', eyes: 'open', mouth: 'smile', prop: 'book' },
  game:    { l: 'hold', r: 'hold', eyes: 'star', mouth: 'open', prop: 'pad' },
  board:   { l: 'down', r: 'point', eyes: 'open', mouth: 'smile', prop: 'board' },
  bell:    { l: 'down', r: 'press', eyes: 'happy', mouth: 'open', prop: 'buzzer' },
  target:  { l: 'hold', r: 'up', eyes: 'open', mouth: 'smile', prop: 'flag' },
  search:  { l: 'down', r: 'hold', eyes: 'open', mouth: 'o', prop: 'glass' },
  sleepy:  { l: 'down', r: 'down', eyes: 'sleep', mouth: 'small', fx: 'zzz' },
  love:    { l: 'hug', r: 'hug', eyes: 'heart', mouth: 'smile', fx: 'hearts' },
  peek:    { l: 'peek', r: 'peek', eyes: 'open', mouth: 'small' },
};

function arm(kind, side) {
  const x = side === 'l' ? 46 : 154, s = side === 'l' ? -1 : 1;
  const blob = (cx, cy, rot) => `<ellipse cx="${cx}" cy="${cy}" rx="11" ry="15" fill="${BODY}" stroke="${INK}" stroke-width="4.5" transform="rotate(${rot} ${cx} ${cy})"/>`;
  switch (kind) {
    case 'wave': return `<g class="gh-wave" style="transform-origin:${x - 6 * s}px 108px">${blob(x + 8 * s, 74, 35 * s)}</g>`;
    case 'up': return `<g class="gh-up-${side}" style="transform-origin:${x}px 100px">${blob(x + 6 * s, 70, 25 * s)}</g>`;
    case 'hold': return blob(x + 12 * -s, 132, -40 * s);
    case 'point': return blob(x + 10 * s, 92, 70 * s);
    case 'press': return blob(x - 4 * s, 140, -10 * s);
    case 'hug': return blob(x + 22 * -s, 120, -60 * s);
    case 'peek': return blob(x + 4 * -s, 150, 0);
    default: return blob(x, 118, 15 * s);
  }
}
function eyes(kind) {
  const L = 82, R = 118, Y = 92;
  const open = (x) => `<ellipse cx="${x}" cy="${Y}" rx="9.5" ry="12" fill="${INK}"/><circle cx="${x + 3.5}" cy="${Y - 4.5}" r="4" fill="#fff"/><circle cx="${x - 3}" cy="${Y + 5}" r="1.8" fill="#fff"/>`;
  switch (kind) {
    case 'happy': return [L, R].map((x) => `<path d="M${x - 10} ${Y + 3} Q${x} ${Y - 10} ${x + 10} ${Y + 3}" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>`).join('');
    case 'sleep': return [L, R].map((x) => `<path d="M${x - 9} ${Y} Q${x} ${Y + 8} ${x + 9} ${Y}" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>`).join('');
    case 'heart': return [L, R].map((x) => `<path transform="translate(${x} ${Y}) scale(1.35)" d="M0 6 C-8 0 -10 -6 -5 -9 C-2 -11 0 -9 0 -6 C0 -9 2 -11 5 -9 C10 -6 8 0 0 6 Z" fill="#FF4D7A" stroke="${INK}" stroke-width="1.5"/>`).join('');
    case 'star': return [L, R].map((x) => `<polygon points="${starPts(x, Y, 11)}" fill="#FFC23D" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`).join('');
    default: return `<g class="gh-blink" style="transform-origin:100px ${Y}px">${open(L)}${open(R)}</g>`;
  }
}
function starPts(cx, cy, r) {
  const p = [];
  for (let i = 0; i < 10; i++) { const rr = i % 2 ? r * 0.48 : r, a = (Math.PI / 5) * i - Math.PI / 2; p.push(`${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`); }
  return p.join(' ');
}
function mouth(kind) {
  // เขี้ยวเล็ก ๆ สองซี่ = เอกลักษณ์ของ Ghost Class
  const fangs = (y) => `<path d="M93 ${y} L95.5 ${y + 8} L98 ${y + 1} Z M102 ${y + 1} L104.5 ${y + 8} L107 ${y} Z" fill="#fff" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`;
  switch (kind) {
    case 'open': return `<path d="M88 106 Q100 104 112 106 Q110 124 100 124 Q90 124 88 106 Z" fill="${INK}"/><ellipse cx="100" cy="119" rx="6" ry="3.5" fill="#FF7A9C"/>${fangs(106)}`;
    case 'o': return `<ellipse cx="100" cy="112" rx="6" ry="7" fill="${INK}"/>`;
    case 'small': return `<path d="M94 109 Q100 113 106 109" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round"/>${fangs(110)}`;
    default: return `<path d="M88 106 Q100 117 112 106" stroke="${INK}" stroke-width="4.5" fill="none" stroke-linecap="round"/>${fangs(109)}`;
  }
}
function prop(kind) {
  switch (kind) {
    case 'book': return `<g transform="translate(100 140)"><path d="M-38 -14 L0 -6 L38 -14 L38 18 L0 26 L-38 18 Z" fill="#8B6CFF" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M-32 -9 L-3 -3 L-3 20 L-32 14 Z M32 -9 L3 -3 L3 20 L32 14 Z" fill="#fff"/><path d="M-26 0 L-9 3 M-26 7 L-9 10 M26 0 L9 3 M26 7 L9 10" stroke="#C9BDFF" stroke-width="2.5" stroke-linecap="round"/></g>`;
    case 'pad': return `<g transform="translate(100 140)"><rect x="-40" y="-14" width="80" height="34" rx="17" fill="#FF5C8A" stroke="${INK}" stroke-width="4"/><path d="M-24 3 h12 M-18 -3 v12" stroke="#fff" stroke-width="4" stroke-linecap="round"/><circle cx="16" cy="-1" r="4.5" fill="#FFE27A"/><circle cx="26" cy="7" r="4.5" fill="#7CE0B8"/></g>`;
    case 'board': return `<g transform="translate(128 50) rotate(8) scale(.92)"><rect x="-4" y="-30" width="58" height="42" rx="8" fill="#fff" stroke="${INK}" stroke-width="4"/><polygon points="${starPts(25, -9, 11)}" fill="#FFC23D"/><path d="M8 22 L4 40 M42 22 L46 40" stroke="${INK}" stroke-width="4" stroke-linecap="round"/></g>`;
    case 'buzzer': return `<g transform="translate(150 162)"><ellipse cx="0" cy="10" rx="30" ry="10" fill="#C9BDFF" stroke="${INK}" stroke-width="4"/><path d="M-22 8 Q-22 -18 0 -18 Q22 -18 22 8 Z" fill="#FF5C8A" stroke="${INK}" stroke-width="4"/><ellipse cx="-8" cy="-8" rx="6" ry="3" fill="#fff" opacity=".6"/></g>`;
    case 'flag': return `<g transform="translate(158 46)"><path d="M0 0 L0 64" stroke="${INK}" stroke-width="4" stroke-linecap="round"/><path d="M2 2 L40 12 L2 24 Z" fill="#FF9640" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/></g>`;
    case 'glass': return `<g transform="translate(152 128) rotate(-20)"><circle r="20" fill="#DDF0FF" stroke="${INK}" stroke-width="5"/><ellipse cx="-6" cy="-6" rx="6" ry="4" fill="#fff"/><path d="M14 14 L30 30" stroke="${INK}" stroke-width="7" stroke-linecap="round"/></g>`;
    default: return '';
  }
}
function fx(kind) {
  switch (kind) {
    case 'sparkle': return `<g class="gh-fx"><polygon points="${starPts(32, 40, 9)}" fill="#FFC23D"/><polygon points="${starPts(170, 34, 7)}" fill="#FF8FB1"/><polygon points="${starPts(178, 120, 6)}" fill="#8B6CFF"/></g>`;
    case 'zzz': return `<g class="gh-fx" fill="${INK}" font-family="sans-serif" font-weight="800"><text x="140" y="44" font-size="22">z</text><text x="156" y="28" font-size="15">z</text></g>`;
    case 'hearts': return `<g class="gh-fx"><path transform="translate(36 46) scale(1.4)" d="M0 6 C-8 0 -10 -6 -5 -9 C-2 -11 0 -9 0 -6 C0 -9 2 -11 5 -9 C10 -6 8 0 0 6 Z" fill="#FF5C8A"/><path transform="translate(166 40)" d="M0 6 C-8 0 -10 -6 -5 -9 C-2 -11 0 -9 0 -6 C0 -9 2 -11 5 -9 C10 -6 8 0 0 6 Z" fill="#FF8FB1"/></g>`;
    default: return '';
  }
}

/** ผีน้อย Ghost Class — pose: hello|wave|cheer|book|game|board|bell|target|search|sleepy|love|peek */
export function ghost(pose = 'hello', { cls = '' } = {}) {
  const p = POSES[pose] || POSES.hello;
  const body = `<path d="M50 104 C50 56 74 32 100 32 C126 32 150 56 150 104 L150 162 Q142 175 132 164 Q122 153 114 167 Q106 180 98 167 Q90 154 80 165 Q70 176 62 164 Q54 153 50 162 Z" fill="${BODY}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>`;
  const shade = `<path d="M128 60 C146 78 146 120 140 150 Q134 160 128 158 C136 128 138 90 128 60 Z" fill="${SHADE}" opacity=".9"/><ellipse cx="74" cy="56" rx="12" ry="7" fill="#fff" stroke="none" opacity=".9" transform="rotate(-30 74 56)"/>`;
  const cheeks = `<ellipse cx="68" cy="110" rx="9" ry="5.5" fill="${PINK}" opacity=".6"/><ellipse cx="132" cy="110" rx="9" ry="5.5" fill="${PINK}" opacity=".6"/>`;
  return `<svg class="ghost gh-${pose} ${cls}" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="ผีน้อย Ghost Class">
    <ellipse class="gh-shadow" cx="100" cy="190" rx="44" ry="7" fill="#3A2E5C" opacity=".12"/>
    <g class="gh-body">${body}${shade}${cheeks}${eyes(p.eyes)}${mouth(p.mouth)}${prop(p.prop)}${arm(p.l, 'l')}${arm(p.r, 'r')}</g>${fx(p.fx)}
  </svg>`;
}
export const GHOST_POSES = Object.keys(POSES);
