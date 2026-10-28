// Каталог хранится в Netlify Blobs. Пока продавец ничего не сохранил, отдаём файлы из data/.
import { getStore } from '@netlify/blobs';
import { timingSafeEqual } from 'node:crypto';
import defaultProducts from '../../data/products.json' with { type: 'json' };
import defaultSettings from '../../data/settings.json' with { type: 'json' };

const CATALOG_KEY = 'catalog';
const HEX = /^#[0-9a-f]{6}$/i;
const ID = /^[a-z0-9-]{1,60}$/;
const IMAGE = /^(img\/[a-z0-9-]+\.(jpg|jpeg|png|webp)|\/api\/image\/[a-z0-9-]+)$/i;

export const catalogStore = () => getStore({ name: 'weesmod', consistency: 'strong' });
export const imageStore = () => getStore('weesmod-images');

export function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
  });
}

export async function readCatalog() {
  const saved = await catalogStore().get(CATALOG_KEY, { type: 'json' });
  if (saved && Array.isArray(saved.products)) return saved;
  return {
    settings: {
      instagram: defaultSettings.instagram,
      whatsapp: defaultSettings.whatsapp,
      sizes: defaultSettings.sizes
    },
    products: defaultProducts.products
  };
}

export async function writeCatalog(catalog) {
  await catalogStore().setJSON(CATALOG_KEY, catalog);
}

// Пароль задаётся в Netlify: Site configuration → Environment variables → ADMIN_PASSWORD.
export function checkAdmin(req) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return json(503, { ok: false, error: 'ADMIN_PASSWORD is not set' });
  const given = req.headers.get('x-admin-key') || '';
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return json(401, { ok: false, error: 'Wrong password' });
  return null;
}

const str = (v, max) => String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
const langs = (o, max) => ({ tr: str(o && o.tr, max), en: str(o && o.en, max), ar: str(o && o.ar, max) });

// Пересобираем каталог только из известных полей, чтобы в хранилище не попало ничего лишнего.
export function cleanCatalog(input) {
  if (!input || !Array.isArray(input.products)) throw new Error('products must be an array');
  if (input.products.length > 500) throw new Error('too many products');
  const ids = new Set();
  const products = input.products.map((p, i) => {
    const id = str(p.id, 60).toLowerCase();
    if (!ID.test(id) || ids.has(id)) throw new Error('bad or duplicate id at #' + (i + 1));
    ids.add(id);
    const name = langs(p.name, 120);
    if (!name.tr) throw new Error('missing Turkish name at #' + (i + 1));
    const price = p.price === null || p.price === '' || p.price === undefined ? null : Number(p.price);
    if (price !== null && !(price >= 0 && price <= 1000000)) throw new Error('bad price at #' + (i + 1));
    if (!Array.isArray(p.variants) || p.variants.length < 1 || p.variants.length > 20) throw new Error('need 1-20 colours at #' + (i + 1));
    const variants = p.variants.map((v) => {
      const image = str(v.image, 200);
      if (!IMAGE.test(image)) throw new Error('bad image at #' + (i + 1));
      return { color: langs(v.color, 60), hex: HEX.test(v.hex) ? v.hex : '#999999', image };
    });
    return {
      id,
      gender: ['girl', 'boy', 'unisex'].includes(p.gender) ? p.gender : 'unisex',
      season: ['winter', 'summer'].includes(p.season) ? p.season : 'winter',
      name,
      price,
      featured: !!p.featured,
      inStock: p.inStock !== false,
      variants
    };
  });
  const s = input.settings || {};
  const sizes = Array.isArray(s.sizes) ? s.sizes.map((x) => str(x, 20)).filter(Boolean).slice(0, 30) : [];
  const settings = {
    instagram: str(s.instagram, 60).replace(/^@/, '').replace(/[^a-zA-Z0-9._]/g, ''),
    whatsapp: str(s.whatsapp, 20).replace(/\D/g, ''),
    sizes
  };
  return { settings, products };
}
