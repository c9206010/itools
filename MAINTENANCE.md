# 順手工具箱 — 維護手冊

這份文件是給「幾個月後回來、什麼都忘光了」的自己看的。

---

## 東西放在哪

| 項目 | 位置 |
|---|---|
| 程式碼（唯一正本） | `C:\Users\aaron\luka-tools` |
| GitHub | https://github.com/c9206010/itools |
| 線上網址 | https://tools.luka-life.com |
| 部署平台 | Cloudflare Pages（連到上面那個 GitHub repo） |
| Google Drive 裡的那份 | **只是備份，不要在那邊改**。Git 放在雲端硬碟會被同步程式弄壞 |

Cloudflare Pages 的設定：建置指令留空，輸出目錄是 `public`。
推上 GitHub 的 `main` 分支就會自動部署，大約一到兩分鐘。

---

## 怎麼重新開始工作

關掉 IDE 不影響任何東西，程式碼都在硬碟跟 GitHub 上。要繼續改的時候：

**用 Claude Code（推薦）**

1. 開終端機（PowerShell 或 Git Bash）
2. `cd C:\Users\aaron\luka-tools`
3. 執行 `claude`
4. 直接說要改什麼。先請它讀這份 `MAINTENANCE.md`。

也可以用 VS Code 或任何編輯器開這個資料夾，純手動改也行，
流程一樣（改檔 → 跑建置 → 推上去）。

**換一台電腦的話**

```
git clone https://github.com/c9206010/itools.git luka-tools
cd luka-tools
```

---

## 標準修改流程

不管改什麼，都是這四步：

```bash
cd C:\Users\aaron\luka-tools

# 1. 改檔案（見下面各種情境）

# 2. 重新產生 SEO 與 sitemap，一定要跑
node build-seo.mjs

# 3. 送上去
git add -A
git commit -m "說明改了什麼"
git push

# 4. 等一兩分鐘，到 https://tools.luka-life.com 確認
```

`build-seo.mjs` 會做這些事，所以**漏跑會出問題**：

- 把 canonical、OG、Twitter Card、JSON-LD 注入每一頁的 `<!-- SEO:START -->` 區塊
- 從頁面裡的 `<details>` 自動抓出 FAQ 產生 FAQPage 結構化資料
- 重新產生 `sitemap.xml`
- 幫共用資源加上內容雜湊版本號
  （**這是對抗 Cloudflare 快取的關鍵**，沒有它使用者會載到舊檔）
- 把首頁文案裡的「N 種免費線上」自動對齊實際工具數量

新增一個共用的 js 或 css 檔時，記得加進 `build-seo.mjs` 最上面的
`SHARED_ASSETS` 陣列，否則那個檔案不會有版本號，改了也推不出去。

---

## 情境一：新增一個工具

1. **先在 `public/assets/js/catalog.js` 的 `TOOLS` 陣列加一筆**（這是唯一的真實來源，
   首頁、搜尋、頁尾、麵包屑、相關工具全部從這裡長出來）：

   ```js
   { slug: 'my-tool', cat: 'travel', icon: '🧭', name: '工具名稱',
     desc: '一句話說明', kw: '搜尋關鍵字 用空白分隔' },
   ```

   `cat` 要對應 `CATEGORIES` 裡已有的 id：
   `random time text symbol dev calc image pdf social travel tw device`

2. **建立 `public/t/my-tool.html`**。最快的方法是複製一個結構類似的既有工具來改。
   每一頁必須有：

   - `<title>` 與 `<meta name="description">`（build 會拿去做 OG／JSON-LD）
   - `<body data-root="../" data-tool="my-tool">`，`data-tool` 要等於 slug
   - `<nav class="crumb" id="crumb"></nav>` 與 `<section class="related" id="relatedTools"></section>`
   - 載入 `../assets/js/catalog.js` 與 `../assets/js/layout.js`
   - 一個 `<div class="faq">`，裡面放三到五組 `<details>`，build 會自動變成 FAQ 結構化資料
   - 不要自己寫 `<!-- SEO:START -->` 區塊，那是自動產生的

3. 跑 `node build-seo.mjs`，然後 commit、push。

---

## 情境二：改文案或修 bug

直接改對應的 `public/t/xxx.html`，跑 `node build-seo.mjs`，推上去。

改 `<title>` 或 `<meta description>` 的話也一樣——build 會把新的內容同步到
OG、Twitter Card 跟 JSON-LD，不用手動改七個地方。

---

## 情境三：改全站樣式

`public/assets/css/main.css`。檔案最後面有一段「旅行感的細節」是裝飾層，
要調整視覺風格從那邊下手比較安全。

顏色一律用 CSS 變數（`--brand`、`--ink-2`、`--border` 等），
而且**三個地方都要改**：`:root`、`@media (prefers-color-scheme: dark)`、
`:root[data-theme="dark"]`。漏改其中一個會有某個模式壞掉。

---

## 情境四：改共用的頁首頁尾

`public/assets/js/layout.js`。這支負責注入 header、footer、搜尋、
深淺色切換、麵包屑、相關工具、廣告版位，並提供 `window.U` 這組工具函式。

`public/assets/js/cities.js` 是世界城市與時區資料，
`世界時區換算` 跟 `航班時間轉機計算` 共用同一份。

`public/assets/js/zh-dict.js` 是繁簡轉換的字典，只有 `繁簡轉換` 在用。
**這個檔案是自動產生的，不要手動改**。要更新字典內容時跑：

```bash
node build-zh-dict.mjs      # 需要網路，會從 OpenCC 重新抓一次
node build-seo.mjs          # 字典換了，版本號也要跟著換
```

那支腳本只留「逐字轉換會轉錯」的詞條（例如 头发 → 頭發 是錯的，要靠詞庫修成 頭髮），
所以體積從 OpenCC 原始的 1MB 降到 360KB 左右。平常不用跑，產出的檔案已經在 repo 裡。

---

## 測試

測試腳本不在 repo 裡（它們是開發用的臨時檔）。要重新產生的話，
請 Claude Code「寫一組 jsdom 測試檢查所有工具頁」即可。基本檢查項目：

1. **靜態檢查**：catalog 的每個 slug 都有對應檔案、頁面引用的 id 都存在
2. **執行期檢查**：用 jsdom 載入每一頁，確認沒有 JavaScript 錯誤
3. **邏輯檢查**：針對會算數字的工具驗證關鍵結果

最低限度：推上去之後自己打開幾個改過的頁面點一點。

---

## 外部服務

| 服務 | 用在哪 | 要不要金鑰 |
|---|---|---|
| `open.er-api.com` | 匯率換算、退稅計算器 | 不用 |
| `api.open-meteo.com` | 天氣穿搭建議 | 不用 |
| `geocoding-api.open-meteo.com` | 天氣工具的城市搜尋 | 不用 |
| `cdnjs.cloudflare.com` | pdf-lib、qrcode 函式庫 | 不用 |
| Google AdSense | 每個工具頁一個版位 | 設定在 `catalog.js` 的 `SITE.adsense` |

繁簡轉換用的 OpenCC 字典（Apache-2.0）是**打包成靜態檔**的，
只有跑 `build-zh-dict.mjs` 時才會連網，使用者端不會對外連線。

**整個專案沒有任何 API 金鑰或密碼**，所以 repo 可以公開。
發票對獎的中獎號碼是靠 GitHub Actions（`.github/workflows/invoice.yml`）
每天去財政部網站抓，也不需要金鑰。抓到格式不對的資料會直接中止並保留舊資料。

---

## 踩過的坑

- **Cloudflare 的快取規則管不到 Pages 的自訂網域。** 試過清除快取、
  Bypass cache 規則、Edge TTL 設 respect origin，全都無效，實測 `age`
  會超過 `max-age` 還是回 HIT。解法是靠檔名版本號（build 會自動加）。
  HTML 本身偶爾還是要去 Cloudflare 後台手動清一次。

- **臺灣銀行牌告匯率抓不到。** `rate.bot.com.tw` 有機器人驗證，
  網頁跟 CSV 端點都會回一頁 proof-of-work 挑戰。所以改用 `open.er-api.com`
  的國際參考價，頁面上有標示這不是銀行牌告價。

- **不要偽造資料。** 發票中獎號碼、郵遞區號、電價級距這類東西，
  查不到就不要生一個像樣的數字出來——使用者會照著它去做決定。
  查得到但會變動的（稅率、行李上限），就做成可以自己改的欄位並標示清楚。

- **Google Drive 裡不能放 Git repo。** 同步程式會把 `.git` 弄壞。

---

最後更新：2026-09-24（新增八個工具、繁簡轉換字典）
