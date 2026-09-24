/* ==========================================================================
   POST /api/hit — 記錄一次瀏覽
   --------------------------------------------------------------------------
   由 layout.js 在每個頁面載入時呼叫，不回傳任何內容。
   統計失敗絕對不能影響使用者，所以這支一律回 204，錯誤只記在 log 裡。
   只匯出 onRequestPost，所以用瀏覽器直接開這個網址會拿到 404。

   資料庫只存三張很小的表（見 schema.sql）：
     totals  累計總數，一列
     daily   每天一列
     recent  近期訪客足跡，用來算線上人數，會自動清掉舊的

   不存瀏覽紀錄明細，所以資料庫不會隨時間長大。
   ========================================================================== */

import { taipeiDay, visitorId, isBot, KEEP_WINDOW } from './_shared.js';

const CLEAN_CHANCE = 0.02;   // 每次請求有 2% 機率順手清一次過期足跡

export async function onRequestPost({ request, env }) {
  const done = new Response(null, { status: 204 });

  /* 沒綁資料庫就安靜地什麼都不做，網站照常運作 */
  if (!env.DB) return done;

  /* 爬蟲不計入，否則首頁的數字會失真 */
  if (isBot(request)) return done;

  try {
    const now = Math.floor(Date.now() / 1000);
    const day = taipeiDay();
    const visitor = await visitorId(request);

    const writes = [
      env.DB.prepare(
        `INSERT INTO totals (k, v) VALUES ('views', 1)
         ON CONFLICT(k) DO UPDATE SET v = v + 1`
      ),
      env.DB.prepare(
        `INSERT INTO daily (day, views) VALUES (?, 1)
         ON CONFLICT(day) DO UPDATE SET views = views + 1`
      ).bind(day),
      /* 同一個訪客只會更新時間，不會新增列，所以這張表不會膨脹 */
      env.DB.prepare(
        `INSERT INTO recent (visitor, ts) VALUES (?1, ?2)
         ON CONFLICT(visitor) DO UPDATE SET ts = ?2`
      ).bind(visitor, now)
    ];

    /* 偶爾清一次過期足跡。每次都清太浪費寫入配額，
       反正查詢時本來就會用時間條件過濾，留著也不會算錯。 */
    if (Math.random() < CLEAN_CHANCE) {
      writes.push(
        env.DB.prepare('DELETE FROM recent WHERE ts < ?').bind(now - KEEP_WINDOW)
      );
    }

    await env.DB.batch(writes);
  } catch (err) {
    /* 表還沒建、配額用完、資料庫暫時不通——都不該讓使用者看到錯誤 */
    console.error('hit 記錄失敗:', err.message);
  }

  return done;
}
