/**
 * 順手工具箱 — SEO 注入腳本
 *
 * 用法：
 *   node build-seo.mjs                      使用 catalog.js 裡的 SITE.origin
 *   node build-seo.mjs --origin=https://…   臨時覆寫網域（同時寫回 catalog.js）
 *
 * 這支腳本會做四件事：
 *   1. 在 index.html 與每個 t/*.html 的 <head> 注入 canonical、OG、Twitter Card
 *      與 JSON-LD 結構化資料（SoftwareApplication／BreadcrumbList／FAQPage）
 *   2. 從頁面既有的 <details> FAQ 區塊自動抽出問答，產生 FAQPage schema
 *   3. 產生 sitemap.xml
 *   4. 產生 robots.txt
 *
 * 注入內容夾在 SEO:START / SEO:END 之間，可以重複執行，不會越跑越多。
 * 新增工具時：先在 catalog.js 加一筆 → 寫好 t/<slug>.html → 重跑這支腳本。
 */

import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createHash } from 'node:crypto';

/* 網站檔案全部放在 public/，開發用的腳本與說明留在專案根目錄，
   這樣部署時只會發布 public/ 的內容，不會把 .mjs 與 README 一起公開。 */
const ROOT = join(dirname(fileURLToPath(import.meta.url)), 'public');
const CATALOG_PATH = join(ROOT, 'assets', 'js', 'catalog.js');

const START = '<!-- SEO:START 由 build-seo.mjs 產生，請勿手動編輯 -->';
const END = '<!-- SEO:END -->';

/* ---------- 讀 catalog.js ---------- */
function loadCatalog() {
  const code = readFileSync(CATALOG_PATH, 'utf8');
  // catalog.js 是給瀏覽器用的普通腳本，這裡直接求值取出三個常數
  const fn = new Function(code + '\nreturn { SITE, CATEGORIES, TOOLS };');
  return fn();
}

/* ---------- 靜態資源版本號 ----------
   這個網域的邊緣快取不受 Cloudflare Cache Rules 控制，實測即使 age
   超過 max-age 仍持續回傳舊檔，導致推送後首頁還是看到舊的工具清單。
   與其跟平台設定搏鬥，不如讓網址自己帶內容雜湊：檔案一改網址就變，
   舊快取自然命中不到。這也是前端界處理快取的標準做法。 */
function hashOf(...segments) {
  const buf = readFileSync(join(ROOT, ...segments));
  return createHash('sha1').update(buf).digest('hex').slice(0, 8);
}

/* 需要加版本號的共用資源。新增一個共用的 js 或 css 檔時，在這裡加一行就好。 */
const SHARED_ASSETS = [
  'assets/js/catalog.js',
  'assets/js/layout.js',
  'assets/js/cities.js',
  'assets/js/zh-dict.js',
  'assets/css/main.css'
];

const V = Object.fromEntries(
  SHARED_ASSETS.map(p => [p, hashOf(...p.split('/'))])
);

/** 幫共用資源的網址加上版本查詢字串，既有的版本號會被覆蓋。
 *  取代一律用函式形式，字串形式會把 $ 當成特殊符號。 */
function versionAssets(html) {
  return SHARED_ASSETS.reduce((out, p) => {
    const re = new RegExp(`((?:\\.\\./)?${p.replace(/[./]/g, m => '\\' + m)})(\\?v=[0-9a-f]+)?`, 'g');
    return out.replace(re, (m, hit) => `${hit}?v=${V[p]}`);
  }, html);
}

/* ==========================================================================
   靜態骨架（給不執行 JavaScript 的爬蟲看的）
   --------------------------------------------------------------------------
   頁首、頁尾、麵包屑、相關工具原本都是 layout.js 執行後才生出來的，
   結果是：關掉 JS 之後整個站一條連結都沒有，首頁只剩 72 個字元。

   Google 雖然會執行 JS，但那是另一條延遲很久的佇列，新站優先度最低；
   AI 爬蟲（GPTBot、ClaudeBot、PerplexityBot）則根本不執行 JS。
   等於 87 個工具頁是沒有任何連結指向的孤島。

   所以改成建置時就把骨架寫進 HTML，layout.js 偵測到已經存在就不再重畫。
   這是漸進增強：沒有 JS 也看得到完整結構，有 JS 則接手變成互動版。

   這裡產生的 HTML 必須跟 layout.js 的輸出一致，否則樣式會跑掉。
   改其中一邊記得兩邊都要改。
   ========================================================================== */
const NAV_MARK = 'data-static-nav';
const FOOT_MARK = 'data-static-foot';

function staticHeader(SITE, CATEGORIES, root) {
  /* 指向目錄本身而不是 index.html：Cloudflare Pages 會把 /index.html
     用 308 轉到 /，而 canonical 與 sitemap 寫的都是 /。連到 index.html
     等於每條內部連結都多一次轉址，全站近百頁都這樣，白白吃掉爬取預算。
     （踩過：Network 面板裡每次回首頁都先出現一筆 308。）
     用 './' 而非 '/' 是為了保留相對路徑，本機直接開檔也能用。 */
  const home = root || './';
  const cats = CATEGORIES.map(c =>
    `<a href="${home}#${c.id}">${attrEsc(c.name)}</a>`).join('');
  return `<div ${NAV_MARK}>
<a class="skip-link" href="#main">跳到主要內容</a>
<header class="site-header">
  <div class="wrap site-header__bar">
    <a class="brand" href="${home}">
      <span class="brand__mark">${SITE.mark}</span>
      <span>${attrEsc(SITE.name)}</span>
    </a>
    <div class="hsearch">
      <span class="hsearch__icon" aria-hidden="true">🔍</span>
      <input type="search" id="siteSearch" placeholder="搜尋工具…（按 / 快速聚焦）"
             autocomplete="off" role="combobox" aria-expanded="false"
             aria-controls="searchResults" aria-label="搜尋工具">
      <div class="hsearch__results hidden" id="searchResults" role="listbox"></div>
    </div>
    <button class="theme-toggle" id="themeToggle" type="button"
            aria-label="切換深色或淺色模式" title="切換深淺色">🌓</button>
  </div>
  <nav class="catnav" aria-label="工具分類">
    <div class="wrap catnav__inner">
      <a href="${home}">全部</a>${cats}
    </div>
  </nav>
</header></div>`;
}

function staticFooter(SITE, CATEGORIES, TOOLS, root) {
  const cols = CATEGORIES.map(c => {
    const items = TOOLS.filter(t => t.cat === c.id).slice(0, 6)
      .map(t => `<li><a href="${root}t/${t.slug}.html">${attrEsc(t.name)}</a></li>`).join('');
    return `<div><h4>${c.icon} ${attrEsc(c.name)}</h4><ul>${items}</ul></div>`;
  }).join('');
  return `<div ${FOOT_MARK}>
<footer class="site-footer">
  <div class="wrap">
    <div class="site-footer__cols">${cols}</div>
    <div class="site-footer__base">
      <span>© ${new Date().getFullYear()} ${attrEsc(SITE.name)}．${attrEsc(SITE.tagline)}</span>
      <span>所有運算都在你的瀏覽器完成，輸入的內容不會上傳</span>
      <span><a href="${root}privacy.html">隱私權政策</a></span>
    </div>
  </div>
</footer></div>`;
}

/** 一張工具卡片。跟 index.html 的 cardHTML 與 layout.js 的相關工具卡一致。
 *  收藏星星是互動元素，靜態版不放，JS 接手時會補上。 */
function card(t, root) {
  return `<a class="card" href="${root}t/${t.slug}.html">` +
    `<span class="card__top">` +
    `<span class="card__icon" aria-hidden="true">${t.icon}</span>` +
    `<span class="card__title">${attrEsc(t.name)}</span>` +
    `</span>` +
    `<span class="card__desc">${attrEsc(t.desc)}</span></a>`;
}

/** 首頁：把分類與工具卡片預先寫進 #groups。
 *  載入後 index.html 的 render() 會覆蓋掉，內容一樣，使用者看不出差別，
 *  但爬蟲在不執行 JS 的情況下就能看到全部 87 條連結。 */
function prefillGroups(html, CATEGORIES, TOOLS) {
  const groups = CATEGORIES.map(c => {
    const list = TOOLS.filter(t => t.cat === c.id);
    if (!list.length) return '';
    return `<section class="group" id="${c.id}">` +
      `<div class="group__head">` +
      `<h2><span class="stamp" aria-hidden="true">${c.icon}</span>${attrEsc(c.name)}</h2>` +
      `<span>${attrEsc(c.desc)}．${list.length} 種</span>` +
      `</div>` +
      `<div class="grid">${list.map(t => card(t, '')).join('')}</div>` +
      `</section>`;
  }).join('');
  /* 用明確的標記包住，不要靠「配對到某個 </div>」來猜結尾——
     卡片與分類裡面本來就有 div，非貪婪比對會在第一個 </div> 就切斷，
     舊內容留在原地，每跑一次建置就多疊一份。
     （踩過：87 張卡片變成 263 張。） */
  const START_MARK = '<!--GROUPS:START-->';
  const END_MARK = '<!--GROUPS:END-->';
  const filled = `<div id="groups">${START_MARK}${groups}${END_MARK}</div>`;

  if (html.includes(START_MARK)) {
    return html.replace(
      new RegExp(`<div id="groups">${START_MARK}[\\s\\S]*?${END_MARK}</div>`),
      filled
    );
  }
  /* 第一次跑：頁面上還是空的 <div id="groups"></div> */
  return html.replace(/<div id="groups">\s*<\/div>/, filled);
}

/** 工具頁：預填麵包屑與相關工具。
 *  layout.js 偵測到已經有內容就不會重畫。 */
function prefillToolPage(html, tool, cat, TOOLS) {
  const crumb = `<a href="../">首頁</a><span>›</span>` +
    `<a href="../#${cat.id}">${attrEsc(cat.name)}</a><span>›</span>` +
    attrEsc(tool.name);

  let pool = TOOLS.filter(t => t.cat === tool.cat && t.slug !== tool.slug);
  if (pool.length < 4) {
    pool = pool.concat(TOOLS.filter(t => t.cat !== tool.cat && t.slug !== tool.slug)
      .slice(0, 4 - pool.length));
  }
  const related = `<h2>相關工具</h2><div class="grid">` +
    pool.slice(0, 4).map(t => card(t, '../')).join('') + `</div>`;

  return html
    .replace(/<nav class="crumb" id="crumb">[\s\S]*?<\/nav>/,
      `<nav class="crumb" id="crumb">${crumb}</nav>`)
    .replace(/<section class="related" id="relatedTools">[\s\S]*?<\/section>/,
      `<section class="related" id="relatedTools">${related}</section>`);
}

/** 把骨架塞進頁面。已經有的話先換掉，避免重複執行時越長越多。 */
function injectSkeleton(html, header, footer) {
  let out = html
    .replace(new RegExp(`<div ${NAV_MARK}>[\\s\\S]*?</div>\\s*(?=<main|<!--)`, ''), '')
    .replace(new RegExp(`<div ${FOOT_MARK}>[\\s\\S]*?</footer></div>`, ''), '');

  out = out.replace(/(<body[^>]*>)/, `$1\n${header}\n`);
  out = out.replace(/([\s\S]*)<\/body>/, (m, before) => `${before}${footer}\n</body>`);
  return out;
}

/** 檔案的最後修改日期（YYYY-MM-DD）。
 *  拿不到就退回今天，不要因為這個讓建置失敗。 */
function fileDate(file) {
  try {
    return statSync(file).mtime.toISOString().slice(0, 10);
  } catch (e) {
    return new Date().toISOString().slice(0, 10);
  }
}

/* ---------- 小工具 ---------- */
const xmlEsc = s => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

const attrEsc = s => String(s)
  .replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/** 把 HTML 片段轉成乾淨純文字，給 JSON-LD 用 */
function stripHtml(html) {
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTag(html, tag) {
  const m = html.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
  return m ? stripHtml(m[1]) : '';
}

function extractMeta(html, name) {
  const m = html.match(
    new RegExp(`<meta\\s+name=["']${name}["']\\s+content=["']([^"']*)["']`, 'i'));
  return m ? m[1] : '';
}

/** 抽出頁面裡 .faq 區塊的問答對 */
function extractFaq(html) {
  const faqSection = html.match(/<div class="faq">([\s\S]*?)<\/div>\s*<\/section>/i);
  const scope = faqSection ? faqSection[1] : html;

  const out = [];
  const re = /<details>\s*<summary>([\s\S]*?)<\/summary>\s*<div class="a">([\s\S]*?)<\/div>\s*<\/details>/gi;
  let m;
  while ((m = re.exec(scope)) !== null) {
    const q = stripHtml(m[1]);
    const a = stripHtml(m[2]);
    if (q && a) out.push({ q, a });
  }
  return out;
}

/** 把一段 JSON-LD 包成 script 標籤 */
function ld(obj) {
  return `<script type="application/ld+json">\n${JSON.stringify(obj, null, 2)}\n</script>`;
}

/** 移除舊的注入區塊，再把新的插在 </head> 前 */
function inject(html, block) {
  const cleaned = html.replace(
    new RegExp(`\\n?${START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${END}\\n?`, 'g'),
    '\n');

  if (!/<\/head>/i.test(cleaned)) {
    throw new Error('找不到 </head>，無法注入');
  }
  return cleaned.replace(/<\/head>/i, `${START}\n${block}\n${END}\n</head>`);
}

/* ---------- 主程式 ---------- */
const args = process.argv.slice(2);
const originArg = args.find(a => a.startsWith('--origin='));

let { SITE, CATEGORIES, TOOLS } = loadCatalog();

if (originArg) {
  const newOrigin = originArg.slice('--origin='.length).replace(/\/+$/, '');
  const code = readFileSync(CATALOG_PATH, 'utf8')
    .replace(/origin:\s*'[^']*'/, `origin: '${newOrigin}'`);
  writeFileSync(CATALOG_PATH, code, 'utf8');
  SITE.origin = newOrigin;
  console.log(`已將 catalog.js 的 origin 更新為 ${newOrigin}`);
}

const ORIGIN = String(SITE.origin || '').replace(/\/+$/, '');
const isPlaceholder = !ORIGIN || ORIGIN.includes('example.com');

if (isPlaceholder) {
  console.warn(
    '\n⚠️  SITE.origin 還是預設的 example.com。\n' +
    '   正式上線前請執行：node build-seo.mjs --origin=https://你的網域\n' +
    '   否則 canonical、og:url 與 sitemap 都會指向錯誤的位置。\n');
}

const OG_IMAGE = `${ORIGIN}/assets/og.svg`;
const today = new Date().toISOString().slice(0, 10);

let count = 0;
const sitemapEntries = [];

/* ---------- 首頁 ---------- */
{
  const file = join(ROOT, 'index.html');
  /* 首頁文案裡寫死的工具數量會過時，每次建置直接對齊 catalog 的實際筆數。
     只換「N 種免費線上」這個固定句型，不會誤傷其他數字。 */
  const html = readFileSync(file, 'utf8')
    .replace(/\d+(?= 種免費線上)/g, String(TOOLS.length));
  const title = extractTag(html, 'title');
  const desc = extractMeta(html, 'description');
  const url = `${ORIGIN}/`;

  const block = [
    `<link rel="canonical" href="${attrEsc(url)}">`,
    `<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">`,
    ``,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${attrEsc(SITE.name)}">`,
    `<meta property="og:locale" content="zh_TW">`,
    `<meta property="og:title" content="${attrEsc(title)}">`,
    `<meta property="og:description" content="${attrEsc(desc)}">`,
    `<meta property="og:url" content="${attrEsc(url)}">`,
    `<meta property="og:image" content="${attrEsc(OG_IMAGE)}">`,
    ``,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${attrEsc(title)}">`,
    `<meta name="twitter:description" content="${attrEsc(desc)}">`,
    `<meta name="twitter:image" content="${attrEsc(OG_IMAGE)}">`,
    ``,
    ld({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE.name,
      alternateName: '順手工具',
      url: url,
      description: SITE.desc,
      inLanguage: 'zh-Hant',
      publisher: { '@type': 'Organization', name: SITE.name, url: url }
    }),
    ld({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: title,
      description: desc,
      url: url,
      inLanguage: 'zh-Hant',
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: TOOLS.length,
        itemListElement: TOOLS.map((t, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: t.name,
          description: t.desc,
          url: `${ORIGIN}/t/${t.slug}.html`
        }))
      }
    })
  ].join('\n');

  const withSkeleton = injectSkeleton(
    inject(html, block),
    staticHeader(SITE, CATEGORIES, ''),
    staticFooter(SITE, CATEGORIES, TOOLS, '')
  );
  writeFileSync(file, versionAssets(prefillGroups(withSkeleton, CATEGORIES, TOOLS)), 'utf8');
  sitemapEntries.push({ loc: url, priority: '1.0', changefreq: 'weekly' });
  count++;
}

/* ---------- 各工具頁 ---------- */
for (const tool of TOOLS) {
  const file = join(ROOT, 't', `${tool.slug}.html`);
  if (!existsSync(file)) {
    console.warn(`⚠️  找不到 t/${tool.slug}.html，跳過`);
    continue;
  }

  const html = readFileSync(file, 'utf8');
  const title = extractTag(html, 'title');
  const desc = extractMeta(html, 'description') || tool.desc;
  const url = `${ORIGIN}/t/${tool.slug}.html`;
  const cat = CATEGORIES.find(c => c.id === tool.cat);
  const faq = extractFaq(html);

  const blocks = [
    `<link rel="canonical" href="${attrEsc(url)}">`,
    `<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">`,
    `<meta name="keywords" content="${attrEsc(tool.kw.split(/\s+/).join(', '))}">`,
    ``,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${attrEsc(SITE.name)}">`,
    `<meta property="og:locale" content="zh_TW">`,
    `<meta property="og:title" content="${attrEsc(title)}">`,
    `<meta property="og:description" content="${attrEsc(desc)}">`,
    `<meta property="og:url" content="${attrEsc(url)}">`,
    `<meta property="og:image" content="${attrEsc(OG_IMAGE)}">`,
    ``,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${attrEsc(title)}">`,
    `<meta name="twitter:description" content="${attrEsc(desc)}">`,
    `<meta name="twitter:image" content="${attrEsc(OG_IMAGE)}">`,
    ``,
    /* 工具本身 */
    ld({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: tool.name,
      description: desc,
      url: url,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: '任何支援現代瀏覽器的系統',
      browserRequirements: '需要啟用 JavaScript',
      inLanguage: 'zh-Hant',
      isAccessibleForFree: true,
      /* AI 引用時會看新舊，沒有日期的內容容易被當成過期資料跳過。
         用檔案的實際修改時間，不是建置時間，否則每次建置全站都變「今天更新」。 */
      dateModified: fileDate(file),
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
      publisher: { '@type': 'Organization', name: SITE.name, url: `${ORIGIN}/` }
    }),
    /* 麵包屑，跟頁面上 JS 產生的那組一致 */
    ld({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: '首頁', item: `${ORIGIN}/` },
        { '@type': 'ListItem', position: 2, name: cat.name, item: `${ORIGIN}/#${cat.id}` },
        { '@type': 'ListItem', position: 3, name: tool.name, item: url }
      ]
    })
  ];

  /* 有 FAQ 的頁面才加 FAQPage，避免產生空的結構化資料 */
  if (faq.length) {
    blocks.push(ld({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faq.map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a }
      }))
    }));
  }

  const withSkeleton = injectSkeleton(
    inject(html, blocks.join('\n')),
    staticHeader(SITE, CATEGORIES, '../'),
    staticFooter(SITE, CATEGORIES, TOOLS, '../')
  );
  writeFileSync(file, versionAssets(prefillToolPage(withSkeleton, tool, cat, TOOLS)), 'utf8');
  sitemapEntries.push({ loc: url, priority: '0.8', changefreq: 'monthly' });
  count++;

  console.log(`✓ ${tool.slug.padEnd(16)} FAQ ${String(faq.length).padStart(2)} 題`);
}

/* ---------- 404 頁 ----------
   它不進 sitemap、也不需要 SEO 注入（本身帶 noindex），
   但共用資源一樣要加版本號，否則會載到舊的 catalog.js。 */
{
  const file = join(ROOT, '404.html');
  if (existsSync(file)) {
    writeFileSync(file, versionAssets(readFileSync(file, 'utf8')), 'utf8');
    console.log('✓ 404.html        已套用資源版本號');
  }
}

/* ---------- 後台統計頁 ----------
   給站長自己看的，不放連結、不進 sitemap、頁面本身帶 noindex。
   跟 404 一樣只需要資源版本號。 */
{
  const file = join(ROOT, 'stats.html');
  if (existsSync(file)) {
    writeFileSync(file, versionAssets(readFileSync(file, 'utf8')), 'utf8');
    console.log('✓ stats.html      已套用資源版本號（不收錄）');
  }
}

/* ---------- 隱私權政策 ----------
   不是工具頁，但需要被索引（AdSense 要求政策可公開存取），
   所以加上 canonical 與基本的 OG，並列入 sitemap。 */
{
  const file = join(ROOT, 'privacy.html');
  if (existsSync(file)) {
    const html = readFileSync(file, 'utf8');
    const title = extractTag(html, 'title');
    const desc = extractMeta(html, 'description');
    const url = `${ORIGIN}/privacy.html`;

    const block = [
      `<link rel="canonical" href="${attrEsc(url)}">`,
      `<meta name="robots" content="index, follow">`,
      ``,
      `<meta property="og:type" content="article">`,
      `<meta property="og:site_name" content="${attrEsc(SITE.name)}">`,
      `<meta property="og:locale" content="zh_TW">`,
      `<meta property="og:title" content="${attrEsc(title)}">`,
      `<meta property="og:description" content="${attrEsc(desc)}">`,
      `<meta property="og:url" content="${attrEsc(url)}">`,
      ``,
      ld({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: title,
        description: desc,
        url: url,
        inLanguage: 'zh-Hant',
        isPartOf: { '@type': 'WebSite', name: SITE.name, url: `${ORIGIN}/` }
      })
    ].join('\n');

    writeFileSync(file, versionAssets(inject(html, block)), 'utf8');
    sitemapEntries.push({ loc: url, priority: '0.3', changefreq: 'yearly' });
    console.log('✓ privacy.html    已注入 SEO 並列入 sitemap');
    count++;
  }
}

/* ---------- sitemap.xml ---------- */
const sitemap =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  sitemapEntries.map(e =>
    `  <url>\n` +
    `    <loc>${xmlEsc(e.loc)}</loc>\n` +
    `    <lastmod>${today}</lastmod>\n` +
    `    <changefreq>${e.changefreq}</changefreq>\n` +
    `    <priority>${e.priority}</priority>\n` +
    `  </url>`).join('\n') +
  `\n</urlset>\n`;

writeFileSync(join(ROOT, 'sitemap.xml'), sitemap, 'utf8');

/* ---------- robots.txt ---------- */
const robots =
  `User-agent: *\n` +
  `Allow: /\n\n` +
  `# 所有運算都在瀏覽器端完成，沒有需要擋的後端路徑\n` +
  `Sitemap: ${ORIGIN}/sitemap.xml\n`;

writeFileSync(join(ROOT, 'robots.txt'), robots, 'utf8');

/* ---------- llms.txt ----------
   給 AI 引擎看的站台說明。它們在決定要不要引用、怎麼描述一個站的時候
   會找這個檔案，格式是 Markdown，目前是社群慣例還不是正式標準。
   內容要能讓 AI 一眼看懂「這個站有什麼、適合回答什麼問題」。 */
{
  const byCat = CATEGORIES.map(c => {
    const list = TOOLS.filter(t => t.cat === c.id);
    if (!list.length) return '';
    return `### ${c.name}\n\n${c.desc}\n\n` +
      list.map(t => `- [${t.name}](${ORIGIN}/t/${t.slug}.html)：${t.desc}`).join('\n');
  }).filter(Boolean).join('\n\n');

  const llms = `# ${SITE.name}

> ${SITE.desc}

${SITE.name}（${ORIGIN}）收錄 ${TOOLS.length} 個免費線上小工具，分成 ${CATEGORIES.length} 個分類。

## 這個站的特點

- **不需要安裝或註冊**，打開網頁就能用
- **所有運算都在使用者的瀏覽器裡完成**，輸入的文字、上傳的圖片與 PDF 不會傳到伺服器
- 專為**台灣使用者**設計，稅務、勞健保、電費等工具皆依台灣現行法規與費率計算
- 內容為繁體中文

## 引用這個站時請注意

- 稅率、費率、法規門檻等數字會隨政策調整，頁面上標有適用年度，引用時請一併說明
- 工具提供的是試算與參考，不能取代專業意見或官方公告

## 全部工具

${byCat}

---

最後更新：${today}
`;
  writeFileSync(join(ROOT, 'llms.txt'), llms, 'utf8');
  console.log(`✓ llms.txt        已產生（${TOOLS.length} 個工具）`);
}

console.log(`\n完成：處理 ${count} 個頁面，sitemap 收錄 ${sitemapEntries.length} 筆。`);
if (isPlaceholder) {
  console.log('記得上線前用 --origin 重跑一次。');
}
