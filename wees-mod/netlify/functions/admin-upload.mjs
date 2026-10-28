// Загрузка фото товара из панели управления. Браузер заранее уменьшает фото до ~1200px.
import { randomBytes } from 'node:crypto';
import { imageStore, checkAdmin, json } from '../lib/catalog.mjs';

const TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default async (req) => {
  if (req.method !== 'POST') return json(405, { ok: false, error: 'Method not allowed' });
  const denied = checkAdmin(req);
  if (denied) return denied;

  const type = (req.headers.get('content-type') || '').split(';')[0].trim();
  if (!TYPES.includes(type)) return json(415, { ok: false, error: 'Only JPEG, PNG or WebP' });
  const data = await req.arrayBuffer();
  if (data.byteLength === 0 || data.byteLength > 4_000_000) return json(413, { ok: false, error: 'Image must be under 4 MB' });

  const key = Date.now().toString(36) + '-' + randomBytes(4).toString('hex');
  await imageStore().set(key, data, { metadata: { type } });
  return json(200, { ok: true, url: '/api/image/' + key });
};

export const config = { path: '/api/admin/upload' };
