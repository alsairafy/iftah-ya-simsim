import { colors } from '../theme';
import animals from './animals';
import science from './science';
import world from './world';
import numbers from './numbers';
import body from './body';
import everyday from './everyday';

export const BANK = { animals, science, world, numbers, body, everyday };

export const LEVELS = ['easy', 'medium', 'hard'];

export const categories = [
  {
    id: 'animals',
    ar: 'عالم الحيوان',
    en: 'Animal World',
    emoji: '🦁',
    color: colors.sun,
    deep: colors.sunDeep,
    puppet: 'bird',
  },
  {
    id: 'science',
    ar: 'علوم وفضاء',
    en: 'Science & Space',
    emoji: '🔭',
    color: colors.grape,
    deep: colors.grapeDeep,
    puppet: 'furry',
  },
  {
    id: 'world',
    ar: 'بلاد وأماكن',
    en: 'World & Places',
    emoji: '🌍',
    color: colors.ocean,
    deep: colors.oceanDeep,
    puppet: 'camel',
  },
  {
    id: 'numbers',
    ar: 'أرقام وأشكال',
    en: 'Numbers & Shapes',
    emoji: '🔢',
    color: colors.tomato,
    deep: colors.tomatoDeep,
    puppet: 'grouch',
  },
  {
    id: 'body',
    ar: 'جسم الإنسان',
    en: 'The Human Body',
    emoji: '🫀',
    color: colors.pink,
    deep: colors.pinkDeep,
    puppet: 'cookie',
  },
  {
    id: 'everyday',
    ar: 'حياتنا اليومية',
    en: 'Everyday Life',
    emoji: '🏠',
    color: colors.grass,
    deep: colors.grassDeep,
    puppet: 'furry',
  },
];

// خلط فيشر–ييتس
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// مفتاح فريد لكل سؤال حتى نمنع تكراره
const keyOf = (catId, level, i) => `${catId}|${level}|${i}`;

// كل أسئلة فئة ومستوى معيّن، مع مفاتيحها
function poolFor(catId, level) {
  const levels = level === 'mixed' ? LEVELS : [level];
  const out = [];
  levels.forEach((lv) => {
    (BANK[catId]?.[lv] || []).forEach((item, i) => {
      out.push({ ...item, level: lv, key: keyOf(catId, lv, i) });
    });
  });
  return out;
}

export function poolSize(catId, level) {
  return poolFor(catId, level).length;
}

export function remainingCount(catId, level, seen) {
  return poolFor(catId, level).filter((q) => !seen.has(q.key)).length;
}

/**
 * يبني جولة من أسئلة لم تُطرح من قبل.
 * يعيد { round, keys, didReset } — didReset يعني أن البنك انتهى وأعدنا تدويره.
 */
export function buildRound(catId, level, seen, size) {
  const all = poolFor(catId, level);

  // نبدأ بالأسئلة التي لم تُطرح من قبل
  let chosen = shuffle(all.filter((q) => !seen.has(q.key))).slice(0, size);
  let didReset = false;

  // لم تكفِ الأسئلة الجديدة؟ نعيد تدوير البنك ونكمل منه،
  // مع ضمان عدم تكرار أي سؤال داخل المباراة الواحدة.
  if (chosen.length < size) {
    const used = new Set(chosen.map((q) => q.key));
    const recycled = shuffle(all.filter((q) => !used.has(q.key)));
    if (recycled.length > 0) {
      didReset = true;
      chosen = chosen.concat(recycled.slice(0, size - chosen.length));
    }
  }

  const round = chosen.map((item) => {
    // نخلط الخيارات مع تتبّع الإجابة الصحيحة، في اللغتين معاً بنفس الترتيب
    const order = shuffle(item.ar.o.map((_, i) => i));
    return {
      key: item.key,
      level: item.level,
      ar: { q: item.ar.q, o: order.map((i) => item.ar.o[i]), f: item.ar.f },
      en: { q: item.en.q, o: order.map((i) => item.en.o[i]), f: item.en.f },
      answer: order.indexOf(item.a),
    };
  });

  return { round, keys: chosen.map((c) => c.key), didReset };
}

export const TOTAL_QUESTIONS = categories.reduce(
  (sum, c) => sum + LEVELS.reduce((s, lv) => s + (BANK[c.id][lv]?.length || 0), 0),
  0
);
