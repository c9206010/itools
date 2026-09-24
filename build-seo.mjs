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

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

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
  const html = readFileSync(file, 'utf8');
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

  writeFileSync(file, inject(html, block), 'utf8');
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

  writeFileSync(file, inject(html, blocks.join('\n')), 'utf8');
  sitemapEntries.push({ loc: url, priority: '0.8', changefreq: 'monthly' });
  count++;

  console.log(`✓ ${tool.slug.padEnd(16)} FAQ ${String(faq.length).padStart(2)} 題`);
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

console.log(`\n完成：處理 ${count} 個頁面，sitemap 收錄 ${sitemapEntries.length} 筆。`);
if (isPlaceholder) {
  console.log('記得上線前用 --origin 重跑一次。');
}
