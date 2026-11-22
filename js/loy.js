// ลอยกระทงออนไลน์ — จอนักเรียน: ใส่ PIN → เลขประจำตัว → ทำกระทง (ฐาน ใบตอง ดอกไม้ ของประดับ) → อธิษฐาน → ลอย
import { connect, TS } from './db.js';
import { $, $$, esc, show, toast } from './ui.js';
import { OPTIONS, DEFAULT, normalize, randomDesign, krathongSVG } from './krathong-art.js?v=20261122d';
import { createRiver } from './loy-river.js?v=20261122d';

let DB, uid = '', pin = '', R = '', meta = null, me = { sid: '', name: '' }, d = { ...DEFAULT }, step = 0, wish = '', showWish = false, mine = null;
const qs = new URLSearchParams(location.search);
const bg = createRiver($('#bg'), { compact: true });
const ready = connect().then((x) => { DB = x; uid = x.uid; return x; }).catch((e) => { console.error(e); toast('เชื่อมต่อไม่ได้ — ตรวจอินเทอร์เน็ตแล้วรีเฟรช', 6000); });
try { const s = JSON.parse(localStorage.getItem('gc_exam_me') || '{}'); $('#sidIn').value = s.sid || ''; $('#nameIn').value = s.name || ''; } catch {}

/* ───────── เข้ากิจกรรม ───────── */
$('#pinForm').onsubmit = async (e) => { e.preventDefault(); await join($('#pinIn').value); };
async function join(raw) {
  if (!(await ready)) return;
  const p = String(raw).replace(/\D/g, '');
  if (p.length !== 6) return toast('PIN มี 6 หลัก');
  const m = await DB.get(`quiz/loy/${p}/meta`);
  if (!m) return toast('ไม่พบกิจกรรมนี้ ตรวจ PIN อีกครั้ง');
  pin = p; R = `quiz/loy/${p}`; meta = m;
  $('#infoTitle').textContent = '🪷 ' + m.title;
  mine = await DB.get(`${R}/items/${uid}`);
  try { const dr = JSON.parse(localStorage.getItem('gc_loy_' + p) || 'null'); if (dr) { d = normalize(dr.d); wish = dr.wish || ''; showWish = !!dr.showWish; } } catch {}
  if (mine) { me = { sid: mine.sid, name: mine.name }; d = normalize(mine.d); if (mine.wish) wish = mine.wish; showWish = !!mine.showWish; return done(false); }
  if (m.state !== 'open') return toast('กิจกรรมนี้ปิดรับกระทงแล้ว');
  show('info'); $('#sidIn').focus();
}
if (qs.get('pin')) { $('#pinIn').value = qs.get('pin'); join(qs.get('pin')); }

$('#infoForm').onsubmit = (e) => {
  e.preventDefault();
  const sid = $('#sidIn').value.replace(/\s/g, ''), name = $('#nameIn').value.trim().replace(/\s+/g, ' ');
  if (!/^\d{1,10}$/.test(sid)) return toast('ใส่เลขประจำตัวเป็นตัวเลขเท่านั้น');
  if (!name) return toast('พิมพ์ชื่อก่อน');
  me = { sid, name };
  try { localStorage.setItem('gc_exam_me', JSON.stringify(me)); } catch {}
  build(0);
};

/* ───────── ทำกระทง ───────── */
const STEPS = [
  { k: 'base', t: '🍌 ฐาน' }, { k: 'leaf', t: '🍃 ใบตอง' }, { k: 'top', t: '🪷 ดอกกลาง' },
  { k: 'side', t: '🌼 ดอกประดับ' }, { k: 'extra', t: '🕯️ เทียน · ของ' }, { k: 'wish', t: '🙏 อธิษฐาน' },
];
let pv = null;
function build(i) {
  step = i; show('build'); $('#bg').hidden = true;
  if (!pv) pv = createRiver($('#pvRiver'), { compact: true });
  $('#bTitle').textContent = `🪷 กระทงของ ${me.name}`;
  draw();
}
const saveDraft = () => { try { localStorage.setItem('gc_loy_' + pin, JSON.stringify({ d, wish, showWish })); } catch {} };
function preview() { $('#mine').innerHTML = krathongSVG(d) + '<i class="lr-ref"></i>'; saveDraft(); }
const opt = (o, on, attr, extra = '') => `<button type="button" class="ls-opt" ${attr} aria-pressed="${on}">${extra || `<span>${o.emoji || ''}</span>`}<b>${esc(o.name)}</b>${o.desc ? `<small>${esc(o.desc)}</small>` : '<small></small>'}</button>`;
function draw() {
  $('#steps').innerHTML = STEPS.map((s, i) => `<button type="button" data-s="${i}" class="${i === step ? 'on' : i < step ? 'done' : ''}">${s.t}</button>`).join('');
  const k = STEPS[step].k; let h = '';
  if (k === 'base') h = `<div class="ls-opts">${OPTIONS.base.map((o) => opt(o, d.base === o.id, `data-set="base" data-v="${o.id}"`)).join('')}</div>`;
  if (k === 'leaf') h = `<div class="ls-sec">สีใบตอง</div><div class="ls-opts">${OPTIONS.leaf.map((o) => opt(o, d.leaf === o.id, `data-set="leaf" data-v="${o.id}"`, `<i style="background:linear-gradient(${o.c[0]},${o.c[2]})"></i>`)).join('')}</div>
    <div class="ls-sec">แบบการพับกลีบ</div><div class="ls-opts">${OPTIONS.shape.map((o) => opt(o, d.shape === o.id, `data-set="shape" data-v="${o.id}"`)).join('')}</div>`;
  if (k === 'top') h = `<div class="ls-opts">${OPTIONS.top.map((o) => opt(o, d.top === o.id, `data-set="top" data-v="${o.id}"`)).join('')}</div>`;
  if (k === 'side') { const on = d.side ? d.side.split(',') : []; h = `<div class="ls-sec">เลือกได้หลายอย่าง</div><div class="ls-opts">${OPTIONS.side.map((o) => opt(o, on.includes(o.id), `data-side="${o.id}"`)).join('')}</div>`; }
  if (k === 'extra') h = `<div class="ls-sec">เลือกได้หลายอย่าง</div><div class="ls-opts">${OPTIONS.extra.map((o) => opt(o, !!d[o.id], `data-ex="${o.id}"`)).join('')}</div>`;
  if (k === 'wish') h = `<div class="ls-wish"><label class="field"><span>🙏 คำอธิษฐานของฉัน</span><textarea id="wishIn" maxlength="140" placeholder="เช่น ขอให้สอบผ่านทุกวิชา ขอให้ครอบครัวมีความสุข">${esc(wish)}</textarea></label>
    <div class="ls-count" id="wishN">${wish.length}/140</div>
    <label class="tog"><input type="checkbox" id="wishShow" ${showWish ? 'checked' : ''}> แสดงคำอธิษฐานบนจอใหญ่ให้เพื่อนเห็น</label>
    <p class="muted" style="margin:6px 0 0;font-size:.85rem;color:#7A7096">ถ้าไม่ติ๊ก คำอธิษฐานจะเก็บไว้ในเครื่องนี้เท่านั้น ไม่ส่งขึ้นระบบ (ครูก็ไม่เห็น)</p></div>`;
  $('#stepBody').innerHTML = h;
  $('#prevBtn').disabled = step === 0;
  const last = step === STEPS.length - 1;
  $('#nextBtn').textContent = last ? '🪷 ลอยกระทง' : 'ถัดไป ›';
  $('#nextBtn').classList.toggle('ls-launch', last);
  if (k === 'wish') {
    $('#wishIn').oninput = (e) => { wish = e.target.value.slice(0, 140); $('#wishN').textContent = `${wish.length}/140`; saveDraft(); };
    $('#wishShow').onchange = (e) => { showWish = e.target.checked; saveDraft(); };
  }
  preview();
}
$('#steps').onclick = (e) => { const b = e.target.closest('[data-s]'); if (b) { step = +b.dataset.s; draw(); } };
$('#stepBody').onclick = (e) => {
  const s = e.target.closest('[data-set]'), sd = e.target.closest('[data-side]'), ex = e.target.closest('[data-ex]');
  if (s) d[s.dataset.set] = s.dataset.v;
  else if (sd) { const on = new Set(d.side ? d.side.split(',') : []); on.has(sd.dataset.side) ? on.delete(sd.dataset.side) : on.add(sd.dataset.side); d.side = [...on].join(','); }
  else if (ex) d[ex.dataset.ex] = !d[ex.dataset.ex];
  else return;
  draw();
};
$('#rndBtn').onclick = () => { d = randomDesign(); draw(); };
$('#prevBtn').onclick = () => { if (step > 0) { step--; draw(); } };
$('#nextBtn').onclick = () => { if (step < STEPS.length - 1) { step++; draw(); } else launch(); };

/* ───────── ลอย ───────── */
async function launch() {
  if (!wish.trim() && !confirm('ยังไม่ได้เขียนคำอธิษฐาน ลอยกระทงเลยไหม?')) return;
  const b = $('#nextBtn'); b.disabled = true; b.textContent = 'กำลังลอย…';
  const item = { sid: me.sid, name: me.name, d: normalize(d), showWish: !!(showWish && wish.trim()), at: TS };
  if (item.showWish) item.wish = wish.trim().slice(0, 140);
  try {
    await DB.set(`${R}/items/${uid}`, item);
    mine = item; done(true);
  } catch (err) {
    console.error(err);
    toast(meta?.state !== 'open' ? 'กิจกรรมปิดรับกระทงแล้ว' : 'ลอยกระทงไม่สำเร็จ ลองใหม่อีกครั้ง', 4000);
  }
  b.disabled = false;
}
let doneRiver = null, unsub = null;
function done(anim) {
  show('done'); $('#bg').hidden = true;
  if (!doneRiver) doneRiver = createRiver($('#doneRiver'), { compact: true, max: 60 });
  unsub?.(); unsub = DB.on(`${R}/items`, (v) => doneRiver.update(v || {}));
  DB.on(`${R}/meta`, (m) => { meta = m; $('#editBtn').hidden = !m || m.state !== 'open'; });
  $('#doneMsg').innerHTML = `ขอให้คำอธิษฐานเป็นจริงนะ ${esc(me.name)} 🌕<br>กระทงของเรากำลังลอยอยู่บนจอใหญ่ · เลขประจำตัว ${esc(me.sid)} ได้รับคะแนนร่วมกิจกรรมเมื่อครูบันทึก`;
  const f = $('#floatMine');
  if (anim) { f.innerHTML = `<div class="lr-bob">${krathongSVG(d)}<i class="lr-ref"></i></div>`; f.hidden = false; f.style.animation = 'none'; void f.offsetWidth; f.style.animation = ''; setTimeout(() => (f.hidden = true), 6200); }
}
$('#editBtn').onclick = () => { $('#bg').hidden = false; build(0); };
