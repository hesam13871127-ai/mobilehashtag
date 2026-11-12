# MOBILE HASHTAG — نسخهٔ نصب‌شدنی 1.0.2

فروشگاه فارسی/RTL با طراحی اصلی سفید و طلایی، فونت محلی Vazirmatn و تصاویر/نشان مرجع؛ قالب WordPress و افزونهٔ مستقل Core. برنامهٔ اصلی Node/SQLite مرجع حذف یا بازنویسی نشده است.

## دانلود و نصب

- `packages/mobile-hashtag-wordpress-theme.zip` → Appearance → Themes → Add New → Upload Theme
- `packages/mobile-hashtag-core-plugin.zip` → Plugins → Add New → Upload Plugin
- **WooCommerce رسمی** را جداگانه از مخزن وردپرس نصب و فعال کنید؛ نسخهٔ بررسی‌شده 11.2.2 است.

[راهنمای فارسی نصب](docs/INSTALL-FA.md) · [گزارش QA و سازگاری](docs/FINAL-QA-FA.md) · [محدودیت‌ها](docs/KNOWN-LIMITATIONS.md)

هاست معمول WordPress با PHP حداقل 8.1 و MySQL/MariaDB مطابق الزامات WordPress/WooCommerce لازم است. برای نصب مشتری **هیچ Node، PHP-WASM، SQLite، Arena runtime یا virtual mount لازم نیست**. [توضیح معماری](docs/PORTABILITY-FA.md).

## راه‌اندازی ضروری پس از فعال‌سازی

از **Mobile Hashtag ← راه‌اندازی فروشگاه** اجازهٔ تنظیم تومان (فقط فروشگاه خالی) و اتصال صفحات را بررسی کنید؛ دکمهٔ «راه‌اندازی کامل / ادامهٔ ورود محصولات» ورود واقعی ۲۸ محصول/۴۷ دسته را خودکار اجرا می‌کند. صرف نصب ZIP محصول نمونه را بدون تأیید وارد فروشگاه نمی‌کند. برگه‌های ضروری در اولین بازدید مدیریتی مستقل از مهاجرت ساخته می‌شوند.

[راهنمای ورود محصولات](docs/MIGRATION-FA.md) · [فهرست ۱۶ برگه](docs/PAGES-FA.md)

## امکانات

- ۱۷ بخش خانه، ۲۱ نوع صفحهٔ مرجع، منو/فوتر/جست‌وجو/فیلتر/گالری و قالب‌های بومی WooCommerce.
- کاتالوگ واقعی و قابل ویرایش: ۲۸ محصول مرجع، ۴۷ دسته، ۹۱ رابطه، ۳ مقاله و ۵۸ رسانه؛ واردکنندهٔ بدون تکرار و بدون بازنویسی اطلاعات موجود.
- محصولات simple/variable، سبد، تسویه، کوپن، حساب، سفارش و review توسط خود WooCommerce.
- تماس/مشاوره/خبرنامه با ذخیرهٔ واقعی، مدیریت/جست‌وجو/وضعیت/CSV/حذف، خطای ایمیل مستقل، تنظیمات مرکزی و ابزارهای حریم خصوصی.
- علاقه‌مندی حساب و مهمان سمت سرور؛ بدون cart/order ساختگی در localStorage.
- لوگو، رنگ، بنر/لینک، عنوان و نمایش بخش‌ها از Customizer؛ اطلاعات تماس/شبکه‌ها از Store Settings.

## نتایج و مرز اطمینان

نصب ZIP روی WordPress خالی و راه‌اندازی واقعی از پیشخوان، Customizer با ذخیره/بازگردانی، ریسپانسیو، محصولات/variation، سبد/سفارش COD و مدیریت پیام‌ها واقعاً آزموده شدند. گزارش‌های خام و تصاویر در `docs/reports/` هستند. آزمون روی WordPress واقعی/PHP-WASM/SQLite انجام شده؛ **اجرای بومی MySQL/MariaDB، پرداخت بانکی و تحویل SMTP تأیید نشده‌اند**. جزئیات تنظیم hold-stock آزمایش و سایر محدودیت‌ها در گزارش نهایی شفاف‌اند.

## سورس و شواهد

- سورس کامل: `theme/mobile-hashtag/` و `plugin/mobile-hashtag-core/`
- راهنماهای مهاجرت/WooCommerce/SMTP: `docs/`
- اعتبارسنجی ZIP و SHA-256: `docs/reports/package-verification.json`
- نصب دقیق بستهٔ تحویل: `docs/reports/v1.0.2/release-install.txt`
- نسخهٔ قبلی محفوظ: `packages/archive/1.0.0/` و `packages/archive/1.0.1/`
- `tests/` و `tools/` فقط توسعه‌اند؛ داخل بستهٔ نصب نیستند. `.runtime/` محیط خصوصی آزمایش و gitignored است.
