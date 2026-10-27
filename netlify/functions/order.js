// Оформление заказа: пересчитывает сумму по каталогу, отправляет заказ в Telegram
// и при оплате картой получает токен платёжной страницы PayTR.
const crypto = require('crypto');
const { json, parseJson, clean, sendTelegram, clientIp } = require('../lib/common');
const catalog = require('../../data/products.json');
const settings = require('../../data/settings.json');

const PAYMENT_NAMES = { card: 'Картой онлайн (PayTR)', transfer: 'Перевод Havale/EFT', cash: 'При получении' };

function orderId() {
  // PayTR принимает только буквы и цифры
  return 'BH' + Date.now().toString(36).toUpperCase() + crypto.randomBytes(2).toString('hex').toUpperCase();
}

const tl = (n) => n.toLocaleString('ru-RU') + ' TL';

async function paytrToken({ id, total, lines, customer, ip, lang }) {
  const merchantId = process.env.PAYTR_MERCHANT_ID;
  const key = process.env.PAYTR_MERCHANT_KEY;
  const salt = process.env.PAYTR_MERCHANT_SALT;
  const site = (process.env.URL || '').replace(/\/$/, '');

  const basket = Buffer.from(JSON.stringify(
    lines.map((l) => [l.product.name.tr, l.product.price.toFixed(2), l.qty])
  )).toString('base64');
  const amount = String(Math.round(total * 100)); // в курушах
  const noInstallment = '0';
  const maxInstallment = '0';
  const currency = 'TL';
  const testMode = process.env.PAYTR_TEST_MODE === '1' ? '1' : '0';

  const hashStr = merchantId + ip + id + customer.email + amount + basket + noInstallment + maxInstallment + currency + testMode;
  const token = crypto.createHmac('sha256', key).update(hashStr + salt).digest('base64');

  const form = new URLSearchParams({
    merchant_id: merchantId,
    user_ip: ip,
    merchant_oid: id,
    email: customer.email,
    payment_amount: amount,
    paytr_token: token,
    user_basket: basket,
    debug_on: testMode,
    no_installment: noInstallment,
    max_installment: maxInstallment,
    user_name: customer.name,
    user_address: (customer.city + ', ' + customer.address).slice(0, 400),
    user_phone: customer.phone,
    merchant_ok_url: `${site}/success.html?order=${id}&pay=card`,
    merchant_fail_url: `${site}/fail.html?order=${id}`,
    timeout_limit: '30',
    currency,
    test_mode: testMode,
    lang: lang === 'tr' ? 'tr' : 'en'
  });

  const res = await fetch('https://www.paytr.com/odeme/api/get-token', { method: 'POST', body: form });
  const out = await res.json();
  if (out.status !== 'success') throw new Error('PayTR: ' + (out.reason || JSON.stringify(out)));
  return out.token;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { ok: false, error: 'Method not allowed' });
  const body = parseJson(event);
  if (!body) return json(400, { ok: false, error: 'Bad JSON' });
  if (body.website) return json(200, { ok: true, orderId: 'BH0' }); // ловушка для спам-ботов

  const c = body.customer || {};
  const customer = {
    name: clean(c.name, 100),
    phone: clean(c.phone, 30),
    email: clean(c.email, 120),
    city: clean(c.city, 60),
    address: clean(c.address, 400),
    comment: clean(c.comment, 1000)
  };
  if (customer.name.length < 2 || customer.phone.replace(/\D/g, '').length < 7 || !customer.city || customer.address.length < 5) {
    return json(400, { ok: false, error: 'Invalid customer fields' });
  }
  if (customer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
    return json(400, { ok: false, error: 'Invalid email' });
  }

  const payment = body.payment;
  if (!settings.payments[payment]) return json(400, { ok: false, error: 'Payment method not available' });

  // Цены берём только из каталога на сервере, а не из браузера.
  const items = Array.isArray(body.items) ? body.items.slice(0, 50) : [];
  const lines = [];
  for (const it of items) {
    const product = catalog.products.find((p) => p.id === it.id && p.inStock);
    const qty = Math.floor(Number(it.qty));
    if (!product || !(qty >= 1 && qty <= 99)) return json(400, { ok: false, error: 'Invalid item' });
    lines.push({ product, qty });
  }
  if (!lines.length) return json(400, { ok: false, error: 'Cart is empty' });

  const subtotal = lines.reduce((s, l) => s + l.product.price * l.qty, 0);
  const delivery = subtotal >= settings.delivery.freeFrom ? 0 : settings.delivery.cost;
  const total = subtotal + delivery;
  const id = orderId();

  if (payment === 'card') {
    if (!process.env.PAYTR_MERCHANT_ID || !process.env.PAYTR_MERCHANT_KEY || !process.env.PAYTR_MERCHANT_SALT) {
      return json(503, { ok: false, code: 'card_unavailable', error: 'PayTR is not configured' });
    }
    if (!customer.email) return json(400, { ok: false, error: 'Email is required for card payment' });
  }

  const text = [
    `🛍 Новый заказ ${id}`,
    payment === 'card' ? '⏳ Ожидает онлайн-оплаты' : null,
    '',
    ...lines.map((l) => `• ${l.product.name.ru} × ${l.qty} = ${tl(l.product.price * l.qty)}`),
    '',
    `Товары: ${tl(subtotal)}`,
    `Доставка: ${delivery ? tl(delivery) : 'бесплатно'}`,
    `ИТОГО: ${tl(total)}`,
    `Оплата: ${PAYMENT_NAMES[payment]}`,
    '',
    `👤 ${customer.name}`,
    `📞 ${customer.phone}`,
    customer.email ? `✉️ ${customer.email}` : null,
    `📍 ${customer.city}, ${customer.address}`,
    customer.comment ? `💬 ${customer.comment}` : null,
    `🌐 Язык сайта: ${String(body.lang || '').slice(0, 2)}`
  ].filter((s) => s !== null).join('\n');

  try {
    await sendTelegram(text);
  } catch (e) {
    console.error(e);
    return json(500, { ok: false, error: 'Notification failed' });
  }

  if (payment === 'card') {
    try {
      const token = await paytrToken({ id, total, lines, customer, ip: clientIp(event), lang: body.lang });
      return json(200, { ok: true, orderId: id, total, paytrToken: token });
    } catch (e) {
      console.error(e);
      await sendTelegram(`⚠️ Заказ ${id}: не удалось открыть онлайн-оплату. Свяжитесь с клиентом.`).catch(() => {});
      return json(502, { ok: false, code: 'card_unavailable', error: 'Payment provider error' });
    }
  }

  return json(200, { ok: true, orderId: id, total });
};
