import { Router } from 'express';
import { db } from '../config/db.js';
import { cart, cartId, validateItem, product } from '../services/commerce.js';
import { fail } from '../middleware/security.js';
const api = Router();
api.get('/cart', (req, res) => res.json(cart(req)));
api.post('/cart/items', (req, res) => {
  const { product_id: id, quantity = 1, color = '' } = req.body;
  const q = validateItem(id, color, quantity, req, true);
  db.prepare(
    'INSERT INTO cart_items VALUES(?,?,?,?) ON CONFLICT(cart_id,product_id,color) DO UPDATE SET quantity=excluded.quantity'
  ).run(cartId(req), id, color, q);
  res.status(201).json(cart(req));
});
api.patch('/cart/items/:id', (req, res) => {
  const id = Number(req.params.id),
    color = req.body.color || '';
  if (
    !db
      .prepare('SELECT 1 FROM cart_items WHERE cart_id=? AND product_id=? AND color=?')
      .get(cartId(req), id, color)
  )
    fail(404, 'کالا در سبد نیست.');
  const q = validateItem(id, color, req.body.quantity, req);
  db.prepare('UPDATE cart_items SET quantity=? WHERE cart_id=? AND product_id=? AND color=?').run(
    q,
    cartId(req),
    id,
    color
  );
  res.json(cart(req));
});
api.delete('/cart/items/:id', (req, res) => {
  db.prepare('DELETE FROM cart_items WHERE cart_id=? AND product_id=? AND color=?').run(
    cartId(req),
    Number(req.params.id),
    req.body.color || ''
  );
  res.json(cart(req));
});
api.get('/wishlist', (req, res) =>
  res.json(
    db
      .prepare('SELECT p.* FROM products p JOIN wishlist w ON p.id=w.product_id WHERE w.cart_id=?')
      .all(cartId(req))
      .map(product)
  )
);
api.post('/wishlist/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!db.prepare('SELECT id FROM products WHERE id=?').get(id)) fail(404, 'کالا پیدا نشد.');
  db.prepare('INSERT OR IGNORE INTO wishlist VALUES(?,?)').run(cartId(req), id);
  res.status(201).json({ message: 'به علاقه‌مندی‌ها اضافه شد.' });
});
api.delete('/wishlist/:id', (req, res) => {
  db.prepare('DELETE FROM wishlist WHERE cart_id=? AND product_id=?').run(
    cartId(req),
    Number(req.params.id)
  );
  res.json({ message: 'از علاقه‌مندی‌ها حذف شد.' });
});

export default api;
