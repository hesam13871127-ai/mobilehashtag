import rateLimit from 'express-rate-limit';
export const limiter = (limit) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'تعداد درخواست‌ها زیاد است. کمی بعد دوباره تلاش کنید.' },
  });
