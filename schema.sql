-- ===========================================================================
-- 順手工具箱 — 瀏覽統計資料庫（Cloudflare D1）
--
-- 建立方式見 MAINTENANCE.md 的「首頁瀏覽統計」那一節：
--     npx wrangler d1 execute luka-tools-stats --remote --file=schema.sql
--
-- 這裡刻意不存每一次瀏覽的明細，只存彙總數字，
-- 所以資料庫的大小幾乎不會隨時間成長，也不留下可以回推個人的紀錄。
-- ===========================================================================

-- 累計總數。目前只有一列：k = 'views'
CREATE TABLE IF NOT EXISTS totals (
  k TEXT PRIMARY KEY,
  v INTEGER NOT NULL DEFAULT 0
);

-- 每天一列，day 是台北時間的 YYYY-MM-DD
CREATE TABLE IF NOT EXISTS daily (
  day   TEXT PRIMARY KEY,
  views INTEGER NOT NULL DEFAULT 0
);

-- 近期訪客足跡，只用來算線上人數。
-- visitor 是 IP＋UA＋當天日期的 SHA-256 前 16 字元，不可逆，隔天就會換一組。
CREATE TABLE IF NOT EXISTS recent (
  visitor TEXT PRIMARY KEY,
  ts      INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_recent_ts ON recent(ts);

-- 每個工具一列，用來在工具頁顯示「已經被使用幾次」。
-- slug 對應 catalog.js 的工具代號，寫入前會驗證格式，不會被塞進奇怪的值。
-- 只有累計次數，不存誰在什麼時候看了哪一頁。
CREATE TABLE IF NOT EXISTS pages (
  slug  TEXT PRIMARY KEY,
  views INTEGER NOT NULL DEFAULT 0
);

INSERT OR IGNORE INTO totals (k, v) VALUES ('views', 0);
