// โหมดยึดพื้นที่ (มือถือนักเรียน): คำถามขึ้นบนจอตัวเอง ตอบเร็ว ตอบถูก ยึดพื้นที่ให้ฝั่งตัวเอง
import { $, $$, esc, SHAPES, TEAMS, landQ, landPerm, LAND_STEAL } from './ui.js?v=20261124a';
import { sfx } from './sound.js';
import { TS } from './db.js';

const mmss = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
let L = null;

export function landStop() {
  if (!L) return;
  L.offs.forEach((f) => f && f());
  clearInterval(L.tick); clearTimeout(L.retry); clearTimeout(L.nextH);
  L = null;
}

// ctx: { DB, R, stage, meta: () => meta, me: () => me }
export async function landPlay(ctx) {
  const { DB, R, stage } = ctx;
  const me = ctx.me();
  landStop();
  if (me?.team == null) {
    stage().innerHTML = `<div class="msg"><div class="spinner"></div><h2>กำลังสุ่มฝั่งให้คุณ…</h2></div>`;
    return;
  }
  const uid = DB.uid;
  const [qs, cols, rows, res] = await Promise.all([DB.get(`${R}/land/qs`), DB.get(`${R}/land/cols`), DB.get(`${R}/land/rows`), DB.get(`${R}/land/res/${uid}`)]);
  const list = Array.isArray(qs) ? qs : Object.values(qs || {});
  if (!list.length || !cols) { stage().innerHTML = `<div class="msg"><div class="spinner"></div><h2>กำลังเตรียมสนาม…</h2></div>`; setTimeout(() => ctx.again(), 800); return; }
  const T = TEAMS[me.team], N = list.length, cells = cols * rows;
  const S = L = { offs: [], tick: 0, retry: 0, nextH: 0, n: res ? res.n + 1 : 0, st: 'q', b: '', res, cap: res?.cap || 0, streak: res?.streak || 0, tries: 0, lastC: null };
  if (me.la && me.la.n === S.n) { S.st = 'sent'; S.lastC = me.la.c; }

  stage().innerHTML = `
    <div class="ld" style="--tc:${T.c}">
      <div class="ld-top">
        <span class="ld-team">${T.e} ${T.name}</span>
        <span class="ld-time" id="ldTime">--:--</span>
        <span class="ld-mine">ยึดได้ <b id="ldCap">${S.cap}</b> ช่อง</span>
      </div>
      <div class="ld-map"><div class="ld-grid" id="ldGrid" style="--cols:${cols};--rows:${rows}">${'<i></i>'.repeat(cells)}</div><div class="ld-bar" id="ldBar"></div></div>
      <div class="ld-play" id="ldPlay"></div>
    </div>`;
  const cellEls = [...$('#ldGrid').children];
  let shown = '';
  const team = String(me.team);
  function drawMap(b) {
    if (!b || b === shown) return;
    for (let i = 0; i < cells; i++) if (b[i] !== shown[i]) cellEls[i].className = b[i] === '.' ? '' : `t${b[i]}${b[i] === team ? ' me' : ''}`;
    shown = b;
    const c = TEAMS.map((_, t) => [...b].filter((v) => v === String(t)).length);
    const used = c.reduce((a, x) => a + x, 0);
    $('#ldBar').innerHTML = c.map((n, t) => (n || t < (ctx.meta()?.teams || 2) ? `<span class="${t === me.team ? 'me' : ''}" style="--tc:${TEAMS[t].c};flex:${Math.max(n, 0.001)}">${TEAMS[t].e} ${n}</span>` : '')).join('') +
      `<span class="emp" style="flex:${Math.max(cells - used, 0.001)}">${cells - used ? `ว่าง ${cells - used}` : ''}</span>`;
  }
  S.offs.push(DB.on(`${R}/land/b`, (b) => drawMap(b)));
  S.offs.push(DB.on(`${R}/land/res/${uid}`, (r) => onRes(r)));

  const play = () => $('#ldPlay');
  const startAt = () => ctx.meta()?.landStart || 0;
  const endAt = () => ctx.meta()?.landEnd || 0;
  const live = () => L === S;

  function onRes(r) {
    if (!live() || !r || r.n < S.n - 1) return;
    S.cap = r.cap || 0; S.streak = r.streak || 0;
    $('#ldCap').textContent = S.cap;
    if (r.n === S.n && S.st === 'sent') { clearTimeout(S.retry); S.n = r.n + 1; S.res = r; feedback(r); }
    else if (r.n >= S.n) { S.n = r.n + 1; S.res = r; S.st = 'q'; question(); }
  }

  function question() {
    if (!live()) return;
    if (endAt() && ctx.DB.now() >= endAt()) return over();
    S.st = 'q';
    const qi = landQ(uid, S.n, N), q = list[qi];
    const k = (Array.isArray(q.choices) ? q.choices : Object.values(q.choices || {}));
    const perm = landPerm(uid, S.n, k.length);
    play().innerHTML = `
      ${S.streak > 0 ? `<div class="ld-streak">🔥 ถูกติดกัน ${S.streak} ${S.streak % LAND_STEAL === LAND_STEAL - 1 ? '— ข้อหน้าถูกได้ ⚔️ แย่งพื้นที่!' : ''}</div>` : ''}
      <div class="ld-q">${q.image ? `<img src="${esc(q.image)}" alt="">` : ''}<p>${esc(q.text)}</p></div>
      <div class="ld-ch n${k.length}">${perm.map((ci, pos) => `<button class="ans a${pos}" data-c="${ci}"><span class="shape">${SHAPES[pos]}</span><span class="lbl">${esc(k[ci])}</span></button>`).join('')}</div>`;
    $$('.ld-ch .ans', play()).forEach((bt) => (bt.onclick = () => send(+bt.dataset.c, bt)));
  }

  function send(c, bt) {
    if (S.st !== 'q' || !live()) return;
    if (DB.now() < startAt()) return;
    if (endAt() && DB.now() >= endAt()) return over();
    S.st = 'sent'; S.lastC = c; S.tries = 0;
    sfx.tap(); navigator.vibrate?.(20);
    $$('.ld-ch .ans', play()).forEach((x) => { x.disabled = true; x.classList.toggle('picked', x === bt); });
    push();
  }
  // ส่งคำตอบ ถ้า 3 วิยังไม่มีผลกลับมา ส่งซ้ำ (เน็ตช้า)
  function push() {
    if (!live() || S.st !== 'sent') return;
    DB.update(`${R}/players/${uid}`, { la: { n: S.n, c: S.lastC, at: TS, r: S.tries++ } }).catch((e) => console.error(e));
    clearTimeout(S.retry); S.retry = setTimeout(push, 3000);
  }

  function feedback(r) {
    if (r.ok) {
      S.st = 'res';
      const msg = r.got === 'both' ? '+1 ช่อง และ ⚔️ แย่งมาอีก 1!' : r.got === 'steal' ? '⚔️ แย่งพื้นที่มาได้!' : r.got === 'cell' ? '+1 ช่อง!' : 'ถูก!';
      play().innerHTML = `<div class="ld-fb ok"><div class="res-ico">✓</div><h2>${msg}</h2>${r.streak >= 2 ? `<p>🔥 ถูกติดกัน ${r.streak} ข้อ</p>` : ''}</div>`;
      r.got === 'steal' || r.got === 'both' ? sfx.correct() : sfx.pop();
      S.nextH = setTimeout(question, r.got === 'steal' || r.got === 'both' ? 1300 : 750);
      return;
    }
    S.st = 'lock';
    navigator.vibrate?.([60, 40, 60]);
    sfx.tap();
    const q = list[landQ(uid, r.n, N)];
    const k = Array.isArray(q.choices) ? q.choices : Object.values(q.choices || {});
    play().innerHTML = `<div class="ld-fb bad"><div class="res-ico">✗</div><h2>${r.a < 0 ? 'กดเร็วเกินไป' : 'ยังไม่ถูกนะ'}</h2>
      ${r.a >= 0 ? `<p class="ld-ans">คำตอบที่ถูก: <b>${esc(k[r.a])}</b></p>` : ''}
      <div class="ld-lock">รอ <b id="ldLock">${Math.ceil((r.lock - DB.now()) / 1000)}</b> วินาที</div></div>`;
  }

  function over() {
    if (!live() || S.st === 'done') return;
    S.st = 'done'; clearTimeout(S.retry); clearTimeout(S.nextH);
    play().innerHTML = `<div class="ld-fb"><div class="big-ico">⏰</div><h2>หมดเวลา!</h2><p>ดูผลบนจอใหญ่</p></div>`;
  }

  // นาฬิกา: นับถอยหลังก่อนเริ่ม · เวลาที่เหลือ · เวลารอหลังตอบผิด
  let wasPre = null;
  function tick() {
    if (!live()) return;
    const now = DB.now(), st = startAt(), en = endAt();
    const pre = !st || now < st;
    const tEl = $('#ldTime');
    if (pre) {
      tEl.textContent = mmss((ctx.meta()?.ltime || 3) * 60000);
      if (wasPre !== true) play().innerHTML = `<div class="ld-fb"><div class="ld-side" style="--tc:${T.c}">${T.e}</div><h2>คุณอยู่ฝั่ง ${T.name}</h2><p>ตอบถูก 1 ข้อ = ยึด 1 ช่อง · ถูกติดกัน ${LAND_STEAL} ข้อ แย่งพื้นที่ฝั่งตรงข้าม</p><div class="ld-cd" id="ldCd"></div></div>`;
      const cd = $('#ldCd'); if (cd) { cd.textContent = st ? Math.max(1, Math.ceil((st - now) / 1000)) : 'เตรียมตัว…'; cd.classList.toggle('txt', !st); }
      wasPre = true;
      return;
    }
    if (wasPre !== false) { wasPre = false; if (S.st === 'q') { sfx.go(); question(); } else if (S.st === 'sent') { play().innerHTML = `<div class="ld-fb"><div class="spinner"></div><h2>กำลังตรวจ…</h2></div>`; push(); } }
    const left = en - now;
    tEl.textContent = mmss(left);
    tEl.classList.toggle('hurry', left <= 10000);
    if (en && left <= 0) return over();
    if (S.st === 'lock') {
      const w = (S.res?.lock || 0) - now;
      const el = $('#ldLock'); if (el) el.textContent = Math.max(0, Math.ceil(w / 1000));
      if (w <= 0) question();
    }
  }
  S.tick = setInterval(tick, 200);
  tick();
  drawMap(await DB.get(`${R}/land/b`));
}

// หลังจบเกม (ก่อนประกาศผลรายคน)
export async function landOver(ctx) {
  landStop();
  const { DB, R, stage } = ctx;
  const meta = ctx.meta();
  const p = (await DB.get(`${R}/players/${DB.uid}`)) || ctx.me() || {};
  const ft = Object.values(meta.finalTeams || {});
  const mine = ft.find((t) => t.k === p.team);
  const tie = ft.length > 1 && ft[0].score === ft[1].score;
  const fullTie = ft.filter((t) => t.rank === 1).length > 1;
  const win = mine && mine.rank === 1;
  const T = TEAMS[p.team] || TEAMS[0];
  stage().innerHTML = `<div class="msg">
    <div class="big-ico">${meta.landWhy === 'full' ? '🗺️' : '⏰'}</div>
    <h2>${meta.landWhy === 'full' ? 'พื้นที่เต็มแล้ว!' : 'หมดเวลา!'}</h2>
    ${mine ? `<div class="team-chip big" style="background:${T.c}">${T.e} ${T.name} ${win ? (fullTie ? 'เสมอ 🤝' : tie ? 'ชนะ (ตัดสินจากข้อที่ตอบถูก) 🏆' : 'ชนะ! 🏆') : `อันดับ ${mine.rank}`}</div><p class="soft">พื้นที่ฝั่งเรา ${mine.score} ช่อง</p>` : ''}
    <div class="final-score">${p.score || 0} <small>ครั้งที่คุณยึดช่องได้ (รวมตลอดเกม)</small></div>
    <p class="soft">ตอบถูก ${p.correct || 0} จาก ${p.answered || 0} ข้อ${p.steals ? ` · ⚔️ แย่งมาได้ ${p.steals} ช่อง` : ''}</p>
    <p class="soft">👀 รอครูประกาศผลบนจอใหญ่</p></div>`;
  win ? sfx.fanfare() : sfx.correct();
}
