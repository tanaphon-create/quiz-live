import { connect, TS, isTeacher } from './db.js';
import { renderAvatar } from './avatar.js?v=20261126a';
import { ghost } from './ghost.js?v=20261126a';
import { BOSSES, BOSS_LV, BOSS_HEAL, bossHP, bossSVG, hpBar, WAGER_BETS, WAGER_START, wagerOf, rocketGoal, pctOf, MODE_COLOR, AWARDS } from './fun-modes.js?v=20261126c';
import { sfx, music, musicOn, hurry, setMuted, isMuted, unlock, setMusicTheme } from './sound.js';
import { $, $$, esc, wait, SHAPES, show, toast, countUp, confetti, rankScores, MODES, TEAMS, hearts, sortPlayers, teamInfo, teamDecision } from './ui.js?v=20261124a';
import { SAMPLE } from './sample.js';
import { SCOREBOOK_API } from './config.js';
import { applyTheme, savedTheme, openThemePicker } from './themes.js';
import { openMusicPicker } from './music-picker.js';
import { startLand, LAND_TIMES, LAND_SIZES, boardDims } from './land-host.js?v=20261126a';
applyTheme(savedTheme());
// เพลงตามธีม: ใช้ธีมเกมที่ครูเลือก · ถ้ายังเป็นค่าเริ่มต้น 👻 ใช้ธีมทั้งเว็บ (ลอยกระทง ฤดูร้อน กลางคืน ฝน สงคราม) แทน
const syncMusic = () => {
  const g = document.documentElement.dataset.theme || savedTheme();
  setMusicTheme(g !== 'ghost' ? g : (window.GCFest?.get().active || 'ghost'));
};
syncMusic(); addEventListener('gc-fest', syncMusic);

/* ───────────── ชุดคำถาม (เก็บใน Firebase เฉพาะบัญชีครู) ───────────── */
const LS = 'quizlive:quizzes'; // ที่เก็บเดิมในเครื่อง — ย้ายขึ้นคลาวด์ครั้งแรกแล้วลบทิ้ง
const uid8 = () => Math.random().toString(36).slice(2, 10);
let quizzes = [], bankPath = '', saveH = null;
const arr = (v) => (Array.isArray(v) ? v : v && typeof v === 'object' ? Object.keys(v).sort((a, b) => a - b).map((k) => v[k]) : []);
function normQuiz(q) {
  q.questions = arr(q.questions).map((x) => ({ ...x, choices: [...arr(x.choices), '', '', '', ''].slice(0, 4).map((c) => c ?? ''), image: x.image || '', text: x.text || '' }));
  return q;
}
async function loadBank(uid) {
  bankPath = `quiz/banks/${uid}/quizzes`;
  const v = await DB.get(bankPath);
  if (v) { quizzes = Object.values(v).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map(normQuiz); return; }
  let old = null;
  try { old = JSON.parse(localStorage.getItem(LS)); } catch {}
  quizzes = (Array.isArray(old) && old.length ? old : [structuredClone(SAMPLE)]).map(normQuiz);
  await writeBank();
  localStorage.removeItem(LS);
}
const writeBank = () => DB.set(bankPath, Object.fromEntries(quizzes.map((q, i) => [q.id, JSON.parse(JSON.stringify({ ...q, order: i }))])));
const save = () => {
  const m = $('#savedMark');
  m.textContent = 'กำลังบันทึก…';
  clearTimeout(saveH);
  saveH = setTimeout(async () => {
    try { await writeBank(); m.textContent = 'บันทึกบนคลาวด์ ✓'; m.classList.remove('flash'); void m.offsetWidth; m.classList.add('flash'); }
    catch (e) { console.error(e); m.textContent = '⚠ บันทึกไม่สำเร็จ'; toast('บันทึกไม่สำเร็จ — ตรวจอินเทอร์เน็ต'); }
  }, 600);
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
  const out = blocks.map(([head, ...opts]) => {
    // ท้ายบรรทัดคำถามใส่ [คะแนน] หรือ [คะแนน/วินาที] ได้ เช่น [2000] หรือ [1500/30]
    let text = head, points = 1000, time = 20;
    const tag = head.match(/\s*\[\s*(\d+)\s*(?:คะแนน)?\s*(?:\/\s*(\d+)\s*(?:วิ(?:นาที)?|s)?)?\s*\]\s*$/);
    if (tag) { text = head.slice(0, tag.index).trim(); points = Math.min(100000, +tag[1]); if (tag[2]) time = TIMES.reduce((a, t) => (Math.abs(t - tag[2]) < Math.abs(a - tag[2]) ? t : a), 20); }
    let correct = Math.max(0, opts.findIndex((o) => o.startsWith('*')));
    const choices = opts.slice(0, 4).map((o) => o.replace(/^\*+\s*/, ''));
    if (correct > 3) correct = 0;
    const tf = choices.length === 2 && /^(ถูก|จริง|true)$/i.test(choices[0]) && /^(ผิด|เท็จ|false)$/i.test(choices[1]);
    while (choices.length < 4) choices.push('');
    return { ...blankQ(), type: tf ? 'tf' : 'mc', text, choices, correct, points, time };
  });
  if (!out.length) return toast('ไม่พบคำถาม — ตรวจรูปแบบอีกครั้ง');
  if (ed.questions.length === 1 && !ed.questions[0].text.trim()) ed.questions = [];
  ed.questions.push(...out); cq = ed.questions.length - out.length;
  save(); renderQList(); renderQForm(); $('#bulkDlg').close(); toast(`เพิ่ม ${out.length} ข้อแล้ว ✓`);
};

/* ───────────── เชื่อมต่อ ───────────── */
let DB = null;
const dbReady = connect({ host: true }).then((d) => {
  DB = d;
  $('#modeBadge').innerHTML = d.mode === 'firebase' ? '🟢 ออนไลน์' : '🟡 โหมดทดลอง — เปิดหลายแท็บในเครื่องนี้';
  d.onUser(onUser);
  return d;
}).catch((e) => {
  console.error(e);
  $('#modeBadge').textContent = '🔴 เชื่อมต่อไม่ได้';
  document.documentElement.classList.remove('gc-wait');
  toast('เชื่อมต่อ Firebase ไม่ได้ — ตรวจ js/config.js และเปิด Anonymous Auth', 6000);
});

/* ───────────── ล็อกอินครู ───────────── */
let authed = '';
async function onUser(u) {
  if (u && isTeacher(u)) {
    if (authed === u.uid) return;
    authed = u.uid;
    $('#who').textContent = u.email;
    $('#loginMsg').textContent = 'กำลังโหลดชุดคำถาม…';
    try { await loadBank(u.uid); } catch (e) { console.error(e); document.documentElement.classList.remove('gc-wait'); $('#loginMsg').textContent = 'โหลดชุดคำถามไม่ได้ — ลองรีเฟรช'; return; }
    renderHome(); show('home'); document.documentElement.classList.remove('gc-wait');
    return;
  }
  authed = ''; quizzes = []; bankPath = '';
  if (phase) leave();
  show('login'); document.documentElement.classList.remove('gc-wait');
  const wrong = u && !u.isAnonymous;
  $('#loginMsg').innerHTML = wrong ? `⛔ อีเมล <b>${esc(u.email)}</b> ไม่มีสิทธิ์เข้าหน้าครู` : '';
  $('#loginBtn').hidden = !!wrong;
  $('#switchBtn').hidden = !wrong;
}
$('#loginBtn').onclick = async () => {
  if (!(await dbReady)) return;
  $('#loginMsg').textContent = '';
  try { await DB.signIn(); } catch (e) {
    console.error(e);
    $('#loginMsg').textContent = e.code === 'auth/popup-blocked' ? 'เบราว์เซอร์บล็อกหน้าต่างล็อกอิน — อนุญาตป๊อปอัปแล้วลองใหม่' : e.code === 'auth/popup-closed-by-user' ? '' : 'ล็อกอินไม่สำเร็จ ลองใหม่อีกครั้ง';
  }
};
$('#switchBtn').onclick = () => DB.signOut();
$('#logoutBtn').onclick = async () => { if (confirm('ออกจากระบบ?')) await DB.signOut(); };

/* ───────────── โฮสต์เกม ───────────── */
let R = '', pin = '', quiz = null, order = [], qi = -1, phase = '', players = {};
let opts = { showQ: true, streak: true, shuffle: false, mode: 'classic', teams: 2, hearts: 3, vteams: 4, ltime: 3, lsize: 'M', boss: 'dragon', bossLv: 'normal' };
let bossSt = null, rocketG = 0; // สถานะบอส / ระยะถึงดวงจันทร์ของเกมนี้
let gstats = {}, qstats = []; // สถิติสะสมรายคน / รายข้อ (ทำรางวัลพิเศษ + สรุปห้อง)
/* ───── ปรับแต่งเกม / หน้าจอแสดงผล (จำไว้ในเครื่องครู) ───── */
let disp = { randPts: false, qsize: 'm', strip: true, cheer: true, fx: true };
try { disp = { ...disp, ...JSON.parse(localStorage.getItem('gc_disp') || '{}') }; } catch {}
const saveDisp = () => { try { localStorage.setItem('gc_disp', JSON.stringify(disp)); } catch {} applyDisp(); };
function applyDisp() {
  document.body.classList.remove('qs-m', 'qs-l', 'qs-xl'); document.body.classList.add('qs-' + disp.qsize);
  const b = document.getElementById('dispBtn'); if (b) b.textContent = disp.randPts ? '⚙️ ปรับแต่ง · 🎲' : '⚙️ ปรับแต่ง';
}
const fxConfetti = (...a) => disp.fx && confetti(...a);
// สุ่มตัวคูณคะแนน (น้ำหนัก: ×1 กับ ×2 บ่อยสุด ×5 นาน ๆ ที)
const ROLL = [[0.5, 10], [1, 32], [2, 32], [3, 18], [5, 8]];
const rollMult = () => { let x = Math.random() * ROLL.reduce((s, [, w]) => s + w, 0); for (const [m, w] of ROLL) if ((x -= w) < 0) return m; return 1; };
const MULT_TXT = { 0.5: '🐢 ครึ่งเดียว', 1: '🙂 คะแนนปกติ', 2: '✨ คูณ 2!', 3: '🔥 คูณ 3!', 5: '💎 แจ็กพอต คูณ 5!' };
let ptsNow = 1000, multNow = null;
// ผีน้อยเชียร์ (แถวล่างหน้าคำถาม)
let cheerSaid = '';
function cheer(msg, pose = 'cheer') {
  if (!disp.cheer || cheerSaid === msg) return; cheerSaid = msg;
  const c = $('#cheer'); if (!c) return;
  c.innerHTML = `<span class="ch-gh">${ghost(pose)}</span><span class="ch-bub">${msg}</span>`;
  c.classList.remove('say'); void c.offsetWidth; c.classList.add('say');
}
let land = null, landTeams = null;
let vstate = [], played = 0, gameStartAt = 0;
let joinHref = '';
let unsubs = [], tickH = null, qStart = 0, liveAnswers = {}, lastReveal = null, prevRanks = {};

async function hostGame(q) {
  const bad = q.questions.map((x, i) => [i, qProblem(x)]).find(([, p]) => p);
  if (bad) { openEditor(q.id); cq = bad[0]; renderQList(); renderQForm(); return toast(`ข้อ ${bad[0] + 1}: ${bad[1]}`); }
  unlock();
  if (!(await dbReady)) return;
  quiz = structuredClone(q);
  do { pin = String(100000 + Math.floor(Math.random() * 900000)); } while (await DB.get(`quiz/rooms/${pin}/meta`));
  R = `quiz/rooms/${pin}`;
  await DB.set(R, { meta: { hostUid: DB.uid, state: 'lobby', title: quiz.title, total: quiz.questions.length, qIndex: -1, createdAt: TS, showQ: true, anon: $('#optAnon').checked, theme: savedTheme() } });
  qi = -1; phase = 'lobby'; players = {}; prevRanks = {};
  const url = new URL('play.html', location.href);
  url.searchParams.set('pin', pin);
  if (DB.mode === 'local' && new URLSearchParams(location.search).has('local')) url.searchParams.set('local', '1');
  $('#joinUrl').textContent = url.host + url.pathname.replace(/\/[^/]*$/, '/play.html');
  $('#pinBig').textContent = pin.replace(/(\d{3})(\d{3})/, '$1 $2');
  $('#pinSmall').textContent = pin;
  $('#qr').innerHTML = '';
  joinHref = url.href;
  if (window.QRCode) new QRCode($('#qr'), { text: url.href, width: 168, height: 168, colorDark: '#2B2350', colorLight: '#ffffff' });
  opts.mode = 'classic'; renderModes();
  $('#crowd').innerHTML = '';
  show('lobby');
  music('lobby'); $('#musicBtn').classList.add('on');
  unsubs.push(DB.on(R + '/players', (v) => { players = v || {}; onPlayers(); }));
}

const active = () => Object.entries(players).filter(([, p]) => p && p.name);
const isAlive = (p) => opts.mode !== 'survival' || (p.hearts ?? opts.hearts) > 0;

/* ───── QR ขยาย ───── */
$('#qr').onclick = () => {
  $('#qrBigImg').innerHTML = '';
  const size = Math.floor(Math.min(innerWidth * 0.55, innerHeight * 0.78));
  if (window.QRCode) new QRCode($('#qrBigImg'), { text: joinHref, width: size, height: size, colorDark: '#2B2350', colorLight: '#ffffff' });
  $('#qrBigUrl').textContent = $('#joinUrl').textContent;
  $('#qrBigPin').textContent = $('#pinBig').textContent;
  $('#qrBig').hidden = false; sfx.whoosh();
};
const closeQr = () => ($('#qrBig').hidden = true);
$('#qrClose').onclick = closeQr;
$('#qrBig').onclick = (e) => e.target === $('#qrBig') && closeQr();
addEventListener('keydown', (e) => e.key === 'Escape' && closeQr());

/* ───── โหมดเกม ───── */
function renderModes() {
  $('#modes').innerHTML = Object.entries(MODES).map(([k, m], i) => `<button class="mode ${opts.mode === k ? 'on' : ''}" data-m="${k}" style="--mc:${MODE_COLOR[k] || '#9B7BFF'};--i:${i}" title="${m.desc}"><span class="mi">${m.icon}</span><b>${m.name}</b></button>`).join('');
  const M = MODES[opts.mode];
  $('#modeDesc').innerHTML = `<span class="md-i" style="--mc:${MODE_COLOR[opts.mode] || '#9B7BFF'}">${M.icon}</span><span><b>${M.name}</b> ${M.desc}</span>`;
  $$('.lobby-bar .tog:not(.anon-tog)').forEach((t) => (t.style.display = opts.mode === 'land' ? 'none' : ''));
  const landDim = () => { const d = boardDims(active().length, opts.ltime, opts.lsize); return `${d.cols}×${d.rows} = ${d.cols * d.rows} ช่อง`; };
  $('#modeOpt').innerHTML = opts.mode === 'land'
    ? `<span>จำนวนฝั่ง</span>${[2, 3, 4].map((n) => `<button class="chip ${opts.teams === n ? 'on' : ''}" data-t="${n}">${n} ฝั่ง</button>`).join('')}<button class="chip" data-shuffle="1">🎲 สุ่มฝั่งใหม่</button>
       <span class="mo-br"></span><span>⏱ เวลา</span>${LAND_TIMES.map((n) => `<button class="chip ${opts.ltime === n ? 'on' : ''}" data-lt="${n}">${n} นาที</button>`).join('')}
       <span class="mo-br"></span><span>🗺️ สนาม</span>${Object.entries(LAND_SIZES).map(([k, [l]]) => `<button class="chip ${opts.lsize === k ? 'on' : ''}" data-ls="${k}">${l}</button>`).join('')}<small class="mo-dim" id="landDim">${landDim()}</small>`
    : opts.mode === 'team'
    ? `<span>จำนวนทีม</span>${[2, 3, 4].map((n) => `<button class="chip ${opts.teams === n ? 'on' : ''}" data-t="${n}">${n} ทีม</button>`).join('')}<button class="chip" data-shuffle="1">🔀 สุ่มทีมใหม่</button>`
    : opts.mode === 'vote'
      ? `<span>จำนวนทีม (นักเรียนใส่เลขทีมเอง)</span>${[2, 3, 4, 5, 6, 7, 8].map((n) => `<button class="chip ${opts.vteams === n ? 'on' : ''}" data-vt="${n}">${n}</button>`).join('')}`
    : opts.mode === 'survival'
      ? `<span>หัวใจเริ่มต้น</span>${[1, 2, 3, 5].map((n) => `<button class="chip ${opts.hearts === n ? 'on' : ''}" data-h="${n}">${n} ❤️</button>`).join('')}`
    : opts.mode === 'boss'
      ? `<span>บอส</span>${Object.entries(BOSSES).map(([k, b]) => `<button class="chip ${opts.boss === k ? 'on' : ''}" data-bk="${k}">${b.e} ${b.name}</button>`).join('')}
         <span class="mo-br"></span><span>ความยาก</span>${Object.entries(BOSS_LV).map(([k, l]) => `<button class="chip ${opts.bossLv === k ? 'on' : ''}" data-bl="${k}">${l.label}</button>`).join('')}
         <small class="mo-dim">เลือดบอส ≈ ${bossHP(active().length, quiz?.questions?.length || 1, opts.bossLv).toLocaleString('th-TH')} · ตอบผิด บอสฟื้น +${BOSS_HEAL} · โจทย์ขึ้นบนมือถือ · เดินเกมอัตโนมัติ ครูไม่ต้องกด</small>`
    : opts.mode === 'wager'
      ? `<small class="mo-dim">🎰 เดิมพันได้ ${WAGER_BETS.map((b) => b.toLocaleString('th-TH')).join(' / ')} · ข้อคะแนน x2 ได้-เสียคูณ 2 · ไม่มีโบนัสตอบติดกัน</small>`
    : opts.mode === 'rocket'
      ? `<small class="mo-dim">🌙 ระยะถึงดวงจันทร์ ${rocketGoal(quiz?.questions?.length || 1).toLocaleString('th-TH')} คะแนน · ถึงก่อนจบเกมทันที</small>`
      : '';
  renderTeamSum();
}
$('#modes').onclick = (e) => {
  const b = e.target.closest('[data-m]'); if (!b || opts.mode === b.dataset.m) return;
  opts.mode = b.dataset.m; sfx.tap(); renderModes(); pushMode(true);
};
$('#modeOpt').onclick = (e) => {
  const t = e.target.closest('[data-t]'), h = e.target.closest('[data-h]'), sh = e.target.closest('[data-shuffle]'), vt = e.target.closest('[data-vt]');
  const lt = e.target.closest('[data-lt]'), ls = e.target.closest('[data-ls]');
  const bk = e.target.closest('[data-bk]'), bl = e.target.closest('[data-bl]');
  if (bk) { opts.boss = bk.dataset.bk; sfx.tap(); renderModes(); }
  if (bl) { opts.bossLv = bl.dataset.bl; sfx.tap(); renderModes(); }
  if (lt) { opts.ltime = +lt.dataset.lt; renderModes(); pushMode(false); }
  if (ls) { opts.lsize = ls.dataset.ls; renderModes(); pushMode(false); }
  if (vt) { opts.vteams = +vt.dataset.vt; renderModes(); pushMode(false); }
  if (t) { opts.teams = +t.dataset.t; renderModes(); pushMode(true); }
  if (h) { opts.hearts = +h.dataset.h; renderModes(); pushMode(false); }
  if (sh) { sfx.whoosh(); pushMode(true); }
};
async function pushMode(reshuffle) {
  await DB.update(R, { 'meta/mode': opts.mode, 'meta/teams': opts.teams, 'meta/hearts': opts.hearts, 'meta/vteams': opts.vteams });
  if (opts.mode === 'team' || opts.mode === 'land') assignTeams(reshuffle);
  renderCrowd(active());
}
function assignTeams(reshuffle = false) {
  if (opts.mode !== 'team' && opts.mode !== 'land') return;
  const list = active();
  const counts = Array(opts.teams).fill(0);
  if (!reshuffle) list.forEach(([, p]) => p.team != null && p.team < opts.teams && counts[p.team]++);
  let todo = reshuffle ? list : list.filter(([, p]) => p.team == null || p.team >= opts.teams);
  if (reshuffle) todo = [...todo].sort(() => Math.random() - 0.5);
  const upd = {};
  todo.forEach(([u]) => { const t = counts.indexOf(Math.min(...counts)); counts[t]++; upd[`players/${u}/team`] = t; });
  if (Object.keys(upd).length) DB.update(R, upd);
}
const teamKey = (p) => (opts.mode === 'team' || opts.mode === 'land' ? p.team : opts.mode === 'vote' ? p.vteam : null);
function renderTeamSum() {
  const el = $('#teamSum'); if (!el) return;
  if (opts.mode !== 'team' && opts.mode !== 'vote' && opts.mode !== 'land') { el.innerHTML = ''; return; }
  const N = opts.mode === 'vote' ? opts.vteams : opts.teams;
  const c = Array(N).fill(0); let none = 0;
  active().forEach(([, p]) => { const k = teamKey(p); k != null && k < N ? c[k]++ : none++; });
  el.innerHTML = c.map((n, k) => { const I = teamInfo(opts.mode, k); return `<span style="--tc:${I.c}">${opts.mode === 'vote' ? I.name : I.e} · ${n}</span>`; }).join('') +
    (opts.mode === 'vote' && none ? `<span style="--tc:#8A84A8">ยังไม่เลือกทีม · ${none}</span>` : '');
}
function onPlayers() {
  const list = active();
  $('#pCount').textContent = list.length;
  $('#startBtn').disabled = !list.length;
  $('#hallEmpty').hidden = list.length > 0;
  if ((opts.mode === 'team' || opts.mode === 'land') && phase) assignTeams(false);
  if (phase === 'lobby') { renderCrowd(list); renderTeamSum(); const d = $('#landDim'); if (d && opts.mode === 'land') { const x = boardDims(list.length, opts.ltime, opts.lsize); d.textContent = `${x.cols}×${x.rows} = ${x.cols * x.rows} ช่อง`; } }
  if (phase === 'land') land?.onPlayers();
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
    const tag = n.querySelector('.tag');
    tag.textContent = p.name;
    const tk = teamKey(p);
    const tm = tk != null ? teamInfo(opts.mode, tk) : null;
    tag.style.background = tm ? tm.c : ''; tag.style.color = tm ? '#fff' : '';
    tag.textContent = opts.mode === 'vote' ? `${tm ? tm.e + ' ' : '❔ '}${p.name}` : p.name;
    n.style.order = tm ? tk : 99;
    n.classList.toggle('off', p.online === false);
  }
  $$('.buddy', crowd).forEach((n) => !seen.has(n.dataset.uid) && n.remove());
}
$('#crowd').onclick = (e) => {
  const b = e.target.closest('.buddy'); if (!b) return;
  const p = players[b.dataset.uid];
  if (p && confirm(`นำ “${p.name}” ออกจากห้อง?`)) DB.remove(`${R}/players/${b.dataset.uid}`);
};
const pickTheme = () => openThemePicker((id) => { syncMusic(); if (R && phase !== '') DB.update(R, { 'meta/theme': id }).catch(() => {}); });
$('#musicPick').onclick = () => openMusicPicker({ preview: 'lobby' }); $('#musicPickHome').onclick = () => openMusicPicker({ preview: 'lobby' });
$('#themeBtn').onclick = pickTheme; $('#themeBtnHome').onclick = () => openThemePicker(() => syncMusic(), { note: 'ใช้กับเกมถัดไป นักเรียนจะเห็นธีมเดียวกันบนมือถือ · 🎵 เพลงเปลี่ยนตามธีม (เลือกเพลงเองได้ที่ปุ่ม 🎼)' });
$('#musicBtn').onclick = () => { const on = !musicOn(); music(on ? 'lobby' : null); $('#musicBtn').classList.toggle('on', on); };
$('#lobbyCancel').onclick = async () => { if (confirm('ยกเลิกห้องนี้?')) { await DB.update(R, { 'meta/state': 'end', 'meta/cancelled': true }); leave(); } };
$('#muteBtn').onclick = () => { setMuted(!isMuted()); $('#muteBtn').textContent = isMuted() ? '🔇' : '🔊'; };
$('#endGameBtn').onclick = () => { if (phase === 'land' && land) { if (landTeams || confirm('จบเกมยึดพื้นที่ตอนนี้?')) land.end(); return; } if (confirm('จบเกมตอนนี้และแสดงผลสรุป?')) finish(); };

function leave() {
  unsubs.forEach((u) => u && u()); unsubs = []; clearInterval(tickH); music(null);
  land?.destroy(); land = null; landTeams = null;
  phase = ''; renderHome(); show('home');
}

// โหมดไม่ระบุตัวตน: เขียนลงห้องทันที นักเรียนที่กำลังจะเข้าจะข้ามหน้าใส่เลขประจำตัว
$('#dispBtn').onclick = () => {
  const d = $('#dispDlg');
  $$('#dispDlg [data-d]').forEach((i) => (i.checked = !!disp[i.dataset.d]));
  $$('#dpSize [data-qs]').forEach((b) => b.classList.toggle('on', b.dataset.qs === disp.qsize));
  d.showModal();
};
$('#dispDlg').onchange = (e) => { const i = e.target.closest('[data-d]'); if (!i) return; disp[i.dataset.d] = i.checked; sfx.tap(); saveDisp(); };
$('#dpSize').onclick = (e) => { const b = e.target.closest('[data-qs]'); if (!b) return; disp.qsize = b.dataset.qs; sfx.tap(); $$('#dpSize [data-qs]').forEach((x) => x.classList.toggle('on', x === b)); saveDisp(); };
$('#dispClose').onclick = () => $('#dispDlg').close();
applyDisp();
$('#optAnon').onchange = (e) => { if (R) DB.update(R, { 'meta/anon': e.target.checked }).catch(() => {}); };
$('#startBtn').onclick = async () => {
  opts = { ...opts, showQ: $('#optShowQ').checked, streak: $('#optStreak').checked, shuffle: $('#optShuffle').checked };
  order = quiz.questions.map((_, i) => i);
  if (opts.shuffle) order.sort(() => Math.random() - 0.5);
  const up = { 'meta/showQ': opts.showQ, 'meta/streak': opts.streak, 'meta/mode': opts.mode, 'meta/teams': opts.teams, 'meta/hearts': opts.hearts, 'meta/vteams': opts.vteams };
  if (opts.mode === 'survival') active().forEach(([u]) => { up[`players/${u}/hearts`] = opts.hearts; up[`players/${u}/outAt`] = null; });
  bossSt = null; rocketG = 0; gstats = {}; qstats = [];
  if (opts.mode === 'boss') { const hp = bossHP(active().length, order.length, opts.bossLv); bossSt = { kind: opts.boss, name: BOSSES[opts.boss].name, hp, max: hp }; }
  if (opts.mode === 'rocket') rocketG = rocketGoal(order.length);
  opts.randPts = !!disp.randPts && opts.mode !== 'land';
  if (opts.mode === 'boss') { opts.showQ = true; up['meta/showQ'] = true; }
  if (opts.mode === 'wager') active().forEach(([u]) => { up[`players/${u}/score`] = WAGER_START; });
  up['meta/boss'] = bossSt; up['meta/goal'] = rocketG || null;
  await DB.update(R, up);
  if (opts.mode === 'team') assignTeams(false);
  if (opts.mode === 'land') {
    await DB.update(R, { 'meta/ltime': opts.ltime, 'meta/lsize': opts.lsize });
    assignTeams(false);
    closeQr(); music(null);
    played = 0; gameStartAt = Date.now(); landTeams = null;
    phase = 'land';
    $('#qCounter').textContent = `🗺️ ยึดพื้นที่ · ${opts.teams} ฝั่ง · ${opts.ltime} นาที`;
    show('game');
    land = startLand({ DB, R, quiz, opts, stage, players: () => players, active, finish: () => finish(), onOver: (t, n) => { landTeams = t; played = n; } });
    return;
  }
  if (opts.mode === 'vote') {
    const none = active().filter(([, p]) => p.vteam == null).map(([, p]) => p.name);
    if (none.length && !confirm(`ยังไม่เลือกทีม ${none.length} คน: ${none.join(', ')}\nเริ่มเลยไหม? (คนที่ไม่มีทีมจะไม่ได้คะแนน)`)) return;
    vstate = Array.from({ length: opts.vteams }, () => ({ score: 0, streak: 0, correct: 0 }));
  }
  closeQr();
  music(null);
  played = 0; gameStartAt = Date.now();
  show('game');
  goQuestion(0);
};

const Q = () => quiz.questions[order[qi]];
const stage = () => $('#stage');

async function goQuestion(i) {
  qi = i; phase = 'ready';
  const q = Q();
  const spin = !!opts.randPts && q.points > 0;
  multNow = spin ? rollMult() : null; ptsNow = Math.round(q.points * (multNow ?? 1));
  $('#qCounter').textContent = `ข้อ ${i + 1} / ${order.length}`;
  await DB.update(R, {
    current: { idx: i, text: q.text, image: q.image || '', type: q.type, choices: q.choices.slice(0, nCh(q)), time: q.time, points: ptsNow, mult: multNow },
    'meta/state': 'ready', 'meta/qIndex': i, 'meta/qStartAt': null,
  });
  const MS = [0.5, 1, 2, 3, 5], reel = [...Array(3)].flatMap(() => MS).concat(MS.slice(0, MS.indexOf(multNow ?? 1) + 1));
  const dur = spin ? 6000 : 4000;
  const slotHtml = spin ? `<div class="slot"><span class="sl-l">🎲 สุ่มคะแนน</span><div class="sl-win"><div class="reel" style="--k:${reel.length - 1}">${reel.map((m) => `<b class="m${String(m).replace('.', '')}">×${m}</b>`).join('')}</div></div><span class="sl-res" id="slRes">${MULT_TXT[multNow]}</span></div>` : '';
  if (opts.mode === 'boss' && bossSt) stage().innerHTML = arenaHtml('ready', { i, slotHtml, dur });
  else stage().innerHTML = `
    <div class="ready ${spin ? 'spin' : ''}">
      <div class="ready-num">ข้อ ${i + 1}</div>
      ${spin ? `<div class="slot"><span class="sl-l">🎲 สุ่มคะแนน</span><div class="sl-win"><div class="reel" style="--k:${reel.length - 1}">${reel.map((m) => `<b class="m${String(m).replace('.', '')}">×${m}</b>`).join('')}</div></div><span class="sl-res" id="slRes">${MULT_TXT[multNow]}</span></div>`
        : q.points >= 2000 ? `<div class="bonus-badge">⭐ คะแนน x${q.points / 1000}</div>` : q.points === 0 ? '<div class="bonus-badge muted-badge">ข้อนี้ไม่คิดคะแนน</div>' : ''}
      <h1 class="ready-q">${esc(q.text)}</h1>
      <div class="ready-bar"><i style="animation-duration:${dur / 1000}s"></i></div>
    </div>`;
  sfx.whoosh();
  if (spin) {
    [0, 1, 2, 3, 4, 5, 6, 7, 8].forEach((k) => setTimeout(() => phase === 'ready' && qi === i && sfx.tap(), 150 + k * k * 22));
    setTimeout(() => { if (phase !== 'ready' || qi !== i) return; $('.slot')?.classList.add('landed'); multNow >= 3 ? (sfx.fanfare(), fxConfetti(multNow >= 5 ? 160 : 70, 2500)) : multNow >= 2 ? sfx.first() : sfx.pop(); }, 2300);
  }
  [3, 2, 1].forEach((n, k) => setTimeout(() => phase === 'ready' && qi === i && sfx.count(n), dur - 3000 + 1000 * k));
  await wait(dur);
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
  bossLive = { seen: new Set(), hp: bossSt?.hp || 0, q: [], busy: false };
  if (opts.mode === 'boss' && bossSt) stage().innerHTML = arenaHtml('question', { q });
  else stage().innerHTML = `
    <div class="qscreen">
      <h1 class="q-title">${esc(q.text)}</h1>
      <div class="q-mid">
        <div class="timer"><svg viewBox="0 0 100 100"><circle class="trk" cx="50" cy="50" r="44"/><circle class="arc" id="arc" cx="50" cy="50" r="44" pathLength="100"/></svg><span id="tNum">${q.time}</span></div>
        <div class="q-media">${q.image ? `<img src="${esc(q.image)}" alt="">` : `<div class="q-ph">${ptsNow >= 2000 ? '⭐ x' + ptsNow / 1000 : '🤔'}</div>`}</div>
        <div class="ans-count"><b id="aNum">0</b><span>ตอบแล้ว</span><small id="aOf"></small></div>
      </div>
      <div class="ans-grid n${nCh(q)}">${q.choices.slice(0, nCh(q)).map((c, k) => `<div class="ans a${k}"><span class="shape">${SHAPES[k]}</span><span>${esc(c)}</span></div>`).join('')}</div>
      <div class="q-tools">${disp.cheer ? '<div class="cheer" id="cheer"></div>' : ''}${disp.strip ? '<div class="ans-strip" id="ansStrip"></div>' : '<span class="sp"></span>'}<div class="team-prog" id="teamProg"></div>${multNow != null ? `<span class="mult-chip m${String(multNow).replace('.', '')}">🎲 ×${multNow}</span>` : ''}<button class="btn ghost sm" id="skipBtn">ข้ามเวลา ⏭</button></div>
    </div>`;
  $('#skipBtn').onclick = endQuestion;
  cheerSaid = ''; cheer(['สู้ ๆ นะทุกคน! 💪', 'ค่อย ๆ อ่านโจทย์นะ 📖', 'ลุยเลย! 🚀', 'ตั้งใจนะ เป็นกำลังใจให้ 💖'][Math.floor(Math.random() * 4)], 'cheer');
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
      if (sec === 5) cheer('อีก 5 วิ! รีบหน่อย 🔥', 'bell');
      else if (sec === Math.ceil(q.time / 2) && q.time >= 10) cheer('ครึ่งเวลาแล้วนะ ⏳', 'search');
    }
    if (left <= 0) endQuestion();
  }, 100);
  q._ua = ua;
}

function updateAnswerCount() {
  if (phase !== 'question') return;
  const n = Object.keys(liveAnswers).filter((u) => players[u] && isAlive(players[u])).length;
  const total = active().filter(([, p]) => p.online !== false && isAlive(p)).length;
  const a = $('#aNum'); if (a) a.textContent = n;
  const o = $('#aOf'); if (o) o.textContent = `จาก ${total} คน`;
  const st = $('#ansStrip');
  if (st) for (const u of Object.keys(liveAnswers)) {
    if (!players[u] || st.querySelector(`[data-u="${u}"]`)) continue;
    const el = document.createElement('span'); el.dataset.u = u; el.title = players[u].name;
    el.innerHTML = renderAvatar(players[u].avatar, { bg: false }); st.append(el);
    if (st.childElementCount > 36) st.firstElementChild.remove();
  }
  if (opts.mode === 'boss' && bossSt) bossLiveTick();
  if (total > 1 && n >= total) cheer('ตอบครบทุกคนแล้ว เก่งมาก! 🎉', 'love');
  else if (total >= 4 && n >= Math.ceil(total / 2)) cheer(`ตอบไปแล้ว ${n} คน ใครยังไม่ตอบรีบเลย! ⚡`, 'game');
  const tp = $('#teamProg');
  if (tp && opts.mode === 'vote') tp.innerHTML = Array.from({ length: opts.vteams }, (_, k) => {
    const mem = active().filter(([, p]) => p.vteam === k);
    const I = teamInfo('vote', k);
    return mem.length ? `<span style="--tc:${I.c}">${I.name} ${mem.filter(([u]) => liveAnswers[u]).length}/${mem.length}</span>` : '';
  }).join('');
  if (total > 0 && n >= total) endQuestion();
}

async function endQuestion() {
  if (phase !== 'question') return;
  phase = 'scoring';
  clearInterval(tickH);
  music(null); sfx.timeUp();
  const q = { ...Q(), points: ptsNow };
  q._ua && q._ua();
  await wait(500); // รอคำตอบที่กำลังส่งมา
  const answers = (await DB.get(`${R}/answers/${qi}`)) || {};
  const T = q.time * 1000;
  const before = sortPlayers(rankScores(players), opts.mode);
  before.forEach((p, i) => (prevRanks[p.uid] = i + 1));

  const res = {};
  const surv = opts.mode === 'survival';
  for (const [uid, p] of active()) {
    const alive = isAlive(p);
    const a = alive ? answers[uid] : null;
    const answered = !!a && a.at - qStart <= T + 1500;
    const correct = answered && a.choice === q.correct;
    const ms = answered ? Math.min(T, Math.max(0, a.at - qStart)) : null;
    const gained = correct ? Math.round(q.points * (1 - ms / T / 2)) : 0;
    const streak = correct ? (p.streak || 0) + 1 : alive ? 0 : (p.streak || 0);
    const bonus = correct && opts.streak && q.points > 0 && streak >= 2 ? Math.min((streak - 1) * 100, 500) : 0;
    res[uid] = { answered, correct, choice: answered ? a.choice : null, ms, gained, bonus, streak, alive,
      score: (p.score || 0) + gained + bonus, correctCount: (p.correct || 0) + (correct ? 1 : 0) };
    if (surv) res[uid].hearts = p.hearts ?? opts.hearts;
    if (p.team != null) res[uid].team = p.team;
    if (opts.mode === 'wager') {
      // ถูกได้ 2 เท่าของเดิมพัน · ผิดเสียเดิมพัน (ไม่ติดลบ) · ไม่ตอบไม่เสีย
      const mult = q.points / 1000, bet = answered ? wagerOf(a.bet) : 0;
      const win = correct ? Math.round(bet * 2 * mult) : 0, lose = answered && !correct ? Math.min(p.score || 0, Math.round(bet * mult)) : 0;
      Object.assign(res[uid], { bet, gained: win, bonus: 0, lose, score: (p.score || 0) + win - lose });
    }
  }
  let bossRes = null;
  if (opts.mode === 'boss' && bossSt) {
    const H = Math.round(BOSS_HEAL * q.points / 1000), V = Object.values(res);
    for (const r of V) { r.dmg = r.correct ? r.gained + r.bonus : 0; r.healed = r.correct ? 0 : r.answered ? H : Math.round(H / 2); }
    const dmg = V.reduce((s, r) => s + r.dmg, 0), heal = V.reduce((s, r) => s + r.healed, 0);
    const before = bossSt.hp;
    // โจมตีก่อน ถ้าเลือดหมดในข้อนี้ = แพ้ทันที (ฟื้นไม่ได้แล้ว)
    bossSt.hp = before - dmg <= 0 ? 0 : Math.min(bossSt.max, before - dmg + heal);
    bossRes = { before, after: bossSt.hp, max: bossSt.max, dmg, heal, hits: V.filter((r) => r.correct).length, wrong: V.filter((r) => r.answered && !r.correct).length, none: V.filter((r) => !r.answered).length };
    for (const r of V) r.boss = { hp: bossSt.hp, max: bossSt.max };
  }
  if (opts.mode === 'rocket') for (const r of Object.values(res)) r.goal = rocketG;
  let vteamsRes = null;
  if (opts.mode === 'vote') {
    vteamsRes = [];
    for (const [u, p] of active()) if (p.vteam == null) Object.assign(res[u], { gained: 0, bonus: 0, score: p.score || 0, streak: 0 });
    for (let k = 0; k < opts.vteams; k++) {
      const mem = active().filter(([, p]) => p.vteam === k);
      const votes = mem.map(([u]) => res[u]).filter((r) => r.answered).map((r) => ({ choice: r.choice, at: r.ms }));
      const d = teamDecision(votes);
      const st = vstate[k] || (vstate[k] = { score: 0, streak: 0, correct: 0 });
      const correct = !!d && d.choice === q.correct;
      const gained = correct ? Math.round(q.points * (1 - d.at / T / 2)) : 0;
      st.streak = correct ? st.streak + 1 : 0;
      const bonus = correct && opts.streak && q.points > 0 && st.streak >= 2 ? Math.min((st.streak - 1) * 100, 500) : 0;
      st.score += gained + bonus; if (correct) st.correct++;
      const t = { k, n: mem.length, score: st.score, gained: gained + bonus, decision: d ? d.choice : null, count: d ? d.count : 0, voted: votes.length, tie: !!d?.tie, correct, ms: d ? d.at : null };
      vteamsRes.push(t);
      for (const [u] of mem) Object.assign(res[u], { team: k, decision: t.decision, teamCorrect: correct, gained, bonus, score: st.score, streak: st.streak, count: t.count, voted: t.voted, tie: t.tie, teamMs: t.ms });
    }
    [...vteamsRes].sort((a, b) => b.score - a.score).forEach((t, i) => (t.rank = i + 1));
    const nT = vteamsRes.filter((t) => t.n > 0).length;
    for (const r of Object.values(res)) if (r.team != null) { const t = vteamsRes[r.team]; r.teamRank = t.rank; r.teamScore = t.score; r.teamsOf = nT; }
    vteamsRes = vteamsRes.filter((t) => t.n > 0 || t.score > 0);
  }
  let mercy = false;
  if (surv) {
    const live = Object.values(res).filter((r) => r.alive);
    mercy = live.length > 0 && live.every((r) => !r.correct);
    if (!mercy) for (const r of live) if (!r.correct) { r.hearts = Math.max(0, r.hearts - 1); r.lost = true; if (!r.hearts) r.outNow = true; }
  }
  const entries = Object.entries(res).map(([uid, r]) => ({ uid, name: players[uid].name, score: r.score, hearts: r.hearts, outAt: r.outNow ? qi : players[uid].outAt }));
  sortPlayers(entries, opts.mode);
  const upd = { 'meta/state': 'reveal', 'current/correct': q.correct };
  if (bossRes) upd['meta/boss/hp'] = bossSt.hp;
  entries.forEach((e, i) => {
    const r = res[e.uid];
    r.rank = i + 1; r.of = entries.length; r.mercy = mercy;
    const gap = i > 0 ? entries[i - 1].score - r.score : 0;
    r.ahead = gap > 0 ? { name: entries[i - 1].name, gap } : null;
    upd[`players/${e.uid}/score`] = r.score;
    upd[`players/${e.uid}/streak`] = r.streak;
    upd[`players/${e.uid}/correct`] = r.correctCount;
    upd[`players/${e.uid}/lastGain`] = r.gained + r.bonus;
    if (surv) { upd[`players/${e.uid}/hearts`] = r.hearts; if (r.outNow) upd[`players/${e.uid}/outAt`] = qi; }
  });
  let teams = vteamsRes;
  if (opts.mode === 'team') {
    teams = teamTable(Object.values(res), (r) => r.score, (r) => r.gained + r.bonus);
    for (const r of Object.values(res)) { const t = teams[r.team]; if (t) { r.teamRank = t.rank; r.teamScore = t.score; r.teamsOf = teams.length; } }
  }
  Object.entries(res).forEach(([uid, r]) => (upd[`results/${qi}/${uid}`] = r));
  await DB.update(R, upd);
  played = qi + 1;
  const qs = { n: qi + 1, text: q.text, ok: 0, ans: 0, tot: 0 };
  for (const [uid, r] of Object.entries(res)) {
    if (r.alive === false) continue;
    qs.tot++; if (r.answered) qs.ans++; if (r.correct) qs.ok++;
    const s = gstats[uid] || (gstats[uid] = { ok: 0, ans: 0, ms: 0, okMs: 0, best: 0, r0: r.rank });
    if (r.answered) { s.ans++; s.ms += r.ms || 0; }
    if (r.correct) { s.ok++; s.okMs += r.ms || 0; }
    if (opts.mode !== 'vote') s.best = Math.max(s.best, r.streak || 0);
  }
  qstats[qi] = qs;
  lastReveal = { res, answers, mercy, teams, boss: bossRes };
  phase = 'reveal';
  renderReveal();
}

function teamTable(members, scoreOf, gainOf = () => 0) {
  const t = TEAMS.slice(0, opts.teams).map((T, k) => {
    const m = members.filter((r) => r.team === k);
    const avg = (f) => (m.length ? Math.round(m.reduce((s, r) => s + f(r), 0) / m.length) : 0);
    return { k, n: m.length, score: avg(scoreOf), gained: avg(gainOf) };
  });
  [...t].sort((a, b) => b.score - a.score).forEach((x, i) => (x.rank = i + 1));
  return t;
}

function renderReveal() {
  if (opts.mode === 'boss' && bossSt && lastReveal.boss) return renderBossReveal();
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
      ${lastReveal.boss ? bossStrip(lastReveal.boss) : ''}
      <div class="bars n${n}" ${lastReveal.boss ? 'hidden' : ''}>${counts.map((c, k) => `
        <div class="bar a${k} ${k === q.correct ? 'right' : 'dim'}">
          <div class="bar-n">${c}</div>
          <div class="bar-col"><i style="--h:${Math.max(4, (c / max) * 100)}%"></i></div>
          <div class="bar-ico">${SHAPES[k]}${k === q.correct ? '<b>✓</b>' : ''}</div>
        </div>`).join('')}</div>
      <div class="ans-grid n${n} rev">${q.choices.slice(0, n).map((c, k) => `<div class="ans a${k} ${k === q.correct ? 'right' : 'dim'}"><span class="shape">${SHAPES[k]}</span><span>${esc(c)}</span>${k === q.correct ? '<span class="tick">✓</span>' : ''}</div>`).join('')}</div>
      ${opts.mode === 'vote' ? `<div class="vote-row">${lastReveal.teams.map((t) => { const I = teamInfo('vote', t.k); return `<span class="vchip ${t.correct ? 'ok' : 'no'}" style="--tc:${I.c}"><b>${I.name}</b>${t.decision != null ? `<i class="a${t.decision}">${SHAPES[t.decision]}</i>${t.count}/${t.voted} เสียง${t.tie ? ' ⚡' : ''}` : 'ไม่ได้ตอบ'}<em>${t.correct ? '✓' : '✗'}</em></span>`; }).join('')}</div>` : ''}
      <div class="rev-foot">
        <span class="pill">${opts.mode === 'vote' ? `ทีมตอบถูก <b>${lastReveal.teams.filter((t) => t.correct).length}/${lastReveal.teams.length}</b> ทีม` : `ตอบถูก <b>${nCorrect}/${totalP}</b> คน`}</span>
        ${opts.mode === 'survival' ? (lastReveal.mercy ? '<span class="pill">😅 ผิดหมดทุกคน — ข้อนี้ไม่เสียหัวใจ</span>' : `<span class="pill">💔 ตกรอบ <b>${Object.values(res).filter((r) => r.outNow).length}</b> · ยังรอด <b>${Object.values(res).filter((r) => r.hearts > 0).length}</b> คน</span>`) : ''}
        ${opts.mode === 'wager' ? (() => { const W = Object.values(res); const win = W.reduce((s, r) => s + r.gained, 0), lose = W.reduce((s, r) => s + (r.lose || 0), 0); return `<span class="pill">🎰 ได้รวม <b class="up">+${win.toLocaleString('th-TH')}</b> · เสียรวม <b class="down">−${lose.toLocaleString('th-TH')}</b></span>`; })() : ''}
        ${opts.mode === 'rocket' ? (() => { const t = Object.entries(res).sort((a, b) => b[1].score - a[1].score)[0]; return t ? `<span class="pill">🚀 นำอยู่: <b>${esc(players[t[0]]?.name)}</b> ${pctOf(t[1].score, rocketG)}% ถึงดวงจันทร์</span>` : ''; })() : ''}
        ${fastest && opts.mode !== 'vote' ? `<span class="pill">⚡ เร็วที่สุด: <b>${esc(players[fastest[0]]?.name)}</b> ${(fastest[1].ms / 1000).toFixed(1)} วิ</span>` : ''}
        <span class="sp"></span>
        <button class="btn gold big" id="toBoard">${isLast() ? '🎉 ประกาศผล ›' : 'ดูอันดับ ›'}</button>
      </div>
    </div>`;
  // ข้อสุดท้าย: ข้ามตารางอันดับ ไปลุ้นโพเดียมทีละอันดับเลย (ไม่ให้เห็นอันดับ 1 ก่อนประกาศ)
  $('#toBoard').onclick = () => (isLast() ? finish() : showBoard());
  setTimeout(() => $('.reveal')?.classList.remove('suspense'), 1100);
  const b = lastReveal.boss;
  if (b) setTimeout(() => {
    const st = $('.boss-strip'); if (!st) return;
    const pc = Math.max(0, Math.min(100, (b.after / b.max) * 100));
    st.querySelector('.hpbar i').style.width = pc + '%'; st.querySelector('.hpbar span').textContent = `❤️ ${Math.round(pc)}%`;
    st.querySelector('.hpbar').classList.toggle('low', pc <= 25);
    st.classList.add('go'); if (b.dmg) sfx.wrong(); if (b.after <= 0) { sfx.fanfare(); fxConfetti(160, 4000); }
  }, 1300);
}
/* ═════════ สนามบอส: จอใหญ่โชว์แค่บอส (นักเรียนอ่านโจทย์บนมือถือ) ═════════ */
let bossLive = { seen: new Set(), hp: 0, q: [], busy: false }, autoH = null;
const bossMood = (hp) => (hp <= 0 ? 'dizzy' : hp / bossSt.max <= 0.25 ? 'hurt' : 'normal');
const hpTxt = (hp) => `${Math.max(0, Math.round(hp)).toLocaleString('th-TH')} / ${bossSt.max.toLocaleString('th-TH')}`;
function arenaHtml(ph, o = {}) {
  const B = BOSSES[bossSt.kind], pc = Math.max(0, Math.min(100, (bossSt.hp / bossSt.max) * 100));
  const hp = `<div class="ar-top"><div class="ar-name">${B.e} ${esc(bossSt.name)}</div>
    <div class="ar-hp ${pc <= 25 ? 'low' : ''}" id="arHp"><i style="width:${pc}%"></i><b></b><span>❤️ ${hpTxt(bossSt.hp)}</span></div></div>`;
  const boss = `<div class="ar-stage"><div class="ar-aura"></div><div class="ar-boss ${pc <= 25 ? 'weak' : ''}" id="arBoss">${bossSVG(bossSt.kind, bossMood(bossSt.hp))}</div><div class="ar-fx" id="arFx"></div><div class="ar-ground"></div></div>`;
  if (ph === 'ready') return `<div class="arena ph-ready">${hp}
    <div class="ar-mid"><div class="ar-side"></div>${boss}<div class="ar-side"></div></div>
    <div class="ar-call"><span class="ar-qn">ข้อ ${o.i + 1}</span>${o.slotHtml || (ptsNow >= 2000 ? `<span class="ar-x">⭐ คะแนน x${ptsNow / 1000}</span>` : '')}<span class="ar-say">${['ข้อนี้ยากแน่! 😈', 'มาสิ! ข้าไม่กลัว 😤', 'ลองตีข้าดูสิ! 👊', 'ฮ่า ๆ ตอบไม่ได้หรอก 😜'][Math.floor(Math.random() * 4)]}</span></div>
    <div class="ar-hint">📱 ดูโจทย์บนมือถือ แล้วเตรียมโจมตี!</div>
    <div class="ready-bar"><i style="animation-duration:${o.dur / 1000}s"></i></div></div>`;
  const q = o.q;
  return `<div class="arena ph-q">${hp}
    <div class="ar-mid">
      <div class="ar-side"><div class="timer"><svg viewBox="0 0 100 100"><circle class="trk" cx="50" cy="50" r="44"/><circle class="arc" id="arc" cx="50" cy="50" r="44" pathLength="100"/></svg><span id="tNum">${q.time}</span></div></div>
      ${boss}
      <div class="ar-side"><div class="ans-count"><b id="aNum">0</b><span>ตอบแล้ว</span><small id="aOf"></small></div>
        <div class="ar-tally"><span>⚔️ <b id="arHit">0</b></span><span>💚 <b id="arHeal">0</b></span></div></div>
    </div>
    <div class="ar-hint">📱 อ่านโจทย์และตอบบนมือถือ · ตอบถูก = โจมตี ⚔️ · ตอบผิด = บอสฟื้นเลือด 💚</div>
    <div class="q-tools">${disp.cheer ? '<div class="cheer" id="cheer"></div>' : ''}${disp.strip ? '<div class="ans-strip" id="ansStrip"></div>' : '<span class="sp"></span>'}<div class="team-prog" id="teamProg"></div>${multNow != null ? `<span class="mult-chip m${String(multNow).replace('.', '')}">🎲 ×${multNow}</span>` : ''}<button class="btn ghost sm" id="skipBtn">ข้ามเวลา ⏭</button></div>
  </div>`;
}
function setArHp(hp) {
  const el = $('#arHp'); if (!el) return;
  const pc = Math.max(0, Math.min(100, (hp / bossSt.max) * 100));
  el.querySelector('i').style.width = pc + '%'; el.querySelector('span').textContent = `❤️ ${hpTxt(hp)}`;
  el.classList.toggle('low', pc <= 25); $('#arBoss')?.classList.toggle('weak', pc <= 25);
}
let moodH = null;
function setMood(m, ms = 0) {
  const b = $('#arBoss'); if (!b) return;
  b.innerHTML = bossSVG(bossSt.kind, m); clearTimeout(moodH);
  if (ms) moodH = setTimeout(() => { const x = $('#arBoss'); if (x) x.innerHTML = bossSVG(bossSt.kind, bossMood(bossLive.hp)); }, ms);
}
function fxNum(txt, cls) {
  const fx = $('#arFx'); if (!fx || fx.childElementCount > 40) return;
  const n = document.createElement('b'); n.className = 'ar-num ' + cls; n.textContent = txt;
  n.style.setProperty('--x', (Math.random() * 60 - 30).toFixed(0) + '%'); n.style.setProperty('--y', (Math.random() * 30 - 10).toFixed(0) + '%');
  fx.append(n); setTimeout(() => n.remove(), 1400);
}
// คนตอบถูก: ตัวละครพุ่งไปโจมตี · คนตอบผิด: บอสหัวเราะ ฟื้นเลือด (ทยอยเล่นทีละตัว ไม่ให้ซ้อนจนดูไม่ทัน)
function bossLiveTick() {
  const q = Q(), T = q.time * 1000, H = Math.round(BOSS_HEAL * ptsNow / 1000);
  for (const [u, a] of Object.entries(liveAnswers)) {
    if (bossLive.seen.has(u) || !players[u]) continue; bossLive.seen.add(u);
    const ms = Math.min(T, Math.max(0, (a.at || DB.now()) - qStart));
    bossLive.q.push(a.choice === q.correct ? { hit: Math.round(ptsNow * (1 - ms / T / 2)), u } : { heal: H });
  }
  if (!bossLive.busy) playBossFx();
}
function playBossFx() {
  const ev = bossLive.q.shift();
  if (!ev || phase !== 'question') { bossLive.busy = false; return; }
  bossLive.busy = true;
  const gap = Math.max(90, 420 - bossLive.q.length * 30);
  if (ev.hit) {
    const fx = $('#arFx');
    if (fx && fx.childElementCount < 40) {
      const p = document.createElement('span'); p.className = 'ar-proj';
      p.innerHTML = `${renderAvatar(players[ev.u]?.avatar, { bg: false })}<i>⚔️</i>`;
      p.style.setProperty('--sx', (Math.random() < 0.5 ? -1 : 1) * (180 + Math.random() * 220) + 'px');
      fx.append(p); setTimeout(() => p.remove(), 700);
    }
    setTimeout(() => {
      if (phase !== 'question' || bossLive.hp <= 0) return;
      bossLive.hp = Math.max(0, bossLive.hp - ev.hit);
      fxNum('−' + ev.hit.toLocaleString('th-TH'), 'dmg');
      const b = $('#arBoss'); if (b) { b.classList.remove('hit'); void b.offsetWidth; b.classList.add('hit'); }
      setMood(bossLive.hp <= 0 ? 'dizzy' : 'hurt', bossLive.hp <= 0 ? 0 : 380); setArHp(bossLive.hp); sfx.pop();
      const h = $('#arHit'); if (h) h.textContent = +h.textContent + 1;
      if (bossLive.hp <= 0) cheer('บอสใกล้หมดแรงแล้ว! 💥', 'cheer');
    }, 420);
  } else {
    if (bossLive.hp > 0) {
      bossLive.hp = Math.min(bossSt.max, bossLive.hp + ev.heal);
      fxNum('+' + ev.heal.toLocaleString('th-TH'), 'heal'); setMood('smug', 600); setArHp(bossLive.hp);
      const h = $('#arHeal'); if (h) h.textContent = +h.textContent + 1;
    }
  }
  setTimeout(playBossFx, gap);
}
function renderBossReveal() {
  const q = Q(), b = lastReveal.boss, n = nCh(q), B = BOSSES[bossSt.kind];
  const ko = b.after <= 0, net = b.before - b.after;
  sfx.reveal();
  stage().innerHTML = `<div class="arena ph-rev">
    <div class="ar-top"><div class="ar-name">${B.e} ${esc(bossSt.name)}</div>
      <div class="ar-hp" id="arHp"><i style="width:${Math.max(0, Math.min(100, (b.before / b.max) * 100))}%"></i><b></b><span>❤️ ${hpTxt(b.before)}</span></div></div>
    <div class="ar-mid"><div class="ar-side ar-sum">
        <div class="ar-chip hit">⚔️ ตอบถูก <b>${b.hits}</b> คน<small>โจมตี −${b.dmg.toLocaleString('th-TH')}</small></div>
        <div class="ar-chip heal">💚 ตอบผิด <b>${b.wrong}</b> คน${b.none ? ` · ไม่ตอบ ${b.none}` : ''}<small>${ko ? 'บอสแพ้ก่อนฟื้นทัน!' : `บอสฟื้น +${b.heal.toLocaleString('th-TH')}`}</small></div></div>
      <div class="ar-stage"><div class="ar-aura"></div><div class="ar-boss" id="arBoss">${bossSVG(bossSt.kind, 'normal')}</div><div class="ar-fx" id="arFx"></div><div class="ar-ground"></div></div>
      <div class="ar-side ar-sum"><div class="ar-net ${net > 0 ? 'down' : 'up'}">${ko ? '💥 K.O.!' : net > 0 ? `เลือดลด<br><b>−${net.toLocaleString('th-TH')}</b>` : net < 0 ? `บอสแข็งแรงขึ้น<br><b>+${(-net).toLocaleString('th-TH')}</b>` : 'เสมอตัว'}</div></div>
    </div>
    <div class="ar-answer"><span class="ans a${q.correct}"><span class="shape">${SHAPES[q.correct]}</span></span><span><small>เฉลย</small><b>${esc(q.choices[q.correct] ?? '')}</b></span></div>
    <div class="rev-foot"><span class="pill">🎯 ตอบถูก ${b.hits}/${b.hits + b.wrong + b.none} คน</span><span class="pill auto-next" id="autoNext"></span><button class="btn ghost sm" id="pauseBtn">⏸ หยุดชั่วคราว</button><span class="sp"></span><button class="btn gold big" id="toBoard">${isLast() ? (ko ? '🎉 ฉลองชัยชนะ ›' : '🎉 ประกาศผล ›') : 'ข้อต่อไปเลย ›'}</button></div>
  </div>`;
  // เดินเกมเอง: เฉลยค้างไว้สักครู่ แล้วไปข้อต่อไป/ประกาศผลอัตโนมัติ (ครูกดหยุดไว้อธิบายได้)
  const myQ = qi, last = isLast(), go = () => { clearInterval(autoH); if (phase === 'reveal' && qi === myQ) (last ? finish() : goQuestion(qi + 1)); };
  let left = ko ? 7 : 9, paused = false;
  const show = () => { const el = $('#autoNext'); if (el) el.innerHTML = paused ? '⏸ หยุดไว้อยู่' : `⏭ ${last ? 'ประกาศผล' : 'ข้อต่อไป'}ใน <b>${left}</b> วิ`; };
  clearInterval(autoH); show();
  autoH = setInterval(() => { if (phase !== 'reveal' || qi !== myQ) return clearInterval(autoH); if (paused) return; left--; show(); if (left <= 0) go(); }, 1000);
  $('#pauseBtn').onclick = () => { paused = !paused; $('#pauseBtn').textContent = paused ? '▶️ เล่นต่อ' : '⏸ หยุดชั่วคราว'; sfx.tap(); show(); };
  $('#toBoard').onclick = go;
  setTimeout(() => {
    if (phase !== 'reveal') return;
    setArHp(b.after); bossLive.hp = b.after;
    const bb = $('#arBoss');
    if (ko) { setMood('dizzy'); bb?.classList.add('ko'); sfx.fanfare(); fxConfetti(200, 5000); fxNum('K.O.!', 'dmg big'); }
    else if (net > 0) { setMood('hurt', 1500); bb?.classList.add('hit'); sfx.wrong(); fxNum('−' + net.toLocaleString('th-TH'), 'dmg big'); }
    else { setMood('smug', 1500); sfx.pop(); if (net < 0) fxNum('+' + (-net).toLocaleString('th-TH'), 'heal big'); }
  }, 900);
}
// แถบบอสตอนเฉลย: เลือดลดจากเดิม → ใหม่ พร้อมตัวเลขความเสียหาย
function bossStrip(b) {
  const B = BOSSES[bossSt.kind];
  return `<div class="boss-strip ${b.dmg ? 'hit' : ''} ${b.after <= 0 ? 'ko' : ''}">
    <div class="bs-boss">${bossSVG(bossSt.kind, b.after <= 0 ? 'dizzy' : b.dmg ? 'hurt' : 'smug')}${b.dmg ? `<b class="bs-dmg">−${b.dmg.toLocaleString('th-TH')}</b>` : ''}</div>
    <div class="bs-main"><div class="bs-name">${B.e} ${esc(bossSt.name)}</div>${hpBar(b.before, b.max)}
      <div class="bs-note">${b.after <= 0 ? '🎉 บอสหมดแรงแล้ว! ทั้งห้องชนะ!' : b.dmg ? `⚔️ ตอบถูก ${b.hits} คน โจมตีรวม ${b.dmg.toLocaleString('th-TH')}` : '🛡️ ไม่มีใครโจมตีโดน บอสหัวเราะคิกคัก'}</div></div>
  </div>`;
}

function isLast() {
  const res = lastReveal?.res || {};
  const aliveN = Object.values(res).filter((r) => r.hearts > 0).length;
  return qi >= order.length - 1 || (opts.mode === 'survival' && aliveN <= 1) || (opts.mode === 'boss' && bossSt && bossSt.hp <= 0)
    || (opts.mode === 'rocket' && rocketG > 0 && Object.values(res).some((r) => r.score >= rocketG));
}
// อันดับ: ค่อย ๆ เปิดจากอันดับ 5 → 1 บนจอครูก่อน แล้วจึงส่งให้มือถือนักเรียน
async function showBoard() {
  phase = 'board';
  const myQ = qi;
  await DB.update(R, { 'meta/state': 'board', 'meta/rankShown': -1 });
  const { res } = lastReveal;
  const top = Object.entries(res).sort((a, b) => a[1].rank - b[1].rank).slice(0, opts.mode === 'rocket' ? 8 : 5);
  const aliveN = Object.values(res).filter((r) => r.hearts > 0).length;
  const last = isLast();
  const outNow = Object.entries(res).filter(([, r]) => r.outNow).map(([u]) => esc(players[u]?.name));
  const teamHtml = () => {
    const ts = [...lastReveal.teams].sort((a, b) => a.rank - b.rank);
    const max = Math.max(1, ...ts.map((t) => t.score));
    const mvp = Object.entries(res).filter(([, r]) => r.gained + r.bonus > 0).sort((a, b) => (b[1].gained + b[1].bonus) - (a[1].gained + a[1].bonus))[0];
    return `<ol class="rank-list">${ts.map((t) => { const T = teamInfo(opts.mode, t.k); return `<li class="rk tb" style="--tc:${T.c}">
        <span class="rk-n">${t.rank}</span><span class="tb-e">${T.e}</span>
        <span class="tb-main"><span class="tb-name">${T.name} <small>${t.n} คน</small></span><span class="tb-track"><i style="--w:${Math.max(3, (t.score / max) * 100)}%"></i></span></span>
        ${t.gained > 0 ? `<span class="gain">+${t.gained.toLocaleString('th-TH')}</span>` : ''}
        <b class="rk-s" data-from="${t.score - t.gained}" data-to="${t.score}">${(t.score - t.gained).toLocaleString('th-TH')}</b></li>`; }).join('')}</ol>
      ${mvp && opts.mode === 'team' ? `<div class="mvp"><span class="pill">⭐ MVP ข้อนี้: <b>${esc(players[mvp[0]]?.name)}</b> +${(mvp[1].gained + mvp[1].bonus).toLocaleString('th-TH')}</span></div>` : ''}`;
  };
  stage().innerHTML = `
    <div class="board">
      <div class="board-sub">หลังข้อ ${qi + 1} จาก ${order.length} ข้อ</div>
      <h1 class="board-h">${opts.mode === 'team' || opts.mode === 'vote' ? '👥 คะแนนทีม' : opts.mode === 'survival' ? `❤️ ผู้รอดชีวิต ${aliveN} คน` : opts.mode === 'boss' ? '⚔️ นักรบตัวท็อป' : opts.mode === 'rocket' ? '🚀 แข่งจรวดไปดวงจันทร์' : opts.mode === 'wager' ? '🎰 อันดับเซียนเดิมพัน' : '🏆 อันดับคะแนน'}</h1>
      ${opts.mode === 'boss' && bossSt ? `<div class="boss-line">${bossSVG(bossSt.kind, bossSt.hp <= 0 ? 'dizzy' : 'normal')}<div><b>${BOSSES[bossSt.kind].e} ${esc(bossSt.name)}</b>${hpBar(bossSt.hp, bossSt.max)}</div></div>` : ''}
      <div class="board-grid"><div class="bg-main">
      ${opts.mode === 'team' || opts.mode === 'vote' ? teamHtml() : opts.mode === 'rocket' ? rocketHtml(top) : `<ol class="rank-list">${top.map(([uid, r]) => {
        const p = players[uid] || {};
        const mv = (prevRanks[uid] || r.rank) - r.rank;
        const g = r.gained + r.bonus - (r.lose || 0);
        const lead = Math.max(1, top[0]?.[1].score || 1);
        return `<li class="rk r${r.rank}">
          <span class="rk-n">${r.rank <= 3 ? ['🥇', '🥈', '🥉'][r.rank - 1] : r.rank}</span>
          <span class="rk-av">${renderAvatar(p.avatar)}</span>
          <span class="rk-mid"><span class="rk-name">${esc(p.name)} ${r.streak >= 2 ? `<span class="fire">🔥${r.streak}</span>` : ''}</span>
            <span class="rk-bar"><i style="--w:${Math.max(2, Math.round((Math.max(0, r.score) / lead) * 100))}%"></i></span></span>
          ${opts.mode === 'survival' ? `<span class="hp">${r.hearts > 0 ? hearts(r.hearts, opts.hearts) : '👻'}</span>` : ''}
          ${mv > 0 && qi > 0 ? `<span class="mv up">▲${mv}</span>` : mv < 0 && qi > 0 ? `<span class="mv down">▼${-mv}</span>` : ''}
          ${g ? `<span class="gain ${g < 0 ? 'neg' : ''}">${g > 0 ? '+' : '−'}${Math.abs(g).toLocaleString('th-TH')}</span>` : ''}
          <b class="rk-s" data-from="${r.score - g}" data-to="${r.score}">${(r.score - g).toLocaleString('th-TH')}</b>
        </li>`;
      }).join('')}</ol>
      ${outNow.length ? `<div class="out-line">👻 ตกรอบข้อนี้: ${outNow.join(', ')}</div>` : ''}`}
      ${othersHtml(top.length)}</div>${boardStats()}</div>
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
    if (k === 0) fxConfetti(80, 2500);
    await wait(k === 0 ? 1000 : 950);
  }
  if (!alive()) return;
  await DB.update(R, { 'meta/rankShown': myQ });
  $('#boardNote').textContent = '📱 ส่งอันดับไปที่มือถือนักเรียนแล้ว';
  $('#nextBtn').disabled = false;
}

// สรุปข้อนี้ (ขวามือ): % ตอบถูก · เร็วสุด · ถูกติดกันยาวสุด · ไต่อันดับมากสุด
function boardStats() {
  const R0 = Object.entries(lastReveal.res).filter(([, r]) => r.alive !== false);
  const tot = R0.length, ok = R0.filter(([, r]) => r.correct).length, pc = tot ? Math.round((ok / tot) * 100) : 0;
  const fast = R0.filter(([, r]) => r.correct && r.ms != null).sort((a, b) => a[1].ms - b[1].ms)[0];
  const fire = opts.mode === 'vote' ? null : R0.filter(([, r]) => (r.streak || 0) >= 2).sort((a, b) => b[1].streak - a[1].streak)[0];
  const climb = R0.map(([u, r]) => [u, (prevRanks[u] || r.rank) - r.rank]).filter(([, m]) => m > 0).sort((a, b) => b[1] - a[1])[0];
  const nm = (u) => esc(players[u]?.name || '-');
  const item = (ico, t, v) => `<li><span class="bs-ico">${ico}</span><span><small>${t}</small><b>${v}</b></span></li>`;
  return `<aside class="board-stats">
    <h3>📊 สรุปข้อ ${qi + 1}</h3>
    <div class="ring ${pc >= 70 ? 'good' : pc >= 40 ? 'mid' : 'low'}" style="--p:${pc}"><span><b>${pc}%</b><small>ตอบถูก ${ok}/${tot}</small></span></div>
    <ul>${item('⚡', 'เร็วที่สุด', fast ? `${nm(fast[0])} · ${(fast[1].ms / 1000).toFixed(1)} วิ` : '—')}
      ${item('🔥', 'ถูกติดกันยาวสุด', fire ? `${nm(fire[0])} · ${fire[1].streak} ข้อ` : '—')}
      ${item('🚀', 'ไต่อันดับมากสุด', climb && qi > 0 ? `${nm(climb[0])} · ▲${climb[1]}` : '—')}
      ${item('🙋', 'ส่งคำตอบ', `${R0.filter(([, r]) => r.answered).length} จาก ${tot} คน`)}</ul>
  </aside>`;
}
// อันดับถัดจาก 5 อันดับแรก: ชิปเล็ก ๆ ให้ทุกคนเห็นตัวเองบนจอ
function othersHtml(shown) {
  if (opts.mode === 'team' || opts.mode === 'vote') return '';
  const rest = Object.entries(lastReveal.res).sort((a, b) => a[1].rank - b[1].rank).slice(shown);
  if (!rest.length) return '';
  const MAX = 24;
  return `<div class="rk-rest"><span class="rr-h">อันดับถัดไป</span>${rest.slice(0, MAX).map(([u, r]) => `<span class="rr"><b>${r.rank}</b><i>${renderAvatar(players[u]?.avatar, { bg: false })}</i>${esc(players[u]?.name || '')}</span>`).join('')}${rest.length > MAX ? `<span class="rr more">+${rest.length - MAX} คน</span>` : ''}</div>`;
}
// สนามแข่งจรวด: จรวดเลื่อนจากตำแหน่งเดิม → ใหม่ เมื่อแถวนั้นถูกเปิด
function rocketHtml(top) {
  return `<ol class="rank-list rocket-race">${top.map(([uid, r]) => {
    const p = players[uid] || {}, g = r.gained + r.bonus;
    return `<li class="rk rl" style="--p0:${pctOf(r.score - g, rocketG)};--p1:${pctOf(r.score, rocketG)}">
      <span class="rk-n">${r.rank}</span><span class="rl-name">${esc(p.name)}</span>
      <span class="rl-track"><span class="rl-moon">🌙</span><span class="rl-rocket"><span class="rl-av">${renderAvatar(p.avatar, { bg: false })}</span><span class="rl-fire">🚀</span></span></span>
      ${g > 0 ? `<span class="gain">+${g.toLocaleString('th-TH')}</span>` : ''}
      <b class="rk-s" data-from="${r.score - g}" data-to="${r.score}">${(r.score - g).toLocaleString('th-TH')}</b></li>`;
  }).join('')}</ol>`;
}
// รางวัลพิเศษจากสถิติทั้งเกม (ไม่ซ้ำคน ถ้าเป็นไปได้)
function calcAwards(fin) {
  const A = Object.entries(gstats).filter(([u]) => players[u]);
  const avgOk = (s) => s.okMs / Math.max(1, s.ok);
  const rise = (u, s) => (s.r0 || 0) - (fin[u] || s.r0 || 0);
  const defs = [
    ['acc', ([, s]) => s.ok > 0, (a, b) => b[1].ok - a[1].ok || avgOk(a[1]) - avgOk(b[1]), (s) => `ตอบถูก ${s.ok} ข้อ`],
    ['fast', ([, s]) => s.ok > 0, (a, b) => avgOk(a[1]) - avgOk(b[1]), (s) => `ตอบถูกเฉลี่ย ${(avgOk(s) / 1000).toFixed(1)} วินาที`],
    ['fire', ([, s]) => s.best >= 2, (a, b) => b[1].best - a[1].best, (s) => `ถูกติดกัน ${s.best} ข้อ`],
    ['rise', ([u, s]) => rise(u, s) > 0, (a, b) => rise(b[0], b[1]) - rise(a[0], a[1]), (s, u) => `จากอันดับ ${s.r0} ขึ้นมาอันดับ ${fin[u]}`],
  ];
  const used = new Set(), out = [];
  for (const [k, ok, cmp, val] of defs) {
    const c = A.filter(ok).sort(cmp); if (!c.length) continue;
    const w = c.find(([u]) => !used.has(u)) || c[0];
    used.add(w[0]); out.push({ k, u: w[0], v: val(w[1], w[0]) });
  }
  return out;
}
function awardsHtml(awards, list, total) {
  if (!awards.length) return '<p class="muted end-empty">ยังไม่มีรางวัลพิเศษ — ต้องมีคนตอบถูกอย่างน้อย 1 ข้อ</p>';
  const full = list.filter((p) => gstats[p.uid]?.ans === total).length;
  return `<div class="awards">${awards.map((a, i) => { const p = players[a.u] || {}, A = AWARDS[a.k]; return `<div class="award aw-${a.k}" style="--i:${i}">
      <div class="aw-badge">${A.e}</div><div class="aw-t">${A.t}</div>
      <div class="aw-av">${renderAvatar(p.avatar, { bg: false })}</div><b class="aw-name">${esc(p.name || '-')}</b><small>${a.v}</small></div>`; }).join('')}</div>
    ${full ? `<p class="aw-note">💪 ตอบครบทุกข้อ ${full} คน — เก่งมาก!</p>` : ''}`;
}
function summaryHtml(list, total) {
  const Q = qstats.filter(Boolean), S = list.map((p) => gstats[p.uid]).filter(Boolean);
  const acc = Q.length ? Math.round(Q.reduce((s, q) => s + q.ok / Math.max(1, q.tot), 0) / Q.length * 100) : 0;
  const ansN = S.reduce((s, x) => s + x.ans, 0), avg = ansN ? S.reduce((s, x) => s + x.ms, 0) / ansN / 1000 : 0;
  const pc = (q) => Math.round((q.ok / Math.max(1, q.tot)) * 100);
  const hard = [...Q].sort((a, b) => pc(a) - pc(b))[0], easy = [...Q].sort((a, b) => pc(b) - pc(a))[0];
  const tile = (e, v, t) => `<div class="st-tile"><span>${e}</span><b>${v}</b><small>${t}</small></div>`;
  return `<div class="sum">
    <div class="st-tiles">${tile('👥', list.length, 'ผู้เล่น')}${tile('📝', total, 'ข้อที่เล่น')}${tile('🎯', acc + '%', 'ตอบถูกเฉลี่ย')}${tile('⏱️', avg.toFixed(1), 'วินาที/ข้อ')}</div>
    <div class="q-chart">${Q.map((q) => `<div class="qc ${pc(q) >= 70 ? 'good' : pc(q) >= 40 ? 'mid' : 'low'}" title="${esc(q.text)}"><span class="qc-v">${pc(q)}%</span><i style="--h:${Math.max(3, pc(q))}%"></i><small>ข้อ ${q.n}</small></div>`).join('')}</div>
    <div class="q-call">${hard ? `<div class="hard"><b>😰 ข้อที่ยากที่สุด · ข้อ ${hard.n} (ถูก ${pc(hard)}%)</b><span>${esc(hard.text)}</span></div>` : ''}${easy && easy !== hard ? `<div class="easy"><b>😊 ข้อที่ง่ายที่สุด · ข้อ ${easy.n} (ถูก ${pc(easy)}%)</b><span>${esc(easy.text)}</span></div>` : ''}</div>
  </div>`;
}
async function finish() {
  phase = 'end'; clearInterval(tickH); music(null);
  land?.destroy();
  const total = Math.max(1, played); // นับเฉพาะข้อที่เฉลยแล้ว (กรณีจบเกมก่อน)
  const isLand = opts.mode === 'land';
  const totOf = (p) => (isLand ? Math.max(1, p.answered || 0) : total);
  const list = sortPlayers(rankScores(players), opts.mode);
  const fin = {}; list.forEach((p, i) => (fin[p.uid] = i + 1));
  const awards = calcAwards(fin), stUp = {};
  for (const [u, s] of Object.entries(gstats)) if (players[u]) stUp[`players/${u}/st`] = { ok: s.ok, ans: s.ans, avg: s.ans ? Math.round(s.ms / s.ans) : 0, best: s.best };
  await DB.update(R, { 'meta/state': 'end', 'meta/podiumDone': false, 'meta/played': total, 'meta/awards': Object.fromEntries(awards.map((a) => [a.k, a.u])) || null, ...stUp, ...(bossSt ? { 'meta/bossWin': bossSt.hp <= 0 } : {}) });
  let teams = opts.mode === 'team' ? teamTable(list, (p) => p.score).sort((a, b) => a.rank - b.rank) : null;
  if (opts.mode === 'vote') {
    teams = vstate.map((st, k) => ({ k, n: list.filter((p) => p.vteam === k).length, score: st.score })).filter((t) => t.n > 0 || t.score > 0)
      .sort((a, b) => b.score - a.score);
    teams.forEach((t, i) => (t.rank = i + 1));
  }
  if (isLand) teams = landTeams || [];
  if (teams) await DB.update(R, { 'meta/finalTeams': teams });
  const ent = teams
    ? teams.map((t) => { const I = teamInfo(opts.mode, t.k); return { name: I.name, score: t.score, icon: `<div class="team-icon" style="--tc:${I.c}">${I.e}</div>` }; })
    : list.map((p) => ({ name: p.name, score: p.score, icon: renderAvatar(p.avatar, { bg: false }) }));
  const podium = [ent[1], ent[0], ent[2]];
  const T3 = 2.2, T2 = 5.6, T1 = 10.0; // วินาทีที่แต่ละอันดับขึ้น (กลองรัวก่อนทุกอันดับ)
  const hasStats = !isLand && qstats.some(Boolean);
  stage().innerHTML = `
    <div class="end">
      <h1 class="board-h">🎉 ${esc(quiz.title)} <small class="mode-tag">${MODES[opts.mode].icon} ${MODES[opts.mode].name}</small></h1>
      <nav class="end-tabs" role="tablist">${[['podium', '🏆 โพเดียม'], ...(hasStats ? [['awards', '🏅 รางวัลพิเศษ'], ['sum', '📊 สรุปห้องเรียน']] : []), ['all', `📋 คะแนนทุกคน (${list.length})`]]
        .map(([k, t], i) => `<button class="${i ? '' : 'on'}" data-tab="${k}" role="tab">${t}</button>`).join('')}</nav>
      <div class="end-panel on" data-p="podium">
      ${opts.mode === 'boss' && bossSt ? `<div class="boss-end ${bossSt.hp <= 0 ? 'win' : 'lose'}">${bossSVG(bossSt.kind, bossSt.hp <= 0 ? 'dizzy' : 'smug')}<div><b>${bossSt.hp <= 0 ? `🎉 ทั้งห้องปราบ${esc(bossSt.name)}สำเร็จ!` : `😝 ${esc(bossSt.name)}หนีไปได้!`}</b><small>${bossSt.hp <= 0 ? 'เก่งมากทุกคน — โพเดียมคือนักรบที่โจมตีแรงที่สุด' : `เหลือเลือดอีก ${Math.round((bossSt.hp / bossSt.max) * 100)}% ครั้งหน้าลองใหม่นะ!`}</small></div></div>` : ''}
      ${opts.mode === 'rocket' && list[0] ? `<div class="boss-end rocket">🚀<div><b>${list[0].score >= rocketG ? `🌙 ${esc(list[0].name)} ถึงดวงจันทร์เป็นคนแรก!` : `ยังไม่มีใครถึงดวงจันทร์ — ${esc(list[0].name)} ไปไกลที่สุด`}</b><small>${pctOf(list[0].score, rocketG)}% ของทางไปดวงจันทร์</small></div></div>` : ''}
      <div class="podium">${podium.map((p, k) => {
        const place = [2, 1, 3][k];
        return p ? `<div class="pod p${place}" style="--delay:${[T2, T1, T3][k]}s">
          <div class="pod-av">${place === 1 ? '<span class="crown">👑</span>' : ''}${p.icon}</div>
          <div class="pod-name">${esc(p.name)}</div>
          <div class="pod-col"><span>${place}</span><small>${p.score.toLocaleString('th-TH')}${isLand ? ' ช่อง' : ''}</small></div>
        </div>` : '<div class="pod empty-pod"></div>';
      }).join('')}</div></div>
      ${hasStats ? `<div class="end-panel" data-p="awards">${awardsHtml(awards, list, total)}</div><div class="end-panel" data-p="sum">${summaryHtml(list, total)}</div>` : ''}
      <div class="end-panel" data-p="all"><div class="all-rank card">
        <table><thead><tr><th>อันดับ</th><th>เลขประจำตัว</th><th>ชื่อ</th>${opts.mode !== 'classic' ? '<th>หมายเหตุ</th>' : ''}<th>ตอบถูก</th><th>${isLand ? 'ยึดได้ (ช่อง)' : 'คะแนน'}</th></tr></thead><tbody>
        ${list.map((p, i) => `<tr class="${i < 3 ? 'top' : ''}"><td><span class="ar-n">${i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}</span></td><td>${esc(p.sid || '-')}</td><td><span class="ar-who"><i>${renderAvatar(p.avatar, { bg: false })}</i>${esc(p.name)}</span></td>${opts.mode !== 'classic' ? `<td>${note(p)}</td>` : ''}<td>${p.correct || 0}/${isLand ? p.answered || 0 : total}</td><td>${p.score.toLocaleString('th-TH')}</td></tr>`).join('')}
        </tbody></table></div></div>
      <div class="rev-foot">
        <label class="pill conv">แปลงเป็นคะแนนเก็บ เต็ม <input type="number" id="fullPts" value="10" min="1" max="100"> คะแนน</label>
        ${$('#optAnon').checked ? '<span class="muted">🙈 โหมดไม่ระบุตัวตน — ไม่มีเลขประจำตัว จึงบันทึกลงสมุดคะแนนไม่ได้</span>' : '<button class="btn green" id="bonusBtn">🏅 บันทึกคะแนนพิเศษ (อันดับ 1–3)</button>'}<button class="btn light" id="csvBtn">⤓ ดาวน์โหลดคะแนน (CSV)</button><span class="sp"></span><button class="btn gold" id="homeBtn">กลับหน้าหลัก</button></div>
    </div>`;
  function note(p) {
    if (opts.mode === 'team' || opts.mode === 'land') return p.team != null ? TEAMS[p.team].e + ' ' + TEAMS[p.team].name : '-';
    if (opts.mode === 'vote') return p.vteam != null ? teamInfo('vote', p.vteam).name : 'ไม่มีทีม';
    if (opts.mode === 'boss') return `⚔️ โจมตีรวม ${(p.score || 0).toLocaleString('th-TH')}`;
    if (opts.mode === 'wager') return `🎰 ${(p.score || 0) >= WAGER_START ? 'กำไร +' + ((p.score || 0) - WAGER_START).toLocaleString('th-TH') : 'ขาดทุน −' + (WAGER_START - (p.score || 0)).toLocaleString('th-TH')}`;
    if (opts.mode === 'rocket') return `🚀 ${pctOf(p.score, rocketG)}%`;
    return (p.hearts ?? 1) > 0 ? 'รอด ' + hearts(p.hearts ?? opts.hearts, opts.hearts) : `ตกรอบข้อ ${(p.outAt ?? 0) + 1}`;
  }
  const at = (s, fn) => setTimeout(() => phase === 'end' && fn(), s * 1000);
  if (ent[2]) { at(T3 - 1.4, () => sfx.drumroll(1.4)); at(T3, () => sfx.rankStep(0)); }
  if (ent[1]) { at(T2 - 1.8, () => sfx.drumroll(1.8)); at(T2, () => sfx.rankStep(2)); }
  at(T1 - 2.8, () => sfx.drumroll(2.8));
  at(T1, () => { sfx.fanfare(); fxConfetti(220, 6000); });
  at(T1 + 1.2, () => DB.update(R, { 'meta/podiumDone': true }));
  $('#homeBtn').onclick = leave;
  $('.end-tabs').onclick = (e) => {
    const b = e.target.closest('[data-tab]'); if (!b) return;
    sfx.tap(); $$('.end-tabs button').forEach((x) => x.classList.toggle('on', x === b));
    $$('.end-panel').forEach((p) => p.classList.toggle('on', p.dataset.p === b.dataset.tab));
  };
  // โพเดียมขึ้นครบแล้ว: ชวนดูรางวัลพิเศษ
  at(T1 + 3, () => $('.end-tabs [data-tab="awards"]')?.classList.add('ping'));
  const recips = bonusRecipients(list, teams);
  if ($('#bonusBtn')) $('#bonusBtn').onclick = () => openBonus(recips);
  $('#csvBtn').onclick = () => {
    const full = Math.max(1, +$('#fullPts').value || 10);
    const bySid = list.map((p, i) => ({ ...p, rank: i + 1 }))
      .sort((a, b) => String(a.sid || '').localeCompare(String(b.sid || ''), 'th', { numeric: true }));
    const extra = opts.mode !== 'classic';
    const rows = [['เลขประจำตัว', 'ชื่อ', 'อันดับ', ...(extra ? ['หมายเหตุ'] : []), 'ตอบถูก', 'จำนวนข้อ', isLand ? 'ยึดได้ (ช่อง)' : 'คะแนนเกม', `คะแนนเก็บ (เต็ม ${full})`],
      ...bySid.map((p) => [p.sid || '', p.name, p.rank, ...(extra ? [note(p).replace(/[❤️🤍]/gu, '').trim()] : []), p.correct || 0, isLand ? p.answered || 0 : total, p.score, Math.round(((p.correct || 0) / totOf(p)) * full * 100) / 100])];
    const csv = '﻿' + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `คะแนน-${quiz.title}-${pin}.csv`; a.click();
  };
}

/* ───────────── บันทึกคะแนนพิเศษลงสมุดคะแนน (อันดับ 1 = 3, 2 = 2, 3 = 1) ───────────── */
const BONUS_PTS = [3, 2, 1];
const MEDAL = ['🥇', '🥈', '🥉'];
async function bookApi(body) {
  const tok = DB.mode === 'firebase' ? await DB.user().getIdToken() : 'local-test';
  const r = await fetch(SCOREBOOK_API, { method: 'POST', body: JSON.stringify({ ...body, idToken: tok }) });
  let j; try { j = await r.json(); } catch { throw { error: 'bad_response' }; }
  if (!j.ok) throw j;
  return j;
}
function bonusRecipients(list, teams) {
  if (teams) {
    return teams.slice(0, 3).flatMap((t, i) => list
      .filter((p) => (opts.mode === 'vote' ? p.vteam : p.team) === t.k)
      .map((p) => ({ sid: String(p.sid || '').trim(), name: p.name, pts: BONUS_PTS[i], place: i + 1, team: teamInfo(opts.mode, t.k).name })));
  }
  return list.slice(0, 3).map((p, i) => ({ sid: String(p.sid || '').trim(), name: p.name, pts: BONUS_PTS[i], place: i + 1 }));
}
async function openBonus(recips) {
  const dlg = $('#bonusDlg'), body = $('#bonusBody');
  dlg.showModal();
  if (!recips.length) { body.innerHTML = '<p class="muted">ยังไม่มีผู้ได้อันดับ</p><div class="row end"><button class="btn light" data-x>ปิด</button></div>'; body.querySelector('[data-x]').onclick = () => dlg.close(); return; }
  body.innerHTML = '<p class="muted">กำลังโหลดรายชื่อห้องจากสมุดคะแนน…</p>';
  let classes;
  try { classes = (await bookApi({ action: 'classes' })).classes || []; }
  catch (e) {
    body.innerHTML = `<p class="warn-line">โหลดสมุดคะแนนไม่ได้ ${e?.error === 'auth' ? '— ต้องล็อกอินด้วยอีเมลครู' : '— ตรวจอินเทอร์เน็ตแล้วลองใหม่'}</p><div class="row end"><button class="btn light" data-x>ปิด</button></div>`;
    body.querySelector('[data-x]').onclick = () => dlg.close();
    return;
  }
  const hits = (c) => { const set = new Set(c.students.map((s) => s.code)); return recips.filter((r) => set.has(r.sid)).length; };
  const opts2 = classes.map((c) => ({ c, n: hits(c) })).sort((a, b) => b.n - a.n);
  let cls = opts2[0]?.c;
  const draw = () => {
    const byCode = new Map((cls?.students || []).map((s) => [s.code, s.name]));
    body.innerHTML = `
      <label class="field"><span>บันทึกลงห้อง (จับคู่ด้วยเลขประจำตัว)</span>
        <select class="input" id="bnCls">${opts2.map(({ c, n }) => `<option value="${esc(c.id)}" ${c === cls ? 'selected' : ''}>${esc(c.name)}${c.subject ? ' · ' + esc(c.subject) : ''} — ตรง ${n}/${recips.length} คน</option>`).join('')}</select></label>
      <label class="field"><span>เหตุผล (แสดงในช่องคะแนนเสริม)</span>
        <input class="input" id="bnWhy" maxlength="100" value="${esc('ตอบคำถาม: ' + (quiz?.title || ''))}"></label>
      <table class="bn-tbl"><thead><tr><th></th><th>อันดับ</th><th>ชื่อในเกม</th><th>เลขประจำตัว</th><th>ในสมุดคะแนน</th><th>คะแนน</th></tr></thead><tbody>
      ${recips.map((r, i) => { const nm = byCode.get(r.sid); return `<tr class="${nm ? '' : 'miss'}">
        <td><input type="checkbox" data-i="${i}" ${nm ? 'checked' : 'disabled'} aria-label="บันทึก ${esc(r.name)}"></td>
        <td>${MEDAL[r.place - 1]} ${r.team ? `<small>${esc(r.team)}</small>` : ''}</td>
        <td>${esc(r.name)}</td><td>${esc(r.sid || '-')}</td>
        <td>${nm ? esc(nm) : '<span class="warn-line">ไม่พบเลขนี้ในห้อง</span>'}</td>
        <td><input class="input bn-pts" type="number" min="-100" max="100" step="0.5" data-p="${i}" value="${r.pts}" aria-label="คะแนน ${esc(r.name)}"></td></tr>`; }).join('')}
      </tbody></table>
      <p class="muted bn-note">ครูเลือกได้ว่าจะบันทึกใครบ้าง กดซ้ำเกมเดิมระบบจะไม่บวกซ้ำ</p>
      <div class="bn-actions"><button class="btn light" data-x>ไม่บันทึก</button><button class="btn green" id="bnSave">💾 บันทึกคะแนนพิเศษ</button></div>`;
    body.querySelector('[data-x]').onclick = () => dlg.close();
    $('#bnCls').onchange = (e) => { cls = classes.find((c) => c.id === e.target.value); draw(); };
    $('#bnSave').onclick = save;
  };
  const save = async () => {
    const why = $('#bnWhy').value.trim() || 'ตอบคำถาม';
    const entries = $$('#bonusBody input[type=checkbox]:checked').map((cb) => {
      const r = recips[+cb.dataset.i];
      return { code: r.sid, pts: +$(`#bonusBody [data-p="${cb.dataset.i}"]`).value || 0, reason: why };
    }).filter((e) => e.pts);
    if (!entries.length) return toast('ยังไม่ได้เลือกนักเรียน');
    const b = $('#bnSave'); b.disabled = true; b.textContent = 'กำลังบันทึก…';
    try {
      const j = await bookApi({ action: 'addbonus', classId: cls.id, gameKey: `${pin}-${gameStartAt}`, reason: why, entries });
      body.innerHTML = `<div class="bn-done"><div class="big">✅</div><h3>บันทึกลง “${esc(j.cls)}” แล้ว</h3>
        <ul>${j.added.map((a) => `<li>${esc(a.name)} <b>+${a.pts}</b></li>`).join('')}</ul>
        ${j.dup.length ? `<p class="muted">ข้ามรายการที่เคยบันทึกจากเกมนี้แล้ว ${j.dup.length} คน</p>` : ''}
        ${j.missing.length ? `<p class="warn-line">ไม่พบเลข: ${j.missing.map(esc).join(', ')}</p>` : ''}
        <p class="muted">เปิดสมุดคะแนน → แท็บ “คะแนนเสริม” เพื่อดูรายการ</p>
        <div class="row end"><button class="btn gold" data-x>ปิด</button></div></div>`;
      body.querySelector('[data-x]').onclick = () => dlg.close();
      sfx.correct();
      const ob = $('#bonusBtn'); if (ob) { ob.textContent = '✅ บันทึกคะแนนพิเศษแล้ว'; }
    } catch (e) {
      b.disabled = false; b.textContent = '💾 บันทึกคะแนนพิเศษ';
      toast(e?.error === 'auth' ? 'ต้องล็อกอินด้วยอีเมลครูก่อน' : 'บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง');
    }
  };
  draw();
}
