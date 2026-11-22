// หน้าต่างเลือกเพลงประกอบ (เกมคำถาม · โหมดห้องเรียน) — แตะเพื่อฟังตัวอย่าง จำไว้ในเครื่องนี้
import { MUSIC_PACKS, getMusicPick, setMusicPick, music, musicOn, currentSong, unlock, isMuted } from './sound.js';

const CSS = `
.mu-pick { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px; }
.mu-card { position: relative; display: grid; grid-template-columns: auto 1fr; align-items: center; gap: 2px 10px; padding: 10px 12px; border-radius: 16px; background: #fff; border: 2px solid #ECE8F8; cursor: pointer; font: inherit; color: var(--ink, #2B2350); text-align: left; transition: transform .15s, border-color .15s; }
.mu-card:hover { transform: translateY(-2px); }
.mu-card > span { grid-row: span 2; font-size: 1.7rem; line-height: 1; }
.mu-card b { font-size: .95rem; line-height: 1.3; }
.mu-card small { font-size: .78rem; color: var(--ink2, #6B6290); line-height: 1.3; }
.mu-card[aria-pressed='true'] { border-color: var(--accent, #6C4DFF); background: #F6F3FF; }
.mu-card[aria-pressed='true']::after { content: '♪'; position: absolute; top: 6px; right: 8px; width: 22px; height: 22px; border-radius: 50%; background: var(--accent, #6C4DFF); color: #fff; font-weight: 800; display: grid; place-items: center; font-size: .8rem; }
.mu-sec { margin: 12px 0 6px; font-weight: 700; font-size: .9rem; color: var(--ink2, #6B6290); }
.mu-sec:first-of-type { margin-top: 0; }
.th-foot.mu-foot { justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; }
.mu-foot .mu-now { font-size: .9rem; color: var(--ink2, #6B6290); }
@media (max-width: 420px) { .mu-pick { grid-template-columns: 1fr 1fr; } }`;

const NEW = ['christmas', 'calm', 'lofi', 'chip', 'jazz', 'dance', 'kids', 'rock'];
const card = (p, cur) => `<button type="button" class="mu-card" data-mu="${p.id}" aria-pressed="${p.id === cur}"><span aria-hidden="true">${p.emoji}</span><b>${p.name}</b><small>${p.desc}</small></button>`;

/** เปิดหน้าต่างเลือกเพลง · preview = ชื่อเพลงที่ใช้ฟังตัวอย่าง ('lobby' | 'classroom') */
export function openMusicPicker({ preview = 'lobby', onPick } = {}) {
  if (!document.getElementById('muCss')) { const st = document.createElement('style'); st.id = 'muCss'; st.textContent = CSS; document.head.append(st); }
  let dlg = document.getElementById('muDlg');
  if (!dlg) { dlg = document.createElement('dialog'); dlg.id = 'muDlg'; dlg.className = 'th-dlg'; document.body.append(dlg); }
  const before = musicOn() ? currentSong() : null;   // เพลงที่เล่นอยู่ก่อนเปิด — คืนค่าเมื่อปิด
  const cur = getMusicPick();
  const auto = MUSIC_PACKS.filter((p) => p.id === 'auto'), fresh = MUSIC_PACKS.filter((p) => NEW.includes(p.id)), more = MUSIC_PACKS.filter((p) => p.id !== 'auto' && !NEW.includes(p.id));
  dlg.innerHTML = `<h3>🎼 เลือกเพลงประกอบ</h3><p>แตะเพื่อฟังตัวอย่าง · ใช้กับเกมคำถามและโหมดห้องเรียนในเครื่องนี้ · ตอนตอบคำถามเพลงจะเร้าใจขึ้นเอง</p>
    <div class="mu-sec">แบบอัตโนมัติ</div><div class="mu-pick">${auto.map((p) => card(p, cur)).join('')}</div>
    <div class="mu-sec">✨ เพลงใหม่</div><div class="mu-pick">${fresh.map((p) => card(p, cur)).join('')}</div>
    <div class="mu-sec">🎨 เพลงประจำธีม</div><div class="mu-pick">${more.map((p) => card(p, cur)).join('')}</div>
    <div class="th-foot mu-foot"><span class="mu-now" aria-live="polite">${isMuted() ? '🔇 ตอนนี้ปิดเสียงอยู่' : ''}</span><button type="button" class="btn" data-done>เสร็จแล้ว</button></div>`;
  let previewing = false;
  const restore = () => { if (!previewing) return; previewing = false; music(before); };
  dlg.onclose = restore;
  dlg.onclick = (e) => {
    if (e.target === dlg || e.target.closest('[data-done]')) return dlg.close();
    const c = e.target.closest('[data-mu]'); if (!c) return;
    unlock();
    dlg.querySelectorAll('[data-mu]').forEach((x) => x.setAttribute('aria-pressed', x === c));
    setMusicPick(c.dataset.mu);
    const p = MUSIC_PACKS.find((x) => x.id === c.dataset.mu);
    dlg.querySelector('.mu-now').textContent = isMuted() ? '🔇 ปิดเสียงอยู่ — เปิดเสียงก่อนจึงจะได้ยิน' : `▶ กำลังเล่น: ${p.emoji} ${p.name}`;
    if (!before || before !== preview) { previewing = true; music(preview); }   // ฟังตัวอย่าง (ถ้าเพลงเล่นอยู่แล้ว setMusicPick สลับให้เอง)
    onPick?.(c.dataset.mu);
  };
  dlg.showModal();
}
