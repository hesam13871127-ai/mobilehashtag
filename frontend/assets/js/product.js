import {
  ready,
  $,
  $$,
  api,
  esc,
  num,
  money,
  icon,
  state,
  productCard,
  empty,
  errorState,
  toast,
  updateCounts,
  openDialog,
  bindForm,
} from './common.js';
await ready;
const slug = new URLSearchParams(location.search).get('slug');
try {
  if (!slug) throw new Error('محصولی انتخاب نشده است.');
  const p = await api('/products/' + encodeURIComponent(slug));
  document.title = p.name + ' | موبایل هشتگ';
  $('#product-content').innerHTML =
    `<nav class="breadcrumbs"><a href="index.html">خانه</a><span>/</span><a href="shop.html">فروشگاه</a><span>/</span><a href="category.html?slug=${p.categories[0].slug}">${esc(p.categories[0].name)}</a><span>/</span><span>${esc(p.brand)}</span></nav><div class="product-detail"><div class="product-gallery"><button class="main-product-image" id="zoom-image" aria-label="بزرگ‌نمایی تصویر"><img id="main-image" src="${esc(p.image)}" alt="${esc(p.name)}" width="600" height="600"></button><div class="gallery-thumbs">${p.gallery.map((src, i) => `<button data-gallery="${esc(src)}" class="${i === 0 ? 'active' : ''}" aria-label="${i === 0 ? 'تصویر اصلی' : 'نمای جزئیات'}"><img src="${esc(src)}" alt="${i === 0 ? 'تصویر اصلی' : 'برش نمای جزئیات'}"></button>`).join('')}</div><p class="gallery-caption">رندر یا تصویرسازی نمایشی محصول · برای بزرگ‌نمایی کلیک کنید</p></div><div class="detail-info"><a class="overline" href="shop.html?brand=${encodeURIComponent(p.brand)}">${esc(p.brand)}</a><h1>${esc(p.name)}</h1><div class="detail-rating"><span class="stars">★★★★★</span> ${num(p.rating.toFixed(1))} <span class="muted"> | ${num(p.reviews.length)} دیدگاه (شامل نمونه)</span></div><p>${esc(p.short_description)}</p><div class="sku">شناسه کالا: <bdi>${esc(p.sku)}</bdi></div>${p.colors.length ? `<fieldset class="color-options"><legend>انتخاب رنگ</legend>${p.colors.map((c, i) => `<label><input type="radio" name="product-color" value="${esc(c)}" ${i === 0 ? 'checked' : ''}>${esc(c)}</label>`).join('')}</fieldset>` : ''}<div class="detail-specs">${Object.entries(
      p.specs
    )
      .slice(0, 4)
      .map(([k, v]) => `<div><span>${esc(k)}:</span> ${esc(v)}</div>`)
      .join(
        ''
      )}</div><a class="text-link gold" href="#specifications">همه مشخصات فنی <svg class="inline-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v16m-6-6 6 6 6-6"/></svg></a></div><aside class="buy-panel"><span class="stock-label">${icon(p.stock ? 'check' : 'close')} ${p.stock ? 'موجود در انبار نمونه' : 'ناموجود'}</span><hr>${p.old_price > p.price ? `<del>${num(p.old_price)} تومان</del> <span class="chip">${num(Math.round((1 - p.price / p.old_price) * 100))}٪ تخفیف</span>` : ''}<div class="detail-price">${money(p.price)}</div><div class="buy-controls"><span>تعداد:</span><div class="quantity-control"><button id="quantity-plus" aria-label="افزایش تعداد">+</button><input id="quantity" type="number" min="1" max="${Math.min(p.stock, 20)}" value="1" aria-label="تعداد کالا" readonly><button id="quantity-minus" aria-label="کاهش تعداد">−</button></div></div><button id="product-add" class="button dark full" ${p.stock ? '' : 'disabled'}>${icon('cart')} ${p.stock ? 'افزودن به سبد خرید' : 'فعلاً ناموجود'}</button><button class="button outline full ${state.wishlist.includes(p.id) ? 'selected' : ''}" data-wish="${p.id}" aria-pressed="${state.wishlist.includes(p.id)}">${icon('heart')} افزودن به علاقه‌مندی‌ها</button><div class="buy-benefits"><span>${icon('shield')} اطلاعات گارانتی و رجیستری نمایشی است</span><span>${icon('truck')} ارسال رایگان بالای ۵ میلیون تومان</span><span>${icon('refresh')} پرداخت و ارسال واقعی انجام نمی‌شود</span></div></aside></div><nav class="product-tabs"><a href="#description">معرفی محصول</a><a href="#specifications">مشخصات فنی</a><a href="#reviews">نظرات کاربران</a></nav><section class="detail-section" id="description"><h2>نگاهی نزدیک‌تر</h2><p class="detail-description">${esc(p.description)}</p></section><section class="detail-section" id="specifications"><h2>مشخصات فنی</h2><table class="spec-table"><tbody>${Object.entries(
      p.specs
    )
      .map(([k, v]) => `<tr><th scope="row">${esc(k)}</th><td>${esc(v)}</td></tr>`)
      .join(
        ''
      )}</tbody></table></section><section class="detail-section" id="reviews"><h2>تجربه شما ارزشمند است</h2><div class="reviews-layout"><div>${p.reviews.map((r) => `<article class="customer-review"><h3>${esc(r.name)} <span class="stars">${'★'.repeat(r.rating)}</span></h3>${r.sample ? '<small>دیدگاه نمونه؛ خرید تأییدشده نیست</small>' : '<small>نظر کاربر ثبت‌نام‌شده؛ خرید تأییدشده نیست</small>'}<p>${esc(r.body)}</p></article>`).join('')}</div><div>${state.user ? `<form id="review-form" class="form-stack"><h3>دیدگاه خود را بنویسید</h3><label>امتیاز شما<select name="rating"><option value="5">۵ — عالی</option><option value="4">۴ — خوب</option><option value="3">۳ — معمولی</option><option value="2">۲ — ضعیف</option><option value="1">۱ — بسیار ضعیف</option></select></label><label>متن دیدگاه<textarea name="body" required minlength="10" maxlength="2000" rows="4"></textarea></label><p class="form-error" role="alert"></p><button class="button dark">ثبت دیدگاه</button></form>` : `<p class="muted">برای ثبت دیدگاه وارد حساب خود شوید.</p><a class="button outline" href="login.html?next=${encodeURIComponent(location.pathname + location.search)}">ورود به حساب</a>`}</div></div></section><section class="section"><div class="section-heading"><h2>انتخاب‌های مشابه</h2><a class="text-link" href="shop.html">دیدن فروشگاه <svg class="inline-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12H4m6-6-6 6 6 6"/></svg></a></div><div class="product-grid">${p.related.map(productCard).join('')}</div></section><section class="section" id="recent-section"><div class="section-heading"><h2>به‌تازگی دیده‌اید</h2></div><div class="product-grid" id="recent-products"></div></section>`;
  $$('[data-gallery]').forEach(
    (b) =>
      (b.onclick = () => {
        $('#main-image').src = b.dataset.gallery;
        $$('[data-gallery]').forEach((x) => x.classList.toggle('active', x === b));
      })
  );
  $('#zoom-image').onclick = () =>
    openDialog(`<img class="image-zoom" src="${esc($('#main-image').src)}" alt="${esc(p.name)}">`);
  $('#quantity-plus').onclick = () => {
    $('#quantity').value = Math.min(Math.min(p.stock, 20), Number($('#quantity').value) + 1);
  };
  $('#quantity-minus').onclick = () => {
    $('#quantity').value = Math.max(1, Number($('#quantity').value) - 1);
  };
  $('#product-add').onclick = async (e) => {
    const button = e.currentTarget;
    button.disabled = true;
    try {
      state.cart = await api('/cart/items', {
        method: 'POST',
        body: {
          product_id: p.id,
          color: $('[name=product-color]:checked')?.value || '',
          quantity: Number($('#quantity').value),
        },
      });
      updateCounts();
      toast('محصول به سبد خرید اضافه شد.');
    } catch (e) {
      toast(e.message, true);
    } finally {
      button.disabled = false;
    }
  };
  bindForm('#review-form', async (data) => {
    const r = await api('/products/' + p.id + '/reviews', {
      method: 'POST',
      body: { ...data, rating: Number(data.rating) },
    });
    toast(r.message);
    location.reload();
  });
  const recent = (await api('/recent')).filter((x) => x.id !== p.id).slice(0, 4);
  if (recent.length) $('#recent-products').innerHTML = recent.map(productCard).join('');
  else $('#recent-section').remove();
} catch (e) {
  if (e.status === 404 || !slug)
    $('#product-content').innerHTML = empty(
      'کالا پیدا نشد.',
      'این محصول در کاتالوگ فعلی وجود ندارد.'
    );
  else errorState($('#product-content'), e);
}
