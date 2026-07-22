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
  eacute: 'é', egrave: 'è', ecirc: 'ê', euml: 'ë',
  agrave: 'à', aacute: 'á', acirc: 'â', atilde: 'ã', aring: 'å', aelig: 'æ',
  ccedil: 'ç', iacute: 'í', icirc: 'î', iuml: 'ï',
  oacute: 'ó', ocirc: 'ô', otilde: 'õ', oslash: 'ø',
  uacute: 'ú', ucirc: 'û', uuml: 'ü', ouml: 'ö', auml: 'ä',
  ntilde: 'ñ', szlig: 'ß', yacute: 'ý', deg: '°', pound: '£', euro: '€',
  hellip: '…', mdash: '—', ndash: '–', rsquo: '’', lsquo: '‘',
  ldquo: '“', rdquo: '”', shy: '', times: '×', divide: '÷', frac12: '½',
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
      ar: payload, // يُستبدل بالعربية عند طلب الترجمة
      en: payload,
      answer: options.indexOf(correct),
      fromApi: true,
    };
  });
}

/* ---------------------------------------------------------------
 * الترجمة إلى العربية — MyMemory
 *
 * لا يوجد API عام يقدّم أسئلة عربية جاهزة، فنجلب الإنجليزية ونترجمها.
 * الترجمة آلية، لذلك نحتفظ بالنص الإنجليزي الأصلي ونعرضه تحت العربي.
 * ------------------------------------------------------------- */

const TRANSLATE_URL = 'https://api.mymemory.translated.net/get';
// فاصل نادر يبقى سليماً بعد الترجمة، فنترجم السؤال وخياراته في طلب واحد
const SEP = ' ||| ';

/** يترجم نصاً واحداً. يعيد null عند أي فشل بدل أن يرمي. */
async function translateOnce(text) {
  const url = `${TRANSLATE_URL}?q=${encodeURIComponent(text)}&langpair=en|ar`;
  try {
    const res = await fetchWithTimeout(url, TIMEOUT_MS);
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.responseStatus !== 200) return null;
    const out = data?.responseData?.translatedText;
    return typeof out === 'string' && out.trim() ? out : null;
  } catch (e) {
    return null;
  }
}

/**
 * يترجم أسئلة جاءت من الخدمة إلى العربية.
 *
 * مبدأ التصميم: الترجمة تحسين لا شرط. أي سؤال تفشل ترجمته يبقى
 * بالإنجليزية بدل أن تنهار الجولة كلها.
 *
 * onProgress(done, total) لتحديث شاشة الانتظار.
 */
export async function translateQuestions(questions, onProgress) {
  const out = [];

  for (let i = 0; i < questions.length; i++) {
    const item = questions[i];
    const src = item.en;
    const joined = [src.q, ...src.o].join(SEP);
    const raw = await translateOnce(joined);

    let ar = src; // الافتراضي: نبقي الإنجليزية
    if (raw) {
      const parts = raw.split('|||').map((s) => s.trim());
      // نقبلها فقط إذا رجعت بنفس عدد الأجزاء وكلها غير فارغة
      if (parts.length === src.o.length + 1 && parts.every(Boolean)) {
        ar = {
          q: parts[0],
          o: parts.slice(1),
          f: src.f,
          original: src.q, // النص الأصلي لعرضه تحت الترجمة
          translated: true,
        };
      }
    }

    out.push({ ...item, ar });
    if (onProgress) onProgress(i + 1, questions.length);

    // تباعد بسيط احتراماً لحصة الخدمة المجانية
    if (i < questions.length - 1) await sleep(350);
  }

  return out;
}
