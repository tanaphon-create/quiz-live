// ตัวละคร SVG น่ารัก ๆ ที่นักเรียนแต่งตัวได้
const INK = '#3A2E5C';

export const OPTS = {
  shape: { label: 'ร่าง', items: ['round', 'bear', 'bunny', 'cat', 'chick', 'dino', 'bean', 'ghost', 'panda', 'penguin', 'fox', 'mouse', 'pig', 'unicorn', 'axolotl', 'sheep'] },
  body: { label: 'สีตัว', items: ['#FFB4C2', '#FFC89B', '#FFE38A', '#B8F0C8', '#A8E1FF', '#B9B8FF', '#E0B8FF', '#FFFFFF', '#D9C3A5', '#9EE6DF', '#FF8FA3', '#8FB3FF', '#FFD6E7', '#C9F2A6', '#FFAA80', '#C4B5A0', '#7C7398'] },
  pat: { label: 'ลาย', items: ['none', 'belly', 'spots', 'stripes', 'hearts', 'stars', 'rainbow', 'sparkle', 'freckles'] },
  eyes: { label: 'ตา', items: ['dot', 'sparkle', 'happy', 'wink', 'heart', 'star', 'sleepy', 'dizzy', 'shades'] },
  mouth: { label: 'ปาก', items: ['smile', 'cat', 'open', 'grin', 'tongue', 'o', 'kiss', 'fang', 'smirk'] },
  hat: { label: 'หมวก', items: ['none', 'bow', 'crown', 'frog', 'party', 'sprout', 'beanie', 'headphones', 'flower', 'chef', 'halo', 'cap', 'wizard', 'catears', 'strawberry', 'tiara', 'mushroom'] },
  acc: { label: 'ของแต่ง', items: ['none', 'balloon', 'heart', 'bowtie', 'scarf', 'glasses', 'bandaid', 'medal', 'mustache', 'boba', 'wand', 'lei'] },
  bg: { label: 'พื้นหลัง', items: ['gr:peach', 'gr:sky', 'gr:mint', 'gr:candy', 'gr:sunset', 'gr:night', '#FFE4EC', '#FFF1C9', '#DDF7E3', '#DCEFFF', '#ECE4FF', '#2E2A6B', '#0F766E', '#BE185D', '#1D4ED8', '#334155'] },
};

const pick = (a) => a[Math.floor(Math.random() * a.length)];
export function randomAvatar() {
  return {
    shape: pick(OPTS.shape.items),
    body: pick(OPTS.body.items),
    eyes: pick(['dot', 'dot', 'sparkle', 'sparkle', 'happy', 'wink', 'heart', 'star']),
    mouth: pick(['smile', 'cat', 'open', 'grin', 'tongue', 'o']),
    pat: Math.random() < 0.55 ? 'none' : pick(OPTS.pat.items),
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

const TOP = { round: 62, bear: 62, bunny: 62, cat: 62, chick: 62, dino: 62, bean: 52, ghost: 58, panda: 62, penguin: 62, fox: 62, mouse: 62, pig: 62, unicorn: 62, axolotl: 62, sheep: 62 };
const GRAD = { peach: ['#FFDDE8', '#FFEBC4'], sky: ['#CFEBFF', '#E6DDFF'], mint: ['#D2F6E4', '#FFF4C2'], candy: ['#FFD3E6', '#D3E0FF'], sunset: ['#FFC6B3', '#E3C4FF'], night: ['#2A2766', '#6A3FA0'] };
// สีพื้นหลังสำหรับ CSS (ตัวอย่างในตู้เสื้อผ้า)
export const bgCSS = (v) => { const g = String(v || '').startsWith('gr:') && GRAD[v.slice(3)]; return g ? `linear-gradient(135deg, ${g[0]}, ${g[1]})` : v; };
let UID = 0;

function body(shape, c, pat, id) {
  const dk = shade(c, -0.28), lt = shade(c, 0.5), inner = shade(c, 0.55);
  const o = `stroke="${dk}" stroke-width="4" stroke-linejoin="round"`;
  const fillB = `url(#b${id})`;
  let back = '', deco = '', front = '', limb = c, feetC = c;
  // รูปทรงตัว (ใช้ทั้งวาดและตัดขอบลาย)
  const sil = shape === 'bean' ? `<rect x="46" y="52" width="108" height="128" rx="54"/>`
    : shape === 'ghost' ? `<path d="M40 120 C40 80 66 58 100 58 C134 58 160 80 160 120 L160 182 Q150 170 140 182 Q130 194 120 182 Q110 170 100 182 Q90 194 80 182 Q70 170 60 182 Q50 194 40 182 Z"/>`
    : `<ellipse cx="100" cy="122" rx="62" ry="60"/>`;
  const whisk = `<path d="M40 118 L22 112 M40 126 L22 128 M160 118 L178 112 M160 126 L178 128" stroke="${dk}" stroke-width="3" stroke-linecap="round"/>`;
  switch (shape) {
    case 'bear':
      back = `<circle cx="56" cy="72" r="18" fill="${c}" ${o}/><circle cx="144" cy="72" r="18" fill="${c}" ${o}/><circle cx="56" cy="72" r="9" fill="${inner}"/><circle cx="144" cy="72" r="9" fill="${inner}"/>`;
      front = `<ellipse cx="100" cy="128" rx="17" ry="12" fill="${lt}" opacity=".9"/>`; break;
    case 'bunny':
      back = `<ellipse cx="76" cy="38" rx="13" ry="32" fill="${c}" ${o} transform="rotate(-12 76 38)"/><ellipse cx="124" cy="38" rx="13" ry="32" fill="${c}" ${o} transform="rotate(12 124 38)"/><ellipse cx="76" cy="42" rx="6" ry="21" fill="#FFB3C7" transform="rotate(-12 76 42)"/><ellipse cx="124" cy="42" rx="6" ry="21" fill="#FFB3C7" transform="rotate(12 124 42)"/>`; break;
    case 'cat':
      back = `<path d="M48 92 L50 40 L90 66 Z M152 92 L150 40 L110 66 Z" fill="${c}" ${o}/><path d="M57 78 L58 54 L77 66 Z M143 78 L142 54 L123 66 Z" fill="#FFB3C7"/>`;
      front = whisk; break;
    case 'chick':
      back = `<path d="M100 66 Q92 40 80 44 M100 66 Q100 34 108 38 M100 66 Q112 44 122 50" stroke="${dk}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
      front = `<path d="M40 128 Q26 116 30 102 Q42 112 46 122 Z M160 128 Q174 116 170 102 Q158 112 154 122 Z" fill="${c}" ${o}/>`; break;
    case 'dino':
      back = `<path d="M70 72 L80 44 L92 66 L102 38 L112 64 L124 44 L132 72 Z" fill="${shade(c, -0.12)}" ${o}/>`;
      deco = `<circle cx="80" cy="160" r="5" fill="${dk}" opacity=".25"/><circle cx="118" cy="166" r="4" fill="${dk}" opacity=".25"/><circle cx="134" cy="150" r="3" fill="${dk}" opacity=".25"/>`; break;
    case 'panda': {
      const pd = '#4B4362';
      limb = pd; feetC = pd;
      back = `<circle cx="56" cy="70" r="18" fill="${pd}" stroke="${pd}" stroke-width="4"/><circle cx="144" cy="70" r="18" fill="${pd}" stroke="${pd}" stroke-width="4"/>`;
      deco = `<ellipse cx="75" cy="113" rx="17" ry="21" fill="${pd}" opacity=".32" transform="rotate(-22 75 113)"/><ellipse cx="125" cy="113" rx="17" ry="21" fill="${pd}" opacity=".32" transform="rotate(22 125 113)"/>`;
      front = `<ellipse cx="100" cy="126" rx="6" ry="4.5" fill="${pd}"/>`; break;
    }
    case 'penguin':
      feetC = '#FFB347';
      deco = `<ellipse cx="100" cy="136" rx="46" ry="48" fill="#FFFFFF" opacity=".95"/>`;
      front = `<path d="M93 124 L107 124 L100 132 Z" fill="#FFB347" stroke="#E08A1E" stroke-width="2" stroke-linejoin="round"/>`; break;
    case 'fox':
      back = `<path d="M150 164 Q198 152 186 102 Q172 128 144 142 Z" fill="${c}" ${o}/><path d="M186 102 Q194 122 180 136 Q174 118 186 102 Z" fill="#FFFFFF"/>` +
        `<path d="M44 96 L46 30 L92 64 Z M156 96 L154 30 L108 64 Z" fill="${c}" ${o}/><path d="M54 80 L55 46 L80 64 Z M146 80 L145 46 L120 64 Z" fill="#FFF0DC"/>`;
      deco = `<path d="M38 124 Q66 116 100 140 Q134 116 162 124 Q158 186 100 186 Q42 186 38 124 Z" fill="#FFFFFF" opacity=".92"/>`;
      front = `<ellipse cx="100" cy="127" rx="5" ry="4" fill="${INK}"/>`; break;
    case 'mouse':
      back = `<path d="M152 172 Q188 178 184 150 Q180 132 164 142" stroke="${dk}" stroke-width="4" fill="none" stroke-linecap="round"/>` +
        `<circle cx="50" cy="70" r="25" fill="${c}" ${o}/><circle cx="150" cy="70" r="25" fill="${c}" ${o}/><circle cx="50" cy="70" r="15" fill="#FFB3C7"/><circle cx="150" cy="70" r="15" fill="#FFB3C7"/>`;
      front = whisk + `<ellipse cx="100" cy="126" rx="5" ry="4" fill="#FF7A9C"/>`; break;
    case 'pig':
      back = `<path d="M168 156 q14 -2 10 -13 q-5 -8 -11 -1" stroke="${dk}" stroke-width="4" fill="none" stroke-linecap="round"/>` +
        `<path d="M52 62 L84 70 L60 98 Z M148 62 L116 70 L140 98 Z" fill="${shade(c, -0.08)}" ${o}/>`;
      front = `<ellipse cx="100" cy="121" rx="15" ry="10" fill="${shade(c, -0.1)}" stroke="${dk}" stroke-width="3"/><ellipse cx="95" cy="121" rx="2.6" ry="3.6" fill="${dk}"/><ellipse cx="105" cy="121" rx="2.6" ry="3.6" fill="${dk}"/>`; break;
    case 'unicorn':
      back = `<path d="M60 92 L62 54 L88 70 Z M140 92 L138 54 L112 70 Z" fill="${c}" ${o}/>` +
        `<circle cx="150" cy="86" r="15" fill="#FF9DB5"/><circle cx="160" cy="108" r="14" fill="#FFD34D"/><circle cx="162" cy="132" r="13" fill="#7BD88F"/><circle cx="156" cy="154" r="12" fill="#7CC4FF"/><circle cx="140" cy="70" r="13" fill="#C9A6FF"/>`;
      front = `<path d="M91 68 L100 20 L109 68 Z" fill="#FFE38A" stroke="#E0A800" stroke-width="3" stroke-linejoin="round"/><path d="M94 56 L106 52 M96 44 L104 41 M98 32 L102 31" stroke="#E0A800" stroke-width="2.5" stroke-linecap="round"/>`; break;
    case 'axolotl': {
      const g = '#FF8FB1', gl = (x1, y1, x2, y2) => `<path d="M${x1} ${y1} Q${(x1 + x2) / 2} ${y2 + 6} ${x2} ${y2}" stroke="${g}" stroke-width="9" fill="none" stroke-linecap="round"/><circle cx="${x2}" cy="${y2}" r="6" fill="#FFB8CD"/>`;
      back = gl(50, 98, 20, 76) + gl(46, 112, 14, 108) + gl(50, 126, 20, 142) + gl(150, 98, 180, 76) + gl(154, 112, 186, 108) + gl(150, 126, 180, 142);
      deco = `<ellipse cx="100" cy="164" rx="36" ry="24" fill="${lt}" opacity=".8"/>`; break;
    }
    case 'sheep': {
      const w = '#FFFFFF', ws = 'stroke="#DCD5EE" stroke-width="3"';
      back = `<ellipse cx="40" cy="106" rx="18" ry="9" fill="${shade(c, -0.18)}" ${o} transform="rotate(20 40 106)"/><ellipse cx="160" cy="106" rx="18" ry="9" fill="${shade(c, -0.18)}" ${o} transform="rotate(-20 160 106)"/>` +
        [[54, 84], [70, 64], [92, 56], [114, 56], [134, 64], [148, 84]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="20" fill="${w}" ${ws}/>`).join('');
      front = [[78, 72], [100, 66], [122, 72]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="14" fill="${w}" ${ws}/>`).join(''); break;
    }
  }
  const lo = `stroke="${shade(limb, -0.28)}" stroke-width="4" stroke-linejoin="round"`, fo = `stroke="${shade(feetC, -0.28)}" stroke-width="4" stroke-linejoin="round"`;
  const arms = `<ellipse cx="44" cy="142" rx="11" ry="15" fill="${limb}" ${lo} transform="rotate(25 44 142)"/><ellipse cx="156" cy="142" rx="11" ry="15" fill="${limb}" ${lo} transform="rotate(-25 156 142)"/>`;
  const feet = `<ellipse cx="78" cy="180" rx="16" ry="10" fill="${feetC}" ${fo}/><ellipse cx="122" cy="180" rx="16" ry="10" fill="${feetC}" ${fo}/>`;
  const main = sil.replace(/\/>$/, ` fill="${fillB}" ${o}/>`);
  const clip = deco + pattern(pat, c, dk, lt);
  const defs = `<defs><radialGradient id="b${id}" cx="36%" cy="28%" r="85%"><stop offset="0" stop-color="${shade(c, 0.5)}"/><stop offset=".55" stop-color="${c}"/><stop offset="1" stop-color="${shade(c, -0.12)}"/></radialGradient>` +
    (clip ? `<clipPath id="k${id}">${sil}</clipPath>` : '') + `</defs>`;
  return defs + back + (shape !== 'ghost' ? feet + arms : '') + main + (clip ? `<g clip-path="url(#k${id})">${clip}</g>` : '') + front +
    `<ellipse cx="72" cy="${TOP[shape] + 24}" rx="14" ry="7" fill="#fff" opacity=".6" transform="rotate(-28 72 ${TOP[shape] + 24})"/><circle cx="92" cy="${TOP[shape] + 14}" r="3.5" fill="#fff" opacity=".55"/>`;
}

// ลายบนตัว (ถูกตัดให้อยู่ในรูปทรงตัวเสมอ)
function pattern(t, c, dk, lt) {
  switch (t) {
    case 'belly': return `<ellipse cx="100" cy="166" rx="40" ry="30" fill="${lt}" opacity=".95"/>`;
    case 'spots': return [[58, 88, 9], [140, 84, 7], [150, 150, 10], [52, 156, 8], [122, 170, 6], [72, 176, 5]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${dk}" opacity=".28"/>`).join('');
    case 'stripes': return `<g stroke="${dk}" stroke-width="7" stroke-linecap="round" fill="none" opacity=".3"><path d="M84 62 Q88 74 84 84 M100 60 L100 80 M116 62 Q112 74 116 84"/><path d="M38 132 Q50 134 56 144 M40 150 Q52 150 58 160 M162 132 Q150 134 144 144 M160 150 Q148 150 142 160"/></g>`;
    case 'hearts': return [[56, 160, 1.1], [146, 160, 1.2], [100, 176, 0.9], [138, 84, 0.8], [62, 86, 0.8]].map(([x, y, k]) => heart(x, y, k, '#FF6B9A', 'none', 0).replace('<path', '<path opacity=".7"')).join('');
    case 'stars': return [[56, 160, 7], [146, 158, 8], [100, 178, 6], [140, 84, 5], [60, 86, 5]].map(([x, y, r]) => star(x, y, r, '#FFFFFF').replace('<polygon', '<polygon opacity=".85"')).join('');
    case 'rainbow': return `<g fill="none" stroke-width="7" opacity=".55" stroke-linecap="round">${['#FF7A9C', '#FFB347', '#FFE066', '#7BD88F', '#7CC4FF', '#B49CFF'].map((col, i) => `<path d="M${46 + i * 7} 190 Q100 ${136 + i * 7} ${154 - i * 7} 190" stroke="${col}"/>`).join('')}</g>`;
    case 'sparkle': return [[54, 96], [148, 100], [62, 160], [140, 168], [100, 180], [120, 70], [80, 72]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 2 ? 2.4 : 3.4}" fill="#FFFFFF" opacity=".9"/>`).join('') + star(150, 136, 6, '#FFFFFF') + star(50, 128, 5, '#FFFFFF');
    case 'freckles': return [[64, 124], [56, 132], [68, 136], [136, 124], [144, 132], [132, 136]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.2" fill="${dk}" opacity=".45"/>`).join('');
    default: return '';
  }
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
    case 'catears': return `<path d="M50 84 Q100 40 150 84" stroke="#FF8FB1" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M58 72 L58 34 L88 56 Z M142 72 L142 34 L112 56 Z" fill="#FFB3C7" ${o('#E0688F')}/><path d="M64 64 L64 46 L78 56 Z M136 64 L136 46 L122 56 Z" fill="#FFE4EC"/>`;
    case 'strawberry': return `<path d="M48 84 Q48 30 100 28 Q152 30 152 84 Z" fill="#FF5D73" ${o('#D93A52')}/>${[[70, 58], [92, 46], [116, 48], [134, 64], [82, 74], [108, 68], [124, 80], [64, 78]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="2.4" ry="3.6" fill="#FFE38A"/>`).join('')}<path d="M100 34 L82 20 L95 24 L100 8 L105 24 L118 20 Z" fill="#4FD69C" ${o('#2F9E63')}/>`;
    case 'tiara': return `<path d="M62 76 Q100 62 138 76 L134 56 L120 66 L112 44 L100 62 L88 44 L80 66 L66 56 Z" fill="#F1EEFF" stroke="#B9B3D6" stroke-width="2.5" stroke-linejoin="round"/><circle cx="100" cy="60" r="6" fill="#FF6B9A"/><circle cx="80" cy="66" r="3.5" fill="#7CC4FF"/><circle cx="120" cy="66" r="3.5" fill="#7CC4FF"/>`;
    case 'mushroom': return `<path d="M38 82 Q42 20 100 20 Q158 20 162 82 Q100 70 38 82 Z" fill="#FF6B6B" ${o('#D94848')}/><circle cx="74" cy="46" r="9" fill="#fff"/><circle cx="112" cy="36" r="7" fill="#fff"/><circle cx="136" cy="60" r="8" fill="#fff"/><circle cx="96" cy="62" r="5" fill="#fff"/><circle cx="56" cy="68" r="4" fill="#fff"/>`;
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
    case 'boba': return `<g transform="translate(164 132) rotate(10)"><path d="M6 -22 L14 -44" stroke="#FF6B9A" stroke-width="5" stroke-linecap="round"/><path d="M-14 -16 L14 -16 L10 24 L-10 24 Z" fill="#F6E6D6" stroke="#B98B66" stroke-width="2.5" stroke-linejoin="round"/><rect x="-16" y="-21" width="32" height="7" rx="3.5" fill="#FF9DB5"/>${[[-5, 16], [3, 18], [-1, 10], [6, 9]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#5B3A29"/>`).join('')}</g>`;
    case 'wand': return `<path d="M150 154 L172 100" stroke="#B98B66" stroke-width="5" stroke-linecap="round"/>${star(174, 92, 14, '#FFD34D', '#E0A800', 2.5)}<circle cx="190" cy="78" r="2.5" fill="#FFD34D"/><circle cx="160" cy="76" r="2" fill="#FFD34D"/>`;
    case 'lei': return [[54, 152, '#FF9DB5'], [70, 162, '#FFD34D'], [86, 168, '#7CC4FF'], [100, 170, '#FF9DB5'], [114, 168, '#C9A6FF'], [130, 162, '#7BD88F'], [146, 152, '#FFD34D']].map(([x, y, col]) => `<g transform="translate(${x} ${y})">${[0, 72, 144, 216, 288].map((d) => `<circle cx="${(5 * Math.cos(d * Math.PI / 180)).toFixed(1)}" cy="${(5 * Math.sin(d * Math.PI / 180)).toFixed(1)}" r="4.4" fill="${col}"/>`).join('')}<circle r="3" fill="#fff"/></g>`).join('');
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
  const v = { shape: 'round', body: '#B9B8FF', eyes: 'dot', mouth: 'smile', hat: 'none', acc: 'none', pat: 'none', bg: '#ECE4FF', ...a };
  const id = (++UID).toString(36), g = String(v.bg).startsWith('gr:') && GRAD[v.bg.slice(3)];
  if (!(v.shape in TOP)) v.shape = 'round';
  const dy = TOP[v.shape] - 62;
  const cheeks = v.eyes === 'shades' ? '' : `<ellipse cx="60" cy="130" rx="10" ry="6" fill="#FF7A9C" opacity=".45"/><ellipse cx="140" cy="130" rx="10" ry="6" fill="#FF7A9C" opacity=".45"/>`;
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="av">` +
    (bg ? (g ? `<defs><linearGradient id="g${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${g[0]}"/><stop offset="1" stop-color="${g[1]}"/></linearGradient></defs>` : '') +
      `<rect width="200" height="200" rx="48" fill="${g ? `url(#g${id})` : v.bg}"/><circle cx="40" cy="36" r="5" fill="#fff" opacity=".35"/><circle cx="168" cy="164" r="7" fill="#fff" opacity=".25"/>` +
      (v.bg === 'gr:night' ? star(160, 40, 6, '#FFE38A') + star(34, 150, 4, '#FFE38A') + `<circle cx="150" cy="70" r="2" fill="#fff"/><circle cx="56" cy="60" r="1.6" fill="#fff"/>` : '') : '') +
    `<ellipse cx="100" cy="190" rx="54" ry="7" fill="#000" opacity=".12"/>` +
    body(v.shape, v.body, v.pat, id) + accBelow(v.acc) + cheeks + eyes(v.eyes) + mouth(v.mouth) + accFace(v.acc) +
    `<g transform="translate(0 ${dy})">${hat(v.hat)}</g></svg>`;
}
