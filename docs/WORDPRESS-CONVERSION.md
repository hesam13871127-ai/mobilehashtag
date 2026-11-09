# راهنمای تبدیل به قالب وردپرس + ووکامرس (فاز آینده)

> این سند نقشه راه تبدیل نسخه مستقل فعلی به **قالب نیتیو وردپرس با ووکامرس واقعی** است.
> در فاز فعلی هیچ فایل وردپرسی تولید نشده؛ معماری طوری طراحی شده که تبدیل نیاز به بازطراحی نداشته باشد.

## ۱. چرا تبدیل آسان است؟

- مدل‌ها (`src/models`) دقیقاً معادل موجودیت‌های ووکامرس‌اند (نگاشت در `DATA-STRUCTURE.md`).
- منطق سبد/قیمت از نمایش جداست؛ در وردپرس با `WC_Cart` و هوک‌ها جایگزین می‌شود.
- کامپوننت‌های قابل‌استفاده مجدد (`ProductCard`، `CategoryCard`، `HeroSlider`، `Pagination`...) مستقیماً به تمپلیت‌پارت‌ها تبدیل می‌شوند.
- تنظیمات قالب متمرکز است (`Settings`) و به Customizer نگاشت می‌شود.

## ۲. ساختار پیشنهادی قالب

```
mobile-hashtag/
  style.css  rtl.css  functions.php  header.php  footer.php
  index.php  front-page.php  page.php  single.php  archive.php  404.php
  woocommerce/
    archive-product.php  single-product.php  cart/  checkout/
    loop/  global/  myaccount/  content-product.php
  template-parts/  card-product.php  card-category.php  hero-slider.php  ...
  inc/
    setup.php  enqueue.php  customizer.php  cpt-banner.php
    tax-brand.php  home-sections.php  helpers.php
  assets/  (css/js/images/fonts از همین پروژه)
  languages/  mobile-hashtag-fa_IR.po
```

## ۳. نگاشت کامپوننت → وردپرس

| فعلی (React) | وردپرسی |
|---|---|
| `ProductCard` | `template-parts/card-product.php` + `content-product.php` |
| `HeroSlider` | `template-parts/hero-slider.php` + CPT `banner` |
| صفحات فروشگاه/دسته/محصول | `archive-product.php` / `taxonomy-product_cat.php` / `single-product.php` |
| سبد/تسویه‌حساب نمایشی | سبد و تسویه‌حساب **نیتیو ووکامرس** (حذف کد نمایشی) |
| حساب کاربری نمایشی | `myaccount` ووکامرس + نقش‌های WP |
| `Settings` | Customizer (`customize_register`) + `get_theme_mod` |
| `HomeSection` | repeater در Customizer یا ACF/MetaBox |
| `Review` | دیدگاه‌های ووکامرس (`woocommerce_review`) |

## ۴. گام‌های اجرایی

1. اعلام پشتیبانی ووکامرس: `add_theme_support('woocommerce')` + گالری/زوم/لایت‌باکس.
2. ثبت تاکسونومی `brand` و CPT `banner` + متاباکس‌های جایگاه/رنگ/تاریخ.
3. انتقال استایل‌ها به `assets/css` + `rtl.css` و اسکریپت‌ها با `wp_enqueue_*` (بدون CDN خارجی).
4. بازنویسی کوئری‌ها با `WP_Query`/`wc_get_products` و حفظ همان اسلاگ‌ها برای سئو.
5. مهاجرت داده نمایشی: اسکریپت ایمپورت محصولات/دسته‌ها/بنرها به ووکامرس (از روی همان JSON).
6. فرم‌ها با nonce، خروجی‌ها با `esc_*`، ورودی‌ها با `sanitize_*`؛ نقش‌ها با `current_user_can`.
7. تست: پرداخت واقعی (زرین‌پال/...)، ایمیل‌ها، پیامک، سئو (Yoast/RankMath)، کش و موبایل.

## ۵. چه چیزی دور ریخته می‌شود؟

- `services/db.tsx` و `services/shop.tsx` (جایگزین: WP/WC API) — **رابط و استایل‌ها حفظ می‌شوند**.
- هش نمایشی و نشست localStorage (جایگزین: احراز هویت وردپرس).

## ۶. چک‌لیست پذیرش فاز وردپرس

- [ ] نصب با یک کلیک + ایمپورت دمو
- [ ] سازگاری با ووکامرس و هوک‌های استاندارد (بدون هک هسته)
- [ ] پشتیبانی منوها، ابزارک‌ها/بلوک‌ها، Customizer
- [ ] راست‌چین کامل + فارسی‌سازی رشته‌ها
- [ ] PageSpeed موبایل ≥ ۸۵
