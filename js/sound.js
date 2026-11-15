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

export function music(name) {
  clearInterval(loopH); loopH = null; song = null; tempoMul = 1;
  if (!name || muted || !SONGS[name]) return;
  song = SONGS[name];
  const c = ac();
  let step = 0, next = c.currentTime + 0.08;
  loopH = setInterval(() => {
    while (next < c.currentTime + 0.2) {
      const bar = Math.floor(step / 16) % song.prog.length;
      song.step(step, next, chordTones[song.prog[bar]]);
      next += 60 / (song.bpm * tempoMul) / 4;
      step++;
    }
  }, 40);
}
export const musicOn = () => !!loopH;
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
};

export function setMuted(m) { muted = m; if (m) music(null); }
export const isMuted = () => muted;
export function unlock() { try { ac().resume(); } catch {} }
