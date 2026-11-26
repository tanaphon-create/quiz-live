// สอบนอกตาราง — จอนักเรียน: สุ่มข้อ/ตัวเลือกรายคน ล็อกหน้าจอ นับการออกนอกจอ (เกินกำหนด = ล็อก รอครูปลด)
import { connect, TS } from './db.js';
import { $, $$, esc, show, toast } from './ui.js';

let DB, pin = '', R = '', meta = null, paper = [], me = null, ans = {}, cur = 0, uid = '';
let armed = false, lastV = 0, wasFs = false, routed = '', subs = [], timerH = null, resumed = false;
const LABEL = ['ก', 'ข', 'ค', 'ง'];
const qs = new URLSearchParams(location.search);

const ready = connect().then((d) => { DB = d; uid = d.uid; return d; }).catch((e) => { console.error(e); toast('เชื่อมต่อไม่ได้ — ตรวจอินเทอร์เน็ตแล้วรีเฟรช', 6000); });

/* ───────── เข้าห้อง ───────── */
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
$('#pinForm').onsubmit = async (e) => {
  e.preventDefault(); if (!(await ready)) return;
  const p = $('#pinIn').value.replace(/\D/g, '');
  if (p.length !== 6) return toast('PIN มี 6 หลัก');
  const m = await DB.get(`quiz/exams/${p}/meta`);
  if (!m) return toast('ไม่พบห้องสอบนี้ ตรวจ PIN อีกครั้ง');
  pin = p; R = `quiz/exams/${p}`; meta = m;
  const mine = await DB.get(`${R}/students/${uid}`);
  if (mine) return enter(true);
  if (m.state !== 'open') return toast('ห้องสอบนี้ปิดแล้ว');
  $('#infoTitle').textContent = '📝 ' + m.title;
  try { const s = JSON.parse(localStorage.getItem('gc_exam_me') || '{}'); $('#sidIn').value = s.sid || ''; $('#nameIn').value = s.name || ''; } catch {}
  show('info'); $('#sidIn').focus();
};
$('#infoForm').onsubmit = async (e) => {
  e.preventDefault();
  const sid = $('#sidIn').value.replace(/\s/g, ''), name = $('#nameIn').value.trim().replace(/\s+/g, ' ');
  if (!/^\d{1,10}$/.test(sid)) return toast('ใส่เลขประจำตัวเป็นตัวเลขเท่านั้น');
  if (!name) return toast('พิมพ์ชื่อ-สกุลก่อน');
  if (meta.retakeOf && !(myKind = await DB.get(`${R}/allow/${sid}`))) return toast('เลขประจำตัวนี้ไม่อยู่ในรายชื่อสอบแก้ตัว — ตรวจเลขอีกครั้ง หรือแจ้งครู', 4500);
  const all = (await DB.get(`${R}/students`)) || {};
  if (Object.entries(all).some(([u, s]) => u !== uid && String(s.sid) === sid)) return toast('เลขประจำตัวนี้เข้าห้องสอบแล้ว — แจ้งครูคุมสอบ', 4000);
  paper = (await DB.get(`${R}/paper`)) || [];
  const order = paper.map((_, i) => i); if (meta.shuffleQ) shuffle(order);
  const corder = paper.map((q) => { const idx = q.choices.map((c, i) => (String(c).trim() ? i : -1)).filter((i) => i >= 0); return meta.shuffleC && q.type !== 'tf' ? shuffle(idx) : idx; });
  try {
    await DB.set(`${R}/students/${uid}`, { sid, name, status: 'ready', leaves: 0, order, corder, joinedAt: TS });
    localStorage.setItem('gc_exam_me', JSON.stringify({ sid, name }));
  } catch (err) { console.error(err); return toast('เข้าห้องสอบไม่ได้ (ห้องอาจปิดแล้ว)'); }
  enter(false);
};

async function enter(resume) {
  resumed = resume;
  if (meta?.retakeOf && !myKind) { const mine = await DB.get(`${R}/students/${uid}`); if (mine?.sid) myKind = await DB.get(`${R}/allow/${mine.sid}`); }
  if (!paper.length) paper = (await DB.get(`${R}/paper`)) || [];
  subs.forEach((u) => typeof u === 'function' && u()); subs = [];
  subs.push(DB.on(`${R}/meta`, (m) => { if (m) { meta = m; route(); renderScore(); } }));
  subs.push(DB.on(`${R}/students/${uid}`, (s) => { if (s) { me = s; route(); } }));
  subs.push(DB.on(`${R}/ans/${uid}`, (v) => { ans = v || {}; if (routed === 'exam') { renderQ(); renderGrid(); } }));
  subs.push(DB.on(`${R}/results/${uid}`, (r) => { myRes = r; renderScore(); }));
  subs.push(DB.on(`${R}/reveal`, (v) => { revealKey = v?.key || null; renderScore(); }));
  try { Promise.resolve(DB.set(`${R}/students/${uid}/online`, true)).catch(() => {}); Promise.resolve(DB.onDisconnect(`${R}/students/${uid}/online`, false)).catch(() => {}); } catch {}
}

/* ───────── เปลี่ยนหน้าตามสถานะ ───────── */
function route() {
  if (!me || !meta) return;
  const st = me.status;
  $('#lockOv').hidden = st !== 'locked';
  if (st === 'submitted') { disarm(); $('#warnOv').hidden = true; if (routed !== 'done') { routed = 'done'; $('#dWho').textContent = `${me.name} · ${me.sid}`; show('done'); } return; }
  if (st === 'ready') {
    if (routed !== 'rules') {
      routed = 'rules';
      $('#rTitle').textContent = '📝 ' + meta.title; $('#rWho').textContent = `${me.name} · เลขประจำตัว ${me.sid}`;
      $('#rList').innerHTML = [
        `ข้อสอบ <b>${meta.n} ข้อ</b> เวลา <b>${meta.duration} นาที</b> (เริ่มนับเมื่อกดเริ่ม)`,
        `${meta.shuffleQ || meta.shuffleC ? 'ข้อสอบของแต่ละคน<b>สลับลำดับไม่เหมือนกัน</b>' : 'ตอบทุกข้อให้ครบ'}`,
        `ระหว่างสอบ <b>ห้ามสลับแอป เปิดแท็บอื่น ออกจากเต็มจอ หรือรีเฟรช</b>`,
        ...(document.fullscreenEnabled && !IOS ? ['ข้อสอบ<b>แสดงเฉพาะในโหมดเต็มจอ</b> — ออกจากเต็มจอ (เช่น จะเปิดเมนู/ปุ่ม Gemini หรือ Google Lens ของเบราว์เซอร์) ข้อสอบจะถูกซ่อนและนับว่าออกนอกจอ'] : []),
        `ออกนอกหน้าจอได้ไม่เกิน <b>${meta.maxLeave} ครั้ง</b> — ครั้งถัดไป<b>ข้อสอบจะถูกล็อก</b>และแจ้งครูคุมสอบทันที`,
        ...(meta.voidOnLeave ? ['<b>ใช้ AI / Google Lens / วงกลมเพื่อค้นหา / แคปจอ / สลับแอป</b> ระหว่างเปิดข้อไหน <b>ข้อนั้นถูกตัดสิทธิ์ทันที (ได้ 0 คะแนน แก้คำตอบไม่ได้)</b>'] : []),
        'คำตอบบันทึกอัตโนมัติทุกครั้งที่เลือก <b>หมดเวลาระบบส่งให้อัตโนมัติ</b>',
        `เกณฑ์ผ่าน <b>${passScore()} คะแนน</b> จาก ${meta.n}${!meta.round ? ' · ไม่ผ่านสอบแก้ตัวได้' : myKind === 'makeup' ? ' · <b>สอบซ่อม: ได้คะแนนตามที่ทำได้จริง</b>' : ' · <b>สอบแก้ตัว: ทำได้เกินเกณฑ์จะได้คะแนนเท่าเกณฑ์ผ่าน</b>'}`,
      ].map((t) => `<li>${t}</li>`).join('');
      $('#rWait').textContent = meta.state === 'open' ? '' : 'ห้องสอบปิดแล้ว';
      show('rules');
    }
    return;
  }
  // doing / locked
  if (routed !== 'exam') {
    routed = 'exam'; cur = 0;
    $('#eTitle').textContent = meta.title; $('#eWho').textContent = `${me.name} · ${me.sid}`;
    show('exam'); renderQ(); renderGrid(); arm();
    clearInterval(timerH); timerH = setInterval(tick, 500); tick();
    if (resumed && st === 'doing') { resumed = false; setTimeout(() => violation('reload'), 300); }
  }
  if (st === 'doing' && lockedBefore) { lockedBefore = false; $('#warnTxt').innerHTML = '🔓 ครูคุมสอบปลดล็อกแล้ว<br><b>ถ้าออกนอกหน้าจออีกครั้ง ข้อสอบจะถูกล็อกทันที</b>'; $('#warnOv').hidden = false; }
  if (st === 'locked') { lockedBefore = true; $('#warnOv').hidden = true; $('#lockTxt').textContent = `ออกนอกจอ ${me.leaves} ครั้ง (อนุญาต ${limit()} ครั้ง)`; }
  renderLeave();
}
let lockedBefore = false;
const limit = () => (meta?.maxLeave || 0) + (me?.extra || 0);
function renderLeave() {
  const left = limit() - (me.leaves || 0);
  $('#eLeave').textContent = left > 0 ? `⚠️ ออกนอกจอได้อีก ${left} ครั้ง` : '⛔ ห้ามออกนอกจออีก';
  $('#eLeave').className = 'ex-leave' + (left <= 0 ? ' last' : '');
}

/* ───────── ข้อสอบ ───────── */
const qIndex = (k) => (me.order || [])[k];
function renderQ() {
  if (!me || !paper.length) return;
  const n = paper.length, qi = qIndex(cur), q = paper[qi]; if (!q) return;
  const pick = ans['q' + qi], vd = isVoid(qi);
  $('#eQ').classList.toggle('void', vd);
  $('#eQ').style.setProperty('--wm', wmURL());
  $('#eQ').innerHTML = `<div class="ex-shield-msg" aria-hidden="true">🙈 ซ่อนข้อสอบไว้ — กลับมาที่หน้านี้เพื่อทำต่อ</div>
    ${vd ? '<div class="ex-void">🚫 ข้อนี้ถูกตัดสิทธิ์ — ออกนอกหน้าจอระหว่างเปิดข้อนี้ (ได้ 0 คะแนน)</div>' : ''}
    <div class="ex-qn">ข้อ ${cur + 1} / ${n}</div>
    <h2 class="ex-qt">${esc(q.text)}</h2>${q.image ? `<img class="ex-img" src="${esc(q.image)}" alt="" draggable="false">` : ''}
    <div class="ex-ch">${(me.corder?.[qi] || []).map((ci, k) => `<button type="button" class="ex-opt${pick === ci ? ' on' : ''}" data-ci="${ci}" aria-pressed="${pick === ci}"${vd ? ' disabled' : ''}>
      <span class="lb">${LABEL[k]}</span><span>${esc(q.choices[ci])}</span></button>`).join('')}</div>`;
  $('#prevBtn').disabled = cur === 0; $('#nextBtn').disabled = cur === n - 1;
  const done = Object.values(ans).filter((v) => v != null).length;
  $('#eProg').style.width = (done / n) * 100 + '%';
}
function renderGrid() {
  if (!me) return;
  $('#eGrid').innerHTML = `<small>ข้อที่ตอบแล้วเป็นสีเขียว · แตะเลขข้อเพื่อไปยังข้อนั้น</small><div class="ex-nums">${paper.map((_, k) =>
    `<button type="button" class="${isVoid(qIndex(k)) ? 'void' : ans['q' + qIndex(k)] != null ? 'ok' : ''}${k === cur ? ' cur' : ''}" data-go="${k}">${k + 1}</button>`).join('')}</div>`;
}
$('#eQ').onclick = async (e) => {
  const b = e.target.closest('[data-ci]'); if (!b || me.status !== 'doing') return;
  const qi = qIndex(cur), ci = +b.dataset.ci;
  if (isVoid(qi)) return toast('ข้อนี้ถูกตัดสิทธิ์แล้ว');
  ans = { ...ans, ['q' + qi]: ci }; renderQ(); renderGrid();
  try { await DB.set(`${R}/ans/${uid}/q${qi}`, ci); } catch (err) { toast('บันทึกคำตอบไม่ได้ (หมดเวลาหรือถูกล็อก)'); }
};
$('#eGrid').onclick = (e) => { const b = e.target.closest('[data-go]'); if (b) { cur = +b.dataset.go; renderQ(); renderGrid(); } };
$('#prevBtn').onclick = () => { if (cur > 0) { cur--; renderQ(); renderGrid(); } };
$('#nextBtn').onclick = () => { if (cur < paper.length - 1) { cur++; renderQ(); renderGrid(); } };

function tick() {
  if (!me?.startAt || !meta) return;
  const left = me.startAt + meta.duration * 60000 - DB.now();
  const s = Math.max(0, Math.ceil(left / 1000));
  $('#eTimer').textContent = `⏱ ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  $('#eTimer').classList.toggle('low', s <= 60);
  if (left <= 0 && me.status === 'doing') submit(true);
}

/* ───────── ส่งข้อสอบ ───────── */
$('#submitBtn').onclick = () => {
  const miss = [];
  paper.forEach((_, k) => { if (ans['q' + qIndex(k)] == null) miss.push(k); });
  $('#confirmTxt').innerHTML = miss.length ? `ยังไม่ได้ตอบ <b>${miss.length} ข้อ</b> จาก ${paper.length} ข้อ` : `✅ ตอบครบทั้ง ${paper.length} ข้อแล้ว`;
  $('#cMiss').innerHTML = miss.length ? `<small>แตะเลขข้อเพื่อกลับไปตอบ</small><div class="ex-nums">${miss.map((k) => `<button type="button" data-miss="${k}">${k + 1}</button>`).join('')}</div>` : '';
  $('#cStep1').hidden = false; $('#cStep2').hidden = true;
  $('#confirmDlg').showModal();
};
let yesH = null;
$('#cNo').onclick = () => $('#confirmDlg').close();
$('#cMiss').onclick = (e) => { const b = e.target.closest('[data-miss]'); if (!b) return; $('#confirmDlg').close(); cur = +b.dataset.miss; renderQ(); renderGrid(); };
$('#cNext').onclick = () => {
  $('#cStep1').hidden = true; $('#cStep2').hidden = false;
  const y = $('#cYes'); y.disabled = true; clearTimeout(yesH); yesH = setTimeout(() => { y.disabled = false; }, 1200);  // กันกดสองทีติดกันทะลุไปส่งเลย
};
$('#cBack').onclick = () => { $('#cStep2').hidden = true; $('#cStep1').hidden = false; };
$('#cYes').onclick = () => { if ($('#cYes').disabled) return; $('#confirmDlg').close(); submit(false); };
let sending = false;
async function submit(auto) {
  if (sending || !me || me.status === 'submitted') return; sending = true;
  disarm();
  try { await DB.update(`${R}/students/${uid}`, { status: 'submitted', submittedAt: TS, ...(auto ? { timeout: true } : {}), away: false }); }
  catch (err) { console.error(err); sending = false; if (!auto) { toast('ส่งไม่สำเร็จ ลองอีกครั้ง'); arm(); } return; }
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
}
let myRes = null, revealKey = null, myKind = null;
const passScore = () => Math.max(1, Math.ceil(((meta?.n || 0) * (meta?.passPct ?? 50)) / 100));
function renderScore() {
  const r = myRes, show = meta && (meta.revealed || meta.showScore);
  if (!show || !r) { $('#dScore').innerHTML = `<p class="hint">${meta?.revealed ? 'กำลังโหลดคะแนน…' : '⏳ คะแนนจะแสดงที่นี่เมื่อทุกคนส่งครบ หรือหมดเวลาสอบ — เปิดหน้านี้ค้างไว้ได้เลย'}</p>`; return; }
  const pass = r.pass ?? passScore(), ok = r.score >= pass;
  let h = `<div class="ex-score"><small>คะแนนที่ทำได้</small><b>${r.score}</b><span>/ ${r.total}</span></div>
    <span class="ex-pass ${ok ? 'ok' : 'no'}">${ok ? '🎉 ผ่านเกณฑ์' : '❌ ยังไม่ผ่านเกณฑ์'} (เกณฑ์ ${pass} คะแนน)</span>`;
  if (meta.round && ok && r.score > pass && myKind !== 'makeup') h += `<p class="hint">สอบแก้ตัว: ได้คะแนนเท่าเกณฑ์ผ่าน <b>${pass} คะแนน</b></p>`;
  if (!ok && !meta.round) h += '<p class="hint">ครูจะเปิดสอบแก้ตัวให้ภายหลัง</p>';
  if (meta.revealed && r.marks && me?.order) {
    h += `<div class="ex-review"><h3>📋 ตรวจคำตอบ</h3>${me.order.map((qi, k) => {
      const q = paper[qi]; if (!q) return '';
      const good = r.marks[qi] === '1', mine = ans['q' + qi];
      return `<div class="ex-rv ${good ? 'ok' : 'no'}"><span class="mk">${good ? '✓ ถูก' : '✗ ผิด'} · ข้อ ${k + 1}</span><b>${esc(q.text)}</b>
        <small>คำตอบของฉัน: ${mine != null ? esc(q.choices[mine]) : '<i>ไม่ได้ตอบ</i>'}</small>
        ${revealKey && !good ? `<small>คำตอบที่ถูก: <b>${esc(q.choices[revealKey[qi]])}</b></small>` : ''}</div>`;
    }).join('')}</div>`;
  }
  $('#dScore').innerHTML = h;
}

/* ───────── ล็อกหน้าจอ ───────── */
function fullscreen() { const el = document.documentElement; if (!IOS && document.fullscreenEnabled && !document.fullscreenElement) el.requestFullscreen({ navigationUI: 'hide' }).then(() => { wasFs = true; fsGate(); }).catch(() => { fsFail = true; fsGate(); }); }
// บังคับเต็มจอ: แถบเครื่องมือ Chrome (ปุ่ม Gemini / Google Lens / เมนู ⋮) ซ่อนอยู่ในโหมดเต็มจอ
// ถ้าไม่ได้อยู่ในเต็มจอ ข้อสอบจะถูกซ่อนทั้งหน้า จนกว่าจะกลับเข้าเต็มจอ (เบราว์เซอร์ที่เปิดเต็มจอไม่ได้ เช่น iPhone ข้ามขั้นนี้)
let fsFail = false;
function fsGate() {
  const need = !IOS && armed && me?.status === 'doing' && document.fullscreenEnabled && !fsFail && !document.fullscreenElement;
  $('#fsOv').hidden = !need; document.body.classList.toggle('ex-nofs', need);
}
function arm() { armed = true; history.pushState({ ex: 1 }, ''); }
function disarm() { armed = false; shield(false); fsGate(); }
const isVoid = (qi) => !!me?.voids?.['q' + qi];
let wmKey = '', wmVal = '';
function wmURL() {
  const t = `${me?.name || ''} · ${me?.sid || ''}`; if (t === wmKey) return wmVal;
  const x = t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="170"><text x="150" y="95" text-anchor="middle" transform="rotate(-24 150 85)" font-family="sans-serif" font-size="15" font-weight="700" fill="rgba(108,77,255,0.09)">${x}</text></svg>`;
  wmKey = t; wmVal = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`; return wmVal;
}
// ซ่อนโจทย์ทันทีที่หน้าจอไม่ได้อยู่ในมือ (เช่น เปิด Gemini/ผู้ช่วย AI ทับหน้าจอแล้วกด "ถามเกี่ยวกับหน้าจอ")
function shield(on) { document.body.classList.toggle('ex-shield', !!on && armed); }
// บางแอปเปิดทับหน้าเว็บโดยไม่ส่งสัญญาณ blur — ตรวจโฟกัสซ้ำทุก 0.4 วิ (ไม่มีโฟกัสติดกัน 2 รอบ = ออกนอกจอ)
// iPhone/iPad: document.hasFocus() คืนค่า false สลับไปมาเองบ่อย ทำให้จอกระพริบ — ใช้แค่ visibilitychange/blur
const IOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
let noFocus = 0;
setInterval(() => {
  fsGate();
  if (IOS || !armed || me?.status !== 'doing') { noFocus = 0; return; }
  if (document.hidden || !document.hasFocus()) { if (++noFocus === 2) { shield(true); violation('focus'); } }
  else { if (noFocus >= 2) back(); noFocus = 0; }
}, 400);
function violation(kind) {
  if (!armed || !me || me.status !== 'doing') return;
  const t = Date.now(); if (t - lastV < 2500) return; lastV = t;
  const leaves = (me.leaves || 0) + 1, over = leaves > limit();
  // ตัดสิทธิ์ข้อที่เปิดอยู่ตอนออกนอกจอ (กันแคปจอ/วงกลมค้นหา/ถาม AI) — ยกเว้นรีเฟรช เพราะไม่รู้ว่าเปิดข้อไหนอยู่
  const qi = meta.voidOnLeave && kind !== 'reload' && paper.length ? qIndex(cur) : null, vNew = qi != null && !isVoid(qi);
  me = { ...me, leaves, ...(vNew ? { voids: { ...(me.voids || {}), ['q' + qi]: true } } : {}) };
  DB.update(`${R}/students/${uid}`, { leaves, away: true, lastKind: kind, lastLeaveAt: TS, ...(vNew ? { ['voids/q' + qi]: true, lastVoid: cur + 1 } : {}), ...(over ? { status: 'locked' } : {}) }).catch(() => {});
  if (vNew) { ans = { ...ans, [`q${qi}`]: null }; Promise.resolve(DB.set(`${R}/ans/${uid}/q${qi}`, null)).catch(() => {}); }
  renderQ(); renderGrid();
  if (!over) {
    const left = limit() - leaves;
    $('#warnTxt').innerHTML = `ระบบบันทึกว่าออกนอกหน้าจอ <b>ครั้งที่ ${leaves}/${limit()}</b> และแจ้งครูคุมสอบแล้ว${vNew ? `<br>🚫 <b>ข้อ ${cur + 1} ถูกตัดสิทธิ์</b> (ได้ 0 คะแนน)` : ''}<br>${left > 0 ? `ออกได้อีก ${left} ครั้ง` : '<b>ถ้าออกอีกครั้ง ข้อสอบจะถูกล็อก</b>'}`;
    $('#warnOv').hidden = false;
  }
  renderLeave();
}
function back() { if (!document.hidden && document.hasFocus()) shield(false); if (armed && me?.status === 'doing' && !document.hidden && document.hasFocus()) DB.update(`${R}/students/${uid}`, { away: false }).catch(() => {}); }
$('#backBtn').onclick = () => { $('#warnOv').hidden = true; fullscreen(); back(); };
$('#fsBtn').onclick = () => fullscreen();
$('#startBtn').onclick = async () => {
  if (meta.state !== 'open') return toast('ห้องสอบปิดแล้ว');
  fullscreen();
  try { await DB.update(`${R}/students/${uid}`, { status: 'doing', startAt: DB.now() - 3000 }); }
  catch (err) { console.error(err); toast('เริ่มสอบไม่ได้ ลองอีกครั้ง'); }
};
document.addEventListener('visibilitychange', () => (document.hidden ? (shield(true), violation('hidden')) : back()));
window.addEventListener('blur', () => { shield(true); violation('blur'); });
window.addEventListener('pagehide', () => shield(true));
window.addEventListener('focus', back);
document.addEventListener('fullscreenchange', () => { if (IOS) return; if (document.fullscreenElement) wasFs = true; else if (wasFs) violation('fullscreen'); fsGate(); });
window.addEventListener('popstate', () => { if (armed) { history.pushState({ ex: 1 }, ''); toast('ห้ามย้อนกลับระหว่างสอบ'); } });
window.addEventListener('beforeunload', (e) => { if (armed && me?.status === 'doing') { e.preventDefault(); e.returnValue = ''; } });
// กันคัดลอก/คลิกขวา/พิมพ์ระหว่างสอบ
['copy', 'cut', 'paste', 'contextmenu', 'selectstart', 'dragstart'].forEach((t) => document.addEventListener(t, (e) => { if (armed) e.preventDefault(); }));
document.addEventListener('keydown', (e) => {
  if (!armed) return;
  const k = e.key.toLowerCase();
  if ((e.ctrlKey || e.metaKey) && ['c', 'x', 'v', 'p', 's', 'u', 'a', 'f'].includes(k)) e.preventDefault();
  if (k === 'f12' || k === 'printscreen') e.preventDefault();
});

// ลิงก์จาก QR: ใส่ PIN ให้เลย
if (qs.get('pin')) { $('#pinIn').value = qs.get('pin'); ready.then(() => $('#pinForm').requestSubmit()); }
