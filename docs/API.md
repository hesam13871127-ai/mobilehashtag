# قرارداد REST API

Base URL: `/api`، پاسخ JSON، احراز هویت با کوکی `mh.sid`، درخواست‌های mutation با JSON و header `X-CSRF-Token`. قیمت‌ها عدد صحیح **تومان** هستند، نه رشته فارسی.

همه فراخوانی‌های مرورگر هم‌مبدأند. CORS عمومی باز نشده است. از باز کردن HTML با file:// یا API روی localhost دیگر خودداری کنید.

## شروع نشست

```js
const session = await fetch('/api/session').then(r => r.json());
// { csrf, user: null | { id, name, email, phone }, cart, wishlist: [productId] }
const response = await fetch('/api/cart/items', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': session.csrf,
  },
  body: JSON.stringify({ product_id: 1, color: 'تیتانیوم طبیعی', quantity: 1 }),
});
```

بعد از ورود یا ثبت‌نام، csrf جدید از پاسخ دریافت شود. بعد از خروج، برای کار مهمان `/session` را دوباره فراخوانی کنید. پاسخ‌ها `Cache-Control: no-store` دارند. API عمومی health در `/health` است.

## کاتالوگ

| روش | مسیر | قرارداد |
|---|---|---|
| GET | `/categories` | آرایه category شامل parent_id و product_count |
| GET | `/brands` | آرایه برندها |
| GET | `/products` | `{ products, total, page, pages }` |
| GET | `/products/:slug` | محصول کامل + categories، reviews، related؛ تاریخچه مشاهده را به‌روز می‌کند |
| GET | `/recent` | آخرین محصولات نشست، حداکثر ۸ |
| POST | `/products/:id/reviews` | ورود لازم؛ `{ rating: 1..5, body }`؛ ثبت/به‌روزرسانی نظر خود کاربر |
| GET | `/posts` | خلاصه مقاله‌ها |
| GET | `/posts/:slug` | متن مقاله |

پارامترهای محصولات:

- `q`: جست‌وجوی نام فارسی، برند یا SKU.
- `category`: slug دسته؛ `brand`: نام دقیق برند.
- `min`, `max`: حد قیمت تومان؛ `instock=1`, `sale=1`, `featured=1`.
- `sort`: `newest`, `bestselling`, `price_asc`, `price_desc`, `popular`, `featured`.
- `page`: از ۱؛ `limit`: ۱ تا ۲۴، پیش‌فرض ۱۲.

```text
/api/products?category=accessories&brand=Anker&min=1000000&max=3000000&instock=1&sort=price_asc&page=1&limit=12
```

## احراز هویت و حساب

| روش | مسیر | ورودی / خروجی |
|---|---|---|
| POST | `/auth/register` | `{name, email, password}`؛ 201 با user و csrf جدید |
| POST | `/auth/login` | `{email, password}`؛ user و csrf جدید |
| POST | `/auth/logout` | حذف نشست و کوکی |
| GET | `/account` | ورود لازم؛ `{user, orders, addresses}` |
| PATCH | `/account` | `{name, phone}`؛ ایمیل قابل تغییر نیست |
| POST | `/account/password` | `{current, password}`؛ نشست‌های دیگر کاربر باطل می‌شوند |
| POST | `/addresses` | عنوان و نشانی کامل؛ 201 |
| DELETE | `/addresses/:id` | فقط نشانی متعلق به حساب فعلی |

رمز حداقل ۱۰ کاراکتر و حداکثر ۷۲ بایت UTF-8 است. نام ۲ تا ۱۰۰ کاراکتر، ایمیل حداکثر ۲۵۴ کاراکتر. ورود/ثبت‌نام هنگام فعال بودن حساب قبلی با 409 رد می‌شود؛ ابتدا logout لازم است.

نشانی:

```json
{
  "title": "خانه",
  "recipient": "کاربر نمونه",
  "phone": "09123456789",
  "province": "تهران",
  "city": "تهران",
  "address": "خیابان نمونه، کوچه نمونه، پلاک ۱۲",
  "postal_code": "1234567890"
}
```

`title` فقط برای ذخیره نشانی لازم است. ارقام فارسی و عربی در phone/postal_code به ASCII تبدیل می‌شوند. موبایل باید `09` + ۹ رقم باشد؛ کد پستی ۱۰ رقم.

## سبد و علاقه‌مندی

| روش | مسیر | ورودی |
|---|---|---|
| GET | `/cart` | `{items, subtotal, shipping, total, count}` |
| POST | `/cart/items` | `{product_id, color, quantity}`؛ افزایش تعداد موجود |
| PATCH | `/cart/items/:id` | `{color, quantity}`؛ تعداد نهایی |
| DELETE | `/cart/items/:id` | `{color}` |
| GET | `/wishlist` | آرایه محصولات |
| POST | `/wishlist/:id` | افزودن؛ idempotent |
| DELETE | `/wishlist/:id` | حذف |

`color` باید عضو colors محصول باشد؛ برای محصول بدون رنگ، رشته خالی. quantity عدد صحیح ۱ تا ۲۰ و حداکثر موجودی است. مجموع رنگ‌های محصول از موجودی مشترک بیشتر نمی‌شود. هر قیمت ارسال‌شده توسط کلاینت نادیده گرفته می‌شود.

سبد/علاقه‌مندی مهمان و کاربر در دیتابیس هستند. ورود، اقلام مهمان را با حساب ادغام می‌کند؛ تعداد به حد موجودی محدود می‌شود.

## سفارش و پیگیری

| روش | مسیر | رفتار |
|---|---|---|
| POST | `/orders` | ورود لازم؛ ثبت تراکنشی؛ 201 با سفارش و اقلام snapshot |
| GET | `/orders/:id` | ورود و مالکیت لازم؛ سفارش دیگران 404 |
| POST | `/tracking` | `{code, phone}`؛ نتیجه محدود بدون نشانی خصوصی |

```js
const payload = {
  address: { recipient, phone, province, city, address, postal_code },
  idempotency_key: crypto.randomUUID(),
  demo_accepted: true,
};
```

کلید را در retry یک عملیات دوباره استفاده کنید. سرور ابتدا سفارش قبلی با همان کلید و مالک را برمی‌گرداند. درخواست تکراری موجودی را دوباره کاهش نمی‌دهد. subtotal، shipping و total فقط از دیتابیس محاسبه می‌شوند.

خروجی status همیشه `demo_confirmed` است. این **به معنی پرداخت موفق واقعی نیست**. قیمت و نام در order_items ثبت می‌شوند تا تاریخچه مستقل از تغییر آینده کاتالوگ بماند.

## فرم‌های عمومی

- `POST /contact`: `{name, email, message}`؛ message حداقل ۱۰ و حداکثر ۵۰۰۰ کاراکتر.
- `POST /newsletter`: `{email}`؛ unique و بدون تکرار؛ ایمیل ارسال نمی‌شود.

## خطاها

شکل خطا: `{ "error": "پیام فارسی" }`.

- 400 ورودی نامعتبر یا سبد خالی
- 401 ورود لازم / ورود ناموفق
- 403 CSRF نامعتبر
- 404 مسیر، محصول یا سفارش قابل‌دسترسی وجود ندارد
- 409 کمبود موجودی / شناسه یا ایمیل تکراری / حساب فعال
- 429 محدودیت تعداد درخواست
- 500 خطای غیرمنتظره؛ جزئیات فنی فقط در log سرور

محدودیت‌ها در پنجره ۱۵ دقیقه‌ای و برای هر IP اعمال می‌شوند: ثبت‌نام ۱۵، ورود ۲۵، تغییر رمز ۱۰، سفارش ۳۰، پیگیری ۲۵، تماس ۱۰، خبرنامه ۱۵ و نظر ۱۵. در محیط چند process باید store مشترک استفاده شود.


## تنظیمات عمومی تماس

`GET /api/store/contact` فقط فیلدهای عمومی و اعتبارسنجی‌شدهٔ `backend/config/contact.json` را برمی‌گرداند. شکل خروجی: `demo`, `hasSamples`, `storeName`, `notice`, `phone`, `whatsapp`, `address`, `email`, `workingHours`, `instagram`, `telegram`, `map`.

فیلدهای لینک‌پذیر یا `null` هستند یا `{ value, href, sample }`. در حالت demo یا برای مقادیر رزروشدهٔ نمایشی، `href=null` است؛ UI نباید برای این موارد لینک فعال بسازد. `map` بدون mode=live، مختصات عددی معتبر و verified=true مقدار null دارد. فیلدهای ناشناخته/محرمانه از config منتشر نمی‌شوند. JSON نامعتبر یا فایل تنظیمات غیرقابل‌خواندن پاسخ 503 می‌دهد؛ تماس fallback و فروشگاه قابل‌استفاده می‌مانند. فرایند POST /contact قبلی تغییری نکرده است.

جزئیات قالب و نحوه فعال‌سازی در [CONTACT-SETTINGS.md](CONTACT-SETTINGS.md) است.
