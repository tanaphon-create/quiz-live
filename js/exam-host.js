// สอบนอกตาราง — จอครู: เลือกชุดข้อสอบ เปิดห้อง คุมสอบแบบเรียลไทม์ ตรวจคะแนน เฉลย สอบแก้ตัว บันทึกลงสมุดคะแนน
// เฉลยเก็บที่ quiz/banks/{uid}/exams/{pin} (อ่านได้เฉพาะครู) — ห้องสอบ quiz/exams/{pin} มีแต่โจทย์
// คำตอบ/ผลของนักเรียนแต่ละคน อ่านได้เฉพาะเจ้าของและครู (กฎฐานข้อมูล)
import { connect, isTeacher } from './db.js';
import { $, esc, show, toast } from './ui.js';
import { sfx, unlock } from './sound.js';
import { SCOREBOOK_API } from './config.js';

let DB, me = null, quizzes = [], exams = {};
let pin = '', meta = null, key = [], students = {}, ans = {}, results = {}, unsubs = [], family = null;
const seenLeaves = {}, seenStatus = {}, feed = [];
let autoAt = 0, autoHold = false, revealing = false;
const AUTO_MS = 15000;   // ส่งครบแล้ว → ประกาศคะแนนอัตโนมัติใน 15 วิ (ครูกด “รอก่อน” ได้)

const ready = connect({ host: true }).then((d) => { DB = d; d.onUser(onUser); return d; })
  .catch((e) => { console.error(e); document.documentElement.classList.remove('gc-wait'); $('#loginMsg').textContent = 'เชื่อมต่อไม่ได้ — ตรวจอินเทอร์เน็ตแล้วรีเฟรช'; });

async function onUser(u) {
  if (u && isTeacher(u)) {
    if (me === u.uid) return;
    me = u.uid; $('#who').textContent = u.email;
    await loadSetup();
    const last = sessionStorage.getItem('gc_exam_pin');
    if (last && exams[last]) openProctor(last); else show('setup');
    document.documentElement.classList.remove('gc-wait');
    return;
  }
  me = null; show('login'); document.documentElement.classList.remove('gc-wait');
  const wrong = u && !u.isAnonymous;
  $('#loginMsg').innerHTML = wrong ? `⛔ อีเมล <b>${esc(u.email)}</b> ไม่มีสิทธิ์เข้าหน้าครู` : '';
  $('#loginBtn').hidden = !!wrong; $('#switchBtn').hidden = !wrong;
}
$('#loginBtn').onclick = async () => { if (!(await ready)) return; try { await DB.signIn(); } catch (e) { $('#loginMsg').textContent = e.code === 'auth/popup-closed-by-user' ? '' : 'ล็อกอินไม่สำเร็จ ลองใหม่อีกครั้ง'; } };
$('#switchBtn').onclick = () => DB.signOut();

/* ───────── ตั้งค่า ───────── */
const usable = (q) => q && (q.type === 'mc' || q.type === 'tf') && String(q.text || '').trim();
const passOf = (m, total) => Math.max(1, Math.ceil((total * (m?.passPct ?? 50)) / 100));
async function loadSetup() {
  const v = (await DB.get(`quiz/banks/${me}/quizzes`)) || {};
  quizzes = Object.values(v).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).filter((q) => (q.questions || []).some(usable));
  exams = (await DB.get(`quiz/banks/${me}/exams`)) || {};
  $('#quizSel').innerHTML = quizzes.length
    ? quizzes.map((q) => `<option value="${esc(q.id)}">${esc(q.title)} (${q.questions.filter(usable).length} ข้อ)</option>`).join('')
    : '<option value="">ยังไม่มีชุดคำถาม — สร้างที่หน้าเกมคำถามก่อน</option>';
  $('#openBtn').disabled = !quizzes.length;
  quizInfo();
  await renderOpenList();
}
function quizInfo() {
  const q = quizzes.find((x) => x.id === $('#quizSel').value);
  if (!q) { $('#quizInfo').textContent = ''; return; }
  const all = q.questions.length, ok = q.questions.filter(usable).length, pass = passOf({ passPct: +$('#passPct').value || 50 }, ok);
  $('#quizInfo').textContent = `${ok} ข้อ (ข้อละ 1 คะแนน) · ผ่านเมื่อได้ ${pass} คะแนนขึ้นไป` + (all > ok ? ` · ข้ามข้อที่ไม่มีโจทย์ ${all - ok} ข้อ` : '');
}
$('#quizSel').onchange = quizInfo; $('#passPct').oninput = quizInfo;

async function renderOpenList() {
  const pins = Object.keys(exams).sort((a, b) => (exams[b].createdAt || 0) - (exams[a].createdAt || 0)).slice(0, 15);
  const metas = await Promise.all(pins.map((p) => DB.get(`quiz/exams/${p}/meta`).catch(() => null)));
  const rows = pins.map((p, i) => ({ p, m: metas[i] })).filter((x) => x.m);
  $('#openList').hidden = !rows.length;
  $('#openList').innerHTML = `<h2>ห้องสอบของฉัน</h2><ul class="ex-list">${rows.map(({ p, m }) => `<li>
      <span class="ex-badge ${m.state}">${m.state === 'open' ? '🟢 เปิดอยู่' : m.revealed ? '📢 เฉลยแล้ว' : '⚪ ปิดแล้ว'}</span>
      <b>${esc(m.title)}${m.round ? ` <small class="ex-round">สอบแก้ตัวรอบ ${m.round}</small>` : ''}</b><small>PIN ${p} · ${new Date(m.createdAt).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}</small>
      <button class="btn light sm" data-pin="${p}">${m.state === 'open' ? 'เข้าจอคุมสอบ' : 'ดูผล'}</button></li>`).join('')}</ul>`;
}
$('#openList').onclick = (e) => { const b = e.target.closest('[data-pin]'); if (b) openProctor(b.dataset.pin); };

async function newPin() {
  for (let i = 0; i < 10; i++) { const c = String(100000 + Math.floor(Math.random() * 900000)); if (!(await DB.get(`quiz/exams/${c}/meta`))) return c; }
  throw new Error('pin');
}
$('#setupForm').onsubmit = async (e) => {
  e.preventDefault(); unlock();
  const q = quizzes.find((x) => x.id === $('#quizSel').value); if (!q) return;
  const qs = q.questions.filter(usable);
  const b = $('#openBtn'); b.disabled = true; b.textContent = 'กำลังเปิด…';
  try {
    const p = await newPin();
    const m = { hostUid: me, title: q.title, state: 'open', n: qs.length, duration: Math.max(1, +$('#dur').value || 30), maxLeave: Math.max(1, +$('#maxLeave').value || 1),
      passPct: Math.min(100, Math.max(1, +$('#passPct').value || 50)), shuffleQ: $('#shufQ').checked, shuffleC: $('#shufC').checked, showScore: $('#showScore').checked, createdAt: Date.now() };
    const paper = qs.map((x) => ({ type: x.type, text: x.text, image: x.image || '', choices: (x.choices || []).slice(0, x.type === 'tf' ? 2 : 4).map((c) => String(c ?? '')) }));
    await DB.set(`quiz/exams/${p}`, { meta: m, paper });
    const rec = { title: q.title, quizId: q.id, key: qs.map((x) => +x.correct || 0), createdAt: m.createdAt };
    await DB.set(`quiz/banks/${me}/exams/${p}`, rec); exams[p] = rec;
    openProctor(p);
  } catch (err) { console.error(err); toast('เปิดห้องสอบไม่สำเร็จ ลองใหม่อีกครั้ง'); }
  b.disabled = false; b.textContent = 'เปิดห้องสอบ ›';
};

/* ───────── คุมสอบ ───────── */
let tickH = null;
function stop() { unsubs.forEach((u) => typeof u === 'function' && u()); unsubs = []; clearInterval(tickH); }
function openProctor(p) {
  stop();
  pin = p; key = exams[p]?.key || []; students = {}; ans = {}; results = {}; feed.length = 0; family = null; autoAt = 0; autoHold = false; revealing = false;
  Object.keys(seenLeaves).forEach((k) => delete seenLeaves[k]); Object.keys(seenStatus).forEach((k) => delete seenStatus[k]);
  sessionStorage.setItem('gc_exam_pin', p);
  const url = new URL('take.html', location.href); url.search = '?pin=' + p;
  $('#pUrl').textContent = url.host + url.pathname;
  $('#pPin').textContent = p.replace(/(\d{3})(\d{3})/, '$1 $2');
  $('#pQr').innerHTML = ''; if (window.QRCode) new QRCode($('#pQr'), { text: url.href, width: 150, height: 150, colorDark: '#2B2350', colorLight: '#ffffff' });
  $('#pFeed').innerHTML = '<li class="muted">ยังไม่มี</li>'; $('#pAlert').hidden = true; $('#pWarn').hidden = true;
  show('proctor');
  let first = true;
  unsubs.push(DB.on(`quiz/exams/${p}/meta`, (m) => { meta = m; if (!m) return; renderHead(); render(); if (m.revealed && !family) loadFamily(); }));
  unsubs.push(DB.on(`quiz/exams/${p}/students`, (v) => { students = v || {}; detect(first); first = false; render(); grade(); }));
  unsubs.push(DB.on(`quiz/exams/${p}/ans`, (v) => { ans = v || {}; render(); grade(); }));
  unsubs.push(DB.on(`quiz/exams/${p}/results`, (v) => { results = v || {}; render(); if (family) loadFamily(); }));
  tickH = setInterval(() => { render(); autoSubmit(); autoReveal(); }, 1000);
}
const rootOf = (p, m) => (m?.retakeOf || p);
function renderHead() {
  $('#pTitle').innerHTML = esc(meta.title) + (meta.round ? ` <small class="ex-round">สอบแก้ตัวรอบ ${meta.round}</small>` : '');
  const pass = passOf(meta, meta.n);
  $('#pState').textContent = meta.state === 'open' ? `🟢 เปิดสอบ · ${meta.duration} นาที` : meta.revealed ? '📢 เฉลยแล้ว' : '⚪ ปิดห้องสอบแล้ว';
  $('#pRule').innerHTML = `${meta.n} ข้อ · ${meta.duration} นาที · ผ่าน ${pass} คะแนน (${meta.passPct ?? 50}%)<br>ออกนอกจอได้ ${meta.maxLeave} ครั้ง · ${meta.shuffleQ ? 'สุ่มข้อ' : 'ไม่สุ่มข้อ'} · ${meta.shuffleC ? 'สุ่มตัวเลือก' : 'ไม่สุ่มตัวเลือก'}`
    + (meta.round ? '<br><b>สอบแก้ตัว: เข้าได้เฉพาะคนที่ไม่ผ่าน · ทำได้เกินเกณฑ์ได้คะแนนเท่าเกณฑ์ผ่าน</b>' : '');
  $('#closeBtn').hidden = $('#addTime').hidden = meta.state !== 'open';
}

const answered = (u) => Object.values(ans[u] || {}).filter((v) => v != null).length;
const limitOf = (s) => (meta?.maxLeave || 0) + (s.extra || 0);
const deadlineOf = (s) => (s.startAt ? s.startAt + (meta?.duration || 0) * 60000 : null);
const nameOf = (s) => `${esc(s.name || '-')} <small>(${esc(s.sid || '-')})</small>`;
const KIND = { hidden: 'สลับแอป/แท็บ', blur: 'คลิกออกนอกหน้าต่าง', fullscreen: 'ออกจากเต็มจอ', reload: 'รีเฟรช/ปิดหน้า' };
function log(html, cls = '') {
  const t = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  feed.unshift(`<li class="${cls}"><time>${t}</time> ${html}</li>`); feed.length = Math.min(feed.length, 60);
  $('#pFeed').innerHTML = feed.join('');
}
// ตรวจเหตุการณ์ใหม่: ออกนอกจอ (เตือน) / ถูกล็อก / ส่งข้อสอบ
function detect(first) {
  for (const [u, s] of Object.entries(students)) {
    const L = s.leaves || 0, was = seenLeaves[u] ?? (first ? L : 0);
    if (!first && L > was) {
      const over = L > limitOf(s);
      log(`👀 <b>${nameOf(s)}</b> ออกนอกหน้าจอ ครั้งที่ ${L}${over ? ` (เกินที่อนุญาต ${limitOf(s)} ครั้ง)` : `/${limitOf(s)}`}${s.lastKind ? ` <small>(${esc(KIND[s.lastKind] || s.lastKind)})</small>` : ''}`, over ? 'bad' : 'warn');
      if (!over) { sfx.urgent(); warnBanner(s, L); }
    }
    seenLeaves[u] = L;
    const st0 = seenStatus[u] ?? (first ? s.status : null);
    if (!first && st0 !== s.status) {
      if (s.status === 'locked') { log(`🔒 <b>${nameOf(s)}</b> ออกนอกจอเกินกำหนด — ถูกล็อก`, 'bad'); sfx.wrong(); flash(s); }
      else if (s.status === 'doing' && st0 === 'ready') log(`▶️ <b>${nameOf(s)}</b> เริ่มทำข้อสอบ`);
      else if (s.status === 'submitted') log(`✅ <b>${nameOf(s)}</b> ${s.timeout ? 'หมดเวลา ระบบส่งให้อัตโนมัติ' : s.forced ? 'ครูส่งแทน' : 'ส่งข้อสอบแล้ว'}`, 'ok');
      else if (!st0) log(`🙋 <b>${nameOf(s)}</b> เข้าห้องสอบ`);
    }
    seenStatus[u] = s.status;
  }
}
let warnH = null;
function warnBanner(s, L) {
  const w = $('#pWarn'), left = limitOf(s) - L;
  w.hidden = false;
  w.innerHTML = `⚠️ <b>${esc(s.name)}</b> (${esc(s.sid)}) ออกนอกหน้าจอ ครั้งที่ ${L}/${limitOf(s)} — ${left > 0 ? `เตือนแล้ว ออกได้อีก ${left} ครั้ง` : 'เตือนครั้งสุดท้าย ออกอีกจะถูกล็อก'} <span class="sp"></span><button class="btn light sm" data-x>รับทราบ</button>`;
  w.querySelector('[data-x]').onclick = () => (w.hidden = true);
  clearTimeout(warnH); warnH = setTimeout(() => (w.hidden = true), 9000);
}
function flash(s) {
  const a = $('#pAlert'); a.hidden = false; $('#pWarn').hidden = true;
  a.innerHTML = `🚨 <b>${esc(s.name)}</b> (${esc(s.sid)}) ออกนอกหน้าจอเกิน ${limitOf(s)} ครั้ง — ข้อสอบถูกล็อก <span class="sp"></span><button class="btn light sm" data-x>รับทราบ</button>`;
  a.querySelector('[data-x]').onclick = () => (a.hidden = true);
}

const STAT = { ready: ['⏳ รอเริ่ม', 'ready'], doing: ['✏️ กำลังทำ', 'doing'], locked: ['🔒 ถูกล็อก', 'locked'], submitted: ['✅ ส่งแล้ว', 'done'] };
const fmt = (ms) => { if (ms <= 0) return 'หมดเวลา'; const s = Math.ceil(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
function rows() {
  const order = { locked: 0, doing: 1, ready: 2, submitted: 3 };
  return Object.entries(students).sort((a, b) => (order[a[1].status] ?? 4) - (order[b[1].status] ?? 4) || String(a[1].sid).localeCompare(String(b[1].sid), 'th', { numeric: true }));
}
const allDone = () => { const l = Object.values(students); return l.length > 0 && l.every((s) => s.status === 'submitted'); };
function render() {
  if (!meta) return;
  const list = rows(), now = DB.now(), n = meta.n || 1, pass = passOf(meta, n);
  const cnt = { ready: 0, doing: 0, locked: 0, submitted: 0, away: 0 };
  list.forEach(([, s]) => { cnt[s.status] = (cnt[s.status] || 0) + 1; if (s.away && s.status === 'doing') cnt.away++; });
  $('#pStats').innerHTML = [['🙋', 'เข้าห้อง', list.length, ''], ['✏️', 'กำลังทำ', cnt.doing, 'doing'], ['👀', 'ออกนอกจออยู่', cnt.away, cnt.away ? 'warn' : ''], ['🔒', 'ถูกล็อก', cnt.locked, cnt.locked ? 'locked' : ''], ['✅', 'ส่งแล้ว', cnt.submitted, 'done']]
    .map(([e, t, v, c]) => `<div class="ex-stat ${c}"><span>${e} ${t}</span><b>${v}</b></div>`).join('');
  // แถบเฉลย / สอบแก้ตัว / บันทึก
  const left = list.length - cnt.submitted;
  const fails = family ? familyFails().length : 0;
  $('#pActions').innerHTML = meta.revealed
    ? `<span class="ex-act-note">📢 เฉลยและแจ้งคะแนนแล้ว</span><span class="sp"></span>
       ${fails ? `<button class="btn gold" id="retakeBtn">🔁 เปิดสอบแก้ตัว (${fails} คนที่ยังไม่ผ่าน)</button>` : family ? '<span class="ex-act-note ok">🎉 ทุกคนผ่านเกณฑ์แล้ว</span>' : ''}
       <button class="btn green" id="bookBtn">📒 บันทึกลงสมุดคะแนน</button>`
    : `<span class="ex-act-note">${!list.length ? 'ยังไม่มีนักเรียน' : left ? `รอส่งอีก ${left} คน — ส่งครบหรือหมดเวลา ระบบจะประกาศคะแนนให้อัตโนมัติ`
         : autoAt && !autoHold ? `✅ ส่งครบแล้ว — ประกาศคะแนนอัตโนมัติใน <b>${Math.max(0, Math.ceil((autoAt - Date.now()) / 1000))}</b> วิ` : autoHold ? '⏸ หยุดประกาศอัตโนมัติไว้ — กดปุ่มเมื่อพร้อม' : '✅ ส่งครบทุกคนแล้ว'}</span><span class="sp"></span>
       ${autoAt && !autoHold && !left ? '<button class="btn light" id="holdBtn">รอก่อน</button>' : ''}
       <button class="btn gold" id="revealBtn" ${allDone() || (meta.state !== 'open' && list.length) ? '' : 'disabled'}>📢 เฉลยและแจ้งคะแนน</button>`;
  if (!list.length) { $('#pRows').innerHTML = '<tr><td colspan="9" class="muted ex-empty">รอนักเรียนเข้าห้องสอบ…</td></tr>'; return; }
  $('#pRows').innerHTML = list.map(([u, s]) => {
    const done = answered(u), L = s.leaves || 0, lim = limitOf(s), dl = deadlineOf(s);
    const [st, sc] = STAT[s.status] || ['?', ''];
    const r = results[u], fin = family?.final[s.sid];
    const res = r ? (r.score >= pass ? `<span class="chip done">ผ่าน</span>` : `<span class="chip locked">ไม่ผ่าน</span>`) : '-';
    return `<tr class="r-${sc}${s.away && s.status === 'doing' ? ' r-away' : ''}">
      <td>${esc(s.sid)}</td><td><b>${esc(s.name)}</b>${s.online === false && s.status !== 'submitted' ? ' <small class="off">ออฟไลน์</small>' : ''}</td>
      <td><span class="chip ${sc}">${st}</span>${s.away && s.status === 'doing' ? ' <span class="chip warn">👀 ออกนอกจออยู่</span>' : ''}</td>
      <td><div class="ex-bar"><i style="width:${(done / n) * 100}%"></i></div><small>${done}/${n}</small></td>
      <td class="lv ${L > lim ? 'over' : L ? 'some' : ''}">${L}/${lim}</td>
      <td>${s.status === 'submitted' ? '-' : dl ? fmt(dl - now) : '-'}</td>
      <td>${r ? `<b>${r.score}</b>/${r.total}` : '-'}${meta.round && r && r.score >= pass ? ` <small>→ ได้ ${pass}</small>` : ''}</td>
      <td>${res}${fin != null && family.rounds > 0 ? ` <small>สุดท้าย ${fin}</small>` : ''}</td>
      <td class="act">${s.status === 'locked' ? `<button class="btn green sm" data-unlock="${u}">ปลดล็อก</button>` : ''}${s.status === 'doing' || s.status === 'locked' ? `<button class="btn light sm" data-submit="${u}">บังคับส่ง</button>` : ''}</td>
    </tr>`;
  }).join('');
}
$('#pRows').onclick = async (e) => {
  const u1 = e.target.closest('[data-unlock]')?.dataset.unlock, u2 = e.target.closest('[data-submit]')?.dataset.submit;
  if (u1) {
    const s = students[u1]; if (!s) return;
    // ปลดล็อก: ให้ทำต่อได้ แต่ถ้าออกนอกจออีกครั้งจะถูกล็อกทันที
    const extra = Math.max(0, (s.leaves || 0) - (meta.maxLeave || 0));
    await DB.update(`quiz/exams/${pin}/students/${u1}`, { status: 'doing', extra, away: false });
    log(`🔓 ปลดล็อกให้ <b>${nameOf(s)}</b> (ถ้าออกอีกครั้งจะถูกล็อกทันที)`, 'ok'); $('#pAlert').hidden = true;
  }
  if (u2) {
    const s = students[u2]; if (!s || !confirm(`บังคับส่งข้อสอบของ ${s.name}?`)) return;
    await DB.update(`quiz/exams/${pin}/students/${u2}`, { status: 'submitted', submittedAt: DB.now(), forced: true });
  }
};

// ตรวจคะแนนคนที่ส่งแล้ว (เฉลยอยู่ที่ครูเท่านั้น) — ผลอ่านได้เฉพาะเจ้าของ
function grade() {
  if (!meta || !key.length) return;
  const pass = passOf(meta, key.length);
  for (const [u, s] of Object.entries(students)) {
    if (s.status !== 'submitted') continue;
    const a = ans[u] || {};
    const marks = key.map((k, i) => (a['q' + i] === k ? '1' : '0')).join('');
    const score = [...marks].filter((x) => x === '1').length;
    const r = results[u];
    if (!r || r.score !== score || r.marks !== marks || r.total !== key.length || r.pass !== pass)
      DB.set(`quiz/exams/${pin}/results/${u}`, { score, total: key.length, pass, marks, sid: s.sid });
  }
}
// หมดเวลา: ส่งแทนนักเรียนที่ยังไม่ส่ง (กันเครื่องนักเรียนปิดไปก่อน)
function autoSubmit() {
  if (!meta || meta.state !== 'open') return;
  const now = DB.now();
  for (const [u, s] of Object.entries(students)) {
    const dl = deadlineOf(s);
    if ((s.status === 'doing' || s.status === 'locked') && dl && now > dl + 20000 && !s._sent) {
      s._sent = true; DB.update(`quiz/exams/${pin}/students/${u}`, { status: 'submitted', submittedAt: now, timeout: true });
    }
  }
}

$('#addTime').onclick = async () => { if (meta?.state !== 'open') return; await DB.update(`quiz/exams/${pin}/meta`, { duration: (meta.duration || 0) + 5 }); log('⏱ เพิ่มเวลาให้ทุกคน 5 นาที'); };
async function closeRoom() {
  const upd = { 'meta/state': 'closed', 'meta/closedAt': DB.now() };
  for (const [u, s] of Object.entries(students)) if (s.status !== 'submitted') Object.assign(upd, { [`students/${u}/status`]: 'submitted', [`students/${u}/submittedAt`]: DB.now(), [`students/${u}/forced`]: true });
  await DB.update(`quiz/exams/${pin}`, upd);
}
$('#closeBtn').onclick = async () => {
  const left = Object.values(students).filter((s) => s.status !== 'submitted').length;
  if (!confirm(`ปิดห้องสอบ?${left ? ` นักเรียน ${left} คนที่ยังไม่ส่ง จะถูกส่งข้อสอบอัตโนมัติ` : ''}`)) return;
  await closeRoom(); toast('ปิดห้องสอบแล้ว');
};

/* ───────── เฉลย / สอบแก้ตัว / บันทึก ───────── */
$('#pActions').onclick = (e) => {
  if (e.target.closest('#holdBtn')) { autoHold = true; render(); log('⏸ ครูหยุดการประกาศคะแนนอัตโนมัติไว้'); }
  if (e.target.closest('#revealBtn')) openDlg('reveal');
  if (e.target.closest('#retakeBtn')) openDlg('retake');
  if (e.target.closest('#bookBtn')) openDlg('book');
};
function openDlg(kind) {
  const d = $('#exDlg'), body = $('#exDlgBody'); d.showModal();
  const close = () => d.close();
  if (kind === 'reveal') {
    body.innerHTML = `<h3>📢 เฉลยและแจ้งคะแนน</h3>
      <p>นักเรียนทุกคนจะเห็นคะแนนของตัวเอง ผ่าน/ไม่ผ่าน และข้อที่ตอบถูก/ผิด ห้องสอบจะปิดรับคำตอบ</p>
      <label class="ex-chk"><input type="checkbox" id="rvKey"><span>แสดงคำตอบที่ถูกของทุกข้อด้วย<br><small>ถ้าจะเปิดสอบแก้ตัว แนะนำไม่ติ๊ก (คนที่สอบแก้ตัวจะได้ไม่เห็นเฉลยก่อน)</small></span></label>
      <div class="row end"><button class="btn light" data-x>ยกเลิก</button><button class="btn gold" id="rvGo">เฉลยเลย</button></div>`;
    body.querySelector('[data-x]').onclick = close;
    $('#rvGo').onclick = async () => { $('#rvGo').disabled = true; await doReveal($('#rvKey').checked); close(); };
    return;
  }
  if (kind === 'retake') {
    const fails = familyFails();
    body.innerHTML = `<h3>🔁 เปิดสอบแก้ตัว</h3>
      <p>เข้าได้เฉพาะ <b>${fails.length} คน</b>ที่ยังไม่ผ่านเกณฑ์ (${family.pass} คะแนน) · ข้อเดิม สุ่มลำดับใหม่ · ทำได้เกินเกณฑ์ <b>ได้คะแนนเท่าเกณฑ์ผ่าน (${family.pass})</b></p>
      <ul class="ex-mini">${fails.map((f) => `<li>${esc(f.sid)} ${esc(f.name)} <small>ตอนนี้ ${f.final}</small></li>`).join('')}</ul>
      <label class="field"><span>เวลาทำ (นาที)</span><input class="input" type="number" id="rtDur" min="1" max="300" value="${meta.duration}"></label>
      <div class="row end"><button class="btn light" data-x>ยกเลิก</button><button class="btn gold" id="rtGo">เปิดห้องสอบแก้ตัว</button></div>`;
    body.querySelector('[data-x]').onclick = close;
    $('#rtGo').onclick = async () => {
      $('#rtGo').disabled = true;
      try {
        const root = rootOf(pin, meta), rootRec = exams[root] || exams[pin];
        const paper = await DB.get(`quiz/exams/${root}/paper`);
        const p = await newPin(), round = family.rounds + 1;
        const m = { ...family.rootMeta, hostUid: me, state: 'open', revealed: false, retakeOf: root, round, duration: Math.max(1, +$('#rtDur').value || meta.duration), createdAt: Date.now() };
        delete m.closedAt; delete m.revealedAt;
        await DB.set(`quiz/exams/${p}`, { meta: m, paper, allow: Object.fromEntries(fails.map((f) => [f.sid, true])) });
        const rec = { title: rootRec.title, quizId: rootRec.quizId || '', key: rootRec.key, retakeOf: root, round, createdAt: m.createdAt };
        await DB.set(`quiz/banks/${me}/exams/${p}`, rec); exams[p] = rec;
        close(); toast(`เปิดสอบแก้ตัวรอบ ${round} แล้ว — PIN ใหม่ ${p}`, 5000); openProctor(p);
      } catch (err) { console.error(err); toast('เปิดสอบแก้ตัวไม่สำเร็จ'); $('#rtGo').disabled = false; }
    };
    return;
  }
  if (kind === 'book') bookDialog(body, close);
}

async function doReveal(showKey, auto = false) {
  if (revealing || meta?.revealed) return; revealing = true;
  try {
    grade(); await closeRoom();
    if (showKey) await DB.set(`quiz/exams/${pin}/reveal`, { key });
    await DB.update(`quiz/exams/${pin}/meta`, { revealed: true, revealedAt: DB.now(), ...(auto ? { autoRevealed: true } : {}) });
    log(auto ? '📢 ส่งครบแล้ว — ประกาศคะแนนให้นักเรียนอัตโนมัติ' : '📢 เฉลยและแจ้งคะแนนแล้ว', 'ok'); sfx.correct(); loadFamily();
  } catch (err) { console.error(err); toast('ประกาศคะแนนไม่สำเร็จ ลองกดอีกครั้ง'); }
  revealing = false;
}
// ส่งครบทุกคน (หรือหมดเวลา → ระบบส่งแทนครบ) และตรวจคะแนนครบแล้ว → นับถอยหลังแล้วประกาศคะแนนเอง
function autoReveal() {
  if (!meta || meta.revealed) { autoAt = 0; return; }
  const graded = Object.entries(students).every(([u, s]) => s.status !== 'submitted' || results[u]);
  if (!allDone() || !graded) { autoAt = 0; autoHold = false; return; }
  if (!autoAt) { autoAt = Date.now() + AUTO_MS; return; }
  if (!autoHold && Date.now() >= autoAt) doReveal(false, true);
}

// รวมผลทั้งชุด (สอบจริง + สอบแก้ตัวทุกรอบ) → คะแนนสุดท้ายต่อเลขประจำตัว
async function loadFamily() {
  if (!meta) return;
  const root = rootOf(pin, meta);
  const pins = [root, ...Object.keys(exams).filter((p) => exams[p].retakeOf === root).sort((a, b) => (exams[a].round || 0) - (exams[b].round || 0))];
  const data = await Promise.all(pins.map(async (p) => ({ p, meta: await DB.get(`quiz/exams/${p}/meta`), st: (await DB.get(`quiz/exams/${p}/students`)) || {}, res: (await DB.get(`quiz/exams/${p}/results`)) || {} })));
  const rootMeta = data[0].meta || meta, total = rootMeta.n, pass = passOf(rootMeta, total);
  const final = {}, names = {}, base = {};
  data.forEach(({ meta: m, st, res }, i) => {
    for (const [u, s] of Object.entries(st)) {
      const r = res[u]; names[s.sid] = s.name; if (!r) continue;
      const got = i === 0 ? r.score : Math.min(r.score, pass);   // สอบแก้ตัว: ได้ไม่เกินเกณฑ์ผ่าน
      if (i === 0) base[s.sid] = r.score;
      final[s.sid] = Math.max(final[s.sid] ?? 0, got);
    }
  });
  family = { root, pins, rootMeta, total, pass, final, names, base, rounds: data.filter((d) => d.meta?.round).length };
  render();
}
const familyFails = () => (family ? Object.entries(family.final).filter(([, v]) => v < family.pass).map(([sid, v]) => ({ sid, name: family.names[sid], final: v })) : []);

async function bookApi(body) {
  const tok = DB.mode === 'firebase' ? await DB.user().getIdToken() : 'local-test';
  const r = await fetch(SCOREBOOK_API, { method: 'POST', body: JSON.stringify({ ...body, idToken: tok }) });
  let j; try { j = await r.json(); } catch { throw { error: 'bad_response' }; }
  if (!j.ok) throw j;
  return j;
}
const CATS = { quiz: 'สอบย่อย', mid: 'สอบกลางภาค', final: 'สอบปลายภาค', work: 'งาน/การบ้าน', ex: 'แบบฝึกหัด', att: 'จิตพิสัย' };
async function bookDialog(body, close) {
  if (!family) await loadFamily();
  const entries = Object.entries(family.final).map(([sid, score]) => ({ sid, score, name: family.names[sid] }))
    .sort((a, b) => a.sid.localeCompare(b.sid, 'th', { numeric: true }));
  body.innerHTML = '<p class="muted">กำลังโหลดรายชื่อห้องจากสมุดคะแนน…</p>';
  let classes;
  try { classes = (await bookApi({ action: 'classes' })).classes || []; }
  catch (e) { body.innerHTML = `<p class="ex-warn-line">โหลดสมุดคะแนนไม่ได้ ${e?.error === 'auth' ? '— ต้องล็อกอินด้วยอีเมลครู' : '— ตรวจอินเทอร์เน็ตแล้วลองใหม่'}</p><div class="row end"><button class="btn light" data-x>ปิด</button></div>`; body.querySelector('[data-x]').onclick = close; return; }
  const hits = (c) => { const set = new Set(c.students.map((s) => s.code)); return entries.filter((r) => set.has(r.sid)).length; };
  const opts = classes.map((c) => ({ c, n: hits(c) })).sort((a, b) => b.n - a.n);
  let cls = opts[0]?.c;
  const draw = () => {
    const byCode = new Map((cls?.students || []).map((s) => [s.code, s.name]));
    body.innerHTML = `<h3>📒 บันทึกลงสมุดคะแนน</h3>
      <p class="muted">สร้างช่องคะแนนใหม่ 1 ช่อง (บันทึกซ้ำจะอัปเดตช่องเดิม) · คะแนนสุดท้ายรวมสอบแก้ตัวแล้ว</p>
      <label class="field"><span>ห้อง (จับคู่ด้วยเลขประจำตัว)</span><select class="input" id="bkCls">${opts.map(({ c, n }) => `<option value="${esc(c.id)}" ${c === cls ? 'selected' : ''}>${esc(c.name)}${c.subject ? ' · ' + esc(c.subject) : ''} — ตรง ${n}/${entries.length} คน</option>`).join('')}</select></label>
      <div class="ex-grid2"><label class="field"><span>ชื่อช่องคะแนน</span><input class="input" id="bkName" maxlength="80" value="${esc('สอบนอกตาราง เรื่อง ' + family.rootMeta.title)}"></label>
      <label class="field"><span>ประเภท</span><select class="input" id="bkCat">${Object.entries(CATS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></label></div>
      <div class="ex-tbl-wrap"><table class="ex-tbl"><thead><tr><th>เลขประจำตัว</th><th>ชื่อในข้อสอบ</th><th>ในสมุดคะแนน</th><th>คะแนน (เต็ม ${family.total})</th></tr></thead><tbody>
      ${entries.map((r) => { const nm = byCode.get(r.sid); return `<tr class="${nm ? '' : 'r-locked'}"><td>${esc(r.sid)}</td><td>${esc(r.name)}</td><td>${nm ? esc(nm) : '<b>ไม่พบเลขนี้ในห้อง</b>'}</td><td><b>${r.score}</b>${family.base[r.sid] != null && family.base[r.sid] !== r.score ? ` <small>(เดิม ${family.base[r.sid]} · แก้ตัวแล้ว)</small>` : ''}</td></tr>`; }).join('')}
      </tbody></table></div>
      <div class="row end" style="margin-top:12px"><button class="btn light" data-x>ยกเลิก</button><button class="btn green" id="bkGo">💾 บันทึกลงสมุดคะแนน</button></div>`;
    body.querySelector('[data-x]').onclick = close;
    $('#bkCls').onchange = (e) => { cls = classes.find((c) => c.id === e.target.value); draw(); };
    $('#bkGo').onclick = async () => {
      const b = $('#bkGo'); b.disabled = true; b.textContent = 'กำลังบันทึก…';
      try {
        const j = await bookApi({ action: 'setexam', classId: cls.id, ext: 'exam-' + family.root, name: $('#bkName').value.trim() || 'สอบนอกตาราง', max: family.total, cat: $('#bkCat').value,
          entries: entries.filter((r) => byCode.has(r.sid)).map((r) => ({ code: r.sid, score: r.score })) });
        body.innerHTML = `<div class="ex-done-dlg"><div class="ex-big">✅</div><h3>บันทึกช่อง “${esc(j.task)}” ลง “${esc(j.cls)}” แล้ว</h3>
          <p>${j.set.length} คน${j.missing.length ? ` · ไม่พบเลข ${j.missing.map(esc).join(', ')}` : ''}</p><p class="muted">เปิดสมุดคะแนน ช่องใหม่จะเข้ามาเอง (หรือกด 🔄 ซิงก์)</p>
          <div class="row end"><button class="btn gold" data-x>ปิด</button></div></div>`;
        body.querySelector('[data-x]').onclick = close; sfx.correct(); log(`📒 บันทึกคะแนนลงสมุดคะแนน “${esc(j.cls)}” แล้ว`, 'ok');
      } catch (e) { b.disabled = false; b.textContent = '💾 บันทึกลงสมุดคะแนน'; toast(e?.error === 'auth' ? 'ต้องล็อกอินด้วยอีเมลครูก่อน' : e?.error === 'action' ? 'สมุดคะแนนยังไม่รองรับ — ต้องอัปเดต Apps Script' : 'บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง'); }
    };
  };
  draw();
}

$('#backBtn').onclick = async () => { stop(); sessionStorage.removeItem('gc_exam_pin'); await loadSetup(); show('setup'); };
$('#csvBtn').onclick = () => {
  const pass = passOf(meta, meta.n);
  const head = ['เลขประจำตัว', 'ชื่อ', 'สถานะ', 'ตอบแล้ว', 'คะแนน', 'เต็ม', 'ผล', ...(family?.rounds ? ['คะแนนสุดท้าย (รวมแก้ตัว)'] : []), 'ออกนอกจอ (ครั้ง)', 'ถูกล็อก', 'หมายเหตุ'];
  const list = Object.entries(students).sort((a, b) => String(a[1].sid).localeCompare(String(b[1].sid), 'th', { numeric: true }));
  const out = [head, ...list.map(([u, s]) => [s.sid, s.name, (STAT[s.status] || [''])[0].replace(/^\S+\s/, ''), answered(u), results[u]?.score ?? '', results[u]?.total ?? meta.n,
    results[u] ? (results[u].score >= pass ? 'ผ่าน' : 'ไม่ผ่าน') : '', ...(family?.rounds ? [family.final[s.sid] ?? ''] : []),
    s.leaves || 0, s.extra || s.status === 'locked' ? 'เคยถูกล็อก' : '', s.timeout ? 'หมดเวลา' : s.forced ? 'ครูส่งแทน' : ''])];
  const csv = '﻿' + out.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = `สอบ-${meta.title}${meta.round ? '-แก้ตัว' + meta.round : ''}-${pin}.csv`; a.click();
};
