/* ==========================================================================
   GET /api/stats — 回傳首頁要顯示的數字
   --------------------------------------------------------------------------
   回傳格式：
     { online, total, today, week, month, ok }

   ok 為 false 代表拿不到資料（還沒建表、資料庫不通等），
   前端看到就把整塊數據收起來，不要顯示 0 誤導人。

   邊緣快取 30 秒。線上人數的即時性用不著到秒，
   但這可以把資料庫查詢的次數壓下來很多。
   ========================================================================== */

import { taipeiDay, dayBefore, json, ONLINE_WINDOW } from './_shared.js';

const EMPTY = { ok: false, online: 0, total: 0, today: 0, week: 0, month: 0 };
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,39}$/;

export async function onRequestGet({ request, env }) {
  if (!env.DB) return json(EMPTY);

  const params = new URL(request.url).searchParams;

  /* 帶 ?top=N 回傳使用次數最高的 N 個工具。
     首頁的熱門排行與後台統計頁都用這個。 */
  const top = params.get('top');
  if (top !== null) {
    const n = Math.min(200, Math.max(1, parseInt(top, 10) || 10));
    try {
      const res = await env.DB
        .prepare('SELECT slug, views FROM pages WHERE views > 0 ORDER BY views DESC, slug ASC LIMIT ?')
        .bind(n).all();
      const tools = res.results || [];
      const sum = tools.reduce((s, t) => s + t.views, 0);
      return json({ ok: true, tools, sum }, 120);
    } catch (err) {
      console.error('排行查詢失敗:', err.message);
      return json({ ok: false, tools: [], sum: 0 });
    }
  }

  /* 帶 ?t=<slug> 就只回那個工具的次數，工具頁用這個，
     比每次把 87 個工具的數字全部送過去省得多。 */
  const slug = params.get('t');
  if (slug) {
    if (!SLUG_RE.test(slug)) return json({ ok: false, views: 0 });
    try {
      const row = await env.DB.prepare('SELECT views FROM pages WHERE slug = ?')
        .bind(slug).first();
      return json({ ok: true, slug, views: row ? row.views : 0 }, 120);
    } catch (err) {
      console.error('單一工具次數查詢失敗:', err.message);
      return json({ ok: false, views: 0 });
    }
  }

  try {
    const now = Math.floor(Date.now() / 1000);
    const today = taipeiDay();

    /* 一次送出四個查詢，比分開來回快 */
    const [online, total, daily] = await env.DB.batch([
      env.DB.prepare('SELECT COUNT(*) AS n FROM recent WHERE ts > ?')
        .bind(now - ONLINE_WINDOW),
      env.DB.prepare("SELECT v AS n FROM totals WHERE k = 'views'"),
      env.DB.prepare('SELECT day, views FROM daily WHERE day >= ?')
        .bind(dayBefore(29))
    ]);

    const rows = daily.results || [];
    const sinceWeek = dayBefore(6);      // 含今天共七天
    const sum = from => rows
      .filter(r => r.day >= from)
      .reduce((s, r) => s + r.views, 0);

    return json({
      ok: true,
      online: online.results?.[0]?.n ?? 0,
      total: total.results?.[0]?.n ?? 0,
      today: rows.find(r => r.day === today)?.views ?? 0,
      week: sum(sinceWeek),
      month: sum(dayBefore(29))
    }, 30);
  } catch (err) {
    console.error('stats 查詢失敗:', err.message);
    return json(EMPTY);
  }
}
