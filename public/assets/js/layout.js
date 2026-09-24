/* ==========================================================================
   順手工具箱 — 共用框架
   負責：注入頁首/頁尾、站內搜尋、深淺色切換、複製提示、相關工具
   每頁只要引入 catalog.js + layout.js 即可，不必重複寫版型。
   ========================================================================== */

(function () {
  'use strict';

  /* 依頁面深度決定相對路徑：/index.html 為 ''，/t/xxx.html 為 '../' */
  const ROOT = document.body.dataset.root || '';
  const CURRENT = document.body.dataset.tool || '';

  /* ---------- 小工具函式（全站共用） ---------- */
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));
  const esc = s => String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- 深淺色 ---------- */
  const THEME_KEY = 'sst-theme';
  function readTheme() {
    try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
  }
  function applyTheme(mode) {
    if (mode === 'light' || mode === 'dark') {
      document.documentElement.setAttribute('data-theme', mode);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }
  function currentTheme() {
    const saved = readTheme();
    if (saved) return saved;
    return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  applyTheme(readTheme());

  /* ---------- 頁首 ---------- */
  function buildHeader() {
    /* 導覽列不放圖示：分類一多，圖示佔掉的寬度會讓最後幾個被擠出可視範圍。
       圖示保留在首頁的分類標題與工具卡片上，那裡才真的幫助辨識。 */
    const catLinks = CATEGORIES.map(c =>
      `<a href="${ROOT}index.html#${c.id}">${esc(c.name)}</a>`
    ).join('');

    return `
<a class="skip-link" href="#main">跳到主要內容</a>
<header class="site-header">
  <div class="wrap site-header__bar">
    <a class="brand" href="${ROOT}index.html">
      <span class="brand__mark">${SITE.mark}</span>
      <span>${esc(SITE.name)}</span>
    </a>
    <div class="hsearch">
      <span class="hsearch__icon" aria-hidden="true">🔍</span>
      <input type="search" id="siteSearch" placeholder="搜尋工具…（按 / 快速聚焦）"
             autocomplete="off" role="combobox" aria-expanded="false"
             aria-controls="searchResults" aria-label="搜尋工具">
      <div class="hsearch__results hidden" id="searchResults" role="listbox"></div>
    </div>
    <button class="theme-toggle" id="themeToggle" type="button"
            aria-label="切換深色或淺色模式" title="切換深淺色">🌓</button>
  </div>
  <nav class="catnav" aria-label="工具分類">
    <div class="wrap catnav__inner">
      <a href="${ROOT}index.html">全部</a>${catLinks}
    </div>
  </nav>
</header>`;
  }

  /* ---------- 頁尾 ---------- */
  function buildFooter() {
    const cols = CATEGORIES.map(c => {
      const items = byCat(c.id).slice(0, 6).map(t =>
        `<li><a href="${ROOT}t/${t.slug}.html">${esc(t.name)}</a></li>`
      ).join('');
      return `<div><h4>${c.icon} ${esc(c.name)}</h4><ul>${items}</ul></div>`;
    }).join('');

    return `
<footer class="site-footer">
  <div class="wrap">
    <div class="site-footer__cols">${cols}</div>
    <div class="site-footer__base">
      <span>© ${new Date().getFullYear()} ${esc(SITE.name)}．${esc(SITE.tagline)}</span>
      <span>所有運算都在你的瀏覽器完成，不會上傳任何資料</span>
      <span><a href="${ROOT}privacy.html">隱私權政策</a></span>
    </div>
  </div>
</footer>`;
  }

  /* ---------- 站內搜尋 ---------- */
  function initSearch() {
    const input = $('#siteSearch');
    const box = $('#searchResults');
    if (!input || !box) return;
    let idx = -1;

    function score(tool, q) {
      const name = tool.name.toLowerCase();
      const kw = (tool.kw + ' ' + tool.desc + ' ' + tool.slug).toLowerCase();
      if (name === q) return 100;
      if (name.startsWith(q)) return 80;
      if (name.includes(q)) return 60;
      if (kw.includes(q)) return 30;
      return 0;
    }

    function render(list) {
      idx = -1;
      if (!list.length) {
        box.innerHTML = '<div class="empty">找不到符合的工具，換個關鍵字試試</div>';
      } else {
        box.innerHTML = list.map(t =>
          `<a href="${ROOT}t/${t.slug}.html" role="option">${t.icon} ${esc(t.name)}
             <span class="muted">${esc(t.desc)}</span></a>`
        ).join('');
      }
      box.classList.remove('hidden');
      input.setAttribute('aria-expanded', 'true');
    }

    function close() {
      box.classList.add('hidden');
      input.setAttribute('aria-expanded', 'false');
      idx = -1;
    }

    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      if (!q) return close();
      const hits = TOOLS.map(t => ({ t, s: score(t, q) }))
        .filter(x => x.s > 0)
        .sort((a, b) => b.s - a.s)
        .slice(0, 9)
        .map(x => x.t);
      render(hits);
    });

    input.addEventListener('keydown', e => {
      const links = $$('a', box);
      if (e.key === 'Escape') { close(); input.blur(); return; }
      if (!links.length) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        idx = e.key === 'ArrowDown'
          ? (idx + 1) % links.length
          : (idx - 1 + links.length) % links.length;
        links.forEach((a, i) => a.classList.toggle('is-active', i === idx));
        links[idx].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter' && idx >= 0) {
        e.preventDefault();
        links[idx].click();
      }
    });

    document.addEventListener('click', e => {
      if (!e.target.closest('.hsearch')) close();
    });

    /* 按 / 快速聚焦搜尋 */
    document.addEventListener('keydown', e => {
      const tag = (e.target.tagName || '').toLowerCase();
      if (e.key === '/' && tag !== 'input' && tag !== 'textarea' && !e.target.isContentEditable) {
        e.preventDefault();
        input.focus();
        input.select();
      }
    });
  }

  /* ---------- 相關工具（工具頁自動生成） ---------- */
  function initRelated() {
    const host = $('#relatedTools');
    if (!host || !CURRENT) return;
    const me = getTool(CURRENT);
    if (!me) return;

    let pool = byCat(me.cat).filter(t => t.slug !== CURRENT);
    if (pool.length < 4) {
      pool = pool.concat(TOOLS.filter(t => t.cat !== me.cat && t.slug !== CURRENT).slice(0, 4 - pool.length));
    }
    const cards = pool.slice(0, 4).map(t => `
      <a class="card" href="${ROOT}t/${t.slug}.html">
        <span class="card__top"><span class="card__icon">${t.icon}</span>
        <span class="card__title">${esc(t.name)}</span></span>
        <span class="card__desc">${esc(t.desc)}</span>
      </a>`).join('');

    host.innerHTML = `<h2>相關工具</h2><div class="grid">${cards}</div>`;
  }

  /* ---------- 麵包屑（工具頁自動生成） ---------- */
  function initCrumb() {
    const host = $('#crumb');
    if (!host || !CURRENT) return;
    const me = getTool(CURRENT);
    if (!me) return;
    const c = getCat(me.cat);
    host.innerHTML =
      `<a href="${ROOT}index.html">首頁</a><span>›</span>` +
      `<a href="${ROOT}index.html#${c.id}">${esc(c.name)}</a><span>›</span>` +
      esc(me.name);
  }

  /* ---------- 廣告版位 ----------
     一個工具頁只放一個，插在工具面板與說明內文之間。
     沒設定或未啟用時完全不執行，連 AdSense 的腳本都不會載入。 */
  function initAd() {
    const cfg = SITE.adsense;
    if (!cfg || !cfg.enabled || !cfg.client || !cfg.slot) return;
    if (!CURRENT) return;                    // 首頁不放

    const prose = $('.prose');
    if (!prose || !prose.parentNode) return;

    const wrap = document.createElement('aside');
    wrap.className = 'ad-slot';
    wrap.setAttribute('aria-label', '贊助內容');
    wrap.innerHTML =
      '<span class="ad-slot__label">贊助內容</span>' +
      `<ins class="adsbygoogle" style="display:block"
            data-ad-client="${esc(cfg.client)}"
            data-ad-slot="${esc(cfg.slot)}"
            data-ad-format="auto"
            data-full-width-responsive="true"></ins>`;

    prose.parentNode.insertBefore(wrap, prose);

    /* AdSense 主程式，整頁只載一次 */
    if (!document.querySelector('script[data-adsense]')) {
      const s = document.createElement('script');
      s.async = true;
      s.crossOrigin = 'anonymous';
      s.dataset.adsense = '1';
      s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client='
        + encodeURIComponent(cfg.client);
      document.head.appendChild(s);
    }

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      /* 被廣告攔截器擋掉是常態，把版位收起來就好，不要留一塊空白 */
      wrap.remove();
    }
  }

  /* ---------- 複製與提示 ---------- */
  let toastEl, toastTimer;
  window.toast = function (msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      toastEl.setAttribute('role', 'status');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    // 強制重排讓動畫每次都跑
    void toastEl.offsetWidth;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), 1600);
  };

  window.copyText = function (text, okMsg) {
    const done = () => window.toast(okMsg || '已複製到剪貼簿');
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done).catch(fallback);
    } else {
      fallback();
    }
    function fallback() {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;left:-9999px;top:0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); }
      catch (e) { window.toast('複製失敗，請手動選取'); }
      ta.remove();
    }
  };

  /* 任何帶 data-copy 的元素點了就複製自己的文字 */
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-copy]');
    if (!el) return;
    const val = el.dataset.copy || el.textContent.trim();
    window.copyText(val, '已複製 ' + (val.length > 12 ? val.slice(0, 12) + '…' : val));
  });

  /* ---------- 常用數值工具（給各工具頁用） ---------- */
  window.U = {
    $, $$, esc,
    /* 密碼學等級亂數，避免 Math.random 在抽獎場景的偏差疑慮 */
    randInt(min, max) {
      const range = max - min + 1;
      if (range <= 0) return min;
      if (window.crypto && crypto.getRandomValues) {
        const limit = Math.floor(0xFFFFFFFF / range) * range;
        const buf = new Uint32Array(1);
        let v;
        do { crypto.getRandomValues(buf); v = buf[0]; } while (v >= limit);
        return min + (v % range);
      }
      return min + Math.floor(Math.random() * range);
    },
    pick(arr) { return arr[window.U.randInt(0, arr.length - 1)]; },
    shuffle(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = window.U.randInt(0, i);
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
    /* 把 textarea 名單拆成陣列（支援換行與逗號） */
    lines(text, { trim = true, dropEmpty = true } = {}) {
      let arr = String(text).split(/\r?\n|,|、/);
      if (trim) arr = arr.map(s => s.trim());
      if (dropEmpty) arr = arr.filter(s => s !== '');
      return arr;
    },
    pad(n, len = 2) { return String(n).padStart(len, '0'); },
    /* 毫秒轉 時:分:秒.毫秒 */
    fmtMs(ms, showMs = false) {
      const neg = ms < 0;
      ms = Math.abs(ms);
      const h = Math.floor(ms / 3600000);
      const m = Math.floor(ms / 60000) % 60;
      const s = Math.floor(ms / 1000) % 60;
      const cs = Math.floor(ms / 10) % 100;
      const core = (h > 0 ? window.U.pad(h) + ':' : '') +
        window.U.pad(m) + ':' + window.U.pad(s) +
        (showMs ? '.' + window.U.pad(cs) : '');
      return (neg ? '-' : '') + core;
    },
    bytes(n) {
      if (n < 1024) return n + ' B';
      if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';
      return (n / 1048576).toFixed(2) + ' MB';
    },
    /* 讓使用者下載 Blob */
    download(blob, filename) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  };

  /* ---------- 啟動 ---------- */
  function boot() {
    const h = document.createElement('div');
    h.innerHTML = buildHeader();
    document.body.insertBefore(h, document.body.firstChild);

    const f = document.createElement('div');
    f.innerHTML = buildFooter();
    document.body.appendChild(f);

    $('#themeToggle').addEventListener('click', () => {
      const next = currentTheme() === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* 無痕模式忽略 */ }
    });

    initSearch();
    initCrumb();
    initRelated();
    initAd();

    /* canonical、OG 與結構化資料改由 build-seo.mjs 靜態寫進 HTML，
       這裡不再動態插入，避免正式網域設定後出現兩組 canonical。 */
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
