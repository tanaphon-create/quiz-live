// คลังข้อสอบ (แยกจากชุดคำถามของเกม) — เก็บที่ quiz/banks/{uid}/examSets/{id} อ่าน/เขียนได้เฉพาะครู
import { $, $$, esc, toast } from './ui.js';

export const usable = (q) => q && (q.type === 'mc' || q.type === 'tf') && String(q.text || '').trim()
  && (q.choices || []).filter((c) => String(c ?? '').trim()).length >= 2 && String(q.choices?.[q.correct] ?? '').trim();
const uid8 = () => Math.random().toString(36).slice(2, 10);
const blankQ = () => ({ type: 'mc', text: '', image: '', choices: ['', '', '', ''], correct: 0 });
const norm = (q) => {
  const type = q.type === 'tf' ? 'tf' : 'mc';
  const choices = type === 'tf' ? ['ถูก', 'ผิด', '', ''] : [0, 1, 2, 3].map((i) => String(q.choices?.[i] ?? ''));
  return { type, text: String(q.text || ''), image: String(q.image || ''), choices, correct: Math.max(0, Math.min(type === 'tf' ? 1 : 3, +q.correct || 0)) };
};
export const normSet = (s) => ({ id: s.id || uid8(), title: String(s.title || 'ชุดข้อสอบ').slice(0, 120), questions: (s.questions || []).map(norm), updatedAt: s.updatedAt || Date.now() });

/* ───────── นำเข้าไฟล์: JSON (รูปแบบเดียวกับเกม) หรือ Excel แบบ Kahoot ───────── */
let XLSX = null;
async function loadXlsx() {
  if (XLSX) return XLSX;
  await new Promise((ok, bad) => { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'; s.onload = ok; s.onerror = bad; document.head.append(s); });
  return (XLSX = window.XLSX);
}
export async function importFile(file) {
  const name = file.name.replace(/\.[^.]+$/, '');
  if (/\.json$/i.test(file.name)) {
    const j = JSON.parse(await file.text());
    const sets = (Array.isArray(j) ? j : [j]).filter((s) => s && Array.isArray(s.questions));
    if (!sets.length) throw new Error('ไม่พบข้อสอบในไฟล์');
    return sets.map((s) => normSet({ ...s, id: null, title: s.title || name }));
  }
  const X = await loadXlsx();
  const wb = X.read(await file.arrayBuffer(), { type: 'array' });
  const out = [];
  for (const sn of wb.SheetNames) {
    const rows = X.utils.sheet_to_json(wb.Sheets[sn], { header: 1, defval: '' });
    // Kahoot: หัวตาราง "Question - max 95 characters" แล้ว คำถาม | ตัวเลือก 1-4 | เวลา | ข้อที่ถูก (1-4)
    let h = rows.findIndex((r) => /^question/i.test(String(r[0]).trim()) || /^คำถาม/.test(String(r[0]).trim()));
    const title = String(rows.find((r) => /kahoot|—/i.test(String(r[0])))?.[0] || '').split(/—/).slice(1).join(' ').trim() || (wb.SheetNames.length > 1 ? sn : name);
    const qs = [];
    for (const r of rows.slice(h + 1)) {
      const text = String(r[0] ?? '').trim(); if (!text || /^กรอก|^คำถามไม่เกิน|^เวลา:|^คำตอบที่ถูก/.test(text)) continue;
      const ch = [1, 2, 3, 4].map((i) => String(r[i] ?? '').trim());
      const corr = parseInt(String(r[6] ?? r[5] ?? '').split(/[,\s]/)[0], 10);
      if (!(corr >= 1 && corr <= 4) || !ch[corr - 1]) continue;
      const tf = !ch[2] && !ch[3] && /^(ถูก|true|จริง)$/i.test(ch[0]) && /^(ผิด|false|เท็จ)$/i.test(ch[1]);
      qs.push(norm({ type: tf ? 'tf' : 'mc', text, choices: ch, correct: corr - 1 }));
    }
    if (qs.length) out.push(normSet({ title, questions: qs }));
  }
  if (!out.length) throw new Error('ไม่พบข้อสอบในไฟล์ (ต้องเป็นแบบฟอร์ม Kahoot: คำถาม | ตัวเลือก 1–4 | เวลา | ข้อที่ถูก 1–4)');
  return out;
}

/* ───────── รายการคลังข้อสอบ ───────── */
export function renderBank(box, sets, h) {
  const list = Object.values(sets).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  box.innerHTML = `<div class="bk-head"><div><h2>📚 คลังข้อสอบ</h2><p class="muted">ข้อสอบแยกจากชุดคำถามของเกม · แก้ที่นี่ไม่กระทบเกม</p></div>
    <div class="row"><label class="btn light">⤒ นำเข้าไฟล์ (.xlsx / .json)<input type="file" id="bkImport" accept=".json,.xlsx,.xls,application/json" hidden multiple></label>
    <button type="button" class="btn gold" id="bkNew">＋ สร้างชุดข้อสอบ</button></div></div>
    ${list.length ? `<ul class="bk-list">${list.map((s) => { const ok = s.questions.filter(usable).length; return `<li>
      <div><b>${esc(s.title)}</b><small>${ok} ข้อ${ok < s.questions.length ? ` · ยังไม่สมบูรณ์ ${s.questions.length - ok} ข้อ` : ''} · แก้ล่าสุด ${new Date(s.updatedAt).toLocaleDateString('th-TH', { dateStyle: 'medium' })}</small></div>
      <span class="sp"></span>
      <button type="button" class="btn light sm" data-edit="${s.id}">✏️ แก้ไข</button>
      <button type="button" class="btn light sm" data-dl="${s.id}" title="ดาวน์โหลดไฟล์ข้อสอบ">⤓</button>
      <button type="button" class="btn light sm ex-danger" data-del="${s.id}" title="ลบชุดข้อสอบ">🗑</button></li>`; }).join('')}</ul>`
      : '<p class="bk-empty">ยังไม่มีชุดข้อสอบ — กด “＋ สร้างชุดข้อสอบ” หรือนำเข้าไฟล์ Excel แบบ Kahoot / ไฟล์ .json</p>'}`;
  $('#bkNew').onclick = () => h.edit(normSet({ title: 'ชุดข้อสอบใหม่', questions: [blankQ()] }), true);
  $('#bkImport').onchange = async (e) => {
    const files = [...e.target.files]; e.target.value = '';
    for (const f of files) {
      try { const got = await importFile(f); for (const s of got) await h.save(s); toast(`นำเข้า “${got.map((s) => s.title).join('”, “')}” แล้ว (${got.reduce((n, s) => n + s.questions.length, 0)} ข้อ)`, 4000); }
      catch (err) { console.error(err); toast('นำเข้าไม่ได้: ' + (err.message || 'ไฟล์ไม่ถูกต้อง'), 5000); }
    }
  };
  box.onclick = (e) => {
    const id = (k) => e.target.closest(`[data-${k}]`)?.dataset[k];
    if (id('edit')) h.edit(structuredClone(sets[id('edit')]), false);
    if (id('del')) { const s = sets[id('del')]; if (confirm(`ลบชุดข้อสอบ “${s.title}”? (ห้องสอบที่เคยเปิดไปแล้วยังดูผลได้ตามเดิม)`)) h.remove(s.id); }
    if (id('dl')) { const s = sets[id('dl')]; const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify({ title: s.title, questions: s.questions }, null, 1)], { type: 'application/json' })); a.download = s.title + '.json'; a.click(); }
  };
}

/* ───────── ตัวแก้ไขชุดข้อสอบ ───────── */
export function openEditor(set, { onSave, onClose }) {
  let dirty = false;
  const box = $('#edBody');
  const draw = () => {
    $('#edTitle').value = set.title;
    box.innerHTML = set.questions.map((q, i) => `<article class="card ed-q${usable(q) ? '' : ' bad'}" data-i="${i}">
      <div class="ed-q-h"><b>ข้อ ${i + 1}</b>
        <div class="seg"><button type="button" data-type="mc" class="${q.type === 'mc' ? 'on' : ''}">4 ตัวเลือก</button><button type="button" data-type="tf" class="${q.type === 'tf' ? 'on' : ''}">ถูก / ผิด</button></div>
        <span class="sp"></span>
        <button type="button" class="btn light sm" data-up ${i ? '' : 'disabled'} title="เลื่อนขึ้น">↑</button><button type="button" class="btn light sm" data-down ${i < set.questions.length - 1 ? '' : 'disabled'} title="เลื่อนลง">↓</button>
        <button type="button" class="btn light sm" data-dup title="ทำสำเนาข้อนี้">⧉</button><button type="button" class="btn light sm ex-danger" data-rm title="ลบข้อนี้">🗑</button></div>
      <textarea class="input ed-text" data-f="text" rows="2" maxlength="400" placeholder="พิมพ์โจทย์">${esc(q.text)}</textarea>
      <div class="ed-ch">${q.choices.slice(0, q.type === 'tf' ? 2 : 4).map((c, k) => `<label class="ed-c${q.correct === k ? ' on' : ''}">
        <input type="radio" name="cor${i}" data-cor="${k}" ${q.correct === k ? 'checked' : ''} aria-label="ตัวเลือกที่ ${k + 1} เป็นคำตอบที่ถูก">
        <input class="input" data-c="${k}" value="${esc(c)}" maxlength="160" placeholder="ตัวเลือกที่ ${k + 1}" ${q.type === 'tf' ? 'readonly' : ''}></label>`).join('')}</div>
      <small class="hint">ติ๊กวงกลมหน้าตัวเลือกที่ถูก${usable(q) ? '' : ' · <b class="ed-warn">ข้อนี้ยังไม่สมบูรณ์ (ต้องมีโจทย์ และตัวเลือกที่ถูกต้องไม่ว่าง)</b>'}</small>
    </article>`).join('') + '<button type="button" class="btn light ed-add" id="edAdd">＋ เพิ่มข้อ</button>';
    $('#edCount').textContent = `${set.questions.filter(usable).length}/${set.questions.length} ข้อพร้อมใช้`;
  };
  const touch = () => { dirty = true; $('#edSave').textContent = '💾 บันทึก*'; };
  const qOf = (el) => set.questions[+el.closest('[data-i]').dataset.i];
  box.oninput = (e) => {
    const t = e.target, q = t.closest('[data-i]') && qOf(t); if (!q) return;
    if (t.dataset.f === 'text') q.text = t.value;
    if (t.dataset.c != null) q.choices[+t.dataset.c] = t.value;
    touch();
    const art = t.closest('[data-i]'); art.classList.toggle('bad', !usable(q));
    $('#edCount').textContent = `${set.questions.filter(usable).length}/${set.questions.length} ข้อพร้อมใช้`;
  };
  box.onchange = (e) => { const t = e.target; if (t.dataset.cor != null) { qOf(t).correct = +t.dataset.cor; touch(); draw(); } };
  box.onclick = (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.id === 'edAdd') { set.questions.push(blankQ()); touch(); draw(); box.lastElementChild.previousElementSibling?.querySelector('textarea')?.focus(); return; }
    const art = b.closest('[data-i]'); if (!art) return;
    const i = +art.dataset.i, q = set.questions[i], Q = set.questions;
    if (b.dataset.type && b.dataset.type !== q.type) {
      if (b.dataset.type === 'tf') { q._mc = q.choices; q.choices = ['ถูก', 'ผิด', '', '']; q.correct = Math.min(q.correct, 1); }
      else { q.choices = q._mc || ['', '', '', '']; delete q._mc; }
      q.type = b.dataset.type;
    }
    if (b.hasAttribute('data-up') && i > 0) [Q[i - 1], Q[i]] = [Q[i], Q[i - 1]];
    if (b.hasAttribute('data-down') && i < Q.length - 1) [Q[i + 1], Q[i]] = [Q[i], Q[i + 1]];
    if (b.hasAttribute('data-dup')) Q.splice(i + 1, 0, structuredClone(q));
    if (b.hasAttribute('data-rm')) { if (Q.length === 1) return toast('ต้องมีอย่างน้อย 1 ข้อ'); Q.splice(i, 1); }
    touch(); draw();
  };
  $('#edTitle').oninput = (e) => { set.title = e.target.value; touch(); };
  $('#edSave').onclick = async () => {
    set.title = set.title.trim() || 'ชุดข้อสอบ';
    set.questions.forEach((q) => delete q._mc);
    set.updatedAt = Date.now();
    $('#edSave').disabled = true;
    try { await onSave(normSet(set)); dirty = false; $('#edSave').textContent = '💾 บันทึก'; toast('บันทึกแล้ว'); }
    catch (err) { console.error(err); toast('บันทึกไม่สำเร็จ ลองอีกครั้ง'); }
    $('#edSave').disabled = false;
  };
  $('#edBack').onclick = () => { if (dirty && !confirm('ยังไม่ได้บันทึก ออกโดยไม่บันทึก?')) return; onClose(); };
  draw();
}
