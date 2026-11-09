import type {
  Article, Banner, Brand, Category, Customer, DB, HomeSection,
  Order, Review, Settings, User,
} from '../models/types';
import { seedProducts } from './seed-products';
import { demoHash } from '../services/shop';

/* ---------- categories: 14 main + subcategories ---------- */
interface SubDef { id: string; name: string; }
interface MainDef { id: string; name: string; slug: string; image: string; desc: string; subs: SubDef[]; }

const CATS: MainDef[] = [
  { id: 'm-mobile', name: 'گوشی موبایل', slug: 'mobile', image: '/images/categories/mobile.svg', desc: 'جدیدترین گوشی‌های اپل، سامسونگ، شیائومی و پوکو با گارانتی معتبر',
    subs: [{ id: 's-apple', name: 'گوشی اپل' }, { id: 's-samsung', name: 'گوشی سامسونگ' }, { id: 's-xiaomi', name: 'گوشی شیائومی' }, { id: 's-poco', name: 'گوشی پوکو' }, { id: 's-google', name: 'گوشی گوگل' }, { id: 's-budget', name: 'گوشی اقتصادی' }, { id: 's-midrange', name: 'گوشی میان‌رده' }, { id: 's-flagship', name: 'گوشی پرچمدار' }] },
  { id: 'm-audio', name: 'هندزفری و هدفون', slug: 'audio', image: '/images/categories/audio.svg', desc: 'ایربادز، هدفون بلوتوثی و گیمینگ از برندهای معتبر',
    subs: [{ id: 's-bt-ear', name: 'هندزفری بلوتوثی' }, { id: 's-wired-ear', name: 'هندزفری سیمی' }, { id: 's-wireless-hp', name: 'هدفون بی‌سیم' }, { id: 's-gaming-hp', name: 'هدفون گیمینگ' }, { id: 's-tws', name: 'ایربادز' }] },
  { id: 'm-charger', name: 'شارژر و کابل', slug: 'charger-cable', image: '/images/categories/charger-cable.svg', desc: 'شارژر سریع، وایرلس و کابل‌های اورجینال',
    subs: [{ id: 's-wall-charger', name: 'شارژر دیواری' }, { id: 's-fast-charge', name: 'شارژر سریع' }, { id: 's-car-chg', name: 'شارژر فندکی' }, { id: 's-wireless-charger', name: 'شارژر وایرلس' }, { id: 's-cable-c', name: 'کابل Type-C' }, { id: 's-cable-lt', name: 'کابل Lightning' }, { id: 's-cable-multi', name: 'کابل چندکاره' }] },
  { id: 'm-powerbank', name: 'پاوربانک', slug: 'powerbank', image: '/images/categories/powerbank.svg', desc: 'پاوربانک‌های ظرفیت بالا با شارژ سریع',
    subs: [{ id: 's-pb-10k', name: 'پاوربانک 10000' }, { id: 's-pb-20000', name: 'پاوربانک 20000' }, { id: 's-pb-fast', name: 'پاوربانک فست شارژ' }, { id: 's-pb-magsafe', name: 'پاوربانک مگ‌سیف' }] },
  { id: 'm-case', name: 'قاب و کاور موبایل', slug: 'case-cover', image: '/images/categories/case-cover.svg', desc: 'قاب‌های شیک و ضدضربه برای همه مدل‌ها',
    subs: [{ id: 's-case-iphone', name: 'قاب آیفون' }, { id: 's-case-samsung', name: 'قاب سامسونگ' }, { id: 's-case-xiaomi', name: 'قاب شیائومی' }, { id: 's-case-silicone', name: 'قاب سیلیکونی' }, { id: 's-case-shock', name: 'قاب ضدضربه' }, { id: 's-case-clear', name: 'قاب شفاف' }] },
  { id: 'm-glass', name: 'محافظ صفحه و لنز', slug: 'screen-protector', image: '/images/categories/glass.svg', desc: 'گلس 9H، سرامیکی و محافظ لنز دوربین',
    subs: [{ id: 's-glass-iphone', name: 'گلس آیفون' }, { id: 's-glass-samsung', name: 'گلس سامسونگ' }, { id: 's-glass-xiaomi', name: 'گلس شیائومی' }, { id: 's-glass-ceramic', name: 'گلس سرامیکی' }, { id: 's-lens', name: 'محافظ لنز دوربین' }] },
  { id: 'm-speaker', name: 'اسپیکر', slug: 'speaker', image: '/images/categories/speaker.svg', desc: 'اسپیکر بلوتوثی قابل‌حمل و خانگی',
    subs: [{ id: 's-bt-speaker', name: 'اسپیکر بلوتوثی' }, { id: 's-portable-speaker', name: 'اسپیکر قابل حمل' }, { id: 's-home-speaker', name: 'اسپیکر خانگی' }] },
  { id: 'm-watch', name: 'ساعت هوشمند', slug: 'smartwatch', image: '/images/categories/smartwatch.svg', desc: 'ساعت و مچ‌بند هوشمند با بندهای متنوع',
    subs: [{ id: 's-smartwatch', name: 'ساعت هوشمند' }, { id: 's-band', name: 'مچ‌بند هوشمند' }, { id: 's-watch-band', name: 'بند ساعت' }, { id: 's-watch-acc', name: 'لوازم جانبی ساعت' }] },
  { id: 'm-car', name: 'لوازم جانبی خودرو', slug: 'car-accessories', image: '/images/categories/car.svg', desc: 'هولدر، شارژر خودرو و پایه نگهدارنده',
    subs: [{ id: 's-holder', name: 'هولدر موبایل' }, { id: 's-car-charger', name: 'شارژر خودرو' }, { id: 's-car-stand', name: 'پایه نگهدارنده' }] },
  { id: 'm-gaming', name: 'لوازم جانبی گیمینگ', slug: 'gaming', image: '/images/categories/gaming.svg', desc: 'دسته بازی، فن خنک‌کننده و تریگر',
    subs: [{ id: 's-gamepad', name: 'دسته بازی موبایل' }, { id: 's-cooler', name: 'فن خنک‌کننده' }, { id: 's-trigger', name: 'تریگر بازی' }, { id: 's-gaming-acc', name: 'لوازم گیمینگ' }] },
  { id: 'm-storage', name: 'حافظه و ذخیره‌سازی', slug: 'storage', image: '/images/categories/storage.svg', desc: 'کارت حافظه، فلش مموری و کارت‌خوان',
    subs: [{ id: 's-microsd', name: 'کارت حافظه' }, { id: 's-flash', name: 'فلش مموری' }, { id: 's-reader', name: 'کارت‌خوان' }] },
  { id: 'm-photo', name: 'سه‌پایه و تجهیزات عکاسی', slug: 'photography', image: '/images/categories/photography.svg', desc: 'رینگ لایت، سه‌پایه و مونوپاد',
    subs: [{ id: 's-tripod', name: 'سه‌پایه موبایل' }, { id: 's-ringlight', name: 'رینگ لایت' }, { id: 's-monopod', name: 'مونوپاد' }, { id: 's-photo-holder', name: 'هولدر عکاسی' }] },
  { id: 'm-converter', name: 'تبدیل و مبدل', slug: 'converter', image: '/images/categories/converter.svg', desc: 'مبدل Type-C، صوتی و هاب چندکاره',
    subs: [{ id: 's-conv-c', name: 'مبدل Type-C' }, { id: 's-conv-lt', name: 'مبدل Lightning' }, { id: 's-conv-audio', name: 'مبدل صوتی' }, { id: 's-hub', name: 'هاب و دانگل' }] },
  { id: 'm-general', name: 'لوازم جانبی عمومی', slug: 'general', image: '/images/categories/general.svg', desc: 'ابزار نظافت، پایه رومیزی و سایر لوازم',
    subs: [{ id: 's-clean', name: 'ابزار نظافت موبایل' }, { id: 's-desk-stand', name: 'پایه رومیزی' }, { id: 's-care', name: 'لوازم نگهداری' }, { id: 's-other', name: 'سایر لوازم جانبی' }] },
];

function faSlug(name: string): string {
  return name.trim().replace(/\s+/g, '-');
}

export const seedCategories: Category[] = CATS.flatMap((m, i) => {
  const main: Category = { id: m.id, name: m.name, slug: m.slug, description: m.desc, image: m.image, parentId: null, order: i + 1, visible: true };
  const subs: Category[] = m.subs.map((s, j) => ({
    id: s.id, name: s.name, slug: faSlug(s.name), description: `انواع ${s.name} اورجینال با ضمانت اصالت در موبایل هشتگ`,
    image: m.image, parentId: m.id, order: j + 1, visible: true,
  }));
  return [main, ...subs];
});

/* ---------- brands ---------- */
export const seedBrands: Brand[] = [
  { id: 'apple', name: 'اپل', slug: 'apple', logo: '/images/brands/apple.svg', description: 'گوشی آیفون و لوازم جانبی اورجینال اپل', visible: true },
  { id: 'samsung', name: 'سامسونگ', slug: 'samsung', logo: '/images/brands/samsung.svg', description: 'گوشی‌های گلکسی و لوازم جانبی سامسونگ', visible: true },
  { id: 'xiaomi', name: 'شیائومی', slug: 'xiaomi', logo: '/images/brands/xiaomi.svg', description: 'گوشی‌های ردمی و محصولات شیائومی', visible: true },
  { id: 'poco', name: 'پوکو', slug: 'poco', logo: '/images/brands/poco.svg', description: 'قاتل‌های پرچمدار پوکو', visible: true },
  { id: 'anker', name: 'انکر', slug: 'anker', logo: '/images/brands/anker.svg', description: 'شارژر، پاوربانک و لوازم جانبی انکر', visible: true },
  { id: 'baseus', name: 'بیسوس', slug: 'baseus', logo: '/images/brands/baseus.svg', description: 'لوازم جانبی خلاقانه بیسوس', visible: true },
  { id: 'jbl', name: 'جی‌بی‌ال', slug: 'jbl', logo: '/images/brands/jbl.svg', description: 'اسپیکر و هدفون‌های حرفه‌ای JBL', visible: true },
  { id: 'soundcore', name: 'ساندکور', slug: 'soundcore', logo: '/images/brands/soundcore.svg', description: 'هدفون و اسپیکر ساندکور انکر', visible: true },
  { id: 'huawei', name: 'هواوی', slug: 'huawei', logo: '/images/brands/huawei.svg', description: 'محصولات هواوی', visible: true },
  { id: 'lenovo', name: 'لنوو', slug: 'lenovo', logo: '/images/brands/lenovo.svg', description: 'محصولات لنوو', visible: true },
];

/* ---------- banners ---------- */
export const seedBanners: Banner[] = [
  { id: 'b1', title: 'آیفون ۱۷ پرو', subtitle: 'قدرت تیتانیومی؛ پرچمدار جدید اپل با شرایط ویژه در موبایل هشتگ', buttonText: 'مشاهده و خرید', url: '/product/iphone-17-pro', art: '/images/products/iphone-17-pro.svg', bgImage: '', mobileImage: '', themeFrom: '#1c1a15', themeTo: '#4a3f22', themeAccent: '#D9B96A', placement: 'hero', order: 1, enabled: true },
  { id: 'b2', title: 'جشنواره لوازم جانبی', subtitle: 'تا ۴۰٪ تخفیف شارژر، پاوربانک، قاب و گلس اورجینال', buttonText: 'مشاهده تخفیف‌ها', url: '/offers', art: '/images/products/baseus-65w.svg', bgImage: '', mobileImage: '', themeFrom: '#3d2f10', themeTo: '#8a6a1f', themeAccent: '#FFE9B8', placement: 'hero', order: 2, enabled: true },
  { id: 'b3', title: 'پوکو X7 پرو', subtitle: 'هیولای گیمینگ با باتری ۶۰۰۰؛ قاتل پرچمدارها رسید', buttonText: 'خرید پوکو', url: '/product/poco-x7-pro', art: '/images/products/poco-x7-pro.svg', bgImage: '', mobileImage: '', themeFrom: '#101014', themeTo: '#2c2c38', themeAccent: '#B99552', placement: 'hero', order: 3, enabled: true },
  { id: 'b4', title: 'دنیای صدا', subtitle: 'ایرپادز، هدفون و اسپیکر با بهترین قیمت', buttonText: 'مشاهده محصولات', url: '/category/audio', art: '/images/products/airpods-pro.svg', bgImage: '', mobileImage: '', themeFrom: '#FBF7EF', themeTo: '#EBDCC0', themeAccent: '#92703B', placement: 'promo', order: 1, enabled: true },
  { id: 'b5', title: 'ساعت‌های هوشمند', subtitle: 'گلکسی واچ ۷ و بندهای متنوع', buttonText: 'مشاهده', url: '/category/smartwatch', art: '/images/products/galaxy-watch-7.svg', bgImage: '', mobileImage: '', themeFrom: '#F1F4F8', themeTo: '#D3DEE9', themeAccent: '#2b4a73', placement: 'promo', order: 2, enabled: true },
  { id: 'b6', title: 'شارژ سریع، همیشه همراه', subtitle: 'پاوربانک و شارژرهای فست‌شارژ انکر و بیسوس', buttonText: 'مشاهده', url: '/category/powerbank', art: '/images/products/anker-powercore-20k.svg', bgImage: '', mobileImage: '', themeFrom: '#23232a', themeTo: '#4a4a55', themeAccent: '#D9B96A', placement: 'category', order: 1, enabled: true },
  { id: 'b7', title: 'ارسال رایگان سفارش‌های بالای ۲ میلیون', subtitle: 'برای سراسر کشور، سریع و بیمه‌شده', buttonText: 'شروع خرید', url: '/shop', art: '/images/products/baseus-cable.svg', bgImage: '', mobileImage: '', themeFrom: '#0f3d2a', themeTo: '#1c6b4a', themeAccent: '#8fe3b4', placement: 'shop', order: 1, enabled: true },
];

/* ---------- homepage sections ---------- */
const SECTION_KEYS: Array<[string, string, string]> = [
  ['hero_slider', 'اسلایدر اصلی', ''],
  ['categories', 'دسته‌بندی محصولات', 'بر اساس نیاز خود انتخاب کنید'],
  ['featured', 'محصولات منتخب', 'پیشنهاد سردبیر موبایل هشتگ'],
  ['special_offers', 'پیشنهادهای شگفت‌انگیز', 'تخفیف‌های محدود با شمارش معکوس'],
  ['smartphones', 'جدیدترین گوشی‌های موبایل', 'آخرین پرچمدارها و میان‌رده‌ها'],
  ['accessories', 'دنیای لوازم جانبی', 'هرچه گوشی شما نیاز دارد'],
  ['headphones', 'هندزفری و هدفون', 'دنیای صدا را کشف کنید'],
  ['bestsellers', 'پرفروش‌ترین محصولات', 'انتخاب هزاران مشتری'],
  ['new_arrivals', 'تازه‌های موبایل هشتگ', 'جدیدترین کالاهای فروشگاه'],
  ['promotional_banners', 'پیشنهادهای ویژه موبایل هشتگ', ''],
  ['brands', 'برندهای محبوب', 'نمایندگی برندهای معتبر'],
  ['why_us', 'چرا موبایل هشتگ؟', 'خریدی مطمئن و لذت‌بخش'],
  ['blog', 'مجله موبایل هشتگ', 'راهنمای خرید و بررسی تخصصی'],
  ['newsletter', 'عضویت در خبرنامه', 'از تخفیف‌ها زودتر باخبر شوید'],
];
export const seedSections: HomeSection[] = SECTION_KEYS.map(([key, title, subtitle], i) => ({
  id: `sec_${key}`, key, title, subtitle, enabled: true, order: i + 1, config: { limit: 8 },
}));

/* ---------- articles ---------- */
export const seedArticles: Article[] = [
  { id: 'a1', title: 'راهنمای خرید بهترین گوشی میان‌رده ۲۰۲۶', slug: 'best-midrange-2026', excerpt: 'اگر بودجه شما بین ۲۰ تا ۳۵ میلیون است، این ۵ مدل بهترین انتخاب‌های امسال هستند.', image: '/images/categories/mobile.svg', author: 'تحریریه موبایل هشتگ', date: new Date(Date.now() - 2 * 86400000).toISOString(), tags: ['راهنمای خرید', 'گوشی'], published: true,
    body: 'انتخاب گوشی میان‌رده در سال ۲۰۲۶ سخت‌تر از همیشه شده است؛ چون اکثر مدل‌ها نمایشگر AMOLED، شارژ سریع و دوربین قدرتمند دارند.\n\nدر این راهنما، گلکسی A56، ردمی نوت ۱۴ پرو و پوکو X7 پرو را از نظر باتری، دوربین و ارزش خرید مقایسه می‌کنیم.\n\nاگر گیمر هستید، پوکو X7 پرو با تراشه Dimensity 8400 بهترین گزینه است. اگر دوربین برایتان مهم است، ردمی نوت ۱۴ پرو با سنسور ۲۰۰ مگاپیکسلی انتخاب بهتری است.\n\nنکته مهم: همیشه گوشی را با گارانتی معتبر و از فروشگاه مطمئن بخرید تا از اصالت کالا مطمئن باشید.' },
  { id: 'a2', title: 'تفاوت شارژر GaN با شارژر معمولی چیست؟', slug: 'gan-charger-guide', excerpt: 'چرا شارژرهای گالیوم نیترید کوچک‌تر، خنک‌تر و سریع‌تر هستند؟', image: '/images/categories/charger-cable.svg', author: 'تحریریه موبایل هشتگ', date: new Date(Date.now() - 5 * 86400000).toISOString(), tags: ['شارژر', 'آموزش'], published: true,
    body: 'فناوری GaN یا گالیوم نیترید، انقلابی در دنیای شارژرها ایجاد کرده است.\n\nشارژرهای GaN نسبت به شارژرهای سیلیکونی قدیمی، تا ۵۰ درصد کوچک‌تر هستند، گرمای کمتری تولید می‌کنند و بازده بالاتری دارند.\n\nاگر هم‌زمان گوشی، لپ‌تاپ و ساعت هوشمند دارید، یک شارژر ۶۵ وات GaN چندپورته می‌تواند جایگزین هر سه شارژر شما شود.\n\nپیشنهاد ما: شارژر ۶۵ وات بیسوس با ۳ پورت، بهترین انتخاب برای میز کار و سفر است.' },
  { id: 'a3', title: 'بررسی تخصصی ایرپادز پرو ۲؛ آیا هنوز ارزش خرید دارد؟', slug: 'airpods-pro-2-review', excerpt: 'نویزکنسلینگ، کیفیت صدا و باتری ایرپادز پرو ۲ را زیر ذره‌بین بردیم.', image: '/images/categories/audio.svg', author: 'تحریریه موبایل هشتگ', date: new Date(Date.now() - 9 * 86400000).toISOString(), tags: ['بررسی', 'هندزفری'], published: true,
    body: 'ایرپادز پرو ۲ با تراشه H2 همچنان یکی از بهترین ایربادزهای بازار است.\n\nحذف نویز فعال آن در مترو و خیابان عملکردی فوق‌العاده دارد و حالت Transparency صدای محیط را کاملاً طبیعی منتقل می‌کند.\n\nکیفیت مکالمه، راحتی استفاده طولانی و یکپارچگی با آیفون، نقاط قوت اصلی آن هستند.\n\nجمع‌بندی: اگر آیفون دارید و بودجه کافی دارید، خرید ایرپادز پرو ۲ کاملاً منطقی است.' },
  { id: 'a4', title: '۱۰ اشتباه رایج که باتری گوشی شما را نابود می‌کند', slug: 'battery-mistakes', excerpt: 'از شارژ شبانه تا استفاده از شارژر فیک؛ این عادت‌ها را ترک کنید.', image: '/images/categories/powerbank.svg', author: 'تحریریه موبایل هشتگ', date: new Date(Date.now() - 14 * 86400000).toISOString(), tags: ['آموزش', 'باتری'], published: true,
    body: 'سلامت باتری گوشی شما مستقیماً به عادت‌های شارژ شما بستگی دارد.\n\nاستفاده از شارژر و کابل غیراستاندارد، شارژ کامل ۱۰۰ درصدی همیشگی و داغ شدن مداوم گوشی، مهم‌ترین دشمنان باتری هستند.\n\nتوصیه می‌شود شارژ گوشی را بین ۲۰ تا ۸۰ درصد نگه دارید و از شارژرهای اورجینال استفاده کنید.\n\nبا رعایت همین نکات ساده، عمر باتری شما تا دو برابر افزایش می‌یابد.' },
];

/* ---------- customers / orders / reviews / users / settings ---------- */
export const seedCustomers: Customer[] = [
  { id: 'cu1', name: 'علی رضایی', phone: '09121111111', email: 'ali@example.com', addresses: [{ id: 'ad1', title: 'منزل', city: 'تهران', address: 'خیابان ولیعصر، کوچه ۱۲، پلاک ۵', postalCode: '1939834561', phone: '09121111111' }], createdAt: new Date(Date.now() - 60 * 86400000).toISOString() },
  { id: 'cu2', name: 'سارا محمدی', phone: '09122222222', email: 'sara@example.com', addresses: [{ id: 'ad2', title: 'منزل', city: 'اصفهان', address: 'خیابان چهارباغ، مجتمع آریا، واحد ۸', postalCode: '8134876543', phone: '09122222222' }], createdAt: new Date(Date.now() - 40 * 86400000).toISOString() },
  { id: 'cu3', name: 'محمد کریمی', phone: '09123333333', email: '', addresses: [], createdAt: new Date(Date.now() - 12 * 86400000).toISOString() },
  { id: 'cu4', name: 'نگار احمدی', phone: '09124444444', email: '', addresses: [], createdAt: new Date(Date.now() - 3 * 86400000).toISOString() },
];

export const seedOrders: Order[] = [
  { id: 'o1', code: 'MH-100231', customerName: 'علی رضایی', phone: '09121111111', city: 'تهران', address: 'خیابان ولیعصر، کوچه ۱۲، پلاک ۵', postalCode: '1939834561',
    items: [{ productId: 'p11', name: 'شارژر دیواری بیسوس 65 وات GaN', image: '/images/products/baseus-65w.svg', price: 1980000, qty: 1 }, { productId: 'p13', name: 'کابل شارژ سریع بیسوس Type-C', image: '/images/products/baseus-cable.svg', price: 390000, qty: 2 }],
    subtotal: 2760000, discount: 230000, shipping: 0, total: 2530000, shippingMethod: 'پست پیشتاز', paymentMethod: 'پرداخت آنلاین (نمایشی)', status: 'completed', note: '', createdAt: new Date(Date.now() - 6 * 86400000).toISOString() },
  { id: 'o2', code: 'MH-100232', customerName: 'سارا محمدی', phone: '09122222222', city: 'اصفهان', address: 'خیابان چهارباغ، مجتمع آریا، واحد ۸', postalCode: '8134876543',
    items: [{ productId: 'p7', name: 'هندزفری بلوتوثی اپل AirPods Pro نسل ۲', image: '/images/products/airpods-pro.svg', price: 12900000, qty: 1 }],
    subtotal: 12900000, discount: 1300000, shipping: 0, total: 11600000, shippingMethod: 'تیپاکس', paymentMethod: 'پرداخت آنلاین (نمایشی)', status: 'shipped', note: '', createdAt: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: 'o3', code: 'MH-100233', customerName: 'محمد کریمی', phone: '09123333333', city: 'مشهد', address: 'بلوار وکیل‌آباد، نبش ۲۱', postalCode: '9187654321',
    items: [{ productId: 'p5', name: 'گوشی موبایل شیائومی Redmi Note 14 Pro', image: '/images/products/redmi-note-14-pro.svg', variantLabel: '256 گیگ', price: 19700000, qty: 1 }],
    subtotal: 19700000, discount: 2100000, shipping: 0, total: 17600000, shippingMethod: 'پست پیشتاز', paymentMethod: 'پرداخت آنلاین (نمایشی)', status: 'processing', note: '', createdAt: new Date(Date.now() - 1 * 86400000).toISOString() },
  { id: 'o4', code: 'MH-100234', customerName: 'نگار احمدی', phone: '09124444444', city: 'تهران', address: 'سعادت‌آباد، خیابان ۲۴، پلاک ۱۰', postalCode: '1998765432',
    items: [{ productId: 'p17', name: 'گلس محافظ صفحه 9H', image: '/images/products/tempered-glass.svg', price: 270000, qty: 2 }, { productId: 'p15', name: 'قاب چرمی آیفون', image: '/images/products/iphone-leather-case.svg', price: 1590000, qty: 1 }],
    subtotal: 2130000, discount: 390000, shipping: 80000, total: 1820000, shippingMethod: 'پست پیشتاز', paymentMethod: 'پرداخت در محل (نمایشی)', status: 'pending', note: 'لطفاً قبل از ارسال هماهنگ شود.', createdAt: new Date(Date.now() - 5 * 3600000).toISOString() },
  { id: 'o5', code: 'MH-100235', customerName: 'رضا نادری', phone: '09125555555', city: 'شیراز', address: 'خیابان زند، پاساژ نور، طبقه ۲', postalCode: '7134567890',
    items: [{ productId: 'p19', name: 'ساعت هوشمند سامسونگ Galaxy Watch 7', image: '/images/products/galaxy-watch-7.svg', price: 14900000, qty: 1 }],
    subtotal: 14900000, discount: 1600000, shipping: 0, total: 13300000, shippingMethod: 'تیپاکس', paymentMethod: 'پرداخت آنلاین (نمایشی)', status: 'cancelled', note: '', createdAt: new Date(Date.now() - 10 * 86400000).toISOString() },
];

export const seedReviews: Review[] = [
  { id: 'r1', productId: 'p1', author: 'علی رضایی', rating: 5, text: 'بسته‌بندی عالی و ارسال سریع. گوشی کاملاً اورجینال و رجیستر شده بود. ممنون از موبایل هشتگ.', date: new Date(Date.now() - 4 * 86400000).toISOString(), status: 'approved' },
  { id: 'r2', productId: 'p1', author: 'سارا محمدی', rating: 5, text: 'دوربینش فوق‌العاده است. قیمت هم از همه جا بهتر بود.', date: new Date(Date.now() - 2 * 86400000).toISOString(), status: 'approved' },
  { id: 'r3', productId: 'p7', author: 'محمد کریمی', rating: 4, text: 'نویزکنسلینگ عالیه، فقط کاش رنگ‌های بیشتری داشت.', date: new Date(Date.now() - 1 * 86400000).toISOString(), status: 'approved' },
  { id: 'r4', productId: 'p11', author: 'نگار احمدی', rating: 5, text: 'واقعاً ۶۵ وات واقعی میده و لپ‌تاپم رو هم شارژ می‌کنه. پیشنهاد می‌کنم.', date: new Date(Date.now() - 8 * 3600000).toISOString(), status: 'pending' },
  { id: 'r5', productId: 'p4', author: 'رضا نادری', rating: 2, text: 'انتظار بیشتری داشتم.', date: new Date(Date.now() - 3 * 3600000).toISOString(), status: 'pending' },
];

export const seedUsers: User[] = [
  { id: 'u-admin', name: 'مدیر فروشگاه', phone: '09120000000', email: 'admin@mobilehashtag.ir', passwordHash: demoHash('admin123'), role: 'admin', addresses: [], createdAt: new Date(Date.now() - 90 * 86400000).toISOString() },
  { id: 'u-demo', name: 'مشتری نمونه', phone: '09121111111', email: 'demo@example.com', passwordHash: demoHash('123456'), role: 'customer', addresses: [{ id: 'ad1', title: 'منزل', city: 'تهران', address: 'خیابان ولیعصر، کوچه ۱۲، پلاک ۵', postalCode: '1939834561', phone: '09121111111' }], createdAt: new Date(Date.now() - 60 * 86400000).toISOString() },
];

export const seedSettings: Settings = {
  storeName: 'موبایل هشتگ',
  storeEn: 'MOBILE HASHTAG',
  phone: '021-91009900',
  email: 'info@mobilehashtag.ir',
  address: 'تهران، خیابان جمهوری، پاساژ علاءالدین، طبقه اول، پلاک ۱۲',
  announcement: 'ارسال رایگان برای سفارش‌های بالای ۲ میلیون تومان 🎉',
  announcementEnabled: true,
  logo: '/images/logo/logo.svg',
  logoWhite: '/images/logo/logo-white.svg',
  favicon: '/images/logo/favicon.svg',
  primaryColor: '#B99552',
  secondaryColor: '#222222',
  footerAbout: 'موبایل هشتگ، فروشگاه تخصصی گوشی موبایل و لوازم جانبی با ضمانت اصالت کالا، گارانتی معتبر و ارسال سریع به سراسر کشور.',
  instagram: 'https://instagram.com',
  telegram: 'https://t.me',
  whatsapp: 'https://wa.me',
  aparat: 'https://aparat.com',
  shippingBase: 80000,
  freeShippingOver: 2000000,
  trustNote: 'دارای نماد اعتماد الکترونیکی (نمایشی)',
};

export function seedDatabase(): DB {
  const now = Date.now();
  const day = 86400000;
  const products = seedProducts.map((p) => ({ ...p }));
  const offers: Record<string, number> = { p4: 2, p5: 3, p10: 1, p13: 4, p22: 5 };
  for (const pr of products) {
    if (offers[pr.id]) pr.offerEndsAt = new Date(now + offers[pr.id] * day).toISOString();
  }
  return {
    products,
    categories: seedCategories.map((c) => ({ ...c })),
    brands: seedBrands.map((b) => ({ ...b })),
    banners: seedBanners.map((b) => ({ ...b })),
    sections: seedSections.map((s) => ({ ...s, config: { ...s.config } })),
    articles: seedArticles.map((a) => ({ ...a, tags: [...a.tags] })),
    customers: seedCustomers.map((c) => ({ ...c, addresses: c.addresses.map((a) => ({ ...a })) })),
    orders: seedOrders.map((o) => ({ ...o, items: o.items.map((i) => ({ ...i })) })),
    reviews: seedReviews.map((r) => ({ ...r })),
    users: seedUsers.map((u) => ({ ...u, addresses: u.addresses.map((a) => ({ ...a })) })),
    settings: { ...seedSettings },
  };
}
