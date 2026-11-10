import { renderContact } from './contact.js';
export const $ = (s, root = document) => root.querySelector(s);
export const $$ = (s, root = document) => [...root.querySelectorAll(s)];
export const esc = (s) =>
  String(s ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );
export const num = (n) => Number(n).toLocaleString('fa-IR');
export const money = (n) => `${num(n)} <span class="currency">تومان</span>`;
export const date = (s) => new Date(s.replace(' ', 'T') + 'Z').toLocaleDateString('fa-IR');
const paths = {
  phone:
    '<path d="M7 3H4a1 1 0 0 0-1 1c0 9.4 7.6 17 17 17a1 1 0 0 0 1-1v-3l-5-2-2 2a13 13 0 0 1-7-7l2-2-2-5Z"/>',
  whatsapp:
    '<path d="M20 11.5a8.5 8.5 0 0 1-12.8 7.4L3 21l1.8-4.4A8.5 8.5 0 1 1 20 11.5Z"/><path d="m8 7 2 2-1 2 3 3 2-1 2 2c-3 4-12-5-8-8Z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  instagram:
    '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".7"/>',
  telegram: '<path d="m3 10 18-7-4 18-6-6-4 3 1-6 9-5-7 7-7-4Z"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  cart: '<path d="M3 3h2l3 12h10l3-9H6"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 22v-2a8 8 0 0 1 16 0v2"/>',
  heart:
    '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  shield: '<path d="m12 3 8 3v7c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="m8 12 3 3 5-6"/>',
  truck:
    '<path d="M2 5h12v12H2zM14 9h4l4 5v3h-8"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="18" r="2.5"/>',
  refresh: '<path d="M20 7a9 9 0 1 0 1 9M20 2v5h-5"/>',
  headset:
    '<path d="M4 14v-3a8 8 0 0 1 16 0v7c0 3-3 4-6 4"/><rect x="2" y="11" width="5" height="8" rx="2"/><rect x="17" y="11" width="5" height="8" rx="2"/>',
  bolt: '<path d="m13 2-9 12h7l-1 8 10-13h-8l1-7Z"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  bag: '<path d="M5 7h14l2 15H3L5 7Z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/>',
  close: '<path d="m5 5 14 14M5 19 19 5"/>',
  trash: '<path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  arrow: '<path d="M20 12H4m6-6-6 6 6 6"/>',
  box: '<path d="m12 2 10 5v10l-10 5L2 17V7l10-5ZM2 7l10 5 10-5M12 12v10M7 4l10 5"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  logout: '<path d="M9 3H3v18h6M8 12h13m-5-5 5 5-5 5"/>',
  star: '<path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6Z"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 5 10 8L22 5"/>',
};
export const icon = (name) =>
  `<svg class="icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.box}</svg>`;
export function fillIcons() {
  $$('[data-icon]').forEach((e) => (e.innerHTML = icon(e.dataset.icon)));
}
export let state = { csrf: '', user: null, cart: { count: 0 }, wishlist: [] };
export let categories = [];
export async function api(url, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (options.method && options.method !== 'GET') headers['X-CSRF-Token'] = state.csrf;
  const response = await fetch('/api' + url, {
    credentials: 'same-origin',
    ...options,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.error || 'دریافت اطلاعات با خطا مواجه شد.');
    error.status = response.status;
    throw error;
  }
  if (data.csrf) state.csrf = data.csrf;
  return data;
}
export function toast(message, error = false) {
  const el = document.createElement('div');
  el.className = 'toast' + (error ? ' toast-error' : '');
  el.innerHTML = icon(error ? 'close' : 'check') + `<span>${esc(message)}</span>`;
  $('#toast-region').append(el);
  setTimeout(() => el.remove(), 5000);
}
export function updateCounts() {
  const e = $('#cart-count');
  if (e) e.textContent = num(state.cart.count || 0);
  $$('[data-wish]').forEach((b) => {
    const active = state.wishlist.includes(Number(b.dataset.wish));
    b.classList.toggle('selected', active);
    b.setAttribute('aria-pressed', String(active));
  });
}
export async function refreshSession() {
  state = await api('/session');
  updateCounts();
  return state;
}
export function empty(title, text, link = 'shop.html', label = 'دیدن فروشگاه') {
  return `<div class="empty-state">${icon('bag')}<h2>${esc(title)}</h2><p>${esc(text)}</p><a class="button dark" href="${esc(link)}">${esc(label)} <svg class="inline-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12H4m6-6-6 6 6 6"/></svg></a></div>`;
}
export function errorState(el, e) {
  el.innerHTML = `<div class="empty-state"><h2>اطلاعات دریافت نشد</h2><p>${esc(e.message)}</p><button class="button dark" data-reload>تلاش دوباره</button></div>`;
}
export function skeleton(count = 4) {
  return Array.from(
    { length: count },
    () => '<div class="skeleton-card"><div></div><span></span><span></span></div>'
  ).join('');
}
export function productCard(p) {
  const sale = p.old_price > p.price;
  return `<article class="product-card"><div class="product-visual"><a href="product.html?slug=${encodeURIComponent(p.slug)}" tabindex="-1" aria-hidden="true"><img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" width="600" height="600"></a>${sale ? `<span class="discount">${num(Math.round((1 - p.price / p.old_price) * 100))}٪</span>` : ''}<button class="wish-button ${state.wishlist.includes(p.id) ? 'selected' : ''}" data-wish="${p.id}" aria-label="علاقه‌مندی: ${esc(p.name)}" aria-pressed="${state.wishlist.includes(p.id)}">${icon('heart')}</button><button class="quick-button" data-quick="${esc(p.slug)}">${icon('eye')} مشاهده سریع</button></div><div class="product-info"><div class="product-meta"><span>${esc(p.brand)}</span><span class="rating">${icon('star')} ${num(p.rating.toFixed(1))}</span></div><h3><a href="product.html?slug=${encodeURIComponent(p.slug)}">${esc(p.name)}</a></h3><div class="product-bottom"><button class="add-button" data-add="${p.id}" data-color="${esc(p.colors[0] || '')}" ${p.stock ? '' : 'disabled'} aria-label="افزودن به سبد: ${esc(p.name)}">${icon('cart')}</button><div class="price">${sale ? `<del>${num(p.old_price)}</del>` : '<span class="price-spacer"></span>'}<strong>${p.stock ? money(p.price) : 'ناموجود'}</strong></div></div></div></article>`;
}
export function postCard(p) {
  return `<article class="blog-card"><a href="article.html?slug=${encodeURIComponent(p.slug)}"><img src="${esc(p.image)}" alt="${esc(p.title)}" loading="lazy" width="800" height="460"></a><div><span class="overline">راهنمای خرید <span class="muted">· ${num(p.read_minutes)} دقیقه مطالعه</span></span><h3><a href="article.html?slug=${encodeURIComponent(p.slug)}">${esc(p.title)}</a></h3><p>${esc(p.excerpt)}</p><a class="text-link" href="article.html?slug=${encodeURIComponent(p.slug)}">بیشتر بخوانید <svg class="inline-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12H4m6-6-6 6 6 6"/></svg></a></div></article>`;
}
export function openDialog(content) {
  const d = $('#app-dialog');
  d.innerHTML = `<button class="dialog-close icon-button" aria-label="بستن">${icon('close')}</button>${content}`;
  if (!d.open) d.showModal();
  $('.dialog-close', d).onclick = () => d.close();
  return d;
}
export function confirmDialog(message) {
  return new Promise((resolve) => {
    const d = openDialog(
      `<div class="confirm-dialog"><h2>مطمئن هستید؟</h2><p>${esc(message)}</p><div class="button-row"><button id="confirm-yes" class="button dark">بله، حذف شود</button><button id="confirm-no" class="button outline">انصراف</button></div></div>`
    );
    let result = false;
    $('#confirm-yes').onclick = () => {
      result = true;
      d.close();
    };
    $('#confirm-no').onclick = () => d.close();
    d.addEventListener('close', () => resolve(result), { once: true });
  });
}
export function bindForm(selector, callback) {
  const form = $(selector);
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const button = $('button[type="submit"],button:not([type])', form);
    const error = $('.form-error', form);
    if (error) error.textContent = '';
    if (button) button.disabled = true;
    try {
      await callback(Object.fromEntries(new FormData(form)), form);
    } catch (e) {
      if (error) error.textContent = e.message;
      else toast(e.message, true);
    } finally {
      if (button) button.disabled = false;
    }
  });
}
function header() {
  const active = document.body.dataset.page;
  $('#site-header').innerHTML =
    `<div class="announcement"><div class="container"><span>${icon('truck')} ارسال رایگان سفارش‌های بالای ۵ میلیون تومان</span><span class="announcement-left"><span id="header-contact-shortcut"></span><i></i> نسخه نمایشی</span></div></div><div class="header-main container"><button class="icon-button mobile-menu" id="mobile-menu" aria-label="باز کردن منو" aria-expanded="false">${icon('menu')}</button><a href="index.html" class="brand" aria-label="موبایل هشتگ، صفحه اصلی"><img src="/assets/images/brand/symbol.svg" width="49" height="56" alt="نشان موبایل هشتگ"><span><strong>موبایل <b>هشتگ</b></strong><small>MOBILE HASHTAG</small></span></a><form class="header-search" action="search.html"><button aria-label="جست‌وجو">${icon('search')}</button><input type="search" name="q" placeholder="دنبال چه محصولی می‌گردید؟" aria-label="جست‌وجوی محصول" required><span>جست‌وجو در هشتگ</span></form><div class="header-actions"><a href="${state.user ? 'account' : 'login'}.html" class="account-link">${icon('user')}<span>${state.user ? esc(state.user.name.split(' ')[0]) : 'ورود / ثبت‌نام'}</span></a><i></i><a href="wishlist.html" class="icon-button" aria-label="علاقه‌مندی‌ها">${icon('heart')}</a><a href="cart.html" class="icon-button cart-link" aria-label="سبد خرید">${icon('cart')}<b id="cart-count">${num(state.cart.count)}</b></a></div></div><nav class="main-nav"><div class="container nav-inner"><div class="category-menu"><button id="mega-toggle" aria-expanded="false">${icon('grid')} دسته‌بندی محصولات <span class="chevron"><svg class="inline-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></span></button><div id="mega-menu" class="mega-menu">${categories
      .filter((c) => !c.parent_id)
      .map(
        (parent) =>
          `<div><a class="mega-title" href="category.html?slug=${esc(parent.slug)}">${esc(parent.name)}</a>${categories
            .filter((c) => c.parent_id === parent.id)
            .map((c) => `<a href="category.html?slug=${esc(c.slug)}">${esc(c.name)}</a>`)
            .join('')}</div>`
      )
      .join(
        ''
      )}</div></div><div class="nav-links" id="nav-links"><a class="${active === 'index' ? 'active' : ''}" href="index.html">خانه</a><a class="${active === 'shop' ? 'active' : ''}" href="shop.html">فروشگاه</a><a href="category.html?slug=phones">گوشی موبایل</a><a href="category.html?slug=accessories">لوازم جانبی</a><a href="category.html?slug=gadgets">ساعت و گجت</a><a href="shop.html?sale=1" class="gold-link">${icon('bolt')} پیشنهادهای ویژه</a><a href="blog.html">وبلاگ</a><a href="about.html">درباره ما</a><a href="contact.html">تماس با ما</a></div><a href="tracking.html" class="track-link">${icon('box')} پیگیری سفارش</a></div></nav>`;
  $('#mega-toggle').onclick = () => {
    const open = $('#mega-menu').classList.toggle('open');
    $('#mega-toggle').setAttribute('aria-expanded', open);
  };
  $('#mobile-menu').onclick = () => {
    const open = $('.main-nav').classList.toggle('mobile-open');
    $('#mobile-menu').setAttribute('aria-expanded', open);
  };
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.category-menu')) {
      $('#mega-menu').classList.remove('open');
      $('#mega-toggle').setAttribute('aria-expanded', 'false');
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      $('#mega-menu').classList.remove('open');
      $('#mega-toggle').setAttribute('aria-expanded', 'false');
      $('.main-nav').classList.remove('mobile-open');
      $('#mobile-menu').setAttribute('aria-expanded', 'false');
    }
  });
}
function footer() {
  $('#site-footer').innerHTML =
    `<div class="newsletter"><div class="container newsletter-inner"><div class="newsletter-title">${icon('mail')}<div><h2>از دنیای هشتگ جا نمانید.</h2><p>خبرهای تازه و پیشنهادهای خوب، برای شما.</p></div></div><form id="newsletter-form"><label class="sr-only" for="newsletter-email">ایمیل شما</label><input id="newsletter-email" name="email" type="email" required dir="rtl" placeholder="ایمیل خود را وارد کنید"><button class="button dark">عضویت در خبرنامه <svg class="inline-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12H4m6-6-6 6 6 6"/></svg></button></form></div></div><div class="container footer-main"><div class="footer-about"><a class="brand" href="index.html"><img src="/assets/images/brand/symbol.svg" width="49" height="56" alt="نشان هشتگ"><span><strong>موبایل <b>هشتگ</b></strong><small>MOBILE HASHTAG</small></span></a><p>همراه شما در دنیای تکنولوژی؛ مجموعه‌ای از گوشی‌های هوشمند و لوازم جانبی برای انتخابی آگاهانه و تجربه‌ای متفاوت.</p><a class="text-link" href="about.html">بیشتر درباره هشتگ <svg class="inline-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12H4m6-6-6 6 6 6"/></svg></a></div><div><h3>دسترسی سریع</h3><a href="shop.html">فروشگاه</a><a href="category.html?slug=phones">گوشی موبایل</a><a href="category.html?slug=accessories">لوازم جانبی</a><a href="shop.html?sale=1">پیشنهادهای ویژه</a><a href="blog.html">مجله هشتگ</a></div><div><h3>همراه شما</h3><a href="account.html">حساب کاربری</a><a href="tracking.html">پیگیری سفارش</a><a href="faq.html">پرسش‌های متداول</a><a href="terms.html">شرایط خرید و بازگشت</a><a href="privacy.html">حریم خصوصی</a></div><div id="footer-contact-details"><h3>با هشتگ در ارتباط باشید</h3><a href="contact.html" class="footer-contact">ارتباط با ما</a></div></div><div class="container footer-bottom"><span>© ${num(1405)} موبایل هشتگ. تمامی حقوق طراحی محفوظ است.</span><span>ساخته شده برای انتخاب‌های هوشمندانه <b>✦</b></span></div>`;
  bindForm('#newsletter-form', async (data, form) => {
    const r = await api('/newsletter', { method: 'POST', body: data });
    toast(r.message);
    form.reset();
  });
}
async function events(e) {
  const add = e.target.closest('[data-add]');
  if (add) {
    add.disabled = true;
    try {
      state.cart = await api('/cart/items', {
        method: 'POST',
        body: { product_id: Number(add.dataset.add), color: add.dataset.color || '', quantity: 1 },
      });
      updateCounts();
      toast('به سبد خرید اضافه شد.');
    } catch (err) {
      toast(err.message, true);
    } finally {
      add.disabled = false;
    }
    return;
  }
  const wish = e.target.closest('[data-wish]');
  if (wish) {
    wish.disabled = true;
    try {
      const id = Number(wish.dataset.wish),
        exists = state.wishlist.includes(id);
      const r = await api('/wishlist/' + id, { method: exists ? 'DELETE' : 'POST' });
      state.wishlist = exists ? state.wishlist.filter((x) => x !== id) : [...state.wishlist, id];
      updateCounts();
      toast(r.message);
      document.dispatchEvent(new CustomEvent('wishlist-changed'));
    } catch (err) {
      toast(err.message, true);
    } finally {
      wish.disabled = false;
    }
    return;
  }
  const quick = e.target.closest('[data-quick]');
  if (quick) {
    const d = openDialog('<div class="loading">در حال دریافت محصول…</div>');
    try {
      const p = await api('/products/' + encodeURIComponent(quick.dataset.quick));
      if (!d.open) return;
      openDialog(
        `<div class="quick-view"><img src="${esc(p.image)}" alt="${esc(p.name)}"><div><span class="overline">${esc(p.brand)}</span><h2>${esc(p.name)}</h2><p>${esc(p.short_description)}</p><div class="detail-price">${money(p.price)}</div><p class="muted">${p.stock ? 'موجود در انبار نمونه' : 'ناموجود'}</p><a href="product.html?slug=${encodeURIComponent(p.slug)}" class="button dark">مشاهده و انتخاب محصول <svg class="inline-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12H4m6-6-6 6 6 6"/></svg></a></div></div>`
      );
    } catch (err) {
      errorState(d, err);
    }
    return;
  }
  if (e.target.closest('[data-reload]')) location.reload();
}
export const ready = (async () => {
  try {
    const results = await Promise.all([
      api('/session'),
      api('/categories'),
      api('/store/contact', { signal: AbortSignal.timeout(4000) }).catch(() => null),
    ]);
    [state, categories] = results;
    header();
    footer();
    renderContact(results[2], { icon, esc });
    fillIcons();
    document.addEventListener('click', events);
    return state;
  } catch (e) {
    $('#site-header').innerHTML =
      '<div class="container notice">ارتباط با فروشگاه برقرار نشد. صفحه را تازه‌سازی کنید.</div>';
    throw e;
  }
})();
