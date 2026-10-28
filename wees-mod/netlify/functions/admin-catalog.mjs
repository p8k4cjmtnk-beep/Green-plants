// Панель управления: GET — проверить пароль и получить каталог, PUT — сохранить каталог.
import { readCatalog, writeCatalog, cleanCatalog, checkAdmin, json } from '../lib/catalog.mjs';

export default async (req) => {
  const denied = checkAdmin(req);
  if (denied) {
    await new Promise((r) => setTimeout(r, 600)); // притормаживаем подбор пароля
    return denied;
  }
  if (req.method === 'GET') return json(200, await readCatalog());
  if (req.method !== 'PUT') return json(405, { ok: false, error: 'Method not allowed' });

  const raw = await req.text();
  if (raw.length > 1_000_000) return json(413, { ok: false, error: 'Catalog too large' });
  let catalog;
  try {
    catalog = cleanCatalog(JSON.parse(raw));
  } catch (e) {
    return json(400, { ok: false, error: e.message });
  }
  await writeCatalog(catalog);
  return json(200, { ok: true, catalog });
};

export const config = { path: '/api/admin/catalog' };
