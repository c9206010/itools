/**
 * 抓取統一發票中獎號碼，寫入 assets/data/invoice.json
 *
 * 資料來源：財政部稅務入口網的中獎號碼單（公開頁面，伺服器直出 HTML）
 *   本期  https://invoice.etax.nat.gov.tw/index.html
 *   上期  https://invoice.etax.nat.gov.tw/lastNumber.html
 *
 * 不需要 API 金鑰，也不需要任何 GitHub Secret。
 *
 * 設計原則：寧可不寫，也不寫錯。
 * 只要解析出來的號碼格式不對或數量不足，整支腳本就會失敗並保留舊資料，
 * 因為對獎牽涉真實金錢，錯誤的號碼比沒有號碼更糟。
 *
 * 維護提醒：這是解析 HTML，對方頁面改版就可能失效。
 * 失效時腳本會失敗（不會寫入壞資料），到 Actions 看錯誤訊息，
 * 調整下方 parsePage() 裡的選取規則即可。
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

/* 網站檔案在 public/ 底下，這支腳本位於 .github/scripts/，
   所以要往上兩層回到專案根目錄，再進 public。 */
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public');
const OUT = join(ROOT, 'assets', 'data', 'invoice.json');

const BASE = 'https://invoice.etax.nat.gov.tw';
const PAGES = [
  { url: `${BASE}/index.html`, label: '本期' },
  { url: `${BASE}/lastNumber.html`, label: '上期' }
];

const UA = 'Mozilla/5.0 (compatible; TaiwanToolsBot/1.0; +static-site-updater)';

/* ---------- 小工具 ---------- */
const stripTags = s => s.replace(/<[^>]+>/g, '');
const onlyDigits = s => s.replace(/\D/g, '');

/** 取出這個儲存格裡所有「號碼段落」的數字。
 *  號碼放在 class 含 etw-tbiggest 的 <p> 裡，說明文字則是普通的 <p class="mb-0">。
 *  頭獎的每個號碼會被拆成兩個 <span>（後三碼另外標紅），去標籤後取數字就會自動接回來。 */
function numbersInCell(html) {
  const out = [];
  const re = /<p([^>]*)>([\s\S]*?)<\/p>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const attrs = m[1];
    if (!/etw-tbiggest/.test(attrs)) continue;      // 說明段落，跳過
    const digits = onlyDigits(stripTags(m[2]));
    if (digits) out.push(digits);
  }
  return out;
}

/** 解析一個中獎號碼單頁面 */
function parsePage(html, pageLabel) {
  /* 期別：兩個頁面的導覽列都同時列出本期與上期的連結，
     所以一定要鎖定標記為「目前頁」（class="etw-on"）的那一個，
     否則在上期頁面會誤抓到本期的期別。 */
  let period = '';

  const onMatch = html.match(/class="etw-on"[^>]*title="(\d{3}年\d{2}-\d{2}月)中獎號碼單"/)
    || html.match(/title="(\d{3}年\d{2}-\d{2}月)中獎號碼單"[^>]*class="etw-on"/);
  if (onMatch) period = onMatch[1];

  /* 找不到目前頁標記時，退而求其次抓 <title> 或 <h1> 裡的期別 */
  if (!period) {
    const head = html.match(/<(?:title|h1)[^>]*>([\s\S]{0,120}?)<\/(?:title|h1)>/);
    const any = head && head[1].match(/(\d{3}年\d{2}-\d{2}月)/);
    if (any) period = any[1];
  }

  /* 逐列解析獎別與號碼 */
  const prizes = { special: '', grand: '', first: [], additional6: [] };

  const rowRe = /<tr>([\s\S]*?)<\/tr>/g;
  let row;
  while ((row = rowRe.exec(html)) !== null) {
    const inner = row[1];

    const nameCell = inner.match(/<td[^>]*headers="th01"[^>]*>([\s\S]*?)<\/td>/);
    const numCell = inner.match(/<td[^>]*headers="th02"[^>]*>([\s\S]*?)<\/td>/);
    if (!nameCell || !numCell) continue;

    const name = stripTags(nameCell[1]).replace(/\s+/g, '');
    const nums = numbersInCell(numCell[1]);
    if (!nums.length) continue;                     // 二到六獎沒有自己的號碼

    if (name.includes('特別獎')) prizes.special = nums[0];
    else if (name.includes('特獎')) prizes.grand = nums[0];
    else if (name.includes('頭獎')) prizes.first = nums;
    else if (name.includes('增開')) prizes.additional6 = nums;
  }

  /* ---------- 驗證 ---------- */
  const problems = [];
  const is8 = s => /^\d{8}$/.test(s);

  if (!period) problems.push('抓不到期別');
  if (!is8(prizes.special)) problems.push(`特別獎格式不符：「${prizes.special}」`);
  if (!is8(prizes.grand)) problems.push(`特獎格式不符：「${prizes.grand}」`);
  if (prizes.first.length === 0) problems.push('抓不到任何頭獎號碼');
  prizes.first.forEach((n, i) => {
    if (!is8(n)) problems.push(`頭獎第 ${i + 1} 組格式不符：「${n}」`);
  });
  prizes.additional6.forEach((n, i) => {
    if (!/^\d{3}$/.test(n)) problems.push(`增開六獎第 ${i + 1} 組格式不符：「${n}」`);
  });

  if (problems.length) {
    const err = new Error(`${pageLabel}解析失敗：\n  - ` + problems.join('\n  - '));
    err.problems = problems;
    throw err;
  }

  return { period, prizes };
}

/* ---------- 主流程 ---------- */
const results = [];

for (const page of PAGES) {
  console.log(`抓取 ${page.label}：${page.url}`);

  let html;
  try {
    const res = await fetch(page.url, { headers: { 'User-Agent': UA } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    html = await res.text();
  } catch (e) {
    /* 本期抓不到就整支失敗；上期抓不到只警告，不影響主要功能 */
    if (page.label === '本期') {
      console.error(`本期頁面抓取失敗：${e.message}`);
      process.exit(1);
    }
    console.warn(`  上期頁面抓取失敗（略過）：${e.message}`);
    continue;
  }

  try {
    const parsed = parsePage(html, page.label);
    results.push(parsed);
    console.log(`  ✓ ${parsed.period}　頭獎 ${parsed.prizes.first.length} 組` +
                `${parsed.prizes.additional6.length ? `　增開六獎 ${parsed.prizes.additional6.length} 組` : ''}`);
  } catch (e) {
    if (page.label === '本期') {
      console.error(e.message);
      console.error('\n頁面結構可能已改版，請調整 parsePage() 的選取規則。');
      process.exit(1);
    }
    console.warn(`  上期解析失敗（略過）：${e.message}`);
  }
}

if (!results.length) {
  console.error('沒有取得任何期別的資料，保留原檔不做更新');
  process.exit(1);
}

/* ---------- 與既有資料合併 ----------
   官方頁面一次只提供本期與上期，所以要把每次抓到的併進舊資料，
   才能累積出歷史期別。同一期以這次抓到的為準（官方可能更正過）。 */
const KEEP = 6;   // 保留最近幾期，6 期約等於一年

const existing = JSON.parse(readFileSync(OUT, 'utf8'));
const merged = new Map();

/* 先放舊的，再用新的覆蓋，確保更正過的號碼會生效 */
(Array.isArray(existing.periods) ? existing.periods : []).forEach(p => {
  if (p && p.period) merged.set(p.period, p);
});
results.forEach(p => merged.set(p.period, p));

/** 把「115年05-06月」轉成可排序的數字，例如 11506 */
function sortKey(label) {
  const m = label.match(/(\d{3})年(\d{2})-(\d{2})月/);
  return m ? Number(m[1]) * 100 + Number(m[3]) : 0;
}

const periods = Array.from(merged.values())
  .sort((a, b) => sortKey(b.period) - sortKey(a.period))
  .slice(0, KEEP);

const dropped = merged.size - periods.length;

/* 台北時間的日期。這支腳本跑在 UTC 的機器上，直接用 UTC 會讓
   台灣早上八點以前的執行標成前一天。 */
const today = new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10);

/* updatedAt 只在號碼真的變動時才前進。
   以前每跑一次就蓋成今天，結果是明明秀著兩個月前的號碼，
   頁面上卻寫「更新於今天」——使用者會以為這就是最新一期。
   checkedAt 才是「最後檢查時間」，兩者分開才誠實。 */
const changed = JSON.stringify(existing.periods || []) !== JSON.stringify(periods);

const output = {
  _說明: '本檔由 .github/workflows/invoice.yml 自動更新，請勿手動編輯。',
  _格式: existing._格式,
  updatedAt: changed ? today : (existing.updatedAt || today),
  checkedAt: today,
  source: '財政部稅務入口網 中獎號碼單',
  sourceUrl: BASE + '/',
  periods
};

writeFileSync(OUT, JSON.stringify(output, null, 2) + '\n', 'utf8');

console.log(`\n寫入成功，保留 ${periods.length} 期：${periods.map(p => p.period).join('、')}`);
console.log(changed ? '號碼有變動，updatedAt 前進到 ' + today
                    : '號碼與上次相同，updatedAt 維持 ' + output.updatedAt);
if (dropped > 0) console.log(`（超過 ${KEEP} 期，已淘汰最舊的 ${dropped} 期）`);
