import {
  ready,
  $,
  $$,
  api,
  esc,
  num,
  categories,
  productCard,
  skeleton,
  empty,
  errorState,
} from './common.js';
await ready;
const params = new URLSearchParams(location.search);
const slug = params.get('slug') || params.get('category');
if (slug) params.set('category', slug);
params.delete('slug');
const category = categories.find((c) => c.slug === slug),
  query = params.get('q') || '';
const title = category
  ? category.name
  : query
    ? `نتایج جست‌وجوی «${query}»`
    : params.get('sale') === '1'
      ? 'پیشنهادهای طلایی'
      : 'فروشگاه هشتگ';
document.title = title + ' | موبایل هشتگ';
$('#listing-heading').innerHTML =
  `<nav class="breadcrumbs"><a href="index.html">خانه</a><span>/</span><a href="shop.html">فروشگاه</a>${category ? `<span>/</span><span>${esc(category.name)}</span>` : ''}</nav><div class="page-heading"><span class="overline">انتخابی آگاهانه، تجربه‌ای متفاوت</span><h1>${esc(title)}</h1><p>محصول مورد علاقه‌تان را پیدا کنید؛ جزئیات را به ما بسپارید.</p></div>`;
const brands = await api('/brands');
$('#shop-filters').innerHTML =
  `<h2>فیلتر محصولات</h2><form id="filters-form"><div class="filter-section"><h3>دسته‌بندی‌ها</h3><a class="text-link" href="shop.html">همه محصولات</a>${categories
    .filter((c) => !c.parent_id)
    .map(
      (parent) =>
        `<details ${category && (category.id === parent.id || category.parent_id === parent.id) ? 'open' : ''}><summary>${esc(parent.name)}</summary><a href="category.html?slug=${parent.slug}">همه ${esc(parent.name)}</a>${categories
          .filter((c) => c.parent_id === parent.id)
          .map(
            (c) =>
              `<a class="${c.slug === slug ? 'active' : ''}" href="category.html?slug=${c.slug}">${esc(c.name)} <span class="muted">(${num(c.product_count)})</span></a>`
          )
          .join('')}</details>`
    )
    .join(
      ''
    )}</div><div class="filter-section"><h3>برند</h3><select name="brand" aria-label="برند"><option value="">همه برندها</option>${brands.map((b) => `<option value="${esc(b)}" ${params.get('brand') === b ? 'selected' : ''}>${esc(b)}</option>`).join('')}</select></div><div class="filter-section"><h3>محدوده قیمت (تومان)</h3><div class="price-inputs"><label>از<input name="min" type="number" min="0" placeholder="۰" value="${esc(params.get('min') || '')}"></label><label>تا<input name="max" type="number" min="0" placeholder="بدون محدودیت" value="${esc(params.get('max') || '')}"></label></div></div><div class="filter-section"><label class="check-label"><input name="instock" type="checkbox" value="1" ${params.get('instock') === '1' ? 'checked' : ''}> فقط کالاهای موجود</label><label class="check-label"><input name="sale" type="checkbox" value="1" ${params.get('sale') === '1' ? 'checked' : ''}> فقط تخفیف‌دارها</label></div><button class="button dark">اعمال فیلترها</button><a class="button outline" href="${category ? 'category.html?slug=' + category.slug : 'shop.html'}">پاک کردن فیلترها</a></form>`;
function navigate(p) {
  location.href = 'shop.html?' + p.toString();
}
$('#filters-form').onsubmit = (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  const min = Number(form.elements.min.value) || 0,
    max = Number(form.elements.max.value) || Infinity;
  if (min > max) {
    form.elements.max.setCustomValidity('حداکثر قیمت باید بیشتر از حداقل باشد.');
    form.elements.max.reportValidity();
    return;
  }
  form.elements.max.setCustomValidity('');
  const next = new URLSearchParams(params);
  for (const key of ['brand', 'min', 'max', 'instock', 'sale']) next.delete(key);
  for (const [key, value] of new FormData(form)) if (value) next.set(key, value);
  next.delete('page');
  navigate(next);
};
$('#filters-form [name=max]').oninput = (e) => e.target.setCustomValidity('');
$('#filter-toggle').onclick = () => {
  const open = $('#shop-filters').classList.toggle('open');
  $('#filter-toggle').setAttribute('aria-expanded', open);
  if (open) $('#shop-filters').scrollIntoView({ behavior: 'smooth', block: 'start' });
};
$('#sort').value = params.get('sort') || 'featured';
$('#sort').onchange = (e) => {
  params.set('sort', e.target.value);
  params.delete('page');
  navigate(params);
};
$('#shop-products').innerHTML = skeleton(6);
try {
  if (slug && !category) throw new Error('دسته‌بندی مورد نظر پیدا نشد.');
  const result = await api('/products?' + params.toString());
  $('#product-count').textContent = num(result.total) + ' محصول';
  $('#shop-products').innerHTML = result.products.length
    ? result.products.map(productCard).join('')
    : empty('انتخاب شما فعلاً موجود نیست.', 'فیلترها را تغییر دهید یا محصولات دیگر را ببینید.');
  $('#pagination').innerHTML = Array.from({ length: result.pages }, (_, i) => {
    const p = new URLSearchParams(params);
    p.set('page', i + 1);
    return `<a class="${result.page === i + 1 ? 'active' : ''}" ${result.page === i + 1 ? 'aria-current="page"' : ''} href="shop.html?${esc(p.toString())}" aria-label="صفحه ${num(i + 1)}">${num(i + 1)}</a>`;
  }).join('');
  const labels = {
    q: 'جست‌وجو',
    brand: 'برند',
    min: 'حداقل قیمت',
    max: 'حداکثر قیمت',
    instock: 'فقط موجود',
    sale: 'تخفیف‌دار',
  };
  $('#active-filters').innerHTML = [...params]
    .filter(([k]) => labels[k])
    .map(([k, v]) => {
      const p = new URLSearchParams(params);
      p.delete(k);
      p.delete('page');
      return `<a class="active-filter" href="shop.html?${esc(p.toString())}">${labels[k]} ${['instock', 'sale'].includes(k) ? '' : esc(v)} ×</a>`;
    })
    .join('');
} catch (e) {
  errorState($('#shop-products'), e);
}
