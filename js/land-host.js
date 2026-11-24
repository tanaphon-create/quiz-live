// โหมดยึดพื้นที่ (จอครู): สุ่มฝั่ง → นักเรียนตอบคำถามบนมือถือตัวเอง → ถูก 1 ข้อ ยึด 1 ช่อง
// ครูเป็นคนตรวจคำตอบและยึดช่อง (เฉลยไม่ถูกส่งไปที่มือถือก่อนตอบ) · จบเมื่อพื้นที่ว่างหมดหรือหมดเวลา ฝั่งที่มีพื้นที่มากกว่าชนะ
import { $, esc, wait, TEAMS, confetti, landQ, LAND_LOCK, LAND_STEAL } from './ui.js?v=20261124a';
import { renderAvatar } from './avatar.js';
import { sfx, music, hurry } from './sound.js';
import { TS } from './db.js';

export const LAND_TIMES = [2, 3, 5, 7, 10];
export const LAND_SIZES = { S: ['เล็ก', 2.5], M: ['กลาง', 4], L: ['ใหญ่', 6] };
const nCh = (q) => (q.type === 'tf' ? 2 : 4);
const mmss = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

// ขนาดสนามตามจำนวนคนและเวลา (คนมาก/เวลานาน → สนามใหญ่ขึ้น จะได้ไม่เต็มเร็วเกินไป)
export function boardDims(nPlayers, minutes, size) {
  const n = Math.max(40, Math.min(600, Math.round(Math.max(2, nPlayers) * minutes * LAND_SIZES[size][1])));
  const cols = Math.max(8, Math.round(Math.sqrt(n * 1.9)));
  return { cols, rows: Math.max(5, Math.round(n / cols)) };
}

// ฐานเริ่มต้นของแต่ละฝั่ง
function homes(C, R, T) {
  const mx = Math.floor(C / 2), my = Math.floor(R / 2), L = 0, Rt = C - 1, B = R - 1;
  const at = (x, y) => y * C + x;
  if (T === 2) return [at(L, my), at(Rt, my)];
  if (T === 3) return [at(L, 0), at(Rt, 0), at(mx, B)];
  return [at(L, 0), at(Rt, B), at(Rt, 0), at(L, B)];
}

export function startLand(ctx) {
  const { DB, R, quiz, stage, opts } = ctx;
  const T = opts.teams;
  const team = (u) => ctx.players()[u]?.team;
  const N = quiz.questions.length;
  const { cols: C, rows: RW } = boardDims(ctx.active().length, opts.ltime, opts.lsize);
  const cells = C * RW;
  const b = Array(cells).fill('.');
  const home = homes(C, RW, T);
  home.forEach((i, t) => (b[i] = String(t)));
  const S = {};          // สถานะรายคน: n = ข้อถัดไปที่รอ, ok, cap, steal, streak, lock
  const feed = [];
  let running = false, over = false, startAt = 0, endAt = 0, tickH = null, lastSec = -1, popH = 0;
  const xy = (i) => [i % C, Math.floor(i / C)];
  const nb = (i) => { const [x, y] = xy(i), o = []; if (x > 0) o.push(i - 1); if (x < C - 1) o.push(i + 1); if (y > 0) o.push(i - C); if (y < RW - 1) o.push(i + C); return o; };
  const dist = (i, j) => { const [a, c] = xy(i), [e, f] = xy(j); return Math.hypot(a - e, c - f); };
  const counts = () => { const c = Array(T).fill(0); for (const v of b) if (v !== '.') c[+v]++; return c; };
  const empty = () => b.filter((v) => v === '.').length;

  // ยึดช่องว่างที่ติดกับพื้นที่ของฝั่งตัวเอง (โตเป็นก้อนรอบฐาน) · ถ้าถูกล้อมไว้ ไปยึดช่องว่างที่ใกล้ฐานที่สุด
  function grab(t) {
    const ts = String(t); let best = -1, bs = -Infinity;
    for (let i = 0; i < cells; i++) {
      if (b[i] !== '.') continue;
      const own = nb(i).filter((j) => b[j] === ts).length;
      if (!own) continue;
      const s = own * 3 + Math.random() * 2.5 - dist(i, home[t]) * 0.12;
      if (s > bs) { bs = s; best = i; }
    }
    if (best < 0) for (let i = 0; i < cells; i++) if (b[i] === '.') { const s = -dist(i, home[t]); if (s > bs) { bs = s; best = i; } }
    if (best >= 0) b[best] = ts;
    return best;
  }
  // แย่งช่องของฝั่งตรงข้ามที่อยู่ติดแนวหน้า (ฐานแย่งไม่ได้)
  function steal(t) {
    const ts = String(t); let best = -1, bs = -Infinity;
    for (let i = 0; i < cells; i++) {
      if (b[i] === '.' || b[i] === ts || home.includes(i)) continue;
      const own = nb(i).filter((j) => b[j] === ts).length;
      if (!own) continue;
      const s = own * 3 + Math.random() * 2.5;
      if (s > bs) { bs = s; best = i; }
    }
    if (best < 0) return null;
    const from = +b[best]; b[best] = ts;
    return { i: best, from };
  }

  /* ───── หน้าจอ ───── */
  stage().innerHTML = `
    <div class="land">
      <div class="land-top">
        <div class="land-timer" id="ldTimer"><b id="ldT">${mmss(opts.ltime * 60000)}</b><small>เวลาที่เหลือ</small></div>
        <div class="land-bars" id="ldBars"></div>
        <div class="land-left"><b id="ldEmpty">${empty()}</b><small>ช่องว่าง</small></div>
      </div>
      <div class="land-main">
        <div class="land-wrap"><div class="land-board" id="ldBoard" style="--cols:${C};--rows:${RW}">${b.map((v, i) => `<i class="${v === '.' ? '' : 't' + v}${home.includes(i) ? ' home' : ''}">${home.includes(i) ? TEAMS[+v].e : ''}</i>`).join('')}</div></div>
        <aside class="land-feed" id="ldFeed"><div class="lf-h">⚡ ยึดล่าสุด</div><ol id="ldFeedL"></ol></aside>
      </div>
      <div class="land-intro" id="ldIntro"></div>
    </div>`;
  const cellEls = [...$('#ldBoard').children];
  const shown = [...b];
  function render(changed = []) {
    for (let i = 0; i < cells; i++) {
      if (shown[i] === b[i]) continue;
      const el = cellEls[i];
      el.className = (b[i] === '.' ? '' : 't' + b[i]) + (home.includes(i) ? ' home' : '');
      shown[i] = b[i];
      void el.offsetWidth; el.classList.add(changed.find((c) => c.i === i)?.steal ? 'stolen' : 'pop');
    }
    const c = counts(), total = cells;
    const lead = Math.max(...c);
    $('#ldBars').innerHTML = c.map((n, t) => `<div class="lb ${n === lead && n > 1 ? 'lead' : ''}" style="--tc:${TEAMS[t].c}">
      <span class="lb-n">${TEAMS[t].e} ${TEAMS[t].name} <small>${ctx.active().filter(([, p]) => p.team === t).length} คน</small></span>
      <span class="lb-track"><i style="width:${(n / total) * 100}%"></i></span>
      <b>${n}</b><small class="lb-p">${Math.round((n / total) * 100)}%</small></div>`).join('');
    $('#ldEmpty').textContent = empty();
    $('#ldFeedL').innerHTML = feed.slice(0, 9).map((f) => `<li style="--tc:${TEAMS[f.t].c}">${f.steal ? `⚔️ <b>${esc(f.name)}</b> แย่งจาก${TEAMS[f.from].name}` : `${TEAMS[f.t].e} <b>${esc(f.name)}</b> +1`}</li>`).join('');
  }
  render();

  /* ───── รับคำตอบจากมือถือ (players/$uid/la = { n, c, at }) ───── */
  function onPlayers() {
    if (!running) return;
    process();
    if (!empty()) stop('full');
  }
  function process() {
    const now = DB.now(), up = {}, changed = [];
    for (const [u, p] of ctx.active()) {
      const la = p.la;
      if (!la || typeof la.n !== 'number' || p.team == null || p.team >= T) continue;
      const s = (S[u] ||= { n: 0, ok: 0, cap: 0, steal: 0, streak: 0, lock: 0 });
      // มือถือส่งซ้ำ (ไม่ได้รับผล) → ส่งผลล่าสุดให้อีกครั้ง
      if (la.n === s.n - 1 && s.last && la.r !== s.lastR) { s.lastR = la.r; up[`land/res/${u}`] = { ...s.last, t: now }; continue; }
      if (la.n !== s.n) continue;
      s.n++; s.lastR = la.r;
      const q = quiz.questions[landQ(u, la.n, N)];
      const early = (la.at || now) < s.lock - 1500; // กดก่อนหมดเวลารอ (ไม่ผ่านหน้าเว็บปกติ) = นับเป็นผิด
      const ok = !early && la.c === q.correct;
      let got = null;
      if (ok) {
        s.ok++; s.streak++;
        const i = grab(p.team);
        if (i >= 0) { got = 'cell'; s.cap++; changed.push({ i }); feed.unshift({ t: p.team, name: p.name }); }
        if (s.streak % LAND_STEAL === 0) {
          const st = steal(p.team);
          if (st) { got = got ? 'both' : 'steal'; s.cap++; s.steal++; changed.push({ i: st.i, steal: true }); feed.unshift({ t: p.team, name: p.name, steal: true, from: st.from }); }
        }
      } else { s.streak = 0; s.lock = now + LAND_LOCK; }
      s.last = { n: la.n, ok, a: early ? -1 : q.correct, got, lock: s.lock, cap: s.cap, okN: s.ok, streak: s.streak };
      up[`land/res/${u}`] = { ...s.last, t: now };
    }
    if (!Object.keys(up).length) return;
    feed.length = Math.min(feed.length, 20);
    if (changed.length) up['land/b'] = b.join('');
    DB.update(R, up).catch((e) => console.error(e));
    render(changed);
    if (changed.length && performance.now() - popH > 160) { popH = performance.now(); changed.some((c) => c.steal) ? sfx.whoosh() : sfx.pop(); }
  }

  /* ───── เริ่ม: โชว์การแบ่งฝั่ง → นับถอยหลัง → แข่ง ───── */
  async function begin() {
    const list = ctx.active();
    const intro = $('#ldIntro');
    intro.innerHTML = `<div class="li-h">🎲 สุ่มฝั่งแล้ว!</div><div class="li-sides n${T}">${Array.from({ length: T }, (_, t) => {
      const mem = list.filter(([, p]) => p.team === t);
      return `<div class="li-side" style="--tc:${TEAMS[t].c};--d:${t * 0.25}s"><h3>${TEAMS[t].e} ${TEAMS[t].name}</h3><small>${mem.length} คน</small>
        <div class="li-mem">${mem.map(([, p]) => `<span><i>${renderAvatar(p.avatar, { bg: false })}</i>${esc(p.name)}</span>`).join('')}</div></div>`;
    }).join('')}</div><div class="li-rule">ตอบถูก 1 ข้อ = ยึด 1 ช่อง · ถูกติดกัน ${LAND_STEAL} ข้อ ⚔️ แย่งช่องฝั่งตรงข้าม · ตอบผิด รอ ${LAND_LOCK / 1000} วิ</div><div class="li-count" id="ldCount"></div>`;
    intro.hidden = false; sfx.whoosh();
    await DB.update(R, {
      land: { qs: quiz.questions.map((q) => ({ text: q.text, image: q.image || '', type: q.type, choices: q.choices.slice(0, nCh(q)) })), b: b.join(''), cols: C, rows: RW, homes: home },
      'meta/state': 'land', 'meta/landStart': null, 'meta/landEnd': null, 'meta/total': N,
    });
    await wait(3500);
    if (over) return;
    await DB.update(R, { 'meta/landStart': TS });
    startAt = ((await DB.get(R + '/meta/landStart')) || DB.now()) + 3200;
    endAt = startAt + opts.ltime * 60000;
    await DB.update(R, { 'meta/landStart': startAt, 'meta/landEnd': endAt });
    for (const n of [3, 2, 1]) {
      await wait(Math.max(0, startAt - n * 1000 - DB.now()));
      if (over) return;
      $('#ldCount').textContent = n; sfx.count(n);
    }
    await wait(Math.max(0, startAt - DB.now()));
    if (over) return;
    $('#ldCount').textContent = 'ไป!'; sfx.go();
    intro.classList.add('out'); setTimeout(() => (intro.hidden = true), 500);
    running = true; music('question');
    onPlayers();
    tickH = setInterval(tick, 200);
  }
  function tick() {
    const left = endAt - DB.now();
    $('#ldT').textContent = mmss(left);
    const sec = Math.ceil(left / 1000);
    $('#ldTimer').classList.toggle('hurry', sec <= 10);
    if (sec !== lastSec) { lastSec = sec; if (sec <= 10 && sec > 0) { sfx.urgent(); hurry(true); } }
    if (left <= 0) stop('time');
  }

  /* ───── จบ ───── */
  let stopped = false;
  async function stop(why) {
    if (stopped) return;
    stopped = true;
    const wasRunning = running;
    running = false; over = true;
    clearInterval(tickH); hurry(false); music(null);
    if (!wasRunning) { $('#ldIntro').hidden = true; }
    sfx.timeUp();
    await wait(700); // รับคำตอบที่กำลังส่งมา
    process();
    const c = counts();
    const list = ctx.active();
    const okOf = (t) => list.filter(([u, p]) => p.team === t).reduce((s, [u]) => s + (S[u]?.ok || 0), 0);
    const teams = c.map((score, k) => ({ k, n: list.filter(([, p]) => p.team === k).length, score, ok: okOf(k) }))
      .sort((a, z) => z.score - a.score || z.ok - a.ok);
    teams.forEach((t, i) => { const pv = teams[i - 1]; t.rank = pv && pv.score === t.score && pv.ok === t.ok ? pv.rank : i + 1; });
    const tie = teams.length > 1 && teams[0].score === teams[1].score;
    const fullTie = tie && teams[1].rank === 1;
    const up = { 'meta/state': 'landover', 'meta/landWhy': why, 'land/b': b.join('') };
    let maxN = 0;
    for (const [u] of list) {
      const s = S[u] || { n: 0, ok: 0, cap: 0, steal: 0 };
      maxN = Math.max(maxN, s.n);
      up[`players/${u}/score`] = s.cap; up[`players/${u}/correct`] = s.ok; up[`players/${u}/answered`] = s.n; up[`players/${u}/steals`] = s.steal;
    }
    up['meta/finalTeams'] = teams;
    await DB.update(R, up);
    ctx.onOver(teams, maxN);
    const W = TEAMS[teams[0].k];
    const box = document.createElement('div');
    box.className = 'land-win';
    box.innerHTML = `<div class="lw-card" style="--tc:${W.c}">
      <div class="lw-why">${why === 'full' ? '🗺️ พื้นที่เต็มแล้ว!' : why === 'time' ? '⏰ หมดเวลา!' : '🏁 จบเกม'}</div>
      <h1>${fullTie ? '🤝 เสมอกัน!' : `${W.e} ${W.name} ชนะ!`}</h1>
      <div class="lw-rows">${teams.map((t) => `<div class="lw-r" style="--tc:${TEAMS[t.k].c}"><span>${t.rank}</span><b>${TEAMS[t.k].e} ${TEAMS[t.k].name}</b><em>${t.score} ช่อง · ${Math.round((t.score / cells) * 100)}%</em></div>`).join('')}</div>
      ${tie && !fullTie ? `<p>พื้นที่เท่ากัน ตัดสินด้วยจำนวนข้อที่ตอบถูกรวม (${teams[0].ok} ต่อ ${teams[1].ok} ข้อ)</p>` : fullTie ? '<p>พื้นที่และจำนวนข้อที่ตอบถูกเท่ากันพอดี</p>' : ''}
      <div class="row end"><button class="btn light" id="lwHide">ดูสนาม</button><button class="btn gold big" id="lwNext">🏅 ประกาศผลรายคน ›</button></div></div>`;
    stage().querySelector('.land').append(box);
    $('#lwHide').onclick = () => { box.classList.toggle('peek'); $('#lwHide').textContent = box.classList.contains('peek') ? 'ดูผล' : 'ดูสนาม'; };
    $('#lwNext').onclick = () => ctx.finish();
    sfx.fanfare(); confetti(220, 5000);
  }

  begin();
  return {
    onPlayers,
    end: () => (over ? ctx.finish() : stop('manual')),
    destroy: () => { over = true; running = false; clearInterval(tickH); hurry(false); },
  };
}
