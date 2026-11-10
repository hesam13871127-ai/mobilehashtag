import crypto from 'node:crypto';
import { db } from '../config/db.js';
import { fail } from '../middleware/security.js';
export const product = (p) =>
  p
    ? {
        ...p,
        gallery: JSON.parse(p.gallery),
        specs: JSON.parse(p.specs),
        colors: JSON.parse(p.colors),
      }
    : null;
export function cartId(req) {
  if (!req.session.cartId) {
    req.session.cartId = crypto.randomUUID();
    db.prepare('INSERT INTO carts(id) VALUES(?)').run(req.session.cartId);
  }
  return req.session.cartId;
}
export function cart(req) {
  const items = db
    .prepare(
      'SELECT p.*,ci.quantity,ci.color FROM cart_items ci JOIN products p ON p.id=ci.product_id WHERE ci.cart_id=? ORDER BY p.id'
    )
    .all(cartId(req))
    .map(product);
  const subtotal = items.reduce((s, p) => s + p.price * p.quantity, 0);
  const shipping = subtotal === 0 || subtotal >= 5000000 ? 0 : 69000;
  return {
    items,
    subtotal,
    shipping,
    total: subtotal + shipping,
    count: items.reduce((s, p) => s + p.quantity, 0),
  };
}
export function mergeCart(req, userId) {
  const guest = cartId(req);
  const old = db.prepare('SELECT id FROM carts WHERE user_id=?').get(userId);
  if (!old) {
    db.prepare('UPDATE carts SET user_id=? WHERE id=?').run(userId, guest);
    return guest;
  }
  if (old.id === guest) return guest;
  db.transaction(() => {
    for (const item of db.prepare('SELECT * FROM cart_items WHERE cart_id=?').all(guest)) {
      const existing = db
        .prepare('SELECT quantity FROM cart_items WHERE cart_id=? AND product_id=? AND color=?')
        .get(old.id, item.product_id, item.color);
      const stock = db.prepare('SELECT stock FROM products WHERE id=?').get(item.product_id).stock;
      const other = db
        .prepare(
          'SELECT COALESCE(SUM(quantity),0) AS n FROM cart_items WHERE cart_id=? AND product_id=? AND color<>?'
        )
        .get(old.id, item.product_id, item.color).n;
      const q = Math.min(20, stock - other, item.quantity + (existing?.quantity || 0));
      if (q > 0)
        db.prepare(
          'INSERT INTO cart_items VALUES(?,?,?,?) ON CONFLICT(cart_id,product_id,color) DO UPDATE SET quantity=excluded.quantity'
        ).run(old.id, item.product_id, item.color, q);
    }
    db.prepare(
      'INSERT OR IGNORE INTO wishlist SELECT ?,product_id FROM wishlist WHERE cart_id=?'
    ).run(old.id, guest);
    db.prepare('DELETE FROM carts WHERE id=?').run(guest);
  })();
  return old.id;
}
export function validateItem(id, color, quantity, req, add = false) {
  if (!Number.isInteger(id) || !Number.isInteger(quantity) || quantity < 1 || quantity > 20)
    fail(400, 'تعداد کالا باید بین ۱ و ۲۰ باشد.');
  const p = product(db.prepare('SELECT * FROM products WHERE id=?').get(id));
  if (!p) fail(404, 'کالا پیدا نشد.');
  if (typeof color !== 'string' || (p.colors.length ? !p.colors.includes(color) : color !== ''))
    fail(400, 'رنگ انتخاب‌شده معتبر نیست.');
  const current =
    db
      .prepare('SELECT quantity FROM cart_items WHERE cart_id=? AND product_id=? AND color=?')
      .get(cartId(req), id, color)?.quantity || 0;
  const q = quantity + (add ? current : 0);
  const other = db
    .prepare(
      'SELECT COALESCE(SUM(quantity),0) AS n FROM cart_items WHERE cart_id=? AND product_id=? AND color<>?'
    )
    .get(cartId(req), id, color).n;
  if (q > 20 || q + other > p.stock) fail(409, 'موجودی این کالا کافی نیست.');
  return q;
}
export function orderView(row) {
  return {
    ...row,
    address: JSON.parse(row.address),
    items: db.prepare('SELECT * FROM order_items WHERE order_id=?').all(row.id),
  };
}
