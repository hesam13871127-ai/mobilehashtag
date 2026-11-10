# معماری و مسیر تبدیل آینده به WooCommerce

## مرزهای فعلی

مرورگر فقط قالب و تعامل را نگه می‌دارد. داده تجاری از `/api` می‌آید. Express به SQLite داخلی Node دسترسی دارد؛ دیتابیس در مسیر static نیست. مرورگر مستقیماً به دیتابیس، سرویس localhost دیگر یا سیستم فایل دسترسی ندارد.

```text
HTML مستقل → ES modules → Fetch same-origin → domain routers
                                            ↓ validation / CSRF / authentication
                                            ↓ commerce services
                                            ↓ SQLite + prepared statements + transactions
```

کارت محصول (`productCard`)، کارت مقاله، اعلان، dialog، فرمت قیمت و header/footer در `common.js` مشترک‌اند. `shop.js` بین صفحات shop/category/search مشترک است، اما هر یک سند HTML و URL مستقل دارد. فیلترها در query string هستند تا refresh و اشتراک‌گذاری نتایج کار کند. هیچ محصولی در قالب HTML hardcode نشده است.

`schema.sql` منبع ساخت جدول‌ها و `seed.js` منبع داده نمونه است. Seed فقط زمانی اجرا می‌شود که جدول محصولات خالی باشد. برای تغییر دیتابیس دارای داده باید migration صریح اضافه شود؛ حذف فایل DB در محیط واقعی راه مهاجرت نیست.

## موجودیت‌ها و قرارداد داده

| موجودیت | فیلدهای کلیدی | رابطه / رفتار |
|---|---|---|
| `products` | id, slug, name, brand, sku, price, old_price, stock, type, image, gallery, short_description, description, specs, colors, rating, sales, featured, created_at | price عدد صحیح **تومان**؛ image مسیر محلی؛ gallery/specs/colors در DB JSON و در API ساختاریافته |
| `categories` | id, slug, name, parent_id, image | parent_id nullable؛ ساختار والد/فرزند |
| `product_categories` | product_id, category_id | چندبه‌چند؛ انتساب به والد نیز در seed صریح است |
| `users` | id, name, email, phone, password_hash, created_at | ایمیل unique؛ password_hash هرگز در پاسخ حساب ارسال نمی‌شود |
| `sessions` | sid, data, expires | داده نشست سرور؛ منقضی‌ها به‌صورت دوره‌ای پاک می‌شوند |
| `carts` | id(UUID), user_id(nullable), created_at | مهمان با session؛ حساب با user_id unique |
| `cart_items` | cart_id, product_id, color, quantity | کلید مرکب؛ quantity بین ۱ تا ۲۰؛ قیمت هر بار از products |
| `wishlist` | cart_id, product_id | مهمان و کاربر از یک فضای مالکیت استفاده می‌کنند |
| `addresses` | id, user_id, title, recipient, phone, province, city, address, postal_code | حداکثر ۲۰ نشانی برای هر حساب |
| `orders` | id, user_id, cart_id, tracking_code, idempotency_key, status, subtotal, shipping, total, address, created_at | address یک snapshot JSON؛ تنها وضعیت فعلی demo_confirmed |
| `order_items` | order_id, product_id, name, image, color, quantity, unit_price | نام/تصویر/قیمت snapshot؛ تغییر آینده کاتالوگ فاکتور قبلی را عوض نمی‌کند |
| `reviews` | product_id, user_id, name, rating, body, created_at | یک نظر به ازای کاربر/محصول؛ ثبت مجدد update می‌کند؛ نمونه‌ها user_id=NULL دارند |
| `posts` | slug, title, excerpt, body, image, read_minutes | سه مقاله فارسی نمونه |
| `contacts`, `subscribers` | نام/ایمیل/پیام یا ایمیل unique | ذخیره واقعی؛ بدون ارسال ایمیل |

### نکات قیمت و موجودی

- `price` قیمت فعال و `old_price` قیمت پیش از تخفیف است؛ `old_price=NULL` یعنی تخفیف ندارد.
- مجموع و هزینه ارسال فقط در سرور محاسبه می‌شود. مرز ارسال رایگان ۵٬۰۰۰٬۰۰۰ تومان و هزینه زیر آن ۶۹٬۰۰۰ تومان است.
- رنگ‌ها attribute انتخابی‌اند، نه SKU مستقل؛ مجموع تعداد رنگ‌های یک محصول نباید از stock مشترک عبور کند.
- قیمت و stock، داده نمونه‌اند. ارزیابی ورودی مالی از سمت کاربر انجام نمی‌شود چون این فیلدها از درخواست خوانده نمی‌شوند.

## چرخه سفارش آزمایشی

1. نشست معتبر، CSRF، ورود کاربر، نشانی معتبر و پذیرش demo لازم است.
2. یک `idempotency_key` تصادفی در صفحه checkout ساخته می‌شود و در retry همان صفحه ثابت است.
3. `BEGIN IMMEDIATE`: درخواست تکراری بررسی می‌شود؛ سبد از دیتابیس خوانده می‌شود.
4. موجودی مجموع همه رنگ‌ها با `UPDATE ... WHERE stock >= quantity` کاهش می‌یابد.
5. snapshot سفارش و اقلام ذخیره و سبد پاک می‌شود.
6. خطای هر مرحله، کل تراکنش را rollback می‌کند؛ سفارش نیمه‌کاره و کاهش جزئی موجودی باقی نمی‌ماند.
7. کد پیگیری ۱۲ رقم hex تصادفی با پیشوند MH ساخته می‌شود. endpoint عمومی پیگیری به شماره گیرنده هم نیاز دارد و نشانی را برنمی‌گرداند.

درگاه واقعی باید حالت‌های pending/paid/failed/refunded، رزرو موجودی با انقضا و idempotency تراکنش درگاه را اضافه کند. کاهش موجودی فعلی فقط منطق سفارش نمایشی است، نه پیاده‌سازی پرداخت واقعی.

## تبدیل به قالب WooCommerce (طرح آینده، پیاده‌سازی نشده)

### نگاشت داده

| فعلی | WooCommerce آینده |
|---|---|
| products.id | شناسه WordPress/WC؛ نگاشت legacy ID برای migration |
| name / slug | post_title / post_name |
| sku | `_sku` با WC CRUD |
| price / old_price | sale_price / regular_price؛ اگر old_price خالی است price به regular_price |
| stock | manage_stock و stock_quantity؛ با APIهای WC، نه SQL مستقیم |
| short_description / description | post_excerpt / post_content |
| image / gallery | attachment IDs و gallery image IDs |
| categories + parent_id | taxonomy `product_cat` با parent |
| brand | taxonomy برند انتخابی پروژه |
| specs | attributes برای مشخصات و جدول ویژگی‌ها |
| colors | `pa_color`؛ در صورت موجودی/قیمت جداگانه، variable product و variation SKU واقعی |
| reviews | comment + rating meta با کنترل تأیید خرید WC |
| users | WP user / WC customer؛ **رمزها و نشست‌ها را مستقیم migrate نکنید** |
| carts / wishlist | cart/session بومی WooCommerce؛ wishlist لایه مستقل یا افزونه مناسب |
| orders / items | WC Order CRUD / HPOS؛ snapshotها حفظ شوند |
| addresses | billing/shipping customer meta |

**تومان/ریال:** WooCommerce و درگاه باید واحد پول واحد و صریح داشته باشند. اگر درگاه ریال می‌خواهد، تبدیل ×۱۰ فقط در adapter پرداخت انجام شود و با تست پوشش داده شود؛ رشته فرمت‌شده UI منبع قیمت نیست.

### مراحل تبدیل

1. CSS، تصاویر، فونت و اجزای header/footer را به قالب PHP و asset enqueue منتقل کنید.
2. `productCard` به template part و صفحات به archive-product، taxonomy-product_cat و single-product تبدیل شوند.
3. منبع داده کاتالوگ را با WC CRUD و hookها جایگزین کنید؛ Express و SQLite دیگر مرجع محصولات/حساب/خرید نباشند.
4. فرم‌ها از nonce، validation، cart/checkout/session بومی WooCommerce استفاده کنند؛ پروتکل CSRF فعلی همراه Express حذف می‌شود.
5. variations، taxes، shipping zones و gateway را در WooCommerce پیکربندی کنید. از بازسازی موازی سفارش در SQLite خودداری کنید.
6. URLهای legacy را به permalinkهای جدید redirect کنید و migration staging را با کنترل جمع قیمت/موجودی انجام دهید.
7. آزمون‌ها را برای قرارداد جدید بازنویسی کنید. تست‌های responsive و محتوای فارسی قابل‌استفاده مجددند.

## بهره‌برداری

پروژه فعلی برای یک process روی دیسک پایدار طراحی شده است. SQLite WAL قفل نوشتن و تراکنش را تأمین می‌کند؛ در استقرار چند replica نیاز به معماری مشترک دیتابیس و rate-limit store وجود دارد. گذار به MySQL نیازمند adapter/queries/migrations است و صرفاً تغییر متغیر محیطی نیست.

پاک‌سازی نشست‌های منقضی انجام می‌شود، اما retention سبدهای رهاشده، پیام‌ها، حساب‌ها و سفارش‌ها باید پیش از انتشار عمومی سیاست‌گذاری شود. پنل ادمین، backup خودکار، ایمیل و عملیات ارسال در این نسخه وجود ندارد و به‌عنوان قابلیت آماده معرفی نشده است.
