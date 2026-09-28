# 文章置入工具對照表

> 由 `build-tool-index.mjs` 從 `catalog.js` 自動產生，**請勿手動編輯**。
> 工具有增減時重跑 `node build-tool-index.mjs`。
> 產生時間：2026-09-28（台北）
> 目前站上共 87 個工具，其中 13 個適合在文章裡置入。

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
| 出國 | [護照效期檢查](https://tools.luka-life.com/t/passport.html) | 文章談到行前準備、第一次出國、辦簽證 | 行前準備段落 | 護照效期不足六個月會在報到櫃檯就被擋下來，出發前先確認一次比較保險 |
| 出國 | [各國插頭電壓查詢](https://tools.luka-life.com/t/plug.html) | 文章談到行李、充電、住宿設備 | 行李或住宿段落 | 各國的插座形狀與電壓都不一樣，帶錯轉接頭當場很麻煩 |
| 出國 | [行李重量尺寸檢查](https://tools.luka-life.com/t/luggage.html) | 文章談到行李、廉航、託運規定 | 交通或行李段落 | 廉航的行李尺寸抓得很嚴，出發前先量過比在櫃檯補錢划算 |
| 國內外皆可 | [行李打包清單](https://tools.luka-life.com/t/packing.html) | 文章談到行李打包、露營、親子出遊要帶什麼 | 行前準備段落 | 最常忘的從來不是衣服，是充電線跟藥品 |
| 出國 | [出國退稅計算器](https://tools.luka-life.com/t/tax-refund.html) | 文章談到購物、藥妝、免稅店 | 購物段落 | 退稅扣掉手續費之後實拿通常少一截，金額不大的話未必值得排隊 |
| 出國 | [匯率換算](https://tools.luka-life.com/t/exchange.html) | 文章出現當地價格、談到換匯 | 第一次出現當地幣別價格的地方 | 換算成台幣心裡比較有底 |
| 出國 | [世界時區換算](https://tools.luka-life.com/t/timezone.html) | 文章談到時差、跨時區班機、訂房入住時間 | 交通或行程段落 | 時差算錯很容易把接機或訂房時間搞混 |
| 出國 | [航班時間轉機計算](https://tools.luka-life.com/t/flight.html) | 文章談到轉機、紅眼班機、長途航班 | 交通段落 | 轉機時間夠不夠，算過才知道 |
| 國內外皆可 | [旅遊天氣穿搭建議](https://tools.luka-life.com/t/weather.html) | 文章談到季節、氣溫、該穿什麼 | 季節或穿搭段落 | 出發前一週再看一次預報，溫差大的地方尤其要 |
| 國內 | [油錢與里程計算](https://tools.luka-life.com/t/fuel.html) | 文章是自駕遊記、提到開車前往、停車 | 交通方式段落 | 自己開車的話可以先估一下油錢 |
| 國內外皆可 | [分帳計算機](https://tools.luka-life.com/t/split.html) | 文章提到多人同行、團體訂房、分攤費用 | 費用或行程段落 | 多人同行最後結帳最容易算不清楚 |
| 國內外皆可 | [照片 EXIF 檢視與移除](https://tools.luka-life.com/t/exif.html) | 文章大量使用實拍照片，尤其是住家、民宿、親子照 | 文末或拍照相關段落 | 手機拍的照片會記錄拍攝地點，要發到公開的地方前建議先清掉 |
| 國內外皆可 | [社群圖片尺寸裁切](https://tools.luka-life.com/t/social-crop.html) | 文章談到拍照打卡、發社群 | 拍照段落 | 同一張照片發不同平台，尺寸不對會被裁掉重點 |

## 連結寫法

單行 HTML，照旅咖的排版規則：

```html
<p>前面自然的句子，<a href="https://tools.luka-life.com/t/SLUG.html" target="_blank" rel="noopener">工具名稱</a>，後面接著講下去</p>
```

## 尚未歸類的工具（74 個）

這些目前不在置入清單裡。多數是與旅遊無關的工具，不必處理；
如果其中有適合放進文章的，到 `build-tool-index.mjs` 的 CONTEXTS 加一筆再重跑。

- 幸運輪盤（random／`wheel`）
- 線上擲骰子（random／`dice`）
- 擲硬幣（random／`coin`）
- 隨機數字產生器（random／`number`）
- 隨機分組（random／`group`）
- 隨機抽籤點名（random／`picker`）
- 猜拳（random／`rps`）
- FB 留言抽獎（random／`fb-draw`）
- 倒數計時器（time／`countdown`）
- 番茄鐘（time／`pomodoro`）
- 線上碼錶（time／`stopwatch`）
- 線上時鐘（time／`clock`）
- 日期天數計算（time／`date-diff`）
- 年齡計算器（time／`age`）
- 文字比對（text／`diff`）
- 字數統計（text／`count`）
- 大小寫轉換（text／`case`）
- 重複行移除（text／`dedupe`）
- 文字排序（text／`sort`）
- 批次取代（text／`replace`）
- 酷炫字體產生器（text／`fancy`）
- 繁簡轉換（text／`zh-convert`）
- 特殊符號大全（symbol／`symbols`）
- Emoji 表情符號（symbol／`emoji`）
- 顏文字（symbol／`kaomoji`）
- Base64 編碼解碼（dev／`base64`）
- URL 編碼解碼（dev／`urlencode`）
- JSON 格式化（dev／`json`）
- 雜湊值產生器（dev／`hash`）
- QR Code 產生器（dev／`qrcode`）
- UUID 產生器（dev／`uuid`）
- 密碼產生器（dev／`password`）
- 色碼轉換器（dev／`color`）
- Unix 時間戳轉換（dev／`timestamp`）
- 單位換算（calc／`unit`）
- BMI 計算器（calc／`bmi`）
- 百分比計算（calc／`percent`）
- 進位轉換（calc／`radix`）
- 圖片壓縮（image／`image-compress`）
- 圖片尺寸調整（image／`image-resize`）
- 圖片格式轉換（image／`image-convert`）
- PDF 合併（pdf／`pdf-merge`）
- PDF 分割取頁（pdf／`pdf-split`）
- PDF 旋轉與刪頁（pdf／`pdf-organize`）
- 圖片轉 PDF（pdf／`img-to-pdf`）
- IG 空白字元產生器（social／`ig-space`）
- 社群貼文字數計算（social／`social-count`）
- Hashtag 整理器（social／`hashtag`）
- YouTube 縮圖擷取（social／`yt-thumbnail`）
- 分隔線裝飾產生器（social／`divider`）
- 九宮格切圖（social／`grid-split`）
- 圖片轉正方形（social／`square-fit`）
- 圖片浮水印（social／`watermark`）
- 多圖拼貼（social／`collage`）
- 封面安全區預覽（social／`cover-safe`）
- 房貸試算（tw／`mortgage`）
- 薪資實領計算（tw／`salary`）
- 綜合所得稅試算（tw／`income-tax`）
- 統一發票對獎（tw／`invoice`）
- 特休天數計算（tw／`annual-leave`）
- 加班費計算（tw／`overtime`）
- 資遣費計算（tw／`severance`）
- 鍵盤按鍵測試（device／`keyboard-test`）
- 麥克風與鏡頭測試（device／`av-test`）
- 螢幕壞點檢測（device／`screen-test`）
- 打字速度測試（device／`typing`）
- 電費計算（tw／`electricity`）
- 股票手續費計算（tw／`stock-fee`）
- 統一編號驗證（tw／`tax-id`）
- 牌照稅燃料費試算（tw／`car-tax`）
- 二代健保補充保費（tw／`nhi-supplement`）
- 複利與定存試算（calc／`compound`）
- TDEE 基礎代謝計算（calc／`tdee`）
- 折扣比價計算機（calc／`discount`）
