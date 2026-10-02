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

  /* 回首頁的連結要指向目錄本身（'/'），不要指向 'index.html'。
     Cloudflare Pages 會把 /index.html 用 308 轉到 /，而 canonical 與
     sitemap 都寫 /——連到 index.html 等於每一條內部連結都多跑一趟轉址，
     全站 91 頁、每頁好幾條，爬取預算就這樣耗掉了。
     用 './' 而不是 '/' 是為了保留相對路徑，本機直接開檔也能用。 */
  const HOME = ROOT || './';

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
      `<a href="${HOME}#${c.id}">${esc(c.name)}</a>`
    ).join('');

    return `
<a class="skip-link" href="#main">跳到主要內容</a>
<header class="site-header">
  <div class="wrap site-header__bar">
    <a class="brand" href="${HOME}">
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
      <a href="${HOME}">全部</a>${catLinks}
    </div>
  </nav>
</header>`;
  }

  /* ---------- 頁尾 ---------- */
  function buildFooter() {
    const cols = CATEGORIES.map(c => {
      const items = byCat(c.id).slice(0, 6).map(t =>
        `<li><a href="${ROOT}t/${t.slug}">${esc(t.name)}</a></li>`
      ).join('');
      return `<div><h4>${c.icon} ${esc(c.name)}</h4><ul>${items}</ul></div>`;
    }).join('');

    return `
<footer class="site-footer">
  <div class="wrap">
    <div class="site-footer__cols">${cols}</div>
    <div class="site-footer__base">
      <span>© ${new Date().getFullYear()} ${esc(SITE.name)}．${esc(SITE.tagline)}</span>
      <span>所有運算都在你的瀏覽器完成，輸入的內容不會上傳</span>
      <span><a href="${ROOT}privacy">隱私權政策</a></span>
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
          `<a href="${ROOT}t/${t.slug}" role="option">${t.icon} ${esc(t.name)}
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
    /* 建置時已經填好了就不用再畫，內容一樣 */
    if (host.children.length) return;
    const me = getTool(CURRENT);
    if (!me) return;

    let pool = byCat(me.cat).filter(t => t.slug !== CURRENT);
    if (pool.length < 4) {
      pool = pool.concat(TOOLS.filter(t => t.cat !== me.cat && t.slug !== CURRENT).slice(0, 4 - pool.length));
    }
    const cards = pool.slice(0, 4).map(t => `
      <a class="card" href="${ROOT}t/${t.slug}">
        <span class="card__top"><span class="card__icon">${t.icon}</span>
        <span class="card__title">${esc(t.name)}</span>
        ${favButton(t.slug, 'sm')}</span>
        <span class="card__desc">${esc(t.desc)}</span>
      </a>`).join('');

    host.innerHTML = `<h2>相關工具</h2><div class="grid">${cards}</div>`;
  }

  /* ---------- 麵包屑（工具頁自動生成） ---------- */
  function initCrumb() {
    const host = $('#crumb');
    if (!host || !CURRENT) return;
    if (host.textContent.trim()) return;   // 建置時已填好
    const me = getTool(CURRENT);
    if (!me) return;
    const c = getCat(me.cat);
    host.innerHTML =
      `<a href="${HOME}">首頁</a><span>›</span>` +
      `<a href="${HOME}#${c.id}">${esc(c.name)}</a><span>›</span>` +
      esc(me.name);
  }

  /* ---------- 工具頁標題旁的收藏星星 ---------- */
  function initFavOnTool() {
    if (!CURRENT || !getTool(CURRENT)) return;
    const h1 = $('.tool-head h1');
    if (!h1) return;
    const wrap = document.createElement('span');
    wrap.className = 'fav-wrap';
    wrap.innerHTML = favButton(CURRENT);
    h1.appendChild(wrap);
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

  /* ---------- 流量統計 ----------
     GA4。只有預設的瀏覽事件，沒有送出任何使用者在工具裡輸入的內容。
     沒設定或未啟用時完全不執行，連 gtag 的 script 都不會載入。 */
  function initAnalytics() {
    const cfg = SITE.analytics;
    if (!cfg || !cfg.enabled || !cfg.id) return;

    /* 尊重瀏覽器的「不要追蹤」設定。擋掉統計不影響任何工具的功能。 */
    const dnt = navigator.doNotTrack || window.doNotTrack;
    if (dnt === '1' || dnt === 'yes') return;

    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(cfg.id);
    document.head.appendChild(s);

    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', cfg.id);
  }

  /* ---------- 我的工具（收藏） ----------
     只存在使用者自己的瀏覽器裡，沒有帳號、不同步、我們也讀不到。
     無痕模式或封鎖網站資料時 localStorage 會拋錯，所以每次存取都要包起來，
     失敗就當作沒有收藏，其他功能照常運作。 */
  const FAV_KEY = 'sst-favs';

  function readFavs() {
    try {
      const raw = localStorage.getItem(FAV_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      /* 存壞掉或被手動改過就當成空的，不要讓爛資料炸掉整頁 */
      return Array.isArray(arr) ? arr.filter(s => typeof s === 'string') : [];
    } catch (e) {
      return [];
    }
  }

  function writeFavs(list) {
    try {
      localStorage.setItem(FAV_KEY, JSON.stringify(list));
      return true;
    } catch (e) {
      return false;   // 無痕模式或空間滿了
    }
  }

  window.Favs = {
    all: readFavs,
    has(slug) { return readFavs().includes(slug); },
    toggle(slug) {
      const list = readFavs();
      const i = list.indexOf(slug);
      if (i >= 0) list.splice(i, 1); else list.unshift(slug);
      const ok = writeFavs(list);
      if (!ok) {
        window.toast('瀏覽器不允許儲存，收藏功能無法使用');
        return null;
      }
      /* 讓首頁那類有多個星星的畫面可以一起更新 */
      document.dispatchEvent(new CustomEvent('favschange', { detail: { list } }));
      return i < 0;   // true 代表剛加入
    }
  };

  /** 產生一顆收藏星星。slug 必填，size 給 'sm' 會小一點 */
  function favButton(slug, size) {
    const on = window.Favs.has(slug);
    return `<button type="button" class="fav${size === 'sm' ? ' fav--sm' : ''}"
      data-fav="${esc(slug)}" aria-pressed="${on}"
      aria-label="${on ? '從我的工具移除' : '加入我的工具'}"
      title="${on ? '從我的工具移除' : '加入我的工具'}">${on ? '★' : '☆'}</button>`;
  }
  window.favButton = favButton;

  /* 整頁共用一個監聽，不管星星是什麼時候被畫出來的都管得到 */
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-fav]');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    const slug = btn.dataset.fav;
    const added = window.Favs.toggle(slug);
    if (added === null) return;
    document.querySelectorAll(`[data-fav="${CSS.escape(slug)}"]`).forEach(el => {
      el.textContent = added ? '★' : '☆';
      el.setAttribute('aria-pressed', String(added));
      const label = added ? '從我的工具移除' : '加入我的工具';
      el.setAttribute('aria-label', label);
      el.setAttribute('title', label);
    });
    window.toast(added ? '已加入我的工具' : '已從我的工具移除');
  });

  /* ---------- 名單儲存（輪盤、抽籤、分組、抽獎共用） ----------
     常用的名單（午餐店家、班級名單）存起來下次直接叫出來。
     跟收藏一樣只存在使用者自己的瀏覽器，沒有帳號也不同步。

     四個吃名單的工具共用同一份儲存，所以在輪盤存的名單，
     到抽籤點名也叫得出來——這是分開存做不到的。 */
  const LIST_KEY = 'sst-lists';
  const LIST_MAX = 20;          // 最多存幾份，避免把 localStorage 塞爆
  const ITEM_MAX = 200;         // 單份最多幾個項目

  function readLists() {
    try {
      const raw = localStorage.getItem(LIST_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(arr)) return [];
      return arr.filter(x => x && typeof x.name === 'string' && Array.isArray(x.items));
    } catch (e) {
      return [];
    }
  }

  window.NameLists = {
    all: readLists,
    /** 存一份名單。同名會覆蓋，最新的排前面。 */
    save(name, items) {
      name = String(name || '').trim().slice(0, 30);
      if (!name) return { ok: false, msg: '請先給這份名單一個名字' };
      const clean = (items || []).map(s => String(s).trim())
        .filter(Boolean).slice(0, ITEM_MAX);
      if (!clean.length) return { ok: false, msg: '名單是空的' };

      const list = readLists().filter(x => x.name !== name);
      list.unshift({ name, items: clean, at: Date.now() });
      try {
        localStorage.setItem(LIST_KEY, JSON.stringify(list.slice(0, LIST_MAX)));
        return { ok: true };
      } catch (e) {
        /* 無痕模式，或空間滿了 */
        return { ok: false, msg: '瀏覽器不允許儲存，無法保存名單' };
      }
    },
    remove(name) {
      try {
        localStorage.setItem(LIST_KEY,
          JSON.stringify(readLists().filter(x => x.name !== name)));
      } catch (e) { /* 存不進去就算了 */ }
    },
    get(name) { return readLists().find(x => x.name === name) || null; }
  };

  /* ---------- 分享連結 ----------
     把名單編進網址，傳給別人打開就是同一份。

     用 base64url 是為了讓中文能安全塞進網址。
     **只用在名單這類非個人資料**——薪資、BMI 那種絕對不能進網址，
     網址會留在瀏覽器歷史與 referrer 裡，等於把資料洩出去。 */
  window.ShareList = {
    encode(items) {
      try {
        const text = (items || []).join('\n');
        const b64 = btoa(String.fromCharCode(...new TextEncoder().encode(text)));
        return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      } catch (e) {
        return '';
      }
    },
    decode(str) {
      try {
        const b64 = String(str).replace(/-/g, '+').replace(/_/g, '/');
        const bin = atob(b64);
        const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
        const text = new TextDecoder().decode(bytes);
        /* 別人給的網址，長度要設上限，免得塞一大包進來把頁面卡住 */
        return text.split(/\r?\n/).map(s => s.trim())
          .filter(Boolean).slice(0, ITEM_MAX);
      } catch (e) {
        return [];
      }
    },
    /** 產生可分享的完整網址 */
    url(items) {
      const code = window.ShareList.encode(items);
      if (!code) return '';
      return location.origin + location.pathname + '?list=' + code;
    },
    /** 從目前網址讀出名單，沒有就回空陣列 */
    fromUrl() {
      const v = new URLSearchParams(location.search).get('list');
      return v ? window.ShareList.decode(v) : [];
    }
  };

  /** 把「分享連結 + 名單儲存」的 UI 一次接好。
   *  輪盤、抽籤點名、隨機分組都吃名單，邏輯完全一樣，
   *  寫三份只會變成改一個地方要記得改三次。
   *
   *  頁面上要有這幾個 id：
   *    shareBtn / listName / saveListBtn / savedLists
   *
   *  opts.input   放名單的 textarea 選擇器
   *  opts.onChange 名單被載入後要做什麼（重畫轉盤、更新計數之類）
   *  opts.hint    給使用者的命名提示
   */
  window.setupListTools = function (opts) {
    const input = $(opts.input);
    if (!input) return;
    const toLines = v => window.U.lines(v);

    /* ---- 分享連結 ---- */
    const shareBtn = $('#shareBtn');
    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        const items = toLines(input.value);
        if (!items.length) { window.toast('清單是空的，沒東西可以分享'); return; }
        const url = window.ShareList.url(items);
        if (!url) { window.toast('產生連結失敗'); return; }
        /* 網址太長在某些聊天軟體會被截斷，寧可先擋下來 */
        if (url.length > 1800) { window.toast('項目太多，連結會過長，建議精簡一點'); return; }
        window.copyText(url, '已複製分享連結，貼到群組就能一起用');
      });
    }

    /* ---- 名單儲存 ---- */
    const saved = $('#savedLists');
    function renderSaved() {
      if (!saved) return;
      const all = window.NameLists.all();
      if (!all.length) {
        saved.innerHTML = '<p class="hint mb-0">存起來的名單會出現在這裡，' +
          '輪盤、抽籤點名、隨機分組共用同一份。</p>';
        return;
      }
      saved.innerHTML = all.map(l => `
        <span class="chip chip--list">
          <button type="button" data-load="${esc(l.name)}"
                  title="載入這份名單（${l.items.length} 項）">${esc(l.name)}
            <span class="chip__n">${l.items.length}</span></button>
          <button type="button" class="chip__x" data-del="${esc(l.name)}"
                  aria-label="刪除名單 ${esc(l.name)}">✕</button>
        </span>`).join('');
    }

    const saveBtn = $('#saveListBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        const nameEl = $('#listName');
        const r = window.NameLists.save(nameEl ? nameEl.value : '', toLines(input.value));
        if (!r.ok) { window.toast(r.msg); return; }
        if (nameEl) nameEl.value = '';
        renderSaved();
        window.toast('名單已存到這台裝置');
      });
    }

    if (saved) {
      saved.addEventListener('click', e => {
        const load = e.target.closest('[data-load]');
        if (load) {
          const l = window.NameLists.get(load.dataset.load);
          if (l) {
            input.value = l.items.join('\n');
            if (opts.onChange) opts.onChange();
            window.toast('已載入「' + l.name + '」');
          }
          return;
        }
        const del = e.target.closest('[data-del]');
        if (del) { window.NameLists.remove(del.dataset.del); renderSaved(); }
      });
    }

    /* ---- 從分享連結帶進來 ----
       別人給的資料一律只寫進 textarea.value，絕不碰 innerHTML。 */
    const shared = window.ShareList.fromUrl();
    if (shared.length) {
      input.value = shared.join('\n');
      const note = document.createElement('p');
      note.className = 'hint';
      note.textContent = '這份清單是從分享連結帶進來的，共 ' + shared.length + ' 項。';
      input.parentNode.appendChild(note);
      if (opts.onChange) opts.onChange();
    }

    renderSaved();
  };

  /* ---------- 這個工具被用過幾次 ----------
     數字太小的時候不顯示。工具剛上線只有個位數，
     寫「已使用 3 次」反而讓人覺得沒人用，不如先不寫。 */
  function initUseCount() {
    if (!CURRENT) return;
    const cfg = SITE.useCount;
    if (!cfg || !cfg.enabled) return;

    const head = $('.tool-head');
    if (!head) return;

    fetch(ROOT + 'api/stats?t=' + encodeURIComponent(CURRENT), { cache: 'no-cache' })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d || !d.ok || d.views < (cfg.min || 50)) return;
        const el = document.createElement('p');
        el.className = 'use-count';
        el.innerHTML = `<span aria-hidden="true">🔧</span> 這個工具已經被使用 `
          + `<b>${d.views.toLocaleString('zh-TW')}</b> 次`;
        head.appendChild(el);
      })
      .catch(() => { /* 拿不到就不顯示，不影響工具本身 */ });
  }

  /* ---------- 瀏覽計數 ----------
     打給自家的 /api/hit，用來算首頁顯示的瀏覽數與線上人數。
     送出的只有這個請求本身，不含頁面內容，也不含你在工具裡填的任何東西。
     後端沒接好或請求失敗都無所謂，這裡完全不影響頁面功能。 */
  function initHitCount() {
    /* 帶上工具代號，才能算出每個工具各被用過幾次。首頁不帶。 */
    const url = ROOT + 'api/hit' + (CURRENT ? '?t=' + encodeURIComponent(CURRENT) : '');
    try {
      /* sendBeacon 不會拖慢頁面，瀏覽器會在閒置時送出 */
      if (navigator.sendBeacon && navigator.sendBeacon(url, new Blob())) return;
      fetch(url, { method: 'POST', keepalive: true }).catch(() => {});
    } catch (e) {
      /* 被擋掉就算了，統計不重要到要讓使用者知道 */
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
    /* build-seo.mjs 會在建置時把頁首頁尾寫進靜態 HTML，
       讓不執行 JS 的爬蟲也看得到完整的站內連結。
       已經有了就不要再畫一次，否則畫面會出現兩組。 */
    if (!document.querySelector('[data-static-nav]')) {
      const h = document.createElement('div');
      h.innerHTML = buildHeader();
      document.body.insertBefore(h, document.body.firstChild);
    }
    if (!document.querySelector('[data-static-foot]')) {
      const f = document.createElement('div');
      f.innerHTML = buildFooter();
      document.body.appendChild(f);
    }

    $('#themeToggle').addEventListener('click', () => {
      const next = currentTheme() === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* 無痕模式忽略 */ }
    });

    initSearch();
    initCrumb();
    initFavOnTool();
    initRelated();
    initAd();
    initAnalytics();
    initHitCount();
    initUseCount();

    /* canonical、OG 與結構化資料改由 build-seo.mjs 靜態寫進 HTML，
       這裡不再動態插入，避免正式網域設定後出現兩組 canonical。 */
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
