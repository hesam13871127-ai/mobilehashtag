import { Router } from 'express';
import crypto from 'node:crypto';
import { db } from '../config/db.js';
import { csrf } from '../middleware/security.js';
import { cartId, cart } from '../services/commerce.js';
import catalogRoutes from './catalog.js';
import authRoutes from './auth.js';
import cartRoutes from './cart.js';
import customerRoutes from './customer.js';
import ordersRoutes from './orders.js';
import contentRoutes from './content.js';
export const api = Router();
api.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

api.get('/session', (req, res) => {
  cartId(req);
  req.session.csrf ||= crypto.randomBytes(32).toString('hex');
  res.json({
    csrf: req.session.csrf,
    user: req.session.userId
      ? db.prepare('SELECT id,name,email,phone FROM users WHERE id=?').get(req.session.userId)
      : null,
    cart: cart(req),
    wishlist: db
      .prepare('SELECT product_id FROM wishlist WHERE cart_id=?')
      .all(cartId(req))
      .map((x) => x.product_id),
  });
});
api.use(csrf);
api.use((req, res, next) => {
  if (
    !['GET', 'HEAD', 'OPTIONS'].includes(req.method) &&
    req.body !== undefined &&
    (req.body === null || typeof req.body !== 'object' || Array.isArray(req.body))
  )
    return res.status(400).json({ error: 'ساختار درخواست معتبر نیست.' });
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) req.body ||= {};
  next();
});

api.use(catalogRoutes);
api.use(authRoutes);
api.use(cartRoutes);
api.use(customerRoutes);
api.use(ordersRoutes);
api.use(contentRoutes);
api.use((req, res) => res.status(404).json({ error: 'مسیر درخواستی پیدا نشد.' }));
