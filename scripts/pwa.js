/**
 * خطوة ما بعد البناء: تحوّل مخرجات `expo export --platform web`
 * إلى تطبيق ويب تقدمي (PWA) يعمل بدون إنترنت.
 *
 * تضيف إلى dist/index.html:
 *  - رابط manifest وأيقونات ووسوم iOS
 *  - تسجيل الـ Service Worker
 *
 * تُشغَّل تلقائياً ضمن أمر البناء في vercel.json.
 */
const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, '..', 'dist');
const INDEX = path.join(DIST, 'index.html');

if (!fs.existsSync(INDEX)) {
  console.error('  [X] dist/index.html not found - run the web export first.');
  process.exit(1);
}

let html = fs.readFileSync(INDEX, 'utf8');

if (html.includes('data-pwa="1"')) {
  console.log('  PWA tags already present - nothing to do.');
  process.exit(0);
}

const HEAD_TAGS = `
    <!-- PWA -->
    <link data-pwa="1" rel="manifest" href="/manifest.json" />
    <meta name="theme-color" content="#F2544B" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="افتح يا سمسم" />
    <link rel="apple-touch-icon" href="/icon-192.png" />
    <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
    <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png" />
`;

const SW_SCRIPT = `
    <script>
      // نسجّل الـ Service Worker بعد اكتمال التحميل حتى لا نؤخّر أول ظهور للّعبة
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', function () {
          navigator.serviceWorker.register('/sw.js').catch(function () {});
        });
      }
    </script>
`;

// نضع وسوم الـ head قبل إغلاقه، وسكربت التسجيل قبل إغلاق body
html = html.replace('</head>', HEAD_TAGS + '  </head>');
html = html.replace('</body>', SW_SCRIPT + '  </body>');

fs.writeFileSync(INDEX, html, 'utf8');

// فحص أن الملفات المطلوبة وصلت فعلاً إلى مجلد البناء
const required = ['sw.js', 'manifest.json', 'icon-192.png', 'icon-512.png'];
const missing = required.filter((f) => !fs.existsSync(path.join(DIST, f)));

console.log('  PWA tags injected into dist/index.html');
if (missing.length) {
  console.error('  [X] Missing from dist: ' + missing.join(', '));
  console.error('      They should be copied automatically from public/');
  process.exit(1);
}

/* ---------- حقن قائمة التخزين المسبق في الـ Service Worker ---------- */

// نجمع كل ملفات البناء كمسارات URL
function walk(dir, base = '') {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const url = base + '/' + entry.name;
    if (entry.isDirectory()) out.push(...walk(full, url));
    else out.push(url.replace(/\\/g, '/'));
  }
  return out;
}

const SKIP = new Set(['/sw.js', '/metadata.json']);
const precache = ['/'].concat(walk(DIST).filter((u) => !SKIP.has(u)));

// اسم مخزون جديد لكل بناء، حتى تُستبدل النسخة القديمة تلقائياً
const stamp = require('crypto')
  .createHash('sha1')
  .update(precache.join('|'))
  .digest('hex')
  .slice(0, 10);

const SW = path.join(DIST, 'sw.js');
let sw = fs.readFileSync(SW, 'utf8');
sw = sw
  .replace('__CACHE_NAME__', 'iftah-ya-simsim-' + stamp)
  .replace('__PRECACHE_LIST__', JSON.stringify(precache, null, 2));
fs.writeFileSync(SW, sw, 'utf8');

const bytes = walk(DIST).reduce((n, u) => n + fs.statSync(path.join(DIST, u)).size, 0);

console.log('  All PWA files present: ' + required.join(', '));
console.log('  Service worker will precache ' + precache.length + ' files (' +
  (bytes / 1024 / 1024).toFixed(2) + ' MB)');
console.log('  Cache name: iftah-ya-simsim-' + stamp);
