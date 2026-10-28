/* Панель управления Wees Mod (на турецком): вход по паролю, список товаров, редактор, настройки. */
(function () {
  'use strict';

  const T = {
    tr: {
      title: 'Yönetim', password: 'Şifre', login: 'Giriş yap', wrong: 'Şifre yanlış',
      noPassword: 'Sunucuda şifre ayarlanmamış (ADMIN_PASSWORD).', offline: 'Sunucuya bağlanılamadı. Site Netlify üzerinde mi açık?',
      products: 'Ürünler', settings: 'Ayarlar', add: '+ Yeni ürün', edit: 'Düzenle', del: 'Sil', up: '↑', down: '↓',
      inStock: 'Stokta', soldOut: 'Tükendi', featured: 'Öne çıkan', askPrice: 'Fiyat için yazın', colors: 'renk',
      confirmDel: 'Bu ürün silinsin mi?', saved: 'Kaydedildi. Sitede hemen görünür.', saveErr: 'Kaydedilemedi: ',
      newProduct: 'Yeni ürün', editProduct: 'Ürünü düzenle',
      nameTr: 'Ürün adı (Türkçe) *', otherLangs: 'İngilizce ve Arapça ad (isteğe bağlı)', nameEn: 'Ürün adı (İngilizce)', nameAr: 'Ürün adı (Arapça)',
      gender: 'Kategori', girl: 'Kız', boy: 'Erkek', unisex: 'Kız ve Erkek', season: 'Sezon', winter: 'Eşofman / Kışlık', summer: 'Yazlık',
      price: 'Fiyat (TL)', priceHint: 'Boş bırakırsanız sitede "Fiyat için yazın" yazar.',
      featuredLabel: 'Ana sayfada öne çıkar', stockLabel: 'Stokta var',
      colorsTitle: 'Renkler ve fotoğraflar', addColor: '+ Renk ekle', removeColor: 'Rengi sil', colorName: 'Renk adı',
      colorOther: 'Renk adı İngilizce / Arapça', photo: 'Fotoğraf seç', uploading: 'Yükleniyor…',
      save: 'Kaydet', cancel: 'Vazgeç', back: '← Ürünler',
      needName: 'Türkçe ürün adını yazın.', needPhoto: 'Her renk için bir fotoğraf ekleyin.', needColor: 'En az bir renk ekleyin.',
      whatsapp: 'WhatsApp numarası', waHint: 'Örnek: 905321234567. Boş bırakırsanız WhatsApp butonları görünmez.',
      instagram: 'Instagram kullanıcı adı', sizes: 'Bedenler (virgülle)', sizesHint: 'Örnek: 2-3, 4-5, 6-7',
      saveSettings: 'Ayarları kaydet', logout: 'Çıkış', view: 'Siteyi aç', empty: 'Henüz ürün yok.'
    }
  };

  const state = {
    lang: 'tr',
    key: store('get', 'wm_admin_key') || '',
    catalog: null,
    tab: 'products',
    draft: null,
    draftIndex: -1,
    busy: false
  };

  function store(op, k, v) {
    try {
      if (op === 'get') return localStorage.getItem(k);
      if (op === 'set') localStorage.setItem(k, v);
      if (op === 'del') localStorage.removeItem(k);
    } catch (e) { return null; }
    return null;
  }

  const t = (k) => (T[state.lang] && T[state.lang][k]) || T.tr[k] || k;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const imgSrc = (u) => (u ? (u.charAt(0) === '/' ? u : '../' + u) : '');
  const app = () => $('#app');

  let toastTimer;
  function toast(msg, bad) {
    const el = $('#toast');
    el.textContent = msg;
    el.className = 'toast show' + (bad ? ' bad' : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.className = 'toast'; }, 2600);
  }

  async function api(method, path, body, type) {
    const headers = { 'x-admin-key': state.key };
    if (type) headers['content-type'] = type;
    else if (body !== undefined) headers['content-type'] = 'application/json';
    const res = await fetch(path, { method, headers, body: type ? body : (body !== undefined ? JSON.stringify(body) : undefined) });
    const out = await res.json().catch(() => ({}));
    if (!res.ok) { const err = new Error(out.error || ('HTTP ' + res.status)); err.status = res.status; throw err; }
    return out;
  }

  /* ---------- Шапка ---------- */

  function top(loggedIn) {
    return '<header class="top"><div class="top-inner">' +
      '<span class="brand">wees mod<small>' + esc(t('title')) + '</small></span><span class="spacer"></span>' +
      (loggedIn ? '<a class="view" href="../" target="_blank" rel="noopener">' + esc(t('view')) + '</a>' : '') +
      '</div></header>';
  }

  function bindTop() {}

  /* ---------- Вход ---------- */

  function renderLogin(error) {
    app().innerHTML = top(false) +
      '<div class="wrap"><form class="card login" id="login">' +
        '<h1>wees mod</h1>' +
        '<div class="field"><label for="pw">' + esc(t('password')) + '</label><input id="pw" type="password" autocomplete="current-password" required></div>' +
        '<button class="btn btn-dark btn-block" type="submit">' + esc(t('login')) + '</button>' +
        (error ? '<p class="error">' + esc(error) + '</p>' : '') +
      '</form></div>';
    bindTop();
    $('#pw').focus();
    $('#login').addEventListener('submit', async (e) => {
      e.preventDefault();
      state.key = $('#pw').value;
      await tryLogin();
    });
  }

  async function tryLogin() {
    try {
      state.catalog = await api('GET', '/api/admin/catalog');
      store('set', 'wm_admin_key', state.key);
      render();
    } catch (err) {
      store('del', 'wm_admin_key');
      const msg = err.status === 401 ? t('wrong') : err.status === 503 ? t('noPassword') : t('offline');
      state.key = '';
      renderLogin(msg);
    }
  }

  /* ---------- Список товаров ---------- */

  function renderList() {
    const products = state.catalog.products;
    app().innerHTML = top(true) + '<div class="wrap">' + tabs() +
      '<button type="button" class="btn btn-gold btn-block" id="add" style="margin-bottom:14px">' + esc(t('add')) + '</button>' +
      (products.length ? '<div class="list">' + products.map((p, i) =>
        '<div class="item">' +
          '<img src="' + esc(imgSrc(p.variants[0] && p.variants[0].image)) + '" alt="" loading="lazy">' +
          '<div class="item-info">' +
            '<div class="item-name">' + esc(p.name.tr) + '</div>' +
            '<div class="item-meta">' + (p.price != null ? esc(p.price) + ' TL' : esc(t('askPrice'))) + ' · ' + p.variants.length + ' ' + esc(t('colors')) + '</div>' +
            '<div>' + (p.inStock ? '<span class="pill">' + esc(t('inStock')) + '</span>' : '<span class="pill off">' + esc(t('soldOut')) + '</span>') +
              (p.featured ? ' <span class="pill star">★ ' + esc(t('featured')) + '</span>' : '') + '</div>' +
            '<div class="item-actions">' +
              '<button type="button" class="btn btn-dark btn-sm" data-edit="' + i + '">' + esc(t('edit')) + '</button>' +
              '<button type="button" class="btn btn-line btn-sm" data-stock="' + i + '">' + esc(p.inStock ? t('soldOut') : t('inStock')) + '</button>' +
              '<button type="button" class="btn btn-line btn-sm" data-move="' + i + ':-1" aria-label="up"' + (i === 0 ? ' disabled' : '') + '>' + t('up') + '</button>' +
              '<button type="button" class="btn btn-line btn-sm" data-move="' + i + ':1" aria-label="down"' + (i === products.length - 1 ? ' disabled' : '') + '>' + t('down') + '</button>' +
              '<button type="button" class="btn btn-danger btn-sm" data-del="' + i + '">' + esc(t('del')) + '</button>' +
            '</div>' +
          '</div></div>').join('') + '</div>'
        : '<p class="muted">' + esc(t('empty')) + '</p>') +
      '</div>';
    bindTop();
    bindTabs();
    $('#add').addEventListener('click', () => openEditor(-1));
    $$('[data-edit]').forEach((b) => b.addEventListener('click', () => openEditor(Number(b.dataset.edit))));
    $$('[data-stock]').forEach((b) => b.addEventListener('click', () => {
      const p = state.catalog.products[Number(b.dataset.stock)];
      p.inStock = !p.inStock;
      save();
    }));
    $$('[data-move]').forEach((b) => b.addEventListener('click', () => {
      const [i, d] = b.dataset.move.split(':').map(Number);
      const list = state.catalog.products;
      const j = i + d;
      if (j < 0 || j >= list.length) return;
      [list[i], list[j]] = [list[j], list[i]];
      save();
    }));
    $$('[data-del]').forEach((b) => b.addEventListener('click', () => {
      if (!confirm(t('confirmDel'))) return;
      state.catalog.products.splice(Number(b.dataset.del), 1);
      save();
    }));
  }

  function tabs() {
    return '<div class="tabs">' +
      '<button type="button" class="tab' + (state.tab === 'products' ? ' active' : '') + '" data-tab="products">' + esc(t('products')) + '</button>' +
      '<button type="button" class="tab' + (state.tab === 'settings' ? ' active' : '') + '" data-tab="settings">' + esc(t('settings')) + '</button>' +
      '</div>';
  }

  function bindTabs() {
    $$('[data-tab]').forEach((b) => b.addEventListener('click', () => { state.tab = b.dataset.tab; render(); }));
  }

  async function save(after) {
    if (state.busy) return false;
    state.busy = true;
    try {
      const out = await api('PUT', '/api/admin/catalog', state.catalog);
      state.catalog = out.catalog;
      toast(t('saved'));
      if (after) after();
      else render();
      return true;
    } catch (err) {
      toast(t('saveErr') + err.message, true);
      if (err.status === 401) { state.key = ''; store('del', 'wm_admin_key'); renderLogin(t('wrong')); }
      return false;
    } finally {
      state.busy = false;
    }
  }

  /* ---------- Редактор товара ---------- */

  const blankVariant = () => ({ color: { tr: '', en: '', ar: '' }, hex: '#cccccc', image: '' });

  function openEditor(index) {
    state.draftIndex = index;
    state.draft = index >= 0
      ? JSON.parse(JSON.stringify(state.catalog.products[index]))
      : { id: '', gender: 'girl', season: 'winter', name: { tr: '', en: '', ar: '' }, price: null, featured: false, inStock: true, variants: [blankVariant()] };
    renderEditor();
    window.scrollTo(0, 0);
  }

  function slug(s) {
    const map = { ç: 'c', ğ: 'g', ı: 'i', i̇: 'i', ö: 'o', ş: 's', ü: 'u' };
    const base = s.toLocaleLowerCase('tr').replace(/[çğıöşü]/g, (c) => map[c] || c).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
    return (base || 'urun') + '-' + Math.random().toString(36).slice(2, 6);
  }

  function renderEditor(error) {
    const d = state.draft;
    const opt = (v, cur, label) => '<option value="' + v + '"' + (v === cur ? ' selected' : '') + '>' + esc(t(label)) + '</option>';
    app().innerHTML = top(true) + '<div class="wrap">' +
      '<button type="button" class="btn btn-line btn-sm" id="back">' + esc(t('back')) + '</button>' +
      '<h1 style="margin-top:12px">' + esc(t(state.draftIndex >= 0 ? 'editProduct' : 'newProduct')) + '</h1>' +
      '<div class="card">' +
        '<div class="field"><label for="n-tr">' + esc(t('nameTr')) + '</label><input id="n-tr" value="' + esc(d.name.tr) + '" maxlength="120"></div>' +
        '<details' + (d.name.en || d.name.ar ? ' open' : '') + '><summary>' + esc(t('otherLangs')) + '</summary>' +
          '<div class="field"><label for="n-en">' + esc(t('nameEn')) + '</label><input id="n-en" value="' + esc(d.name.en) + '" maxlength="120"></div>' +
          '<div class="field"><label for="n-ar">' + esc(t('nameAr')) + '</label><input id="n-ar" dir="rtl" value="' + esc(d.name.ar) + '" maxlength="120"></div>' +
        '</details>' +
        '<div class="row2">' +
          '<div class="field"><label for="gender">' + esc(t('gender')) + '</label><select id="gender">' + opt('girl', d.gender, 'girl') + opt('boy', d.gender, 'boy') + opt('unisex', d.gender, 'unisex') + '</select></div>' +
          '<div class="field"><label for="season">' + esc(t('season')) + '</label><select id="season">' + opt('winter', d.season, 'winter') + opt('summer', d.season, 'summer') + '</select></div>' +
        '</div>' +
        '<div class="field"><label for="price">' + esc(t('price')) + '</label><input id="price" type="number" inputmode="decimal" min="0" step="1" value="' + (d.price != null ? esc(d.price) : '') + '"><span class="muted">' + esc(t('priceHint')) + '</span></div>' +
        '<label class="check"><input type="checkbox" id="stock"' + (d.inStock ? ' checked' : '') + '> ' + esc(t('stockLabel')) + '</label>' +
        '<label class="check"><input type="checkbox" id="featured"' + (d.featured ? ' checked' : '') + '> ' + esc(t('featuredLabel')) + '</label>' +
      '</div>' +
      '<h2>' + esc(t('colorsTitle')) + '</h2>' +
      '<div class="variants">' + d.variants.map((v, i) =>
        '<div class="variant" data-i="' + i + '">' +
          '<label class="photo" id="photo-' + i + '">' + (v.image ? '<img src="' + esc(imgSrc(v.image)) + '" alt="">' : esc(t('photo'))) +
            '<input type="file" accept="image/*" data-upload="' + i + '" aria-label="' + esc(t('photo')) + '"></label>' +
          '<div>' +
            '<div class="field"><label>' + esc(t('colorName')) + '</label><div class="color-row">' +
              '<input type="color" data-hex="' + i + '" value="' + esc(v.hex) + '" aria-label="color">' +
              '<input data-ctr="' + i + '" value="' + esc(v.color.tr) + '" maxlength="60" style="flex:1"></div></div>' +
            '<details' + (v.color.en || v.color.ar ? ' open' : '') + '><summary>' + esc(t('colorOther')) + '</summary>' +
              '<div class="field"><input data-cen="' + i + '" placeholder="English" value="' + esc(v.color.en) + '" maxlength="60"></div>' +
              '<div class="field"><input data-car="' + i + '" placeholder="العربية" dir="rtl" value="' + esc(v.color.ar) + '" maxlength="60"></div>' +
            '</details>' +
            (d.variants.length > 1 ? '<button type="button" class="btn btn-danger btn-sm" data-rmv="' + i + '">' + esc(t('removeColor')) + '</button>' : '') +
          '</div>' +
        '</div>').join('') + '</div>' +
      '<button type="button" class="btn btn-line btn-block" id="add-color" style="margin-top:10px">' + esc(t('addColor')) + '</button>' +
      (error ? '<p class="error">' + esc(error) + '</p>' : '') +
      '</div>' +
      '<div class="bar"><div class="bar-inner">' +
        '<button type="button" class="btn btn-line" id="cancel">' + esc(t('cancel')) + '</button>' +
        '<button type="button" class="btn btn-dark" id="save">' + esc(t('save')) + '</button>' +
      '</div></div>';

    bindTop();
    const leave = () => { state.draft = null; render(); };
    $('#back').addEventListener('click', leave);
    $('#cancel').addEventListener('click', leave);
    $('#add-color').addEventListener('click', () => { collect(); d.variants.push(blankVariant()); renderEditor(); });
    $$('[data-rmv]').forEach((b) => b.addEventListener('click', () => { collect(); d.variants.splice(Number(b.dataset.rmv), 1); renderEditor(); }));
    $$('[data-upload]').forEach((inp) => inp.addEventListener('change', () => upload(Number(inp.dataset.upload), inp.files[0])));
    $('#save').addEventListener('click', submit);
  }

  // Переносим введённое в черновик, чтобы не потерять при перерисовке.
  function collect() {
    const d = state.draft;
    d.name = { tr: $('#n-tr').value.trim(), en: $('#n-en').value.trim(), ar: $('#n-ar').value.trim() };
    d.gender = $('#gender').value;
    d.season = $('#season').value;
    const price = $('#price').value.trim();
    d.price = price === '' ? null : Number(price);
    d.inStock = $('#stock').checked;
    d.featured = $('#featured').checked;
    d.variants.forEach((v, i) => {
      v.hex = $('[data-hex="' + i + '"]').value;
      v.color = { tr: $('[data-ctr="' + i + '"]').value.trim(), en: $('[data-cen="' + i + '"]').value.trim(), ar: $('[data-car="' + i + '"]').value.trim() };
    });
  }

  // Уменьшаем фото в браузере (до 1200px по длинной стороне), чтобы загрузка была быстрой.
  function resize(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, 1200 / Math.max(img.naturalWidth, img.naturalHeight));
        const c = document.createElement('canvas');
        c.width = Math.round(img.naturalWidth * scale);
        c.height = Math.round(img.naturalHeight * scale);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob((b) => (b ? resolve(b) : reject(new Error('resize failed'))), 'image/jpeg', 0.85);
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Bad image')); };
      img.src = url;
    });
  }

  async function upload(i, file) {
    if (!file) return;
    collect();
    const box = $('#photo-' + i);
    box.classList.add('busy');
    try {
      const blob = await resize(file);
      const out = await api('POST', '/api/admin/upload', blob, 'image/jpeg');
      state.draft.variants[i].image = out.url;
      renderEditor();
    } catch (err) {
      box.classList.remove('busy');
      toast(t('saveErr') + err.message, true);
    }
  }

  async function submit() {
    collect();
    const d = state.draft;
    if (!d.name.tr) return renderEditor(t('needName'));
    if (!d.variants.length) return renderEditor(t('needColor'));
    if (d.variants.some((v) => !v.image)) return renderEditor(t('needPhoto'));
    d.variants.forEach((v) => { if (!v.color.tr) v.color.tr = '-'; });
    if (!d.id) d.id = slug(d.name.tr);

    const products = state.catalog.products;
    const before = JSON.stringify(products);
    if (state.draftIndex >= 0) products[state.draftIndex] = d;
    else products.unshift(d);
    const ok = await save(() => { state.draft = null; render(); });
    if (!ok) { state.catalog.products = JSON.parse(before); }
  }

  /* ---------- Настройки ---------- */

  function renderSettings() {
    const s = state.catalog.settings || {};
    app().innerHTML = top(true) + '<div class="wrap">' + tabs() +
      '<div class="card">' +
        '<div class="field"><label for="wa">' + esc(t('whatsapp')) + '</label><input id="wa" inputmode="tel" value="' + esc(s.whatsapp || '') + '"><span class="muted">' + esc(t('waHint')) + '</span></div>' +
        '<div class="field"><label for="ig">' + esc(t('instagram')) + '</label><input id="ig" value="' + esc(s.instagram || '') + '"></div>' +
        '<div class="field"><label for="sizes">' + esc(t('sizes')) + '</label><input id="sizes" value="' + esc((s.sizes || []).join(', ')) + '"><span class="muted">' + esc(t('sizesHint')) + '</span></div>' +
        '<button type="button" class="btn btn-dark btn-block" id="save-settings">' + esc(t('saveSettings')) + '</button>' +
      '</div>' +
      '<button type="button" class="btn btn-line btn-block" id="logout" style="margin-top:20px">' + esc(t('logout')) + '</button>' +
      '</div>';
    bindTop();
    bindTabs();
    $('#save-settings').addEventListener('click', () => {
      state.catalog.settings = {
        whatsapp: $('#wa').value,
        instagram: $('#ig').value,
        sizes: $('#sizes').value.split(',').map((x) => x.trim()).filter(Boolean)
      };
      save();
    });
    $('#logout').addEventListener('click', () => {
      store('del', 'wm_admin_key');
      state.key = '';
      state.catalog = null;
      render();
    });
  }

  /* ---------- Запуск ---------- */

  function render() {
    document.documentElement.lang = state.lang;
    if (!state.catalog) return renderLogin();
    if (state.draft) return renderEditor();
    if (state.tab === 'settings') return renderSettings();
    return renderList();
  }

  if (state.key) tryLogin(); else render();
})();
