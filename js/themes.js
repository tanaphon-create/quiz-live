// ธีมพื้นหลังเกมคำถาม: เลือก/จำ/ใช้ + หน้าต่างเลือกธีม
import { THEMES } from './themes-list.js';
export { THEMES };
const KEY = 'gc_theme';
export const DEFAULT_THEME = 'ghost';
const valid = (id) => THEMES.some((t) => t.id === id);
export function savedTheme() { try { const v = localStorage.getItem(KEY); return valid(v) ? v : DEFAULT_THEME; } catch { return DEFAULT_THEME; } }
export function applyTheme(id, { remember = false } = {}) {
  if (!valid(id)) id = DEFAULT_THEME;
  document.documentElement.dataset.theme = id;
  document.body.classList.add('qz');
  if (remember) { try { localStorage.setItem(KEY, id); } catch {} }
  return id;
}
/** เปิดหน้าต่างเลือกธีม — onPick(id) ถูกเรียกทันทีที่แตะ (ดูตัวอย่างสด) */
export function openThemePicker(onPick, { title = '🎨 เลือกธีมพื้นหลัง', note = 'นักเรียนทุกคนจะเห็นธีมเดียวกันบนมือถือ · 🎵 เพลงเปลี่ยนตามธีม (เลือกเพลงเองได้ที่ปุ่ม 🎼)' } = {}) {
  let dlg = document.getElementById('thDlg');
  if (!dlg) { dlg = document.createElement('dialog'); dlg.id = 'thDlg'; dlg.className = 'th-dlg'; document.body.append(dlg); }
  const cur = document.documentElement.dataset.theme || savedTheme();
  dlg.innerHTML = `<h3>${title}</h3><p>${note}</p>
    <div class="th-pick">${THEMES.map((t) => `<button type="button" class="th-card" data-th="${t.id}" aria-pressed="${t.id === cur}"><i aria-hidden="true"></i><b>${t.emoji} ${t.name}</b></button>`).join('')}</div>
    <div class="th-foot"><button type="button" class="btn" data-done>เสร็จแล้ว</button></div>`;
  dlg.onclick = (e) => {
    if (e.target === dlg || e.target.closest('[data-done]')) return dlg.close();
    const c = e.target.closest('[data-th]'); if (!c) return;
    dlg.querySelectorAll('[data-th]').forEach((x) => x.setAttribute('aria-pressed', x === c));
    applyTheme(c.dataset.th, { remember: true }); onPick?.(c.dataset.th);
  };
  dlg.showModal();
}
