/* ==========================================================================
   產生「文章置入工具」對照表
   --------------------------------------------------------------------------
   輸出 tool-index.md，給寫文章時的技能讀。
   內容是「什麼情境 → 放哪個工具 → 用什麼句子帶入」。

   為什麼要自動產生：
   工具會一直增加，手寫的清單一定會過期，然後技能就會叫人連到不存在的頁面。
   從 catalog.js 長出來，新增工具只要重跑一次。

       node build-tool-index.mjs

   新增工具之後，如果它適合在文章裡置入，記得到下面的 CONTEXTS 加一筆。
   沒加的工具會被列在「尚未歸類」區，提醒你處理。
   ========================================================================== */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'public';
const SITE_URL = 'https://tools.luka-life.com';

/* 讀 catalog.js，它是給瀏覽器用的普通腳本，直接求值取出常數 */
const src = readFileSync(join(ROOT, 'assets', 'js', 'catalog.js'), 'utf8');
const TOOLS = new Function(src + '; return TOOLS;')();

/* ==========================================================================
   情境對照
   scope: 'out' 只適合出國文、'in' 只適合國內文、'both' 兩者皆可
   when:  什麼時候放
   where: 放在文章的哪個位置
   line:  建議的帶入句（寫作時要依文章語氣改寫，不要原封不動貼）
   ========================================================================== */
const CONTEXTS = [
  { slug: 'passport', scope: 'out', when: '文章談到行前準備、第一次出國、辦簽證',
    where: '行前準備段落',
    line: '護照效期不足六個月會在報到櫃檯就被擋下來，出發前先確認一次比較保險' },

  { slug: 'plug', scope: 'out', when: '文章談到行李、充電、住宿設備',
    where: '行李或住宿段落',
    line: '各國的插座形狀與電壓都不一樣，帶錯轉接頭當場很麻煩' },

  { slug: 'luggage', scope: 'out', when: '文章談到行李、廉航、託運規定',
    where: '交通或行李段落',
    line: '廉航的行李尺寸抓得很嚴，出發前先量過比在櫃檯補錢划算' },

  { slug: 'packing', scope: 'both', when: '文章談到行李打包、露營、親子出遊要帶什麼',
    where: '行前準備段落',
    line: '最常忘的從來不是衣服，是充電線跟藥品' },

  { slug: 'tax-refund', scope: 'out', when: '文章談到購物、藥妝、免稅店',
    where: '購物段落',
    line: '退稅扣掉手續費之後實拿通常少一截，金額不大的話未必值得排隊' },

  { slug: 'exchange', scope: 'out', when: '文章出現當地價格、談到換匯',
    where: '第一次出現當地幣別價格的地方',
    line: '換算成台幣心裡比較有底' },

  { slug: 'timezone', scope: 'out', when: '文章談到時差、跨時區班機、訂房入住時間',
    where: '交通或行程段落',
    line: '時差算錯很容易把接機或訂房時間搞混' },

  { slug: 'flight', scope: 'out', when: '文章談到轉機、紅眼班機、長途航班',
    where: '交通段落',
    line: '轉機時間夠不夠，算過才知道' },

  { slug: 'weather', scope: 'both', when: '文章談到季節、氣溫、該穿什麼',
    where: '季節或穿搭段落',
    line: '出發前一週再看一次預報，溫差大的地方尤其要' },

  { slug: 'fuel', scope: 'in', when: '文章是自駕遊記、提到開車前往、停車',
    where: '交通方式段落',
    line: '自己開車的話可以先估一下油錢' },

  { slug: 'split', scope: 'both', when: '文章提到多人同行、團體訂房、分攤費用',
    where: '費用或行程段落',
    line: '多人同行最後結帳最容易算不清楚' },

  { slug: 'exif', scope: 'both', when: '文章大量使用實拍照片，尤其是住家、民宿、親子照',
    where: '文末或拍照相關段落',
    line: '手機拍的照片會記錄拍攝地點，要發到公開的地方前建議先清掉' },

  { slug: 'social-crop', scope: 'both', when: '文章談到拍照打卡、發社群',
    where: '拍照段落',
    line: '同一張照片發不同平台，尺寸不對會被裁掉重點' }
];

const byId = Object.fromEntries(TOOLS.map(t => [t.slug, t]));
const SCOPE_LABEL = { out: '出國', in: '國內', both: '國內外皆可' };

const used = new Set(CONTEXTS.map(c => c.slug));
const missing = CONTEXTS.filter(c => !byId[c.slug]);
const unclassified = TOOLS.filter(t => !used.has(t.slug));

if (missing.length) {
  console.error('這些 slug 在 catalog.js 裡不存在，請修正 CONTEXTS：');
  missing.forEach(c => console.error('  ✕ ' + c.slug));
  process.exit(1);
}

const rows = CONTEXTS.map(c => {
  const t = byId[c.slug];
  return `| ${SCOPE_LABEL[c.scope]} | [${t.name}](${SITE_URL}/t/${t.slug}.html) | ${c.when} | ${c.where} | ${c.line} |`;
}).join('\n');

const body = `# 文章置入工具對照表

> 由 \`build-tool-index.mjs\` 從 \`catalog.js\` 自動產生，**請勿手動編輯**。
> 工具有增減時重跑 \`node build-tool-index.mjs\`。
> 產生時間：${new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10)}（台北）
> 目前站上共 ${TOOLS.length} 個工具，其中 ${CONTEXTS.length} 個適合在文章裡置入。

## 置入原則

1. **一篇最多兩到三個**。超過就變成工具目錄，不是遊記。
2. **只放讀者當下真的會需要的**。談行李的段落放行李工具，不要在美食段落硬塞。
3. **國內文不要放出國工具**。下表的「適用」欄位就是在管這件事。
4. **用句子帶入，不要列清單**。目標是「順手幫你一把」，不是「推薦連結」。
5. **不要放在文章開頭**。開頭是聯盟連結的位置，兩者搶同一個版位會互相稀釋。
6. **建議句要改寫**，配合該篇文章的語氣，不要原封不動貼上。

## 對照表

| 適用 | 工具 | 什麼時候放 | 放在哪 | 建議帶入句 |
|---|---|---|---|---|
${rows}

## 連結寫法

單行 HTML，照旅咖的排版規則：

\`\`\`html
<p>前面自然的句子，<a href="${SITE_URL}/t/SLUG.html" target="_blank" rel="noopener">工具名稱</a>，後面接著講下去</p>
\`\`\`

## 尚未歸類的工具（${unclassified.length} 個）

這些目前不在置入清單裡。多數是與旅遊無關的工具，不必處理；
如果其中有適合放進文章的，到 \`build-tool-index.mjs\` 的 CONTEXTS 加一筆再重跑。

${unclassified.map(t => `- ${t.name}（${t.cat}／\`${t.slug}\`）`).join('\n')}
`;

writeFileSync('tool-index.md', body, 'utf8');

console.log(`已寫入 tool-index.md`);
console.log(`  站上工具 ${TOOLS.length} 個`);
console.log(`  已歸類可置入 ${CONTEXTS.length} 個`);
console.log(`  尚未歸類 ${unclassified.length} 個`);
