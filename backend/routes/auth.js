import { Router } from 'express';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { db } from '../config/db.js';
import { mergeCart } from '../services/commerce.js';
import { text, email, fail, password as validPassword } from '../middleware/security.js';
import { limiter } from '../middleware/rate-limit.js';
const api = Router();
async function signIn(req, user) {
  const cid = mergeCart(req, user.id);
  const recent = req.session.recent;
  await new Promise((resolve, reject) =>
    req.session.regenerate((e) => (e ? reject(e) : resolve()))
  );
  req.session.userId = user.id;
  req.session.cartId = cid;
  req.session.recent = recent;
  req.session.csrf = crypto.randomBytes(32).toString('hex');
  return {
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone },
    csrf: req.session.csrf,
  };
}
api.post('/auth/register', limiter(15), async (req, res) => {
  if (req.session.userId) fail(409, 'ابتدا از حساب فعلی خارج شوید.');
  const name = text(req.body.name, 'نام', 2, 100),
    mail = email(req.body.email),
    password = validPassword(req.body.password);
  if (db.prepare('SELECT id FROM users WHERE email=?').get(mail))
    fail(409, 'این ایمیل قبلاً ثبت شده است.');
  const hash = await bcrypt.hash(password, 12);
  let id;
  try {
    id = Number(
      db.prepare('INSERT INTO users(name,email,password_hash) VALUES(?,?,?)').run(name, mail, hash)
        .lastInsertRowid
    );
  } catch (e) {
    if (e.errcode === 2067 || e.code?.includes('CONSTRAINT'))
      fail(409, 'این ایمیل قبلاً ثبت شده است.');
    throw e;
  }
  res.status(201).json(await signIn(req, db.prepare('SELECT * FROM users WHERE id=?').get(id)));
});
api.post('/auth/login', limiter(25), async (req, res) => {
  if (req.session.userId) fail(409, 'ابتدا از حساب فعلی خارج شوید.');
  const mail = email(req.body.email);
  if (typeof req.body.password !== 'string' || req.body.password.length > 128)
    fail(400, 'رمز عبور معتبر نیست.');
  const password = req.body.password;
  const user = db.prepare('SELECT * FROM users WHERE email=?').get(mail);
  const valid = await bcrypt.compare(
    password,
    user?.password_hash || '$2b$12$YlM9YvLqXGdh8euq8ff12OqkG9cpEZn8drWvv9cOc74PGKOIMwgV6'
  );
  if (!user || !valid) fail(401, 'ایمیل یا رمز عبور نادرست است.');
  res.json(await signIn(req, user));
});
api.post('/auth/logout', async (req, res) => {
  await new Promise((resolve, reject) => req.session.destroy((e) => (e ? reject(e) : resolve())));
  res.clearCookie('mh.sid');
  res.json({ message: 'از حساب خارج شدید.' });
});

export default api;
