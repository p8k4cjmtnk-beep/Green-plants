// Отдаёт фото, загруженные через панель управления.
import { imageStore } from '../lib/catalog.mjs';

export default async (req, context) => {
  const key = String(context.params.key || '');
  if (!/^[a-z0-9-]{1,60}$/i.test(key)) return new Response('Not found', { status: 404 });
  const entry = await imageStore().getWithMetadata(key, { type: 'arrayBuffer' });
  if (!entry) return new Response('Not found', { status: 404 });
  return new Response(entry.data, {
    headers: {
      'content-type': (entry.metadata && entry.metadata.type) || 'image/jpeg',
      'cache-control': 'public, max-age=31536000, immutable'
    }
  });
};

export const config = { path: '/api/image/:key' };
