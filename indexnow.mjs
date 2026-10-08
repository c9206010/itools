/* ==========================================================================
   IndexNow 送出 — 主動通知搜尋引擎哪些網址更新了
   --------------------------------------------------------------------------
   用法：
     node indexnow.mjs                      送出 sitemap.xml 裡的全部網址
     node indexnow.mjs /t/wheel /t/dice     只送指定的幾個（路徑或完整網址都可）

   IndexNow 是 Bing 與 Yandex 共用的協定，送一次兩邊都收得到。
   Google 不支援，Google 那邊還是看 sitemap 與自然爬取。

   為什麼值得做：Bing 的索引是 ChatGPT 網頁搜尋的來源，
   所以讓 Bing 快點收錄，等於讓 ChatGPT 更快能引用到這個站。

   驗證方式：網站根目錄要放一個 <金鑰>.txt，內容就是金鑰本身。
   搜尋引擎收到請求後會去抓那個檔案，確認你真的是網站擁有者。
   檔案被刪掉的話，之後所有送出都會失敗。
   ========================================================================== */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), 'public');

const KEY = '92c295ac76a4043343293d24d4e2bfab';
const HOST = 'tools.luka-life.com';
const ORIGIN = `https://${HOST}`;

/* 一次最多 10000 筆是協定上限，這個站遠遠用不到，但還是擋一下 */
const MAX_URLS = 10000;

/* ---------- 決定要送哪些網址 ---------- */
const args = process.argv.slice(2);

let urls;
if (args.length) {
  urls = args.map(a => (a.startsWith('http') ? a : `${ORIGIN}${a.startsWith('/') ? '' : '/'}${a}`));
} else {
  const xml = readFileSync(join(ROOT, 'sitemap.xml'), 'utf8');
  urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
}

if (!urls.length) {
  console.error('沒有任何網址可以送出。');
  process.exit(1);
}

/* 送出別人家的網址會被整批拒絕，先擋掉比較好除錯 */
const foreign = urls.filter(u => !u.startsWith(ORIGIN + '/') && u !== ORIGIN + '/');
if (foreign.length) {
  console.error(`這些網址不屬於 ${HOST}，請檢查：\n  ${foreign.join('\n  ')}`);
  process.exit(1);
}

if (urls.length > MAX_URLS) {
  console.error(`一次最多 ${MAX_URLS} 筆，目前有 ${urls.length} 筆。`);
  process.exit(1);
}

/* ---------- 送出 ---------- */
const payload = {
  host: HOST,
  key: KEY,
  keyLocation: `${ORIGIN}/${KEY}.txt`,
  urlList: urls
};

console.log(`準備送出 ${urls.length} 個網址到 IndexNow`);
console.log(`驗證檔：${payload.keyLocation}`);

const res = await fetch('https://api.indexnow.org/IndexNow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify(payload)
});

const body = await res.text();

/* 協定定義的回應碼，照著翻比看數字好懂 */
const MEANING = {
  200: '成功，已收到',
  202: '已收到，但金鑰還在驗證中（正常，稍後會自己完成）',
  400: '格式錯誤',
  403: '金鑰驗證失敗——檢查驗證檔是不是真的部署上去了',
  422: '網址與金鑰不符，或網址不屬於這個網域',
  429: '送太頻繁，稍後再試'
};

console.log(`\n回應：${res.status} ${MEANING[res.status] || res.statusText}`);
if (body.trim()) console.log(body.trim());

process.exit(res.status === 200 || res.status === 202 ? 0 : 1);
