/**
 * يولّد موسيقى خلفية قابلة للتكرار بلا أي فاصل أو طقطقة.
 *
 * الفكرة: كل الحسابات بالعيّنات (samples) وليس بالثواني، وطول اللفة يقبل القسمة
 * على الإيقاع تماماً. أي نغمة يتجاوز ذيلها نهاية اللفة يلتفّ إلى بدايتها،
 * فيصبح الناتج دورياً رياضياً — أي أن آخر عيّنة تكمل أول عيّنة بشكل طبيعي.
 */
const fs = require('fs');
const path = require('path');

const RATE = 16000;
const OUT = process.argv[2];

function wav(samples) {
  const n = samples.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
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

const NOTE = {
  C2: 65.4, D2: 73.4, E2: 82.4, F2: 87.3, G2: 98, A2: 110, B2: 123.5,
  C3: 130.8, D3: 146.8, E3: 164.8, F3: 174.6, G3: 196, A3: 220, B3: 246.9,
  C4: 261.6, D4: 293.7, E4: 329.6, F4: 349.2, G4: 392, A4: 440, B4: 493.9,
  C5: 523.3, D5: 587.3, E5: 659.3, F5: 698.5, G5: 784, A5: 880,
};

/** نغمة ناعمة تلتفّ حول نهاية اللفة. المواضع كلها بالعيّنات. */
function note(track, startSample, durSamples, freq, opts = {}) {
  const { gain = 0.2, harm = 0.25, attack = 0.012, decay = 0.5 } = opts;
  const n = track.length;
  const atkS = Math.max(1, attack * RATE);
  for (let k = 0; k < durSamples; k++) {
    const tt = k / RATE;
    const p = 2 * Math.PI * freq * tt;
    const a = Math.min(1, k / atkS);
    const d = Math.exp(-tt / decay);
    const v = (Math.sin(p) + harm * Math.sin(2 * p) + harm * 0.35 * Math.sin(3 * p)) * gain * a * d;
    track[(startSample + k) % n] += v;
  }
}

/** حفيف إيقاعي خفيف (شيكر) */
function shaker(track, startSample, opts = {}) {
  const { gain = 0.05, durSamples = Math.floor(0.06 * RATE) } = opts;
  const n = track.length;
  let last = 0;
  for (let k = 0; k < durSamples; k++) {
    const white = Math.random() * 2 - 1;
    last = last * 0.35 + white * 0.65;
    track[(startSample + k) % n] += last * gain * Math.exp((-6 * k) / durSamples);
  }
}

/**
 * يبني لفة. beatSamples لازم يقبل القسمة على ٨ حتى تنضبط الأنصاف والأرباع.
 */
function makeLoop({ beatSamples, bars, build }) {
  const barSamples = beatSamples * 4;
  const total = barSamples * bars; // عدد صحيح تماماً ⇒ دورية مضبوطة
  const track = new Float32Array(total);
  build({ track, beatSamples, barSamples, bars });
  return track;
}

/* ---------- مقطوعة اللعب: مرحة وخفيفة (≈108 نبضة) ---------- */
function gameLoop() {
  return makeLoop({
    beatSamples: 8888, // 8888/16000 ≈ 0.5555s ⇒ ~108 BPM، ويقبل القسمة على ٨
    bars: 8,
    build: ({ track, beatSamples, barSamples, bars }) => {
      const chords = [
        { root: NOTE.C2, notes: [NOTE.C4, NOTE.E4, NOTE.G4] },
        { root: NOTE.A2, notes: [NOTE.A3, NOTE.C4, NOTE.E4] },
        { root: NOTE.F2, notes: [NOTE.F3, NOTE.A3, NOTE.C4] },
        { root: NOTE.G2, notes: [NOTE.G3, NOTE.B3, NOTE.D4] },
      ];
      // عبارة لحنية لكل كورد: [التردد، موضعها بالإيقاعات]
      const phrases = [
        [[NOTE.G4, 0], [NOTE.E4, 1.5], [NOTE.C5, 2.5]],
        [[NOTE.A4, 0], [NOTE.C5, 1.5], [NOTE.E4, 3]],
        [[NOTE.F4, 0], [NOTE.A4, 1], [NOTE.C5, 2.5]],
        [[NOTE.G4, 0], [NOTE.D5, 2], [NOTE.B4, 3]],
      ];

      for (let b = 0; b < bars; b++) {
        const t0 = b * barSamples;
        const ch = chords[b % 4];

        // باص: نبضتان في المازورة
        note(track, t0, beatSamples * 1.4, ch.root, { gain: 0.16, harm: 0.12, decay: 0.45 });
        note(track, t0 + beatSamples * 2, beatSamples * 1.4, ch.root, { gain: 0.13, harm: 0.12, decay: 0.4 });

        // كورد مقطّع على النبضتين ٢ و٤
        ch.notes.forEach((f, i) => {
          note(track, t0 + beatSamples, beatSamples * 0.55, f, { gain: 0.055 - i * 0.006, decay: 0.22 });
          note(track, t0 + beatSamples * 3, beatSamples * 0.55, f, { gain: 0.05 - i * 0.006, decay: 0.22 });
        });

        // اللحن في المازورات الفردية فقط ليبقى المزاج خفيفاً
        if (b % 2 === 1) {
          phrases[b % 4].forEach(([f, off]) => {
            note(track, t0 + beatSamples * off, beatSamples * 0.9, f, { gain: 0.085, harm: 0.3, decay: 0.35 });
          });
        }

        // شيكر على كل نصف نبضة
        for (let k = 0; k < 8; k++) {
          shaker(track, t0 + (beatSamples / 2) * k, { gain: k % 2 ? 0.028 : 0.045 });
        }
      }
    },
  });
}

/* ---------- مقطوعة القوائم: هادئة وأبطأ (≈76 نبضة) ---------- */
function menuLoop() {
  return makeLoop({
    beatSamples: 12632, // ≈0.7895s ⇒ ~76 BPM، ويقبل القسمة على ٨
    bars: 8,
    build: ({ track, beatSamples, barSamples, bars }) => {
      const chords = [
        { root: NOTE.F2, notes: [NOTE.F3, NOTE.A3, NOTE.C4] },
        { root: NOTE.C3, notes: [NOTE.E3, NOTE.G3, NOTE.C4] },
        { root: NOTE.D3, notes: [NOTE.D3, NOTE.F3, NOTE.A3] },
        { root: NOTE.G2, notes: [NOTE.G3, NOTE.B3, NOTE.D4] },
      ];
      const twinkle = [NOTE.C5, NOTE.A4, NOTE.G4, NOTE.E4, NOTE.F4, NOTE.C5, NOTE.D5, NOTE.A4];

      for (let b = 0; b < bars; b++) {
        const t0 = b * barSamples;
        const ch = chords[b % 4];

        note(track, t0, beatSamples * 2.4, ch.root, { gain: 0.14, harm: 0.1, decay: 0.9 });

        ch.notes.forEach((f, i) => {
          note(track, t0 + Math.floor(beatSamples * 0.15 * i), beatSamples * 2.6, f, {
            gain: 0.045,
            harm: 0.18,
            attack: 0.08,
            decay: 0.85,
          });
        });

        note(track, t0 + beatSamples * 2.5, beatSamples * 1.5, twinkle[b % twinkle.length], {
          gain: 0.06,
          harm: 0.35,
          decay: 0.5,
        });
      }
    },
  });
}

// تطبيع لمستوى منخفض حتى لا تزاحم المؤثرات الصوتية
function normalize(track, peak = 0.6) {
  let max = 0;
  for (let i = 0; i < track.length; i++) max = Math.max(max, Math.abs(track[i]));
  if (max === 0) return track;
  const g = peak / max;
  for (let i = 0; i < track.length; i++) track[i] *= g;
  return track;
}

fs.mkdirSync(OUT, { recursive: true });
const TRACKS = { bg_game: gameLoop, bg_menu: menuLoop };
let total = 0;
for (const [name, make] of Object.entries(TRACKS)) {
  const track = normalize(make());
  const buf = wav(track);
  fs.writeFileSync(path.join(OUT, `${name}.wav`), buf);
  total += buf.length;

  // فحص الوصلة: القفزة بين آخر عيّنة وأول عيّنة مقارنةً بأكبر قفزة داخلية
  const seam = Math.abs(track[0] - track[track.length - 1]);
  let maxStep = 0;
  for (let i = 1; i < track.length; i++) maxStep = Math.max(maxStep, Math.abs(track[i] - track[i - 1]));
  console.log(
    `${name}.wav  ${(buf.length / 1024).toFixed(0)} KB  ${(track.length / RATE).toFixed(1)}s  ` +
      `| وصلة ${seam.toFixed(5)} مقابل أكبر قفزة داخلية ${maxStep.toFixed(5)}  ` +
      `${seam <= maxStep ? '✅ سلسة' : '⚠️ طقطقة'}`
  );
}
console.log(`\nالمجموع: ${(total / 1024).toFixed(0)} KB`);
