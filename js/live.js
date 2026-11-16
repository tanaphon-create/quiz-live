// โหมดห้องเรียน (จอครู): คะแนนกลุ่ม · ปุ่มกดแข่ง · สุ่มตอบ · ความคิดเห็นท้ายคาบ
import { connect, TS, isTeacher } from './db.js';
import { SCOREBOOK_API } from './config.js';
import { sfx, setMuted, isMuted, unlock, music, currentSong } from './sound.js';
import { $, $$, esc, wait, show, toast, confetti, VCOLORS, MASCOTS, mascotOf } from './ui.js';
import { renderAvatar } from './avatar.js';
const av = (g) => renderAvatar(mascotOf(g), { bg: false });

const qs = new URLSearchParams(location.search);
let DB = null, authed = '';
let pin = '', R = '', meta = {}, groups = {}, players = {}, buzz = {}, presses = {}, notes = {}, pick = null;
let tab = 'scores', unsubs = [], pressUnsub = null, books = null, src = 'book';
let wrong = new Set(), award = 1, randKind = 'student', randDone = new Set(), randAll = false, notesNames = true;

/* ───────── เชื่อมต่อ + ล็อกอิน (ใช้ร่วมกับสมุดคะแนน) ───────── */
const ready = connect({ host: true }).then((d) => { DB = d; d.onUser(onUser); return d; })
  .catch((e) => { console.error(e); $('#loginMsg').textContent = 'เชื่อมต่อไม่ได้ — ตรวจอินเทอร์เน็ตแล้วรีเฟรช'; });
async function onUser(u) {
  if (u && isTeacher(u)) {
    if (authed === u.uid) return;
    authed = u.uid; show('setup'); loadBooks();
    return;
  }
  authed = ''; show('login');
  const wrongAcc = u && !u.isAnonymous;
  $('#loginMsg').innerHTML = wrongAcc ? `⛔ อีเมล <b>${esc(u.email)}</b> ไม่มีสิทธิ์` : '';
  $('#loginBtn').hidden = !!wrongAcc; $('#switchBtn').hidden = !wrongAcc;
}
$('#loginBtn').onclick = async () => { if (!(await ready)) return; try { await DB.signIn(); } catch (e) { $('#loginMsg').textContent = e.code === 'auth/popup-closed-by-user' ? '' : 'ล็อกอินไม่สำเร็จ ลองใหม่'; } };
$('#switchBtn').onclick = () => DB.signOut();

async function bookApi(body) {
  const tok = DB.mode === 'firebase' ? await DB.user().getIdToken() : 'local-test';
  const r = await fetch(SCOREBOOK_API, { method: 'POST', body: JSON.stringify({ ...body, idToken: tok }) });
  let j; try { j = await r.json(); } catch { throw { error: 'bad_response' }; }
  if (!j.ok) throw j;
  return j;
}

/* ───────── ตั้งค่า ───────── */
$('#srcSeg').onclick = (e) => {
  const b = e.target.closest('[data-src]'); if (!b) return;
  src = b.dataset.src; $$('#srcSeg button').forEach((x) => x.classList.toggle('on', x === b));
  $('#srcBook').hidden = src !== 'book'; $('#srcCustom').hidden = src !== 'custom';
};
async function loadBooks() {
  try { books = (await bookApi({ action: 'classes' })).classes || []; }
  catch (e) { books = []; $('#bookHint').textContent = 'โหลดสมุดคะแนนไม่ได้ — ใช้ “กำหนดจำนวนกลุ่มเอง” แทนได้'; }
  const want = qs.get('class');
  $('#selClass').innerHTML = books.map((c) => `<option value="${esc(c.id)}" ${c.id === want ? 'selected' : ''}>${esc(c.name)}${c.subject ? ' · ' + esc(c.subject) : ''}</option>`).join('') || '<option value="">— ไม่มีห้อง —</option>';
  fillSets();
}
function fillSets() {
  const c = books?.find((x) => x.id === $('#selClass').value);
  const sets = c?.sets || [];
  const want = qs.get('set');
  $('#selSet').innerHTML = sets.map((s) => `<option value="${esc(s.id)}" ${s.id === want ? 'selected' : ''}>${esc(s.name)} (${s.groups.length} กลุ่ม)</option>`).join('') || '<option value="">— ห้องนี้ยังไม่มีกลุ่ม —</option>';
  $('#bookHint').textContent = !c ? '' : sets.length ? 'นักเรียนพิมพ์เลขประจำตัว ระบบจะพาเข้ากลุ่มของตัวเองให้' : 'ห้องนี้ยังไม่ได้จัดกลุ่ม — ไปที่สมุดคะแนน → 👥 จัดกลุ่ม หรือเลือก “กำหนดจำนวนกลุ่มเอง”';
  if (c && !$('#liveTitle').value) $('#liveTitle').placeholder = c.name;
}
$('#selClass').onchange = fillSets;

const hashCode = async (p, code) => {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(p + ':' + String(code).trim()));
  return [...new Uint8Array(d)].slice(0, 12).map((b) => b.toString(16).padStart(2, '0')).join('');
};

$('#openBtn').onclick = async () => {
  unlock();
  if (!(await ready)) return;
  let gl = [], codes = {}, title = $('#liveTitle').value.trim(), sub = '', classId = '';
  do { pin = String(100000 + Math.floor(Math.random() * 900000)); } while (await DB.get(`quiz/live/${pin}/meta`));
  if (src === 'book') {
    const c = books?.find((x) => x.id === $('#selClass').value);
    const set = c?.sets.find((s) => s.id === $('#selSet').value);
    if (!c || !set) return toast('เลือกห้องและชุดกลุ่มก่อน (หรือใช้แบบกำหนดเอง)');
    const nameOf = new Map(c.students.map((s) => [s.code, s.name]));
    gl = set.groups.map((g) => ({ name: g.name, members: g.members.map((code) => nameOf.get(code) || code) }));
    for (let i = 0; i < set.groups.length; i++) for (const code of set.groups[i].members) codes[await hashCode(pin, code)] = { g: 'g' + (i + 1), n: nameOf.get(code) || '' };
    title ||= c.name; sub = `${c.name} · ${set.name}`; classId = c.id;
  } else {
    const n = Math.max(2, Math.min(12, +$('#nGroups').value || 6));
    gl = Array.from({ length: n }, (_, i) => ({ name: 'กลุ่ม ' + (i + 1), members: [] }));
    title ||= 'กิจกรรมกลุ่ม'; sub = `${n} กลุ่ม · นักเรียนเลือกกลุ่มเอง`;
  }
  const gobj = {};
  gl.forEach((g, i) => (gobj['g' + (i + 1)] = { no: i + 1, name: g.name, color: VCOLORS[i % VCOLORS.length], score: 0, members: g.members, avatar: MASCOTS[i % MASCOTS.length] }));
  R = `quiz/live/${pin}`;
  await DB.set(R, {
    meta: { hostUid: DB.uid, title, sub, mode: src, classId, state: 'live', prompt: 'วันนี้ได้เรียนรู้อะไร / มีความคิดเห็นอย่างไร?', createdAt: TS },
    groups: gobj, codes, buzz: { armed: false, rkey: 'r0' },
  });
  enterLive();
};

/* ───────── จอแสดงผล ───────── */
function enterLive() {
  $('#lvTitle').textContent = meta.title || $('#liveTitle').value || '';
  $('#lvPin').textContent = pin;
  show('live');
  const on = (p, cb) => unsubs.push(DB.on(`${R}/${p}`, cb));
  on('meta', (v) => { meta = v || {}; $('#lvTitle').textContent = meta.title || ''; $('#lvSub').textContent = meta.sub || ''; if (tab === 'reflect') renderTab(); });
  on('groups', (v) => { groups = v || {}; if (tab !== 'buzz' || !buzz.armed) renderTab(); });
  on('players', (v) => { players = v || {}; $('#lvJoined').textContent = Object.values(players).filter((p) => p.online !== false).length; if (tab === 'scores' || tab === 'random') renderTab(); });
  on('buzz', (v) => {
    const prev = buzz.rkey; buzz = v || {};
    if (buzz.rkey !== prev) { pressUnsub && pressUnsub(); presses = {}; pressUnsub = DB.on(`${R}/presses/${buzz.rkey}`, (pv) => { const before = Object.keys(presses).length; presses = pv || {}; if (Object.keys(presses).length && !before) sfx.first(); if (tab === 'buzz') renderTab(); }); }
    if (tab === 'buzz') renderTab();
  });
  on('notes', (v) => { const n0 = Object.keys(notes).length; notes = v || {}; if (Object.keys(notes).length > n0 && tab === 'reflect') sfx.pop(); if (tab === 'reflect') renderTab(); });
  renderTab();
}
$('#liveTabs').onclick = (e) => {
  const b = e.target.closest('[data-tab]'); if (!b) return;
  tab = b.dataset.tab; $$('#liveTabs button').forEach((x) => x.classList.toggle('on', x === b)); sfx.tap();
  if (meta.state === 'reflect' && tab !== 'reflect') DB.update(R, { 'meta/state': 'live' });
  renderTab();
};
$('#lvMute').onclick = () => { setMuted(!isMuted()); $('#lvMute').textContent = isMuted() ? '🔇' : '🔊'; bgmFor(); };
/* ───────── เพลงประกอบ: สดใสตอนปกติ · ตื่นเต้นตอนกดแข่ง · นุ่มตอนเขียนความคิดเห็น ───────── */
let bgm = (() => { try { return localStorage.getItem('quizlive:bgm') !== '0'; } catch { return true; } })(), counting = false;
function bgmFor() {
  $('#lvMusic')?.classList.toggle('off', !bgm);
  if (!R || !bgm || counting || isMuted()) { if (currentSong()) music(null); return; }
  const want = tab === 'reflect' && meta.state === 'reflect' ? 'think'
    : tab === 'buzz' && buzz.armed && !Object.keys(presses).length ? 'question' : 'classroom';
  if (currentSong() !== want) music(want);
}
$('#lvMusic').onclick = () => { bgm = !bgm; try { localStorage.setItem('quizlive:bgm', bgm ? '1' : '0'); } catch {} unlock(); bgmFor(); toast(bgm ? '🎵 เปิดเพลงประกอบ' : 'ปิดเพลงประกอบ'); };

const main = () => $('#liveMain');
const gList = () => Object.entries(groups).sort((a, b) => a[1].no - b[1].no);
const joinedIn = (gid) => Object.values(players).filter((p) => p.gid === gid && p.online !== false);
function renderTab() {
  if (!R) return;
  ({ scores: renderScores, buzz: renderBuzz, random: renderRandom, reflect: renderReflect })[tab]();
  bgmFor();
}

/* — คะแนนกลุ่ม — */
function renderScores() {
  const max = Math.max(1, ...gList().map(([, g]) => g.score || 0));
  main().innerHTML = `<div class="score-grid">${gList().map(([gid, g]) => {
    const joined = joinedIn(gid).map((p) => p.name);
    const mem = meta.mode === 'book' ? (g.members || []) : joined;
    const lead = (g.score || 0) === max && max > 0;
    return `<article class="gcard ${lead ? 'lead' : ''}" style="--gc:${g.color}" data-card="${gid}">
      <div class="gmascot">${av(g)}</div>
      <div class="gc-top"><span class="gno">${g.no}</span><b class="gname">${esc(g.name)}</b>${lead ? '<span class="crown">👑</span>' : ''}</div>
      <div class="gscore" data-score="${gid}">${g.score || 0}</div>
      <div class="gbtns"><button data-add="${gid}" data-v="-1">−1</button><button data-add="${gid}" data-v="1">+1</button><button data-add="${gid}" data-v="2">+2</button><button data-add="${gid}" data-v="3">+3</button></div>
      <div class="gmem">${mem.length ? mem.map((n) => `<span class="${joined.includes(n) ? 'in' : ''}">${esc(n)}</span>`).join('') : '<em>ยังไม่มีสมาชิกเข้าระบบ</em>'}</div>
    </article>`;
  }).join('')}</div>`;
}
async function addScore(gid, v) {
  const g = groups[gid]; if (!g) return;
  await DB.update(R, { [`groups/${gid}/score`]: Math.max(0, (g.score || 0) + v) });
  if (v > 0) sfx.correct(); else sfx.tap();
  const el = document.querySelector(`[data-score="${gid}"]`);
  if (el) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
  const card = document.querySelector(`[data-card="${gid}"]`);
  if (card) {
    const m = card.querySelector('.gmascot'); m.classList.remove('jump', 'sad'); void m.offsetWidth; m.classList.add(v > 0 ? 'jump' : 'sad');
    const f = document.createElement('span'); f.className = 'float-pts' + (v < 0 ? ' neg' : ''); f.textContent = (v > 0 ? '+' : '') + v;
    card.append(f); f.addEventListener('animationend', () => f.parentNode && f.parentNode.removeChild(f));
    if (v > 0) for (let k = 0; k < 6; k++) { const s = document.createElement('i'); s.className = 'spark'; s.textContent = ['★', '♥', '✦'][k % 3]; s.style.cssText = `--x:${Math.round(Math.random() * 160 - 80)}px;--y:${Math.round(-40 - Math.random() * 70)}px;--d:${k * 40}ms`; card.append(s); s.addEventListener('animationend', () => s.parentNode && s.parentNode.removeChild(s)); }
  }
}
main().addEventListener('click', (e) => {
  const a = e.target.closest('[data-add]'); if (a) return addScore(a.dataset.add, +a.dataset.v);
});

/* — ปุ่มกดแข่ง — */
function order() {
  const first = {};
  Object.entries(presses).sort((a, b) => (a[1].at - b[1].at) || a[0].localeCompare(b[0])).forEach(([uid, p]) => { if (!first[p.gid]) first[p.gid] = { ...p, uid }; });
  return Object.values(first).sort((a, b) => a.at - b.at);
}
function renderBuzz() {
  const ord = order(), t0 = ord[0]?.at;
  const cur = ord.find((p) => !wrong.has(p.gid));
  let stage;
  if (buzz.winner && !buzz.armed) {
    const g = groups[buzz.winner] || {};
    stage = `<div class="bz-win" style="--gc:${g.color}"><div class="bz-hero jump-loop">${av(g)}</div><div class="bz-big">🎉 ${esc(g.name || '')} ตอบถูก!</div><div class="bz-sub">ได้ +${buzz.pts || 1} คะแนน · รวม ${g.score || 0}</div></div>`;
  } else if (!buzz.armed && !ord.length) {
    stage = `<div class="bz-idle"><div class="bz-crowd">${gList().map(([, g]) => `<div class="bzm" style="--gc:${g.color}">${av(g)}<small>${esc(g.name)}</small></div>`).join('')}</div><div class="bz-big">พร้อมไหม? 🔔</div><div class="bz-sub">อ่านคำถามให้จบ แล้วกด “เริ่มให้กด” — ใครกดก่อนเริ่มจะไม่นับ</div></div>`;
  } else if (!ord.length) {
    stage = `<div class="bz-armed"><div class="bz-crowd shake">${gList().map(([, g]) => `<div class="bzm" style="--gc:${g.color}">${av(g)}<small>${esc(g.name)}</small></div>`).join('')}</div><div class="bz-big">กดเลย!</div><div class="bz-sub">รอกลุ่มแรกกดปุ่ม…</div></div>`;
  } else if (cur) {
    const g = groups[cur.gid] || {};
    stage = `<div class="bz-first" style="--gc:${g.color}"><div class="bz-hero">${av(g)}<span class="bz-no">${g.no}</span></div><div><div class="bz-big">${esc(g.name)} ได้ตอบ!</div><div class="bz-sub">กดโดย ${esc(cur.name || '')}${cur.at !== t0 ? ` · ช้ากว่ากลุ่มแรก ${((cur.at - t0) / 1000).toFixed(2)} วิ` : ''}</div></div></div>`;
  } else stage = `<div class="bz-idle"><div class="bz-big">ทุกกลุ่มที่กดตอบผิด</div><div class="bz-sub">กด “รอบใหม่” เพื่อถามข้อต่อไป</div></div>`;
  main().innerHTML = `<div class="bz-wrap">
    <div class="bz-stage">${stage}</div>
    <div class="bz-side">
      <h3>ลำดับการกด</h3>
      <ol class="bz-order">${ord.map((p, i) => { const g = groups[p.gid] || {}; return `<li class="${wrong.has(p.gid) ? 'x' : p === cur ? 'cur' : ''}" style="--gc:${g.color}"><span class="o-no">${i + 1}</span><b>${esc(g.name)}</b><small>${i ? '+' + ((p.at - t0) / 1000).toFixed(2) + ' วิ' : 'เร็วที่สุด'}</small>${wrong.has(p.gid) ? '<em>✗</em>' : ''}</li>`; }).join('') || '<li class="empty">ยังไม่มีใครกด</li>'}</ol>
    </div>
    <div class="bz-ctrl">
      ${cur && !buzz.winner ? `<span class="muted">ให้คะแนน</span>${[1, 2, 3].map((v) => `<button class="chip ${award === v ? 'on' : ''}" data-award="${v}">+${v}</button>`).join('')}
        <button class="btn green big" id="bzRight">✓ ตอบถูก</button><button class="btn red big" id="bzWrong">✗ ผิด / ให้กลุ่มถัดไป</button>` : ''}
      <span class="sp"></span>
      ${buzz.armed && !ord.length ? '<button class="btn ghost" id="bzCancel">ยกเลิก</button>' : ''}
      <button class="btn gold big" id="bzArm">${!buzz.armed && !ord.length && !buzz.winner ? '🔔 เริ่มให้กด' : '🔄 รอบใหม่ (เริ่มให้กด)'}</button>
    </div></div>`;
  $$('[data-award]').forEach((b) => (b.onclick = () => { award = +b.dataset.award; renderBuzz(); }));
  $('#bzArm').onclick = arm;
  $('#bzCancel') && ($('#bzCancel').onclick = () => DB.update(R, { 'buzz/armed': false }));
  $('#bzRight') && ($('#bzRight').onclick = async () => {
    const g = groups[cur.gid];
    await DB.update(R, { [`groups/${cur.gid}/score`]: (g.score || 0) + award, 'buzz/armed': false, 'buzz/winner': cur.gid, 'buzz/pts': award });
    sfx.fanfare(); confetti(120, 3000);
  });
  $('#bzWrong') && ($('#bzWrong').onclick = () => { wrong.add(cur.gid); sfx.wrong(); DB.update(R, { 'buzz/wrong': [...wrong] }); renderBuzz(); });
}
async function arm() {
  wrong = new Set();
  const rkey = 'r' + Date.now().toString(36);
  await DB.update(R, { buzz: { armed: false, rkey, count: 3 } });
  counting = true; bgmFor();
  for (const n of [3, 2, 1]) { await DB.update(R, { 'buzz/count': n }); sfx.count(n); await wait(700); }
  counting = false;
  await DB.update(R, { 'buzz/armed': true, 'buzz/count': 0, 'buzz/armedAt': TS });
  sfx.go();
}

/* — สุ่มตอบ — */
function randPool() {
  if (randKind === 'group') return gList().map(([gid, g]) => ({ id: gid, name: g.name, sub: `${(meta.mode === 'book' ? g.members : joinedIn(gid).map((p) => p.name)).length} คน`, gid }));
  const list = Object.entries(players).filter(([, p]) => p.online !== false).map(([uid, p]) => ({ id: uid, name: p.name, sub: groups[p.gid]?.name || '', gid: p.gid, uid }));
  if (randAll && meta.mode === 'book') {
    const have = new Set(list.map((x) => x.name));
    gList().forEach(([gid, g]) => (g.members || []).forEach((n) => { if (!have.has(n)) list.push({ id: 'm:' + gid + ':' + n, name: n, sub: g.name, gid }); }));
  }
  return list;
}
function renderRandom() {
  const all = randPool(), left = all.filter((x) => !randDone.has(x.id));
  const doneList = all.filter((x) => randDone.has(x.id));
  main().innerHTML = `<div class="rd-wrap">
    <div class="seg rd-kind"><button data-kind="student" class="${randKind === 'student' ? 'on' : ''}">👤 สุ่มรายบุคคล</button><button data-kind="group" class="${randKind === 'group' ? 'on' : ''}">👥 สุ่มกลุ่ม</button></div>
    ${randKind === 'student' && meta.mode === 'book' ? `<label class="tog rd-all"><input type="checkbox" id="rdAll" ${randAll ? 'checked' : ''}><span></span>รวมคนที่ยังไม่ได้เข้าระบบ</label>` : ''}
    <div class="rd-box" id="rdBox"><div class="rd-mascot" id="rdMascot">${pick && pick.kind === randKind && groups[pick.gid] ? av(groups[pick.gid]) : '<span class="rd-q">?</span>'}</div><div class="rd-name" id="rdName">${pick && pick.kind === randKind ? esc(pick.name) : 'พร้อมไหม?'}</div><div class="rd-sub" id="rdSub">เหลือ ${left.length} จาก ${all.length} ${randKind === 'group' ? 'กลุ่ม' : 'คน'} · ไม่สุ่มซ้ำ</div></div>
    <div class="rd-ctrl"><button class="btn ghost" id="rdReset" ${randDone.size ? '' : 'disabled'}>↺ เริ่มใหม่</button>
      ${pick && pick.gid ? `<button class="btn green" id="rdPlus">+1 ให้${esc(groups[pick.gid]?.name || 'กลุ่ม')}</button>` : ''}
      <button class="btn gold big" id="rdGo" ${left.length ? '' : 'disabled'}>${left.length ? '🎲 สุ่มเลย' : 'ครบแล้ว'}</button></div>
    ${doneList.length ? `<div class="rd-done"><span class="muted">สุ่มแล้ว (แตะเพื่อคืนเข้าวง):</span> ${doneList.map((x) => `<button class="mchip2" data-back="${esc(x.id)}">${esc(x.name)} ↩</button>`).join('')}</div>` : ''}
    ${!all.length ? '<p class="muted">ยังไม่มีนักเรียนเข้าระบบ — ให้นักเรียนสแกน QR ก่อน</p>' : ''}
  </div>`;
  $$('[data-kind]').forEach((b) => (b.onclick = () => { randKind = b.dataset.kind; randDone = new Set(); pick = null; renderRandom(); }));
  $('#rdAll') && ($('#rdAll').onchange = (e) => { randAll = e.target.checked; renderRandom(); });
  $('#rdReset').onclick = () => { randDone = new Set(); pick = null; renderRandom(); };
  $$('[data-back]').forEach((b) => (b.onclick = () => { randDone.delete(b.dataset.back); renderRandom(); }));
  $('#rdPlus') && ($('#rdPlus').onclick = () => addScore(pick.gid, 1).then(renderRandom));
  $('#rdGo').onclick = () => {
    const items = randPool().filter((x) => !randDone.has(x.id)); if (!items.length) return;
    $('#rdGo').disabled = true; $('#rdBox').classList.remove('win'); $('#rdBox').classList.add('spin');
    let n = 0, last = null; const total = matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 18 + Math.floor(Math.random() * 8);
    const tick = () => {
      let it; do { it = items[Math.floor(Math.random() * items.length)]; } while (items.length > 1 && it === last);
      last = it; $('#rdName').textContent = it.name; $('#rdSub').textContent = it.sub; n++; sfx.tick();
      if (groups[it.gid]) $('#rdMascot').innerHTML = av(groups[it.gid]);
      if (n < total) setTimeout(tick, 40 + n * n * 0.8);
      else {
        randDone.add(it.id);
        pick = { kind: randKind, id: it.id, name: it.name, gid: it.gid || '', uid: it.uid || '' };
        DB.update(R, { pick: { ...pick, at: TS } });
        sfx.first(); confetti(80, 2500);
        renderRandom(); $('#rdBox').classList.add('win');
      }
    };
    tick();
  };
}

/* — ความคิดเห็นท้ายคาบ — */
function renderReflect() {
  const open = meta.state === 'reflect';
  const list = Object.entries(notes).sort((a, b) => a[1].at - b[1].at);
  main().innerHTML = `<div class="rf-wrap">
    <div class="rf-head card">
      <div class="rf-q"><span class="muted">หัวข้อ</span><input class="input" id="rfPrompt" maxlength="120" value="${esc(meta.prompt || '')}"></div>
      <div class="rf-acts">
        <label class="tog"><input type="checkbox" id="rfNames" ${notesNames ? 'checked' : ''}><span></span>แสดงชื่อ</label>
        <span class="pill rf-count">💬 ${list.length}</span>
        <button class="btn light sm" id="rfCsv" ${list.length ? '' : 'disabled'}>⤓ CSV</button>
        <button class="btn ${open ? 'red' : 'green'}" id="rfOpen">${open ? '⏸ ปิดรับความคิดเห็น' : '▶ เปิดให้นักเรียนพิมพ์'}</button>
      </div>
    </div>
    ${open ? `<p class="rf-hint">📱 นักเรียนสแกน QR (PIN <b>${pin}</b>) แล้วพิมพ์ความคิดเห็นได้เลย</p>` : ''}
    <div class="rf-notes">${list.map(([id, n]) => { const g = groups[n.gid] || {}; const rot = ((id.charCodeAt(id.length - 1) + id.length) % 5) - 2; return `<div class="note" style="--gc:${g.color || '#A78BFA'};--rot:${rot}deg"><button class="nx" data-del="${id}" title="ลบ">✕</button><p>${esc(n.text)}</p><div class="note-foot">${g.no ? `<span class="nm-av">${av(g)}</span>` : ''}${notesNames ? `<small>${esc(n.name || '')}${g.name ? ' · ' + esc(g.name) : ''}</small>` : ''}</div></div>`; }).join('') || `<div class="rf-empty">${open ? 'รอความคิดเห็นแรก…' : 'กด “เปิดให้นักเรียนพิมพ์” เพื่อเริ่ม'}</div>`}</div>
  </div>`;
  $('#rfPrompt').onchange = (e) => DB.update(R, { 'meta/prompt': e.target.value.trim() || meta.prompt });
  $('#rfNames').onchange = (e) => { notesNames = e.target.checked; renderReflect(); };
  $('#rfOpen').onclick = () => DB.update(R, { 'meta/state': open ? 'live' : 'reflect' });
  $$('[data-del]').forEach((b) => (b.onclick = () => DB.remove(`${R}/notes/${b.dataset.del}`)));
  $('#rfCsv').onclick = () => {
    const rows = [['เวลา', 'ชื่อ', 'กลุ่ม', 'ความคิดเห็น'], ...list.map(([, n]) => [new Date(n.at).toLocaleTimeString('th-TH'), n.name || '', groups[n.gid]?.name || '', n.text])];
    const csv = '﻿' + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `ความคิดเห็น-${meta.title || pin}.csv`; a.click();
  };
}

/* ───────── QR ───────── */
const joinUrl = () => { const u = new URL('buzz.html', location.href); u.search = ''; u.searchParams.set('pin', pin); if (DB?.mode === 'local' && qs.has('local')) u.searchParams.set('local', '1'); return u.href; };
$('#pinPill').onclick = () => {
  $('#qrBigImg').innerHTML = '';
  const size = Math.floor(Math.min(innerWidth * 0.55, innerHeight * 0.78));
  if (window.QRCode) new QRCode($('#qrBigImg'), { text: joinUrl(), width: size, height: size, colorDark: '#2B2350', colorLight: '#ffffff' });
  $('#qrBigUrl').textContent = new URL('buzz.html', location.href).host + new URL('buzz.html', location.href).pathname;
  $('#qrBigPin').textContent = pin.replace(/(\d{3})(\d{3})/, '$1 $2');
  $('#qrBig').hidden = false;
};
$('#qrClose').onclick = () => ($('#qrBig').hidden = true);
$('#qrBig').onclick = (e) => e.target === $('#qrBig') && ($('#qrBig').hidden = true);
addEventListener('keydown', (e) => e.key === 'Escape' && ($('#qrBig').hidden = true));

/* ───────── จบคาบ: สรุป + บันทึกคะแนนกลุ่มลงสมุดคะแนน ───────── */
$('#lvEnd').onclick = () => {
  const ranked = gList().sort((a, b) => (b[1].score || 0) - (a[1].score || 0));
  const canSave = meta.mode === 'book' && meta.classId;
  $('#endBody').innerHTML = `<h2>สรุปคาบ: ${esc(meta.title || '')}</h2>
    <ol class="end-rank">${ranked.map(([, g], i) => `<li style="--gc:${g.color}"><span class="o-no">${i + 1}</span><b>${esc(g.name)}</b><span class="sp"></span><b>${g.score || 0}</b> คะแนน</li>`).join('')}</ol>
    <p class="muted">ความคิดเห็นทั้งหมด ${Object.keys(notes).length} ข้อความ</p>
    ${canSave ? `<label class="tog"><input type="checkbox" id="endSave" checked><span></span>บันทึกคะแนนกลุ่มเป็น “คะแนนเสริม” ของสมาชิกทุกคนในสมุดคะแนน</label>` : ''}
    <div class="bn-actions"><button class="btn light" id="endBack">กลับไปจอแสดงผล</button><button class="btn gold" id="endGo">จบคาบ</button></div>`;
  $('#endDlg').showModal();
  $('#endBack').onclick = () => $('#endDlg').close();
  $('#endGo').onclick = async () => {
    const b = $('#endGo'); b.disabled = true;
    if (canSave && $('#endSave').checked) {
      b.textContent = 'กำลังบันทึก…';
      const c = books?.find((x) => x.id === meta.classId);
      const codeByName = new Map((c?.students || []).map((s) => [s.name, s.code]));
      const entries = [];
      for (const [, g] of gList()) if ((g.score || 0) > 0) for (const n of g.members || []) { const code = codeByName.get(n); if (code) entries.push({ code, pts: g.score, reason: `กิจกรรมกลุ่ม: ${meta.title} (${g.name})` }); }
      try {
        const j = entries.length ? await bookApi({ action: 'addbonus', classId: meta.classId, gameKey: 'live-' + pin, entries }) : { added: [] };
        toast(`บันทึกคะแนนเสริมแล้ว ${j.added.length} คน`, 4000);
      } catch (e) { b.disabled = false; b.textContent = 'จบคาบ'; return toast('บันทึกลงสมุดคะแนนไม่สำเร็จ ลองใหม่'); }
    }
    await DB.update(R, { 'meta/state': 'end', 'buzz/armed': false });
    music(null); sfx.fanfare(); confetti(160, 4000);
    unsubs.forEach((u) => u && u()); unsubs = []; pressUnsub && pressUnsub();
    $('#endDlg').close(); R = ''; pin = ''; show('setup'); toast('จบคาบแล้ว');
  };
};
