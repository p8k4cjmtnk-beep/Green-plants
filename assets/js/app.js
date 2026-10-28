/* By Herba — общая логика сайта: языки, данные, корзина, шапка/подвал и страницы. */
(function () {
  'use strict';

  const LANGS = ['tr', 'ru', 'en'];
  const LOCALES = { tr: 'tr-TR', ru: 'ru-RU', en: 'en-US' };
  const CART_KEY = 'bh_cart';
  const LANG_KEY = 'bh_lang';
  const API = '/.netlify/functions';

  const state = { lang: detectLang(), settings: null, catalog: null };

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

  function L(obj) {
    if (!obj || typeof obj === 'string') return obj || '';
    return obj[state.lang] || obj.tr || obj.ru || obj.en || '';
  }

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
    $$('[data-i18n-ph]', root).forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
    $$('[data-i18n-aria]', root).forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
  }

  function waLink(text) {
    return 'https://wa.me/' + state.settings.whatsapp + (text ? '?text=' + encodeURIComponent(text) : '');
  }

  /* ---------- Иконки ---------- */

  const ICON = {
    cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 7h12l-1 13H7L6 7z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3z"/></svg>',
    telegram: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.4 4.2 18.3 19c-.2 1-.8 1.3-1.7.8l-4.6-3.4-2.2 2.1c-.3.3-.5.5-1 .5l.3-4.7 8.6-7.8c.4-.3-.1-.5-.6-.2L6.5 13 2 11.6c-1-.3-1-1 .2-1.5l17.8-6.9c.8-.3 1.6.2 1.4 1z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M3 12V4h8l10 10-8 8L3 12z"/><circle cx="7.5" cy="8.5" r="1.5"/></svg>',
    truck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M2 6h12v10H2zM14 10h4l3 3v3h-7z"/><circle cx="6" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>',
    leaf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19C5 10 11 4 20 4c0 9-6 15-15 15z"/><path d="M5 19 13 11"/></svg>',
    gift: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><rect x="3" y="8" width="18" height="4"/><path d="M5 12v9h14v-9M12 8v13M12 8S10 3 7.5 4.5 9 8 12 8zm0 0s2-5 4.5-3.5S15 8 12 8z"/></svg>',
    card: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/></svg>',
    bank: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M3 10 12 4l9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18"/></svg>',
    cash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg>'
  };

  // Логотип: надпись BY HERBA с зелёным листом и подписью cosmetic.
  // Если появится файл логотипа, замените LOGO на '<img src="assets/img/logo.svg" alt="By Herba">'.
  const LOGO =
    '<span class="brand"><span class="brand-name">BY HERBA</span>' +
    '<svg class="brand-swoosh" viewBox="0 0 160 22" aria-hidden="true"><path d="M2 14C40 4 98 2 154 3c-30 3-62 9-92 15C40 22 16 21 2 14z" fill="#6cbf3c"/>' +
    '<path d="M10 17c44 6 92-2 140-12" stroke="#2f7d22" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>' +
    '<span class="brand-sub">cosmetic</span></span>';

  /* ---------- Иллюстрации товаров (пока нет фото) ---------- */

  function productArt(p) {
    if (p.image) {
      return '<img src="' + esc(p.image) + '" alt="' + esc(L(p.name)) + '" loading="lazy">';
    }
    const c = p.color || '#8aa38c';
    const bg = '<rect width="200" height="200" fill="#f1ebdf"/><circle cx="100" cy="112" r="70" fill="' + c + '" opacity=".18"/>' +
      '<path d="M28 178c18-30 40-40 62-38-14 8-30 20-38 38z" fill="#2f4a3a" opacity=".18"/>' +
      '<path d="M176 60c-16 2-30 14-32 32 14-4 26-14 32-32z" fill="#2f4a3a" opacity=".14"/>';
    const label = (x, y, w, h) =>
      '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="2" fill="#fff" stroke="#1f2747" stroke-width=".8"/>' +
      '<text x="' + (x + w / 2) + '" y="' + (y + 11) + '" text-anchor="middle" font-family="Rubik,Arial,sans-serif" font-style="italic" font-weight="800" font-size="8" fill="#1f2747">BY HERBA</text>' +
      '<path d="M' + (x + 8) + ' ' + (y + 14) + 'q' + (w / 2 - 8) + ' -4 ' + (w - 16) + ' -2" stroke="#6cbf3c" stroke-width="2" fill="none" stroke-linecap="round"/>' +
      '<circle cx="' + (x + w / 2) + '" cy="' + (y + h / 2 + 5) + '" r="' + Math.min(9, h / 5) + '" fill="' + c + '"/>';
    const diffuser = (x, y, s) =>
      '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' +
      '<g stroke="#1b1b1b" stroke-width="2.4" stroke-linecap="round"><path d="M95 70 66 10"/><path d="M98 70 92 6"/><path d="M102 70 110 6"/><path d="M105 70 134 12"/></g>' +
      '<rect x="84" y="62" width="32" height="20" rx="3" fill="#1b1b1b"/>' +
      '<rect x="56" y="80" width="88" height="94" rx="9" fill="' + c + '" opacity=".72"/>' +
      '<rect x="56" y="80" width="88" height="94" rx="9" fill="none" stroke="#ffffff" stroke-opacity=".7" stroke-width="3"/>' +
      '<path d="M64 88v76" stroke="#fff" stroke-opacity=".55" stroke-width="4" stroke-linecap="round"/>' +
      label(72, 104, 56, 52) + '</g>';
    // Флакон-спрей: узкий флакон с распылителем и облачком брызг (не путать с дозатором для мыла).
    const spray = (x, y, s) =>
      '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' +
      '<g fill="' + c + '" opacity=".55"><circle cx="128" cy="40" r="2.6"/><circle cx="138" cy="34" r="2"/><circle cx="140" cy="46" r="2.2"/><circle cx="150" cy="38" r="1.6"/><circle cx="152" cy="50" r="1.8"/><circle cx="162" cy="43" r="1.3"/></g>' +
      '<rect x="88" y="30" width="24" height="24" rx="6" fill="#1b1b1b"/><circle cx="112" cy="40" r="2" fill="#555"/>' +
      '<rect x="91" y="54" width="18" height="10" fill="#c9c9c9"/>' +
      '<rect x="74" y="64" width="52" height="110" rx="12" fill="' + c + '" opacity=".72"/>' +
      '<rect x="74" y="64" width="52" height="110" rx="12" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="3"/>' +
      '<path d="M81 72v94" stroke="#fff" stroke-opacity=".55" stroke-width="4" stroke-linecap="round"/>' +
      label(80, 100, 40, 48) + '</g>';
    let body;
    if (p.category === 'diffuser') body = diffuser(0, 0, 1);
    else if (p.category === 'spray') body = spray(0, 0, 1);
    else if (p.category === 'soap') {
      // Овальное губчатое мыло с круглой этикеткой
      body = '<ellipse cx="100" cy="112" rx="64" ry="74" fill="#efe9d6" stroke="#d8cfb2" stroke-width="3"/>' +
        '<ellipse cx="100" cy="112" rx="54" ry="63" fill="#fff"/>' +
        '<ellipse cx="100" cy="112" rx="54" ry="63" fill="' + c + '" opacity=".28"/>' +
        '<text x="100" y="72" text-anchor="middle" font-family="Rubik,Arial,sans-serif" font-style="italic" font-weight="800" font-size="11" fill="#1f2747">BY HERBA</text>' +
        '<path d="M80 76q20-5 40-1" stroke="#6cbf3c" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
        '<circle cx="100" cy="108" r="22" fill="' + c + '" stroke="#fff" stroke-width="3"/>' +
        '<rect x="74" y="138" width="52" height="4" rx="2" fill="#1f2747" opacity=".55"/>' +
        '<rect x="82" y="147" width="36" height="3" rx="1.5" fill="#1f2747" opacity=".3"/>' +
        '<text x="100" y="164" text-anchor="middle" font-family="Georgia,serif" font-size="8" fill="#1f2747">130g</text>';
    } else if (p.category === 'loofah') {
      // Прямоугольное мыло, сверху мочалка из тыквенного волокна
      const pid = 'mesh-' + esc(p.id);
      body = '<defs><pattern id="' + pid + '" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><path d="M0 0h7M0 0v7" stroke="#a89a5c" stroke-width="1.3"/></pattern></defs>' +
        '<path d="M150 104 172 86v44l-22 22z" fill="' + c + '" opacity=".75"/>' +
        '<path d="M150 104 172 86v44l-22 22z" fill="#000" opacity=".08"/>' +
        '<rect x="28" y="104" width="122" height="48" rx="6" fill="' + c + '"/>' +
        '<path d="M28 104 50 86h122l-22 18z" fill="#e3d9a6"/><path d="M28 104 50 86h122l-22 18z" fill="url(#' + pid + ')"/>' +
        '<rect x="28" y="104" width="122" height="16" fill="#e3d9a6"/><rect x="28" y="104" width="122" height="16" fill="url(#' + pid + ')"/>' +
        '<text x="89" y="141" text-anchor="middle" font-family="Rubik,Arial,sans-serif" font-style="italic" font-weight="800" font-size="13" fill="#1f2747">BY HERBA</text>';
    } else {
      body = '<rect x="30" y="150" width="140" height="28" rx="4" fill="#2f4a3a" opacity=".9"/><rect x="94" y="150" width="12" height="28" fill="#b08d57"/>' +
        diffuser(-6, 8, 0.78) + spray(66, 22, 0.7);
    }
    return '<svg viewBox="0 0 200 200" role="img" aria-label="' + esc(L(p.name)) + '">' + bg + body + '</svg>';
  }

  /* ---------- Данные ---------- */

  async function loadData() {
    const [settings, catalog] = await Promise.all([
      fetch('data/settings.json').then((r) => r.json()),
      fetch('data/products.json').then((r) => r.json())
    ]);
    state.settings = settings;
    state.catalog = catalog;
  }

  const findProduct = (id) => state.catalog.products.find((p) => p.id === id);

  /* ---------- Корзина ---------- */

  function getCart() {
    const raw = storage((s) => JSON.parse(s.getItem(CART_KEY) || '[]'), []);
    return Array.isArray(raw) ? raw.filter((i) => findProduct(i.id) && i.qty > 0) : [];
  }

  function saveCart(cart) {
    storage((s) => s.setItem(CART_KEY, JSON.stringify(cart)));
    renderCartCount();
    renderDrawer();
  }

  function addToCart(id, qty) {
    const cart = getCart();
    const item = cart.find((i) => i.id === id);
    if (item) item.qty = Math.min(99, item.qty + qty);
    else cart.push({ id: id, qty: qty });
    saveCart(cart);
    toast(t('product.added'));
  }

  function setQty(id, qty) {
    let cart = getCart();
    if (qty <= 0) cart = cart.filter((i) => i.id !== id);
    else cart.forEach((i) => { if (i.id === id) i.qty = Math.min(99, qty); });
    saveCart(cart);
  }

  function cartTotals(cart) {
    const subtotal = cart.reduce((s, i) => s + findProduct(i.id).price * i.qty, 0);
    const d = state.settings.delivery;
    const delivery = subtotal === 0 || subtotal >= d.freeFrom ? 0 : d.cost;
    return { subtotal: subtotal, delivery: delivery, total: subtotal + delivery, left: Math.max(0, d.freeFrom - subtotal) };
  }

  function clearCart() { storage((s) => s.removeItem(CART_KEY)); renderCartCount(); }

  /* ---------- Шапка, подвал, корзина-панель ---------- */

  function renderLayout() {
    const page = document.body.dataset.page;
    const home = page === 'home' ? '' : 'index.html';
    const s = state.settings;

    $('#site-header').innerHTML =
      '<div class="container header-inner">' +
        '<a href="index.html" class="logo" aria-label="By Herba cosmetic">' + LOGO + '</a>' +
        '<nav class="main-nav" id="main-nav">' +
          '<a href="catalog.html" data-i18n="nav.catalog"></a>' +
          '<a href="' + home + '#about" data-i18n="nav.about"></a>' +
          '<a href="' + home + '#delivery" data-i18n="nav.delivery"></a>' +
          '<a href="' + home + '#reviews" data-i18n="nav.reviews"></a>' +
          '<a href="' + home + '#contacts" data-i18n="nav.contacts"></a>' +
        '</nav>' +
        '<div class="header-actions">' +
          '<div class="lang-switch" role="group" aria-label="Language">' +
            LANGS.map((l) => '<button type="button" data-lang="' + l + '"' + (l === state.lang ? ' class="active" aria-pressed="true"' : ' aria-pressed="false"') + '>' + l.toUpperCase() + '</button>').join('') +
          '</div>' +
          '<button type="button" class="icon-btn cart-btn" id="cart-open" data-i18n-aria="nav.cart">' + ICON.cart + '<span class="cart-count" id="cart-count">0</span></button>' +
          '<button type="button" class="icon-btn menu-btn" id="menu-toggle" data-i18n-aria="nav.menu" aria-expanded="false">' + ICON.menu + '</button>' +
        '</div>' +
      '</div>';

    $('#site-footer').innerHTML =
      '<div class="container footer-grid">' +
        '<div><a href="index.html" class="logo logo-light" aria-label="By Herba cosmetic">' + LOGO + '</a>' +
          '<p class="muted-light" data-i18n="footer.tagline"></p>' +
          '<div class="socials">' +
            '<a href="' + waLink() + '" target="_blank" rel="noopener" aria-label="WhatsApp">' + ICON.whatsapp + '</a>' +
            '<a href="https://t.me/' + esc(s.telegram) + '" target="_blank" rel="noopener" aria-label="Telegram">' + ICON.telegram + '</a>' +
            '<a href="https://instagram.com/' + esc(s.instagram) + '" target="_blank" rel="noopener" aria-label="Instagram">' + ICON.instagram + '</a>' +
          '</div></div>' +
        '<div><h4 data-i18n="footer.nav"></h4><ul>' +
          '<li><a href="catalog.html" data-i18n="nav.catalog"></a></li>' +
          '<li><a href="' + home + '#about" data-i18n="nav.about"></a></li>' +
          '<li><a href="' + home + '#delivery" data-i18n="nav.delivery"></a></li>' +
          '<li><a href="legal.html" data-i18n="footer.legal"></a></li></ul></div>' +
        '<div><h4 data-i18n="footer.contacts"></h4><ul>' +
          '<li><a href="tel:' + esc(s.phone.replace(/\s/g, '')) + '">' + esc(s.phone) + '</a></li>' +
          '<li><a href="mailto:' + esc(s.email) + '">' + esc(s.email) + '</a></li>' +
          s.locations.map((loc) => '<li>' + esc(L(loc.city)) + '</li>').join('') +
        '</ul></div>' +
      '</div>' +
      '<div class="container footer-bottom"><span>© ' + new Date().getFullYear() + ' By Herba. <span data-i18n="footer.rights"></span></span></div>';

    let drawer = $('#cart-drawer');
    if (!drawer) {
      drawer = document.createElement('div');
      drawer.id = 'cart-drawer';
      drawer.className = 'drawer';
      drawer.setAttribute('aria-hidden', 'true');
      document.body.appendChild(drawer);

      const fab = document.createElement('div');
      fab.className = 'fab';
      fab.innerHTML =
        '<a href="https://t.me/' + esc(s.telegram) + '" target="_blank" rel="noopener" class="fab-tg" aria-label="Telegram">' + ICON.telegram + '</a>' +
        '<a href="' + waLink() + '" target="_blank" rel="noopener" class="fab-wa" aria-label="WhatsApp">' + ICON.whatsapp + '</a>';
      document.body.appendChild(fab);

      const tst = document.createElement('div');
      tst.id = 'toast';
      tst.className = 'toast';
      tst.setAttribute('role', 'status');
      document.body.appendChild(tst);
    }

    $$('.lang-switch button').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));
    $('#cart-open').addEventListener('click', openDrawer);
    $('#menu-toggle').addEventListener('click', () => {
      const nav = $('#main-nav');
      const open = nav.classList.toggle('open');
      $('#menu-toggle').setAttribute('aria-expanded', String(open));
    });
    $$('#main-nav a').forEach((a) => a.addEventListener('click', () => $('#main-nav').classList.remove('open')));

    renderCartCount();
    renderDrawer();
  }

  function renderCartCount() {
    const el = $('#cart-count');
    if (!el) return;
    const n = getCart().reduce((s, i) => s + i.qty, 0);
    el.textContent = n;
    el.hidden = n === 0;
  }

  function cartLines(cart, editable) {
    return cart.map((i) => {
      const p = findProduct(i.id);
      return '<div class="cart-line">' +
        '<a href="product.html?id=' + encodeURIComponent(p.id) + '" class="cart-thumb">' + productArt(p) + '</a>' +
        '<div class="cart-info"><a href="product.html?id=' + encodeURIComponent(p.id) + '" class="cart-name">' + esc(L(p.name)) + '</a>' +
          '<div class="cart-meta">' + esc(p.volume || '') + '</div>' +
          (editable
            ? '<div class="qty" data-id="' + esc(p.id) + '"><button type="button" data-d="-1" aria-label="-">−</button><span>' + i.qty + '</span><button type="button" data-d="1" aria-label="+">+</button></div>'
            : '<div class="cart-meta">× ' + i.qty + '</div>') +
        '</div>' +
        '<div class="cart-price">' + money(p.price * i.qty) +
          (editable ? '<button type="button" class="link-btn" data-remove="' + esc(p.id) + '">' + esc(t('cart.remove')) + '</button>' : '') +
        '</div></div>';
    }).join('');
  }

  function totalsHtml(tt) {
    return '<div class="totals">' +
      (tt.subtotal > 0 ? '<div class="free-note' + (tt.left === 0 ? ' ok' : '') + '">' +
        esc(tt.left === 0 ? t('cart.freeOk') : t('cart.freeLeft', { x: money(tt.left) })) + '</div>' : '') +
      '<div class="row"><span>' + esc(t('cart.subtotal')) + '</span><span>' + money(tt.subtotal) + '</span></div>' +
      '<div class="row"><span>' + esc(t('cart.delivery')) + '</span><span>' + (tt.delivery === 0 ? esc(t('cart.free')) : money(tt.delivery)) + '</span></div>' +
      '<div class="row total"><span>' + esc(t('cart.total')) + '</span><span>' + money(tt.total) + '</span></div></div>';
  }

  function bindQty(root) {
    $$('.qty[data-id] button', root).forEach((b) => b.addEventListener('click', () => {
      const id = b.parentElement.dataset.id;
      const item = getCart().find((i) => i.id === id);
      setQty(id, (item ? item.qty : 0) + Number(b.dataset.d));
      if (document.body.dataset.page === 'checkout') renderCheckoutSummary();
    }));
    $$('[data-remove]', root).forEach((b) => b.addEventListener('click', () => {
      setQty(b.dataset.remove, 0);
      if (document.body.dataset.page === 'checkout') renderCheckoutSummary();
    }));
  }

  function renderDrawer() {
    const drawer = $('#cart-drawer');
    if (!drawer) return;
    const cart = getCart();
    drawer.innerHTML =
      '<div class="drawer-backdrop" data-close></div>' +
      '<aside class="drawer-panel" role="dialog" aria-modal="true" aria-labelledby="drawer-title">' +
        '<div class="drawer-head"><h3 id="drawer-title">' + esc(t('cart.title')) + '</h3>' +
          '<button type="button" class="icon-btn" data-close aria-label="' + esc(t('cart.close')) + '">' + ICON.close + '</button></div>' +
        (cart.length === 0
          ? '<div class="drawer-empty"><div class="empty-icon">' + ICON.cart + '</div><p>' + esc(t('cart.empty')) + '</p>' +
            '<a href="catalog.html" class="btn btn-primary">' + esc(t('hero.cta')) + '</a></div>'
          : '<div class="drawer-body">' + cartLines(cart, true) + '</div>' +
            '<div class="drawer-foot">' + totalsHtml(cartTotals(cart)) +
            '<a href="checkout.html" class="btn btn-primary btn-block">' + esc(t('cart.checkout')) + '</a>' +
            '<button type="button" class="btn btn-ghost btn-block" data-close>' + esc(t('cart.continue')) + '</button></div>') +
      '</aside>';
    $$('[data-close]', drawer).forEach((el) => el.addEventListener('click', closeDrawer));
    bindQty(drawer);
  }

  function openDrawer() {
    const d = $('#cart-drawer');
    d.classList.add('open');
    d.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    const btn = $('[data-close].icon-btn', d);
    if (btn) btn.focus();
  }

  function closeDrawer() {
    const d = $('#cart-drawer');
    d.classList.remove('open');
    d.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
  }

  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && $('#cart-drawer.open')) closeDrawer(); });

  let toastTimer;
  function toast(msg) {
    const el = $('#toast');
    if (!el) return;
    el.innerHTML = ICON.check + '<span>' + esc(msg) + '</span>';
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
  }

  /* ---------- Карточка товара ---------- */

  function productCard(p) {
    const url = 'product.html?id=' + encodeURIComponent(p.id);
    const sale = p.oldPrice && p.oldPrice > p.price;
    return '<article class="product-card">' +
      '<a href="' + url + '" class="product-img">' + productArt(p) +
        (sale ? '<span class="badge-sale">−' + Math.round((1 - p.price / p.oldPrice) * 100) + '%</span>' : '') + '</a>' +
      '<div class="product-body">' +
        '<div class="product-cat">' + esc(t('cat.' + p.category)) + (p.volume ? ' · ' + esc(p.volume) : '') + '</div>' +
        '<h3 class="product-name"><a href="' + url + '">' + esc(L(p.name)) + '</a></h3>' +
        '<div class="product-foot"><div class="price">' + money(p.price) + (sale ? ' <s>' + money(p.oldPrice) + '</s>' : '') + '</div>' +
        (p.inStock
          ? '<button type="button" class="btn btn-sm btn-primary" data-add="' + esc(p.id) + '">' + esc(t('product.add')) + '</button>'
          : '<span class="muted small">' + esc(t('product.outOfStock')) + '</span>') +
        '</div></div></article>';
  }

  function bindAdd(root) {
    $$('[data-add]', root).forEach((b) => b.addEventListener('click', () => addToCart(b.dataset.add, 1)));
  }

  /* ---------- Страницы ---------- */

  const pages = {
    home: function () {
      const s = state.settings;
      $('#home-cats').innerHTML = state.catalog.categories.map((c) => {
        const p = state.catalog.products.find((x) => x.category === c);
        return '<a class="cat-card" href="catalog.html?cat=' + c + '"><div class="cat-art">' + (p ? productArt(p) : '') + '</div>' +
          '<div class="cat-text"><h3>' + esc(t('cat.' + c)) + '</h3><p>' + esc(t('catdesc.' + c)) + '</p></div></a>';
      }).join('');

      const featured = state.catalog.products.filter((p) => p.featured).slice(0, 4);
      $('#home-featured').innerHTML = featured.map(productCard).join('');
      bindAdd($('#home-featured'));

      const revs = s.reviews || [];
      $('#reviews').hidden = revs.length === 0;
      $('#home-reviews').innerHTML = revs.map((r) =>
        '<figure class="review">' + (r.sample ? '<span class="sample-tag">' + esc(t('reviews.sample')) + '</span>' : '') +
        '<div class="stars">' + ICON.star.repeat(Math.max(0, Math.min(5, r.rating || 5))) + '</div>' +
        '<blockquote>' + esc(r.text) + '</blockquote>' +
        '<figcaption><strong>' + esc(r.name) + '</strong>' + (r.city ? ' · ' + esc(r.city) : '') + '</figcaption></figure>'
      ).join('');

      $('#delivery-free').textContent = t('delivery.d3.d', { x: money(s.delivery.freeFrom), y: money(s.delivery.cost) });
      $$('[data-pay]').forEach((el) => { el.hidden = !s.payments[el.dataset.pay]; });

      $('#locations').innerHTML = s.locations.map((loc) =>
        '<div class="location"><div class="loc-icon">' + ICON.pin + '</div><div><strong>' + esc(L(loc.city)) + '</strong>' +
        '<p>' + esc(loc.address) + '</p><p class="muted">' + esc(L(loc.hours)) + '</p></div></div>'
      ).join('') +
        '<div class="contact-links">' +
        '<a class="contact-link" href="tel:' + esc(s.phone.replace(/\s/g, '')) + '">' + ICON.phone + esc(s.phone) + '</a>' +
        '<a class="contact-link" href="mailto:' + esc(s.email) + '">' + ICON.mail + esc(s.email) + '</a>' +
        '<a class="contact-link" href="' + waLink() + '" target="_blank" rel="noopener">' + ICON.whatsapp + 'WhatsApp</a>' +
        '<a class="contact-link" href="https://t.me/' + esc(s.telegram) + '" target="_blank" rel="noopener">' + ICON.telegram + 'Telegram</a>' +
        '<a class="contact-link" href="https://instagram.com/' + esc(s.instagram) + '" target="_blank" rel="noopener">' + ICON.instagram + 'Instagram</a></div>';

      $('#hero-wa').href = waLink();
      const diffusers = state.catalog.products.filter((x) => x.category === 'diffuser');
      const heroPicks = [diffusers[0], diffusers[2] || diffusers[1], state.catalog.products.find((x) => x.category === 'soap')].filter(Boolean);
      $$('.hero-art .art').forEach((el, i) => { el.innerHTML = heroPicks[i] ? productArt(heroPicks[i]) : ''; });
    },

    catalog: function () {
      const params = new URLSearchParams(location.search);
      const ui = pages.catalog.ui || (pages.catalog.ui = { cat: params.get('cat') || 'all', q: '', sort: 'popular' });

      $('#cat-filters').innerHTML = ['all'].concat(state.catalog.categories).map((c) =>
        '<button type="button" class="chip' + (ui.cat === c ? ' active' : '') + '" data-cat="' + c + '">' + esc(t('cat.' + c)) + '</button>'
      ).join('');
      $$('#cat-filters .chip').forEach((b) => b.addEventListener('click', () => {
        ui.cat = b.dataset.cat;
        const u = new URL(location.href);
        if (ui.cat === 'all') u.searchParams.delete('cat'); else u.searchParams.set('cat', ui.cat);
        history.replaceState(null, '', u);
        pages.catalog();
      }));

      const search = $('#cat-search');
      const sort = $('#cat-sort');
      if (!search.dataset.bound) {
        search.dataset.bound = '1';
        search.addEventListener('input', () => { ui.q = search.value.trim().toLowerCase(); pages.catalog(); });
        sort.addEventListener('change', () => { ui.sort = sort.value; pages.catalog(); });
      }
      sort.value = ui.sort;

      let list = state.catalog.products.filter((p) =>
        (ui.cat === 'all' || p.category === ui.cat) &&
        (!ui.q || [p.name.ru, p.name.tr, p.name.en, L(p.notes)].join(' ').toLowerCase().includes(ui.q))
      );
      if (ui.sort === 'priceAsc') list = list.slice().sort((a, b) => a.price - b.price);
      else if (ui.sort === 'priceDesc') list = list.slice().sort((a, b) => b.price - a.price);
      else list = list.slice().sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

      $('#cat-grid').innerHTML = list.length
        ? list.map(productCard).join('')
        : '<p class="empty-state">' + esc(t('catalog.empty')) + '</p>';
      bindAdd($('#cat-grid'));
    },

    product: function () {
      const p = findProduct(new URLSearchParams(location.search).get('id'));
      const root = $('#product');
      if (!p) {
        root.innerHTML = '<div class="empty-state"><h1>' + esc(t('product.notFound')) + '</h1><a class="btn btn-primary" href="catalog.html">' + esc(t('hero.cta')) + '</a></div>';
        return;
      }
      document.title = L(p.name) + ' — By Herba';
      const sale = p.oldPrice && p.oldPrice > p.price;
      root.innerHTML =
        '<nav class="crumbs"><a href="catalog.html">' + esc(t('catalog.title')) + '</a> / <a href="catalog.html?cat=' + p.category + '">' + esc(t('cat.' + p.category)) + '</a></nav>' +
        '<div class="product-page">' +
          '<div class="product-gallery">' + productArt(p) + '</div>' +
          '<div class="product-detail">' +
            '<div class="product-cat">' + esc(t('cat.' + p.category)) + '</div>' +
            '<h1>' + esc(L(p.name)) + '</h1>' +
            '<div class="price price-lg">' + money(p.price) + (sale ? ' <s>' + money(p.oldPrice) + '</s>' : '') + '</div>' +
            '<p class="stock ' + (p.inStock ? 'in' : 'out') + '">' + esc(t(p.inStock ? 'product.inStock' : 'product.outOfStock')) + '</p>' +
            '<p class="lead">' + esc(L(p.description) || t('desc.' + p.category)) + '</p>' +
            '<dl class="specs">' +
              (p.volume ? '<div><dt>' + esc(t('product.volume')) + '</dt><dd>' + esc(p.volume) + '</dd></div>' : '') +
              (L(p.notes) ? '<div><dt>' + esc(t('product.notes')) + '</dt><dd>' + esc(L(p.notes)) + '</dd></div>' : '') +
            '</dl>' +
            (p.inStock
              ? '<div class="buy-row"><div class="qty qty-lg" id="pqty"><button type="button" data-d="-1" aria-label="-">−</button><span>1</span><button type="button" data-d="1" aria-label="+">+</button></div>' +
                '<button type="button" class="btn btn-primary" id="padd">' + esc(t('product.add')) + '</button></div>'
              : '') +
            '<a class="btn btn-wa" target="_blank" rel="noopener" href="' + waLink(t('product.waText', { x: L(p.name) })) + '">' + ICON.whatsapp + esc(t('product.buyWa')) + '</a>' +
            (p.category === 'diffuser' || p.category === 'soap'
              ? '<div class="howto"><h3>' + esc(t('how.title')) + '</h3><p>' + esc(t('how.' + p.category)) + '</p></div>' : '') +
            '<ul class="perks"><li>' + ICON.truck + esc(t('b2.d')) + '</li><li>' + ICON.gift + esc(t('faq.a5')) + '</li></ul>' +
          '</div></div>';

      if (p.inStock) {
        let qty = 1;
        $$('#pqty button').forEach((b) => b.addEventListener('click', () => {
          qty = Math.max(1, Math.min(99, qty + Number(b.dataset.d)));
          $('#pqty span').textContent = qty;
        }));
        $('#padd').addEventListener('click', () => addToCart(p.id, qty));
      }

      const related = state.catalog.products.filter((x) => x.id !== p.id && x.inStock)
        .sort((a, b) => (b.category === p.category) - (a.category === p.category)).slice(0, 4);
      $('#related').innerHTML = related.map(productCard).join('');
      bindAdd($('#related'));
    },

    checkout: function () {
      const s = state.settings;
      const methods = [
        { id: 'card', icon: ICON.card },
        { id: 'transfer', icon: ICON.bank },
        { id: 'cash', icon: ICON.cash }
      ].filter((m) => s.payments[m.id]);
      const box = $('#pay-methods');
      const current = ($('input[name="payment"]:checked', box) || {}).value || methods[0].id;
      box.innerHTML = methods.map((m) =>
        '<label class="pay-option"><input type="radio" name="payment" value="' + m.id + '"' + (m.id === current ? ' checked' : '') + '>' +
        '<span class="pay-icon">' + m.icon + '</span><span><strong>' + esc(t('pay.' + m.id)) + '</strong><small>' + esc(t('pay.' + m.id + 'Desc')) + '</small></span></label>'
      ).join('');

      const citySel = $('#f-city');
      const cityVal = citySel.value;
      citySel.innerHTML = s.locations.map((loc) => '<option value="' + esc(loc.city.tr) + '">' + esc(L(loc.city)) + '</option>').join('') +
        '<option value="other">' + esc(t('checkout.cityOther')) + '</option>';
      if (cityVal) citySel.value = cityVal;
      if (!citySel.dataset.bound) {
        citySel.dataset.bound = '1';
        citySel.addEventListener('change', () => { $('#f-city-other-wrap').hidden = citySel.value !== 'other'; });
        $('#checkout-form').addEventListener('submit', submitOrder);
      }
      $('#f-city-other-wrap').hidden = citySel.value !== 'other';
      $('#f-email').required = !!s.payments.card;
      renderCheckoutSummary();
    },

    success: function () {
      const params = new URLSearchParams(location.search);
      const id = params.get('order') || '';
      if (params.get('paid') === '1' || params.get('pay') === 'card') clearCart();
      $('#order-id').textContent = id;
      $('#order-id-wrap').hidden = !id;
      $('#paid-note').hidden = params.get('pay') !== 'card';
      const b = state.settings.bank;
      const tr = $('#transfer-info');
      tr.hidden = params.get('pay') !== 'transfer';
      $('#bank-details').innerHTML =
        '<div><dt>Banka</dt><dd>' + esc(b.bank) + '</dd></div>' +
        '<div><dt>Alıcı</dt><dd>' + esc(b.holder) + '</dd></div>' +
        '<div><dt>IBAN</dt><dd class="mono">' + esc(b.iban) + '</dd></div>';
    },

    fail: function () {
      $('#fail-wa').href = waLink();
    },

    legal: function () {},
    notfound: function () {}
  };

  /* ---------- Оформление заказа ---------- */

  function renderCheckoutSummary() {
    const cart = getCart();
    const wrap = $('#checkout-wrap');
    if (cart.length === 0) {
      wrap.hidden = true;
      $('#checkout-empty').hidden = false;
      return;
    }
    wrap.hidden = false;
    $('#checkout-empty').hidden = true;
    $('#summary-lines').innerHTML = cartLines(cart, true);
    $('#summary-totals').innerHTML = totalsHtml(cartTotals(cart));
    bindQty($('#summary-lines'));
  }

  function orderText(data) {
    const cart = getCart();
    const tt = cartTotals(cart);
    return [
      'By Herba — ' + t('checkout.title'),
      cart.map((i) => '• ' + L(findProduct(i.id).name) + ' × ' + i.qty).join('\n'),
      t('cart.total') + ': ' + money(tt.total),
      data.name + ', ' + data.phone,
      data.city + ', ' + data.address,
      data.comment ? '“' + data.comment + '”' : ''
    ].filter(Boolean).join('\n');
  }

  async function submitOrder(e) {
    e.preventDefault();
    const form = e.target;
    const msg = $('#checkout-msg');
    msg.hidden = true;
    msg.className = 'form-msg';

    const fd = new FormData(form);
    const city = fd.get('city') === 'other' ? String(fd.get('cityOther') || '').trim() : fd.get('city');
    const data = {
      name: String(fd.get('name') || '').trim(),
      phone: String(fd.get('phone') || '').trim(),
      email: String(fd.get('email') || '').trim(),
      city: city,
      address: String(fd.get('address') || '').trim(),
      comment: String(fd.get('comment') || '').trim()
    };
    const payment = fd.get('payment');

    if (payment === 'card' && !data.email) {
      $('#f-email').focus();
      showMsg(msg, t('checkout.emailCard'), true);
      return;
    }
    if (fd.get('city') === 'other' && !city) { $('#f-city-other').focus(); return; }

    const btn = $('#checkout-submit');
    btn.disabled = true;
    btn.textContent = t('checkout.processing');

    try {
      const res = await fetch(API + '/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lang: state.lang,
          customer: data,
          payment: payment,
          items: getCart(),
          website: fd.get('website') || ''
        })
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || !out.ok) {
        if (out.code === 'card_unavailable') {
          showMsg(msg, t('checkout.cardError'), true,
            '<a class="btn btn-wa" target="_blank" rel="noopener" href="' + waLink(orderText(data)) + '">' + ICON.whatsapp + esc(t('checkout.waFallback')) + '</a>');
          return;
        }
        throw new Error(out.error || 'order failed');
      }
      if (payment === 'card' && out.paytrToken) {
        $('#checkout-wrap').hidden = true;
        const pay = $('#card-payment');
        pay.hidden = false;
        $('#paytr-frame').src = 'https://www.paytr.com/odeme/guvenli/' + encodeURIComponent(out.paytrToken);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      clearCart();
      location.href = 'success.html?order=' + encodeURIComponent(out.orderId) + '&pay=' + encodeURIComponent(payment);
    } catch (err) {
      showMsg(msg, t('checkout.error'), true,
        '<a class="btn btn-wa" target="_blank" rel="noopener" href="' + waLink(orderText(data)) + '">' + ICON.whatsapp + esc(t('checkout.waFallback')) + '</a>');
    } finally {
      btn.disabled = false;
      btn.textContent = t('checkout.submit');
    }
  }

  function showMsg(el, text, isError, extraHtml) {
    el.hidden = false;
    el.className = 'form-msg ' + (isError ? 'error' : 'ok');
    el.innerHTML = '<p>' + esc(text) + '</p>' + (extraHtml || '');
  }

  /* ---------- Форма обратной связи ---------- */

  function bindContactForm() {
    const form = $('#contact-form');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = $('#contact-msg');
      const btn = $('button[type="submit"]', form);
      const fd = new FormData(form);
      btn.disabled = true;
      btn.textContent = t('form.sending');
      try {
        const res = await fetch(API + '/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(Object.fromEntries(fd.entries()))
        });
        if (!res.ok) throw new Error('contact failed');
        form.reset();
        showMsg(msg, t('form.sent'), false);
      } catch (err) {
        showMsg(msg, t('form.error'), true,
          '<a class="btn btn-wa" target="_blank" rel="noopener" href="' + waLink(String(fd.get('message') || '')) + '">' + ICON.whatsapp + 'WhatsApp</a>');
      } finally {
        btn.disabled = false;
        btn.textContent = t('form.send');
      }
    });
  }

  /* ---------- Язык и запуск ---------- */

  function setLang(lang) {
    if (!LANGS.includes(lang) || lang === state.lang) return;
    state.lang = lang;
    storage((s) => s.setItem(LANG_KEY, lang));
    const u = new URL(location.href);
    if (u.searchParams.has('lang')) { u.searchParams.set('lang', lang); history.replaceState(null, '', u); }
    render();
  }

  function render() {
    document.documentElement.lang = state.lang;
    const page = document.body.dataset.page;
    const titleKey = document.body.dataset.title;
    document.title = titleKey ? t(titleKey) + ' — By Herba' : t('meta.title');
    const meta = $('meta[name="description"]');
    if (meta) meta.content = t('meta.description');
    renderLayout();
    if (pages[page]) pages[page]();
    applyI18n(document);
  }

  async function init() {
    try {
      await loadData();
    } catch (e) {
      document.body.insertAdjacentHTML('afterbegin', '<p class="load-error">Site data could not be loaded. Open the site through a web server (see README).</p>');
      return;
    }
    render();
    bindContactForm();
    if (location.hash) {
      const target = document.getElementById(location.hash.slice(1));
      if (target) setTimeout(() => target.scrollIntoView(), 50);
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
