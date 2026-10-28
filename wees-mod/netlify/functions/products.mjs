// Публичный каталог для сайта.
import { readCatalog, json } from '../lib/catalog.mjs';

export default async () => {
  try {
    const catalog = await readCatalog();
    return json(200, catalog);
  } catch (e) {
    console.error(e);
    return json(500, { error: 'Catalog unavailable' });
  }
};

export const config = { path: '/api/products' };
