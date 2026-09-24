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

export async function onRequestGet({ env }) {
  if (!env.DB) return json(EMPTY);

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
