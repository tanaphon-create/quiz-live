// โหมดห้องเรียน (มือถือนักเรียน): เข้ากลุ่ม · ปุ่มกดแข่ง · ถูกสุ่ม · พิมพ์ความคิดเห็น
import { connect, TS } from './db.js';
import { sfx, unlock } from './sound.js';
import { $, $$, esc, show, toast, confetti, mascotOf } from './ui.js';
import { renderAvatar } from './avatar.js?v=20261126a';

const qs = new URLSearchParams(location.search);
const ME = 'quizlive:buzzme';
const saved = (() => { try { return JSON.parse(localStorage.getItem(ME)) || {}; } catch { return {}; } })();
let DB, pin = qs.get('pin') || '', R = '', meta = null, groups = {}, me = null, buzz = {}, presses = {}, pressUnsub = null, myNotes = 0, lastPickAt = 0, joined = false;

$('#pinIn').value = pin;
$('#codeIn').value = saved.code || '';
if (pin) $('#pinIn').hidden = true;

const ready = connect().then((d) => { DB = d; return d; }).catch(() => toast('เชื่อมต่อไม่ได้ ลองรีเฟรช', 5000));
ready.then(async () => {
  if (!pin) { $('#bzRoom').textContent = 'ใส่รหัสห้องจากจอครู'; return; }
  await loadRoom();
  // กลับเข้าห้องเดิม (เผลอรีเฟรช)
  const p = await DB.get(`${R}/players/${DB.uid}`);
  if (p && meta && meta.state !== 'end') { me = p; enter(); }
});
async function loadRoom() {
  R = `quiz/live/${pin}`;
  meta = await DB.get(`${R}/meta`);
  if (!meta || meta.state === 'end') { $('#bzRoom').textContent = meta ? 'คาบนี้จบแล้ว' : 'ไม่พบห้องนี้'; $('#pinIn').hidden = false; return false; }
  $('#bzRoom').textContent = meta.title;
  const custom = meta.mode !== 'book';
  $('#nameIn').hidden = !custom; $('#codeLab').hidden = $('#codeIn').hidden = custom;
  if (custom) $('#nameIn').value = saved.name || '';
  return true;
}
const hashCode = async (p, code) => {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(p + ':' + String(code).trim()));
  return [...new Uint8Array(d)].slice(0, 12).map((b) => b.toString(16).padStart(2, '0')).join('');
};

$('#joinForm').onsubmit = async (e) => {
  e.preventDefault(); unlock();
  if (!(await ready)) return;
  const p = ($('#pinIn').value || '').replace(/\D/g, '');
  if (p.length !== 6) return toast('PIN ต้องเป็นตัวเลข 6 หลัก');
  if (p !== pin || !meta) { pin = p; if (!(await loadRoom())) return; }
  if (meta.mode === 'book') {
    const code = $('#codeIn').value.replace(/\s/g, '');
    if (!/^\d{1,10}$/.test(code)) return toast('ใส่เลขประจำตัวเป็นตัวเลข');
    const hit = await DB.get(`${R}/codes/${await hashCode(pin, code)}`);
    localStorage.setItem(ME, JSON.stringify({ ...saved, code }));
    if (!hit) return toast('ไม่พบเลขนี้ในกลุ่มของห้องนี้ — ตรวจเลขอีกครั้ง หรือบอกครู', 4000);
    await join(hit.n || code, hit.g);
  } else {
    const name = $('#nameIn').value.trim();
    if (!name) return toast('พิมพ์ชื่อเล่นก่อนนะ');
    localStorage.setItem(ME, JSON.stringify({ ...saved, name }));
    groups = (await DB.get(`${R}/groups`)) || {};
    $('#grpGrid').innerHTML = Object.entries(groups).sort((a, b) => a[1].no - b[1].no).map(([gid, g]) => `<button class="tnum" style="--tc:${g.color}" data-g="${gid}"><b>${g.no}</b><small>${esc(g.name)}</small></button>`).join('');
    $('#grpGrid').onclick = (ev) => { const b = ev.target.closest('[data-g]'); if (b) join(name, b.dataset.g); };
    show('group');
  }
};
async function join(name, gid) {
  me = { name, gid, at: TS };
  await DB.set(`${R}/players/${DB.uid}`, me);
  sfx.pop(); enter();
}

function enter() {
  joined = true;
  show('main');
  DB.onDisconnect(`${R}/players/${DB.uid}/online`, false);
  DB.connected((c) => c && joined && DB.update(`${R}/players/${DB.uid}`, { online: true }));
  DB.on(`${R}/players/${DB.uid}`, (p) => { if (!p && joined) { joined = false; $('#bzBody').innerHTML = '<div class="bz-msg"><h2>ออกจากห้องแล้ว</h2><a class="btn" href="buzz.html">เข้าใหม่</a></div>'; } else if (p) me = p; });
  DB.on(`${R}/meta`, (m) => { const was = meta?.state; meta = m || {}; if (meta.state !== was && meta.state === 'reflect') hidePicked(); render(); });
  DB.on(`${R}/groups`, (g) => { groups = g || {}; head(); });
  DB.on(`${R}/buzz`, (b) => {
    const prev = buzz.rkey; buzz = b || {};
    if (buzz.rkey !== prev) { pressUnsub && pressUnsub(); presses = {}; pressUnsub = DB.on(`${R}/presses/${buzz.rkey}`, (v) => { presses = v || {}; render(); }); }
    if (buzz.count) sfx.count(buzz.count);
    if (buzz.armed && !b?.winner) { if (navigator.vibrate) navigator.vibrate(60); }
    if (buzz.winner === me?.gid && !buzz.armed) { sfx.correct(); confetti(90, 2500); }
    render();
  });
  DB.on(`${R}/pick`, (p) => {
    if (!p || !p.at || p.at <= lastPickAt) { if (p?.at) lastPickAt = p.at; return; }
    const first = lastPickAt === 0; lastPickAt = p.at; if (first && Date.now() - p.at > 8000) return;
    const mine = (p.kind === 'student' && p.uid === DB.uid) || (p.kind === 'group' && p.gid === me?.gid);
    if (!mine) return;
    $('#pickedTxt').textContent = p.kind === 'group' ? `กลุ่มของคุณถูกสุ่ม!` : `คุณถูกสุ่ม!`;
    $('#pickedOv').hidden = false; sfx.fanfare(); if (navigator.vibrate) navigator.vibrate([80, 60, 80]);
    clearTimeout(pickH); pickH = setTimeout(hidePicked, 5000);
  });
  $('#pickedOv').onclick = hidePicked;
  head();
}
let pickH = null;
function hidePicked() { clearTimeout(pickH); $('#pickedOv').hidden = true; }
function head() {
  const g = groups[me?.gid]; if (!g) return;
  document.documentElement.style.setProperty('--gc', g.color);
  $('#bzGno').innerHTML = renderAvatar(mascotOf(g), { bg: false }); $('#bzGname').textContent = `${g.name}`; $('#bzMe').textContent = me.name; $('#bzScore').textContent = g.score || 0;
}

function order() {
  const first = {};
  Object.entries(presses).sort((a, b) => (a[1].at - b[1].at) || a[0].localeCompare(b[0])).forEach(([uid, p]) => { if (!first[p.gid]) first[p.gid] = { ...p, uid }; });
  return Object.values(first).sort((a, b) => a.at - b.at);
}
function render() {
  if (!joined || !meta) return;
  const body = $('#bzBody');
  if (meta.state === 'end') { body.innerHTML = '<div class="bz-msg"><div class="po-ico">👋</div><h2>จบคาบแล้ว ขอบคุณที่ร่วมกิจกรรม!</h2></div>'; return; }
  if (meta.state === 'reflect') return renderReflect(body);
  const ord = order();
  const myRank = ord.findIndex((p) => p.gid === me.gid);
  const iPressed = !!presses[DB.uid];
  const mateFirst = myRank >= 0 && !iPressed;
  let state, label, sub;
  if (buzz.winner && !buzz.armed) {
    const w = groups[buzz.winner];
    state = buzz.winner === me.gid ? 'win' : 'idle';
    label = buzz.winner === me.gid ? '🎉 ถูกต้อง!' : `${esc(w?.name || '')} ตอบถูก`;
    sub = buzz.winner === me.gid ? `กลุ่มคุณได้ +${buzz.pts || 1}` : 'รอคำถามต่อไป';
  } else if (buzz.count) { state = 'count'; label = String(buzz.count); sub = 'เตรียมกด…'; }
  else if (buzz.armed && myRank < 0) { state = 'armed'; label = 'กด!'; sub = 'กดก่อนได้ตอบก่อน'; }
  else if (myRank >= 0) {
    const wrong = new Set(buzz.wrong || []);
    const cur = ord.find((p) => !wrong.has(p.gid));
    state = cur?.gid === me.gid ? 'first' : 'done';
    label = cur?.gid === me.gid ? 'ได้ตอบ!' : wrong.has(me.gid) ? 'ตอบผิด' : `อันดับ ${myRank + 1}`;
    sub = cur?.gid === me.gid ? 'กลุ่มคุณได้สิทธิ์ตอบ' : mateFirst ? 'เพื่อนในกลุ่มกดให้แล้ว' : 'กดแล้ว รอผล';
  } else { state = 'idle'; label = 'รอครู'; sub = 'ปุ่มจะกดได้เมื่อครูสั่ง'; }
  body.innerHTML = `<div class="bz-btn-wrap"><button class="bz-btn ${state}" id="bzBtn" ${state === 'armed' ? '' : 'disabled'}><i class="face" aria-hidden="true"><i class="eye"></i><i class="eye"></i><i class="mouth"></i></i><span>${label}</span></button><p class="bz-hint">${sub}</p></div>`;
  $('#bzBtn').onclick = press;
}
async function press() {
  if (!buzz.armed || presses[DB.uid]) return;
  $('#bzBtn').disabled = true; $('#bzBtn').classList.add('pressed');
  const wrap = document.querySelector('.bz-btn-wrap');
  for (let k = 0; k < 10; k++) { const s = document.createElement('i'); s.className = 'burst'; s.textContent = ['♥', '★', '✦', '●'][k % 4]; const a = (k / 10) * Math.PI * 2; s.style.cssText = `--x:${Math.round(Math.cos(a) * 170)}px;--y:${Math.round(Math.sin(a) * 170)}px`; wrap.append(s); s.addEventListener('animationend', () => s.parentNode && s.parentNode.removeChild(s)); }
  if (navigator.vibrate) navigator.vibrate(40);
  sfx.tap();
  try { await DB.set(`${R}/presses/${buzz.rkey}/${DB.uid}`, { gid: me.gid, name: me.name, at: TS }); }
  catch (e) { toast('กดไม่ทัน — ครูยังไม่เปิดปุ่ม หรือรอบนี้ปิดแล้ว'); }
}

function renderReflect(body) {
  if (body.querySelector('#rfText')) { $('#rfPromptS').textContent = meta.prompt || ''; return; }
  body.innerHTML = `<div class="rf-me card">
    <h2>💬 ความคิดเห็นท้ายคาบ</h2>
    <p class="rf-p" id="rfPromptS">${esc(meta.prompt || '')}</p>
    <textarea class="input" id="rfText" rows="4" maxlength="300" placeholder="พิมพ์สิ่งที่ได้เรียนรู้ หรือความคิดเห็นของคุณ…"></textarea>
    <div class="rf-row"><small id="rfLen">0/300</small><span class="sp"></span><button class="btn green" id="rfSend">ส่ง ➤</button></div>
    <p class="muted" id="rfSent">${myNotes ? `ส่งแล้ว ${myNotes} ข้อความ — ส่งเพิ่มได้` : 'ข้อความจะขึ้นบนจอหน้าห้อง'}</p></div>`;
  const ta = $('#rfText');
  ta.oninput = () => ($('#rfLen').textContent = `${ta.value.length}/300`);
  $('#rfSend').onclick = async () => {
    const text = ta.value.trim(); if (!text) return toast('พิมพ์ข้อความก่อนนะ');
    if (myNotes >= 5) return toast('ส่งได้สูงสุด 5 ข้อความ');
    $('#rfSend').disabled = true;
    try {
      await DB.set(`${R}/notes/${Date.now().toString(36)}${DB.uid.slice(0, 6)}`, { uid: DB.uid, gid: me.gid, name: me.name, text, at: TS });
      myNotes++; ta.value = ''; ta.oninput(); sfx.pop();
      $('#rfSent').textContent = `ส่งแล้ว ${myNotes} ข้อความ — ขึ้นจอแล้ว ✓`;
    } catch (e) { toast('ส่งไม่สำเร็จ — ครูอาจปิดรับความคิดเห็นแล้ว'); }
    $('#rfSend').disabled = false;
  };
}
