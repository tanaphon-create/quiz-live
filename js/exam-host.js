// สอบนอกตาราง — จอครู: เลือกชุดข้อสอบ เปิดห้อง คุมสอบแบบเรียลไทม์ ตรวจคะแนน
// เฉลยเก็บที่ quiz/banks/{uid}/exams/{pin} (อ่านได้เฉพาะครู) — ห้องสอบ quiz/exams/{pin} มีแต่โจทย์
import { connect, isTeacher } from './db.js';
import { $, esc, show, toast } from './ui.js';
import { sfx, unlock } from './sound.js';

let DB, me = null, quizzes = [], exams = {};
let pin = '', meta = null, key = [], students = {}, ans = {}, results = {}, unsubs = [];
const seenLeaves = {}, seenStatus = {}, feed = [];

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
  const all = q.questions.length, ok = q.questions.filter(usable).length;
  $('#quizInfo').textContent = `${ok} ข้อ (ข้อละ 1 คะแนน)` + (all > ok ? ` · ข้ามข้อที่ไม่มีโจทย์ ${all - ok} ข้อ` : '');
}
$('#quizSel').onchange = quizInfo;

async function renderOpenList() {
  const pins = Object.keys(exams).sort((a, b) => (exams[b].createdAt || 0) - (exams[a].createdAt || 0)).slice(0, 12);
  const metas = await Promise.all(pins.map((p) => DB.get(`quiz/exams/${p}/meta`).catch(() => null)));
  const rows = pins.map((p, i) => ({ p, m: metas[i] })).filter((x) => x.m);
  $('#openList').hidden = !rows.length;
  $('#openList').innerHTML = `<h2>ห้องสอบของฉัน</h2><ul class="ex-list">${rows.map(({ p, m }) => `<li>
      <span class="ex-badge ${m.state}">${m.state === 'open' ? '🟢 เปิดอยู่' : '⚪ ปิดแล้ว'}</span>
      <b>${esc(m.title)}</b><small>PIN ${p} · ${new Date(m.createdAt).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}</small>
      <button class="btn light sm" data-pin="${p}">${m.state === 'open' ? 'เข้าจอคุมสอบ' : 'ดูผล'}</button></li>`).join('')}</ul>`;
}
$('#openList').onclick = (e) => { const b = e.target.closest('[data-pin]'); if (b) openProctor(b.dataset.pin); };

$('#setupForm').onsubmit = async (e) => {
  e.preventDefault(); unlock();
  const q = quizzes.find((x) => x.id === $('#quizSel').value); if (!q) return;
  const qs = q.questions.filter(usable);
  const b = $('#openBtn'); b.disabled = true; b.textContent = 'กำลังเปิด…';
  try {
    let p = '';
    for (let i = 0; i < 8 && !p; i++) { const c = String(100000 + Math.floor(Math.random() * 900000)); if (!(await DB.get(`quiz/exams/${c}/meta`))) p = c; }
    const m = { hostUid: me, title: q.title, state: 'open', n: qs.length, duration: Math.max(1, +$('#dur').value || 30), maxLeave: Math.max(0, +$('#maxLeave').value || 0),
      shuffleQ: $('#shufQ').checked, shuffleC: $('#shufC').checked, showScore: $('#showScore').checked, createdAt: Date.now() };
    const paper = qs.map((x) => ({ type: x.type, text: x.text, image: x.image || '', choices: (x.choices || []).slice(0, x.type === 'tf' ? 2 : 4).map((c) => String(c ?? '')) }));
    await DB.set(`quiz/exams/${p}`, { meta: m, paper });
    await DB.set(`quiz/banks/${me}/exams/${p}`, { title: q.title, quizId: q.id, key: qs.map((x) => +x.correct || 0), createdAt: m.createdAt });
    exams[p] = { title: q.title, key: qs.map((x) => +x.correct || 0), createdAt: m.createdAt };
    openProctor(p);
  } catch (err) { console.error(err); toast('เปิดห้องสอบไม่สำเร็จ ลองใหม่อีกครั้ง'); }
  b.disabled = false; b.textContent = 'เปิดห้องสอบ ›';
};

/* ───────── คุมสอบ ───────── */
function stop() { unsubs.forEach((u) => typeof u === 'function' && u()); unsubs = []; clearInterval(tickH); }
let tickH = null;
function openProctor(p) {
  stop();
  pin = p; key = exams[p]?.key || []; students = {}; ans = {}; results = {}; feed.length = 0;
  Object.keys(seenLeaves).forEach((k) => delete seenLeaves[k]); Object.keys(seenStatus).forEach((k) => delete seenStatus[k]);
  sessionStorage.setItem('gc_exam_pin', p);
  const url = new URL('take.html', location.href); url.search = '?pin=' + p;
  $('#pUrl').textContent = url.host + url.pathname.replace(/\/[^/]*$/, '/') + 'take.html';
  $('#pPin').textContent = p.replace(/(\d{3})(\d{3})/, '$1 $2');
  $('#pQr').innerHTML = ''; if (window.QRCode) new QRCode($('#pQr'), { text: url.href, width: 150, height: 150, colorDark: '#2B2350', colorLight: '#ffffff' });
  $('#pFeed').innerHTML = '<li class="muted">ยังไม่มี</li>'; $('#pAlert').hidden = true;
  show('proctor');
  let first = true;
  unsubs.push(DB.on(`quiz/exams/${p}/meta`, (m) => { meta = m; if (!m) return; renderHead(); render(); }));
  unsubs.push(DB.on(`quiz/exams/${p}/students`, (v) => { const prev = students; students = v || {}; detect(prev, first); first = false; render(); grade(); }));
  unsubs.push(DB.on(`quiz/exams/${p}/ans`, (v) => { ans = v || {}; render(); grade(); }));
  unsubs.push(DB.on(`quiz/exams/${p}/results`, (v) => { results = v || {}; render(); }));
  tickH = setInterval(() => { render(); autoSubmit(); }, 1000);
}
function renderHead() {
  $('#pTitle').textContent = meta.title;
  $('#pState').textContent = meta.state === 'open' ? `🟢 เปิดสอบ · ${meta.duration} นาที` : '⚪ ปิดห้องสอบแล้ว';
  $('#pRule').innerHTML = `${meta.n} ข้อ · ${meta.duration} นาที · ออกนอกจอได้ ${meta.maxLeave} ครั้ง<br>${meta.shuffleQ ? 'สุ่มข้อ' : 'ไม่สุ่มข้อ'} · ${meta.shuffleC ? 'สุ่มตัวเลือก' : 'ไม่สุ่มตัวเลือก'}`;
  $('#closeBtn').hidden = $('#addTime').hidden = meta.state !== 'open';
}

const answered = (u) => Object.values(ans[u] || {}).filter((v) => v != null).length;
const limitOf = (s) => (meta?.maxLeave || 0) + (s.extra || 0);
const deadlineOf = (s) => (s.startAt ? s.startAt + (meta?.duration || 0) * 60000 : null);
const nameOf = (s) => `${esc(s.name || '-')} <small>(${esc(s.sid || '-')})</small>`;
function log(html, cls = '') {
  const t = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  feed.unshift(`<li class="${cls}"><time>${t}</time> ${html}</li>`); feed.length = Math.min(feed.length, 60);
  $('#pFeed').innerHTML = feed.join('');
}
// ตรวจเหตุการณ์ใหม่: ออกนอกจอ / ถูกล็อก / ส่งข้อสอบ
function detect(prev, first) {
  for (const [u, s] of Object.entries(students)) {
    const L = s.leaves || 0, was = seenLeaves[u] ?? (first ? L : 0);
    if (!first && L > was) {
      log(`👀 <b>${nameOf(s)}</b> ออกนอกหน้าจอ ครั้งที่ ${L}${L > limitOf(s) ? ` (เกินที่อนุญาต ${limitOf(s)} ครั้ง)` : `/${limitOf(s)}`}${s.lastKind ? ` <small>(${esc(KIND[s.lastKind] || s.lastKind)})</small>` : ''}`, L > limitOf(s) ? 'bad' : 'warn');
      if (s.status !== 'locked') sfx.urgent();
    }
    seenLeaves[u] = L;
    const st0 = seenStatus[u] ?? (first ? s.status : null);
    if (!first && st0 !== s.status) {
      if (s.status === 'locked') { log(`🔒 <b>${nameOf(s)}</b> ออกนอกจอเกินกำหนด — ถูกล็อก`, 'bad'); sfx.wrong(); flash(s); }
      else if (s.status === 'doing' && st0 === 'ready') log(`▶️ <b>${nameOf(s)}</b> เริ่มทำข้อสอบ`);
      else if (s.status === 'submitted') log(`✅ <b>${nameOf(s)}</b> ส่งข้อสอบแล้ว`, 'ok');
      else if (!st0) log(`🙋 <b>${nameOf(s)}</b> เข้าห้องสอบ`);
    }
    seenStatus[u] = s.status;
  }
}
const KIND = { hidden: 'สลับแอป/แท็บ', blur: 'คลิกออกนอกหน้าต่าง', fullscreen: 'ออกจากเต็มจอ', reload: 'รีเฟรช/ปิดหน้า' };
function flash(s) {
  const a = $('#pAlert'); a.hidden = false;
  a.innerHTML = `🚨 <b>${esc(s.name)}</b> (${esc(s.sid)}) ออกนอกหน้าจอเกิน ${limitOf(s)} ครั้ง — ข้อสอบถูกล็อก <span class="sp"></span><button class="btn light sm" data-x>รับทราบ</button>`;
  a.querySelector('[data-x]').onclick = () => (a.hidden = true);
}

const STAT = { ready: ['⏳ รอเริ่ม', 'ready'], doing: ['✏️ กำลังทำ', 'doing'], locked: ['🔒 ถูกล็อก', 'locked'], submitted: ['✅ ส่งแล้ว', 'done'] };
const fmt = (ms) => { if (ms <= 0) return 'หมดเวลา'; const s = Math.ceil(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
function rows() {
  const order = { locked: 0, doing: 1, ready: 2, submitted: 3 };
  return Object.entries(students).sort((a, b) => (order[a[1].status] ?? 4) - (order[b[1].status] ?? 4) || String(a[1].sid).localeCompare(String(b[1].sid), 'th', { numeric: true }));
}
function render() {
  if (!meta) return;
  const list = rows(), now = DB.now(), n = meta.n || 1;
  const cnt = { ready: 0, doing: 0, locked: 0, submitted: 0, away: 0 };
  list.forEach(([, s]) => { cnt[s.status] = (cnt[s.status] || 0) + 1; if (s.away && s.status === 'doing') cnt.away++; });
  $('#pStats').innerHTML = [['🙋', 'เข้าห้อง', list.length, ''], ['✏️', 'กำลังทำ', cnt.doing, 'doing'], ['👀', 'ออกนอกจออยู่', cnt.away, cnt.away ? 'warn' : ''], ['🔒', 'ถูกล็อก', cnt.locked, cnt.locked ? 'locked' : ''], ['✅', 'ส่งแล้ว', cnt.submitted, 'done']]
    .map(([e, t, v, c]) => `<div class="ex-stat ${c}"><span>${e} ${t}</span><b>${v}</b></div>`).join('');
  if (!list.length) { $('#pRows').innerHTML = '<tr><td colspan="8" class="muted ex-empty">รอนักเรียนเข้าห้องสอบ…</td></tr>'; return; }
  $('#pRows').innerHTML = list.map(([u, s]) => {
    const done = answered(u), L = s.leaves || 0, lim = limitOf(s), dl = deadlineOf(s);
    const [st, sc] = STAT[s.status] || ['?', ''];
    const r = results[u];
    return `<tr class="r-${sc}${s.away && s.status === 'doing' ? ' r-away' : ''}">
      <td>${esc(s.sid)}</td><td><b>${esc(s.name)}</b>${s.online === false && s.status !== 'submitted' ? ' <small class="off">ออฟไลน์</small>' : ''}</td>
      <td><span class="chip ${sc}">${st}</span>${s.away && s.status === 'doing' ? ' <span class="chip warn">👀 ออกนอกจออยู่</span>' : ''}</td>
      <td><div class="ex-bar"><i style="width:${(done / n) * 100}%"></i></div><small>${done}/${n}</small></td>
      <td class="lv ${L > lim ? 'over' : L ? 'some' : ''}">${L}/${lim}</td>
      <td>${s.status === 'submitted' ? '-' : dl ? fmt(dl - now) : '-'}</td>
      <td>${r ? `<b>${r.score}</b>/${r.total}` : '-'}</td>
      <td class="act">${s.status === 'locked' ? `<button class="btn green sm" data-unlock="${u}">ปลดล็อก</button>` : ''}${s.status === 'doing' || s.status === 'locked' ? `<button class="btn light sm" data-submit="${u}">บังคับส่ง</button>` : ''}</td>
    </tr>`;
  }).join('');
}
$('#pRows').onclick = async (e) => {
  const u1 = e.target.closest('[data-unlock]')?.dataset.unlock, u2 = e.target.closest('[data-submit]')?.dataset.submit;
  if (u1) {
    const s = students[u1]; if (!s) return;
    // ปลดล็อก: ให้ออกนอกจอได้เพิ่มอีก 1 ครั้งนับจากตอนนี้
    const extra = Math.max(0, (s.leaves || 0) - (meta.maxLeave || 0));
    await DB.update(`quiz/exams/${pin}/students/${u1}`, { status: 'doing', extra, away: false });
    log(`🔓 ปลดล็อกให้ <b>${nameOf(s)}</b> (ถ้าออกอีกครั้งจะถูกล็อกทันที)`, 'ok'); $('#pAlert').hidden = true;
  }
  if (u2) {
    const s = students[u2]; if (!s || !confirm(`บังคับส่งข้อสอบของ ${s.name}?`)) return;
    await DB.update(`quiz/exams/${pin}/students/${u2}`, { status: 'submitted', submittedAt: DB.now(), forced: true });
  }
};

// ตรวจคะแนนของคนที่ส่งแล้ว (เฉลยอยู่ที่ครูเท่านั้น)
function grade() {
  if (!meta || !key.length) return;
  for (const [u, s] of Object.entries(students)) {
    if (s.status !== 'submitted') continue;
    const a = ans[u] || {};
    const score = key.reduce((t, k, i) => t + (a['q' + i] === k ? 1 : 0), 0);
    const r = results[u];
    if (!r || r.score !== score || r.total !== key.length) DB.set(`quiz/exams/${pin}/results/${u}`, { score, total: key.length });
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
$('#closeBtn').onclick = async () => {
  const left = Object.values(students).filter((s) => s.status !== 'submitted').length;
  if (!confirm(`ปิดห้องสอบ?${left ? ` นักเรียน ${left} คนที่ยังไม่ส่ง จะถูกส่งข้อสอบอัตโนมัติ` : ''}`)) return;
  const upd = { 'meta/state': 'closed', 'meta/closedAt': DB.now() };
  for (const [u, s] of Object.entries(students)) if (s.status !== 'submitted') Object.assign(upd, { [`students/${u}/status`]: 'submitted', [`students/${u}/submittedAt`]: DB.now(), [`students/${u}/forced`]: true });
  await DB.update(`quiz/exams/${pin}`, upd);
  toast('ปิดห้องสอบแล้ว');
};
$('#backBtn').onclick = async () => { stop(); sessionStorage.removeItem('gc_exam_pin'); await loadSetup(); show('setup'); };
$('#csvBtn').onclick = () => {
  const head = ['เลขประจำตัว', 'ชื่อ', 'สถานะ', 'ตอบแล้ว', 'คะแนน', 'เต็ม', 'ออกนอกจอ (ครั้ง)', 'ถูกล็อก', 'หมายเหตุ'];
  const list = Object.entries(students).sort((a, b) => String(a[1].sid).localeCompare(String(b[1].sid), 'th', { numeric: true }));
  const out = [head, ...list.map(([u, s]) => [s.sid, s.name, (STAT[s.status] || [''])[0].replace(/^\S+\s/, ''), answered(u), results[u]?.score ?? '', results[u]?.total ?? meta.n,
    s.leaves || 0, s.extra || s.status === 'locked' ? 'เคยถูกล็อก' : '', s.timeout ? 'หมดเวลา' : s.forced ? 'ครูส่งแทน' : ''])];
  const csv = '﻿' + out.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = `สอบ-${meta.title}-${pin}.csv`; a.click();
};
