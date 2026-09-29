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
   type:  'travel' 旅遊文用、'3c' 開箱評測用。兩張表分開輸出。
   scope: 旅遊文才有意義——'out' 只適合出國文、'in' 只適合國內文、'both' 皆可
   when:  什麼時候放
   where: 放在文章的哪個位置
   line:  建議的帶入句（寫作時要依文章語氣改寫，不要原封不動貼）
   ========================================================================== */
const CONTEXTS = [
  { slug: 'passport', type: 'travel', scope: 'out', when: '文章談到行前準備、第一次出國、辦簽證',
    where: '行前準備段落',
    line: '護照效期不足六個月會在報到櫃檯就被擋下來，出發前先確認一次比較保險' },

  { slug: 'plug', type: 'travel', scope: 'out', when: '文章談到行李、充電、住宿設備',
    where: '行李或住宿段落',
    line: '各國的插座形狀與電壓都不一樣，帶錯轉接頭當場很麻煩' },

  { slug: 'luggage', type: 'travel', scope: 'out', when: '文章談到行李、廉航、託運規定',
    where: '交通或行李段落',
    line: '廉航的行李尺寸抓得很嚴，出發前先量過比在櫃檯補錢划算' },

  { slug: 'packing', type: 'travel', scope: 'both', when: '文章談到行李打包、露營、親子出遊要帶什麼',
    where: '行前準備段落',
    line: '最常忘的從來不是衣服，是充電線跟藥品' },

  { slug: 'tax-refund', type: 'travel', scope: 'out', when: '文章談到購物、藥妝、免稅店',
    where: '購物段落',
    line: '退稅扣掉手續費之後實拿通常少一截，金額不大的話未必值得排隊' },

  { slug: 'exchange', type: 'travel', scope: 'out', when: '文章出現當地價格、談到換匯',
    where: '第一次出現當地幣別價格的地方',
    line: '換算成台幣心裡比較有底' },

  { slug: 'timezone', type: 'travel', scope: 'out', when: '文章談到時差、跨時區班機、訂房入住時間',
    where: '交通或行程段落',
    line: '時差算錯很容易把接機或訂房時間搞混' },

  { slug: 'flight', type: 'travel', scope: 'out', when: '文章談到轉機、紅眼班機、長途航班',
    where: '交通段落',
    line: '轉機時間夠不夠，算過才知道' },

  { slug: 'weather', type: 'travel', scope: 'both', when: '文章談到季節、氣溫、該穿什麼',
    where: '季節或穿搭段落',
    line: '出發前一週再看一次預報，溫差大的地方尤其要' },

  { slug: 'fuel', type: 'travel', scope: 'in', when: '文章是自駕遊記、提到開車前往、停車',
    where: '交通方式段落',
    line: '自己開車的話可以先估一下油錢' },

  { slug: 'split', type: 'travel', scope: 'both', when: '文章提到多人同行、團體訂房、分攤費用',
    where: '費用或行程段落',
    line: '多人同行最後結帳最容易算不清楚' },

  { slug: 'exif', type: 'travel', scope: 'both', when: '文章大量使用實拍照片，尤其是住家、民宿、親子照',
    where: '文末或拍照相關段落',
    line: '手機拍的照片會記錄拍攝地點，要發到公開的地方前建議先清掉' },

  { slug: 'social-crop', type: 'travel', scope: 'both', when: '文章談到拍照打卡、發社群',
    where: '拍照段落',
    line: '同一張照片發不同平台，尺寸不對會被裁掉重點' },

  /* ---------- 3C 開箱評測 ---------- */
  { slug: 'screen-test', type: '3c', when: '螢幕、筆電、手機、平板、電視的開箱評測',
    where: '第三個 H2「實際使用體驗／實測表現」',
    line: '新螢幕到手第一件事是檢查有沒有壞點，七天鑑賞期內發現還來得及換' },

  { slug: 'keyboard-test', type: '3c', when: '鍵盤、筆電的開箱評測',
    where: '第三個 H2「實際使用體驗／實測表現」',
    line: '機械軸買回來先全鍵掃一遍，卡鍵或連點早點發現早點處理' },

  { slug: 'typing', type: '3c', when: '鍵盤開箱，談到手感、段落感、打字速度',
    where: '第三個 H2，接在手感描述之後',
    line: '換鍵盤之後速度有沒有進步，測一下比體感準' },

  { slug: 'av-test', type: '3c', when: '耳麥、視訊鏡頭、筆電、手機的收音與鏡頭評測',
    where: '第三個 H2「實際使用體驗／實測表現」',
    line: '收音跟畫面自己先測一次，開會前才發現沒聲音很尷尬' },

  { slug: 'electricity', type: '3c', when: '冷氣、除濕機、空氣清淨機、冰箱、掃地機等家電開箱',
    where: '第二個 H2「核心功能與重點規格」談耗電之後，或第三個 H2 實測段落',
    line: '耗電看瓦數沒感覺，換算成一個月電費比較有畫面' },

  { slug: 'image-compress', type: '3c', when: '相機、手機的拍照評測，或談到照片要上傳分享',
    where: '樣張或實拍段落',
    line: '原檔太大不好傳，壓一下畫質肉眼看不太出來' },

  { slug: 'exif', type: '3c', when: '相機、手機的拍照評測，尤其談到定位或照片分享',
    where: '樣張段落或文末',
    line: '手機拍的照片會夾帶拍攝地點，發出去前記得先清掉' },

  { slug: 'unit', type: '3c', when: '開箱文出現英吋、磅、盎司等進口規格',
    where: '規格表附近',
    line: '國外規格常用英制，換算過來比較好想像' }
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

const link = c => `[${byId[c.slug].name}](${SITE_URL}/t/${c.slug}.html)`;
const of = type => CONTEXTS.filter(c => c.type === type);

const travelRows = of('travel').map(c =>
  `| ${SCOPE_LABEL[c.scope]} | ${link(c)} | ${c.when} | ${c.where} | ${c.line} |`).join('\n');

const threeCRows = of('3c').map(c =>
  `| ${link(c)} | ${c.when} | ${c.where} | ${c.line} |`).join('\n');

const body = `# 文章置入工具對照表

> 由 \`build-tool-index.mjs\` 從 \`catalog.js\` 自動產生，**請勿手動編輯**。
> 工具有增減時重跑 \`node build-tool-index.mjs\`。
> 產生時間：${new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10)}（台北）
> 目前站上共 ${TOOLS.length} 個工具，其中 ${CONTEXTS.length} 個適合置入文章（旅遊 ${of('travel').length}、3C ${of('3c').length}）。

## 共通置入原則

1. **一篇最多兩到三個**。超過就變成工具目錄，不是文章。
2. **只放讀者當下真的會需要的**。談行李的段落放行李工具，不要在美食段落硬塞。
3. **用句子帶入，不要列清單**。目標是「順手幫你一把」，不是「推薦連結」。
4. **不要放在文章開頭**。開頭是聯盟連結的位置，兩者搶同一個版位會互相稀釋。
5. **同一個 H2 底下最多一個**，同一個工具一篇只出現一次。
6. **建議句要改寫**，配合該篇文章的語氣，不要原封不動貼上。

## 旅遊文章（${of('travel').length} 個）

額外規則：**國內文不要放出國工具**，護照效期、插頭電壓放在台中親子遊記裡只會顯得荒謬。
「適用」欄位就是在管這件事。

| 適用 | 工具 | 什麼時候放 | 放在哪 | 建議帶入句 |
|---|---|---|---|---|
${travelRows}

## 3C 開箱評測（${of('3c').length} 個）

額外規則：**檢測類工具放在「實測表現」那個 H2，不要放在規格表旁邊**。
讀者看規格時還在比較要不要買，看實測時才是已經買了、想自己驗證。
放錯位置會變成干擾購買決策。

| 工具 | 什麼時候放 | 放在哪 | 建議帶入句 |
|---|---|---|---|
${threeCRows}

## 連結寫法

單行 HTML，照旅咖的排版規則：

\`\`\`html
<p>前面自然的句子，<a href="${SITE_URL}/t/SLUG.html" target="_blank" rel="noopener">工具名稱</a>，後面接著講下去</p>
\`\`\`

## 尚未歸類的工具（${unclassified.length} 個）

這些目前不在置入清單裡。多數是與文章主題無關的工具（開發編碼那類），不必處理；
如果其中有適合放進文章的，到 \`build-tool-index.mjs\` 的 CONTEXTS 加一筆再重跑。

${unclassified.map(t => `- ${t.name}（${t.cat}／\`${t.slug}\`）`).join('\n')}
`;

writeFileSync('tool-index.md', body, 'utf8');

console.log(`已寫入 tool-index.md`);
console.log(`  站上工具 ${TOOLS.length} 個`);
console.log(`  已歸類可置入 ${CONTEXTS.length} 個`);
console.log(`  尚未歸類 ${unclassified.length} 個`);
