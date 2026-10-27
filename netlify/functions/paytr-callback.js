// Уведомление от PayTR о результате оплаты. Адрес этой функции нужно указать
// в кабинете PayTR как «Bildirim URL»: https://ВАШ-САЙТ/.netlify/functions/paytr-callback
const crypto = require('crypto');
const { sendTelegram } = require('../lib/common');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

  const key = process.env.PAYTR_MERCHANT_KEY;
  const salt = process.env.PAYTR_MERCHANT_SALT;
  if (!key || !salt) return { statusCode: 500, body: 'PayTR is not configured' };

  const raw = event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString('utf8') : (event.body || '');
  const p = new URLSearchParams(raw);
  const oid = p.get('merchant_oid') || '';
  const status = p.get('status') || '';
  const totalAmount = p.get('total_amount') || '';
  const hash = p.get('hash') || '';

  const expected = crypto.createHmac('sha256', key).update(oid + salt + status + totalAmount).digest('base64');
  const a = Buffer.from(hash);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { statusCode: 400, body: 'PAYTR notification failed: bad hash' };
  }

  const sum = (Number(totalAmount) / 100).toLocaleString('ru-RU') + ' TL';
  const text = status === 'success'
    ? `✅ Заказ ${oid} оплачен онлайн: ${sum}`
    : `❌ Оплата заказа ${oid} не прошла (${p.get('failed_reason_msg') || 'причина не указана'})`;

  try {
    await sendTelegram(text);
  } catch (e) {
    // Не роняем ответ: PayTR будет повторять уведомление, пока не получит OK.
    console.error(e);
  }
  return { statusCode: 200, headers: { 'Content-Type': 'text/plain' }, body: 'OK' };
};
