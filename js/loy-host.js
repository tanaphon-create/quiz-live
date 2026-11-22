// ลอยกระทงออนไลน์ — จอครู: เปิดกิจกรรม (PIN/QR) · แม่น้ำแสดงกระทงทุกใบแบบเรียลไทม์ · บันทึกคะแนนพิเศษลงสมุดคะแนน
// ข้อมูล: quiz/loy/{pin} { meta, items/{uid} } · รายการกิจกรรมของครู: quiz/banks/{uid}/loy/{pin}
import { connect, isTeacher, TS } from './db.js';
import { $, $$, esc, show, toast } from './ui.js';
import { sfx, music, musicOn, unlock, setMusicTheme } from './sound.js';
import { SCOREBOOK_API } from './config.js';
import { createRiver } from './loy-river.js?v=20261122e';

let DB, me = null, pin = '', R = '', meta = null, items = {}, unsubs = [], river = null, joinHref = '';
setMusicTheme('loykrathong');

const ready = connect({ host: true }).then((d) => { DB = d; d.onUser(onUser); return d; })
  .catch((e) => { console.error(e); document.documentElement.classList.remove('gc-wait'); $('#loginMsg').textContent = 'เชื่อมต่อไม่ได้ — ตรวจอินเทอร์เน็ตแล้วรีเฟรช'; });

async function onUser(u) {
  if (u && isTeacher(u)) {
    if (me === u.uid) return;
    me = u.uid; $('#who').textContent = u.email;
    document.documentElement.classList.remove('gc-wait');
    const last = sessionStorage.getItem('gc_loy_pin');
    if (last && (await DB.get(`quiz/loy/${last}/meta`))?.hostUid === me) return openRiver(last);
    return openSetup();
  }
  me = null; show('login'); document.documentElement.classList.remove('gc-wait');
  const wrong = u && !u.isAnonymous;
  $('#loginMsg').innerHTML = wrong ? `⛔ อีเมล <b>${esc(u.email)}</b> ไม่มีสิทธิ์เข้าหน้าครู` : '';
  $('#loginBtn').hidden = !!wrong; $('#switchBtn').hidden = !wrong;
}
$('#loginBtn').onclick = async () => { if (!(await ready)) return; try { await DB.signIn(); } catch (e) { $('#loginMsg').textContent = e.code === 'auth/popup-closed-by-user' ? '' : 'ล็อกอินไม่สำเร็จ ลองใหม่อีกครั้ง'; } };
$('#switchBtn').onclick = () => DB.signOut();

/* ───────── ตั้งค่า / รายการกิจกรรม ───────── */
async function openSetup() {
  stop(); sessionStorage.removeItem('gc_loy_pin'); show('setup');
  const list = Object.entries((await DB.get(`quiz/banks/${me}/loy`)) || {}).sort((a, b) => (b[1].createdAt || 0) - (a[1].createdAt || 0));
  $('#oldList').hidden = !list.length;
  $('#oldRows').innerHTML = list.map(([p, m]) => `<div class="loy-row"><b>🪷 ${esc(m.title)}</b><small>PIN ${p.replace(/(\d{3})(\d{3})/, '$1 $2')} · ${new Date(m.createdAt || 0).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}</small>
    <button class="btn sm" data-open="${p}">เปิดจอแม่น้ำ</button><button class="btn sm light" data-del="${p}">ลบ</button></div>`).join('');
}
$('#oldRows').onclick = async (e) => {
  const o = e.target.closest('[data-open]'), d = e.target.closest('[data-del]');
  if (o) return openRiver(o.dataset.open);
  if (d) {
    const p = d.dataset.del;
    if (!confirm(`ลบกิจกรรม PIN ${p} และกระทงทั้งหมดในกิจกรรมนี้?\nลบแล้วกู้คืนไม่ได้ (คะแนนที่บันทึกลงสมุดคะแนนแล้วยังอยู่)`)) return;
    try { await DB.remove(`quiz/loy/${p}`); } catch (err) { console.warn(err); }
    await DB.remove(`quiz/banks/${me}/loy/${p}`); toast('ลบกิจกรรมแล้ว'); openSetup();
  }
};
$('#setupForm').onsubmit = async (e) => {
  e.preventDefault(); unlock();
  const b = $('#openBtn'); b.disabled = true;
  try {
    let p = '';
    for (let i = 0; i < 8 && !p; i++) { const c = String(Math.floor(100000 + Math.random() * 900000)); if (!(await DB.get(`quiz/loy/${c}/meta`))) p = c; }
    if (!p) throw new Error('pin');
    const title = $('#lTitle').value.trim() || 'ลอยกระทงออนไลน์';
    await DB.set(`quiz/loy/${p}/meta`, { title, hostUid: me, state: 'open', points: Math.max(0.5, Math.min(10, +$('#lPts').value || 1)), showWish: $('#lWish').value === '1', createdAt: TS });
    await DB.set(`quiz/banks/${me}/loy/${p}`, { title, createdAt: TS });
    openRiver(p);
  } catch (err) { console.error(err); toast('เปิดกิจกรรมไม่สำเร็จ ลองใหม่อีกครั้ง'); }
  b.disabled = false;
};

/* ───────── จอแม่น้ำ ───────── */
function stop() { unsubs.forEach((u) => typeof u === 'function' && u()); unsubs = []; river?.destroy(); river = null; music(null); }
function openRiver(p) {
  stop(); pin = p; R = `quiz/loy/${p}`; items = {}; sessionStorage.setItem('gc_loy_pin', p);
  const url = new URL('loy.html', location.href); url.search = '?pin=' + p; joinHref = url.href;
  $('#lUrl').textContent = url.host + url.pathname;
  $('#lPin').textContent = p.replace(/(\d{3})(\d{3})/, '$1 $2');
  $('#lQr').innerHTML = ''; if (window.QRCode) new QRCode($('#lQr'), { text: joinHref, width: 208, height: 208, colorDark: '#2B2350', colorLight: '#ffffff' });
  show('river');
  river = createRiver($('#river'), { showWish: true });
  let first = true;
  unsubs.push(DB.on(`${R}/meta`, (m) => {
    meta = m; if (!m) { toast('กิจกรรมนี้ถูกลบแล้ว'); return openSetup(); }
    $('#lName').textContent = '🪷 ' + m.title; $('#lName').title = m.title;
    $('#stateBtn').innerHTML = m.state === 'open' ? '<span class="i">⏸</span><span class="t">ปิดรับ</span>' : '<span class="i">▶</span><span class="t">เปิดรับอีกครั้ง</span>';
    $('#stateBtn').classList.toggle('warn', m.state !== 'open');
    $('#wishBtn').classList.toggle('on', !!m.showWish); river?.setShowWish(!!m.showWish);
  }));
  unsubs.push(DB.on(`${R}/items`, (v) => {
    const before = Object.keys(items).length;
    items = v || {}; river?.update(items);
    const n = Object.keys(items).length;
    $('#lCount').textContent = n; $('#lEmpty').hidden = n > 0;
    if (!first && n > before) sfx.pop?.();
    first = false;
  }));
}
$('#backBtn').onclick = () => openSetup();
$('#wishBtn').onclick = () => meta && DB.update(`${R}/meta`, { showWish: !meta.showWish });
$('#stateBtn').onclick = () => meta && DB.update(`${R}/meta`, { state: meta.state === 'open' ? 'closed' : 'open' }).then(() => toast(meta.state === 'open' ? '▶ เปิดรับกระทงแล้ว' : '⏸ ปิดรับกระทงแล้ว — นักเรียนส่ง/แก้ไขไม่ได้'));
$('#musicBtn').onclick = () => { unlock(); const on = !musicOn(); music(on ? 'lobby' : null); $('#musicBtn').classList.toggle('on', on); };

/* QR เต็มจอ */
$('#lQr').onclick = () => {
  $('#qrBigImg').innerHTML = '';
  const size = Math.floor(Math.min(innerWidth * 0.55, innerHeight * 0.78));
  if (window.QRCode) new QRCode($('#qrBigImg'), { text: joinHref, width: size, height: size, colorDark: '#2B2350', colorLight: '#ffffff' });
  $('#qrBigUrl').textContent = $('#lUrl').textContent; $('#qrBigPin').textContent = $('#lPin').textContent;
  $('#qrBig').hidden = false;
};
const closeQr = () => ($('#qrBig').hidden = true);
$('#qrClose').onclick = closeQr;
$('#qrBig').onclick = (e) => e.target === $('#qrBig') && closeQr();
addEventListener('keydown', (e) => e.key === 'Escape' && closeQr());

/* ───────── รายชื่อ ───────── */
const people = () => Object.entries(items).map(([uid, it]) => ({ uid, ...it })).sort((a, b) => (a.at || 0) - (b.at || 0));
$('#listBtn').onclick = () => {
  const list = people(), dlg = $('#dlg');
  $('#dlgBody').innerHTML = `<h3>📋 ผู้ร่วมกิจกรรม ${list.length} คน</h3>
    <table class="loy-tbl"><thead><tr><th>#</th><th>เลขประจำตัว</th><th>ชื่อ</th><th>คำอธิษฐาน</th><th></th></tr></thead><tbody>
    ${list.map((p, i) => `<tr><td>${i + 1}</td><td>${esc(p.sid)}</td><td>${esc(p.name)}</td><td>${p.wish ? (p.showWish ? esc(p.wish) : '<small>🔒 ส่วนตัว</small>') : '-'}</td><td><button class="btn sm light" data-rm="${esc(p.uid)}" title="ลบกระทงใบนี้">ลบ</button></td></tr>`).join('') || '<tr><td colspan="5" class="muted">ยังไม่มี</td></tr>'}
    </tbody></table><p class="muted">คำอธิษฐานที่นักเรียนเลือก “ส่วนตัว” ครูก็ไม่เห็น เพื่อความเป็นส่วนตัว</p><div class="row"><button class="btn gold" data-x>ปิด</button></div>`;
  $('#dlgBody').onclick = async (e) => {
    if (e.target.closest('[data-x]')) return dlg.close();
    const rm = e.target.closest('[data-rm]');
    if (rm && confirm('ลบกระทงใบนี้ออกจากแม่น้ำ?')) { await DB.remove(`${R}/items/${rm.dataset.rm}`); rm.closest('tr').remove(); }
  };
  dlg.showModal();
};

/* ───────── บันทึกคะแนนพิเศษ ───────── */
async function bookApi(body) {
  const tok = DB.mode === 'firebase' ? await DB.user().getIdToken() : 'local-test';
  const r = await fetch(SCOREBOOK_API, { method: 'POST', body: JSON.stringify({ ...body, idToken: tok }) });
  let j; try { j = await r.json(); } catch { throw { error: 'bad_response' }; }
  if (!j.ok) throw j;
  return j;
}
$('#bonusBtn').onclick = async () => {
  const dlg = $('#dlg'), body = $('#dlgBody');
  const list = people(); const bySid = new Map(); list.forEach((p) => bySid.set(String(p.sid).trim(), p));
  dlg.showModal();
  if (!bySid.size) { body.innerHTML = '<h3>📒 บันทึกคะแนนพิเศษ</h3><p class="muted">ยังไม่มีนักเรียนลอยกระทง</p><div class="row"><button class="btn light" data-x>ปิด</button></div>'; body.onclick = (e) => e.target.closest('[data-x]') && dlg.close(); return; }
  body.innerHTML = '<p class="muted">กำลังโหลดรายชื่อห้องจากสมุดคะแนน…</p>';
  let classes;
  try { classes = (await bookApi({ action: 'classes' })).classes || []; }
  catch (e) { body.innerHTML = `<p>โหลดสมุดคะแนนไม่ได้ ${e?.error === 'auth' ? '— ต้องล็อกอินด้วยอีเมลครู' : '— ตรวจอินเทอร์เน็ตแล้วลองใหม่'}</p><div class="row"><button class="btn light" data-x>ปิด</button></div>`; body.onclick = (ev) => ev.target.closest('[data-x]') && dlg.close(); return; }
  const rows = classes.map((c) => ({ c, hit: (c.students || []).filter((s) => bySid.has(String(s.code).trim())) })).filter((x) => x.hit.length).sort((a, b) => b.hit.length - a.hit.length);
  const found = new Set(rows.flatMap((r) => r.hit.map((s) => String(s.code).trim())));
  const miss = [...bySid.values()].filter((p) => !found.has(String(p.sid).trim()));
  body.innerHTML = `<h3>📒 บันทึกคะแนนพิเศษ “ร่วมกิจกรรม”</h3>
    <p class="muted">จับคู่เลขประจำตัวกับรายชื่อในสมุดคะแนน · เลือกห้องที่จะบันทึก · กดซ้ำระบบจะไม่บวกซ้ำ</p>
    <div style="display:grid;grid-template-columns:1fr 130px;gap:10px">
      <label class="field"><span>เหตุผล (แสดงในช่องคะแนนเสริม)</span><input class="input" id="bnWhy" maxlength="100" value="${esc('ร่วมกิจกรรม: ' + (meta?.title || 'ลอยกระทง'))}"></label>
      <label class="field"><span>คะแนนต่อคน</span><input class="input" type="number" id="bnPts" min="0.5" max="10" step="0.5" value="${meta?.points || 1}"></label></div>
    <table class="loy-tbl"><thead><tr><th></th><th>ห้อง</th><th>นักเรียนที่ร่วมกิจกรรม</th></tr></thead><tbody>
    ${rows.map((r, i) => `<tr><td><input type="checkbox" data-c="${i}" checked aria-label="บันทึก ${esc(r.c.name)}"></td><td><b>${esc(r.c.name)}</b>${r.c.subject ? `<br><small>${esc(r.c.subject)}</small>` : ''}</td><td>${r.hit.length} คน <small>(${r.hit.slice(0, 6).map((s) => esc(s.name)).join(', ')}${r.hit.length > 6 ? ' …' : ''})</small></td></tr>`).join('') || '<tr><td colspan="3">ไม่พบเลขประจำตัวที่ตรงกับห้องใดเลย</td></tr>'}
    </tbody></table>
    ${miss.length ? `<p style="color:#B4232F">⚠ ไม่พบในสมุดคะแนน ${miss.length} คน: ${miss.map((p) => `${esc(p.name)} (${esc(p.sid)})`).join(', ')}</p>` : ''}
    <div class="row"><button class="btn light" data-x>ยกเลิก</button><button class="btn green" id="bnSave" ${rows.length ? '' : 'disabled'}>💾 บันทึกคะแนนพิเศษ</button></div>`;
  body.onclick = (e) => e.target.closest('[data-x]') && dlg.close();
  $('#bnSave').onclick = async () => {
    const why = $('#bnWhy').value.trim() || 'ร่วมกิจกรรมลอยกระทง', pts = Math.max(0.5, Math.min(10, +$('#bnPts').value || 1));
    const chosen = $$('#dlgBody [data-c]:checked').map((cb) => rows[+cb.dataset.c]);
    if (!chosen.length) return toast('ยังไม่ได้เลือกห้อง');
    const btn = $('#bnSave'); btn.disabled = true; btn.textContent = 'กำลังบันทึก…';
    const done = [];
    try {
      for (const r of chosen) {
        const entries = r.hit.map((s) => ({ code: String(s.code).trim(), pts, reason: why }));
        let added = 0, dup = 0;
        for (let i = 0; i < entries.length; i += 60) {
          const j = await bookApi({ action: 'addbonus', classId: r.c.id, gameKey: 'loy-' + pin, reason: why, entries: entries.slice(i, i + 60) });
          added += j.added.length; dup += j.dup.length;
        }
        done.push({ name: r.c.name, added, dup });
      }
      body.innerHTML = `<h3>✅ บันทึกคะแนนพิเศษแล้ว</h3><ul>${done.map((d) => `<li><b>${esc(d.name)}</b> เพิ่ม ${d.added} คน คนละ +${pts}${d.dup ? ` · ข้ามที่เคยบันทึกแล้ว ${d.dup} คน` : ''}</li>`).join('')}</ul>
        <p class="muted">เปิดสมุดคะแนน → แท็บ “คะแนนเสริม” เพื่อดูรายการ</p><div class="row"><button class="btn gold" data-x>ปิด</button></div>`;
      sfx.correct();
    } catch (e) {
      btn.disabled = false; btn.textContent = '💾 บันทึกคะแนนพิเศษ';
      toast(e?.error === 'auth' ? 'ต้องล็อกอินด้วยอีเมลครูก่อน' : 'บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง');
    }
  };
};
