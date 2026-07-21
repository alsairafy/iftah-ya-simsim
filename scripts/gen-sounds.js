// يولّد مؤثرات صوتية بصيغة WAV بدون أي ملفات خارجية
const fs = require('fs');
const path = require('path');

const RATE = 22050;
const OUT = process.argv[2];

function wav(samples) {
  const n = samples.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(RATE, 24);
  buf.writeUInt32LE(RATE * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(v * 32000), 44 + i * 2);
  }
  return buf;
}

const len = (sec) => Math.floor(sec * RATE);

// غلاف ADSR بسيط يمنع الطقطقة
function env(i, total, attack = 0.01, release = 0.25) {
  const t = i / RATE;
  const dur = total / RATE;
  const a = Math.min(1, t / attack);
  const r = Math.min(1, (dur - t) / release);
  return Math.max(0, a * r);
}

// نغمة: sine مع توافقية خفيفة تعطي دفئاً شبيهاً بالآلات الخشبية
function tone(freq, sec, { gain = 0.5, harm = 0.3, attack = 0.008, release, vibrato = 0 } = {}) {
  const n = len(sec);
  const out = new Float32Array(n);
  const rel = release ?? sec * 0.55;
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    const f = freq * (1 + (vibrato ? Math.sin(2 * Math.PI * 6 * t) * vibrato : 0));
    const p = 2 * Math.PI * f * t;
    out[i] = (Math.sin(p) + harm * Math.sin(2 * p) + harm * 0.4 * Math.sin(3 * p)) * gain * env(i, n, attack, rel);
  }
  return out;
}

// انزلاق ترددي (glide)
function sweep(f0, f1, sec, { gain = 0.5, harm = 0.25, square = false } = {}) {
  const n = len(sec);
  const out = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const k = i / n;
    const f = f0 + (f1 - f0) * k;
    phase += (2 * Math.PI * f) / RATE;
    const base = square ? Math.sign(Math.sin(phase)) * 0.6 : Math.sin(phase);
    out[i] = (base + harm * Math.sin(2 * phase)) * gain * env(i, n, 0.01, sec * 0.4);
  }
  return out;
}

// ضجيج مُرشَّح — للنقرات والحفيف
function noise(sec, { gain = 0.3, decay = 6 } = {}) {
  const n = len(sec);
  const out = new Float32Array(n);
  let last = 0;
  for (let i = 0; i < n; i++) {
    const white = Math.random() * 2 - 1;
    last = last * 0.72 + white * 0.28; // ترشيح تمرير منخفض
    out[i] = last * gain * Math.exp((-decay * i) / n) * env(i, n, 0.002, sec * 0.5);
  }
  return out;
}

const mix = (...tracks) => {
  const n = Math.max(...tracks.map((t) => t.length));
  const out = new Float32Array(n);
  tracks.forEach((t) => {
    for (let i = 0; i < t.length; i++) out[i] += t[i];
  });
  return out;
};

const at = (track, sec) => {
  const off = len(sec);
  const out = new Float32Array(off + track.length);
  out.set(track, off);
  return out;
};

const seq = (notes) => mix(...notes.map(([tr, t]) => at(tr, t)));

// السلّم الموسيقي
const N = { C4: 261.6, D4: 293.7, E4: 329.6, F4: 349.2, G4: 392, A4: 440, B4: 493.9,
            C5: 523.3, D5: 587.3, E5: 659.3, G5: 784, A5: 880, C6: 1046.5, E6: 1318.5 };

const SOUNDS = {
  // نقرة زر — قصيرة وناعمة
  tap: () => mix(tone(N.A5, 0.07, { gain: 0.3, harm: 0.15, release: 0.06 }), noise(0.04, { gain: 0.12 })),

  // نبضة العدّ التنازلي ٣ ٢ ١
  count: () => tone(N.E5, 0.15, { gain: 0.42, harm: 0.25, release: 0.12 }),

  // انطلاق الجولة
  go: () => seq([[tone(N.C5, 0.12, { gain: 0.4 }), 0], [tone(N.G5, 0.26, { gain: 0.45, vibrato: 0.004 }), 0.1]]),

  // إجابة صحيحة — أربع نغمات صاعدة
  correct: () =>
    seq([
      [tone(N.C5, 0.13, { gain: 0.4 }), 0],
      [tone(N.E5, 0.13, { gain: 0.4 }), 0.075],
      [tone(N.G5, 0.13, { gain: 0.42 }), 0.15],
      [tone(N.C6, 0.34, { gain: 0.45, vibrato: 0.005 }), 0.225],
    ]),

  // إجابة خاطئة — نغمتان هابطتان
  wrong: () =>
    seq([
      [sweep(300, 200, 0.16, { gain: 0.36, square: true }), 0],
      [sweep(220, 130, 0.32, { gain: 0.34, square: true }), 0.15],
    ]),

  // انتهاء الوقت — جرس إنذار
  timeup: () =>
    seq([
      [tone(N.A4, 0.14, { gain: 0.4, harm: 0.5 }), 0],
      [tone(N.F4, 0.14, { gain: 0.4, harm: 0.5 }), 0.16],
      [tone(N.D4, 0.36, { gain: 0.4, harm: 0.5 }), 0.32],
    ]),

  // متتالية 🔥 — رشّة نغمات عالية
  streak: () =>
    seq([
      [tone(N.G5, 0.09, { gain: 0.3 }), 0],
      [tone(N.C6, 0.09, { gain: 0.32 }), 0.055],
      [tone(N.E6, 0.22, { gain: 0.34 }), 0.11],
    ]),

  // نهاية الجولة — فانفير
  finish: () =>
    seq([
      [tone(N.C5, 0.16, { gain: 0.38 }), 0],
      [tone(N.E5, 0.16, { gain: 0.38 }), 0.12],
      [tone(N.G5, 0.16, { gain: 0.4 }), 0.24],
      [tone(N.C6, 0.2, { gain: 0.4 }), 0.36],
      [tone(N.G5, 0.14, { gain: 0.34 }), 0.5],
      [tone(N.C6, 0.55, { gain: 0.45, vibrato: 0.006 }), 0.6],
      [tone(N.E6, 0.5, { gain: 0.28, vibrato: 0.006 }), 0.65],
    ]),

  // دقّة الثواني الأخيرة
  tick: () => mix(tone(N.B4, 0.05, { gain: 0.22, harm: 0.1, release: 0.04 }), noise(0.03, { gain: 0.08 })),
};

fs.mkdirSync(OUT, { recursive: true });
let total = 0;
for (const [name, make] of Object.entries(SOUNDS)) {
  const buf = wav(make());
  const file = path.join(OUT, `${name}.wav`);
  fs.writeFileSync(file, buf);
  total += buf.length;
  console.log(`${name}.wav  ${(buf.length / 1024).toFixed(1)} KB`);
}
console.log(`\nالمجموع: ${(total / 1024).toFixed(1)} KB`);
