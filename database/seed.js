import { db } from '../backend/config/db.js';
import { pathToFileURL } from 'node:url';
export function seed() {
  if (db.prepare('SELECT COUNT(*) AS n FROM products').get().n) return;
  db.transaction(() => {
    const groups = [
      [
        'phones',
        'گوشی موبایل',
        'iphone',
        [
          ['all-phones', 'همه گوشی‌ها'],
          ['samsung', 'گوشی سامسونگ'],
          ['apple', 'گوشی اپل'],
          ['xiaomi', 'گوشی شیائومی'],
          ['redmi', 'گوشی ردمی'],
          ['poco', 'گوشی پوکو'],
          ['honor', 'گوشی آنر'],
          ['budget', 'گوشی اقتصادی'],
          ['midrange', 'گوشی میان‌رده'],
          ['flagship', 'گوشی پرچمدار'],
          ['gaming-phones', 'گوشی گیمینگ'],
        ],
      ],
      [
        'accessories',
        'لوازم جانبی',
        'headphones',
        [
          ['cases', 'قاب و کاور', 'case'],
          ['glass', 'گلس گوشی', 'glass'],
          ['lens', 'محافظ لنز', 'lens'],
          ['wall-chargers', 'شارژر دیواری', 'charger'],
          ['adapters', 'آداپتور شارژ', 'charger'],
          ['cables', 'کابل شارژ', 'cable'],
          ['type-c', 'کابل Type-C', 'cable'],
          ['lightning', 'کابل Lightning', 'cable'],
          ['powerbanks', 'پاوربانک', 'powerbank'],
          ['wired-earphones', 'هندزفری سیمی', 'earbuds'],
          ['wireless-earphones', 'هندزفری بلوتوثی', 'airpods'],
          ['airpods', 'ایرپاد', 'airpods'],
          ['headphones', 'هدفون', 'headphones'],
          ['headsets', 'هدست', 'headphones'],
          ['speakers', 'اسپیکر بلوتوثی', 'speaker'],
          ['holders', 'هولدر موبایل', 'holder'],
          ['stands', 'پایه نگهدارنده', 'holder'],
          ['converters', 'تبدیل و مبدل', 'adapter'],
          ['memory-cards', 'کارت حافظه', 'memory'],
          ['flash-drives', 'فلش مموری', 'flash'],
          ['iphone-accessories', 'لوازم جانبی آیفون', 'case'],
          ['samsung-accessories', 'لوازم جانبی سامسونگ', 'charger'],
        ],
      ],
      [
        'gadgets',
        'ساعت و گجت',
        'watch',
        [
          ['smartwatches', 'ساعت هوشمند', 'watch'],
          ['smartbands', 'مچ‌بند هوشمند', 'watch'],
          ['watch-straps', 'بند ساعت', 'strap'],
          ['watch-accessories', 'لوازم جانبی ساعت', 'strap'],
          ['trackers', 'ردیاب هوشمند', 'tracker'],
        ],
      ],
      [
        'digital',
        'تجهیزات دیجیتال',
        'tablet',
        [
          ['tablets', 'تبلت', 'tablet'],
          ['stylus', 'قلم لمسی', 'pen'],
          ['tablet-accessories', 'لوازم جانبی تبلت', 'holder'],
          ['gaming', 'تجهیزات گیمینگ', 'gamepad'],
          ['digital-equipment', 'تجهیزات دیجیتال', 'adapter'],
        ],
      ],
    ];
    const cat = {};
    const addCat = db.prepare('INSERT INTO categories(slug,name,parent_id,image) VALUES(?,?,?,?)');
    for (const [slug, name, img, children] of groups) {
      cat[slug] = Number(
        addCat.run(slug, name, null, `/assets/images/products/${img}.webp`).lastInsertRowid
      );
      for (const [s, n, i] of children)
        cat[s] = Number(
          addCat.run(s, n, cat[slug], `/assets/images/products/${i || img}.webp`).lastInsertRowid
        );
    }
    const rows = [
      [
        'iphone-15-pro-max',
        'گوشی اپل آیفون ۱۵ پرو مکس، ۲۵۶ گیگابایت',
        'Apple',
        89900000,
        94900000,
        'iphone',
        ['apple', 'flagship'],
        {
          'حافظه داخلی': '۲۵۶ گیگابایت',
          'حافظه رم': '۸ گیگابایت',
          نمایشگر: '۶.۷ اینچ Super Retina XDR',
          پردازنده: 'Apple A17 Pro',
          'دوربین اصلی': '۴۸ مگاپیکسل',
          'وضعیت رجیستری': 'نمونه نمایشی؛ نیازمند تأیید فروشنده',
        },
        ['تیتانیوم طبیعی', 'تیتانیوم مشکی'],
      ],
      [
        'galaxy-s24-ultra',
        'گوشی سامسونگ گلکسی S24 Ultra، ۲۵۶ گیگابایت',
        'Samsung',
        72900000,
        78900000,
        'samsung',
        ['samsung', 'flagship', 'gaming-phones'],
        {
          'حافظه داخلی': '۲۵۶ گیگابایت',
          'حافظه رم': '۱۲ گیگابایت',
          نمایشگر: '۶.۸ اینچ Dynamic AMOLED',
          پردازنده: 'Snapdragon 8 Gen 3',
          'دوربین اصلی': '۲۰۰ مگاپیکسل',
        },
        ['خاکستری تیتانیومی', 'مشکی'],
      ],
      [
        'redmi-note-13-pro',
        'گوشی شیائومی ردمی Note 13 Pro، ۲۵۶ گیگابایت',
        'Xiaomi',
        18900000,
        21500000,
        'xiaomi',
        ['xiaomi', 'redmi', 'midrange'],
        {
          'حافظه داخلی': '۲۵۶ گیگابایت',
          'حافظه رم': '۸ گیگابایت',
          نمایشگر: '۶.۶۷ اینچ AMOLED',
          باتری: '۵۱۰۰ میلی‌آمپرساعت',
          'دوربین اصلی': '۲۰۰ مگاپیکسل',
        },
        ['یاسی', 'مشکی'],
      ],
      [
        'airpods-pro-2',
        'هدفون بی‌سیم اپل AirPods Pro نسل دوم',
        'Apple',
        12490000,
        13900000,
        'airpods',
        ['wireless-earphones', 'airpods', 'iphone-accessories'],
        {
          'نوع اتصال': 'بلوتوث ۵.۳',
          'حذف نویز': 'فعال (ANC)',
          'درگاه شارژ': 'USB-C',
          'شارژدهی با کیس': 'تا ۳۰ ساعت',
        },
        ['سفید'],
      ],
      [
        'sony-wh-1000xm5',
        'هدفون بی‌سیم سونی WH-1000XM5',
        'Sony',
        18900000,
        21500000,
        'headphones',
        ['headphones', 'headsets'],
        {
          'نوع اتصال': 'بلوتوث و کابل',
          'حذف نویز': 'فعال (ANC)',
          شارژدهی: 'تا ۳۰ ساعت',
          وزن: '۲۵۰ گرم',
        },
        ['نقره‌ای شنی', 'مشکی'],
      ],
      [
        'anker-powerbank-20k',
        'پاوربانک انکر ۲۰۰۰۰ میلی‌آمپرساعت',
        'Anker',
        2490000,
        2990000,
        'powerbank',
        ['powerbanks'],
        {
          ظرفیت: '۲۰۰۰۰ میلی‌آمپرساعت',
          'توان خروجی': '۲۲.۵ وات',
          درگاه: 'USB-C و USB-A',
          نمایشگر: 'میزان شارژ',
        },
        ['مشکی'],
      ],
      [
        'anker-charger-30w',
        'شارژر دیواری انکر ۳۰ وات مدل Nano',
        'Anker',
        1290000,
        1490000,
        'charger',
        ['wall-chargers', 'adapters', 'samsung-accessories'],
        { توان: '۳۰ وات', درگاه: 'USB-C', فناوری: 'Power Delivery', 'نوع دوشاخه': 'اروپایی' },
        ['سفید'],
      ],
      [
        'iphone-silicone-case',
        'قاب سیلیکونی آیفون ۱۵ پرو، سبز زیتونی',
        'Hashtag',
        490000,
        650000,
        'case',
        ['cases', 'iphone-accessories'],
        {
          جنس: 'سیلیکون نرم',
          سازگاری: 'iPhone 15 Pro',
          'پوشش داخلی': 'میکروفایبر',
          محافظت: 'لبه برجسته دوربین',
        },
        ['سبز زیتونی'],
      ],
      [
        'apple-watch-s9',
        'ساعت هوشمند اپل واچ سری ۹، ۴۵ میلی‌متر',
        'Apple',
        21900000,
        24500000,
        'watch',
        ['smartwatches'],
        {
          اندازه: '۴۵ میلی‌متر',
          نمایشگر: 'Retina همیشه روشن',
          بدنه: 'آلومینیوم',
          سازگاری: 'آیفون با iOS 17 یا جدیدتر',
        },
        ['نقره‌ای'],
      ],
      [
        'jbl-flip-6',
        'اسپیکر بلوتوثی جی‌بی‌ال Flip 6',
        'JBL',
        6490000,
        7200000,
        'speaker',
        ['speakers'],
        {
          'توان خروجی': '۳۰ وات',
          شارژدهی: 'تا ۱۲ ساعت',
          مقاومت: 'IP67',
          'نوع اتصال': 'بلوتوث ۵.۱',
        },
        ['مشکی'],
      ],
      [
        'poco-x6',
        'گوشی پوکو X6، ۲۵۶ گیگابایت',
        'Poco',
        16900000,
        17900000,
        'poco',
        ['poco', 'midrange', 'gaming-phones'],
        { 'حافظه داخلی': '۲۵۶ گیگابایت', 'حافظه رم': '۱۲ گیگابایت', نمایشگر: 'AMOLED' },
        ['مشکی'],
      ],
      [
        'honor-x7',
        'گوشی آنر X7، ۱۲۸ گیگابایت',
        'Honor',
        10900000,
        null,
        'honor',
        ['honor', 'budget'],
        { 'حافظه داخلی': '۱۲۸ گیگابایت', 'حافظه رم': '۴ گیگابایت', نمایشگر: '۶.۷۴ اینچ' },
        ['مشکی'],
      ],
      [
        'redmi-a3',
        'گوشی شیائومی ردمی A3، ۱۲۸ گیگابایت',
        'Xiaomi',
        6490000,
        null,
        'redmi',
        ['xiaomi', 'redmi', 'budget'],
        { 'حافظه داخلی': '۱۲۸ گیگابایت', 'حافظه رم': '۴ گیگابایت' },
        ['مشکی'],
      ],
      [
        'tempered-glass',
        'گلس تمام‌صفحه سامسونگ S24 Ultra',
        'Hashtag',
        290000,
        350000,
        'glass',
        ['glass', 'samsung-accessories'],
        { جنس: 'شیشه حرارت‌دیده', سختی: '9H' },
        [],
      ],
      [
        'lens-protector',
        'محافظ لنز دوربین آیفون ۱۵ پرو',
        'Hashtag',
        190000,
        null,
        'lens',
        ['lens', 'iphone-accessories'],
        { جنس: 'شیشه و آلومینیوم', تعداد: 'یک مجموعه' },
        [],
      ],
      [
        'usb-c-cable',
        'کابل شارژ Type-C انکر، یک متر',
        'Anker',
        390000,
        490000,
        'cable',
        ['cables', 'type-c', 'samsung-accessories'],
        { طول: '۱ متر', توان: '۶۰ وات', اتصال: 'USB-C به USB-C' },
        ['سفید'],
      ],
      [
        'lightning-cable',
        'کابل شارژ Lightning، یک متر',
        'Hashtag',
        450000,
        null,
        'cable',
        ['cables', 'lightning', 'iphone-accessories'],
        { طول: '۱ متر', اتصال: 'USB-A به Lightning' },
        ['سفید'],
      ],
      [
        'wired-earphones',
        'هندزفری سیمی تایپ سی',
        'Hashtag',
        590000,
        null,
        'earbuds',
        ['wired-earphones'],
        { درگاه: 'USB-C', میکروفون: 'دارد' },
        ['سفید'],
      ],
      [
        'desk-holder',
        'پایه و هولدر رومیزی موبایل',
        'Hashtag',
        690000,
        790000,
        'holder',
        ['holders', 'stands', 'tablet-accessories'],
        { جنس: 'آلومینیوم', 'تنظیم زاویه': 'دارد' },
        ['نقره‌ای'],
      ],
      [
        'usb-hub',
        'هاب و مبدل سه‌درگاه USB-C',
        'Anker',
        1490000,
        null,
        'adapter',
        ['converters', 'digital-equipment'],
        { 'تعداد درگاه': '۳', 'جنس بدنه': 'آلومینیوم' },
        ['نقره‌ای'],
      ],
      [
        'memory-128',
        'کارت حافظه سن‌دیسک ۱۲۸ گیگابایت',
        'SanDisk',
        790000,
        null,
        'memory',
        ['memory-cards'],
        { ظرفیت: '۱۲۸ گیگابایت', کلاس: 'Class 10' },
        [],
      ],
      [
        'flash-64',
        'فلش مموری فلزی ۶۴ گیگابایت',
        'SanDisk',
        490000,
        null,
        'flash',
        ['flash-drives'],
        { ظرفیت: '۶۴ گیگابایت', رابط: 'USB 3.0' },
        ['نقره‌ای'],
      ],
      [
        'smart-band',
        'مچ‌بند هوشمند شیائومی اسمارت بند',
        'Xiaomi',
        2290000,
        2590000,
        'band',
        ['smartbands'],
        { نمایشگر: 'AMOLED', پایش: 'ضربان قلب و فعالیت' },
        ['مشکی'],
      ],
      [
        'watch-strap',
        'بند سیلیکونی ساعت هوشمند ۴۵ میلی‌متر',
        'Hashtag',
        390000,
        null,
        'strap',
        ['watch-straps', 'watch-accessories'],
        { جنس: 'سیلیکون', سایز: '۴۵ میلی‌متر' },
        ['شنی'],
      ],
      [
        'smart-tracker',
        'ردیاب هوشمند بلوتوثی',
        'Hashtag',
        1290000,
        null,
        'tracker',
        ['trackers'],
        { اتصال: 'بلوتوث', باتری: 'قابل تعویض' },
        ['سفید'],
      ],
      [
        'galaxy-tab',
        'تبلت سامسونگ گلکسی Tab A9، ۶۴ گیگابایت',
        'Samsung',
        9990000,
        null,
        'tablet',
        ['tablets'],
        { 'حافظه داخلی': '۶۴ گیگابایت', نمایشگر: '۸.۷ اینچ', 'حافظه رم': '۴ گیگابایت' },
        ['نقره‌ای'],
      ],
      [
        'stylus-pen',
        'قلم لمسی خازنی برای تبلت',
        'Hashtag',
        890000,
        null,
        'pen',
        ['stylus', 'tablet-accessories'],
        { نوع: 'خازنی', سازگاری: 'نمایشگر لمسی خازنی' },
        ['سفید'],
      ],
      [
        'wireless-controller',
        'دسته بازی بی‌سیم چندمنظوره',
        'Hashtag',
        2490000,
        2790000,
        'gamepad',
        ['gaming'],
        { اتصال: 'بلوتوث و USB', سازگاری: 'ویندوز و اندروید' },
        ['سفید'],
      ],
    ];
    const insert = db.prepare(
      'INSERT INTO products(slug,name,brand,sku,price,old_price,stock,image,gallery,short_description,description,specs,colors,rating,sales,featured) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
    );
    rows.forEach((r, index) => {
      const [slug, name, brand, price, old, img, cats, specs, colors] = r;
      const image = `/assets/images/products/${img}.webp`;
      const id = Number(
        insert.run(
          slug,
          name,
          brand,
          `MH-${String(index + 1001)}`,
          price,
          old,
          index === 27 ? 0 : 12 + index,
          image,
          JSON.stringify([image, `/assets/images/products/${img}-detail.webp`]),
          `${name}؛ انتخابی کاربردی برای تجربه‌ای بهتر از تکنولوژی.`,
          `${name} با طراحی کاربردی و امکانات متناسب با استفاده روزمره ارائه می‌شود. پیش از انتخاب، مشخصات فنی و سازگاری دستگاه خود را بررسی کنید.\nاین کالا بخشی از کاتالوگ نمونه موبایل هشتگ است. قیمت‌ها، موجودی و شرایط گارانتی نمایشی هستند و پیشنهاد فروش واقعی نیستند. تصاویر، رندر تبلیغاتی یا تصویرسازی محصول هستند؛ برخی محصولات تکمیلی تصویر نماینده خانواده محصول دارند.`,
          JSON.stringify({ ...specs, گارانتی: 'نمونه نمایشی؛ بدون تعهد تجاری' }),
          JSON.stringify(colors),
          4.6 + (index % 4) / 10,
          350 - index * 9,
          index < 10 ? 1 : 0
        ).lastInsertRowid
      );
      const ids = new Set(cats.map((c) => cat[c]));
      for (const cid of [...ids]) {
        const p = db.prepare('SELECT parent_id FROM categories WHERE id=?').get(cid);
        if (p.parent_id) ids.add(p.parent_id);
      }
      if (ids.has(cat.phones)) ids.add(cat['all-phones']);
      for (const cid of ids) db.prepare('INSERT INTO product_categories VALUES(?,?)').run(id, cid);
      db.prepare(
        'INSERT INTO reviews(product_id,user_id,name,rating,body) VALUES(?,NULL,?,?,?)'
      ).run(
        id,
        'کاربر نمونه',
        5,
        'این دیدگاه برای نمایش بخش نظرات ثبت شده است. مشخصات محصول و تجربه خرید را در این بخش می‌توانید بررسی کنید.'
      );
    });
    const posts = [
      [
        'phone-buying-guide',
        'راهنمای خرید گوشی؛ انتخابی که به شما می‌آید',
        'از نمایشگر تا دوربین؛ قبل از خرید گوشی جدید، این نکته‌ها را بدانید.',
        'phone-guide',
        7,
        'از نیاز واقعی خود شروع کنید\nپیش از مقایسه مدل‌ها، بودجه و کاربرد اصلی را مشخص کنید. برای تماس و شبکه‌های اجتماعی، لزوماً به گران‌ترین پردازنده احتیاج ندارید.\nنمایشگر و باتری را کنار هم بسنجید\nنرخ نوسازی بالاتر تجربه روان‌تری دارد، اما ظرفیت باتری به تنهایی معادل شارژدهی بیشتر نیست. روشنایی و بهینه‌سازی نرم‌افزار هم اهمیت دارند.\nحافظه کافی برای آینده\nاگر زیاد عکس و ویدئو می‌گیرید، حافظه ۲۵۶ گیگابایت انتخاب مطمئن‌تری است. پشتیبانی نرم‌افزاری سازنده و شرایط رجیستری را پیش از خرید بررسی کنید.',
      ],
      [
        'headphone-guide',
        'هدفون یا هندزفری؛ کدام برای شما مناسب‌تر است؟',
        'یک راهنمای ساده برای پیدا کردن همراه موسیقی روزمره شما.',
        'audio-guide',
        5,
        'راحتی، مهم‌تر از ظاهر\nبرای استفاده طولانی، وزن و شکل گوشی‌ها را در نظر بگیرید. مدل‌های روگوشی معمولاً برای محیط کار و مدل‌های کوچک برای رفت‌وآمد مناسب‌اند.\nحذف نویز چگونه کمک می‌کند؟\nحذف نویز فعال صدای یکنواخت محیط را کاهش می‌دهد، اما جایگزین محافظ شنوایی نیست. در خیابان حالت شفافیت را فعال کنید.\nشارژدهی واقعی\nاعداد اعلام‌شده به حجم صدا و فعال بودن حذف نویز وابسته‌اند. سازگاری با گوشی، کیفیت میکروفون و امکان تعویض سری‌ها را نیز بررسی کنید.',
      ],
      [
        'battery-care',
        '۵ نکته ساده برای عمر بیشتر باتری گوشی',
        'عادت‌های کوچک، تأثیر بزرگ؛ با باتری گوشی مهربان‌تر باشید.',
        'battery-guide',
        4,
        'از گرمای زیاد دوری کنید\nگوشی را زیر آفتاب مستقیم یا در خودرو داغ رها نکنید. دما یکی از مهم‌ترین عوامل فرسودگی باتری است.\nشارژر سازگار انتخاب کنید\nاز شارژر و کابل سالم و استاندارد استفاده کنید. توان بالاتر همیشه به معنای سرعت بیشتر نیست و باید توسط دستگاه پشتیبانی شود.\nشارژ بهینه را فعال کنید\nگزینه محافظت از باتری یا شارژ بهینه در تنظیمات بسیاری از گوشی‌ها وجود دارد.\nباتری را خالی نگه ندارید\nبرای نگهداری طولانی، شارژ متوسط مناسب‌تر است.\nکابل آسیب‌دیده را کنار بگذارید\nدر صورت پارگی روکش یا داغ شدن غیرعادی، استفاده را متوقف کنید.',
      ],
    ];
    for (const [slug, title, excerpt, img, minutes, body] of posts)
      db.prepare(
        'INSERT INTO posts(slug,title,excerpt,body,image,read_minutes) VALUES(?,?,?,?,?,?)'
      ).run(slug, title, excerpt, body, `/assets/images/blog/${img}.webp`, minutes);
  })();
}
seed();
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  console.log(
    'Database initialized: ' +
      db.prepare('SELECT COUNT(*) n FROM products').get().n +
      ' products, ' +
      db.prepare('SELECT COUNT(*) n FROM categories').get().n +
      ' categories.'
  );
