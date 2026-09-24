/* ==========================================================================
   繁簡轉換字典產生器
   --------------------------------------------------------------------------
   從 OpenCC 官方字典產生 public/assets/js/zh-dict.js。
   產出的檔案是靜態資料，工具頁執行時不需要連任何外部服務。

   什麼時候要重跑：想更新字典內容的時候。平常不用跑，產出的檔案已經在 repo 裡。

       node build-zh-dict.mjs

   需要網路。字典來源是 OpenCC（Apache-2.0），
   https://github.com/BYVoid/OpenCC

   為什麼不直接打包完整的 STPhrases：
   那個檔案有 1MB，但裡面絕大多數詞條「逐字轉換」的結果本來就是對的。
   這支腳本只留下逐字轉換會轉錯的詞（例如 头发 → 頭發 是錯的，要靠詞庫修成 頭髮），
   體積從 1MB 降到不到 200KB，轉換品質不變。
   ========================================================================== */

import fs from 'node:fs/promises';
import path from 'node:path';

const BASE = 'https://cdn.jsdelivr.net/gh/BYVoid/OpenCC@master/data/dictionary';
const OUT = path.join('public', 'assets', 'js', 'zh-dict.js');

const FILES = [
  'STCharacters', 'TSCharacters',
  'STPhrases', 'TSPhrases',
  'TWVariants', 'TWVariantsRevPhrases',
  'TWPhrases', 'TWPhrasesRev'
];

/** 下載並解析成 [key, value] 陣列，只取第一個候選值 */
async function load(name) {
  const res = await fetch(`${BASE}/${name}.txt`);
  if (!res.ok) throw new Error(`${name} 下載失敗：HTTP ${res.status}`);
  const text = await res.text();
  const rows = text.split('\n')
    .filter(l => l && !l.startsWith('#'))
    .map(l => l.split('\t'))
    .filter(a => a.length >= 2 && a[0] && a[1].trim())
    .map(([k, v]) => [k, v.trim().split(/\s+/)[0]]);
  console.log(`  ${name.padEnd(22)} ${String(rows.length).padStart(6)} 條`);
  return rows;
}

/** 把 [key, value] 陣列壓成 "k\tv\nk\tv" 的字串，前端再拆回 Map */
const pack = rows => rows.map(([k, v]) => k + '\t' + v).join('\n');

const kb = s => (Buffer.byteLength(s, 'utf8') / 1024).toFixed(1) + ' KB';

async function main() {
  console.log('下載 OpenCC 字典…');
  const raw = {};
  for (const f of FILES) raw[f] = await load(f);

  /* ---- 字級對照 ---- */
  const s2tChar = raw.STCharacters;
  const t2sChar = raw.TSCharacters;

  const s2tCharMap = new Map(s2tChar);
  const t2sCharMap = new Map(t2sChar);

  /* ---- 詞級對照：只留逐字轉換會轉錯的 ---- */
  const naive = (s, map) => [...s].map(c => map.get(c) || c).join('');

  const s2tPhrase = raw.STPhrases.filter(([k, v]) => v !== naive(k, s2tCharMap));
  const t2sPhrase = raw.TSPhrases.filter(([k, v]) => v !== naive(k, t2sCharMap));

  console.log(`\n詞庫過濾：`);
  console.log(`  簡→繁 ${raw.STPhrases.length} → ${s2tPhrase.length} 條`);
  console.log(`  繁→簡 ${raw.TSPhrases.length} → ${t2sPhrase.length} 條`);

  /* ---- 台灣用語 ---- */
  /* TWVariants 是異體字（僞→偽），TWPhrases 是用語差異（软件→軟體）。
     兩者分開存，因為異體字一定要轉，用語差異是選用的。 */
  const twVariant = raw.TWVariants;
  const twPhrase = raw.TWPhrases;
  const twPhraseRev = raw.TWPhrasesRev;
  const twVariantRev = raw.TWVariantsRevPhrases;

  const payload = {
    s2tChar: pack(s2tChar),
    t2sChar: pack(t2sChar),
    s2tPhrase: pack(s2tPhrase),
    t2sPhrase: pack(t2sPhrase),
    twVariant: pack(twVariant),
    twVariantRev: pack(twVariantRev),
    twPhrase: pack(twPhrase),
    twPhraseRev: pack(twPhraseRev)
  };

  console.log(`\n各區塊大小：`);
  for (const [k, v] of Object.entries(payload)) {
    console.log(`  ${k.padEnd(14)} ${kb(v).padStart(10)}`);
  }

  const body = `/* ==========================================================================
   繁簡轉換字典
   由 build-zh-dict.mjs 自動產生，請勿手動編輯。
   資料來源：OpenCC（Apache-2.0）https://github.com/BYVoid/OpenCC
   格式：每行 "來源\\t目標"，前端載入時再拆成 Map。
   ========================================================================== */
window.ZH_DICT = ${JSON.stringify(payload)};
`;

  await fs.writeFile(OUT, body, 'utf8');
  console.log(`\n已寫入 ${OUT}（${kb(body)}）`);
}

main().catch(err => {
  console.error('產生失敗：', err.message);
  process.exit(1);
});
