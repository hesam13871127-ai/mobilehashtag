import {
  ready,
  $,
  $$,
  api,
  esc,
  num,
  money,
  date,
  icon,
  state,
  refreshSession,
  productCard,
  postCard,
  empty,
  errorState,
  toast,
  updateCounts,
  confirmDialog,
  bindForm,
} from './common.js';
await ready;
const page = document.body.dataset.page;
const params = new URLSearchParams(location.search);
function safeNext() {
  const next = params.get('next');
  if (!next) return 'account.html';
  try {
    const url = new URL(next, location.origin);
    return url.origin === location.origin && /\.html$/.test(url.pathname)
      ? url.pathname + url.search
      : 'account.html';
  } catch {
    return 'account.html';
  }
}
function loginRequired(el, next) {
  el.innerHTML = empty(
    'این بخش برای شماست.',
    'برای ادامه، وارد حساب خود شوید یا یک حساب تازه بسازید.',
    'login.html?next=' + encodeURIComponent(next),
    'ورود / ساخت حساب'
  );
}
const addressFields = (a = {}) =>
  `<div class="form-row"><label>نام و نام خانوادگی گیرنده<input name="recipient" autocomplete="name" required minlength="2" maxlength="100" value="${esc(a.recipient || state.user?.name || '')}"></label><label>شماره موبایل<input name="phone" type="tel" autocomplete="tel" required dir="ltr" placeholder="09123456789" maxlength="11" value="${esc(a.phone || state.user?.phone || '')}"></label></div><div class="form-row"><label>استان<input name="province" required minlength="2" maxlength="50" autocomplete="address-level1" value="${esc(a.province || '')}"></label><label>شهر<input name="city" required minlength="2" maxlength="60" autocomplete="address-level2" value="${esc(a.city || '')}"></label></div><label>نشانی کامل<textarea name="address" required minlength="10" maxlength="500" autocomplete="street-address" rows="3">${esc(a.address || '')}</textarea></label><label>کد پستی ۱۰ رقمی<input name="postal_code" required minlength="10" maxlength="10" inputmode="numeric" dir="ltr" autocomplete="postal-code" value="${esc(a.postal_code || '')}"></label>`;
function summary(c, cta = '') {
  return `<aside class="summary-panel"><h2>خلاصه سفارش</h2><div class="summary-line"><span>قیمت کالاها (${num(c.count || c.items.reduce((s, p) => s + p.quantity, 0))})</span><span>${money(c.subtotal)}</span></div><div class="summary-line"><span>هزینه ارسال نمونه</span><span>${c.shipping ? money(c.shipping) : 'رایگان'}</span></div><div class="summary-line total"><span>مبلغ نهایی</span><span>${money(c.total)}</span></div>${cta}<p>پرداخت آزمایشی است و مبلغی دریافت نمی‌شود.</p></aside>`;
}
async function renderCart() {
  const el = $('#cart-content');
  const c = await api('/cart');
  state.cart = c;
  updateCounts();
  if (!c.items.length) {
    el.innerHTML = empty(
      'سبد شما منتظر یک انتخاب خوب است.',
      'از میان گوشی‌ها و گجت‌های هشتگ، همراه تازه‌تان را پیدا کنید.'
    );
    return;
  }
  el.innerHTML = `<div class="cart-layout"><div><div class="cart-items">${c.items.map((p, index) => `<article class="cart-item"><img src="${esc(p.image)}" alt="${esc(p.name)}"><div><h3><a href="product.html?slug=${encodeURIComponent(p.slug)}">${esc(p.name)}</a></h3><p>${esc(p.color)} · ${money(p.price)} / هر عدد</p><div class="quantity-control"><button data-cart-plus="${index}" aria-label="افزایش تعداد ${esc(p.name)}">+</button><span>${num(p.quantity)}</span><button data-cart-minus="${index}" aria-label="کاهش تعداد ${esc(p.name)}" ${p.quantity <= 1 ? 'disabled' : ''}>−</button></div>${p.quantity > p.stock ? '<p class="form-error">موجودی تغییر کرده؛ تعداد را کاهش دهید.</p>' : ''}</div><div class="cart-item-end"><strong>${money(p.quantity * p.price)}</strong><button class="icon-button" data-cart-remove="${index}" aria-label="حذف ${esc(p.name)}">${icon('trash')}</button></div></article>`).join('')}</div><a class="text-link section" href="shop.html"><svg class="inline-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6"/></svg> ادامه خرید</a></div>${summary(c, '<a class="button dark full" href="checkout.html">ادامه و تکمیل سفارش <svg class="inline-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12H4m6-6-6 6 6 6"/></svg></a>')}</div>`;
  async function change(button, index, delta, remove = false) {
    const item = c.items[index];
    if (remove && !(await confirmDialog('این محصول از سبد خرید حذف شود؟'))) return;
    button.disabled = true;
    try {
      await api('/cart/items/' + item.id, {
        method: remove ? 'DELETE' : 'PATCH',
        body: { color: item.color, quantity: item.quantity + delta },
      });
      await renderCart();
    } catch (e) {
      toast(e.message, true);
      button.disabled = false;
    }
  }
  $$('[data-cart-plus]').forEach(
    (b) => (b.onclick = () => change(b, Number(b.dataset.cartPlus), 1))
  );
  $$('[data-cart-minus]').forEach(
    (b) => (b.onclick = () => change(b, Number(b.dataset.cartMinus), -1))
  );
  $$('[data-cart-remove]').forEach(
    (b) => (b.onclick = () => change(b, Number(b.dataset.cartRemove), 0, true))
  );
}
async function checkout() {
  const el = $('#checkout-content');
  if (!state.user) {
    loginRequired(el, 'checkout.html');
    return;
  }
  const [c, account] = await Promise.all([api('/cart'), api('/account')]);
  if (!c.items.length) {
    el.innerHTML = empty('سبد خرید خالی است.', 'قبل از ثبت سفارش، یک محصول انتخاب کنید.');
    return;
  }
  const key = crypto.randomUUID();
  el.innerHTML = `<div class="checkout-layout"><div class="panel"><h2>۱. مشخصات و نشانی تحویل</h2>${account.addresses.length ? `<label class="form-stack">انتخاب از نشانی‌های ذخیره‌شده<select id="saved-address"><option value="">نشانی جدید</option>${account.addresses.map((a) => `<option value="${a.id}">${esc(a.title)} — ${esc(a.city)}</option>`).join('')}</select></label><hr>` : ''}<form id="checkout-form" class="form-stack"><div id="checkout-address" class="form-stack">${addressFields()}</div><hr><h2>۲. روش پرداخت</h2><div class="payment-option"><h3>${icon('shield')} ثبت سفارش آزمایشی</h3><p>سفارش در دیتابیس ثبت می‌شود؛ هیچ مبلغی دریافت نمی‌شود و کالایی ارسال نخواهد شد. نیازی به اطلاعات کارت بانکی نیست.</p></div><label class="check-label"><input type="checkbox" name="demo_accepted" required><span>آزمایشی بودن خرید و <a href="terms.html" target="_blank" rel="noopener">شرایط استفاده</a> را می‌پذیرم.</span></label><p class="form-error" role="alert"></p><button class="button dark full">ثبت سفارش آزمایشی · ${money(c.total)} <svg class="inline-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12H4m6-6-6 6 6 6"/></svg></button></form></div><div>${summary(c)}<div class="panel section"><h3>انتخاب‌های شما</h3>${c.items.map((p) => `<div class="checkout-summary-item"><span>${esc(p.name)} <b>× ${num(p.quantity)}</b></span><span>${money(p.price * p.quantity)}</span></div>`).join('')}</div></div></div>`;
  if ($('#saved-address'))
    $('#saved-address').onchange = (e) => {
      const a = account.addresses.find((a) => a.id === Number(e.target.value));
      $('#checkout-address').innerHTML = addressFields(a);
    };
  bindForm('#checkout-form', async (data) => {
    const order = await api('/orders', {
      method: 'POST',
      body: { address: data, idempotency_key: key, demo_accepted: data.demo_accepted === 'on' },
    });
    location.href = 'order.html?id=' + order.id;
  });
}
async function wishlist() {
  const products = await api('/wishlist');
  $('#wishlist-content').innerHTML = products.length
    ? products.map(productCard).join('')
    : empty('هنوز دلتان پیش محصولی نمانده؟', 'با لمس قلب کنار هر محصول، آن را برای بعد نگه دارید.');
}
async function account() {
  const el = $('#account-content');
  if (!state.user) {
    loginRequired(el, 'account.html');
    return;
  }
  const a = await api('/account');
  el.innerHTML = `<div class="account-layout"><aside class="account-sidebar"><div class="account-person"><span class="avatar">${esc(a.user.name[0])}</span><h3>${esc(a.user.name)}</h3><p dir="ltr">${esc(a.user.email)}</p></div><a href="#orders">${icon('box')} سفارش‌های من</a><a href="#profile">${icon('user')} اطلاعات شخصی</a><a href="#addresses">${icon('pin')} نشانی‌ها</a><a href="wishlist.html">${icon('heart')} علاقه‌مندی‌ها</a><a href="#settings">${icon('shield')} تنظیمات حساب</a><button id="logout">${icon('logout')} خروج از حساب</button></aside><div><section id="orders" class="panel account-section"><h2>سفارش‌های من</h2>${a.orders.length ? a.orders.map((o) => `<div class="order-row"><div><strong>${esc(o.tracking_code)}</strong><small>${date(o.created_at)}</small></div><span class="status-badge">ثبت‌شده · آزمایشی</span><div><p>${money(o.total)}</p><a class="text-link" href="order.html?id=${o.id}">جزئیات سفارش <svg class="inline-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12H4m6-6-6 6 6 6"/></svg></a></div></div>`).join('') : '<p class="muted small">هنوز سفارشی ثبت نکرده‌اید. انتخاب بعدی شما کدام است؟</p><a class="text-link section" href="shop.html">رفتن به فروشگاه <svg class="inline-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12H4m6-6-6 6 6 6"/></svg></a>'}</section><section id="profile" class="panel account-section"><h2>اطلاعات شخصی</h2><form id="profile-form" class="form-stack"><div class="form-row"><label>نام و نام خانوادگی<input name="name" minlength="2" maxlength="100" required value="${esc(a.user.name)}"></label><label>شماره موبایل<input name="phone" type="tel" maxlength="11" dir="ltr" value="${esc(a.user.phone)}"></label></div><label>ایمیل<input type="email" value="${esc(a.user.email)}" disabled dir="ltr"><small>شناسه ورود شماست و در این نسخه قابل تغییر نیست.</small></label><p class="form-error" role="alert"></p><button class="button dark">ذخیره اطلاعات</button></form></section><section id="addresses" class="panel account-section"><h2>نشانی‌های شما</h2>${a.addresses.length ? a.addresses.map((ad) => `<div class="address-card"><div><h3>${esc(ad.title)}</h3><p>${esc(ad.province)}، ${esc(ad.city)}، ${esc(ad.address)}</p><p>${esc(ad.recipient)} · <bdi>${esc(ad.phone)}</bdi></p><small>کد پستی: ${num(ad.postal_code).replaceAll('٬', '')}</small></div><button data-delete-address="${ad.id}" class="icon-button" aria-label="حذف نشانی ${esc(ad.title)}">${icon('trash')}</button></div>`).join('') : '<p class="small muted">نشانی جدیدی اضافه کنید تا خرید بعدی ساده‌تر شود.</p>'}<details class="address-form"><summary>+ افزودن نشانی جدید</summary><form id="address-form" class="form-stack section"><label>عنوان نشانی<input name="title" required minlength="2" maxlength="50" placeholder="مثلاً خانه یا محل کار"></label>${addressFields()}<p class="form-error" role="alert"></p><button class="button dark">ذخیره نشانی</button></form></details></section><section id="settings" class="panel account-section"><h2>امنیت حساب</h2><form id="password-form" class="form-stack"><label>رمز فعلی<input name="current" type="password" autocomplete="current-password" required maxlength="128"></label><label>رمز جدید<input name="password" type="password" autocomplete="new-password" minlength="10" maxlength="128" required><small>حداقل ۱۰ کاراکتر</small></label><p class="form-error" role="alert"></p><button class="button dark">تغییر رمز عبور</button></form></section></div></div>`;
  $('#logout').onclick = async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
      location.href = 'login.html';
    } catch (e) {
      toast(e.message, true);
    }
  };
  bindForm('#profile-form', async (data) => {
    const r = await api('/account', { method: 'PATCH', body: data });
    toast(r.message);
    await refreshSession();
    await account();
  });
  bindForm('#address-form', async (data) => {
    await api('/addresses', { method: 'POST', body: data });
    toast('نشانی شما ذخیره شد.');
    await account();
    location.hash = 'addresses';
  });
  bindForm('#password-form', async (data, form) => {
    const r = await api('/account/password', { method: 'POST', body: data });
    toast(r.message);
    form.reset();
  });
  $$('[data-delete-address]').forEach(
    (b) =>
      (b.onclick = async () => {
        if (!(await confirmDialog('این نشانی از حساب شما حذف شود؟'))) return;
        try {
          await api('/addresses/' + b.dataset.deleteAddress, { method: 'DELETE' });
          await account();
          location.hash = 'addresses';
        } catch (e) {
          toast(e.message, true);
        }
      })
  );
}
async function order() {
  const el = $('#order-content');
  if (!state.user) {
    loginRequired(el, 'order.html?id=' + params.get('id'));
    return;
  }
  const o = await api('/orders/' + encodeURIComponent(params.get('id')));
  const a = o.address;
  el.innerHTML = `<div class="order-detail"><div class="success-header">${icon('check')}<h1>سفارش آزمایشی شما ثبت شد.</h1><p>ممنون که هشتگ را برای یک انتخاب هوشمندانه همراهی کردید.</p><p>کد پیگیری: <strong dir="ltr">${esc(o.tracking_code)}</strong></p><small class="muted">${date(o.created_at)}</small></div><div class="notice">این سفارش آزمایشی است. هیچ پرداخت یا ارسال واقعی انجام نشده است.</div><div class="panel"><h2>جزئیات سفارش</h2><span class="status-badge">ثبت‌شده · آزمایشی</span><div class="cart-items section">${o.items.map((p) => `<article class="cart-item"><img src="${esc(p.image)}" alt="${esc(p.name)}"><div><h3>${esc(p.name)}</h3><p>${esc(p.color)} · تعداد ${num(p.quantity)}</p></div><div class="cart-item-end"><strong>${money(p.unit_price * p.quantity)}</strong></div></article>`).join('')}</div><div class="summary-line"><span>جمع کالاها</span><span>${money(o.subtotal)}</span></div><div class="summary-line"><span>ارسال نمونه</span><span>${o.shipping ? money(o.shipping) : 'رایگان'}</span></div><div class="summary-line total"><span>مبلغ سفارش</span><span>${money(o.total)}</span></div><hr><h3>نشانی ثبت‌شده</h3><p class="muted small">${esc(a.recipient)} — ${esc(a.province)}، ${esc(a.city)}، ${esc(a.address)}</p><p class="muted small">کد پستی: <bdi>${esc(a.postal_code)}</bdi> · موبایل: <bdi>${esc(a.phone)}</bdi></p></div><div class="button-row"><a class="button dark" href="account.html">مشاهده سفارش‌های من</a><a class="button outline" href="shop.html">بازگشت به فروشگاه</a></div></div>`;
}
async function article() {
  const p = await api('/posts/' + encodeURIComponent(params.get('slug')));
  document.title = p.title + ' | مجله هشتگ';
  $('#article-content').innerHTML =
    `<nav class="breadcrumbs"><a href="index.html">خانه</a><span>/</span><a href="blog.html">مجله هشتگ</a><span>/</span><span>راهنمای خرید</span></nav><header class="article-header"><span class="overline">راهنمای خرید · مجله هشتگ</span><h1>${esc(p.title)}</h1><p>${num(p.read_minutes)} دقیقه مطالعه · تحریریه هشتگ</p></header><img class="article-hero" src="${esc(p.image)}" alt="${esc(p.title)}"><div class="prose"><p>${esc(p.excerpt)}</p>${p.body
      .split('\n')
      .map((s, i) => (i % 2 === 0 ? `<h2>${esc(s)}</h2>` : `<p>${esc(s)}</p>`))
      .join(
        ''
      )}<div class="notice">این راهنما عمومی است. سازگاری و مشخصات نهایی را با اطلاعات رسمی سازنده بررسی کنید.</div><a class="button dark" href="shop.html">انتخاب‌های هشتگ را ببینید <svg class="inline-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12H4m6-6-6 6 6 6"/></svg></a></div><section class="section"><div class="section-heading"><h2>بیشتر بخوانید</h2></div><div class="blog-grid">${(
      await api('/posts')
    )
      .filter((x) => x.id !== p.id)
      .map(postCard)
      .join('')}</div></section>`;
}
try {
  if (page === 'login' || page === 'register') {
    if (state.user) {
      location.replace('account.html');
    } else
      bindForm('#' + page + '-form', async (data) => {
        const result = await api('/auth/' + page, { method: 'POST', body: data });
        state.user = result.user;
        location.href = safeNext();
      });
  }
  if (page === 'cart') await renderCart();
  if (page === 'checkout') await checkout();
  if (page === 'wishlist') {
    await wishlist();
    document.addEventListener('wishlist-changed', () =>
      wishlist().catch((e) => toast(e.message, true))
    );
  }
  if (page === 'account') await account();
  if (page === 'order') await order();
  if (page === 'contact')
    bindForm('#contact-form', async (data, form) => {
      const r = await api('/contact', { method: 'POST', body: data });
      toast(r.message);
      form.reset();
    });
  if (page === 'tracking')
    bindForm('#tracking-form', async (data) => {
      const el = $('#tracking-result');
      el.innerHTML = '';
      const o = await api('/tracking', { method: 'POST', body: data });
      el.innerHTML = `<div class="panel tracking-result"><span class="status-badge">ثبت‌شده · آزمایشی</span><h2 dir="ltr">${esc(o.tracking_code)}</h2><p class="small muted">${date(o.created_at)}</p><div class="summary-line"><span>مبلغ سفارش</span><span>${money(o.total)}</span></div><p class="notice">${esc(o.message)}</p></div>`;
    });
  if (page === 'blog') $('#blog-posts').innerHTML = (await api('/posts')).map(postCard).join('');
  if (page === 'article') await article();
} catch (e) {
  const ids = {
    cart: 'cart-content',
    checkout: 'checkout-content',
    account: 'account-content',
    wishlist: 'wishlist-content',
    order: 'order-content',
    blog: 'blog-posts',
    article: 'article-content',
  };
  const el = $('#' + ids[page]);
  if (el) errorState(el, e);
  else toast(e.message, true);
}
