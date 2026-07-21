/**
 * يولّد باركود (QR) لفتح اللعبة في تطبيق Expo Go.
 *
 *   npm run qr            باركود لشبكة الواي فاي المحلية
 *   npm run qr -- <url>   باركود لأي رابط تعطيه (مثل رابط النفق tunnel)
 *
 * يطبع الباركود في الطرفية ويحفظه أيضاً كصورة qr.png وملف qr.html
 * تقدر ترسل الصورة لأي أحد ليمسحها بجواله.
 */
const os = require('os');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

const PORT = process.env.PORT || 8081;
const ROOT = path.join(__dirname, '..');

// المحوّلات الافتراضية التي لا تصلح للاتصال من الجوال
const VIRTUAL = /vethernet|virtualbox|vmware|hyper-?v|docker|wsl|loopback|tailscale|zerotier/i;

// أول عنوان IPv4 حقيقي على الشبكة المحلية
function lanIP() {
  const nets = os.networkInterfaces();
  const candidates = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family !== 'IPv4' || net.internal) continue;
      if (/^169\.254\./.test(net.address)) continue; // عنوان تلقائي بلا شبكة
      if (VIRTUAL.test(name)) continue;
      candidates.push({ name, address: net.address });
    }
  }
  // نفضّل الواي فاي والإيثرنت الحقيقيين
  const preferred = candidates.find((c) => /wi-?fi|wlan|ethernet|en0|eth0/i.test(c.name));
  return (preferred || candidates[0] || {}).address || null;
}

async function main() {
  const custom = process.argv[2];
  const ip = lanIP();

  if (!custom && !ip) {
    console.error('\n  [X] No local network address found.');
    console.error('      Connect to Wi-Fi, or pass a URL manually:');
    console.error('      npm run qr -- exp://your-url-here\n');
    process.exit(1);
  }

  const url = custom || `exp://${ip}:${PORT}`;
  // رابط تشغيل اللعبة في المتصفح مباشرة (نفس سيرفر التطوير)
  const webUrl = custom ? null : `http://${ip}:${PORT}`;

  // رسائل الطرفية بالإنجليزية — نافذة cmd في ويندوز تشوّه العربية
  console.log('\n  Scan this QR code with Expo Go:\n');
  console.log(await QRCode.toString(url, { type: 'terminal', small: true }));
  console.log(`   Phone (Expo Go) : ${url}`);
  if (webUrl) {
    console.log(`   Browser         : ${webUrl}`);
    console.log(`   This PC         : http://localhost:${PORT}`);
  }
  console.log('');

  // صورة PNG للمشاركة
  const png = path.join(ROOT, 'qr.png');
  await QRCode.toFile(png, url, { width: 640, margin: 2, color: { dark: '#33241D', light: '#FFF8EC' } });

  // صفحة HTML فيها الباركود جاهزة للطباعة أو العرض على الشاشة
  const dataUrl = await QRCode.toDataURL(url, { width: 640, margin: 2, color: { dark: '#33241D', light: '#FFF8EC' } });
  const STAMP = new Date().toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' });
  const html = `<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8">
<title>افتح يا سمسم — باركود اللعبة</title>
<style>
  body{margin:0;min-height:100vh;display:grid;place-items:center;background:#63C7F2;
       font-family:system-ui,-apple-system,"Segoe UI",sans-serif;padding:20px}
  .card{background:#FFF8EC;border-radius:30px;border-bottom:10px solid #C2AE90;
        padding:28px 30px;text-align:center;max-width:430px;width:100%}
  h1{margin:0;font-size:34px;color:#F2544B}
  h2{margin:2px 0 16px;font-size:15px;letter-spacing:2px;color:#8A6350}
  img{width:100%;max-width:300px;border-radius:18px}
  p{margin:14px 0 4px;font-size:15px;font-weight:700;color:#33241D;line-height:1.7}
  .links{margin-top:18px;display:grid;gap:10px}
  a.btn{display:block;text-decoration:none;border-radius:18px;padding:14px 16px;
        font-weight:800;font-size:16px;color:#fff;border-bottom:6px solid rgba(0,0,0,.22)}
  a.phone{background:#F2544B}
  a.web{background:#3D8FE0}
  a.local{background:#5BC55F}
  a.btn small{display:block;font-weight:600;font-size:12px;opacity:.9;margin-top:3px;
              word-break:break-all;direction:ltr}
  .note{margin-top:16px;font-size:12px;color:#8A6350;line-height:1.8}
  .status{margin-bottom:14px;border-radius:14px;padding:11px 14px;font-weight:800;
          font-size:14px;line-height:1.6}
  .checking{background:#E4D6BE;color:#5A3B2E}
  .live{background:#5BC55F;color:#fff}
  .stale{background:#F2544B;color:#fff}
  .stale b{display:block;font-size:13px;font-weight:600;margin-top:4px}
  .stamp{margin-top:10px;font-size:11px;color:#B0A18C}
</style></head><body>
<div class="card">
  <h1>افتح يا سمسم</h1><h2>OPEN SESAME</h2>

  <div id="status" class="status checking">⏳ نفحص إذا كان الباركود صالحاً…</div>

  <img src="${dataUrl}" alt="QR">
  <p>امسح الباركود بتطبيق <b>Expo Go</b><br>أو اضغط أحد الروابط تحت</p>

  <div class="links">
    <a class="btn phone" href="${url}">📲 افتح في Expo Go<small>${url}</small></a>
    ${webUrl ? `<a class="btn web" href="${webUrl}" target="_blank">💻 العب في المتصفح<small>${webUrl}</small></a>` : ''}
    ${webUrl ? `<a class="btn local" href="http://localhost:${PORT}" target="_blank">🖥️ على هذا الجهاز<small>http://localhost:${PORT}</small></a>` : ''}
  </div>

  <div class="note">
    رابط Expo Go يشتغل من الجوال فقط.<br>
    لازم يكون السيرفر شغّالاً والجوال على نفس الواي فاي.
  </div>
  <div class="stamp">وُلّد هذا الباركود: ${STAMP}</div>
</div>

<script>
// نفحص إن كان السيرفر المذكور في الباركود لا يزال يستجيب.
// إذا ما استجاب، معناه أن الباركود قديم (تغيّر الواي فاي أو توقّف السيرفر).
(function () {
  var box = document.getElementById('status');
  var probe = ${webUrl ? JSON.stringify(webUrl + '/status') : 'null'};
  if (!probe) { box.remove(); return; }

  var done = false;
  function verdict(ok) {
    if (done) return;
    done = true;
    if (ok) {
      box.className = 'status live';
      box.textContent = '✅ الباركود صالح — السيرفر يستجيب. امسحه الآن.';
    } else {
      box.className = 'status stale';
      box.innerHTML = '⚠️ هذا الباركود قديم ولن يعمل' +
        '<b>شغّل اختصار «Open Sesame - Start» من سطح المكتب لتوليد باركود جديد.</b>';
    }
  }

  // مهلة قصوى حتى لا تبقى الرسالة معلّقة
  setTimeout(function () { verdict(false); }, 6000);

  fetch(probe, { mode: 'no-cors', cache: 'no-store' })
    .then(function () { verdict(true); })
    .catch(function () { verdict(false); });
})();
</script>
</body></html>`;
  fs.writeFileSync(path.join(ROOT, 'qr.html'), html, 'utf8');

  console.log('  Saved:');
  console.log('   qr.png   image you can share');
  console.log('   qr.html  page to display or print\n');
  console.log('  Note: the dev server must be running, and your phone');
  console.log('        must be on the same Wi-Fi network.\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
