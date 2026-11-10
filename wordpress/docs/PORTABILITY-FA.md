# استقلال بسته‌های نصب از محیط توسعه

## آنچه روی هاست لازم است

WordPress معمولی، PHP حداقل 8.1 با افزونه‌های موردنیاز WordPress/WooCommerce، دیتابیس MySQL یا MariaDB مطابق الزامات نسخهٔ WordPress، دسترسی عادی WordPress به uploads و دو ZIP هشتگ. WooCommerce رسمی جداگانه از افزونه‌ها ← افزودن نصب می‌شود. برای فضای فارسی، زبان سایت و ترجمهٔ رسمی WooCommerce را فارسی انتخاب/به‌روز کنید.

**Node.js، Arena، PHP-WASM، SQLite، virtual mount و custom HTTP server برای استفاده از قالب یا Core لازم نیستند.** بسته‌ها هیچ فایل از آنها ندارند. نام `zip-install.example.test` فقط متعلق به آزمون تاریخی بود و در کد اجرایی بسته‌ها وجود ندارد.

## معماری واقعی کد نصب‌شدنی

- جدول پیام‌ها با `dbDelta`، `$wpdb->prefix` و `$wpdb->get_charset_collate()` ساخته می‌شود. INSERT/UPDATE/DELETE و queryهای فیلتر از `$wpdb` و placeholderهای آماده‌شده استفاده می‌کنند؛ اتصال مستقیم PDO/SQLite یا فایل دیتابیس خصوصی وجود ندارد.
- محصولات/variation/قیمت/موجودی/سفارش از کلاس‌ها و APIهای WooCommerce استفاده می‌کنند. قالب دیتابیس تجارت جداگانه‌ای ندارد.
- تنظیمات در WordPress options، ظاهر در theme mods/Customizer، علاقه‌مندی حساب در user meta و مهمان در transient قرار دارد.
- تصاویر مهاجرتی با `media_handle_sideload` وارد Media Library می‌شوند. URLها با `home_url`، `admin_url`، `plugins_url` و APIهای رسانه ساخته می‌شوند؛ مسیر `/wordpress` یا `/workspace` در کد تحویل وجود ندارد.
- کاتالوگ عمومی داخل افزونه JSON و تصاویر است؛ در زمان نصب مشتری، SQLite اصلی خوانده نمی‌شود.
- هیچ فایل WordPress یا WooCommerce داخل ZIPهای هشتگ نیست و هیچ هسته‌ای برای کارکرد آنها اصلاح نشده است.

## تفاوت محیط آزمون با محصول

در محیط محدود Agent، PHP اجرایی سیستم، MySQL/MariaDB و کانتینر آماده موجود نبودند. تلاش محدود برای دسترسی به مخزن Debian جهت تهیهٔ ابزارها با خطای اتصال به deb.debian.org شکست خورد. بنابراین آزمون بومی PHP-FPM/MySQL در این محیط **انجام نشده** و تأییدشده اعلام نمی‌شود.

به جای تکرار بررسی hostname آزمایشی قدیمی، یک کپی جدا از نصب ZIP موجود برای QA ساخته شد و خود بسته‌ها با نصب‌کنندهٔ WordPress روی آن نصب شدند. PHP-WASM/SQLite و mount نسخهٔ رسمی WC صرفاً ابزار اجرای این آزمون‌اند، نه dependency بستهٔ تحویل. آزمون‌های واقعی انجام‌شده و محدودیت‌های adapter در FINAL-QA-FA.md مشخص‌اند.

روی هاست واقعی، WordPress از همان اتصال MySQL/MariaDB خودش استفاده می‌کند و WooCommerce رسمی مانند هر فروشگاه استاندارد دیگری نصب می‌شود؛ تنظیمات تست مانند `hold_stock_minutes=0` توسط قالب/Core روی سایت مشتری اعمال نمی‌شوند.
