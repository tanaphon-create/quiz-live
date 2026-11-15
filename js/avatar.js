// ตัวละคร SVG ที่นักเรียนแต่งตัวได้
const INK = '#2B2350';

export const OPTS = {
  shape: { label: 'รูปร่าง', items: ['round', 'bean', 'square', 'ghost', 'cat'] },
  body: { label: 'สีตัว', items: ['#FF7A8A', '#FFB547', '#FFE066', '#6EE7A8', '#4FC3F7', '#7C8CFF', '#C084FC', '#F9A8D4', '#B8C0CC', '#A9744F'] },
  eyes: { label: 'ตา', items: ['dot', 'happy', 'sparkle', 'sleepy', 'wink', 'shades', 'angry', 'star'] },
  mouth: { label: 'ปาก', items: ['smile', 'grin', 'open', 'cat', 'tongue', 'o', 'flat', 'fang'] },
  hat: { label: 'หมวก', items: ['none', 'cap', 'crown', 'beanie', 'headphones', 'bunny', 'wizard', 'flower', 'chef', 'halo'] },
  acc: { label: 'ของแต่ง', items: ['none', 'blush', 'glasses', 'bowtie', 'scarf', 'mustache', 'sticker', 'medal'] },
  bg: { label: 'พื้นหลัง', items: ['#2E2A6B', '#0F766E', '#9D174D', '#1D4ED8', '#B45309', '#334155', '#7E22CE', '#15803D'] },
};

const pick = (a) => a[Math.floor(Math.random() * a.length)];
export function randomAvatar() {
  return {
    shape: pick(OPTS.shape.items),
    body: pick(OPTS.body.items),
    eyes: pick(OPTS.eyes.items),
    mouth: pick(OPTS.mouth.items),
    hat: Math.random() < 0.4 ? 'none' : pick(OPTS.hat.items),
    acc: Math.random() < 0.4 ? 'none' : pick(OPTS.acc.items),
    bg: pick(OPTS.bg.items),
  };
}

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt)));
  return '#' + ((1 << 24) | (f(n >> 16) << 16) | (f((n >> 8) & 255) << 8) | f(n & 255)).toString(16).slice(1);
}

function star(cx, cy, r, fill, stroke = 'none', sw = 0) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 ? r * 0.45 : r;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    pts.push((cx + rr * Math.cos(a)).toFixed(1) + ',' + (cy + rr * Math.sin(a)).toFixed(1));
  }
  return `<polygon points="${pts.join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>`;
}

const TOP = { round: 60, bean: 50, square: 60, ghost: 56, cat: 60 };

function body(shape, c) {
  const dk = shade(c, -0.2), lt = shade(c, 0.4);
  const feet = shape === 'ghost' ? '' :
    `<ellipse cx="76" cy="180" rx="17" ry="9" fill="${dk}"/><ellipse cx="124" cy="180" rx="17" ry="9" fill="${dk}"/>`;
  let main;
  switch (shape) {
    case 'bean': main = `<rect x="48" y="50" width="104" height="128" rx="52" fill="${c}"/>`; break;
    case 'square': main = `<rect x="40" y="60" width="120" height="116" rx="32" fill="${c}"/>`; break;
    case 'ghost': main = `<path d="M40 118 C40 78 66 56 100 56 C134 56 160 78 160 118 L160 182 Q150 170 140 182 Q130 194 120 182 Q110 170 100 182 Q90 194 80 182 Q70 170 60 182 Q50 194 40 182 Z" fill="${c}"/>`; break;
    case 'cat': main = `<path d="M46 92 L50 38 L88 64 Z M154 92 L150 38 L112 64 Z" fill="${c}"/><path d="M56 80 L58 52 L78 66 Z M144 80 L142 52 L122 66 Z" fill="${shade(c, 0.5)}"/><ellipse cx="100" cy="120" rx="62" ry="60" fill="${c}"/>`; break;
    default: main = `<ellipse cx="100" cy="120" rx="62" ry="60" fill="${c}"/>`;
  }
  return feet + main +
    `<ellipse cx="100" cy="152" rx="34" ry="20" fill="${lt}" opacity=".4"/>` +
    `<ellipse cx="70" cy="${TOP[shape] + 26}" rx="13" ry="7" fill="#fff" opacity=".4" transform="rotate(-28 70 ${TOP[shape] + 26})"/>`;
}

function eyes(t) {
  const L = 78, R = 122, Y = 108;
  const dot = (x) => `<circle cx="${x}" cy="${Y}" r="8" fill="${INK}"/><circle cx="${x + 2.5}" cy="${Y - 3}" r="2.6" fill="#fff"/>`;
  const arc = (x) => `<path d="M${x - 9} ${Y + 3} Q${x} ${Y - 9} ${x + 9} ${Y + 3}" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  switch (t) {
    case 'happy': return arc(L) + arc(R);
    case 'sparkle': return [L, R].map((x) => `<circle cx="${x}" cy="${Y}" r="13" fill="#fff"/><circle cx="${x}" cy="${Y + 1}" r="9" fill="${INK}"/><circle cx="${x + 3}" cy="${Y - 3}" r="3.6" fill="#fff"/><circle cx="${x - 3}" cy="${Y + 4}" r="1.7" fill="#fff"/>`).join('');
    case 'sleepy': return [L, R].map((x) => `<path d="M${x - 9} ${Y} Q${x} ${Y + 8} ${x + 9} ${Y}" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>`).join('');
    case 'wink': return dot(L) + arc(R);
    case 'shades': return `<rect x="58" y="97" width="36" height="22" rx="9" fill="${INK}"/><rect x="106" y="97" width="36" height="22" rx="9" fill="${INK}"/><rect x="92" y="103" width="16" height="5" rx="2" fill="${INK}"/><path d="M65 103 L76 103 M113 103 L124 103" stroke="#fff" stroke-width="3" opacity=".55" stroke-linecap="round"/>`;
    case 'angry': return dot(L) + dot(R) + `<path d="M66 93 L88 100 M134 93 L112 100" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`;
    case 'star': return star(L, Y, 11, '#FFD23F', INK, 2.5) + star(R, Y, 11, '#FFD23F', INK, 2.5);
    default: return dot(L) + dot(R);
  }
}

function mouth(t) {
  const s = `stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"`;
  switch (t) {
    case 'grin': return `<path d="M84 128 L116 128 Q100 154 84 128 Z" fill="${INK}"/><rect x="89" y="128" width="22" height="5" rx="1.5" fill="#fff"/>`;
    case 'open': return `<ellipse cx="100" cy="136" rx="9" ry="11" fill="${INK}"/><ellipse cx="100" cy="141" rx="6" ry="4" fill="#FF7A9C"/>`;
    case 'cat': return `<path d="M86 130 Q93 139 100 131 Q107 139 114 130" ${s}/>`;
    case 'tongue': return `<path d="M95 135 Q95 149 101 149 Q107 149 107 135 Z" fill="#FF7A9C" stroke="${INK}" stroke-width="2.5"/><path d="M87 130 Q100 141 113 130" ${s}/>`;
    case 'o': return `<circle cx="100" cy="135" r="6.5" fill="${INK}"/>`;
    case 'flat': return `<path d="M90 134 L110 134" ${s}/>`;
    case 'fang': return `<path d="M87 130 Q100 142 113 130" ${s}/><path d="M93 135 L96 143 L99 137 Z" fill="#fff" stroke="${INK}" stroke-width="1.5"/>`;
    default: return `<path d="M87 130 Q100 143 113 130" ${s}/>`;
  }
}

function hat(t) {
  switch (t) {
    case 'cap': return `<path d="M50 76 Q52 28 100 28 Q148 28 150 76 Z" fill="#E63946"/><path d="M100 72 L180 74 Q184 84 170 86 L100 82 Z" fill="#B71C2C"/><circle cx="100" cy="30" r="5" fill="#B71C2C"/><path d="M60 66 L140 66" stroke="#fff" stroke-width="4" opacity=".45"/>`;
    case 'crown': return `<path d="M64 70 L58 26 L80 46 L100 18 L120 46 L142 26 L136 70 Z" fill="#FFC93C" stroke="#D89B00" stroke-width="3" stroke-linejoin="round"/><circle cx="100" cy="54" r="6" fill="#E63946"/><circle cx="78" cy="60" r="4" fill="#3BA3FF"/><circle cx="122" cy="60" r="4" fill="#22C58B"/>`;
    case 'beanie': return `<path d="M44 82 Q44 24 100 24 Q156 24 156 82 Z" fill="#7C5CFF"/><path d="M70 30 L70 78 M100 24 L100 78 M130 30 L130 78" stroke="#6A48F0" stroke-width="5"/><rect x="40" y="70" width="120" height="18" rx="9" fill="#5B3FD9"/><circle cx="100" cy="22" r="12" fill="#FFD23F"/>`;
    case 'headphones': return `<path d="M42 114 Q42 40 100 40 Q158 40 158 114" stroke="${INK}" stroke-width="9" fill="none" stroke-linecap="round"/><rect x="28" y="98" width="22" height="36" rx="10" fill="#FF5D73"/><rect x="150" y="98" width="22" height="36" rx="10" fill="#FF5D73"/>`;
    case 'bunny': return `<ellipse cx="76" cy="34" rx="13" ry="32" fill="#fff" transform="rotate(-14 76 34)"/><ellipse cx="76" cy="36" rx="6" ry="22" fill="#FFB3C7" transform="rotate(-14 76 36)"/><ellipse cx="124" cy="34" rx="13" ry="32" fill="#fff" transform="rotate(14 124 34)"/><ellipse cx="124" cy="36" rx="6" ry="22" fill="#FFB3C7" transform="rotate(14 124 36)"/><path d="M52 78 Q100 50 148 78" stroke="#FF8FB1" stroke-width="7" fill="none" stroke-linecap="round"/>`;
    case 'wizard': return `<path d="M100 2 L142 72 L58 72 Z" fill="#3B2C85"/><ellipse cx="100" cy="72" rx="58" ry="11" fill="#2A1F63"/>${star(104, 42, 9, '#FFD23F')}<circle cx="88" cy="26" r="2.5" fill="#FFD23F"/>`;
    case 'flower': return `<g transform="translate(140 62)">${[0, 72, 144, 216, 288].map((a) => `<circle cx="${(12 * Math.cos(a * Math.PI / 180)).toFixed(1)}" cy="${(12 * Math.sin(a * Math.PI / 180)).toFixed(1)}" r="10" fill="#FF8FB1"/>`).join('')}<circle r="8" fill="#FFD23F"/></g>`;
    case 'chef': return `<path d="M62 78 L62 56 Q44 52 50 34 Q57 18 74 25 Q80 8 100 12 Q120 8 126 25 Q143 18 150 34 Q156 52 138 56 L138 78 Z" fill="#fff" stroke="#DCD6F2" stroke-width="3"/><rect x="62" y="64" width="76" height="14" fill="#EFEBFB"/>`;
    case 'halo': return `<ellipse cx="100" cy="34" rx="36" ry="10" fill="none" stroke="#FFD23F" stroke-width="7"/>`;
    default: return '';
  }
}

function accBelow(t) {
  switch (t) {
    case 'bowtie': return `<path d="M100 168 L78 157 L78 179 Z M100 168 L122 157 L122 179 Z" fill="#E63946"/><circle cx="100" cy="168" r="6" fill="#B71C2C"/>`;
    case 'scarf': return `<path d="M48 150 Q100 172 152 150 L154 164 Q100 188 46 164 Z" fill="#22C58B"/><rect x="120" y="162" width="15" height="28" rx="5" fill="#16A372"/>`;
    case 'medal': return `<path d="M88 148 L96 168 M112 148 L104 168" stroke="#3BA3FF" stroke-width="7"/><circle cx="100" cy="172" r="11" fill="#FFC93C" stroke="#D89B00" stroke-width="3"/>${star(100, 172, 5, '#fff')}`;
    case 'sticker': return star(134, 156, 11, '#FFD23F', '#fff', 3);
    default: return '';
  }
}

function accFace(t) {
  switch (t) {
    case 'blush': return `<ellipse cx="62" cy="126" rx="10" ry="6" fill="#FF7A9C" opacity=".55"/><ellipse cx="138" cy="126" rx="10" ry="6" fill="#FF7A9C" opacity=".55"/>`;
    case 'glasses': return `<circle cx="78" cy="108" r="15" fill="#fff" fill-opacity=".15" stroke="${INK}" stroke-width="4"/><circle cx="122" cy="108" r="15" fill="#fff" fill-opacity=".15" stroke="${INK}" stroke-width="4"/><path d="M93 106 Q100 101 107 106" stroke="${INK}" stroke-width="4" fill="none"/>`;
    case 'mustache': return `<path d="M100 124 Q88 114 78 123 Q84 133 100 127 Q116 133 122 123 Q112 114 100 124 Z" fill="${INK}"/>`;
    default: return '';
  }
}

export function renderAvatar(a = {}, { bg = true } = {}) {
  const v = { ...{ shape: 'round', body: '#7C8CFF', eyes: 'dot', mouth: 'smile', hat: 'none', acc: 'none', bg: '#2E2A6B' }, ...a };
  const dy = (TOP[v.shape] || 60) - 60;
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="av">` +
    (bg ? `<rect width="200" height="200" rx="48" fill="${v.bg}"/><circle cx="100" cy="100" r="78" fill="#fff" opacity=".06"/>` : '') +
    body(v.shape, v.body) + accBelow(v.acc) + eyes(v.eyes) + mouth(v.mouth) + accFace(v.acc) +
    `<g transform="translate(0 ${dy})">${hat(v.hat)}</g></svg>`;
}
