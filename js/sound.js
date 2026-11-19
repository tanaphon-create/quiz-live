// เสียงประกอบ + ดนตรีสังเคราะห์ด้วย WebAudio (ไม่ต้องโหลดไฟล์ ใช้ได้ออฟไลน์)
let ctx = null, master = null, muted = false, nbuf = null;
let loopH = null, song = null, tempoMul = 1;

function ac() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4;
    master = ctx.createGain(); master.gain.value = 0.9;
    master.connect(comp).connect(ctx.destination);
  }
  return ctx;
}
function noise() {
  const c = ac();
  if (!nbuf) {
    nbuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
    const d = nbuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const s = c.createBufferSource(); s.buffer = nbuf; return s;
}
const T = (w = 0) => ac().currentTime + w;

function note(f, dur, { type = 'sine', vol = 0.15, t = T(), slide = null, attack = 0.006, filter = null } = {}) {
  if (muted) return;
  const c = ac(), o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  let node = o.connect(g);
  if (filter) { const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = filter; node = g.connect(fl); }
  node.connect(master);
  o.start(t); o.stop(t + dur + 0.05);
}
function hiss(dur, { t = T(), vol = 0.2, type = 'highpass', freq = 6000, q = 0.7, attack = 0.002, sweep = null } = {}) {
  if (muted) return;
  const c = ac(), s = noise(), f = c.createBiquadFilter(), g = c.createGain();
  f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
  if (sweep) f.frequency.exponentialRampToValueAtTime(sweep, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f).connect(g).connect(master);
  s.start(t); s.stop(t + dur + 0.05);
}

// กลอง
const kick = (t, v = 0.55) => note(150, 0.28, { t, vol: v, slide: 42, attack: 0.002 });
const snare = (t, v = 0.28) => { hiss(0.16, { t, vol: v, freq: 1500 }); note(190, 0.09, { t, type: 'triangle', vol: v * 0.6 }); };
const hat = (t, v = 0.06, open = false) => hiss(open ? 0.22 : 0.04, { t, vol: v, freq: 8000 });
const crash = (t, v = 0.3) => hiss(1.8, { t, vol: v, freq: 4500, attack: 0.004 });
const tom = (t, f, v = 0.4) => note(f, 0.25, { t, vol: v, slide: f * 0.55, type: 'sine', attack: 0.002 });

const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12); // MIDI → Hz
const chordTones = { C: [60, 64, 67], G: [55, 59, 62], Am: [57, 60, 64], F: [53, 57, 60], Dm: [50, 53, 57], E: [52, 56, 59], Bb: [58, 62, 65] };

/* ───── เพลงวนลูป ───── */
const SONGS = {
  // ห้องล็อกเกอร์: สนุก สดใส 4/4
  lobby: {
    bpm: 122, prog: ['C', 'G', 'Am', 'F'],
    step(i, t, ch) {
      const s = i % 16;
      if (s % 4 === 0) kick(t, 0.42);
      if (s === 4 || s === 12) snare(t, 0.2);
      hat(t, s % 2 ? 0.035 : 0.05, s % 4 === 2);
      const root = NOTE(ch[0] - 24);
      if ([0, 3, 6, 8, 11, 14].includes(s)) note(s === 3 || s === 11 ? root * 2 : root, 0.2, { t, type: 'triangle', vol: 0.2 });
      if (s === 2 || s === 10) ch.forEach((n) => note(NOTE(n), 0.16, { t, type: 'sawtooth', vol: 0.035, filter: 1800 }));
      const mel = [2, 1, 0, 1, 2, 1, 0, 2];
      if (s % 2 === 0) note(NOTE(ch[mel[s / 2]] + 12), 0.14, { t, type: 'square', vol: 0.03, filter: 3000 });
    },
  },
  // โหมดห้องเรียน: สดใส น่ารัก เบา ๆ (มาริมบา + กลองเบา)
  classroom: {
    bpm: 104, prog: ['F', 'C', 'Dm', 'Bb'],
    step(i, t, ch) {
      const s = i % 16;
      if (s === 0 || s === 10) kick(t, 0.28);
      if (s === 4 || s === 12) hiss(0.08, { t, vol: 0.06, freq: 2500 });
      if (s % 2 === 0) hat(t, 0.022);
      if ([0, 6, 8, 14].includes(s)) note(NOTE(ch[0] - 24), 0.28, { t, type: 'triangle', vol: 0.12 });
      const mel = [0, 2, 1, 2, 0, 1, 2, 1];
      if (s % 2 === 0) note(NOTE(ch[mel[s / 2]] + 12), 0.18, { t, type: 'triangle', vol: 0.045, attack: 0.003 });
      if (s === 3 || s === 11) note(NOTE(ch[2] + 24), 0.35, { t, type: 'sine', vol: 0.025 });   // กระดิ่งเล็ก ๆ
    },
  },
  // ความคิดเห็นท้ายคาบ: นุ่ม สงบ ไม่มีกลอง
  think: {
    bpm: 72, prog: ['C', 'Am', 'F', 'G'],
    step(i, t, ch) {
      const s = i % 16;
      if (s === 0) ch.forEach((n) => note(NOTE(n), 2.6, { t, type: 'sine', vol: 0.03, attack: 0.6 }));
      if (s === 0 || s === 8) note(NOTE(ch[0] - 12), 1.4, { t, type: 'sine', vol: 0.05, attack: 0.05 });
      const arp = [0, 1, 2, 1, 2, 1, 0, 2];
      if (s % 2 === 0) note(NOTE(ch[arp[s / 2]] + 12), 0.5, { t, type: 'sine', vol: 0.028, attack: 0.02 });
    },
  },
  // ระหว่างตอบ: ตื่นเต้น กดดัน
  question: {
    bpm: 138, prog: ['Am', 'F', 'Dm', 'E'],
    step(i, t, ch) {
      const s = i % 16;
      if (s % 4 === 0) kick(t, 0.5);
      if (s === 4 || s === 12) snare(t, 0.22);
      if (tempoMul > 1 && s % 2 === 1) snare(t, 0.08);
      hat(t, 0.045);
      note(NOTE(ch[0] - 24) * (s % 2 ? 2 : 1), 0.12, { t, type: 'sawtooth', vol: 0.09, filter: 900 });
      if (s % 4 === 0) note(1760, 0.03, { t, type: 'square', vol: 0.025 }); // ติ๊กนาฬิกา
      const arp = [0, 1, 2, 1];
      if (s % 2 === 0) note(NOTE(ch[arp[(s / 2) % 4]] + 12), 0.1, { t, type: 'triangle', vol: 0.05 });
      if (s === 0) ch.forEach((n) => note(NOTE(n), 1.6, { t, type: 'sawtooth', vol: 0.02, filter: 1200, attack: 0.3 }));
    },
  },
};

/* ───── เพลงตามธีมเกมคำถาม (ห้องล็อกเกอร์ = :lobby · ระหว่างตอบ = :question) ─────
   ทำนองเขียนเป็นตัวอักษร 16 ช่อง/ห้อง: '.' เงียบ · '-' ลากเสียงต่อ
   a b c = โน้ตในคอร์ดช่วงต่ำ · 0 1 2 = ช่วงกลาง · 3 4 5 = ช่วงสูง */
Object.assign(chordTones, { Gm: [55, 58, 62], A: [57, 61, 64], Em: [52, 55, 59], D: [50, 54, 57] });
const DR = {
  pop(s, t) { if (s === 0 || s === 8 || s === 10) kick(t, 0.42); if (s === 4 || s === 12) snare(t, 0.2); hat(t, s % 2 ? 0.03 : 0.045, s % 4 === 2); },
  drive(s, t) { if (s % 4 === 0) kick(t, 0.5); if (s === 4 || s === 12) snare(t, 0.22); hat(t, 0.045); if (tempoMul > 1 && s % 2) snare(t, 0.08); },
  soft(s, t) { if (s === 0 || s === 10) kick(t, 0.26); if (s === 4 || s === 12) hiss(0.08, { t, vol: 0.06, freq: 2500 }); if (s % 2 === 0) hat(t, 0.022); },
  onedrop(s, t) { if (s === 8) { kick(t, 0.42); hiss(0.1, { t, vol: 0.1, freq: 2200 }); } if (s % 4 === 2) hat(t, 0.04); if (s % 2) hat(t, 0.015); },
  latin(s, t) { if (s === 0 || s === 6 || s === 8) kick(t, 0.36); if (s === 4 || s === 12) hiss(0.06, { t, vol: 0.09, freq: 3000 }); if ([3, 10, 14].includes(s)) tom(t, 320, 0.12); hat(t, s % 2 ? 0.02 : 0.04); },
  spooky(s, t) { if (s === 0 || s === 6) kick(t, 0.4); if (s === 12) snare(t, 0.18); if (s === 8 || s === 14) tom(t, s === 8 ? 140 : 110, 0.25); if (s % 4 === 2) hat(t, 0.03); },
  // ฉิ่ง-ฉับ + กลองแบบรำวง
  thai(s, t) {
    if (s === 0 || s === 8) hiss(0.5, { t, vol: 0.07, type: 'bandpass', freq: 5200, q: 6 });   // ฉิ่ง
    if (s === 4 || s === 12) hiss(0.06, { t, vol: 0.09, type: 'bandpass', freq: 3600, q: 3 }); // ฉับ
    if ([0, 6, 10].includes(s)) tom(t, s === 0 ? 120 : 170, 0.32);
    if (tempoMul > 1 && s % 2) hiss(0.04, { t, vol: 0.05, type: 'bandpass', freq: 4000, q: 3 });
  },
  // กลองเดินแถวทหาร
  march(s, t, i) {
    if (s === 0 || s === 8) { kick(t, 0.5); tom(t, 72, 0.35); }
    const sn = { 0: 0.2, 2: 0.08, 3: 0.09, 4: 0.26, 6: 0.1, 8: 0.18, 10: 0.08, 11: 0.09, 12: 0.26, 13: 0.07, 14: 0.12, 15: 0.09 };
    if (sn[s]) snare(t, sn[s]);
    if (i % 64 === 0) crash(t, 0.2);
  },
  // กลองศึก (ตื่นเต้น)
  battle(s, t, i) {
    if (s % 4 === 0) kick(t, 0.55);
    if ([0, 3, 6, 10, 12].includes(s)) tom(t, 92, 0.42);
    if ([2, 7, 11, 14].includes(s)) tom(t, 140, 0.28);
    if (s === 4 || s === 12) snare(t, 0.26);
    if (s === 15) snare(t, 0.12);
    hat(t, 0.028);
    if (tempoMul > 1 && s % 2) snare(t, 0.09);
    if (i % 64 === 0) crash(t, 0.22);
  },
};
const BASS = {
  bounce(s, t, ch) { const r = NOTE(ch[0] - 24); if ([0, 3, 6, 8, 11, 14].includes(s)) note(s === 3 || s === 11 ? r * 2 : r, 0.2, { t, type: 'triangle', vol: 0.2 }); },
  root(s, t, ch) { if (s === 0 || s === 8) note(NOTE(ch[0] - 24), 0.5, { t, type: 'triangle', vol: 0.16 }); if (s === 12) note(NOTE(ch[2] - 24), 0.3, { t, type: 'triangle', vol: 0.12 }); },
  pulse(s, t, ch) { note(NOTE(ch[0] - 24) * (s % 2 ? 2 : 1), 0.12, { t, type: 'sawtooth', vol: 0.09, filter: 900 }); },
  eighth(s, t, ch) { if (s % 2 === 0) note(NOTE(ch[0] - 24) * (s % 4 === 2 ? 2 : 1), 0.16, { t, type: 'triangle', vol: 0.17 }); },
  reggae(s, t, ch) { if ([0, 3, 6, 10].includes(s)) note(NOTE((s === 6 ? ch[2] : ch[0]) - 24), 0.22, { t, type: 'sine', vol: 0.24 }); },
  walk(s, t, ch) { if (s % 4 === 0) note(NOTE(ch[0] - 24 + [0, 3, 5, 6][s / 4]), 0.24, { t, type: 'triangle', vol: 0.18 }); },
  march(s, t, ch) { if (s === 0 || s === 8) note(NOTE(ch[0] - 24), 0.35, { t, type: 'sawtooth', vol: 0.11, filter: 600 }); if (s === 4 || s === 12) note(NOTE(ch[2] - 24), 0.25, { t, type: 'sawtooth', vol: 0.08, filter: 600 }); },
  gallop(s, t, ch) { if (s % 4 !== 1) note(NOTE(ch[0] - 24), 0.09, { t, type: 'sawtooth', vol: 0.11, filter: 700 }); },
};
const FX = {
  tick(s, t) { if (s % 4 === 0) note(1760, 0.03, { t, type: 'square', vol: 0.025 }); },
  sparkle(s, t, ch) { if (s === 14) note(NOTE(ch[2] + 36), 0.14, { t, type: 'sine', vol: 0.025 }); },
  bubble(s, t) { if ((s === 7 || s === 15) && Math.random() < 0.6) note(500 + Math.random() * 400, 0.14, { t, type: 'sine', vol: 0.035, slide: 1300 + Math.random() * 500 }); },
  bird(s, t, ch, i) { if (s === 6 && (i >> 4) % 2) { note(2400, 0.07, { t, vol: 0.02, slide: 3300 }); note(2600, 0.07, { t: t + 0.09, vol: 0.018, slide: 3500 }); } },
  twinkle(s, t, ch) { if (s % 4 === 3 && Math.random() < 0.45) note(NOTE(ch[Math.floor(Math.random() * 3)] + 36), 0.3, { t, type: 'sine', vol: 0.018 }); },
  pencil(s, t, ch, i) { if (s === 14 && (i >> 4) % 2 === 0) hiss(0.12, { t, vol: 0.04, type: 'bandpass', freq: 3500, q: 2, sweep: 5000 }); },
  drip(s, t, ch) { if (s % 2 === 1 && Math.random() < 0.3) note(NOTE(ch[Math.floor(Math.random() * 3)] + 36), 0.18, { t, type: 'sine', vol: 0.02, attack: 0.002 }); },
  firefly(s, t, ch, i) { if (s === 10 && (i >> 4) % 2) note(NOTE(ch[1] + 36), 0.8, { t, type: 'sine', vol: 0.016, attack: 0.15 }); },
  boo(s, t, ch, i) { if (s === 0 && (i >> 4) % 2) note(NOTE(ch[2] + 24), 0.9, { t, type: 'sine', vol: 0.022, slide: NOTE(ch[2] + 23), attack: 0.2 }); },
};
function parseMel(str) {
  const out = []; let last = null;
  for (const c of str) {
    if (c === '-') { if (last) last.len++; out.push(null); continue; }
    const k = 'abc012345'.indexOf(c);
    last = k < 0 ? null : { n: k % 3, o: Math.floor(k / 3) - 1, len: 1 };
    out.push(last);
  }
  return out;
}
function make(c) {
  const mels = [].concat(c.mel || []).map(parseMel);
  const fx = [].concat(c.fx || []).map((k) => FX[k]);
  return {
    bpm: c.bpm, prog: c.prog,
    step(i, t, ch, sd) {
      const s = i % 16, bar = Math.floor(i / 16);
      c.drum && DR[c.drum](s, t, i);
      c.bass && BASS[c.bass](s, t, ch);
      if (c.skank?.includes(s)) ch.forEach((n) => note(NOTE(n + 12), 0.09, { t, type: 'triangle', vol: 0.032 }));
      if (c.pad && s === 0) ch.forEach((n) => note(NOTE(n), sd * 15, { t, type: c.pad.type || 'sine', vol: c.pad.vol || 0.025, attack: 0.3, filter: c.pad.filter || null }));
      const L = c.lead, q = mels.length && mels[bar % mels.length][s];
      if (q) {
        const f = NOTE(ch[q.n] + 12 * q.o + (L.oct || 0));
        note(f, q.len * sd * 0.92, { t, type: L.type, vol: L.vol, filter: L.filter || null, attack: L.attack || 0.006 });
        if (L.fifth) note(f * 1.498, q.len * sd * 0.9, { t, type: L.type, vol: L.vol * 0.55, filter: L.filter || null, attack: L.attack || 0.006 });
      }
      fx.forEach((f) => f(s, t, ch, i, sd));
    },
  };
}
const THEME_SONGS = {
  candy: {
    lobby: { bpm: 128, prog: ['C', 'Am', 'F', 'G'], drum: 'pop', bass: 'bounce', lead: { type: 'square', vol: 0.03, filter: 3200 }, mel: ['0.1.2.4.2-1.0.2.', '4.3.2.1.2---0...'], fx: 'sparkle' },
    question: { bpm: 144, prog: ['Am', 'F', 'C', 'G'], drum: 'drive', bass: 'pulse', lead: { type: 'square', vol: 0.028, filter: 3000 }, mel: '0.1.2.1.0.1.2.1.', fx: ['tick', 'sparkle'] },
  },
  ocean: {
    lobby: { bpm: 96, prog: ['F', 'C', 'Dm', 'Bb'], drum: 'onedrop', bass: 'reggae', skank: [4, 12], lead: { type: 'triangle', vol: 0.05 }, mel: ['2--.1.0---..2.1.', '0--.1.2---..4-..'], fx: 'bubble' },
    question: { bpm: 130, prog: ['Dm', 'Bb', 'F', 'C'], drum: 'drive', bass: 'eighth', lead: { type: 'triangle', vol: 0.05 }, mel: '0.2.1.2.0.2.1.2.', fx: ['tick', 'bubble'] },
  },
  garden: {
    lobby: { bpm: 112, prog: ['C', 'F', 'Am', 'G'], drum: 'soft', bass: 'root', lead: { type: 'triangle', vol: 0.05, attack: 0.003 }, mel: ['0.1.2.1.3.2.1.2.', '2.1.0.1.2---....'], fx: 'bird' },
    question: { bpm: 136, prog: ['Am', 'F', 'C', 'G'], drum: 'drive', bass: 'eighth', lead: { type: 'triangle', vol: 0.045, attack: 0.003 }, mel: '0121012101210121', fx: ['tick', 'bird'] },
  },
  sky: {
    lobby: { bpm: 124, prog: ['F', 'G', 'Em', 'Am'], drum: 'pop', bass: 'eighth', pad: { vol: 0.02 }, lead: { type: 'sine', vol: 0.05 }, mel: ['3.4.5.4.3---1.2.', '2.1.0.1.2.3.4---'], fx: 'sparkle' },
    question: { bpm: 140, prog: ['Am', 'G', 'F', 'E'], drum: 'drive', bass: 'pulse', lead: { type: 'triangle', vol: 0.05 }, mel: '0.1.2.3.2.1.0.1.', fx: 'tick' },
  },
  space: {
    lobby: { bpm: 108, prog: ['Am', 'F', 'C', 'G'], drum: 'pop', bass: 'pulse', pad: { type: 'sawtooth', vol: 0.018, filter: 900 }, lead: { type: 'sawtooth', vol: 0.026, filter: 2000 }, mel: '0120120120120120', fx: 'twinkle' },
    question: { bpm: 132, prog: ['Am', 'E', 'F', 'G'], drum: 'drive', bass: 'pulse', lead: { type: 'square', vol: 0.024, filter: 2400 }, mel: '0121012101210121', fx: ['tick', 'twinkle'] },
  },
  fruit: {
    lobby: { bpm: 116, prog: ['C', 'Am', 'Dm', 'G'], drum: 'latin', bass: 'bounce', skank: [2, 6, 10, 14], lead: { type: 'triangle', vol: 0.055, attack: 0.002 }, mel: ['0.0.2.1.0.2.1...', '3.2.1.2.0---....'] },
    question: { bpm: 140, prog: ['Dm', 'Bb', 'F', 'C'], drum: 'latin', bass: 'eighth', lead: { type: 'triangle', vol: 0.05, attack: 0.002 }, mel: '0.2.1.0.2.1.0.1.', fx: 'tick' },
  },
  notebook: {
    lobby: { bpm: 92, prog: ['F', 'Em', 'Dm', 'C'], drum: 'soft', bass: 'root', pad: { type: 'triangle', vol: 0.02 }, lead: { type: 'sine', vol: 0.055 }, mel: ['2...1.0.2...4---', '1...0.1.2-------'], fx: 'pencil' },
    question: { bpm: 128, prog: ['Am', 'Dm', 'E', 'Am'], drum: 'drive', bass: 'eighth', lead: { type: 'triangle', vol: 0.045 }, mel: '0.1.2.1.2.1.0...', fx: ['tick', 'pencil'] },
  },
  spooky: {
    lobby: { bpm: 112, prog: ['Am', 'Dm', 'E', 'Am'], drum: 'spooky', bass: 'walk', lead: { type: 'square', vol: 0.025, filter: 2500, attack: 0.002 }, mel: ['0.1.2.1.0.4.3.2.', '3.2.1.0.2---....'], fx: 'boo' },
    question: { bpm: 140, prog: ['Am', 'F', 'E', 'Am'], drum: 'drive', bass: 'pulse', lead: { type: 'square', vol: 0.024, filter: 2500, attack: 0.002 }, mel: '0.1.2.1.0.1.2.1.', fx: ['tick', 'boo'] },
  },
  // ธีมทั้งเว็บ (ใช้เมื่อธีมเกมเป็นค่าเริ่มต้น 👻)
  loykrathong: {
    lobby: { bpm: 104, prog: ['C', 'F', 'C', 'G'], drum: 'thai', bass: 'root', lead: { type: 'triangle', vol: 0.055, attack: 0.002 }, mel: ['2.2.1.0.1---2.4.', '4.3.2.1.0---....'] },
    question: { bpm: 134, prog: ['Am', 'C', 'G', 'Am'], drum: 'thai', bass: 'eighth', lead: { type: 'triangle', vol: 0.05, attack: 0.002 }, mel: '0.1.2.1.2.4.2.1.', fx: 'tick' },
  },
  summer: {
    lobby: { bpm: 118, prog: ['C', 'F', 'G', 'C'], drum: 'latin', bass: 'bounce', skank: [2, 6, 10, 14], lead: { type: 'triangle', vol: 0.055, attack: 0.002 }, mel: ['0.2.4.2.3---2.1.', '1.0.1.2.0---....'], fx: 'sparkle' },
    question: { bpm: 142, prog: ['Am', 'F', 'C', 'G'], drum: 'latin', bass: 'eighth', lead: { type: 'triangle', vol: 0.05, attack: 0.002 }, mel: '0.2.1.0.2.1.0.1.', fx: 'tick' },
  },
  night: {
    lobby: { bpm: 82, prog: ['F', 'C', 'Dm', 'Bb'], drum: 'soft', bass: 'root', pad: { vol: 0.03 }, lead: { type: 'sine', vol: 0.05 }, mel: ['2-----1-0-----..', '1-----2-4-------'], fx: 'firefly' },
    question: { bpm: 124, prog: ['Dm', 'Bb', 'F', 'C'], drum: 'drive', bass: 'eighth', lead: { type: 'sine', vol: 0.05 }, mel: '0.1.2.1.0.1.2.1.', fx: ['tick', 'firefly'] },
  },
  rain: {
    lobby: { bpm: 88, prog: ['Am', 'F', 'C', 'G'], drum: 'soft', bass: 'root', pad: { type: 'triangle', vol: 0.02 }, lead: { type: 'triangle', vol: 0.05, attack: 0.003 }, mel: ['0.1.2...1.0.....', '2.1.0...4-------'], fx: 'drip' },
    question: { bpm: 128, prog: ['Am', 'F', 'C', 'E'], drum: 'drive', bass: 'eighth', lead: { type: 'triangle', vol: 0.045, attack: 0.003 }, mel: '0.1.2.1.0.1.2.1.', fx: ['tick', 'drip'] },
  },
  // สงคราม: แตรทหาร + กลองเดินแถว / กลองศึกตอนตอบ
  war: {
    lobby: { bpm: 112, prog: ['Dm', 'Bb', 'Gm', 'A'], drum: 'march', bass: 'march', pad: { type: 'sawtooth', vol: 0.018, filter: 700 }, lead: { type: 'sawtooth', vol: 0.045, filter: 1700, attack: 0.02, fifth: true }, mel: ['0---0.0.2---1.0.', '3---2.1.0-----..'] },
    question: { bpm: 144, prog: ['Dm', 'Bb', 'Gm', 'A'], drum: 'battle', bass: 'gallop', lead: { type: 'sawtooth', vol: 0.04, filter: 1500, attack: 0.01, fifth: true }, mel: ['0..0..0.2..1..0.', '3..3..2.1..0..c.'], fx: 'tick' },
  },
};
for (const [th, v] of Object.entries(THEME_SONGS)) for (const [k, c] of Object.entries(v)) SONGS[`${th}:${k}`] = make(c);

let base = null, mTheme = 'ghost';
/** เปลี่ยนชุดเพลงตามธีม — ถ้าเพลงเล่นอยู่จะสลับเป็นเพลงของธีมใหม่ทันที */
export function setMusicTheme(id) { if (id === mTheme) return; mTheme = id; if (loopH && base) music(base); }
export function music(name) {
  clearInterval(loopH); loopH = null; song = null; tempoMul = 1; base = name;
  const pick = name && (SONGS[`${mTheme}:${name}`] || SONGS[name]);
  if (!pick || muted) return;
  song = pick;
  const c = ac();
  let step = 0, next = c.currentTime + 0.08;
  loopH = setInterval(() => {
    while (next < c.currentTime + 0.2) {
      const bar = Math.floor(step / 16) % song.prog.length;
      const sd = 60 / (song.bpm * tempoMul) / 4;
      song.step(step, next, chordTones[song.prog[bar]], sd);
      next += sd;
      step++;
    }
  }, 40);
}
export const musicOn = () => !!loopH;
export const currentSong = () => (loopH ? Object.keys(SONGS).find((k) => SONGS[k] === song) : null);
export const hurry = (on) => { tempoMul = on ? 1.3 : 1; };

/* ───── เสียงเอฟเฟกต์ ───── */
function drumroll(dur = 1.5, t0 = T(), end = true) {
  if (muted) return;
  const n = Math.floor(dur * 26);
  for (let i = 0; i < n; i++) {
    const k = i / n;
    snare(t0 + dur * (1 - Math.pow(1 - k, 1.4)) * 0.98, 0.05 + k * 0.22);
  }
  if (end) { kick(t0 + dur, 0.6); crash(t0 + dur, 0.32); }
}
function cheer(t = T(), dur = 2.4) {
  hiss(dur, { t, vol: 0.22, type: 'bandpass', freq: 1400, q: 0.5, attack: 0.25 });
  for (let i = 0; i < 6; i++) note(1800 + Math.random() * 900, 0.25, { t: t + 0.2 + Math.random() * 1.2, vol: 0.03, slide: 2600 + Math.random() * 600 });
}
function chord(names, t, dur, type = 'sawtooth', vol = 0.05) {
  names.forEach((n) => note(NOTE(n), dur, { t, type, vol, filter: 2600, attack: 0.02 }));
}

export const sfx = {
  pop: () => { const f = 500 + Math.random() * 400; note(f, 0.12, { type: 'sine', vol: 0.25, slide: f * 2.2 }); note(f * 2.5, 0.08, { type: 'triangle', vol: 0.08, t: T(0.07) }); },
  tap: () => note(900, 0.07, { type: 'triangle', vol: 0.18, slide: 1300 }),
  tick: () => note(1200, 0.04, { type: 'square', vol: 0.03 }),
  urgent: () => { note(1568, 0.09, { type: 'square', vol: 0.09 }); note(1568, 0.09, { type: 'square', vol: 0.06, t: T(0.12) }); },
  count: (n) => { note(n ? 880 : 1760, n ? 0.18 : 0.5, { type: 'square', vol: 0.12, filter: 4000 }); kick(T(), 0.4); },
  whoosh: () => hiss(0.5, { vol: 0.18, type: 'bandpass', freq: 400, sweep: 5000, q: 1.2, attack: 0.15 }),
  go: () => { const t = T(); kick(t, 0.6); crash(t, 0.25); chord([60, 64, 67, 72], t, 0.5, 'sawtooth', 0.06); },
  timeUp: () => { const t = T(); note(1046, 0.12, { t, type: 'square', vol: 0.12 }); note(784, 0.4, { t: t + 0.13, type: 'square', vol: 0.12, filter: 3000 }); kick(t + 0.13, 0.6); },
  reveal: () => { const t = T(); drumroll(1.1, t); chord([60, 64, 67, 72], t + 1.1, 0.9, 'sawtooth', 0.07); note(NOTE(84), 0.9, { t: t + 1.1, type: 'triangle', vol: 0.08 }); },
  correct: () => { const t = T(); [72, 76, 79, 84].forEach((n, i) => note(NOTE(n), 0.35, { t: t + i * 0.08, type: 'triangle', vol: 0.16 })); [96, 100, 103].forEach((n, i) => note(NOTE(n), 0.2, { t: t + 0.35 + i * 0.06, vol: 0.06 })); hiss(0.6, { t: t + 0.3, vol: 0.05, freq: 9000 }); },
  wrong: () => { const t = T(); [67, 66, 65].forEach((n, i) => note(NOTE(n - 12), 0.28, { t: t + i * 0.3, type: 'sawtooth', vol: 0.1, filter: 1100 })); note(NOTE(52), 0.9, { t: t + 0.9, type: 'sawtooth', vol: 0.1, filter: 900, slide: NOTE(49) }); },
  rankStep: (k = 0) => { const t = T(); tom(t, 110 + k * 30, 0.45); note(NOTE(67 + k * 2), 0.18, { t, type: 'triangle', vol: 0.1 }); hiss(0.25, { t, vol: 0.08, freq: 3000 }); },
  drumroll: (d = 1.5) => drumroll(d, T(), false),
  first: () => { const t = T(); kick(t, 0.7); crash(t, 0.35); chord([60, 64, 67, 72], t, 1.2, 'sawtooth', 0.07); cheer(t + 0.1, 1.8); },
  fanfare: () => {
    const t = T(); const seq = [[67, 0.15], [67, 0.15], [67, 0.15], [72, 0.5], [67, 0.25], [72, 0.9]];
    let w = 0;
    seq.forEach(([n, d]) => { note(NOTE(n), d + 0.1, { t: t + w, type: 'sawtooth', vol: 0.09, filter: 3200 }); note(NOTE(n - 12), d + 0.1, { t: t + w, type: 'square', vol: 0.04, filter: 2000 }); w += d; });
    kick(t + 0.45, 0.6); crash(t + 0.45, 0.3); kick(t + w - 0.9, 0.7); crash(t + w - 0.9, 0.35);
    chord([60, 64, 67, 72, 76], t + w - 0.9, 1.6, 'sawtooth', 0.05);
    cheer(t + 0.4, 3);
  },
  cheer: () => cheer(),
  intro: () => {
    const t = T();
    [60, 64, 67, 72, 76, 79, 84].forEach((n, i) => note(NOTE(n), 0.16, { t: t + i * 0.055, type: 'square', vol: 0.05, filter: 3500 }));
    kick(t + 0.42, 0.65); crash(t + 0.42, 0.3);
    chord([60, 64, 67, 72], t + 0.42, 0.9, 'sawtooth', 0.06);
    hiss(0.5, { t, vol: 0.12, type: 'bandpass', freq: 500, sweep: 6000, q: 1.2, attack: 0.3 });
  },
};

export function setMuted(m) { muted = m; if (m) music(null); }
export const isMuted = () => muted;
export function unlock() { try { ac().resume(); } catch {} }
