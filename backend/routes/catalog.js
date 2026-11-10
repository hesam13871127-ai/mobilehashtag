import { Router } from 'express';
import { db } from '../config/db.js';
import { product } from '../services/commerce.js';
import { requireAuth, text, fail } from '../middleware/security.js';
import { limiter } from '../middleware/rate-limit.js';
const api = Router();
api.get('/categories', (req, res) =>
  res.json(
    db
      .prepare(
        'SELECT c.*,COUNT(pc.product_id) AS product_count FROM categories c LEFT JOIN product_categories pc ON pc.category_id=c.id GROUP BY c.id ORDER BY c.id'
      )
      .all()
  )
);
api.get('/brands', (req, res) =>
  res.json(
    db
      .prepare('SELECT DISTINCT brand FROM products ORDER BY brand')
      .all()
      .map((p) => p.brand)
  )
);
api.get('/products', (req, res) => {
  const conditions = [],
    params = [];
  const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 150) : '';
  if (q) {
    conditions.push('(p.name LIKE ? OR p.brand LIKE ? OR p.sku LIKE ?)');
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (req.query.category) {
    conditions.push(
      'p.id IN (SELECT pc.product_id FROM product_categories pc JOIN categories c ON pc.category_id=c.id WHERE c.slug=?)'
    );
    params.push(String(req.query.category));
  }
  if (req.query.brand) {
    conditions.push('p.brand=?');
    params.push(String(req.query.brand));
  }
  for (const [key, op] of [
    ['min', '>='],
    ['max', '<='],
  ])
    if (req.query[key] !== undefined && req.query[key] !== '') {
      const n = Number(req.query[key]);
      if (!Number.isFinite(n) || n < 0) fail(400, 'محدوده قیمت معتبر نیست.');
      conditions.push(`p.price ${op} ?`);
      params.push(n);
    }
  if (req.query.instock === '1') conditions.push('p.stock>0');
  if (req.query.sale === '1') conditions.push('p.old_price>p.price');
  if (req.query.featured === '1') conditions.push('p.featured=1');
  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const sorts = {
    newest: 'p.id DESC',
    bestselling: 'p.sales DESC',
    price_asc: 'p.price ASC',
    price_desc: 'p.price DESC',
    popular: 'p.rating DESC',
    featured: 'p.featured DESC,p.id ASC',
  };
  const sort = sorts[req.query.sort] || sorts.featured;
  const page = Math.max(1, Math.min(10000, Math.floor(Number(req.query.page) || 1)));
  const limit = Math.max(1, Math.min(24, Math.floor(Number(req.query.limit) || 12)));
  const total = db.prepare(`SELECT COUNT(*) n FROM products p ${where}`).get(...params).n;
  res.json({
    products: db
      .prepare(`SELECT p.* FROM products p ${where} ORDER BY ${sort},p.id ASC LIMIT ? OFFSET ?`)
      .all(...params, limit, (page - 1) * limit)
      .map(product),
    total,
    page,
    pages: Math.ceil(total / limit),
  });
});
api.get('/products/:slug', (req, res) => {
  const p = product(db.prepare('SELECT * FROM products WHERE slug=?').get(req.params.slug));
  if (!p) fail(404, 'کالا پیدا نشد.');
  p.categories = db
    .prepare(
      'SELECT c.* FROM categories c JOIN product_categories pc ON pc.category_id=c.id WHERE pc.product_id=?'
    )
    .all(p.id);
  p.reviews = db
    .prepare(
      'SELECT id,name,rating,body,created_at,user_id IS NULL AS sample FROM reviews WHERE product_id=? ORDER BY id DESC'
    )
    .all(p.id);
  p.related = db
    .prepare(
      'SELECT DISTINCT p.* FROM products p JOIN product_categories pc ON p.id=pc.product_id WHERE pc.category_id IN (SELECT category_id FROM product_categories WHERE product_id=?) AND p.id<>? LIMIT 4'
    )
    .all(p.id, p.id)
    .map(product);
  req.session.recent = [p.id, ...(req.session.recent || []).filter((id) => id !== p.id)].slice(
    0,
    8
  );
  res.json(p);
});
api.get('/recent', (req, res) => {
  res.json(
    (req.session.recent || [])
      .map((id) => product(db.prepare('SELECT * FROM products WHERE id=?').get(id)))
      .filter(Boolean)
  );
});
api.post('/products/:id/reviews', requireAuth, limiter(15), (req, res) => {
  const id = Number(req.params.id),
    rating = Number(req.body.rating),
    body = text(req.body.body, 'متن دیدگاه', 10, 2000);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) fail(400, 'امتیاز معتبر نیست.');
  if (!db.prepare('SELECT id FROM products WHERE id=?').get(id)) fail(404, 'کالا پیدا نشد.');
  const name = db.prepare('SELECT name FROM users WHERE id=?').get(req.session.userId).name;
  db.transaction(() => {
    db.prepare(
      'INSERT INTO reviews(product_id,user_id,name,rating,body) VALUES(?,?,?,?,?) ON CONFLICT(product_id,user_id) DO UPDATE SET rating=excluded.rating,body=excluded.body'
    ).run(id, req.session.userId, name, rating, body);
    db.prepare(
      'UPDATE products SET rating=(SELECT AVG(rating) FROM reviews WHERE product_id=? AND user_id IS NOT NULL) WHERE id=?'
    ).run(id, id);
  })();
  res.status(201).json({ message: 'دیدگاه شما ثبت شد.' });
});

export default api;
