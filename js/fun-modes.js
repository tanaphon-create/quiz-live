// โหมดสนุก ๆ: ปราบบอส · เดิมพัน · แข่งจรวด (ใช้ทั้งจอครูและมือถือนักเรียน)
import { MODES } from './ui.js?v=20261124a';
const INK = '#3A2E5C';

Object.assign(MODES, {
  boss: { icon: '🐉', name: 'ปราบบอส', desc: 'ทั้งห้องช่วยกันสู้บอส ตอบถูก = โจมตี ทำเลือดบอสหมดก่อนจบเกม ชนะทั้งห้อง!' },
  wager: { icon: '🎰', name: 'เดิมพัน', desc: `เริ่มที่ 1,000 คะแนน เลือกวางเดิมพันก่อนตอบ ถูกได้ 2 เท่า ผิดเสียเดิมพัน` },
  rocket: { icon: '🚀', name: 'แข่งจรวด', desc: 'ตอบถูก + เร็ว จรวดพุ่งไกล ใครถึงดวงจันทร์ก่อนชนะ!' },
});
// สีประจำโหมด (การ์ดเลือกโหมด / ป้ายบนมือถือ)
export const MODE_COLOR = { classic: '#FFB547', team: '#5BB8FF', survival: '#FF6B8A', vote: '#9B7BFF', land: '#3CCB8F', boss: '#5FCB6E', wager: '#FF8A3D', rocket: '#6C7BFF' };

/* ───────── 🐉 ปราบบอส ───────── */
export const BOSSES = {
  dragon: { name: 'มังกรจอมซน', c: '#7BD88F', dk: '#3FA35A', e: '🐉' },
  slime: { name: 'สไลม์ยักษ์', c: '#7CC4FF', dk: '#3A8FD9', e: '🫧' },
  ghost: { name: 'ราชาผีขี้เล่น', c: '#C9A6FF', dk: '#8B63E0', e: '👻' },
};
// ระดับความยาก = สัดส่วนเลือดบอสเทียบกับคะแนนที่ทั้งห้องทำได้สูงสุด
export const BOSS_LV = { easy: { label: 'ง่าย', f: 0.28 }, normal: { label: 'ปกติ', f: 0.42 }, hard: { label: 'ยาก', f: 0.58 } };
export const bossHP = (nPlayers, nQ, lv = 'normal') => Math.max(1500, Math.round(Math.max(1, nPlayers) * Math.max(1, nQ) * 1000 * (BOSS_LV[lv] || BOSS_LV.normal).f));

function face(mood, cx = 100, cy = 100) {
  const L = cx - 24, R = cx + 24, Y = cy;
  let eyes;
  if (mood === 'hurt') eyes = `<path d="M${L - 10} ${Y - 8} L${L + 6} ${Y} L${L - 10} ${Y + 8} M${R + 10} ${Y - 8} L${R - 6} ${Y} L${R + 10} ${Y + 8}" stroke="${INK}" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M${R + 26} ${Y - 26} q6 10 0 16 q-6 -6 0 -16 Z" fill="#8FD3FF"/>`;
  else if (mood === 'dizzy') eyes = [L, R].map((x) => `<path d="M${x} ${Y} m-2 0 a2 2 0 1 1 4 0 a5 5 0 1 1 -10 0 a8 8 0 1 1 16 0 a11 11 0 1 1 -22 0" stroke="${INK}" stroke-width="3.2" fill="none" stroke-linecap="round"/>`).join('');
  else if (mood === 'smug') eyes = [L, R].map((x) => `<path d="M${x - 11} ${Y + 2} Q${x} ${Y - 10} ${x + 11} ${Y + 2}" stroke="${INK}" stroke-width="6" fill="none" stroke-linecap="round"/>`).join('');
  else eyes = [L, R].map((x, i) => `<ellipse cx="${x}" cy="${Y}" rx="12" ry="14" fill="${INK}"/><circle cx="${x + 4}" cy="${Y - 5}" r="4.5" fill="#fff"/><circle cx="${x - 4}" cy="${Y + 5}" r="2" fill="#fff"/>` +
    `<path d="M${x - 14} ${Y - 22} L${x + 12} ${Y - 16}" transform="${i ? `scale(-1 1) translate(${-2 * x} 0)` : ''}" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`).join('');
  const mouth = mood === 'dizzy' ? `<ellipse cx="${cx}" cy="${Y + 30}" rx="9" ry="11" fill="${INK}"/>`
    : mood === 'hurt' ? `<path d="M${cx - 14} ${Y + 32} Q${cx - 7} ${Y + 24} ${cx} ${Y + 32} Q${cx + 7} ${Y + 40} ${cx + 14} ${Y + 32}" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>`
    : mood === 'smug' ? `<path d="M${cx - 18} ${Y + 26} Q${cx} ${Y + 44} ${cx + 18} ${Y + 26} Z" fill="${INK}"/><path d="M${cx - 6} ${Y + 34} Q${cx} ${Y + 42} ${cx + 6} ${Y + 34}" fill="#FF7A9C"/>`
    : `<path d="M${cx - 20} ${Y + 26} Q${cx} ${Y + 40} ${cx + 20} ${Y + 26}" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M${cx - 12} ${Y + 30} L${cx - 8} ${Y + 38} L${cx - 4} ${Y + 32} Z M${cx + 12} ${Y + 30} L${cx + 8} ${Y + 38} L${cx + 4} ${Y + 32} Z" fill="#fff" stroke="${INK}" stroke-width="1.6"/>`;
  const blush = `<ellipse cx="${L - 14}" cy="${Y + 22}" rx="11" ry="6" fill="#FF7A9C" opacity=".45"/><ellipse cx="${R + 14}" cy="${Y + 22}" rx="11" ry="6" fill="#FF7A9C" opacity=".45"/>`;
  const stars = mood === 'dizzy' ? [[cx - 50, cy - 56], [cx, cy - 70], [cx + 50, cy - 56]].map(([x, y]) => `<path d="M${x} ${y - 9} L${x + 3} ${y - 3} L${x + 9} ${y} L${x + 3} ${y + 3} L${x} ${y + 9} L${x - 3} ${y + 3} L${x - 9} ${y} L${x - 3} ${y - 3} Z" fill="#FFD34D"/>`).join('') : '';
  return blush + eyes + mouth + stars;
}

export function bossSVG(kind = 'dragon', mood = 'normal') {
  const B = BOSSES[kind] || BOSSES.dragon, c = B.c, dk = B.dk, o = `stroke="${dk}" stroke-width="5" stroke-linejoin="round"`;
  let body = '';
  if (kind === 'slime') {
    body = `<path d="M30 160 Q24 92 100 40 Q176 92 170 160 Q172 178 150 178 Q146 192 132 186 Q120 196 108 184 Q92 194 80 184 Q64 194 56 180 Q30 182 30 160 Z" fill="${c}" ${o}/>` +
      `<ellipse cx="70" cy="80" rx="16" ry="9" fill="#fff" opacity=".6" transform="rotate(-35 70 80)"/><circle cx="148" cy="150" r="6" fill="#fff" opacity=".5"/>` +
      `<path d="M78 40 L84 20 L94 34 L100 14 L106 34 L116 20 L122 40 Z" fill="#FFD34D" stroke="#D89B00" stroke-width="3" stroke-linejoin="round"/>`;
  } else if (kind === 'ghost') {
    body = `<path d="M34 112 C34 62 64 36 100 36 C136 36 166 62 166 112 L166 180 Q154 166 142 180 Q130 194 118 180 Q106 166 94 180 Q82 194 70 180 Q58 166 46 180 Q38 188 34 180 Z" fill="${c}" ${o}/>` +
      `<path d="M38 120 Q14 112 16 90 Q30 104 42 106 Z M162 120 Q186 112 184 90 Q170 104 158 106 Z" fill="${c}" ${o}/>` +
      `<path d="M66 44 L60 10 L82 26 L100 4 L118 26 L140 10 L134 44 Z" fill="#FFD34D" stroke="#D89B00" stroke-width="3" stroke-linejoin="round"/><circle cx="100" cy="28" r="5" fill="#FF5D8F"/>` +
      `<ellipse cx="66" cy="66" rx="14" ry="8" fill="#fff" opacity=".55" transform="rotate(-35 66 66)"/>`;
  } else {
    body = `<path d="M150 150 Q196 150 192 114 Q182 132 160 132 Z" fill="${c}" ${o}/>` +
      `<path d="M40 96 Q2 70 10 36 Q30 62 54 66 Z M160 96 Q198 70 190 36 Q170 62 146 66 Z" fill="#B8F0C8" ${o}/>` +
      `<path d="M64 52 L58 18 L84 40 Z M136 52 L142 18 L116 40 Z" fill="#FFE38A" stroke="#D89B00" stroke-width="4" stroke-linejoin="round"/>` +
      `<ellipse cx="100" cy="116" rx="68" ry="66" fill="${c}" ${o}/>` +
      `<ellipse cx="100" cy="150" rx="40" ry="28" fill="#F4FFE8" opacity=".9"/>` +
      `<path d="M84 64 L92 50 L100 64 L108 50 L116 64" fill="none" stroke="${dk}" stroke-width="4" stroke-linejoin="round"/>` +
      `<ellipse cx="66" cy="78" rx="14" ry="8" fill="#fff" opacity=".55" transform="rotate(-35 66 78)"/>`;
  }
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="boss-svg"><ellipse cx="100" cy="192" rx="62" ry="7" fill="#000" opacity=".12"/>${body}${face(mood, 100, kind === 'slime' ? 116 : 106)}</svg>`;
}
export const hpBar = (hp, max) => {
  const p = Math.max(0, Math.min(100, (hp / Math.max(1, max)) * 100));
  return `<div class="hpbar ${p <= 25 ? 'low' : ''}"><i style="width:${p}%"></i><span>❤️ ${Math.round(p)}%</span></div>`;
};

/* ───────── 🎰 เดิมพัน ───────── */
export const WAGER_BETS = [100, 300, 500, 1000];
export const WAGER_START = 1000;
// ถูกได้ 2 เท่าของเดิมพัน · ผิดเสียเดิมพัน (คะแนนไม่ติดลบ) · ข้อคะแนน x2 คูณตาม
export const wagerOf = (bet) => (WAGER_BETS.includes(+bet) ? +bet : 300);

/* ───────── 🚀 แข่งจรวด ───────── */
export const rocketGoal = (nQ) => Math.max(2000, Math.round(Math.max(1, nQ) * 1000 * 0.62));
export const pctOf = (score, goal) => Math.max(0, Math.min(100, Math.round(((score || 0) / Math.max(1, goal)) * 100)));
