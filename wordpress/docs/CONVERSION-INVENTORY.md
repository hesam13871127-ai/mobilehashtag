# موجودی پیش از پیاده‌سازی

مرجع: کد تأییدشده commit `44e0ff3`، فایل‌های واقعی در frontend/backend و SQLite موجود. خواندن دیتابیس با mode=ro انجام شد. فهرست و SHA-256 تمام فایل‌های منبع، ردیف‌های دسته‌بندی و مشخصات محصولات در `source-inventory.json` ثبت شده است. هیچ حساب، رمز، سفارش، پیام خصوصی یا نشست در خروجی مهاجرت قرار نمی‌گیرد.

## صفحات و مقصد WordPress

| منبع موجود | مقصد تبدیل |
|---|---|
| index.html | front-page.php؛ تمام ۱۷ بخش سطح اول و newsletter در footer |
| shop.html | آرشیو رسمی محصولات WooCommerce |
| category.html?slug=… | taxonomy product_cat؛ هر ۴۷ دسته، شامل phones/accessories |
| product.html?slug=… | single-product با داده و فرم خرید WooCommerce |
| cart.html | shortcode سبد رسمی WooCommerce با استایل حفظ‌شده |
| checkout.html | shortcode checkout رسمی WooCommerce |
| account.html | WooCommerce My Account و endpointهای آن |
| login.html / register.html | دو ورودی صفحه به فرم‌های ورود/ثبت‌نام رسمی WooCommerce |
| wishlist.html | صفحه + shortcode مستقل افزونه Core |
| about.html | محتوای صفحه قابل‌ویرایش وردپرس با همان markup |
| contact.html | قالب همان صفحه + shortcode تماس Core |
| blog.html | home.php / صفحه نوشته‌ها |
| article.html?slug=… | single.php؛ سه مقاله منبع |
| faq.html | محتوای صفحه قابل‌ویرایش با details/summary |
| tracking.html | shortcode رهگیری رسمی WooCommerce؛ شماره سفارش و ایمیل، نه کد سفارشی SQLite |
| search.html?q=… | search.php و جست‌وجوی محصولات WooCommerce |
| privacy.html / terms.html | صفحات قابل‌ویرایش سیاست/قوانین |
| order.html?id=… | endpoint جزئیات سفارش در My Account؛ فقط مالک مجاز |
| 404.html | 404.php |

۲۱ فایل HTML واقعی وجود دارد؛ دو دستهٔ اصلی URL مستقل همان قالب دسته‌بندی هستند. URLهای قدیمی باید به مقصد وردپرسی تبدیل/redirect شوند، نه اینکه فرانت‌اند به Express متصل بماند.

## اجزا و تعاملات

- header تولیدشده در common.js: نوار اطلاع‌رسانی، لوگوی SVG/نام فارسی، جست‌وجو، حساب، قلب، سبد، nav و مگامنوی سلسله‌مراتبی.
- footer: خبرنامه، چهار ستون، تماس مرکزی و توضیح آزمایشی.
- خانه: hero چهاراسلایدی، مزایا، ۱۲ کارت دسته، سه promo، گوشی‌ها، تخفیف، کمپین صدا، پرفروش، لوازم، دو promo، تازه‌ها، گجت، کمپین اسپیکر، برند، نظرات نمونه، مجله، تماس.
- productCard، postCard، modal، toast، loading/empty state، اسلایدر با pause و reduced-motion، دو کاروسل، فیلتر URL-driven.
- ۱۱۵ فایل تصویری + favicon؛ اصل PNGها، WebP بهینه، تصویرسازی SVG، لوگو و گرافیک برند؛ فونت‌های محلی Vazirmatn و Symbols با OFL.
- CSS اصلی با breakpoints 1600، 1250، 1000، 800، 600، 375 حفظ می‌شود؛ فقط adapter ضروری WC افزوده می‌شود.

## داده و مهاجرت

SQLite واقعی: **۲۸ محصول، ۴۷ دسته، ۹۱ رابطه product_categories، ۳ مقاله** (تعداد دقیق روابط را manifest همراه تعیین می‌کند). تمام محصولات source نوع simple دارند. رنگ‌ها انتخاب بدون SKU/موجودی مستقل‌اند؛ نباید خودسرانه به variationهای با موجودی تکرارشده تبدیل شوند. مشخصات و رنگ به attributes محصول منتقل می‌شوند؛ امکان ایجاد variable product جدید با ابزار رسمی WC فراهم خواهد بود.

منبع دسته‌ها description ندارد؛ مقدار خالی وارد می‌شود، نه توضیح ساختگی. rating/sales/reviews دادهٔ نمایشی‌اند؛ دیدگاه‌های فرضی به عنوان نظر خرید واقعی وارد نمی‌شوند. رابط related در منبع از اشتراک دسته مشتق می‌شود؛ WooCommerce رابطه دسته و related بومی را به کار می‌گیرد.

## فرم‌ها و مسئولیت‌ها

- تماس: name/email/message؛ ذخیره در SQLite. Core نام/ایمیل/پیام را حفظ و تلفن اختیاری و ثبت source URL/status/mail status اضافه می‌کند.
- خبرنامه: email؛ به submission نوع newsletter با رضایت صریح منتقل می‌شود.
- ثبت‌نام/ورود، پروفایل/رمز، نشانی، checkout، رهگیری و reviews: به WordPress/WooCommerce واگذار می‌شوند.
- wishlist: از cart_id SQLite به user meta برای حساب و توکن مهمان server-side در Core؛ هیچ دادهٔ تجاری در localStorage.
- داده تماس: backend/config/contact.json با demo flag، شماره‌های رزروشده، دامنه‌های .example، نقشه بدون مختصات؛ به Settings API منتقل می‌شود.

## جداول منبع

categories، products، product_categories، users، sessions، carts، cart_items، wishlist، addresses، orders، order_items، contacts، subscribers، reviews، posts. فقط کاتالوگ، روابط، تصاویر، مقالات و محتوای عمومی وارد می‌شوند. جداول مشتری/سفارش/نشست/فرم منبع دست‌نخورده می‌مانند و در بسته‌ها منتشر نمی‌شوند.

## محیط آزمون و مرز معماری

PHP یا MySQL بومی در sandbox نصب نیست. ابتدا محیط واقعی WordPress با PHP-WASM و SQLite adapter رسمی Playground بررسی می‌شود؛ این ابزار آزمون است و در theme/plugin نصب‌شدنی قرار نمی‌گیرد. نسخه‌ها از انتشار رسمی GitHub بررسی و هنگام نصب ثبت می‌شوند. نصب روی هاست معمولی PHP/MySQL جداگانه در راهنما توضیح داده خواهد شد؛ آزمون انجام‌نشده MySQL به عنوان موفق گزارش نمی‌شود.
