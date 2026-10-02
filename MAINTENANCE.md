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

4. **如果這個工具適合放進部落格文章**，到 `build-tool-index.mjs` 的
   `CONTEXTS` 加一筆（寫清楚 type 是 travel 還是 3c、什麼時候放、建議帶入句），
   再跑 `node build-tool-index.mjs`。

   產出的 `tool-index.md` 是寫文章時的技能
   （`travel-affiliate-optimizer` 第 9 個模組）會去讀的對照表。
   漏跑的話，寫新文章時不會知道有這個工具，等於白做。
   不適合放進文章的工具（例如開發編碼類）不必處理，
   它們會自動被列在對照表的「尚未歸類」區。

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

## 首頁瀏覽統計

首頁那排「線上人數／今日／本週／本月／總瀏覽」是**自己做的計數器**，
不是讀 GA。原因是 GA 的數據沒辦法從前端讀取，要讀就得開 Google Cloud
專案、建服務帳戶、在 Worker 裡做 JWT 簽章，設定成本高很多。

| 檔案 | 做什麼 |
|---|---|
| `functions/api/hit.js` | `POST /api/hit`，記錄一次瀏覽，一律回 204 |
| `functions/api/stats.js` | `GET /api/stats`，回傳數字，邊緣快取 30 秒 |
| `functions/api/_shared.js` | 台北日期、訪客雜湊、爬蟲判斷 |
| `schema.sql` | 資料表定義 |

`functions/` 要放在 **repo 根目錄**，不是 `public/` 裡面。
Cloudflare Pages 會自動把它變成 API，不用改建置設定。

### 第一次設定（只要做一次）

1. Cloudflare 後台 → **Storage & Databases → D1** → 建立資料庫，命名 `luka-tools-stats`
2. 建表：
   ```bash
   npx wrangler d1 execute luka-tools-stats --remote --file=schema.sql
   ```
3. Pages 專案 → **Settings → Bindings** → 新增 **D1 database binding**
   - Variable name 一定要填 **`DB`**（程式裡寫死的）
   - Database 選剛才建的 `luka-tools-stats`
4. 重新部署一次讓綁定生效

### 沒設定會怎樣

**什麼都不會壞**。`env.DB` 不存在時 `hit` 直接跳過、`stats` 回 `ok:false`，
首頁的數據區塊會維持隱藏，不會顯示一排 0。網站其他功能完全不受影響。

### 設計上的取捨

- **只存彙總數字，不存瀏覽明細**，所以資料庫幾乎不會長大
- 訪客識別碼是 `IP + UA + 當天日期` 的 SHA-256 前 16 字元。
  不可逆，而且**摻了日期所以隔天就換一組**，無法長期追蹤
- `recent` 表 15 分鐘後清掉，清理是 2% 機率順手做，不是每次請求都做
- 有擋常見爬蟲（`_shared.js` 的 `BOT_RE`），否則 Googlebot 會把數字灌爆
- 每次瀏覽 3 筆寫入。D1 免費額度是每天 10 萬筆寫入，
  換算大約可以撐到每天 3 萬次瀏覽

**動到這裡記得同步改 `privacy.html` 的第五節**，那是對使用者的承諾。

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
| Google Analytics (GA4) | 全站流量統計 | 設定在 `catalog.js` 的 `SITE.analytics` |

GA4 的資源是「順手工具箱」，評估 ID `G-P6F2324FNV`，掛在既有的 GA 帳戶底下。
程式碼寫在 `layout.js` 的 `initAnalytics()`，**只有預設的瀏覽事件，沒有自訂事件**，
工具裡輸入的任何內容都不會送出去。瀏覽器開啟 Do Not Track 時完全不載入。

把 `SITE.analytics.enabled` 改成 `false` 就能整個關掉。
**動到這裡記得同步改 `privacy.html` 的第四節與第三方服務表格**，
那是對使用者的承諾，不能只改程式碼。

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

- **任何還不存在的網址，一次都不要去打。** 這個坑很容易踩：推上去之後想確認
  部署好了沒，就一直重新整理新工具的網址。但那時候檔案還沒上去，回的是 404，
  **Cloudflare 會把那個 404 存進快取**，部署完成之後照樣繼續回 404，
  只有帶查詢字串（`?v=1`）才看得到正常內容。
  同樣的道理適用於「檢查某個檔案存不存在」——問一次不存在的網址，
  那個 404 就被記下來了，之後檔案真的做出來也還是回 404。
  （實際發生過兩次：新工具頁 plug.html、以及 llms.txt。）

  **正確做法**：一律在網址後面加隨機參數，例如 `?cb=12345`，
  這樣 Cloudflare 會當成不同的請求，不會污染乾淨網址的快取。
  要確認部署狀態則看 Cloudflare Pages 後台的 Deployments。
  已經踩到的話，去 Cloudflare 後台清除該網址的快取。

- **不要用自動化請求狂打線上站。** 在本機跑的 curl、Playwright 測試都是從
  這台電腦的 IP 出去的，對 `tools.luka-life.com` 發大量請求等於用自己家的 IP
  打自己的網站。實際做過：輪詢部署狀態、對 `/api/hit` 連續 POST
  （而且每次換一個偽造的 User-Agent）——同 IP 重複 POST 加上 UA 不斷變化，
  是標準的機器人特徵。那些 POST 確實汙染了統計數據。

  測試一律打本機檔案（用 Playwright 的 route 把網域導到 `public/`），
  確認部署看 Pages 後台的 Deployments，線上驗證壓到一兩次請求就好。

- **Cloudflare 的機器人設定（安全性 → Bots）。** 正確狀態：

  | 項目 | 應該設成 | 原因 |
  |---|---|---|
  | Bot Fight 模式 | **關** | 靜態站沒有登入沒有表單，計數器自己有機器人過濾，保護價值很低。（註：它不是 2026-10-02 那次 403 的原因，關掉之後 403 照樣出現） |
  | AI 機器人政策 → 搜尋／代理／訓練 | **全部「允許」** | 2025-07-01 之後開的 zone 預設會擋 AI 爬蟲，而且擋在讀 robots.txt 之前。擋掉的話 `llms.txt` 跟整個 GEO 的工作都到不了 GPTBot / ClaudeBot / PerplexityBot |
  | AI 迷宮 | **關** | 餵 AI 生成的假內容給爬蟲，對想被 AI 引用的站是反效果 |
  | Bot Preference Sync | **關** | 會自動在 `robots.txt` 前面插入 Cloudflare 的設定，跟我們自己維護的 `robots.txt` 打架 |
  | Cloudflare 受控規則集 | **開** | 這是擋真正攻擊的 WAF，跟機器人防護是兩回事 |

- **免費方案的「安全性事件」是抽樣的，查不到不等於沒發生。**
  那一頁的標題就寫著「取樣的記錄」。2026-10-02 查 403 時，用 IP 篩、
  用「動作＝封鎖＋台灣」篩、用 Ray ID 篩，三次都查無事件，
  一度據此判定 Cloudflare 沒有擋過——**這個推論是錯的**。

  真正可靠的證據在瀏覽器的 Network 面板，看回應標頭：

  | 標頭 | 代表 |
  |---|---|
  | 有 `Cf-Ray` | Cloudflare 在邊緣回的，請求沒進到 Pages |
  | `Cache-Control: ... post-check=0, pre-check=0` ＋ `Expires: Thu, 01 Jan 1970` | Cloudflare 封鎖頁的標準簽名 |
  | `Referrer-Policy: same-origin` | 不是我們的（我們在 `_headers` 設的是 `strict-origin-when-cross-origin`） |

  **`Cf-Ray` 結尾的三個字母是機房代碼**，可以反推請求從哪裡出去的。
  在台灣用中華電信正常會命中 `TPE` 或 `HKG`；出現 `SJC`（聖荷西）
  就表示流量繞到美國出口了，多半是瀏覽器裝了 VPN／Proxy 擴充功能。
  這也解釋了為什麼用「台灣」篩選永遠查不到——來源根本不是台灣。

  **要判斷流量從哪裡出去，開 `https://www.cloudflare.com/cdn-cgi/trace`**，
  看 `ip` / `colo` / `loc` 三行。這是 Cloudflare 官網的診斷端點，
  不會碰到自己的站，也不會污染快取。懷疑哪個瀏覽器有問題就用哪個開，
  跟正常的瀏覽器對照。

  2026-10-02 那次整站間歇性 403 的真正原因：Chrome 裝了三個 VPN／
  Proxy 類擴充功能（Browsec VPN、ZenMate VPN、WebChatGPT），
  流量被導到美國出口。免費 VPN 的出口 IP 是幾萬人共用的，
  Cloudflare 對這種 IP 的信任分數極低，直接在邊緣擋成 403。
  移除三個擴充功能後 `colo` 從 `SJC` 回到 `HKG`、`loc` 回到 `TW`。

  **排查順序的教訓**：這題花了很久，因為前三個假設都從伺服器端猜
  （以為是自己打太兇、以為是 Bot Fight Mode、以為是 WAF 規則）。
  實際上「Firefox 正常、無痕正常、curl 回 200、只有一般 Chrome 不行」
  這組事實一開始就指向瀏覽器設定檔，應該先做 trace 對照，再談伺服器。

- **臺灣銀行牌告匯率抓不到。** `rate.bot.com.tw` 有機器人驗證，
  網頁跟 CSV 端點都會回一頁 proof-of-work 挑戰。所以改用 `open.er-api.com`
  的國際參考價，頁面上有標示這不是銀行牌告價。

- **不要偽造資料。** 發票中獎號碼、郵遞區號、電價級距這類東西，
  查不到就不要生一個像樣的數字出來——使用者會照著它去做決定。
  查得到但會變動的（稅率、行李上限），就做成可以自己改的欄位並標示清楚。

- **Google Drive 裡不能放 Git repo。** 同步程式會把 `.git` 弄壞。

---

最後更新：2026-10-02（記錄 Cloudflare 機器人設定的正確狀態）
