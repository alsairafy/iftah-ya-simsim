/**
 * Service Worker — يخزّن اللعبة كاملة لتعمل بدون إنترنت.
 *
 * الاستراتيجية:
 *  - صفحة HTML: الشبكة أولاً ثم المخزَّن (حتى تصلك التحديثات فور نشرها)
 *  - بقية الملفات (كود وأصوات وصور): المخزَّن أولاً — فهي محصّنة بالبصمة
 *    في اسمها، أي تغيير ينتج اسماً جديداً، فلا خطر من تقديم نسخة قديمة.
 */
// تُحقن القائمة والإصدار آلياً عند البناء بواسطة scripts/pwa.js
const CACHE = '__CACHE_NAME__';
const CORE = __PRECACHE_LIST__;

/**
 * التثبيت: نخزّن كل ملفات اللعبة مسبقاً.
 * هذا ضروري لأن ملف الكود يُطلب أثناء أول تحميل للصفحة، قبل أن
 * يتحكّم الـ Service Worker بها — فلو انتظرنا لن يُخزَّن أبداً.
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        // نخزّن كل ملف على حدة حتى لا يُفشل ملفٌ واحد العملية كلها
        Promise.all(
          CORE.map((url) =>
            cache.add(new Request(url, { cache: 'reload' })).catch(() => {})
          )
        )
      )
      .then(() => self.skipWaiting())
  );
});

// التفعيل: نحذف أي مخزون قديم من إصدار سابق
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const isHtml = (request) =>
  request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html');

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // لا نتدخّل إلا في طلبات GET من نفس الموقع
  if (request.method !== 'GET') return;
  if (new URL(request.url).origin !== self.location.origin) return;

  if (isHtml(request)) {
    // الشبكة أولاً: نضمن أنك تشوف آخر نسخة عند توفّر الإنترنت
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
          return response;
        })
        .catch(() =>
          caches.match(request).then((hit) => hit || caches.match('/index.html'))
        )
    );
    return;
  }

  // بقية الأصول: المخزَّن أولاً، ونجلبها ونخزّنها إن لم تكن موجودة
  event.respondWith(
    caches.match(request).then((hit) => {
      if (hit) return hit;
      return fetch(request).then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
        }
        return response;
      });
    })
  );
});
