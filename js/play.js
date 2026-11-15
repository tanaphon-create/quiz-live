import { connect, TS } from './db.js';
import { renderAvatar, randomAvatar, OPTS } from './avatar.js';
import { sfx, unlock } from './sound.js';
import { $, $$, esc, SHAPES, show, toast, countUp, confetti, rankScores, MODES, TEAMS, hearts, sortPlayers, teamInfo, teamDecision } from './ui.js';

const ME_KEY = 'quizlive:me';
const saved = (() => { try { return JSON.parse(localStorage.getItem(ME_KEY)) || {}; } catch { return {}; } })();
let avatar = saved.avatar || randomAvatar();
let DB, pin = '', R = '', meta = null, cur = null, me = null, joined = false, sid = saved.sid || '';
let allPlayers = {}, tallyAns = null;
let resUnsub = null, timerH = null, answeredQ = -1, lastState = '', prevScore = 0;
const remember = () => localStorage.setItem(ME_KEY, JSON.stringify({ pin, sid, name: me?.name || saved.name || '', avatar }));

const qs = new URLSearchParams(location.search);
$('#pinIn').value = qs.get('pin') || '';
$('#nameAv').innerHTML = renderAvatar(avatar);
$('#nameIn').value = saved.name || '';
$('#sidIn').value = sid;
const goSid = (title) => { $('#roomTitle').textContent = title; $('#roomTitle2').textContent = title; show('sid'); $('#sidIn').focus(); };

// INTRO: แสดงก่อนเข้าหน้ากรอกข้อมูลทุกครั้ง — ฟ้ายามเช้าพาสเทล เล่นกับตัวละครได้
const introDone = new Promise((res) => {
  const intro = $('#intro');
  const segs = 'Segmenter' in Intl ? [...new Intl.Segmenter('th', { granularity: 'grapheme' }).segment('ฟลุ๊กถูก')].map((x) => x.segment) : ['ฟ', 'ลุ๊', 'ก', 'ถู', 'ก'];
  $('#introTitle').innerHTML = segs.map((c, i) => `<span style="--i:${i}">${c}</span>`).join('');
  const rnd = (a, b) => a + Math.random() * (b - a);
  $('#bubbles').innerHTML = Array.from({ length: 16 }, () => `<i style="left:${rnd(0, 100)}%;--s:${rnd(10, 34)}px;--t:${rnd(9, 18)}s;--dl:${rnd(-18, 0)}s"></i>`).join('');
  $('#sparkles').innerHTML = Array.from({ length: 14 }, () => `<i style="left:${rnd(4, 96)}%;top:${rnd(4, 70)}%;--dl:${rnd(0, 4)}s;--s:${rnd(8, 16)}px"></i>`).join('');
  $('#introCrowd').innerHTML = Array.from({ length: 5 }, (_, i) => `<button class="ic" style="--i:${i}" aria-label="ตัวละคร ${i + 1}">${renderAvatar(randomAvatar(), { bg: false })}</button>`).join('');

  // แตะตัวละคร → กระโดด + หัวใจลอย + บางครั้งเปลี่ยนชุด
  $('#introCrowd').onclick = (e) => {
    const b = e.target.closest('.ic'); if (!b) return;
    unlock(); sfx.pop();
    b.classList.remove('boing'); void b.offsetWidth; b.classList.add('boing');
    if (Math.random() < 0.5) setTimeout(() => { b.innerHTML = renderAvatar(randomAvatar(), { bg: false }); }, 180);
    const r = b.getBoundingClientRect(), ir = intro.getBoundingClientRect();
    const cols = ['#FF6F91', '#FF9F43', '#A78BFA', '#3DD6A8', '#4FB3FF'];
    for (let k = 0; k < 5; k++) {
      const h = document.createElement('i');
      h.className = 'heart-pop';
      h.textContent = ['♥', '★', '♥', '✦', '♥'][k];
      h.style.cssText = `left:${r.left - ir.left + r.width / 2}px;top:${r.top - ir.top + 10}px;--x:${rnd(-60, 60)}px;--r:${rnd(-40, 40)}deg;color:${cols[k]}`;
      intro.append(h);
      h.addEventListener('animationend', () => h.parentNode && h.parentNode.removeChild(h));
    }
  };

  // ประโยคในลูกโป่งคำพูด
  const lines = ['พร้อมยัง?', 'ตอบไวได้คะแนนเยอะ!', 'ฟลุ๊กก็ถูกได้นะ', 'ชวนเพื่อนมาแข่งกัน!', 'สู้ ๆ นะทุกคน'];
  let li = 0;
  const sayH = setInterval(() => {
    const s = $('#introSay'); s.classList.remove('pop'); void s.offsetWidth;
    li = (li + 1) % lines.length; s.textContent = lines[li]; s.classList.add('pop');
  }, 2600);

  // พารัลแลกซ์: ขยับตามเมาส์/การเอียงมือถือ
  const layers = $$('.layer', intro);
  const tilt = (x, y) => layers.forEach((l) => { const d = +l.dataset.d; l.style.transform = `translate(${x * d}px, ${y * d}px)`; });
  const onMove = (e) => tilt(e.clientX / innerWidth - 0.5, e.clientY / innerHeight - 0.5);
  const onTilt = (e) => { if (e.gamma != null) tilt(Math.max(-1, Math.min(1, e.gamma / 30)) / 2, Math.max(-1, Math.min(1, (e.beta - 40) / 30)) / 2); };
  addEventListener('pointermove', onMove);
  addEventListener('deviceorientation', onTilt);

  $('#introGo').onclick = (e) => {
    unlock(); sfx.intro();
    clearInterval(sayH);
    removeEventListener('pointermove', onMove); removeEventListener('deviceorientation', onTilt);
    const r = e.currentTarget.getBoundingClientRect();
    intro.style.setProperty('--wx', `${r.left + r.width / 2}px`);
    intro.style.setProperty('--wy', `${r.top + r.height / 2}px`);
    intro.classList.add('leave');
    setTimeout(res, 750);
  };
});

const ready = connect().then((d) => {
  DB = d;
  if (d.mode === 'local') $('#modeHint').textContent = '🟡 โหมดทดลอง (ใช้ได้เฉพาะเครื่องเดียวกับจอครู)';
  return d;
}).catch((e) => { console.error(e); toast('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ลองรีเฟรชอีกครั้ง', 6000); });

// กลับเข้าห้องเดิมอัตโนมัติ (เช่น เผลอรีเฟรช)
Promise.all([ready, introDone]).then(async () => {
  const p = qs.get('pin') || saved.pin;
  if (!p || !DB) return show('pin');
  const [m, pl] = await Promise.all([DB.get(`quiz/rooms/${p}/meta`), DB.get(`quiz/rooms/${p}/players/${DB.uid}`)]);
  if (m && m.state !== 'end' && pl) { pin = p; R = `quiz/rooms/${pin}`; me = pl; avatar = pl.avatar || avatar; enterRoom(); }
  else if (qs.get('pin') && m && m.state !== 'end') { pin = p; R = `quiz/rooms/${pin}`; goSid(m.title); }
  else { if (qs.get('pin')) toast(m ? 'เกมนี้จบไปแล้ว' : 'ไม่พบห้องนี้ — ใส่ PIN ใหม่'); show('pin'); }
});

$('#pinForm').onsubmit = async (e) => {
  e.preventDefault(); unlock();
  if (!(await ready)) return;
  const p = $('#pinIn').value.replace(/\D/g, '');
  if (p.length !== 6) return toast('PIN ต้องเป็นตัวเลข 6 หลัก');
  const m = await DB.get(`quiz/rooms/${p}/meta`);
  if (!m) return toast('ไม่พบห้องนี้ — ตรวจรหัสอีกครั้ง');
  if (m.state === 'end') return toast('เกมนี้จบไปแล้ว');
  pin = p; R = `quiz/rooms/${pin}`;
  goSid(m.title);
};

$('#sidForm').onsubmit = async (e) => {
  e.preventDefault(); unlock();
  const v = $('#sidIn').value.replace(/\s/g, '');
  if (!/^\d{1,10}$/.test(v)) return toast('ใส่เลขประจำตัวเป็นตัวเลขเท่านั้น');
  const others = (await DB.get(`${R}/players`)) || {};
  if (Object.entries(others).some(([u, p]) => u !== DB.uid && String(p.sid) === v)) return toast('เลขประจำตัวนี้เข้าห้องแล้ว — ตรวจอีกครั้ง');
  sid = v; sfx.tap();
  $('#sidChip').textContent = '🪪 ' + sid;
  show('name'); $('#nameIn').focus();
};

$('#nameForm').onsubmit = async (e) => {
  e.preventDefault(); unlock();
  const name = $('#nameIn').value.trim().replace(/\s+/g, ' ');
  if (!name) return toast('พิมพ์ชื่อก่อนนะ');
  const others = (await DB.get(`${R}/players`)) || {};
  if (Object.entries(others).some(([u, p]) => u !== DB.uid && p.name?.toLowerCase() === name.toLowerCase())) return toast('ชื่อนี้มีคนใช้แล้ว ลองชื่ออื่น');
  const meta0 = await DB.get(`${R}/meta`);
  if (!meta0 || meta0.state === 'end') { show('pin'); return toast('ห้องนี้ปิดแล้ว'); }
  if (!sid) { show('sid'); return toast('ใส่เลขประจำตัวก่อนนะ'); }
  me = { sid, name, avatar, score: 0, streak: 0, correct: 0, online: true, joinedAt: TS };
  await DB.set(`${R}/players/${DB.uid}`, me);
  sfx.pop();
  enterRoom();
};

function enterRoom() {
  joined = true;
  remember();
  DB.onDisconnect(`${R}/players/${DB.uid}/online`, false);
  DB.connected((c) => c && joined && DB.update(`${R}/players/${DB.uid}`, { online: true }));
  $('#lkPin').textContent = pin;
  DB.on(`${R}/players/${DB.uid}`, (p) => {
    if (!p) { if (joined) kicked(); return; }
    me = p;
    $('#lkName').textContent = p.name; $('#pName').textContent = p.name;
    $('#pAv').innerHTML = renderAvatar(p.avatar);
    badges();
    route();
    const s = $('#pScore');
    if ((p.score || 0) !== prevScore) { countUp(s, prevScore, p.score || 0, 900); prevScore = p.score || 0; }
  });
  DB.on(`${R}/players`, (v) => { allPlayers = v || {}; $('#lkCount').textContent = Object.keys(allPlayers).length; renderTally(); });
  DB.on(`${R}/current`, (c) => { cur = c; route(); });
  DB.on(`${R}/meta`, (m) => { meta = m; badges(); route(); });
}

function kicked() {
  joined = false;
  localStorage.setItem(ME_KEY, JSON.stringify({ avatar, name: me?.name }));
  document.body.innerHTML = `<div class="center-box" style="min-height:100dvh"><div class="big-ico">👋</div><h2>คุณถูกนำออกจากห้อง</h2><a class="btn" href="play.html">กลับหน้าเข้าร่วม</a></div>`;
}

/* ───────── ป้ายโหมด / ทีม / หัวใจ ───────── */
const maxH = () => meta?.hearts || 3;
const myHearts = () => me?.hearts ?? maxH();
function badges() {
  if (!meta) return;
  const mode = meta.mode || 'classic';
  const M = MODES[mode];
  const myK = mode === 'vote' ? me?.vteam : me?.team;
  const tm = (mode === 'team' || mode === 'vote') && myK != null ? teamInfo(mode, myK) : null;
  let lk = `${M.icon} โหมด${M.name}`;
  if (mode === 'team') lk += tm ? ` — คุณอยู่ <b style="background:${tm.c}">${tm.e} ${tm.name}</b>` : ' — รอครูแบ่งทีม…';
  if (mode === 'survival') lk += ` — มี ${hearts(maxH(), maxH())}`;
  if (mode === 'vote') lk += tm ? ` — คุณอยู่ <b style="background:${tm.c}">${tm.name}</b> <button class="chg" id="chgTeam">เปลี่ยน</button>` : ' — ยังไม่ได้เลือกทีม';
  $('#lkMode').innerHTML = lk;
  const cb = $('#chgTeam'); if (cb) cb.onclick = () => showTeamPick();
  const pm = $('#pMode');
  pm.hidden = mode === 'classic';
  if ((mode === 'team' || mode === 'vote') && tm) { pm.textContent = `${tm.e} ${tm.name}`; pm.style.background = tm.c; }
  if (mode === 'survival') { pm.textContent = myHearts() > 0 ? hearts(myHearts(), maxH()) : '👻 ตกรอบ'; pm.style.background = ''; }
}

/* ───────── ห้องล็อกเกอร์: แต่งตัว ───────── */
let tab = 'shape';
const ITEM_LABEL = {
  round: 'กลม', bear: 'หมี', bunny: 'กระต่าย', cat: 'แมว', chick: 'ลูกเจี๊ยบ', dino: 'ไดโน', bean: 'ถั่ว', ghost: 'ผี', none: 'ไม่มี',
};
function renderCloset() {
  $('#lkAv').innerHTML = renderAvatar(avatar, { bg: false });
  $('#tabs').innerHTML = Object.entries(OPTS).map(([k, o]) => `<button class="${k === tab ? 'on' : ''}" data-k="${k}">${o.label}</button>`).join('');
  $('#optGrid').innerHTML = OPTS[tab].items.map((v) => {
    const isColor = tab === 'body' || tab === 'bg';
    const preview = isColor
      ? `<span class="swatch" style="background:${v}"></span>`
      : renderAvatar({ ...avatar, [tab]: v }, { bg: false });
    return `<button class="opt ${avatar[tab] === v ? 'on' : ''} ${isColor ? 'color' : ''}" data-v="${v}" aria-label="${ITEM_LABEL[v] || v}">${preview}</button>`;
  }).join('');
}
$('#tabs').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; tab = b.dataset.k; sfx.tap(); renderCloset(); };
$('#optGrid').onclick = (e) => {
  const b = e.target.closest('.opt'); if (!b) return;
  avatar = { ...avatar, [tab]: b.dataset.v }; sfx.pop(); renderCloset(); bounce(); pushAvatar();
};
$('#randBtn').onclick = () => { avatar = randomAvatar(); sfx.whoosh(); renderCloset(); bounce(); pushAvatar(); };
$('#leaveBtn').onclick = async () => {
  if (!confirm('ออกจากห้องนี้?')) return;
  joined = false; await DB.remove(`${R}/players/${DB.uid}`);
  localStorage.setItem(ME_KEY, JSON.stringify({ avatar, sid, name: me?.name })); location.href = 'play.html';
};
function bounce() { const a = $('#lkAv'); a.classList.remove('jump'); void a.offsetWidth; a.classList.add('jump'); }
let pushH;
function pushAvatar() {
  remember();
  clearTimeout(pushH);
  pushH = setTimeout(() => DB.update(`${R}/players/${DB.uid}`, { avatar }), 300);
}

/* ───────── เส้นทางตามสถานะเกม ───────── */
const stage = () => $('#pstage');
async function route() {
  if (!meta || !joined) return;
  const st = meta.state, qi = meta.qIndex;
  const shown = st === 'board' ? meta.rankShown === qi : st === 'end' ? !!meta.podiumDone : 0;
  const needTeam = meta.mode === 'vote' && me && me.vteam == null;
  const key = `${st}|${qi}|${meta.qStartAt ? 1 : 0}|${cur ? cur.idx : '-'}|${shown}|${meta.mode}|${needTeam}|${meta.vteams}`;
  if (key === lastState) return;
  lastState = key;
  if (st !== 'reveal') document.body.classList.remove('flash-ok', 'flash-bad');
  clearInterval(timerH); timerH = null;
  resUnsub && resUnsub(); resUnsub = null;

  if (st === 'lobby') { if (needTeam) return showTeamPick(); show('locker'); renderCloset(); return; }
  show('play');
  $('#pQ').textContent = qi >= 0 ? `ข้อ ${qi + 1}/${meta.total}` : '';

  if (st === 'ready') {
    stage().innerHTML = `<div class="msg"><div class="big-num">${qi + 1}</div>
      ${meta.showQ && cur ? `<h2 class="q-mini">${esc(cur.text)}</h2>` : '<h2>เตรียมตัว!</h2>'}
      ${cur?.points >= 2000 ? `<div class="bonus">⭐ คะแนน x${cur.points / 1000}</div>` : ''}
      <div class="ready-bar"><i></i></div></div>`;
    sfx.whoosh();
  } else if (st === 'question') {
    if (!meta.qStartAt || !cur) { lastState = ''; return; }
    const mine = await DB.get(`${R}/answers/${qi}/${DB.uid}`);
    if (mine) { answeredQ = qi; return waitScreen(mine.choice); }
    answerScreen();
  } else if (st === 'reveal') {
    stage().innerHTML = `<div class="msg"><div class="spinner"></div><h2>กำลังตรวจคำตอบ…</h2></div>`;
    resUnsub = DB.on(`${R}/results/${qi}/${DB.uid}`, (r) => r && resultScreen(r));
  } else if (st === 'board' && !shown) {
    drumWait('🏆 ครูกำลังประกาศอันดับบนจอใหญ่…');
  } else if (st === 'board') {
    const r = await DB.get(`${R}/results/${qi}/${DB.uid}`);
    stage().innerHTML = `<div class="msg"><div class="avatar-box hero">${renderAvatar(me?.avatar)}</div>
      ${r && (meta.mode === 'team' || meta.mode === 'vote') && r.team != null ? `<div class="team-chip big" style="background:${teamInfo(meta.mode, r.team).c}">${teamInfo(meta.mode, r.team).e} ${teamInfo(meta.mode, r.team).name}</div>
      <div class="rank-big">ทีมอันดับ <b>${r.teamRank}</b><small> จาก ${r.teamsOf} ทีม</small></div>
      <p class="soft">คะแนนทีม ${(r.teamScore || 0).toLocaleString('th-TH')} · คะแนนคุณ ${r.score.toLocaleString('th-TH')}</p>` : ''}
      ${r && meta.mode === 'survival' ? `<div class="hp-line">${r.hearts > 0 ? hearts(r.hearts, maxH()) : '👻 ตกรอบแล้ว'}</div>` : ''}
      ${r && meta.mode !== 'team' && meta.mode !== 'vote' ? `<div class="rank-big">อันดับ <b>${r.rank}</b><small> จาก ${r.of}</small></div>
      ${r.ahead && !(meta.mode === 'survival' && r.hearts <= 0) ? `<p class="soft">ตามหลัง <b>${esc(r.ahead.name)}</b> อยู่ ${r.ahead.gap.toLocaleString('th-TH')} คะแนน สู้ๆ!</p>` : '<p class="soft">🥇 นำอยู่ตอนนี้!</p>'}` : '<h2>ดูอันดับบนจอใหญ่</h2>'}
      </div>`;
    r && r.rank <= 3 ? sfx.correct() : sfx.pop();
  } else if (st === 'end' && !meta.cancelled && !shown) {
    drumWait('🎉 ประกาศผลบนจอใหญ่ ดูที่จอเลย!');
  } else if (st === 'end') {
    joined = !meta.cancelled;
    if (meta.cancelled) { stage().innerHTML = `<div class="msg"><div class="big-ico">🚪</div><h2>ครูปิดห้องแล้ว</h2><a class="btn" href="play.html">กลับ</a></div>`; return; }
    const list = sortPlayers(rankScores((await DB.get(`${R}/players`)) || {}), meta.mode);
    const i = list.findIndex((p) => p.uid === DB.uid);
    const p = list[i] || me || {};
    const tRank = meta.mode === 'vote' && meta.finalTeams ? Object.values(meta.finalTeams).find((t) => t.k === p.vteam)?.rank : null;
    const medal = ['🥇', '🥈', '🥉'][tRank != null ? tRank - 1 : i] || '🎖️';
    stage().innerHTML = `<div class="msg final">
      <div class="medal" style="animation-delay:.3s">${medal}</div>
      <div class="avatar-box hero">${renderAvatar(p.avatar)}</div>
      ${teamEnd(p)}
      ${meta.mode === 'survival' ? `<div class="hp-line">${(p.hearts ?? 1) > 0 ? '🏅 รอดจนจบเกม! ' + hearts(p.hearts, maxH()) : '👻 ตกรอบที่ข้อ ' + ((p.outAt ?? 0) + 1)}</div>` : ''}
      ${meta.mode === 'vote' ? '' : `<div class="rank-big">อันดับ <b>${i + 1}</b><small> จาก ${list.length}</small></div>`}
      <div class="final-score">${(p.score || 0).toLocaleString('th-TH')} <small>คะแนน</small></div>
      <p class="soft">${meta.mode === 'vote' ? 'คุณโหวตถูก' : 'ตอบถูก'} ${p.correct || 0} จาก ${meta.played || meta.total} ข้อ</p>
      <a class="btn light" href="play.html">เล่นเกมใหม่</a></div>`;
    localStorage.setItem(ME_KEY, JSON.stringify({ avatar, sid, name: p.name }));
    const myT = meta.mode === 'vote' ? p.vteam : p.team;
    const teamWin = (meta.mode === 'team' || meta.mode === 'vote') && meta.finalTeams && Object.values(meta.finalTeams).find((t) => t.k === myT)?.rank === 1;
    if ((i >= 0 && i < 3) || teamWin) { confetti(); sfx.fanfare(); } else sfx.correct();
  }
}

function teamEnd(p) {
  const k = meta.mode === 'vote' ? p.vteam : p.team;
  if ((meta.mode !== 'team' && meta.mode !== 'vote') || k == null || !meta.finalTeams) return '';
  const ft = Object.values(meta.finalTeams).find((t) => t.k === k);
  const t = teamInfo(meta.mode, k);
  return ft ? `<div class="team-chip big" style="background:${t.c}">${t.e} ${t.name} ได้อันดับ ${ft.rank}${ft.rank === 1 ? ' 🏆' : ''}</div>` : '';
}

/* ───────── ทีมโหวต: เลือกเลขทีม + ดูเสียงโหวตของทีม ───────── */
function showTeamPick() {
  const N = meta?.vteams || 4;
  show('team');
  $('#teamGrid').innerHTML = Array.from({ length: N }, (_, k) => {
    const I = teamInfo('vote', k);
    const n = Object.values(allPlayers).filter((p) => p.vteam === k).length;
    return `<button class="tnum ${me?.vteam === k ? 'on' : ''}" style="--tc:${I.c}" data-k="${k}"><b>${k + 1}</b><small>${n} คน</small></button>`;
  }).join('');
  $('#teamGrid').onclick = async (e) => {
    const b = e.target.closest('.tnum'); if (!b) return;
    sfx.pop();
    await DB.update(`${R}/players/${DB.uid}`, { vteam: +b.dataset.k });
    lastState = ''; route();
  };
}
function renderTally() {
  const el = $('#tally');
  if (!el || meta?.mode !== 'vote' || me?.vteam == null || !cur) return;
  const mates = Object.entries(allPlayers).filter(([, p]) => p.vteam === me.vteam);
  const votes = mates.map(([u]) => tallyAns?.[u]).filter(Boolean);
  const d = teamDecision(votes.map((v) => ({ choice: v.choice, at: v.at || 0 })));
  const cnt = Array(cur.choices.length).fill(0);
  votes.forEach((v) => v.choice < cnt.length && cnt[v.choice]++);
  const I = teamInfo('vote', me.vteam);
  el.innerHTML = `<div class="tt-h" style="--tc:${I.c}">${I.name} โหวตแล้ว ${votes.length}/${mates.length} คน${d ? ' · เสียงนำ:' : ''}</div>
    <div class="tt-row">${cnt.map((c, k) => `<span class="tt a${k} ${d && d.choice === k ? 'lead' : ''}">${SHAPES[k]}<b>${c}</b></span>`).join('')}</div>`;
}
function watchTally() {
  if (meta.mode !== 'vote') return;
  resUnsub && resUnsub();
  resUnsub = DB.on(`${R}/answers/${meta.qIndex}`, (v) => { tallyAns = v || {}; renderTally(); });
}

function drumWait(msg) {
  stage().innerHTML = `<div class="msg"><div class="drum">🥁</div><h2>${msg}</h2><span class="dots"><i></i><i></i><i></i></span></div>`;
}

function answerScreen() {
  if (meta.mode === 'survival' && myHearts() <= 0) {
    stage().innerHTML = `<div class="msg"><div class="big-ico">👻</div><h2>คุณตกรอบแล้ว</h2><p class="soft">ดูเพื่อนๆ เล่นต่อบนจอใหญ่ เป็นกำลังใจให้เพื่อนนะ!</p></div>`;
    return;
  }
  if (meta.mode === 'vote' && me?.vteam == null) return showTeamPick();
  if (meta.mode === 'vote') show('play');
  const n = cur.choices.length;
  stage().innerHTML = `
    <div class="tbar"><i id="tFill"></i></div>
    ${meta.showQ ? `<div class="q-mini-card">${esc(cur.text)}</div>` : ''}
    ${meta.mode === 'vote' ? '<div class="team-tally" id="tally"></div>' : ''}
    <div class="pans n${n}">${cur.choices.map((c, k) => `
      <button class="ans a${k}" data-k="${k}"><span class="shape">${SHAPES[k]}</span>${meta.showQ ? `<span class="lbl">${esc(c)}</span>` : ''}</button>`).join('')}</div>`;
  const T = cur.time * 1000;
  const tick = () => {
    const left = Math.max(0, T - (DB.now() - meta.qStartAt));
    const f = $('#tFill'); if (f) { f.style.width = (left / T) * 100 + '%'; f.classList.toggle('hurry', left < 5000); }
    if (left <= 0) { clearInterval(timerH); timerH = null; if (answeredQ !== meta.qIndex) timeUp(); }
  };
  tick(); timerH = setInterval(tick, 100);
  $$('.pans .ans').forEach((b) => (b.onclick = () => submit(+b.dataset.k)));
  watchTally(); renderTally();
}

async function submit(k) {
  const qi = meta.qIndex;
  if (answeredQ === qi) return;
  answeredQ = qi;
  sfx.tap();
  if (navigator.vibrate) navigator.vibrate(30);
  $$('.pans .ans').forEach((b) => { b.disabled = true; b.classList.toggle('picked', +b.dataset.k === k); });
  try { await DB.set(`${R}/answers/${qi}/${DB.uid}`, { choice: k, at: TS }); }
  catch (e) { console.error(e); }
  setTimeout(() => waitScreen(k), 350);
}

function waitScreen(k) {
  if (meta.state !== 'question') return;
  clearInterval(timerH); timerH = null;
  const fast = ['ไวมาก! ⚡', 'ส่งแล้ว! 🚀', 'เยี่ยม! ✨', 'ล็อกคำตอบ! 🔒'][Math.floor(Math.random() * 4)];
  const vote = meta.mode === 'vote';
  stage().innerHTML = `<div class="msg"><div class="picked-shape a${k}">${SHAPES[k]}</div><h2>${vote ? 'โหวตแล้ว! 🗳️' : fast}</h2>
    ${vote ? '<div class="team-tally" id="tally"></div><p class="soft">ตัวเลือกที่ได้เสียงมากสุดในทีมจะเป็นคำตอบของทีม</p>' : '<p class="soft">รอเพื่อนๆ ตอบ…</p>'}<span class="dots"><i></i><i></i><i></i></span></div>`;
  if (vote) { if (!resUnsub) watchTally(); renderTally(); }
}

function timeUp() {
  stage().innerHTML = `<div class="msg"><div class="big-ico">⏰</div><h2>หมดเวลา!</h2><p class="soft">รอเฉลย…</p></div>`;
}

function modeLine(r) {
  if (meta.mode === 'survival') {
    if (r.mercy) return `<div class="streak">😅 ผิดกันหมดทั้งห้อง — ข้อนี้ไม่เสียหัวใจ</div>`;
    if (r.outNow) return `<div class="streak out">👻 หัวใจหมดแล้ว — ตกรอบ!</div>`;
    if (r.lost) return `<div class="streak">💔 เสียหัวใจ 1 ดวง · ${hearts(r.hearts, maxH())}</div>`;
    return `<div class="hp-line">${hearts(r.hearts, maxH())}</div>`;
  }
  if (meta.mode === 'team' && r.team != null) {
    const t = TEAMS[r.team];
    return `<div class="team-chip" style="background:${t.c}">${t.e} ${ r.correct ? 'ช่วย' + t.name + 'ทำคะแนน!' : t.name + ' สู้ต่อ!'}</div>`;
  }
  return '';
}

function voteResult(r) {
  if (r.team == null) {
    stage().innerHTML = `<div class="msg"><div class="big-ico">❔</div><h2>คุณยังไม่มีทีม</h2><p class="soft">ข้อนี้ไม่ได้คะแนน</p></div>`;
    return;
  }
  const ok = r.teamCorrect;
  const I = teamInfo('vote', r.team);
  const pts = r.gained + r.bonus;
  document.body.classList.remove('flash-ok', 'flash-bad'); void document.body.offsetWidth;
  document.body.classList.add(ok ? 'flash-ok' : 'flash-bad');
  stage().innerHTML = `<div class="msg result ${ok ? 'ok' : 'bad'}">
    <div class="team-chip" style="background:${I.c}">${I.e} ${I.name}</div>
    <div class="res-ico">${ok ? '✓' : r.decision == null ? '⏰' : '✗'}</div>
    <h1>${ok ? 'ทีมตอบถูก!' : r.decision == null ? 'ทีมไม่ได้ตอบ' : 'ทีมตอบผิด'}</h1>
    ${r.decision != null ? `<div class="vote-sum">ทีมเลือก <span class="vs a${r.decision}">${SHAPES[r.decision]}</span> ${r.count}/${r.voted} เสียง${r.tie ? '<br><small>เสียงเท่ากัน — ใช้ตัวที่ได้เสียงครบก่อน ⚡</small>' : ''}</div>` : ''}
    ${ok ? `<div class="plus">+<b id="plusN">0</b></div>` : `<p class="soft">คำตอบที่ถูก: <b>${esc(cur?.choices?.[cur.correct] ?? '')}</b></p>`}
    <p class="soft">${r.answered ? (r.correct ? 'คุณโหวตถูก 👍' : `คุณโหวต <span class="vs sm a${r.choice}">${SHAPES[r.choice]}</span>`) : 'คุณไม่ได้โหวตข้อนี้'}</p>
    ${r.bonus ? `<div class="streak">🔥 ทีมถูกติดกัน ${r.streak} ข้อ · โบนัส +${r.bonus}</div>` : ''}
    <p class="soft">👀 ดูอันดับบนจอใหญ่</p>
  </div>`;
  if (ok) { sfx.correct(); countUp($('#plusN'), 0, pts, 900); } else sfx.wrong();
}

function resultScreen(r) {
  if (r.alive === false) {
    stage().innerHTML = `<div class="msg"><div class="big-ico">👻</div><h2>คุณตกรอบแล้ว</h2><p class="soft">ดูเฉลยบนจอใหญ่</p></div>`;
    return;
  }
  if (meta.mode === 'vote') return voteResult(r);
  const ok = r.correct;
  const pts = r.gained + r.bonus;
  document.body.classList.remove('flash-ok', 'flash-bad'); void document.body.offsetWidth;
  document.body.classList.add(ok ? 'flash-ok' : 'flash-bad');
  stage().innerHTML = `<div class="msg result ${ok ? 'ok' : 'bad'}">
    <div class="res-ico">${ok ? '✓' : r.answered ? '✗' : '⏰'}</div>
    <h1>${ok ? 'ถูกต้อง!' : r.answered ? 'ยังไม่ถูกนะ' : 'ไม่ทันเวลา'}</h1>
    ${ok ? `<div class="plus">+<b id="plusN">0</b></div>` : `<p class="soft">คำตอบที่ถูก: <b>${esc(cur?.choices?.[cur.correct] ?? '')}</b></p>`}
    ${ok && r.ms != null ? `<p class="soft">ตอบใน ${(r.ms / 1000).toFixed(1)} วินาที</p>` : ''}
    ${r.bonus ? `<div class="streak">🔥 ถูกติดกัน ${r.streak} ข้อ · โบนัส +${r.bonus}</div>` : r.streak >= 2 ? `<div class="streak">🔥 ถูกติดกัน ${r.streak} ข้อ</div>` : ''}
    ${modeLine(r)}
    <p class="soft">👀 ดูอันดับบนจอใหญ่</p>
  </div>`;
  if (ok) { sfx.correct(); countUp($('#plusN'), 0, pts, 900); } else sfx.wrong();
}
