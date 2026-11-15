// เสียงประกอบสังเคราะห์ด้วย WebAudio (ไม่ต้องโหลดไฟล์)
let ctx = null, muted = false, musicTimer = null;
const ac = () => (ctx ??= new (window.AudioContext || window.webkitAudioContext)());

function tone(freq, dur = 0.12, type = 'sine', vol = 0.15, when = 0) {
  if (muted) return;
  const c = ac();
  const t = c.currentTime + when;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.03);
}

export const sfx = {
  pop: () => { tone(660, 0.08, 'triangle', 0.18); tone(990, 0.1, 'triangle', 0.14, 0.06); },
  tap: () => tone(880, 0.06, 'triangle', 0.15),
  tick: () => tone(1100, 0.04, 'square', 0.04),
  urgent: () => tone(1500, 0.07, 'square', 0.07),
  go: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, 'triangle', 0.15, i * 0.07)),
  correct: () => [784, 988, 1319].forEach((f, i) => tone(f, 0.28, 'sine', 0.18, i * 0.09)),
  wrong: () => { tone(233, 0.3, 'sawtooth', 0.07); tone(185, 0.4, 'sawtooth', 0.07, 0.14); },
  reveal: () => { tone(392, 0.12, 'triangle', 0.15); tone(523, 0.35, 'triangle', 0.15, 0.1); },
  whoosh: () => [300, 450, 650].forEach((f, i) => tone(f, 0.08, 'sine', 0.08, i * 0.03)),
  fanfare: () => [523, 523, 523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(f, i === 7 ? 0.6 : 0.2, 'square', 0.06, i * 0.14)),
  drum: () => { for (let i = 0; i < 10; i++) tone(120 + i * 4, 0.05, 'triangle', 0.12, i * 0.08); },
};

// เพลงรอในห้องล็อกเกอร์ (ลูปสั้นๆ)
const PROG = [[261.6, 329.6, 392], [220, 261.6, 329.6], [174.6, 220, 261.6], [196, 246.9, 293.7]];
export function music(on) {
  clearInterval(musicTimer);
  musicTimer = null;
  if (!on || muted) return;
  let step = 0;
  musicTimer = setInterval(() => {
    const chord = PROG[Math.floor(step / 8) % 4];
    const n = step % 8;
    if (n % 4 === 0) tone(chord[0] / 2, 0.35, 'triangle', 0.07);
    tone(chord[[0, 1, 2, 1, 2, 0, 1, 2][n]] * 2, 0.16, 'sine', 0.035);
    step++;
  }, 210);
}
export const musicOn = () => !!musicTimer;
export function setMuted(m) { muted = m; if (m) music(false); }
export const isMuted = () => muted;
export function unlock() { try { ac().resume(); } catch {} }
