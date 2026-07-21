/**
 * جلب الأسئلة مباشرة من الإنترنت — Open Trivia Database
 * https://opentdb.com
 *
 * ملاحظتان مهمّتان عن هذه الخدمة:
 *  1) أسئلتها بالإنجليزية فقط، فالبنك المحلي هو مصدر العربية.
 *  2) تحدّ الطلبات (طلب كل ٥ ثوانٍ تقريباً) وترجع 429 — نتعامل معها بإعادة محاولة.
 */

const BASE = 'https://opentdb.com/api.php';
const TIMEOUT_MS = 12000;

// أبوابنا مقابل أرقام فئات الخدمة
export const API_CATEGORY = {
  animals: 27, // Animals
  science: 17, // Science & Nature
  world: 22, // Geography
  numbers: 19, // Science: Mathematics
  body: 17, // Science & Nature (لا توجد فئة لجسم الإنسان)
  everyday: 9, // General Knowledge
};

/** أخطاء نعرف سببها، حتى تعرض الواجهة رسالة مفهومة بدل نص تقني */
export class ApiError extends Error {
  constructor(kind, message) {
    super(message);
    this.kind = kind; // 'network' | 'rate' | 'empty' | 'server' | 'bad'
  }
}

/* ---------- فك ترميز HTML ---------- */
// الخدمة ترجع نصوصاً مرمّزة مثل &quot; و&#039; ولا يوجد DOM في React Native
const NAMED = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  eacute: 'é', egrave: 'è', ecirc: 'ê', agrave: 'à', ccedil: 'ç',
  uuml: 'ü', ouml: 'ö', auml: 'ä', ntilde: 'ñ', deg: '°',
  hellip: '…', mdash: '—', ndash: '–', rsquo: '’', lsquo: '‘',
  ldquo: '“', rdquo: '”', shy: '', times: '×', divide: '÷',
};

export function decodeHtml(input) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&([a-z]+);/gi, (m, name) => {
      const key = name.toLowerCase();
      return Object.prototype.hasOwnProperty.call(NAMED, key) ? NAMED[key] : m;
    });
}

/* ---------- أدوات ---------- */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// مهلة قصوى للطلب حتى لا تعلق الشاشة على "جارٍ التحميل" إلى الأبد
async function fetchWithTimeout(url, ms) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

/* ---------- رموز الاستجابة داخل الـ JSON ---------- */
// الخدمة ترجع 200 دائماً تقريباً، والخطأ الحقيقي داخل response_code
function checkResponseCode(code) {
  if (code === 0) return; // نجاح
  if (code === 1) throw new ApiError('empty', 'لا توجد أسئلة كافية بهذه الخيارات');
  if (code === 2) throw new ApiError('bad', 'خيارات الطلب غير صالحة');
  if (code === 5) throw new ApiError('rate', 'طلبات كثيرة بسرعة');
  throw new ApiError('server', `رمز استجابة غير متوقع: ${code}`);
}

/**
 * يجلب أسئلة ويحوّلها إلى نفس شكل البنك المحلي،
 * حتى تستهلكها بقية اللعبة دون أي تغيير.
 *
 * يعيد: [{ key, level, ar:{q,o,f}, en:{q,o,f}, answer }]
 */
export async function fetchApiQuestions({ categoryId, level, amount = 6, retries = 2 }) {
  const params = new URLSearchParams({
    amount: String(amount),
    type: 'multiple', // أربعة خيارات، مثل تصميم اللعبة
  });

  const cat = API_CATEGORY[categoryId];
  if (cat) params.set('category', String(cat));
  // 'mixed' يعني بلا تحديد صعوبة
  if (level && level !== 'mixed') params.set('difficulty', level);

  const url = `${BASE}?${params.toString()}`;

  let res;
  try {
    res = await fetchWithTimeout(url, TIMEOUT_MS);
  } catch (e) {
    throw new ApiError('network', 'تعذّر الوصول إلى الخدمة');
  }

  // 429 = طلبات كثيرة — ننتظر ونعيد المحاولة
  if (res.status === 429) {
    if (retries > 0) {
      await sleep(5500);
      return fetchApiQuestions({ categoryId, level, amount, retries: retries - 1 });
    }
    throw new ApiError('rate', 'طلبات كثيرة بسرعة');
  }

  if (res.status >= 500) throw new ApiError('server', `خطأ في الخدمة (${res.status})`);
  if (!res.ok) throw new ApiError('bad', `طلب غير صالح (${res.status})`);

  let data;
  try {
    data = await res.json();
  } catch (e) {
    throw new ApiError('server', 'استجابة غير مقروءة');
  }

  try {
    checkResponseCode(data.response_code);
  } catch (e) {
    // رمز ٥ داخل الجسم يعني أيضاً تجاوز الحد — نعيد المحاولة مرة
    if (e.kind === 'rate' && retries > 0) {
      await sleep(5500);
      return fetchApiQuestions({ categoryId, level, amount, retries: retries - 1 });
    }
    throw e;
  }

  const results = Array.isArray(data.results) ? data.results : [];
  if (results.length === 0) throw new ApiError('empty', 'لم تُرجع الخدمة أي سؤال');

  return results.map((item, i) => {
    const correct = decodeHtml(item.correct_answer);
    const wrong = (item.incorrect_answers || []).map(decodeHtml);
    const options = shuffle([correct, ...wrong]);
    const q = decodeHtml(item.question);
    // مصدر السؤال بدل «معلومة إضافية» غير المتوفّرة في هذه الخدمة
    const source = decodeHtml(item.category || '');

    const payload = { q, o: options, f: source ? `📡 ${source}` : '📡 Open Trivia DB' };

    return {
      key: `api|${categoryId}|${level}|${i}|${q.slice(0, 40)}`,
      level: item.difficulty || level || 'mixed',
      ar: payload, // الخدمة إنجليزية فقط — نعرض النص نفسه في اللغتين
      en: payload,
      answer: options.indexOf(correct),
      fromApi: true,
    };
  });
}
