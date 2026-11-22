// มาสคอต Ghost Class: ผีน้อยน่ารักมีเขี้ยว + ท่าทางต่าง ๆ (SVG ล้วน ไม่ต้องโหลดรูป)
// แขนเป็นส่วนหนึ่งของตัว: แขนข้างลำตัววาด "หลัง" ตัว (โคนแขนกลืนกับลำตัว) ส่วนแขนที่ถือของวาด "หน้า" ตัว แล้วมือจับขอบของจริง ๆ
const INK = '#3A2E5C';
const FILL = '#FFFFFF';
const FILL2 = '#EEE8FF';
const SHADE = '#E3DAFF';
const PINK = '#FF8FB1';
let uid = 0;
// คำนำหน้า id ไม่ซ้ำต่อการโหลดไฟล์ (หน้าเดียวอาจโหลดไฟล์นี้ 2 ครั้ง → id gradient ห้ามชนกัน)
const PFX = 'g' + Math.random().toString(36).slice(2, 7);

/* ── ท่าทาง ──
   arms: [ซ้าย, ขวา] แต่ละข้าง = { to:[x,y], front?:bool, cls?:'gh-wave'|'gh-up-l'|'gh-up-r' } (โคนแขนคำนวณจากไหล่ให้อัตโนมัติ)
   eyes / mouth / prop / acc (ของบนหัว/หน้า) / fx */
const DOWN_L = { to: [38, 132] }, DOWN_R = { to: [162, 132] };
const POSES = {
  hello:   { arms: [DOWN_L, { to: [172, 70], cls: 'gh-wave' }], eyes: 'open', mouth: 'smile' },
  wave:    { arms: [DOWN_L, { to: [172, 66], cls: 'gh-wave' }], eyes: 'open', mouth: 'open' },
  cheer:   { arms: [{ to: [30, 58], cls: 'gh-up-l' }, { to: [170, 58], cls: 'gh-up-r' }], eyes: 'happy', mouth: 'open', fx: 'sparkle' },
  book:    { arms: [{ to: [66, 140], front: true }, { to: [134, 140], front: true }], eyes: 'open', mouth: 'smile', prop: 'book' },
  game:    { arms: [{ to: [66, 142], front: true }, { to: [134, 142], front: true }], eyes: 'star', mouth: 'open', prop: 'pad' },
  board:   { arms: [DOWN_L, { to: [166, 76] }], eyes: 'open', mouth: 'smile', prop: 'board' },
  bell:    { arms: [DOWN_L, { to: [150, 150], front: true }], eyes: 'happy', mouth: 'open', prop: 'buzzer' },
  target:  { arms: [DOWN_L, { to: [164, 74] }], eyes: 'open', mouth: 'smile', prop: 'flag' },
  search:  { arms: [DOWN_L, { to: [150, 132], front: true }], eyes: 'open', mouth: 'o', prop: 'glass' },
  sleepy:  { arms: [DOWN_L, DOWN_R], eyes: 'sleep', mouth: 'small', fx: 'zzz' },
  love:    { arms: [{ to: [78, 132], front: true }, { to: [122, 132], front: true }], eyes: 'heart', mouth: 'smile', prop: 'heart', fx: 'hearts' },
  peek:    { arms: [{ to: [74, 146], front: true }, { to: [126, 146], front: true }], eyes: 'open', mouth: 'small' },
  // ใหม่: ใช้กับธีมทั้งเว็บ
  krathong:{ arms: [{ to: [56, 168], front: true }, { to: [144, 168], front: true }], eyes: 'happy', mouth: 'smile', prop: 'krathong' },
  summer:  { arms: [DOWN_L, { to: [160, 92] }], eyes: 'open', mouth: 'open', acc: 'shades', prop: 'icecream', fx: 'sun' },
  umbrella:{ arms: [DOWN_L, { to: [142, 102], front: true }], eyes: 'happy', mouth: 'smile', prop: 'umbrella', fx: 'drops' },
  night:   { arms: [{ to: [42, 80] }, DOWN_R], eyes: 'sleep', mouth: 'small', acc: 'cap', prop: 'starstick', fx: 'night' },
  santa:   { arms: [DOWN_L, { to: [150, 150], front: true }], eyes: 'happy', mouth: 'open', acc: 'santa', prop: 'gift', fx: 'snow' },
  soldier: { arms: [{ to: [38, 92] }, { to: [146, 72], front: true }], eyes: 'open', mouth: 'smile', acc: 'helmet', prop: 'warflag', fx: 'peace' },
};

/* แขนทรงแคปซูล: เส้นขอบ + เนื้อ (ปลายมน = มือ) */
function arm(side, a, layer) {
  if (!a || !!a.front !== (layer === 'front')) return '';
  const s = side === 'l' ? -1 : 1;
  const sx = 100 + s * (a.front ? 51 : 44), sy = a.front ? 108 : 106;     // ไหล่ (แขนหน้าเริ่มจากขอบตัว แล้วโค้งเข้ามาจับของ)
  const [tx, ty] = a.to;
  const w = a.front ? 22 : 27;
  // แขนหน้า: โค้งเล็กน้อย (ข้อศอก) ดูเป็นธรรมชาติกว่าเส้นตรง
  const mx = (sx + tx) / 2 + s * (a.front ? 7 : 0), my = (sy + ty) / 2 + (a.front ? 4 : 0);
  const d = `M${sx} ${sy} Q${mx} ${my} ${tx} ${ty}`;
  const caps = `<path d="${d}" stroke="${INK}" stroke-width="${w}" stroke-linecap="round" fill="none"/>
    <path d="${d}" stroke="${FILL}" stroke-width="${w - 9}" stroke-linecap="round" fill="none"/>`;
  const cls = a.cls ? ` class="${a.cls}" style="transform-origin:${sx}px ${sy}px"` : '';
  return `<g${cls}>${caps}</g>`;
}
function eyes(kind) {
  const L = 82, R = 118, Y = 92;
  const open = (x) => `<ellipse cx="${x}" cy="${Y}" rx="9.5" ry="12" fill="${INK}"/><circle cx="${x + 3.5}" cy="${Y - 4.5}" r="4.2" fill="#fff"/><circle cx="${x - 3}" cy="${Y + 5}" r="1.9" fill="#fff"/>`;
  switch (kind) {
    case 'happy': return [L, R].map((x) => `<path d="M${x - 10} ${Y + 3} Q${x} ${Y - 10} ${x + 10} ${Y + 3}" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>`).join('');
    case 'sleep': return [L, R].map((x) => `<path d="M${x - 9} ${Y} Q${x} ${Y + 8} ${x + 9} ${Y}" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>`).join('');
    case 'heart': return [L, R].map((x) => `<path transform="translate(${x} ${Y}) scale(1.35)" d="${HEART}" fill="#FF4D7A" stroke="${INK}" stroke-width="1.5"/>`).join('');
    case 'star': return [L, R].map((x) => `<polygon points="${starPts(x, Y, 11)}" fill="#FFC23D" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`).join('');
    default: return `<g class="gh-blink" style="transform-origin:100px ${Y}px">${open(L)}${open(R)}</g>`;
  }
}
const HEART = 'M0 6 C-8 0 -10 -6 -5 -9 C-2 -11 0 -9 0 -6 C0 -9 2 -11 5 -9 C10 -6 8 0 0 6 Z';
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
/* ของบนหัว/หน้า */
function acc(kind) {
  switch (kind) {
    case 'shades': return `<g><path d="M68 84 H132" stroke="${INK}" stroke-width="4"/>
      <rect x="66" y="80" width="30" height="22" rx="10" fill="#2A2350" stroke="${INK}" stroke-width="3"/><rect x="104" y="80" width="30" height="22" rx="10" fill="#2A2350" stroke="${INK}" stroke-width="3"/>
      <path d="M72 86 L80 86 M110 86 L118 86" stroke="#9FD8FF" stroke-width="3" stroke-linecap="round"/></g>`;
    case 'cap': return `<g><path d="M58 64 C62 30 104 14 136 30 C156 40 168 62 170 82 L160 84 C154 64 140 50 124 48 C104 46 82 52 62 70 Z" fill="#8B6CFF" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M86 40 L98 60 M110 32 L118 52 M134 36 L138 54" stroke="#C9B8FF" stroke-width="5" stroke-linecap="round"/>
      <path d="M54 66 C80 54 116 52 142 62" stroke="#FFFFFF" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M54 66 C80 54 116 52 142 62" stroke="${INK}" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".5"/>
      <circle cx="166" cy="88" r="10" fill="#FFE27A" stroke="${INK}" stroke-width="3.5"/></g>`;
    case 'helmet': return `<g><path d="M44 70 C42 14 158 14 156 70 Z" fill="#7A8B4A" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M62 38 C80 26 120 26 138 38" stroke="#9AAB66" stroke-width="6" fill="none" stroke-linecap="round" opacity=".8"/>
      <rect x="34" y="64" width="132" height="13" rx="6.5" fill="#5E6E36" stroke="${INK}" stroke-width="4"/>
      <circle cx="100" cy="45" r="11" fill="#F6F1DE" stroke="${INK}" stroke-width="2.5"/><polygon points="${starPts(100, 46, 7.5)}" fill="#C2410C"/></g>`;
    case 'santa': return `<g><path d="M54 60 C58 22 96 6 128 18 C150 26 166 48 170 76 C160 62 150 52 138 48 L146 60 Z" fill="#E53950" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M78 30 C96 18 120 16 136 26" stroke="#FF7D8F" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/>
      <rect x="46" y="52" width="108" height="18" rx="9" fill="#fff" stroke="${INK}" stroke-width="4"/>
      <circle cx="171" cy="80" r="11" fill="#fff" stroke="${INK}" stroke-width="4"/></g>`;
    default: return '';
  }
}
/* ของที่ถือ (วาดก่อนแขนหน้า มือจึงจับทับขอบของ) */
function prop(kind) {
  switch (kind) {
    case 'book': return `<g transform="translate(100 146)"><path d="M-42 -16 L0 -8 L42 -16 L42 18 L0 26 L-42 18 Z" fill="#8B6CFF" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M-36 -11 L-3 -4 L-3 20 L-36 14 Z M36 -11 L3 -4 L3 20 L36 14 Z" fill="#fff"/><path d="M-29 -1 L-10 2 M-29 6 L-10 9 M29 -1 L10 2 M29 6 L10 9" stroke="#C9BDFF" stroke-width="2.5" stroke-linecap="round"/></g>`;
    case 'pad': return `<g transform="translate(100 146)"><rect x="-44" y="-15" width="88" height="36" rx="18" fill="#FF5C8A" stroke="${INK}" stroke-width="4"/><path d="M-26 3 h12 M-20 -3 v12" stroke="#fff" stroke-width="4" stroke-linecap="round"/><circle cx="16" cy="-1" r="4.5" fill="#FFE27A"/><circle cx="26" cy="7" r="4.5" fill="#7CE0B8"/></g>`;
    case 'board': return `<g><path d="M166 84 L166 46" stroke="#B07A4A" stroke-width="5" stroke-linecap="round"/><g transform="translate(166 26) rotate(6)"><rect x="-30" y="-22" width="60" height="42" rx="9" fill="#fff" stroke="${INK}" stroke-width="4"/><polygon points="${starPts(0, -1, 11)}" fill="#FFC23D"/></g></g>`;
    case 'buzzer': return `<g transform="translate(152 170)"><ellipse cx="0" cy="10" rx="32" ry="10" fill="#C9BDFF" stroke="${INK}" stroke-width="4"/><path d="M-24 8 Q-24 -16 0 -16 Q24 -16 24 8 Z" fill="#FF5C8A" stroke="${INK}" stroke-width="4"/><ellipse cx="-9" cy="-7" rx="6" ry="3" fill="#fff" opacity=".6"/></g>`;
    case 'flag': return `<g><path d="M166 98 L166 16" stroke="${INK}" stroke-width="4.5" stroke-linecap="round"/><path d="M168 18 L198 28 L168 40 Z" fill="#FF9640" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/></g>`;
    case 'glass': return `<g><path d="M150 134 L162 112" stroke="#B07A4A" stroke-width="7" stroke-linecap="round"/><circle cx="170" cy="96" r="19" fill="#DDF0FF" fill-opacity=".85" stroke="${INK}" stroke-width="5"/><ellipse cx="163" cy="89" rx="6" ry="4" fill="#fff"/></g>`;
    case 'heart': return `<path transform="translate(100 140) scale(3.6)" d="${HEART}" fill="#FF6B95" stroke="${INK}" stroke-width="1.1"/>`;
    case 'krathong': return `<g transform="translate(100 174) scale(.76) translate(-80 -88)">${krathongArt({ id: PFX + 'kp' + uid })}</g>`;
    case 'icecream': return `<g transform="translate(162 74) rotate(10)"><path d="M-10 6 L0 34 L10 6 Z" fill="#E8A65A" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M-6 12 L4 18 M-4 20 L5 26" stroke="#C4803A" stroke-width="2"/>
      <circle cx="-5" cy="-2" r="10" fill="#FF9CC0" stroke="${INK}" stroke-width="3"/><circle cx="6" cy="-4" r="10" fill="#9FE3C4" stroke="${INK}" stroke-width="3"/><circle cx="0" cy="-14" r="9" fill="#FFE27A" stroke="${INK}" stroke-width="3"/><circle cx="-3" cy="-17" r="2" fill="#fff"/></g>`;
    case 'umbrella': return `<g><path d="M146 124 L128 22" stroke="${INK}" stroke-width="4.5" stroke-linecap="round"/><path d="M146 124 q3 11 -7 11" stroke="${INK}" stroke-width="4.5" fill="none" stroke-linecap="round"/>
      <g transform="translate(126 18) rotate(-12)"><path d="M-70 14 Q0 -64 70 14 Q58 6 46 14 Q34 6 23 14 Q12 6 0 14 Q-12 6 -23 14 Q-34 6 -46 14 Q-58 6 -70 14 Z" fill="#4FB3FF" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M0 -26 Q-14 -4 -23 14 M0 -26 Q14 -4 23 14" stroke="#2C7FD0" stroke-width="3" fill="none"/><path d="M-46 14 Q-30 -20 0 -26 Q30 -20 46 14" stroke="#9FD8FF" stroke-width="3" fill="none" opacity=".7"/><circle cx="0" cy="-27" r="4" fill="${INK}"/></g></g>`;
    case 'warflag': return `<g><path d="M38 120 L38 10" stroke="#8C6B3E" stroke-width="5" stroke-linecap="round"/><circle cx="38" cy="9" r="4.5" fill="#D9B44A" stroke="${INK}" stroke-width="2"/>
      <path d="M36 14 Q22 8 8 15 L8 44 Q22 37 36 43 Z" fill="#6B7F3A" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/><polygon points="${starPts(22, 28, 8)}" fill="#F6F1DE"/></g>`;
    case 'gift': return `<g transform="translate(150 152)"><rect x="-24" y="-20" width="48" height="38" rx="6" fill="#2FA866" stroke="${INK}" stroke-width="4"/><rect x="-5" y="-20" width="10" height="38" fill="#FFD23D"/><rect x="-24" y="-5" width="48" height="9" fill="#FFD23D"/>
      <path d="M0 -21 C-14 -36 -26 -24 -12 -20 Z M0 -21 C14 -36 26 -24 12 -20 Z" fill="#E53950" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/></g>`;
    case 'starstick': return `<g><path d="M42 82 L32 30" stroke="#B07A4A" stroke-width="4" stroke-linecap="round"/><circle cx="30" cy="24" r="17" fill="#FFE27A" opacity=".35"/><polygon points="${starPts(30, 24, 13)}" fill="#FFD23D" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/></g>`;
    default: return '';
  }
}
function fx(kind) {
  switch (kind) {
    case 'sparkle': return `<g class="gh-fx"><polygon points="${starPts(26, 34, 9)}" fill="#FFC23D"/><polygon points="${starPts(176, 30, 7)}" fill="#FF8FB1"/><polygon points="${starPts(184, 116, 6)}" fill="#8B6CFF"/></g>`;
    case 'zzz': return `<g class="gh-fx" fill="${INK}" font-family="sans-serif" font-weight="800"><text x="140" y="44" font-size="22">z</text><text x="156" y="28" font-size="15">z</text></g>`;
    case 'hearts': return `<g class="gh-fx"><path transform="translate(34 44) scale(1.4)" d="${HEART}" fill="#FF5C8A"/><path transform="translate(168 40)" d="${HEART}" fill="#FF8FB1"/></g>`;
    case 'sun': return `<g class="gh-fx"><circle cx="28" cy="30" r="13" fill="#FFC23D"/>${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<path d="M28 30 m0 -18 v-7" stroke="#FFC23D" stroke-width="4" stroke-linecap="round" transform="rotate(${a} 28 30)"/>`).join('')}</g>`;
    case 'drops': return `<g class="gh-fx" fill="#6CB8FF">${[[30, 60], [20, 110], [44, 150], [186, 150], [178, 186]].map(([x, y]) => `<path d="M${x} ${y} q-5 8 0 11 q5 -3 0 -11 Z"/>`).join('')}</g>`;
    case 'peace': return `<g class="gh-fx"><g transform="translate(174 32) scale(1.25)" stroke="${INK}" stroke-width="2" stroke-linejoin="round">
      <path d="M9 3 L21 -1 L19 9 Z" fill="#fff"/><ellipse cx="0" cy="4" rx="12" ry="7" fill="#fff"/><circle cx="-11" cy="-2" r="5.5" fill="#fff"/>
      <path d="M-3 3 C-2 -11 9 -17 17 -15 C13 -8 9 -2 5 4 Z" fill="#fff"/><path d="M-16 -2 L-21 0 L-16 1.5 Z" fill="#FFB23D" stroke-width="1.2"/>
      <circle cx="-12" cy="-3" r="1.2" fill="${INK}" stroke="none"/>
      <path d="M-20 1 Q-24 6 -21 11" fill="none" stroke="#3FAE5C" stroke-width="2"/><ellipse cx="-24" cy="5" rx="2.6" ry="1.4" fill="#5CC46F" stroke="none" transform="rotate(-40 -24 5)"/><ellipse cx="-18" cy="8" rx="2.6" ry="1.4" fill="#5CC46F" stroke="none" transform="rotate(30 -18 8)"/></g></g>`;
    case 'snow': return `<g class="gh-fx" fill="#9FD0FF">${[[28, 40, 5], [184, 30, 4], [20, 120, 4], [188, 112, 5], [40, 170, 3]].map(([x, y, r]) => `<g transform="translate(${x} ${y})" stroke="#9FD0FF" stroke-width="2" stroke-linecap="round"><path d="M0 ${-r * 1.6} V${r * 1.6} M${-r * 1.4} ${-r * .8} L${r * 1.4} ${r * .8} M${-r * 1.4} ${r * .8} L${r * 1.4} ${-r * .8}"/></g>`).join('')}</g>`;
    case 'night': return `<g class="gh-fx"><path transform="translate(176 34)" d="M4 -12 A13 13 0 1 0 12 7 A9 9 0 1 1 4 -12 Z" fill="#FFE27A"/><polygon points="${starPts(150, 18, 5)}" fill="#C9B8FF"/><polygon points="${starPts(190, 76, 4)}" fill="#C9B8FF"/></g>`;
    default: return '';
  }
}

/** ผีน้อย Ghost Class — pose: hello|wave|cheer|book|game|board|bell|target|search|sleepy|love|peek|krathong|summer|umbrella|night|soldier|santa */
export function ghost(pose = 'hello', { cls = '' } = {}) {
  const p = POSES[pose] || POSES.hello; const id = PFX + 'b' + (++uid);
  const body = `<path d="M100 30 C133 30 152 56 152 98 L152 160 Q146 173 136 165 Q127 157 118 168 Q109 179 100 168 Q91 157 82 168 Q73 179 64 165 Q54 157 48 160 L48 98 C48 56 67 30 100 30 Z" fill="url(#${id})" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>`;
  const shade = `<path d="M130 58 C147 78 147 122 142 152 Q136 162 130 160 C138 128 140 90 130 58 Z" fill="${SHADE}" opacity=".85"/><ellipse cx="74" cy="56" rx="12" ry="7" fill="#fff" opacity=".95" transform="rotate(-30 74 56)"/>`;
  const cheeks = `<ellipse cx="68" cy="110" rx="9" ry="5.5" fill="${PINK}" opacity=".6"/><ellipse cx="132" cy="110" rx="9" ry="5.5" fill="${PINK}" opacity=".6"/>`;
  const [l, r] = p.arms;
  return `<svg class="ghost gh-${pose} ${cls}" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="ผีน้อย Ghost Class">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2=".35" y2="1"><stop offset="0" stop-color="${FILL}"/><stop offset="1" stop-color="${FILL2}"/></linearGradient></defs>
    <ellipse class="gh-shadow" cx="100" cy="190" rx="44" ry="7" fill="#3A2E5C" opacity=".12"/>
    <g class="gh-body">${arm('l', l, 'back')}${arm('r', r, 'back')}${body}${shade}${cheeks}${eyes(p.eyes)}${mouth(p.mouth)}${acc(p.acc)}${prop(p.prop)}${arm('l', l, 'front')}${arm('r', r, 'front')}</g>${fx(p.fx)}
  </svg>`;
}
export const GHOST_POSES = Object.keys(POSES);

/* ═════════ กระทงใบตอง (สมจริง) ═════════
   viewBox 0 0 160 120 · ฐานหยวกกล้วย + กลีบใบตองพับ 2 ชั้น + ดอกบัว ดาวเรือง มะลิ + เทียน ธูป */
export function krathongArt({ id = PFX + 'k' + (++uid), candle = true, lotus = '#FF9CC0' } = {}) {
  const fold = (x, y, w, h, out, c1, c2, crease) => {
    const tx = x + out, ty = y - h;
    return `<path d="M${(x - w / 2).toFixed(1)} ${y.toFixed(1)} Q${(x - w / 2 + 1).toFixed(1)} ${(y - h * .62).toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)} Q${(x + w / 2 - 1).toFixed(1)} ${(y - h * .62).toFixed(1)} ${(x + w / 2).toFixed(1)} ${y.toFixed(1)} Z" fill="url(#${id}${c1})" stroke="#1F6B33" stroke-width=".9"/>
      <path d="M${x.toFixed(1)} ${(y - 1).toFixed(1)} Q${(x + out * .4).toFixed(1)} ${(y - h * .55).toFixed(1)} ${tx.toFixed(1)} ${(ty + 1.5).toFixed(1)}" stroke="${crease}" stroke-width="1.1" fill="none" opacity=".85"/>`;
  };
  const ring = (cx, cy, rx, ry, n, w, h, c, crease, part) => {
    let back = '', front = '';
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 * i) / n + Math.PI / n;
      const x = cx + rx * Math.cos(a), y = cy + ry * Math.sin(a), depth = (Math.sin(a) + 1) / 2;   // 0=หลัง 1=หน้า
      const f = fold(x, y, w * (.8 + depth * .3), h * (.82 + depth * .22), Math.cos(a) * 7, c, c, crease);
      (Math.sin(a) < 0 ? (back += f) : (front += f));
    }
    return part === 'back' ? back : front;
  };
  const marigold = (x, y, r) => `<g><circle cx="${x}" cy="${y}" r="${r}" fill="#FF9F1C"/>${[0, 60, 120, 180, 240, 300].map((a) => `<circle cx="${(x + r * .55 * Math.cos(a * Math.PI / 180)).toFixed(1)}" cy="${(y + r * .55 * Math.sin(a * Math.PI / 180)).toFixed(1)}" r="${(r * .45).toFixed(1)}" fill="#FFB938"/>`).join('')}<circle cx="${x}" cy="${y}" r="${(r * .35).toFixed(1)}" fill="#F07E00"/></g>`;
  const jas = (x, y) => `<g>${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="${(x + 2.2 * Math.cos(a * Math.PI / 180)).toFixed(1)}" cy="${(y + 2.2 * Math.sin(a * Math.PI / 180)).toFixed(1)}" rx="2" ry="1.4" fill="#fff" transform="rotate(${a} ${(x + 2.2 * Math.cos(a * Math.PI / 180)).toFixed(1)} ${(y + 2.2 * Math.sin(a * Math.PI / 180)).toFixed(1)})"/>`).join('')}<circle cx="${x}" cy="${y}" r="1.1" fill="#FFE27A"/></g>`;
  const petal = (x, y, rot, s) => `<path transform="translate(${x} ${y}) rotate(${rot}) scale(${s})" d="M0 0 C-7 -6 -6 -17 0 -24 C6 -17 7 -6 0 0 Z" fill="url(#${id}lo)" stroke="#E46A98" stroke-width=".9"/>`;
  return `<defs>
      <linearGradient id="${id}g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7ED67F"/><stop offset=".55" stop-color="#3FA34D"/><stop offset="1" stop-color="#256F35"/></linearGradient>
      <linearGradient id="${id}g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A6E59A"/><stop offset="1" stop-color="#4CAF50"/></linearGradient>
      <linearGradient id="${id}lo" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".45" stop-color="#FFD3E4"/><stop offset="1" stop-color="${lotus}"/></linearGradient>
      <radialGradient id="${id}gl"><stop offset="0" stop-color="#FFE9A0" stop-opacity=".9"/><stop offset="1" stop-color="#FFC93D" stop-opacity="0"/></radialGradient>
      <radialGradient id="${id}fl" cx=".5" cy=".7" r=".6"><stop offset="0" stop-color="#FFF9C4"/><stop offset=".5" stop-color="#FFC93D"/><stop offset="1" stop-color="#FF8A1C"/></radialGradient>
    </defs>
    <ellipse cx="80" cy="104" rx="72" ry="10" fill="#FFD98A" opacity=".28"/>
    <path d="M18 90 L18 98 A62 13 0 0 0 142 98 L142 90 Z" fill="#B9D58A"/><path d="M18 98 A62 13 0 0 0 142 98" stroke="#8DB35E" stroke-width="1.2" fill="none"/>
    <ellipse cx="80" cy="90" rx="62" ry="13" fill="#EEF5CF" stroke="#C7DC97" stroke-width="1"/>
    ${ring(80, 88, 60, 12, 18, 17, 15, 'g1', '#A8E6A3', 'back')}
    ${ring(80, 81, 44, 9, 13, 15, 12, 'g2', '#D6F5CC', 'back')}
    <ellipse cx="80" cy="76" rx="38" ry="10" fill="#4CAF50"/><ellipse cx="80" cy="74" rx="32" ry="8" fill="#6CC46F"/>
    ${[[-30, 76, -70, .9], [-20, 70, -42, 1.05], [-8, 66, -14, 1.15], [8, 66, 14, 1.15], [20, 70, 42, 1.05], [30, 76, 70, .9]].map(([dx, y, r, s]) => petal(80 + dx, y, r, s)).join('')}
    ${marigold(50, 78, 6.5)}${marigold(110, 78, 6.5)}${marigold(64, 82, 6)}${marigold(96, 82, 6)}${marigold(80, 84, 5.5)}
    ${jas(57, 70)}${jas(103, 70)}${jas(72, 76)}${jas(88, 76)}
    ${candle ? `<g><rect x="76.5" y="40" width="7" height="32" rx="2.5" fill="#FFF7DE" stroke="#E9C46A" stroke-width="1"/><path d="M76.5 44 q2 4 0 7" stroke="#F3E1A8" stroke-width="2" fill="none"/>
      <path d="M93 72 L103 34 M96 72 L109 37 M99 73 L114 41" stroke="#9A5B2E" stroke-width="1.7" stroke-linecap="round"/>
      <circle cx="103" cy="33.5" r="1.6" fill="#FF5A2A"/><circle cx="109" cy="36.5" r="1.6" fill="#FF5A2A"/><circle cx="114" cy="40.5" r="1.6" fill="#FF5A2A"/>
      <path d="M104 31 q-4 -7 1 -12 q4 -5 0 -11" stroke="#fff" stroke-width="1.4" fill="none" opacity=".35" stroke-linecap="round"/>
      <circle cx="80" cy="30" r="18" fill="url(#${id}gl)" class="gf-glow"/>
      <g class="gf-flame"><path d="M80 18 C86 26 87 33 80 39 C73 33 74 26 80 18 Z" fill="url(#${id}fl)"/><ellipse cx="80" cy="34" rx="2.2" ry="3.5" fill="#FFFDE8"/></g></g>` : ''}
    ${ring(80, 81, 44, 9, 13, 15, 12, 'g2', '#D6F5CC', 'front')}
    ${ring(80, 88, 60, 12, 18, 17, 15, 'g1', '#A8E6A3', 'front')}`;
}
export function krathongSVG(opts = {}) { return `<svg viewBox="0 0 160 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${krathongArt(opts)}</svg>`; }
