import {
  ready,
  $,
  $$,
  api,
  esc,
  num,
  productCard,
  postCard,
  skeleton,
  errorState,
  icon,
} from './common.js';
await ready;
const cats = [
  ['phones', 'گوشی موبایل', 'iphone'],
  ['headphones', 'هدفون', 'headphones'],
  ['smartwatches', 'ساعت هوشمند', 'watch'],
  ['airpods', 'ایرپاد', 'airpods'],
  ['powerbanks', 'پاوربانک', 'powerbank'],
  ['wall-chargers', 'شارژر و کابل', 'charger'],
  ['cases', 'قاب و کاور', 'case'],
  ['speakers', 'اسپیکر', 'speaker'],
  ['tablets', 'تبلت', 'tablet'],
  ['cables', 'کابل شارژ', 'cable'],
  ['gaming', 'تجهیزات گیمینگ', 'gamepad'],
  ['memory-cards', 'کارت حافظه', 'memory'],
];
$('#home-categories').innerHTML = cats
  .map(
    ([slug, name, image]) =>
      `<a class="category-card" href="category.html?slug=${slug}"><div><img src="assets/images/categories/${image}.webp" alt="${name}" width="240" height="240" loading="lazy"></div><span>${name}</span></a>`
  )
  .join('');
const slides = [
  {
    class: '',
    eyebrow: 'انتخاب امروز، تکنولوژی فردا',
    title: 'یک قدم جلوتر،<br><span>با دنیای تکنولوژی.</span>',
    body: 'جدیدترین گوشی‌های هوشمند، با انتخابی مطمئن.<br>تجربه‌ای متفاوت از خرید را با هشتگ آغاز کنید.',
    link: 'category.html?slug=phones',
    cta: 'کشف و خرید گوشی‌ها',
  },
  {
    class: 'audio',
    eyebrow: 'جزئیات را دوباره بشنو',
    title: 'دنیای بیرون، خاموش.<br><span>موسیقی تو، روشن.</span>',
    body: 'صدای شفاف، طراحی چشم‌نواز و آرامشی که با توست.<br>همراه تازه موسیقی‌ات را پیدا کن.',
    link: 'category.html?slug=headphones',
    cta: 'دنیای هدفون‌ها',
  },
  {
    class: 'watch',
    eyebrow: 'هر لحظه، هوشمندانه‌تر',
    title: 'زمان به سبک تو،<br><span>زندگی در حرکت.</span>',
    body: 'همراهی سبک برای روزهای پرانرژی.<br>ساعت‌های هوشمند را نزدیک‌تر ببین.',
    link: 'category.html?slug=smartwatches',
    cta: 'انتخاب ساعت هوشمند',
  },
  {
    class: 'power',
    eyebrow: 'برای تمام مسیرهای پیش رو',
    title: 'همیشه متصل،<br><span>همیشه پرانرژی.</span>',
    body: 'برای لحظه‌هایی که نمی‌خواهی متوقف شوی.<br>یک همراه مطمئن برای شارژ روزهای تو.',
    link: 'category.html?slug=powerbanks',
    cta: 'دیدن پاوربانک‌ها',
  },
];
$('#hero-prev').innerHTML = icon('arrow');
$('#hero-next').innerHTML = icon('arrow');
let current = 0,
  paused = matchMedia('(prefers-reduced-motion: reduce)').matches;
$('#hero-dots').innerHTML = slides
  .map(
    (_, i) =>
      `<button class="${i === 0 ? 'active' : ''}" data-slide="${i}" aria-label="اسلاید ${num(i + 1)}" aria-pressed="${i === 0}"></button>`
  )
  .join('');
function showSlide(index) {
  current = (index + slides.length) % slides.length;
  const s = slides[current];
  $('.hero').className = 'hero ' + s.class;
  $('.hero .eyebrow').innerHTML = '<i></i>' + s.eyebrow;
  $('.hero h1').innerHTML = s.title;
  $('.hero p').innerHTML = s.body;
  $('#hero-link').href = s.link;
  $('#hero-link').innerHTML =
    s.cta +
    ' <span><svg class="inline-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12H4m6-6-6 6 6 6"/></svg></span>';
  $('#hero-index').innerHTML = num(current + 1).padStart(2, '۰') + ' <span>/ ۰۴</span>';
  $$('[data-slide]').forEach((b, i) => {
    b.classList.toggle('active', i === current);
    b.setAttribute('aria-pressed', i === current);
  });
}
$('#hero-next').onclick = () => showSlide(current + 1);
$('#hero-prev').onclick = () => showSlide(current - 1);
$$('[data-slide]').forEach((b) => (b.onclick = () => showSlide(Number(b.dataset.slide))));
function pauseLabel() {
  $('#hero-pause').innerHTML = paused
    ? '<svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M3 1L11 6 3 11Z"/></svg>'
    : '<svg width="10" height="12" viewBox="0 0 10 12" fill="currentColor"><path d="M1 1h2v10H1zm6 0h2v10H7z"/></svg>';
  $('#hero-pause').setAttribute('aria-label', paused ? 'پخش اسلایدر' : 'توقف اسلایدر');
}
pauseLabel();
$('#hero-pause').onclick = () => {
  paused = !paused;
  pauseLabel();
};
setInterval(() => {
  if (!paused && !document.hidden && !$('.hero').matches(':hover,:focus-within'))
    showSlide(current + 1);
}, 7500);
async function loadGrid(selector, query, limit = 4) {
  const el = $(selector);
  el.innerHTML = skeleton();
  try {
    const r = await api('/products?limit=' + limit + '&' + query);
    el.innerHTML = r.products.map(productCard).join('');
    if (!r.products.length) el.innerHTML = '<p class="muted">محصولی در این انتخاب موجود نیست.</p>';
  } catch (e) {
    errorState(el, e);
  }
}
$$('[data-phone-brand]').forEach(
  (b) =>
    (b.onclick = () => {
      $$('[data-phone-brand]').forEach((x) => x.classList.toggle('active', x === b));
      loadGrid(
        '#popular-products',
        'category=phones&brand=' + encodeURIComponent(b.dataset.phoneBrand)
      );
    })
);
$('#brand-list').innerHTML = ['Apple', 'Samsung', 'Xiaomi', 'Sony', 'Anker', 'JBL']
  .map(
    (b) =>
      `<a href="shop.html?brand=${b}" aria-label="محصولات ${b}"><img src="assets/images/brand/${b.toLowerCase()}.svg" alt="${b}" loading="lazy" width="150" height="44"></a>`
  )
  .join('');
await Promise.all([
  loadGrid('#popular-products', 'category=phones'),
  loadGrid('#sale-products', 'sale=1&category=accessories'),
  loadGrid('#bestselling-products', 'sort=bestselling&category=accessories', 8),
  loadGrid('#accessory-products', 'category=accessories&sort=price_asc'),
  loadGrid('#new-products', 'sort=newest', 8),
  loadGrid('#gadget-products', 'category=gadgets'),
  (async () => {
    try {
      $('#home-posts').innerHTML = (await api('/posts')).map(postCard).join('');
    } catch (e) {
      errorState($('#home-posts'), e);
    }
  })(),
]);

$$('[data-scroll]').forEach(
  (b) =>
    (b.onclick = () => {
      const rail = $('#' + b.dataset.scroll);
      rail.scrollBy({
        left: Number(b.dataset.direction) * rail.clientWidth * 0.8,
        behavior: 'smooth',
      });
    })
);
