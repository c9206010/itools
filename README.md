# 順手工具箱

58 種免費線上小工具的靜態網站。純 HTML / CSS / JavaScript，沒有框架、沒有建置流程、沒有後端，所有運算都在使用者的瀏覽器裡完成。

---

## 這是什麼

一個可以直接部署的工具站，分成 11 個類別：

| 類別 | 工具數 | 內容 |
|---|---|---|
| 隨機抽籤 | 7 | 輪盤、骰子、硬幣、隨機數字、分組、抽籤、猜拳 |
| 時間計時 | 7 | 倒數計時、番茄鐘、碼錶、時鐘、日期天數、年齡、時區 |
| 文字處理 | 7 | 文字比對、字數統計、大小寫、去重複、排序、批次取代、特殊字體 |
| 符號表情 | 3 | 特殊符號、Emoji、顏文字 |
| 開發編碼 | 8 | Base64、URL 編碼、JSON、雜湊、QR Code、UUID、密碼、色碼 |
| 計算換算 | 5 | 單位換算、BMI、百分比、分帳、進位轉換 |
| 圖片處理 | 3 | 壓縮、尺寸調整、格式轉換 |
| PDF 文件 | 4 | 合併、分割取頁、旋轉刪頁、圖片轉 PDF |
| 社群小幫手 | 6 | IG 空白字元、貼文字數、Hashtag、尺寸裁切、YT 縮圖、分隔線 |
| 台灣生活 | 5 | 房貸、薪資實領、所得稅、油錢、發票對獎 |
| 裝置檢測 | 3 | 鍵盤按鍵、麥克風與鏡頭、螢幕壞點 |

圖片與 PDF 工具用 Canvas 與 pdf-lib 在本機處理，**檔案不會上傳到任何伺服器**。

---

## 上線前一定要做的一件事

把網域設定進去，否則 canonical、og:url 與 sitemap 全部會指向 `example.com`：

```bash
node build-seo.mjs --origin=https://你的網域
```

這會一併更新 `assets/js/catalog.js` 裡的 `SITE.origin`，之後直接跑 `node build-seo.mjs` 就好。

---

## 目錄結構

```
tools-site/
├── index.html              首頁（分類卡片、搜尋、篩選）
├── t/                      40 個工具頁，一個工具一個檔
│   ├── wheel.html
│   └── …
├── assets/
│   ├── css/main.css        全站設計系統（含深色模式）
│   ├── js/catalog.js       工具總目錄 ← 新增工具改這裡
│   ├── js/layout.js        頁首頁尾、搜尋、複製、共用函式
│   └── og.svg              社群分享圖
├── build-seo.mjs           SEO 注入腳本（可重複執行）
├── sitemap.xml             自動產生
└── robots.txt              自動產生
```

---

## 本機預覽

不能直接用檔案總管雙擊開啟（`file://` 下部分功能會被瀏覽器擋住）。起一個本機伺服器：

```bash
cd tools-site
npx serve .
# 或 python -m http.server 8000
```

---

## 部署

### 檔案會放在哪裡

**不會放在你原本的網站主機上。** 流程是這樣：

```
你的電腦 tools-site/
        │ git push
        ▼
GitHub repo（免費）
        │ 自動部署
        ▼
Cloudflare Pages（免費）      ← 檔案實際存放的地方
        ▲ DNS CNAME
tools.你的網域.com
```

子網域只是一筆 DNS 記錄，指向 Cloudflare 的伺服器。**你原本的主機完全不會被用到**，不佔容量也不吃流量。

### 建議用子網域，不要用子目錄

| | 子網域 `tools.xxx.com` | 子目錄 `xxx.com/tools/` |
|---|---|---|
| 佔原主機空間 | 不佔 | 要把檔案放進去 |
| 跟 WordPress 衝突 | 不會 | 要改重寫規則繞開 WP 路由 |
| SEO | 相對獨立 | 工具的品質訊號直接算在主站頭上 |

如果主站是內容網站（部落格之類），子目錄有個實質風險：萬一工具頁被判定為低品質叢集，會連帶影響主站的文章。子網域多一層緩衝。

### 實際步驟

1. 把 `tools-site` 推到 GitHub（public 或 private 都可以）
2. Cloudflare Pages → Create project → 連結該 repo
   - 建置指令：**留空**
   - 輸出目錄：**`/`**
3. 部署完成會得到 `xxxx.pages.dev`，先用它確認站台正常
4. Pages → Custom domains → 加入 `tools.你的網域.com`，照指示在 DNS 加一筆 CNAME
5. 最後跑一次：`node build-seo.mjs --origin=https://tools.你的網域.com`，commit 推上去

**為什麼要走 GitHub**：發票自動更新的 Action 跑在 GitHub 上。直接拖資料夾上傳 Cloudflare 也能用，但那樣發票就要手動維護。

其他平台（Vercel、Netlify、GitHub Pages）同樣可行，設定大同小異。部署本身不需要 Node，Node 只在跑 `build-seo.mjs` 時用到。

---

## SEO 做了哪些

每一頁（含首頁）都有：

- 獨立且不重複的 `<title>` 與 `description`
- `canonical` 與 `robots`（含 `max-image-preview:large`）
- Open Graph 與 Twitter Card
- 語意化的 H1 / H2 / H3 結構，每頁都有原創說明內文
- JSON-LD 結構化資料：
  - 首頁 — `WebSite` + `CollectionPage`（含 40 筆 `ItemList`）
  - 工具頁 — `WebApplication` + `BreadcrumbList` + `FAQPage`
- 內部連結：麵包屑、同分類相關工具、頁尾全站連結
- `sitemap.xml` + `robots.txt`

`FAQPage` 的內容是腳本從每頁的 `<details>` 區塊自動抽出來的，所以**頁面上看到的問答跟結構化資料永遠一致**，不會出現 Google 判定的「內容不符」。

### 重新產生

改過任何頁面的標題、描述或 FAQ 之後，重跑一次：

```bash
node build-seo.mjs
```

注入的內容夾在 `<!-- SEO:START -->` 與 `<!-- SEO:END -->` 之間，重複執行會覆蓋舊的，不會越疊越多。**不要手動編輯這段區間內的東西**，會被下次執行洗掉。

### og.svg 的注意事項

分享圖是 SVG。Google 與多數平台沒問題，但 **Facebook 與 LINE 對 SVG 的支援不穩定**。如果很在意社群分享的縮圖，把 `assets/og.svg` 用任何工具轉成 1200×630 的 PNG 存成 `assets/og.png`，再把 `build-seo.mjs` 裡的這一行改掉：

```js
const OG_IMAGE = `${ORIGIN}/assets/og.png`;
```

然後重跑腳本。

---

## 新增一個工具

1. 在 `assets/js/catalog.js` 的 `TOOLS` 陣列加一筆：

```js
{ slug: 'my-tool', cat: 'text', icon: '🔧', name: '工具名稱',
  desc: '一句話說明', kw: '搜尋關鍵字 空格分隔' },
```

2. 複製一個現有的 `t/*.html` 當範本，改掉這幾個地方：
   - `<title>`、`<meta name="description">`、favicon 的 emoji
   - `<body data-tool="my-tool">` ← 要跟 slug 一致
   - `<h1>`、`.lede`、工具本體、說明內文與 FAQ

3. 跑 `node build-seo.mjs`

首頁卡片、搜尋、頁尾、麵包屑、相關工具全部會自動出現，不用手動加。

---

## 改成自己的品牌

改 `assets/js/catalog.js` 最上面的 `SITE`：

```js
const SITE = {
  name: '你的站名',
  tagline: '一句標語',
  desc: '…',
  mark: '🧰',        // 頁首的圖示
  origin: 'https://你的網域'
};
```

配色改 `assets/css/main.css` 開頭的 CSS 變數，`--brand` 與 `--accent` 兩個改掉就會換一整套色系（深色模式的對應值在下面的 `@media` 與 `[data-theme="dark"]` 區塊，記得一起改）。

---

## 需要你處理的兩件事

### 1. 統一發票中獎號碼（如果要用發票對獎工具）

`assets/data/invoice.json` 目前是**空的佔位檔**，所以那一頁會顯示「本期中獎號碼尚未載入」，不會顯示任何號碼。這是刻意的——對獎牽涉真實金錢，寧可沒有也不能給錯的數字。

接上自動更新的步驟：

1. 到[財政部電子發票整合服務平台](https://www.einvoice.nat.gov.tw/)申請 API 帳號，取得 AppID
2. 把這個專案推到 GitHub
3. Settings → Secrets and variables → Actions，新增 secret `EINVOICE_APP_ID`
4. 到 Actions 頁面手動觸發一次「更新發票中獎號碼」確認可以跑

之後 [.github/workflows/invoice.yml](.github/workflows/invoice.yml) 會在每期開獎後自動抓號碼、commit 回 repo，靜態網站重新部署就更新了。前端只讀自己網域的 JSON，**沒有跨網域限制，AppID 也不會出現在瀏覽器裡**。

抓取腳本 [.github/scripts/fetch-invoice.mjs](.github/scripts/fetch-invoice.mjs) 設計成寧可失敗也不寫錯：任何一組號碼格式不符就整支中止並保留舊資料。如果財政部調整了欄位名稱，改腳本裡的 `pick(...)` 對照即可。

### 2. 郵遞區號查詢（尚未製作）

原本規劃中有這個工具，但全台約 370 筆鄉鎮對照無法逐筆核實，錯誤的郵遞區號會直接造成信件寄丟，所以沒有做。如果需要，請到中華郵政下載官方的郵遞區號 CSV，就能據此建立資料檔補上。

---

## 相依套件

兩個，都是 MIT 授權、從 cdnjs 載入：

- [qrcodejs](https://github.com/davidshimjs/qrcodejs) — QR Code 產生器使用
- [pdf-lib](https://pdf-lib.js.org/) — 四個 PDF 工具使用

其餘 52 個工具都是原生 JavaScript，沒有任何外部相依。

---

## 瀏覽器需求

Chrome、Edge、Firefox、Safari 的近期版本。使用到的較新 API：

- `crypto.getRandomValues` — 所有隨機工具
- `crypto.subtle.digest` — 雜湊工具的 SHA 系列（**需要 HTTPS 或 localhost**）
- `Intl.Segmenter` — Emoji 正確切字（不支援時會退回較粗略的切法）
- Canvas `toBlob` — 圖片工具

---

## 授權與內容

本站的程式碼、版面與所有說明文字皆為原創。工具本身的功能（擲骰子、倒數計時、Base64 編碼等）是通用演算法與公開標準，不涉及任何第三方的著作權內容。Unicode 符號與 Emoji 屬於公開標準字元集。
