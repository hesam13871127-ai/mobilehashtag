import { Router } from 'express';
import crypto from 'node:crypto';
import { db } from '../config/db.js';
import { cart, cartId, orderView } from '../services/commerce.js';
import { requireAuth, text, address, digits, fail } from '../middleware/security.js';
import { limiter } from '../middleware/rate-limit.js';
const api = Router();
api.post('/orders', requireAuth, limiter(30), (req, res) => {
  if (req.body.demo_accepted !== true) fail(400, 'تأیید خرید آزمایشی الزامی است.');
  const a = address(req.body.address),
    key = text(req.body.idempotency_key, 'شناسه درخواست', 16, 100);
  const cid = cartId(req);
  const order = db.transaction(() => {
    const existing = db.prepare('SELECT * FROM orders WHERE idempotency_key=?').get(key);
    if (existing) {
      if (existing.user_id !== req.session.userId) fail(409, 'شناسه درخواست تکراری است.');
      return orderView(existing);
    }
    const c = cart(req);
    if (!c.items.length) fail(400, 'سبد خرید خالی است.');
    const totalByProduct = new Map();
    for (const p of c.items) totalByProduct.set(p.id, (totalByProduct.get(p.id) || 0) + p.quantity);
    for (const [id, q] of totalByProduct) {
      const r = db
        .prepare('UPDATE products SET stock=stock-?,sales=sales+? WHERE id=? AND stock>=?')
        .run(q, q, id, q);
      if (!r.changes) fail(409, 'موجودی یکی از کالاها تغییر کرده است. سبد را بررسی کنید.');
    }
    const code = 'MH-' + crypto.randomBytes(6).toString('hex').toUpperCase();
    const id = Number(
      db
        .prepare(
          'INSERT INTO orders(user_id,cart_id,tracking_code,idempotency_key,subtotal,shipping,total,address) VALUES(?,?,?,?,?,?,?,?)'
        )
        .run(req.session.userId, cid, code, key, c.subtotal, c.shipping, c.total, JSON.stringify(a))
        .lastInsertRowid
    );
    for (const p of c.items)
      db.prepare(
        'INSERT INTO order_items(order_id,product_id,name,image,color,quantity,unit_price) VALUES(?,?,?,?,?,?,?)'
      ).run(id, p.id, p.name, p.image, p.color, p.quantity, p.price);
    db.prepare('DELETE FROM cart_items WHERE cart_id=?').run(cid);
    return orderView(db.prepare('SELECT * FROM orders WHERE id=?').get(id));
  })();
  res.status(201).json(order);
});
api.get('/orders/:id', requireAuth, (req, res) => {
  const o = db
    .prepare('SELECT * FROM orders WHERE id=? AND user_id=?')
    .get(Number(req.params.id), req.session.userId);
  if (!o) fail(404, 'سفارش پیدا نشد.');
  res.json(orderView(o));
});
api.post('/tracking', limiter(25), (req, res) => {
  const code = text(req.body.code, 'کد پیگیری', 5, 40).toUpperCase(),
    phone = digits(req.body.phone);
  const o = db.prepare('SELECT * FROM orders WHERE tracking_code=?').get(code);
  if (!o || JSON.parse(o.address).phone !== phone) fail(404, 'سفارشی با این مشخصات پیدا نشد.');
  res.json({
    tracking_code: o.tracking_code,
    status: o.status,
    total: o.total,
    created_at: o.created_at,
    message: 'سفارش آزمایشی ثبت شده است. پرداخت و ارسال واقعی انجام نمی‌شود.',
  });
});

export default api;
