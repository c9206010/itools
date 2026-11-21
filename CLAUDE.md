# 順手工具箱（tools.luka-life.com）— 給 AI 助手的專案說明

**所有回覆、進度說明、commit 訊息一律使用繁體中文（台灣用語）。**

- 動手前先讀 `MAINTENANCE.md`（維護手冊：標準修改流程、各種情境、踩過的坑），再看 `README.md`
- 只有 `public/` 會上線；**推上 GitHub 的 `main` 就會自動部署**（Cloudflare Pages，約一兩分鐘），所以推送＝部署

## 必守規則
- 改完一定跑 `node build-seo.mjs`（SEO、sitemap、共用檔案的版本號；沒有版本號使用者會一直載到舊檔）
- `<!-- SEO:START -->`～`<!-- SEO:END -->` 之間、還有標明「自動產生」的檔案不要手改，會被下次建置洗掉
- 推上去之後**不要去打還不存在的網址**（新工具還沒部署好就打會回 404，Cloudflare 會把 404 快取住）
- Google 雲端硬碟裡那份只是備份，不要在那邊改
- 整個專案沒有任何金鑰或密碼（repo 可以公開），不要加進來
- GitHub 流程會自動提交（統一發票中獎號碼），提交前先 `git pull`
- repo 裡沒有測試；改了工具頁就寫一組 jsdom 測試檢查（見 `MAINTENANCE.md`「測試」）
