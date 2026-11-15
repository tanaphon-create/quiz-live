import { connect, TS } from './db.js';
import { renderAvatar } from './avatar.js';
import { sfx, music, musicOn, hurry, setMuted, isMuted, unlock } from './sound.js';
import { $, $$, esc, wait, SHAPES, show, toast, countUp, confetti, rankScores } from './ui.js';
import { SAMPLE } from './sample.js';

/* ───────────── ชุดคำถาม (เก็บในเครื่องครู) ───────────── */
const LS = 'quizlive:quizzes';
const uid8 = () => Math.random().toString(36).slice(2, 10);
let quizzes = (() => { try { return JSON.parse(localStorage.getItem(LS)); } catch { return null; } })();
if (!Array.isArray(quizzes)) quizzes = [structuredClone(SAMPLE)];
const save = () => {
  localStorage.setItem(LS, JSON.stringify(quizzes));
  const m = $('#savedMark');
  m.classList.remove('flash'); void m.offsetWidth; m.classList.add('flash');
};
const blankQ = () => ({ type: 'mc', text: '', image: '', choices: ['', '', '', ''], correct: 0, time: 20, points: 1000 });
const TIMES = [5, 10, 15, 20, 30, 45, 60, 90, 120];
const POINT_CHIPS = [[0, 'ไม่คิดคะแนน'], [500, '500'], [1000, '1000 ปกติ'], [2000, '2000 (x2)'], [3000, '3000 (x3)']];

function renderHome() {
  const g = $('#quizGrid');
  g.innerHTML = quizzes.map((q) => {
    const pts = q.questions.reduce((s, x) => s + (+x.points || 0), 0);
    return `<article class="qcard" data-id="${q.id}">
      <div class="qc-band"><span>${q.questions.length}</span>ข้อ</div>
      <h3>${esc(q.title) || 'ไม่มีชื่อ'}</h3>
      <p class="muted">คะแนนเต็ม ${pts.toLocaleString('th-TH')} · ${q.questions.reduce((s, x) => s + (+x.time || 0), 0)} วินาที</p>
      <div class="row">
        <button class="btn green sm" data-act="play">▶ เปิดห้อง</button>
        <button class="btn light sm" data-act="edit">แก้ไข</button>
        <span class="sp"></span>
        <button class="icon-btn mini" data-act="dup" title="ทำสำเนา">⧉</button>
        <button class="icon-btn mini" data-act="export" title="ส่งออก">⤓</button>
        <button class="icon-btn mini" data-act="del" title="ลบ">🗑</button>
      </div>
    </article>`;
  }).join('') || `<div class="empty">ยังไม่มีชุดคำถาม — กด “สร้างชุดใหม่”</div>`;
}

$('#quizGrid').addEventListener('click', (e) => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const id = b.closest('.qcard').dataset.id;
  const q = quizzes.find((x) => x.id === id);
  switch (b.dataset.act) {
    case 'play': hostGame(q); break;
    case 'edit': openEditor(id); break;
    case 'dup': quizzes.splice(quizzes.indexOf(q) + 1, 0, { ...structuredClone(q), id: uid8(), title: q.title + ' (สำเนา)' }); save(); renderHome(); break;
    case 'export': {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(q, null, 2)], { type: 'application/json' }));
      a.download = (q.title || 'quiz') + '.json'; a.click(); break;
    }
    case 'del': if (confirm(`ลบ “${q.title}” ?`)) { quizzes = quizzes.filter((x) => x !== q); save(); renderHome(); } break;
  }
});
$('#newQuiz').onclick = () => {
  const q = { id: uid8(), title: 'ชุดคำถามใหม่', questions: [blankQ()] };
  quizzes.unshift(q); save(); openEditor(q.id);
};
$('#importFile').onchange = async (e) => {
  const f = e.target.files[0]; if (!f) return;
  try {
    const q = JSON.parse(await f.text());
    if (!Array.isArray(q.questions)) throw 0;
    q.id = uid8(); quizzes.unshift(q); save(); renderHome(); toast('นำเข้าแล้ว ✓');
  } catch { toast('ไฟล์ไม่ถูกต้อง'); }
  e.target.value = '';
};

/* ───────────── ตัวแก้ไข ───────────── */
let ed = null, cq = 0;
function openEditor(id) {
  ed = quizzes.find((q) => q.id === id); cq = 0;
  $('#edTitle').value = ed.title;
  show('editor'); renderQList(); renderQForm();
}
$('#edBack').onclick = () => { renderHome(); show('home'); };
$('#edTitle').oninput = (e) => { ed.title = e.target.value; save(); };
$('#edPlay').onclick = () => hostGame(ed);
$('#addQ').onclick = () => { ed.questions.push(blankQ()); cq = ed.questions.length - 1; save(); renderQList(); renderQForm(); $('#qText')?.focus(); };

function renderQList() {
  $('#qList').innerHTML = ed.questions.map((q, i) => `
    <button class="qthumb ${i === cq ? 'on' : ''} ${qProblem(q) ? 'warn' : ''}" data-i="${i}">
      <span class="n">${i + 1}</span>
      <span class="t">${esc(q.text) || '<i>ยังไม่มีคำถาม</i>'}</span>
      <span class="meta">⏱ ${q.time} วิ · ⭐ ${(+q.points).toLocaleString('th-TH')}</span>
    </button>`).join('');
}
$('#qList').onclick = (e) => {
  const b = e.target.closest('.qthumb'); if (!b) return;
  cq = +b.dataset.i; renderQList(); renderQForm();
};
const nCh = (q) => (q.type === 'tf' ? 2 : 4);
function qProblem(q) {
  if (!q.text.trim()) return 'ยังไม่ได้พิมพ์คำถาม';
  const filled = q.choices.slice(0, nCh(q)).filter((c) => c.trim()).length;
  if (filled < 2) return 'ต้องมีตัวเลือกอย่างน้อย 2 ข้อ';
  if (!q.choices[q.correct]?.trim()) return 'ยังไม่ได้เลือกคำตอบที่ถูก';
  return '';
}

function renderQForm() {
  const f = $('#qForm');
  const q = ed.questions[cq];
  if (!q) { f.innerHTML = '<div class="empty">ยังไม่มีคำถาม</div>'; return; }
  f.innerHTML = `
    <div class="qf-head">
      <div class="seg" id="qType">
        <button data-v="mc" class="${q.type === 'mc' ? 'on' : ''}">4 ตัวเลือก</button>
        <button data-v="tf" class="${q.type === 'tf' ? 'on' : ''}">ถูก / ผิด</button>
      </div>
      <span class="sp"></span>
      <button class="icon-btn mini dark" id="qUp" title="เลื่อนขึ้น">↑</button>
      <button class="icon-btn mini dark" id="qDown" title="เลื่อนลง">↓</button>
      <button class="icon-btn mini dark" id="qDup" title="ทำสำเนา">⧉</button>
      <button class="icon-btn mini dark" id="qDel" title="ลบข้อนี้">🗑</button>
    </div>
    <textarea class="input q-text" id="qText" rows="2" placeholder="พิมพ์คำถามที่นี่…" maxlength="300">${esc(q.text)}</textarea>
    <label class="field"><span>รูปภาพประกอบ (ลิงก์ URL — ไม่บังคับ)</span>
      <input class="input" id="qImg" value="${esc(q.image)}" placeholder="https://…"></label>
    ${q.image ? `<img class="q-img-prev" src="${esc(q.image)}" alt="" onerror="this.remove()">` : ''}
    <div class="choices-ed">
      ${q.choices.slice(0, nCh(q)).map((c, i) => `
        <div class="ch-ed a${i} ${q.correct === i ? 'correct' : ''}">
          <span class="shape">${SHAPES[i]}</span>
          <input data-i="${i}" value="${esc(c)}" placeholder="ตัวเลือกที่ ${i + 1}" maxlength="120" ${q.type === 'tf' ? 'readonly' : ''}>
          <button class="mark" data-i="${i}" title="ตั้งเป็นคำตอบที่ถูก" aria-label="ตั้งเป็นคำตอบที่ถูก">✓</button>
        </div>`).join('')}
    </div>
    <div class="qf-settings">
      <label class="field"><span>⏱ เวลาตอบ</span>
        <select class="input" id="qTime">${TIMES.map((t) => `<option value="${t}" ${+q.time === t ? 'selected' : ''}>${t} วินาที</option>`).join('')}</select></label>
      <div class="field"><span>⭐ คะแนนข้อนี้ (ตอบถูก + เร็ว ได้มากสุดเท่านี้)</span>
        <div class="chips">${POINT_CHIPS.map(([v, l]) => `<button class="chip ${+q.points === v ? 'on' : ''}" data-v="${v}">${l}</button>`).join('')}
          <input class="input pts" id="qPts" type="number" min="0" max="100000" step="50" value="${q.points}" aria-label="กำหนดคะแนนเอง"></div>
      </div>
    </div>
    <p class="warn-line" id="qWarn">${qProblem(q) ? '⚠ ' + qProblem(q) : ''}</p>`;

  const upd = () => { save(); renderQList(); $('#qWarn').textContent = qProblem(q) ? '⚠ ' + qProblem(q) : ''; };
  $('#qText').oninput = (e) => { q.text = e.target.value; upd(); };
  $('#qImg').onchange = (e) => { q.image = e.target.value.trim(); upd(); renderQForm(); };
  $$('.ch-ed input', f).forEach((inp) => (inp.oninput = () => { q.choices[+inp.dataset.i] = inp.value; upd(); }));
  $$('.ch-ed .mark', f).forEach((b) => (b.onclick = () => { q.correct = +b.dataset.i; upd(); renderQForm(); }));
  $('#qTime').onchange = (e) => { q.time = +e.target.value; upd(); };
  $$('.chip', f).forEach((b) => (b.onclick = () => { q.points = +b.dataset.v; upd(); renderQForm(); }));
  $('#qPts').oninput = (e) => { q.points = Math.max(0, +e.target.value || 0); upd(); $$('.chip', f).forEach((c) => c.classList.toggle('on', +c.dataset.v === q.points)); };
  $$('#qType button').forEach((b) => (b.onclick = () => {
    if (q.type === b.dataset.v) return;
    q.type = b.dataset.v;
    if (q.type === 'tf') { q._mc = q.choices; q.choices = ['ถูก', 'ผิด', '', '']; q.correct = Math.min(q.correct, 1); }
    else { q.choices = q._mc || ['', '', '', '']; delete q._mc; }
    upd(); renderQForm();
  }));
  const move = (d) => {
    const j = cq + d; if (j < 0 || j >= ed.questions.length) return;
    [ed.questions[cq], ed.questions[j]] = [ed.questions[j], ed.questions[cq]]; cq = j; save(); renderQList(); renderQForm();
  };
  $('#qUp').onclick = () => move(-1);
  $('#qDown').onclick = () => move(1);
  $('#qDup').onclick = () => { ed.questions.splice(cq + 1, 0, structuredClone(q)); cq++; save(); renderQList(); renderQForm(); };
  $('#qDel').onclick = () => {
    if (ed.questions.length === 1) return toast('ต้องมีอย่างน้อย 1 ข้อ');
    if (!confirm('ลบข้อนี้?')) return;
    ed.questions.splice(cq, 1); cq = Math.max(0, cq - 1); save(); renderQList(); renderQForm();
  };
}

// วางข้อความหลายข้อ
$('#bulkBtn').onclick = () => { $('#bulkText').value = ''; $('#bulkDlg').showModal(); };
$('#bulkCancel').onclick = () => $('#bulkDlg').close();
$('#bulkOk').onclick = () => {
  const blocks = $('#bulkText').value.split(/\n\s*\n/).map((b) => b.split('\n').map((l) => l.trim()).filter(Boolean)).filter((b) => b.length >= 3);
  const out = blocks.map(([text, ...opts]) => {
    let correct = Math.max(0, opts.findIndex((o) => o.startsWith('*')));
    const choices = opts.slice(0, 4).map((o) => o.replace(/^\*\s*/, ''));
    if (correct > 3) correct = 0;
    const tf = choices.length === 2 && /^(ถูก|จริง|true)$/i.test(choices[0]) && /^(ผิด|เท็จ|false)$/i.test(choices[1]);
    while (choices.length < 4) choices.push('');
    return { ...blankQ(), type: tf ? 'tf' : 'mc', text, choices, correct };
  });
  if (!out.length) return toast('ไม่พบคำถาม — ตรวจรูปแบบอีกครั้ง');
  if (ed.questions.length === 1 && !ed.questions[0].text.trim()) ed.questions = [];
  ed.questions.push(...out); cq = ed.questions.length - out.length;
  save(); renderQList(); renderQForm(); $('#bulkDlg').close(); toast(`เพิ่ม ${out.length} ข้อแล้ว ✓`);
};

/* ───────────── เชื่อมต่อ ───────────── */
let DB = null;
const dbReady = connect().then((d) => {
  DB = d;
  $('#modeBadge').innerHTML = d.mode === 'firebase' ? '🟢 ออนไลน์ (Firebase)' : '🟡 โหมดทดลอง — เปิดหลายแท็บในเครื่องนี้';
  return d;
}).catch((e) => {
  console.error(e);
  $('#modeBadge').textContent = '🔴 เชื่อมต่อไม่ได้';
  toast('เชื่อมต่อ Firebase ไม่ได้ — ตรวจ js/config.js และเปิด Anonymous Auth', 6000);
});

/* ───────────── โฮสต์เกม ───────────── */
let R = '', pin = '', quiz = null, order = [], qi = -1, phase = '', players = {};
let opts = { showQ: true, streak: true, shuffle: false };
let unsubs = [], tickH = null, qStart = 0, liveAnswers = {}, lastReveal = null, prevRanks = {};

async function hostGame(q) {
  const bad = q.questions.map((x, i) => [i, qProblem(x)]).find(([, p]) => p);
  if (bad) { openEditor(q.id); cq = bad[0]; renderQList(); renderQForm(); return toast(`ข้อ ${bad[0] + 1}: ${bad[1]}`); }
  unlock();
  if (!(await dbReady)) return;
  quiz = structuredClone(q);
  do { pin = String(100000 + Math.floor(Math.random() * 900000)); } while (await DB.get(`quiz/rooms/${pin}/meta`));
  R = `quiz/rooms/${pin}`;
  await DB.set(R, { meta: { hostUid: DB.uid, state: 'lobby', title: quiz.title, total: quiz.questions.length, qIndex: -1, createdAt: TS, showQ: true } });
  qi = -1; phase = 'lobby'; players = {}; prevRanks = {};
  const url = new URL('play.html', location.href);
  url.searchParams.set('pin', pin);
  if (DB.mode === 'local' && new URLSearchParams(location.search).has('local')) url.searchParams.set('local', '1');
  $('#joinUrl').textContent = url.host + url.pathname.replace(/\/[^/]*$/, '/play.html');
  $('#pinBig').textContent = pin.replace(/(\d{3})(\d{3})/, '$1 $2');
  $('#pinSmall').textContent = pin;
  $('#qr').innerHTML = '';
  if (window.QRCode) new QRCode($('#qr'), { text: url.href, width: 168, height: 168, colorDark: '#2B2350', colorLight: '#ffffff' });
  $('#crowd').innerHTML = '';
  show('lobby');
  music('lobby'); $('#musicBtn').classList.add('on');
  unsubs.push(DB.on(R + '/players', (v) => { players = v || {}; onPlayers(); }));
}

const active = () => Object.entries(players).filter(([, p]) => p && p.name);
function onPlayers() {
  const list = active();
  $('#pCount').textContent = list.length;
  $('#startBtn').disabled = !list.length;
  $('#hallEmpty').hidden = list.length > 0;
  if (phase === 'lobby') renderCrowd(list);
  if (phase === 'question') updateAnswerCount();
}
function renderCrowd(list) {
  const crowd = $('#crowd');
  const seen = new Set();
  for (const [uid, p] of list) {
    seen.add(uid);
    let n = crowd.querySelector(`[data-uid="${uid}"]`);
    const avs = JSON.stringify(p.avatar || {});
    if (!n) {
      n = document.createElement('button');
      n.className = 'buddy'; n.dataset.uid = uid; n.title = 'คลิกเพื่อนำออกจากห้อง';
      n.style.setProperty('--d', (Math.random() * 1.5).toFixed(2) + 's');
      n.innerHTML = `<div class="avatar-box"></div><div class="tag"></div>`;
      crowd.append(n);
      sfx.pop();
    }
    if (n.dataset.av !== avs) { n.dataset.av = avs; n.querySelector('.avatar-box').innerHTML = renderAvatar(p.avatar, { bg: false }); n.classList.remove('wiggle'); void n.offsetWidth; n.classList.add('wiggle'); }
    n.querySelector('.tag').textContent = p.name;
    n.classList.toggle('off', p.online === false);
  }
  $$('.buddy', crowd).forEach((n) => !seen.has(n.dataset.uid) && n.remove());
}
$('#crowd').onclick = (e) => {
  const b = e.target.closest('.buddy'); if (!b) return;
  const p = players[b.dataset.uid];
  if (p && confirm(`นำ “${p.name}” ออกจากห้อง?`)) DB.remove(`${R}/players/${b.dataset.uid}`);
};
$('#musicBtn').onclick = () => { const on = !musicOn(); music(on ? 'lobby' : null); $('#musicBtn').classList.toggle('on', on); };
$('#lobbyCancel').onclick = async () => { if (confirm('ยกเลิกห้องนี้?')) { await DB.update(R, { 'meta/state': 'end', 'meta/cancelled': true }); leave(); } };
$('#muteBtn').onclick = () => { setMuted(!isMuted()); $('#muteBtn').textContent = isMuted() ? '🔇' : '🔊'; };
$('#endGameBtn').onclick = () => { if (confirm('จบเกมตอนนี้และแสดงผลสรุป?')) finish(); };

function leave() {
  unsubs.forEach((u) => u && u()); unsubs = []; clearInterval(tickH); music(null);
  phase = ''; renderHome(); show('home');
}

$('#startBtn').onclick = async () => {
  opts = { showQ: $('#optShowQ').checked, streak: $('#optStreak').checked, shuffle: $('#optShuffle').checked };
  order = quiz.questions.map((_, i) => i);
  if (opts.shuffle) order.sort(() => Math.random() - 0.5);
  await DB.update(R, { 'meta/showQ': opts.showQ, 'meta/streak': opts.streak });
  music(null);
  show('game');
  goQuestion(0);
};

const Q = () => quiz.questions[order[qi]];
const stage = () => $('#stage');

async function goQuestion(i) {
  qi = i; phase = 'ready';
  const q = Q();
  $('#qCounter').textContent = `ข้อ ${i + 1} / ${order.length}`;
  await DB.update(R, {
    current: { idx: i, text: q.text, image: q.image || '', type: q.type, choices: q.choices.slice(0, nCh(q)), time: q.time, points: q.points },
    'meta/state': 'ready', 'meta/qIndex': i, 'meta/qStartAt': null,
  });
  stage().innerHTML = `
    <div class="ready">
      <div class="ready-num">ข้อ ${i + 1}</div>
      ${q.points >= 2000 ? `<div class="bonus-badge">⭐ คะแนน x${q.points / 1000} ⭐</div>` : q.points === 0 ? '<div class="bonus-badge muted-badge">ข้อนี้ไม่คิดคะแนน</div>' : ''}
      <h1 class="ready-q">${esc(q.text)}</h1>
      <div class="ready-bar"><i></i></div>
    </div>`;
  sfx.whoosh();
  [3, 2, 1].forEach((n, k) => setTimeout(() => phase === 'ready' && qi === i && sfx.count(n), 1000 * (k + 1)));
  await wait(4000);
  if (phase !== 'ready' || qi !== i) return;
  beginAnswering();
}

async function beginAnswering() {
  const q = Q();
  phase = 'question';
  liveAnswers = {};
  await DB.update(R, { 'meta/state': 'question', 'meta/qStartAt': TS });
  qStart = (await DB.get(R + '/meta/qStartAt')) || DB.now();
  sfx.go();
  music('question');
  stage().innerHTML = `
    <div class="qscreen">
      <h1 class="q-title">${esc(q.text)}</h1>
      <div class="q-mid">
        <div class="timer"><svg viewBox="0 0 100 100"><circle class="trk" cx="50" cy="50" r="44"/><circle class="arc" id="arc" cx="50" cy="50" r="44" pathLength="100"/></svg><span id="tNum">${q.time}</span></div>
        <div class="q-media">${q.image ? `<img src="${esc(q.image)}" alt="">` : `<div class="q-ph">${q.points >= 2000 ? '⭐ x' + q.points / 1000 : '🤔'}</div>`}</div>
        <div class="ans-count"><b id="aNum">0</b><span>ตอบแล้ว</span><small id="aOf"></small></div>
      </div>
      <div class="ans-grid n${nCh(q)}">${q.choices.slice(0, nCh(q)).map((c, k) => `<div class="ans a${k}"><span class="shape">${SHAPES[k]}</span><span>${esc(c)}</span></div>`).join('')}</div>
      <div class="q-tools"><button class="btn ghost sm" id="skipBtn">ข้ามเวลา ⏭</button></div>
    </div>`;
  $('#skipBtn').onclick = endQuestion;
  updateAnswerCount();
  const ua = DB.on(`${R}/answers/${qi}`, (v) => { liveAnswers = v || {}; updateAnswerCount(); });
  unsubs.push(ua);
  let lastSec = null;
  clearInterval(tickH);
  tickH = setInterval(() => {
    const left = Math.max(0, q.time * 1000 - (DB.now() - qStart));
    const sec = Math.ceil(left / 1000);
    const arc = $('#arc'); if (arc) arc.style.strokeDashoffset = 100 - (left / (q.time * 1000)) * 100;
    if (sec !== lastSec) {
      lastSec = sec;
      const t = $('#tNum'); if (t) { t.textContent = sec; t.parentElement.classList.toggle('hurry', sec <= 5); }
      if (sec <= 5 && sec > 0) { sfx.urgent(); hurry(true); }
    }
    if (left <= 0) endQuestion();
  }, 100);
  q._ua = ua;
}

function updateAnswerCount() {
  if (phase !== 'question') return;
  const n = Object.keys(liveAnswers).length;
  const total = active().filter(([, p]) => p.online !== false).length;
  const a = $('#aNum'); if (a) a.textContent = n;
  const o = $('#aOf'); if (o) o.textContent = `จาก ${total} คน`;
  if (total > 0 && n >= total) endQuestion();
}

async function endQuestion() {
  if (phase !== 'question') return;
  phase = 'scoring';
  clearInterval(tickH);
  music(null); sfx.timeUp();
  const q = Q();
  q._ua && q._ua();
  await wait(500); // รอคำตอบที่กำลังส่งมา
  const answers = (await DB.get(`${R}/answers/${qi}`)) || {};
  const T = q.time * 1000;
  const before = rankScores(players);
  before.forEach((p, i) => (prevRanks[p.uid] = i + 1));

  const res = {};
  for (const [uid, p] of active()) {
    const a = answers[uid];
    const answered = !!a && a.at - qStart <= T + 1500;
    const correct = answered && a.choice === q.correct;
    const ms = answered ? Math.min(T, Math.max(0, a.at - qStart)) : null;
    const gained = correct ? Math.round(q.points * (1 - ms / T / 2)) : 0;
    const streak = correct ? (p.streak || 0) + 1 : 0;
    const bonus = correct && opts.streak && q.points > 0 && streak >= 2 ? Math.min((streak - 1) * 100, 500) : 0;
    res[uid] = { answered, correct, choice: answered ? a.choice : null, ms, gained, bonus, streak, score: (p.score || 0) + gained + bonus, correctCount: (p.correct || 0) + (correct ? 1 : 0) };
  }
  const ranked = Object.entries(res).sort((a, b) => b[1].score - a[1].score);
  const upd = { 'meta/state': 'reveal', 'current/correct': q.correct };
  ranked.forEach(([uid, r], i) => {
    r.rank = i + 1; r.of = ranked.length;
    r.ahead = i > 0 ? { name: players[ranked[i - 1][0]].name, gap: ranked[i - 1][1].score - r.score } : null;
    upd[`players/${uid}/score`] = r.score;
    upd[`players/${uid}/streak`] = r.streak;
    upd[`players/${uid}/correct`] = r.correctCount;
    upd[`players/${uid}/lastGain`] = r.gained + r.bonus;
    upd[`results/${qi}/${uid}`] = r;
  });
  await DB.update(R, upd);
  lastReveal = { res, answers };
  phase = 'reveal';
  renderReveal();
}

function renderReveal() {
  const q = Q();
  const { res } = lastReveal;
  const n = nCh(q);
  const counts = Array(n).fill(0);
  Object.values(res).forEach((r) => r.answered && r.choice < n && counts[r.choice]++);
  const max = Math.max(1, ...counts);
  const totalP = Object.keys(res).length;
  const nCorrect = Object.values(res).filter((r) => r.correct).length;
  const fastest = Object.entries(res).filter(([, r]) => r.correct).sort((a, b) => a[1].ms - b[1].ms)[0];
  sfx.reveal();
  stage().innerHTML = `
    <div class="reveal suspense">
      <h1 class="q-title sm">${esc(q.text)}</h1>
      <div class="bars n${n}">${counts.map((c, k) => `
        <div class="bar a${k} ${k === q.correct ? 'right' : 'dim'}">
          <div class="bar-n">${c}</div>
          <div class="bar-col"><i style="--h:${Math.max(4, (c / max) * 100)}%"></i></div>
          <div class="bar-ico">${SHAPES[k]}${k === q.correct ? '<b>✓</b>' : ''}</div>
        </div>`).join('')}</div>
      <div class="ans-grid n${n} rev">${q.choices.slice(0, n).map((c, k) => `<div class="ans a${k} ${k === q.correct ? 'right' : 'dim'}"><span class="shape">${SHAPES[k]}</span><span>${esc(c)}</span>${k === q.correct ? '<span class="tick">✓</span>' : ''}</div>`).join('')}</div>
      <div class="rev-foot">
        <span class="pill">ตอบถูก <b>${nCorrect}/${totalP}</b> คน</span>
        ${fastest ? `<span class="pill">⚡ เร็วที่สุด: <b>${esc(players[fastest[0]]?.name)}</b> ${(fastest[1].ms / 1000).toFixed(1)} วิ</span>` : ''}
        <span class="sp"></span>
        <button class="btn gold big" id="toBoard">ดูอันดับ ›</button>
      </div>
    </div>`;
  $('#toBoard').onclick = showBoard;
  setTimeout(() => $('.reveal')?.classList.remove('suspense'), 1100);
}

// อันดับ: ค่อย ๆ เปิดจากอันดับ 5 → 1 บนจอครูก่อน แล้วจึงส่งให้มือถือนักเรียน
async function showBoard() {
  phase = 'board';
  const myQ = qi;
  await DB.update(R, { 'meta/state': 'board', 'meta/rankShown': -1 });
  const { res } = lastReveal;
  const top = Object.entries(res).sort((a, b) => a[1].rank - b[1].rank).slice(0, 5);
  const last = qi >= order.length - 1;
  stage().innerHTML = `
    <div class="board">
      <h1 class="board-h">🏆 อันดับคะแนน</h1>
      <ol class="rank-list">${top.map(([uid, r]) => {
        const p = players[uid] || {};
        const mv = (prevRanks[uid] || r.rank) - r.rank;
        const g = r.gained + r.bonus;
        return `<li class="rk">
          <span class="rk-n">${r.rank}</span>
          <span class="rk-av">${renderAvatar(p.avatar)}</span>
          <span class="rk-name">${esc(p.name)} ${r.streak >= 2 ? `<span class="fire">🔥${r.streak}</span>` : ''}</span>
          ${mv > 0 && qi > 0 ? `<span class="mv up">▲${mv}</span>` : ''}
          ${g > 0 ? `<span class="gain">+${g.toLocaleString('th-TH')}</span>` : ''}
          <b class="rk-s" data-from="${r.score - g}" data-to="${r.score}">${(r.score - g).toLocaleString('th-TH')}</b>
        </li>`;
      }).join('')}</ol>
      <div class="rev-foot"><span class="pill" id="boardNote">🥁 กำลังประกาศอันดับ…</span><span class="sp"></span>
        <button class="btn gold big" id="nextBtn" disabled>${last ? '🎉 ประกาศผล' : 'ข้อต่อไป ›'}</button></div>
    </div>`;
  $('#nextBtn').onclick = () => (last ? finish() : goQuestion(qi + 1));
  const rows = $$('.rk');
  const alive = () => phase === 'board' && qi === myQ;
  await wait(500);
  for (let k = rows.length - 1; k >= 0 && alive(); k--) {
    if (k === 0 && rows.length > 1) { sfx.drumroll(1.6); rows[0].classList.add('tease'); await wait(1700); if (!alive()) return; }
    rows[k].classList.remove('tease');
    rows[k].classList.add('show');
    k === 0 ? sfx.first() : sfx.rankStep(rows.length - 1 - k);
    const b = rows[k].querySelector('.rk-s');
    countUp(b, +b.dataset.from, +b.dataset.to, 900);
    if (k === 0) confetti(80, 2500);
    await wait(k === 0 ? 1000 : 950);
  }
  if (!alive()) return;
  await DB.update(R, { 'meta/rankShown': myQ });
  $('#boardNote').textContent = '📱 ส่งอันดับไปที่มือถือนักเรียนแล้ว';
  $('#nextBtn').disabled = false;
}

async function finish() {
  phase = 'end'; clearInterval(tickH); music(null);
  const total = Math.max(1, qi + 1); // นับเฉพาะข้อที่เล่นจริง (กรณีจบเกมก่อน)
  await DB.update(R, { 'meta/state': 'end', 'meta/podiumDone': false, 'meta/played': total });
  const list = rankScores(players);
  const podium = [list[1], list[0], list[2]];
  const T3 = 0.4, T2 = 2.0, T1 = 5.0; // วินาทีที่แต่ละอันดับขึ้น
  stage().innerHTML = `
    <div class="end">
      <h1 class="board-h">🎉 ${esc(quiz.title)}</h1>
      <div class="podium">${podium.map((p, k) => {
        const place = [2, 1, 3][k];
        return p ? `<div class="pod p${place}" style="--delay:${[T2, T1, T3][k]}s">
          <div class="pod-av">${place === 1 ? '<span class="crown">👑</span>' : ''}${renderAvatar(p.avatar, { bg: false })}</div>
          <div class="pod-name">${esc(p.name)}</div>
          <div class="pod-col"><span>${place}</span><small>${p.score.toLocaleString('th-TH')}</small></div>
        </div>` : '<div class="pod empty-pod"></div>';
      }).join('')}</div>
      <details class="all-rank card"><summary>ดูคะแนนทุกคน (${list.length} คน)</summary>
        <table><thead><tr><th>อันดับ</th><th>เลขประจำตัว</th><th>ชื่อ</th><th>ตอบถูก</th><th>คะแนน</th></tr></thead><tbody>
        ${list.map((p, i) => `<tr><td>${i + 1}</td><td>${esc(p.sid || '-')}</td><td>${esc(p.name)}</td><td>${p.correct || 0}/${total}</td><td>${p.score.toLocaleString('th-TH')}</td></tr>`).join('')}
        </tbody></table></details>
      <div class="rev-foot">
        <label class="pill conv">แปลงเป็นคะแนนเก็บ เต็ม <input type="number" id="fullPts" value="10" min="1" max="100"> คะแนน</label>
        <button class="btn light" id="csvBtn">⤓ ดาวน์โหลดคะแนน (CSV)</button><span class="sp"></span><button class="btn gold" id="homeBtn">กลับหน้าหลัก</button></div>
    </div>`;
  const at = (s, fn) => setTimeout(() => phase === 'end' && fn(), s * 1000);
  if (list[2]) at(T3, () => sfx.rankStep(0));
  if (list[1]) at(T2, () => sfx.rankStep(2));
  at(T1 - 2.2, () => sfx.drumroll(2.2));
  at(T1, () => { sfx.fanfare(); confetti(220, 6000); });
  at(T1 + 1.2, () => DB.update(R, { 'meta/podiumDone': true }));
  $('#homeBtn').onclick = leave;
  $('#csvBtn').onclick = () => {
    const full = Math.max(1, +$('#fullPts').value || 10);
    const bySid = list.map((p, i) => ({ ...p, rank: i + 1 }))
      .sort((a, b) => String(a.sid || '').localeCompare(String(b.sid || ''), 'th', { numeric: true }));
    const rows = [['เลขประจำตัว', 'ชื่อ', 'อันดับ', 'ตอบถูก', 'จำนวนข้อ', 'คะแนนเกม', `คะแนนเก็บ (เต็ม ${full})`],
      ...bySid.map((p) => [p.sid || '', p.name, p.rank, p.correct || 0, total, p.score, Math.round(((p.correct || 0) / total) * full * 100) / 100])];
    const csv = '﻿' + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `คะแนน-${quiz.title}-${pin}.csv`; a.click();
  };
}

renderHome();
