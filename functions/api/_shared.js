/* ==========================================================================
   /api 共用的小工具
   底線開頭的檔案不會被 Pages Functions 當成路由，只能被其他函式 import。
   ========================================================================== */

/* 線上人數的認定範圍，以及 recent 表要保留多久的足跡 */
export const ONLINE_WINDOW = 5 * 60;
export const KEEP_WINDOW = 15 * 60;

/** 台北時間的日期字串 YYYY-MM-DD。
 *  統計是給台灣人看的，「今日」要以台北時間換日，不能用 UTC。 */
export function taipeiDay(ms = Date.now()) {
  return new Date(ms + 8 * 3600 * 1000).toISOString().slice(0, 10);
}

/** 往前推 n 天的台北日期字串 */
export const dayBefore = (n, ms = Date.now()) =>
  taipeiDay(ms - n * 86400 * 1000);

/** 產生訪客識別碼。
 *
 *  拿 IP、User-Agent 與「當天日期」一起做 SHA-256，只留前 16 個字元。
 *  這樣做有三個用意：
 *    1. 雜湊不可逆，資料庫裡永遠不會出現真正的 IP
 *    2. 摻入日期當鹽，同一個人隔天就是不同的識別碼，無法長期追蹤
 *    3. 仍足以在五分鐘內區分「線上人數」要不要重複計算
 */
export async function visitorId(request) {
  const ip = request.headers.get('CF-Connecting-IP') || '0.0.0.0';
  const ua = request.headers.get('User-Agent') || '';
  const raw = `${ip}|${ua}|${taipeiDay()}`;
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  return [...new Uint8Array(buf)].slice(0, 8)
    .map(b => b.toString(16).padStart(2, '0')).join('');
}

/* 常見爬蟲與監測服務。擋不完，但可以濾掉絕大多數的雜訊，
   免得首頁的數字被 Googlebot 之類的灌水。 */
const BOT_RE = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|quora link preview|pinterest|vkshare|whatsapp|telegram|discordbot|slackbot|semrush|ahrefs|mj12|dotbot|petalbot|headless|lighthouse|pagespeed|gtmetrix|uptime|pingdom|curl|wget|python-requests|axios|go-http-client|okhttp|java\//i;

export const isBot = request =>
  BOT_RE.test(request.headers.get('User-Agent') || '');

export const json = (data, seconds = 0) => new Response(JSON.stringify(data), {
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': seconds
      ? `public, max-age=${seconds}`
      : 'no-store'
  }
});
