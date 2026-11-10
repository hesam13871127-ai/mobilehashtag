import { Router } from 'express';
import { db } from '../config/db.js';
import { text, email, fail } from '../middleware/security.js';
import { limiter } from '../middleware/rate-limit.js';
const api = Router();
api.post('/contact', limiter(10), (req, res) => {
  db.prepare('INSERT INTO contacts(name,email,message) VALUES(?,?,?)').run(
    text(req.body.name, 'نام', 2, 100),
    email(req.body.email),
    text(req.body.message, 'پیام', 10, 5000)
  );
  res.status(201).json({
    message: 'پیام شما در پایگاه داده ثبت شد. این محیط نمایشی است و پاسخ‌گویی واقعی ندارد.',
  });
});
api.post('/newsletter', limiter(15), (req, res) => {
  db.prepare('INSERT OR IGNORE INTO subscribers(email) VALUES(?)').run(email(req.body.email));
  res.status(201).json({ message: 'عضویت شما ثبت شد. در نسخه نمایشی ایمیلی ارسال نمی‌شود.' });
});
api.get('/posts', (req, res) =>
  res.json(
    db
      .prepare('SELECT id,slug,title,excerpt,image,read_minutes,created_at FROM posts ORDER BY id')
      .all()
  )
);
api.get('/posts/:slug', (req, res) => {
  const p = db.prepare('SELECT * FROM posts WHERE slug=?').get(req.params.slug);
  if (!p) fail(404, 'مقاله پیدا نشد.');
  res.json(p);
});

export default api;
