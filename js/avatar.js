// ตัวละคร SVG น่ารัก ๆ ที่นักเรียนแต่งตัวได้
const INK = '#3A2E5C';

export const OPTS = {
  shape: { label: 'ร่าง', items: ['round', 'bear', 'bunny', 'cat', 'chick', 'dino', 'bean', 'ghost'] },
  body: { label: 'สีตัว', items: ['#FFB4C2', '#FFC89B', '#FFE38A', '#B8F0C8', '#A8E1FF', '#B9B8FF', '#E0B8FF', '#FFFFFF', '#D9C3A5', '#9EE6DF', '#FF8FA3', '#8FB3FF'] },
  eyes: { label: 'ตา', items: ['dot', 'sparkle', 'happy', 'wink', 'heart', 'star', 'sleepy', 'dizzy', 'shades'] },
  mouth: { label: 'ปาก', items: ['smile', 'cat', 'open', 'grin', 'tongue', 'o', 'kiss', 'fang', 'smirk'] },
  hat: { label: 'หมวก', items: ['none', 'bow', 'crown', 'frog', 'party', 'sprout', 'beanie', 'headphones', 'flower', 'chef', 'halo', 'cap', 'wizard'] },
  acc: { label: 'ของแต่ง', items: ['none', 'balloon', 'heart', 'bowtie', 'scarf', 'glasses', 'bandaid', 'medal', 'mustache'] },
  bg: { label: 'พื้นหลัง', items: ['#FFE4EC', '#FFF1C9', '#DDF7E3', '#DCEFFF', '#ECE4FF', '#2E2A6B', '#0F766E', '#BE185D', '#1D4ED8', '#334155'] },
};

const pick = (a) => a[Math.floor(Math.random() * a.length)];
export function randomAvatar() {
  return {
    shape: pick(OPTS.shape.items),
    body: pick(OPTS.body.items),
    eyes: pick(['dot', 'dot', 'sparkle', 'sparkle', 'happy', 'wink', 'heart', 'star']),
    mouth: pick(['smile', 'cat', 'open', 'grin', 'tongue', 'o']),
    hat: Math.random() < 0.35 ? 'none' : pick(OPTS.hat.items),
    acc: Math.random() < 0.45 ? 'none' : pick(OPTS.acc.items),
    bg: pick(OPTS.bg.items),
  };
}

function shade(hex, amt) {
  const n = parseInt((hex || '#cccccc').slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt)));
  return '#' + ((1 << 24) | (f(n >> 16) << 16) | (f((n >> 8) & 255) << 8) | f(n & 255)).toString(16).slice(1);
}
function star(cx, cy, r, fill, stroke = 'none', sw = 0) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 ? r * 0.48 : r, a = (Math.PI / 5) * i - Math.PI / 2;
    pts.push((cx + rr * Math.cos(a)).toFixed(1) + ',' + (cy + rr * Math.sin(a)).toFixed(1));
  }
  return `<polygon points="${pts.join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>`;
}
const heart = (x, y, s, fill, stroke = 'none', sw = 0) =>
  `<path transform="translate(${x} ${y}) scale(${s})" d="M0 6 C-8 0 -10 -6 -5 -9 C-2 -11 0 -9 0 -6 C0 -9 2 -11 5 -9 C10 -6 8 0 0 6 Z" fill="${fill}" stroke="${stroke}" stroke-width="${sw / s}" stroke-linejoin="round"/>`;

const TOP = { round: 62, bear: 62, bunny: 62, cat: 62, chick: 62, dino: 62, bean: 52, ghost: 58 };

function body(shape, c) {
  const dk = shade(c, -0.28), lt = shade(c, 0.5), inner = shade(c, 0.55);
  const o = `stroke="${dk}" stroke-width="4" stroke-linejoin="round"`;
  let back = '', main, front = '';
  const arms = `<ellipse cx="44" cy="142" rx="11" ry="15" fill="${c}" ${o} transform="rotate(25 44 142)"/><ellipse cx="156" cy="142" rx="11" ry="15" fill="${c}" ${o} transform="rotate(-25 156 142)"/>`;
  const feet = `<ellipse cx="78" cy="180" rx="16" ry="10" fill="${c}" ${o}/><ellipse cx="122" cy="180" rx="16" ry="10" fill="${c}" ${o}/>`;
  const blob = `<ellipse cx="100" cy="122" rx="62" ry="60" fill="${c}" ${o}/>`;
  switch (shape) {
    case 'bear':
      back = `<circle cx="56" cy="72" r="18" fill="${c}" ${o}/><circle cx="144" cy="72" r="18" fill="${c}" ${o}/><circle cx="56" cy="72" r="9" fill="${inner}"/><circle cx="144" cy="72" r="9" fill="${inner}"/>`;
      main = blob + `<ellipse cx="100" cy="128" rx="17" ry="12" fill="${lt}" opacity=".9"/>`; break;
    case 'bunny':
      back = `<ellipse cx="76" cy="38" rx="13" ry="32" fill="${c}" ${o} transform="rotate(-12 76 38)"/><ellipse cx="124" cy="38" rx="13" ry="32" fill="${c}" ${o} transform="rotate(12 124 38)"/><ellipse cx="76" cy="42" rx="6" ry="21" fill="#FFB3C7" transform="rotate(-12 76 42)"/><ellipse cx="124" cy="42" rx="6" ry="21" fill="#FFB3C7" transform="rotate(12 124 42)"/>`;
      main = blob; break;
    case 'cat':
      back = `<path d="M48 92 L50 40 L90 66 Z M152 92 L150 40 L110 66 Z" fill="${c}" ${o}/><path d="M57 78 L58 54 L77 66 Z M143 78 L142 54 L123 66 Z" fill="#FFB3C7"/>`;
      main = blob + `<path d="M40 118 L22 112 M40 126 L22 128 M160 118 L178 112 M160 126 L178 128" stroke="${dk}" stroke-width="3" stroke-linecap="round"/>`; break;
    case 'chick':
      back = `<path d="M100 66 Q92 40 80 44 M100 66 Q100 34 108 38 M100 66 Q112 44 122 50" stroke="${dk}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
      main = blob + `<path d="M40 128 Q26 116 30 102 Q42 112 46 122 Z M160 128 Q174 116 170 102 Q158 112 154 122 Z" fill="${c}" ${o}/>`; break;
    case 'dino':
      back = `<path d="M70 72 L80 44 L92 66 L102 38 L112 64 L124 44 L132 72 Z" fill="${shade(c, -0.12)}" ${o}/>`;
      main = blob + `<circle cx="80" cy="160" r="5" fill="${dk}" opacity=".25"/><circle cx="118" cy="166" r="4" fill="${dk}" opacity=".25"/><circle cx="134" cy="150" r="3" fill="${dk}" opacity=".25"/>`; break;
    case 'bean':
      main = `<rect x="46" y="52" width="108" height="128" rx="54" fill="${c}" ${o}/>`; break;
    case 'ghost':
      main = `<path d="M40 120 C40 80 66 58 100 58 C134 58 160 80 160 120 L160 182 Q150 170 140 182 Q130 194 120 182 Q110 170 100 182 Q90 194 80 182 Q70 170 60 182 Q50 194 40 182 Z" fill="${c}" ${o}/>`; break;
    default: main = blob;
  }
  const hasFeet = shape !== 'ghost';
  return back + (hasFeet ? feet + arms : '') + main + front +
    `<ellipse cx="72" cy="${TOP[shape] + 24}" rx="14" ry="7" fill="#fff" opacity=".55" transform="rotate(-28 72 ${TOP[shape] + 24})"/>`;
}

function eyes(t) {
  const L = 76, R = 124, Y = 112;
  const dot = (x) => `<ellipse cx="${x}" cy="${Y}" rx="8.5" ry="10.5" fill="${INK}"/><circle cx="${x + 3}" cy="${Y - 4}" r="3.6" fill="#fff"/><circle cx="${x - 2.5}" cy="${Y + 4}" r="1.6" fill="#fff"/>`;
  const arc = (x) => `<path d="M${x - 9} ${Y + 3} Q${x} ${Y - 9} ${x + 9} ${Y + 3}" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  let s;
  switch (t) {
    case 'sparkle': s = [L, R].map((x) => `<ellipse cx="${x}" cy="${Y}" rx="12" ry="14" fill="${INK}"/><ellipse cx="${x}" cy="${Y + 5}" rx="8" ry="6" fill="#7C6CFF" opacity=".8"/><circle cx="${x + 4}" cy="${Y - 5}" r="4.6" fill="#fff"/><circle cx="${x - 4}" cy="${Y + 5}" r="2.2" fill="#fff"/><circle cx="${x + 5}" cy="${Y + 6}" r="1.2" fill="#fff"/>`).join(''); break;
    case 'happy': s = arc(L) + arc(R); break;
    case 'wink': s = dot(L) + arc(R); break;
    case 'heart': s = heart(L, Y, 1.25, '#FF4D7A', INK, 2) + heart(R, Y, 1.25, '#FF4D7A', INK, 2); break;
    case 'star': s = star(L, Y, 11, '#FFD23F', INK, 2.5) + star(R, Y, 11, '#FFD23F', INK, 2.5); break;
    case 'sleepy': s = [L, R].map((x) => `<path d="M${x - 9} ${Y} Q${x} ${Y + 8} ${x + 9} ${Y}" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>`).join('') + `<text x="146" y="80" font-size="18" font-weight="800" fill="${INK}" font-family="sans-serif">z</text><text x="158" y="66" font-size="13" font-weight="800" fill="${INK}" font-family="sans-serif">z</text>`; break;
    case 'dizzy': s = [L, R].map((x) => `<path d="M${x} ${Y} m-2 0 a2 2 0 1 1 4 0 a4 4 0 1 1 -8 0 a6 6 0 1 1 12 0 a8 8 0 1 1 -16 0" stroke="${INK}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`).join(''); break;
    case 'shades': s = `<path d="M56 102 H96 Q96 124 78 124 Q58 124 56 102 Z M104 102 H144 Q142 124 122 124 Q104 124 104 102 Z" fill="${INK}"/><path d="M94 104 H106" stroke="${INK}" stroke-width="5"/><path d="M63 107 L72 107 M111 107 L120 107" stroke="#fff" stroke-width="3" opacity=".6" stroke-linecap="round"/>`; break;
    default: s = dot(L) + dot(R);
  }
  return `<g class="eyes">${s}</g>`;
}

function mouth(t) {
  const s = `stroke="${INK}" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-linejoin="round"`;
  switch (t) {
    case 'cat': return `<path d="M88 132 Q94 140 100 133 Q106 140 112 132" ${s}/>`;
    case 'open': return `<path d="M88 131 Q100 131 112 131 Q110 150 100 150 Q90 150 88 131 Z" fill="${INK}"/><ellipse cx="100" cy="145" rx="6" ry="4" fill="#FF7A9C"/>`;
    case 'grin': return `<path d="M84 130 L116 130 Q100 154 84 130 Z" fill="${INK}"/><path d="M89 130 H111 L109 135 H91 Z" fill="#fff"/>`;
    case 'tongue': return `<path d="M96 136 Q96 149 102 149 Q108 149 108 136 Z" fill="#FF7A9C" stroke="${INK}" stroke-width="2.5"/><path d="M88 132 Q100 142 112 132" ${s}/>`;
    case 'o': return `<ellipse cx="100" cy="137" rx="6" ry="7" fill="${INK}"/>`;
    case 'kiss': return `<path d="M98 128 Q107 131 101 135 Q107 139 98 142" ${s}/>${heart(118, 128, 0.8, '#FF4D7A')}`;
    case 'fang': return `<path d="M88 132 Q100 142 112 132" ${s}/><path d="M93 136 L96 143 L99 137.5 Z" fill="#fff" stroke="${INK}" stroke-width="1.5"/>`;
    case 'smirk': return `<path d="M89 136 Q103 140 112 130" ${s}/>`;
    default: return `<path d="M89 132 Q100 143 111 132" ${s}/>`;
  }
}

function hat(t) {
  const o = (c) => `stroke="${c}" stroke-width="3" stroke-linejoin="round"`;
  switch (t) {
    case 'bow': return `<g transform="translate(132 66) rotate(18)"><path d="M0 0 L-24 -14 Q-30 0 -24 14 Z M0 0 L24 -14 Q30 0 24 14 Z" fill="#FF6B9A" ${o('#D9467A')}/><circle r="7" fill="#FF8FB1" ${o('#D9467A')}/></g>`;
    case 'crown': return `<path d="M66 72 L60 30 L82 48 L100 22 L118 48 L140 30 L134 72 Z" fill="#FFD34D" ${o('#D89B00')}/><circle cx="100" cy="56" r="6" fill="#FF5D8F"/><circle cx="79" cy="62" r="4" fill="#5BB8FF"/><circle cx="121" cy="62" r="4" fill="#4FD69C"/>`;
    case 'frog': return `<path d="M46 86 Q46 32 100 32 Q154 32 154 86 Z" fill="#7BD88F" ${o('#3FA35A')}/><circle cx="70" cy="34" r="15" fill="#7BD88F" ${o('#3FA35A')}/><circle cx="130" cy="34" r="15" fill="#7BD88F" ${o('#3FA35A')}/><circle cx="70" cy="33" r="8" fill="#fff"/><circle cx="130" cy="33" r="8" fill="#fff"/><circle cx="71" cy="34" r="4.5" fill="${INK}"/><circle cx="131" cy="34" r="4.5" fill="${INK}"/><path d="M84 58 Q100 68 116 58" stroke="#3FA35A" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="62" cy="62" rx="6" ry="4" fill="#FF9DB5" opacity=".7"/><ellipse cx="138" cy="62" rx="6" ry="4" fill="#FF9DB5" opacity=".7"/>`;
    case 'party': return `<path d="M100 4 L128 66 L72 66 Z" fill="#8FB3FF" ${o('#5577DD')}/><path d="M92 22 L110 24 M84 40 L118 44 M77 56 L124 60" stroke="#FFD34D" stroke-width="5" stroke-linecap="round"/><circle cx="100" cy="6" r="8" fill="#FF6B9A"/>`;
    case 'sprout': return `<path d="M100 66 Q98 50 100 36" stroke="#3FA35A" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M100 42 Q84 22 70 34 Q84 48 100 42 Z M100 40 Q114 18 130 28 Q118 46 100 40 Z" fill="#7BD88F" ${o('#3FA35A')}/>`;
    case 'beanie': return `<path d="M44 86 Q44 26 100 26 Q156 26 156 86 Z" fill="#B9A5FF"/><path d="M72 32 V80 M100 26 V80 M128 32 V80" stroke="#9A82F5" stroke-width="5"/><rect x="40" y="72" width="120" height="18" rx="9" fill="#8A6FF0"/><circle cx="100" cy="24" r="12" fill="#FFD34D"/>`;
    case 'headphones': return `<path d="M40 118 Q40 40 100 40 Q160 40 160 118" stroke="${INK}" stroke-width="9" fill="none" stroke-linecap="round"/><rect x="26" y="100" width="22" height="36" rx="10" fill="#FF6B9A"/><rect x="152" y="100" width="22" height="36" rx="10" fill="#FF6B9A"/>`;
    case 'flower': return `<g transform="translate(138 66)">${[0, 72, 144, 216, 288].map((a) => `<circle cx="${(12 * Math.cos(a * Math.PI / 180)).toFixed(1)}" cy="${(12 * Math.sin(a * Math.PI / 180)).toFixed(1)}" r="10" fill="#FF9DB5"/>`).join('')}<circle r="8" fill="#FFD34D"/></g>`;
    case 'chef': return `<path d="M62 80 L62 58 Q44 54 50 36 Q57 20 74 27 Q80 10 100 14 Q120 10 126 27 Q143 20 150 36 Q156 54 138 58 L138 80 Z" fill="#fff" stroke="#DCD6F2" stroke-width="3"/><rect x="62" y="66" width="76" height="14" fill="#EFEBFB"/>`;
    case 'halo': return `<ellipse cx="100" cy="34" rx="36" ry="10" fill="none" stroke="#FFD34D" stroke-width="7"/>`;
    case 'cap': return `<path d="M50 80 Q52 30 100 30 Q148 30 150 80 Z" fill="#FF7A8A"/><path d="M100 74 L180 76 Q184 86 170 88 L100 84 Z" fill="#E0536A"/><circle cx="100" cy="32" r="5" fill="#E0536A"/>`;
    case 'wizard': return `<path d="M100 2 L142 74 L58 74 Z" fill="#6B5BD6"/><ellipse cx="100" cy="74" rx="58" ry="11" fill="#5243B8"/>${star(104, 44, 9, '#FFD34D')}<circle cx="88" cy="28" r="2.5" fill="#FFD34D"/>`;
    default: return '';
  }
}

function accBelow(t) {
  switch (t) {
    case 'balloon': return `<path d="M160 148 Q170 110 168 72" stroke="#9A8FC0" stroke-width="2" fill="none"/><ellipse cx="168" cy="50" rx="18" ry="22" fill="#FF6B9A"/><path d="M164 72 L172 72 L168 66 Z" fill="#FF6B9A"/><ellipse cx="161" cy="42" rx="5" ry="8" fill="#fff" opacity=".5"/>`;
    case 'bowtie': return `<path d="M100 170 L80 160 L80 180 Z M100 170 L120 160 L120 180 Z" fill="#FF6B9A"/><circle cx="100" cy="170" r="6" fill="#D9467A"/>`;
    case 'scarf': return `<path d="M48 154 Q100 176 152 154 L154 168 Q100 192 46 168 Z" fill="#5BB8FF"/><rect x="120" y="166" width="15" height="24" rx="5" fill="#3A96E0"/>`;
    case 'medal': return `<path d="M88 152 L96 170 M112 152 L104 170" stroke="#5BB8FF" stroke-width="7"/><circle cx="100" cy="174" r="11" fill="#FFD34D" stroke="#D89B00" stroke-width="3"/>${star(100, 174, 5, '#fff')}`;
    case 'heart': return heart(134, 160, 1.6, '#FF4D7A', '#fff', 3);
    default: return '';
  }
}
function accFace(t) {
  switch (t) {
    case 'glasses': return `<circle cx="76" cy="112" r="16" fill="#fff" fill-opacity=".2" stroke="${INK}" stroke-width="4"/><circle cx="124" cy="112" r="16" fill="#fff" fill-opacity=".2" stroke="${INK}" stroke-width="4"/><path d="M92 110 Q100 105 108 110" stroke="${INK}" stroke-width="4" fill="none"/>`;
    case 'bandaid': return `<g transform="rotate(-30 138 132)"><rect x="124" y="126" width="28" height="11" rx="5" fill="#F5C9A0" stroke="#D9A070" stroke-width="1.5"/><circle cx="135" cy="131.5" r="1.2" fill="#D9A070"/><circle cx="141" cy="131.5" r="1.2" fill="#D9A070"/></g>`;
    case 'mustache': return `<path d="M100 127 Q88 117 78 126 Q84 136 100 130 Q116 136 122 126 Q112 117 100 127 Z" fill="${INK}"/>`;
    default: return '';
  }
}

export function renderAvatar(a = {}, { bg = true } = {}) {
  const v = { shape: 'round', body: '#B9B8FF', eyes: 'dot', mouth: 'smile', hat: 'none', acc: 'none', bg: '#ECE4FF', ...a };
  if (!(v.shape in TOP)) v.shape = 'round';
  const dy = TOP[v.shape] - 62;
  const cheeks = v.eyes === 'shades' ? '' : `<ellipse cx="60" cy="130" rx="10" ry="6" fill="#FF7A9C" opacity=".45"/><ellipse cx="140" cy="130" rx="10" ry="6" fill="#FF7A9C" opacity=".45"/>`;
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="av">` +
    (bg ? `<rect width="200" height="200" rx="48" fill="${v.bg}"/><circle cx="40" cy="36" r="5" fill="#fff" opacity=".35"/><circle cx="168" cy="164" r="7" fill="#fff" opacity=".25"/>` : '') +
    `<ellipse cx="100" cy="190" rx="54" ry="7" fill="#000" opacity=".12"/>` +
    body(v.shape, v.body) + accBelow(v.acc) + cheeks + eyes(v.eyes) + mouth(v.mouth) + accFace(v.acc) +
    `<g transform="translate(0 ${dy})">${hat(v.hat)}</g></svg>`;
}
