/* Wees Mod — каталог, карточка товара, список заказа и отправка в Instagram DM / WhatsApp. */
(function () {
  'use strict';

  const LANGS = ['tr', 'en', 'ar'];
  const LOCALES = { tr: 'tr-TR', en: 'en-US', ar: 'ar' };
  const BAG_KEY = 'wm_bag';
  const LANG_KEY = 'wm_lang';

  const state = { lang: detectLang(), settings: null, products: [], filter: 'all' };

  /* ---------- Утилиты ---------- */

  function storage(fn, fallback) {
    try { return fn(window.localStorage); } catch (e) { return fallback; }
  }

  function detectLang() {
    const fromUrl = new URLSearchParams(location.search).get('lang');
    if (LANGS.includes(fromUrl)) return fromUrl;
    const saved = storage((s) => s.getItem(LANG_KEY));
    if (LANGS.includes(saved)) return saved;
    const nav = (navigator.language || 'tr').slice(0, 2).toLowerCase();
    return LANGS.includes(nav) ? nav : 'tr';
  }

  function t(key, vars) {
    const dict = window.I18N[state.lang] || window.I18N.tr;
    let s = dict[key] != null ? dict[key] : (window.I18N.tr[key] != null ? window.I18N.tr[key] : key);
    if (vars) Object.keys(vars).forEach((k) => { s = s.replace('{' + k + '}', vars[k]); });
    return s;
  }

  const L = (obj) => (obj && typeof obj === 'object' ? (obj[state.lang] || obj.tr || obj.en || '') : (obj || ''));

  function money(n) {
    return new Intl.NumberFormat(LOCALES[state.lang], {
      style: 'currency', currency: 'TRY', currencyDisplay: 'narrowSymbol', maximumFractionDigits: 0
    }).format(n);
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  function applyI18n(root) {
    $$('[data-i18n]', root).forEach((el) => { el.textContent = t(el.dataset.i18n); });
    $$('[data-i18n-aria]', root).forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
  }

  const igLink = () => 'https://ig.me/m/' + state.settings.instagram;
  const igProfile = () => 'https://instagram.com/' + state.settings.instagram;
  const waLink = (text) => state.settings.whatsapp
    ? 'https://wa.me/' + state.settings.whatsapp + (text ? '?text=' + encodeURIComponent(text) : '')
    : '';

  const findProduct = (id) => state.products.find((p) => p.id === id);
  const sizeLabel = (s) => s + (state.lang === 'ar' ? ' سنوات' : state.lang === 'en' ? ' yrs' : ' yaş');

  /* ---------- Иконки ---------- */

  const ICON = {
    bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3z"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg>',
    tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M3 12V4h8l10 10-8 8L3 12z"/><circle cx="7.5" cy="8.5" r="1.5"/></svg>',
    truck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M2 6h12v10H2zM14 10h4l3 3v3h-7z"/><circle cx="6" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M4 5h16v11H9l-5 4z"/></svg>'
  };

  // Логотип: монограмма WM в золотом круге, как в профиле Instagram.
  const LOGO =
    '<span class="logo-mark" aria-hidden="true"><svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="18.5" fill="none" stroke="currentColor" stroke-width="1.2"/>' +
    '<text x="20" y="25.5" text-anchor="middle" font-family="Cormorant Garamond, Georgia, serif" font-size="15" font-weight="600" fill="currentColor">WM</text></svg></span>' +
    '<span class="logo-text"><span class="logo-name">wees mod</span><span class="logo-sub">APPAREL &amp; CO.</span></span>';

  /* ---------- Данные ---------- */

  // Сначала берём каталог из панели управления (/api/products), а если сервера нет
  // (например, при локальном просмотре) — из файлов data/.
  async function loadData() {
    const local = await fetch('data/settings.json').then((r) => r.json());
    try {
      const res = await fetch('/api/products', { cache: 'no-store' });
      const live = res.ok ? await res.json() : null;
      if (live && Array.isArray(live.products)) {
        state.settings = Object.assign({}, local, live.settings);
        state.products = live.products;
        return;
      }
    } catch (e) { /* нет сервера — используем файлы */ }
    state.settings = local;
    state.products = (await fetch('data/products.json').then((r) => r.json())).products;
  }

  /* ---------- Список заказа ---------- */

  function getBag() {
    const raw = storage((s) => JSON.parse(s.getItem(BAG_KEY) || '[]'), []);
    return Array.isArray(raw) ? raw.filter((i) => findProduct(i.id) && i.qty > 0) : [];
  }

  function saveBag(bag) {
    storage((s) => s.setItem(BAG_KEY, JSON.stringify(bag)));
    renderBagCount();
    renderBag();
  }

  function addToBag(id, variant, size, qty) {
    const bag = getBag();
    const same = bag.find((i) => i.id === id && i.variant === variant && i.size === size);
    if (same) same.qty = Math.min(99, same.qty + qty);
    else bag.push({ id, variant, size, qty });
    saveBag(bag);
  }

  function orderText(items) {
    const lines = items.map((i) => {
      const p = findProduct(i.id);
      const v = p.variants[i.variant] || p.variants[0];
      return '• ' + L(p.name) + ' — ' + t('msg.color') + ': ' + L(v.color) + ', ' + t('msg.size') + ': ' + sizeLabel(i.size) + ', ' + t('msg.qty') + ': ' + i.qty;
    });
    return t('msg.hello') + '\n' + lines.join('\n');
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
      ta.remove();
      return ok;
    }
  }

  // Instagram не умеет подставлять текст в DM, поэтому копируем сообщение и открываем переписку.
  async function sendViaInstagram(items) {
    await copyText(orderText(items));
    toast(t('bag.copied'), 4500);
    setTimeout(() => { window.open(igLink(), '_blank', 'noopener'); }, 600);
  }

  /* ---------- Шапка, подвал, панели ---------- */

  function renderLayout() {
    const s = state.settings;
    $('#site-header').innerHTML =
      '<div class="container header-inner">' +
        '<a href="#top" class="logo" aria-label="Wees Mod">' + LOGO + '</a>' +
        '<nav class="main-nav" id="main-nav">' +
          '<a href="#collection" data-i18n="nav.collection"></a>' +
          '<a href="#collection" data-filter-link="girl" data-i18n="nav.girls"></a>' +
          '<a href="#collection" data-filter-link="boy" data-i18n="nav.boys"></a>' +
          '<a href="#about" data-i18n="nav.about"></a>' +
          '<a href="#contact" data-i18n="nav.contact"></a>' +
        '</nav>' +
        '<div class="header-actions">' +
          '<div class="lang-switch" role="group" aria-label="Language">' +
            LANGS.map((l) => '<button type="button" data-lang="' + l + '" class="' + (l === state.lang ? 'active' : '') + '" aria-pressed="' + (l === state.lang) + '">' + (l === 'ar' ? 'ع' : l.toUpperCase()) + '</button>').join('') +
          '</div>' +
          '<button type="button" class="icon-btn" id="bag-open" data-i18n-aria="nav.bag">' + ICON.bag + '<span class="bag-count" id="bag-count" hidden>0</span></button>' +
          '<button type="button" class="icon-btn menu-btn" id="menu-toggle" data-i18n-aria="nav.menu" aria-expanded="false">' + ICON.menu + '</button>' +
        '</div>' +
      '</div>';

    $('#site-footer').innerHTML =
      '<div class="container footer-inner">' +
        '<a href="#top" class="logo logo-light" aria-label="Wees Mod">' + LOGO + '</a>' +
        '<p data-i18n="footer.tagline"></p>' +
        '<div class="socials">' +
          '<a href="' + igProfile() + '" target="_blank" rel="noopener" aria-label="Instagram">' + ICON.instagram + '</a>' +
          (s.whatsapp ? '<a href="' + waLink() + '" target="_blank" rel="noopener" aria-label="WhatsApp">' + ICON.whatsapp + '</a>' : '') +
        '</div>' +
        '<p class="copy">© ' + new Date().getFullYear() + ' Wees Mod. <span data-i18n="footer.rights"></span></p>' +
      '</div>';

    if (!$('#bag')) {
      document.body.insertAdjacentHTML('beforeend',
        '<div class="drawer" id="bag" aria-hidden="true"></div>' +
        '<div class="modal" id="modal" aria-hidden="true"></div>' +
        '<div class="toast" id="toast" role="status"></div>' +
        '<a class="fab" id="fab" target="_blank" rel="noopener" aria-label="Instagram"></a>');
    }
    const fab = $('#fab');
    fab.href = s.whatsapp ? waLink() : igLink();
    fab.className = 'fab ' + (s.whatsapp ? 'fab-wa' : 'fab-ig');
    fab.innerHTML = s.whatsapp ? ICON.whatsapp : ICON.instagram;

    $$('.lang-switch button').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));
    $('#bag-open').addEventListener('click', () => openPanel('#bag'));
    $('#menu-toggle').addEventListener('click', () => {
      const open = $('#main-nav').classList.toggle('open');
      $('#menu-toggle').setAttribute('aria-expanded', String(open));
    });
    $$('#main-nav a').forEach((a) => a.addEventListener('click', () => {
      $('#main-nav').classList.remove('open');
      if (a.dataset.filterLink) setFilter(a.dataset.filterLink);
    }));

    renderBagCount();
    renderBag();
  }

  function renderBagCount() {
    const el = $('#bag-count');
    if (!el) return;
    const n = getBag().reduce((s, i) => s + i.qty, 0);
    el.textContent = n;
    el.hidden = n === 0;
  }

  function renderBag() {
    const el = $('#bag');
    if (!el) return;
    const bag = getBag();
    const wa = state.settings.whatsapp;
    el.innerHTML =
      '<div class="backdrop" data-close></div>' +
      '<aside class="drawer-panel" role="dialog" aria-modal="true" aria-labelledby="bag-title">' +
        '<div class="panel-head"><h3 id="bag-title">' + esc(t('bag.title')) + '</h3>' +
          '<button type="button" class="icon-btn" data-close aria-label="' + esc(t('p.close')) + '">' + ICON.close + '</button></div>' +
        (bag.length === 0
          ? '<div class="bag-empty">' + ICON.bag + '<p>' + esc(t('bag.empty')) + '</p>' +
            '<a href="#collection" class="btn btn-dark" data-close>' + esc(t('hero.cta')) + '</a></div>'
          : '<div class="bag-body">' + bag.map((i, idx) => {
              const p = findProduct(i.id);
              const v = p.variants[i.variant] || p.variants[0];
              return '<div class="bag-line">' +
                '<img src="' + esc(v.image) + '" alt="" loading="lazy">' +
                '<div class="bag-info"><strong>' + esc(L(p.name)) + '</strong>' +
                  '<span>' + esc(L(v.color)) + ' · ' + esc(sizeLabel(i.size)) + '</span>' +
                  '<div class="qty" data-idx="' + idx + '"><button type="button" data-d="-1" aria-label="-">−</button><span>' + i.qty + '</span><button type="button" data-d="1" aria-label="+">+</button></div>' +
                '</div>' +
                '<button type="button" class="link-btn" data-remove="' + idx + '">' + esc(t('bag.remove')) + '</button>' +
              '</div>';
            }).join('') + '</div>' +
            '<div class="bag-foot"><p class="hint">' + esc(t('bag.hint')) + '</p>' +
              '<button type="button" class="btn btn-ig btn-block" id="send-ig">' + ICON.instagram + esc(t('bag.ig')) + '</button>' +
              (wa ? '<a class="btn btn-wa btn-block" target="_blank" rel="noopener" href="' + waLink(orderText(bag)) + '">' + ICON.whatsapp + esc(t('bag.wa')) + '</a>' : '') +
              '<button type="button" class="btn btn-ghost btn-block" data-close>' + esc(t('bag.continue')) + '</button>' +
            '</div>') +
      '</aside>';

    $$('[data-close]', el).forEach((b) => b.addEventListener('click', () => closePanel('#bag')));
    $$('.qty button', el).forEach((b) => b.addEventListener('click', () => {
      const bagNow = getBag();
      const item = bagNow[Number(b.parentElement.dataset.idx)];
      item.qty = Math.max(0, Math.min(99, item.qty + Number(b.dataset.d)));
      saveBag(bagNow.filter((x) => x.qty > 0));
    }));
    $$('[data-remove]', el).forEach((b) => b.addEventListener('click', () => {
      const bagNow = getBag();
      bagNow.splice(Number(b.dataset.remove), 1);
      saveBag(bagNow);
    }));
    const ig = $('#send-ig', el);
    if (ig) ig.addEventListener('click', () => sendViaInstagram(getBag()));
  }

  let lastFocus = null;
  function openPanel(sel) {
    lastFocus = document.activeElement;
    const el = $(sel);
    el.classList.add('open');
    el.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    const btn = $('[data-close].icon-btn', el);
    if (btn) btn.focus();
  }

  function closePanel(sel) {
    const el = $(sel);
    if (!el || !el.classList.contains('open')) return;
    el.classList.remove('open');
    el.setAttribute('aria-hidden', 'true');
    if (!$('.drawer.open, .modal.open')) document.body.classList.remove('no-scroll');
    if (lastFocus) lastFocus.focus();
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closePanel('#modal'); closePanel('#bag'); }
  });

  let toastTimer;
  function toast(msg, ms) {
    const el = $('#toast');
    el.innerHTML = ICON.check + '<span>' + esc(msg) + '</span>';
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), ms || 2200);
  }

  /* ---------- Каталог ---------- */

  function setFilter(f) {
    state.filter = f;
    renderCollection();
  }

  function priceHtml(p) {
    return p.price ? '<span class="price">' + money(p.price) + '</span>' : '<span class="price ask">' + esc(t('price.ask')) + '</span>';
  }

  function renderCollection() {
    const filters = ['all', 'girl', 'boy', 'winter', 'summer'];
    $('#filters').innerHTML = filters.map((f) =>
      '<button type="button" class="chip' + (state.filter === f ? ' active' : '') + '" data-f="' + f + '">' + esc(t('filter.' + f)) + '</button>'
    ).join('');
    $$('#filters .chip').forEach((b) => b.addEventListener('click', () => setFilter(b.dataset.f)));

    const f = state.filter;
    const list = state.products
      // Порядок как в панели управления (продавец меняет его стрелками).
      .filter((p) => f === 'all' || p.gender === f || p.season === f || (p.gender === 'unisex' && (f === 'girl' || f === 'boy')));

    $('#grid').innerHTML = list.length ? list.map((p) => {
      const v = p.variants[0];
      return '<article class="card">' +
        '<button type="button" class="card-img" data-open="' + esc(p.id) + '" aria-label="' + esc(L(p.name)) + '">' +
          '<img src="' + esc(v.image) + '" alt="' + esc(L(p.name)) + '" loading="lazy">' +
          (p.variants.length > 1 ? '<span class="badge">' + esc(t('colors', { x: p.variants.length })) + '</span>' : '') +
        '</button>' +
        '<div class="card-body">' +
          '<div class="swatches">' + p.variants.map((x) => '<span style="background:' + esc(x.hex) + '" title="' + esc(L(x.color)) + '"></span>').join('') + '</div>' +
          '<h3><button type="button" data-open="' + esc(p.id) + '">' + esc(L(p.name)) + '</button></h3>' +
          (p.inStock ? priceHtml(p) : '<span class="price ask">' + esc(t('p.soldOut')) + '</span>') +
        '</div></article>';
    }).join('') : '<p class="empty">' + esc(t('col.empty')) + '</p>';

    $$('[data-open]', $('#grid')).forEach((b) => b.addEventListener('click', () => openProduct(b.dataset.open)));
  }

  /* ---------- Карточка товара ---------- */

  function openProduct(id, variant) {
    const p = findProduct(id);
    if (!p) return;
    const ui = { variant: variant || 0, size: null, qty: 1 };
    const sizes = state.settings.sizes || [];

    function draw() {
      const v = p.variants[ui.variant];
      $('#modal').innerHTML =
        '<div class="backdrop" data-close></div>' +
        '<div class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="p-title">' +
          '<button type="button" class="icon-btn modal-close" data-close aria-label="' + esc(t('p.close')) + '">' + ICON.close + '</button>' +
          '<div class="modal-img"><img src="' + esc(v.image) + '" alt="' + esc(L(p.name) + ' — ' + L(v.color)) + '"></div>' +
          '<div class="modal-body">' +
            (p.gender !== 'unisex' ? '<span class="eyebrow">' + esc(t('filter.' + p.gender)) + '</span>' : '') +
            '<h2 id="p-title">' + esc(L(p.name)) + '</h2>' +
            priceHtml(p) +
            '<div class="opt"><span class="opt-label">' + esc(t('p.color')) + ': <b>' + esc(L(v.color)) + '</b></span>' +
              '<div class="color-opts">' + p.variants.map((x, i) =>
                '<button type="button" class="color-opt' + (i === ui.variant ? ' active' : '') + '" data-v="' + i + '" aria-label="' + esc(L(x.color)) + '" aria-pressed="' + (i === ui.variant) + '">' +
                '<img src="' + esc(x.image) + '" alt=""></button>').join('') + '</div></div>' +
            (sizes.length ? '<div class="opt"><span class="opt-label">' + esc(t('p.size')) + '</span>' +
              '<div class="size-opts">' + sizes.map((s) =>
                '<button type="button" class="size-opt' + (s === ui.size ? ' active' : '') + '" data-s="' + esc(s) + '" aria-pressed="' + (s === ui.size) + '">' + esc(s) + '</button>').join('') + '</div>' +
              '<p class="size-err" id="size-err" hidden>' + esc(t('p.pickSize')) + '</p></div>' : '') +
            '<div class="opt row"><span class="opt-label">' + esc(t('p.qty')) + '</span>' +
              '<div class="qty qty-lg" id="p-qty"><button type="button" data-d="-1" aria-label="-">−</button><span>' + ui.qty + '</span><button type="button" data-d="1" aria-label="+">+</button></div></div>' +
            (!p.inStock ? '<p class="price ask">' + esc(t('p.soldOut')) + '</p>' : '') +
            '<div class="modal-actions"' + (p.inStock ? '' : ' hidden') + '>' +
              '<button type="button" class="btn btn-dark btn-block" id="p-add">' + esc(t('p.add')) + '</button>' +
              '<button type="button" class="btn btn-ig btn-block" id="p-ig">' + ICON.instagram + esc(t('p.orderNow')) + '</button>' +
              (state.settings.whatsapp ? '<button type="button" class="btn btn-wa btn-block" id="p-wa">' + ICON.whatsapp + 'WhatsApp</button>' : '') +
            '</div>' +
            '<p class="note">' + esc(t('p.note')) + '</p>' +
          '</div>' +
        '</div>';

      const m = $('#modal');
      $$('[data-close]', m).forEach((b) => b.addEventListener('click', () => closePanel('#modal')));
      $$('.color-opt', m).forEach((b) => b.addEventListener('click', () => { ui.variant = Number(b.dataset.v); draw(); }));
      $$('.size-opt', m).forEach((b) => b.addEventListener('click', () => { ui.size = b.dataset.s; draw(); }));
      $$('#p-qty button', m).forEach((b) => b.addEventListener('click', () => {
        ui.qty = Math.max(1, Math.min(99, ui.qty + Number(b.dataset.d)));
        $('#p-qty span', m).textContent = ui.qty;
      }));

      const needSize = () => {
        if (sizes.length && !ui.size) { $('#size-err', m).hidden = false; return true; }
        return false;
      };
      const item = () => [{ id: p.id, variant: ui.variant, size: ui.size || '-', qty: ui.qty }];

      $('#p-add', m).addEventListener('click', () => {
        if (needSize()) return;
        addToBag(p.id, ui.variant, ui.size || '-', ui.qty);
        closePanel('#modal');
        toast(t('p.added'));
      });
      $('#p-ig', m).addEventListener('click', () => { if (!needSize()) sendViaInstagram(item()); });
      const wa = $('#p-wa', m);
      if (wa) wa.addEventListener('click', () => { if (!needSize()) window.open(waLink(orderText(item())), '_blank', 'noopener'); });
    }

    draw();
    openPanel('#modal');
  }

  /* ---------- Язык и запуск ---------- */

  function setLang(lang) {
    if (!LANGS.includes(lang) || lang === state.lang) return;
    state.lang = lang;
    storage((s) => s.setItem(LANG_KEY, lang));
    render();
  }

  function render() {
    const html = document.documentElement;
    html.lang = state.lang;
    html.dir = state.lang === 'ar' ? 'rtl' : 'ltr';
    document.title = t('meta.title');
    const meta = $('meta[name="description"]');
    if (meta) meta.content = t('meta.description');
    renderLayout();
    renderCollection();

    const s = state.settings;
    $('#hero-ig').href = igProfile();
    $('#contact-ig').href = igLink();
    const wa = $('#contact-wa');
    wa.hidden = !s.whatsapp;
    if (s.whatsapp) wa.href = waLink();
    const featured = state.products.filter((p) => p.featured && p.inStock);
    const heroImgs = (featured.length >= 3 ? featured : state.products).slice(0, 3);
    $$('.hero-photos img').forEach((img, i) => {
      if (heroImgs[i]) { img.src = heroImgs[i].variants[0].image; img.alt = L(heroImgs[i].name); }
    });
    applyI18n(document);
  }

  async function init() {
    try {
      await loadData();
    } catch (e) {
      document.body.insertAdjacentHTML('afterbegin', '<p class="load-error">Site data could not be loaded. Open the site through a web server.</p>');
      return;
    }
    render();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
