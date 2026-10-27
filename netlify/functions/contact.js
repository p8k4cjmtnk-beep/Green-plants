// Форма «Напишите нам» → сообщение в Telegram.
const { json, parseJson, clean, sendTelegram } = require('../lib/common');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { ok: false, error: 'Method not allowed' });
  const body = parseJson(event);
  if (!body) return json(400, { ok: false, error: 'Bad JSON' });
  if (body.website) return json(200, { ok: true }); // ловушка для спам-ботов

  const name = clean(body.name, 100);
  const phone = clean(body.phone, 30);
  const message = clean(body.message, 2000);
  if (name.length < 2 || phone.replace(/\D/g, '').length < 7 || !message) {
    return json(400, { ok: false, error: 'Invalid fields' });
  }

  try {
    await sendTelegram(`✉️ Новое сообщение с сайта\n\nИмя: ${name}\nТелефон: ${phone}\n\n${message}`);
    return json(200, { ok: true });
  } catch (e) {
    console.error(e);
    return json(500, { ok: false, error: 'Notification failed' });
  }
};
