import crypto from 'node:crypto';
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
export const fail = (status, message) => {
  throw new HttpError(status, message);
};
export function csrf(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const a = req.session.csrf,
    b = req.get('X-CSRF-Token');
  if (
    !a ||
    !b ||
    !/^([a-f0-9]{64})$/.test(b) ||
    a.length !== b.length ||
    !crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))
  )
    return res.status(403).json({ error: 'درخواست معتبر نیست. صفحه را تازه‌سازی کنید.' });
  next();
}
export function requireAuth(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: 'لطفاً وارد حساب خود شوید.' });
  next();
}
export function text(value, label, min = 1, max = 200) {
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max)
    fail(400, `${label} معتبر نیست.`);
  return value.trim();
}
export function email(value) {
  const s = text(value, 'ایمیل', 5, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) fail(400, 'نشانی ایمیل معتبر نیست.');
  return s;
}
export function digits(value) {
  return String(value ?? '')
    .replace(/[۰-۹]/g, (c) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(c))
    .replace(/[٠-٩]/g, (c) => '٠١٢٣٤٥٦٧٨٩'.indexOf(c));
}
export function address(value) {
  if (!value || typeof value !== 'object') fail(400, 'نشانی ارسال را تکمیل کنید.');
  const a = {
    recipient: text(value.recipient, 'نام گیرنده', 2, 100),
    phone: digits(value.phone),
    province: text(value.province, 'استان', 2, 50),
    city: text(value.city, 'شهر', 2, 60),
    address: text(value.address, 'نشانی', 10, 500),
    postal_code: digits(value.postal_code),
  };
  if (!/^09\d{9}$/.test(a.phone)) fail(400, 'شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود.');
  if (!/^\d{10}$/.test(a.postal_code)) fail(400, 'کد پستی باید ۱۰ رقم باشد.');
  return a;
}
export function password(value, label = 'رمز عبور') {
  if (typeof value !== 'string' || value.length < 10 || Buffer.byteLength(value, 'utf8') > 72)
    fail(400, `${label} باید حداقل ۱۰ کاراکتر و حداکثر ۷۲ بایت باشد.`);
  return value;
}
