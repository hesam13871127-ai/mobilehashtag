import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../config/db.js';
import { orderView } from '../services/commerce.js';
import {
  requireAuth,
  text,
  address,
  digits,
  fail,
  password as validPassword,
} from '../middleware/security.js';
import { limiter } from '../middleware/rate-limit.js';
const api = Router();
api.get('/account', requireAuth, (req, res) => {
  res.json({
    user: db.prepare('SELECT id,name,email,phone FROM users WHERE id=?').get(req.session.userId),
    orders: db
      .prepare('SELECT * FROM orders WHERE user_id=? ORDER BY id DESC')
      .all(req.session.userId)
      .map(orderView),
    addresses: db
      .prepare('SELECT * FROM addresses WHERE user_id=? ORDER BY id DESC')
      .all(req.session.userId),
  });
});
api.patch('/account', requireAuth, (req, res) => {
  const name = text(req.body.name, 'نام', 2, 100),
    phone = digits(req.body.phone);
  if (phone && !/^09\d{9}$/.test(phone)) fail(400, 'شماره موبایل معتبر نیست.');
  db.prepare('UPDATE users SET name=?,phone=? WHERE id=?').run(name, phone, req.session.userId);
  res.json({ message: 'اطلاعات ذخیره شد.' });
});
api.post('/account/password', requireAuth, limiter(10), async (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.session.userId);
  if (
    !(await bcrypt.compare(
      typeof req.body.current === 'string' ? req.body.current : '',
      user.password_hash
    ))
  )
    fail(400, 'رمز عبور فعلی صحیح نیست.');
  const hash = await bcrypt.hash(validPassword(req.body.password, 'رمز جدید'), 12);
  db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(hash, user.id);
  for (const row of db.prepare('SELECT sid,data FROM sessions').all()) {
    if (JSON.parse(row.data).userId === user.id && row.sid !== req.sessionID)
      db.prepare('DELETE FROM sessions WHERE sid=?').run(row.sid);
  }
  res.json({ message: 'رمز عبور تغییر کرد.' });
});
api.post('/addresses', requireAuth, (req, res) => {
  if (
    db.prepare('SELECT COUNT(*) n FROM addresses WHERE user_id=?').get(req.session.userId).n >= 20
  )
    fail(400, 'حداکثر ۲۰ نشانی می‌توانید ذخیره کنید.');
  const a = address(req.body),
    title = text(req.body.title, 'عنوان نشانی', 2, 50);
  const id = Number(
    db
      .prepare(
        'INSERT INTO addresses(user_id,title,recipient,phone,province,city,address,postal_code) VALUES(?,?,?,?,?,?,?,?)'
      )
      .run(
        req.session.userId,
        title,
        a.recipient,
        a.phone,
        a.province,
        a.city,
        a.address,
        a.postal_code
      ).lastInsertRowid
  );
  res.status(201).json({ id, ...a, title });
});
api.delete('/addresses/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM addresses WHERE id=? AND user_id=?').run(
    Number(req.params.id),
    req.session.userId
  );
  res.json({ message: 'نشانی حذف شد.' });
});

export default api;
