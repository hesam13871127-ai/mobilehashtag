import { test, expect } from '@playwright/test';
const routes = [
  'index.html',
  'shop.html',
  'category.html?slug=phones',
  'category.html?slug=accessories',
  'search.html?q=Anker',
  'product.html?slug=iphone-15-pro-max',
  'cart.html',
  'checkout.html',
  'account.html',
  'login.html',
  'register.html',
  'wishlist.html',
  'about.html',
  'contact.html',
  'blog.html',
  'article.html?slug=phone-buying-guide',
  'faq.html',
  'tracking.html',
  'privacy.html',
  'terms.html',
  'order.html?id=1',
  '404.html',
];
async function ready(page) {
  await page.waitForSelector('#newsletter-form');
  await page.evaluate(() => document.fonts.ready);
}
async function noOverflow(page) {
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)
  ).toBeTruthy();
}
async function loadImages(page) {
  await page.locator('img').evaluateAll((imgs) => imgs.forEach((i) => (i.loading = 'eager')));
  await page.waitForFunction(() => [...document.images].every((i) => i.complete));
  expect(
    await page
      .locator('img')
      .evaluateAll((imgs) => imgs.filter((i) => !i.naturalWidth).map((i) => i.src))
  ).toEqual([]);
}
for (const width of [1920, 1366, 768, 390, 360])
  test(`Responsive routes and all image assets at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    for (const route of routes) {
      await page.goto('/' + route);
      await ready(page);
      await noOverflow(page);
      await loadImages(page);
    }
    await page.goto('/index.html');
    await ready(page);
    await page.waitForSelector('#gadget-products .product-card');
    await loadImages(page);
    await page.locator('#hero-pause').click();
    await page.screenshot({ path: `test-results/home-${width}.png`, fullPage: true });
    expect(errors).toEqual([]);
  });
test('Mega menu, all category URLs, search, filters, pagination, slider', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto('/');
  await ready(page);
  await page.locator('#mega-toggle').click();
  await expect(page.locator('#mega-menu')).toBeVisible();
  expect(await page.locator('#mega-menu a').count()).toBe(47);
  await page.locator('#mega-menu a[href="category.html?slug=cables"]').click();
  await expect(page.locator('h1')).toHaveText('کابل شارژ');
  await expect(page.locator('#shop-products .product-card')).toHaveCount(2);
  await page.locator('.header-search input').fill('Anker');
  await page.locator('.header-search button').click();
  await expect(page.locator('h1')).toContainText('Anker');
  await expect(page.locator('#shop-products .product-card')).toHaveCount(4);
  await page.goto('/shop.html');
  await ready(page);
  await page.locator('[name=brand]').selectOption('Anker');
  await page.locator('[name=min]').fill('1000000');
  await page.locator('[name=max]').fill('2600000');
  await page.locator('[name=instock]').check();
  await page.locator('#filters-form button').click();
  await expect(page.locator('#shop-products .product-card')).toHaveCount(3);
  await page.locator('#sort').selectOption('price_desc');
  await expect(page.locator('#shop-products .product-card').first()).toContainText('پاوربانک');
  await page.goto('/shop.html');
  await ready(page);
  await page.locator('#pagination a').nth(1).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.locator('#shop-products .product-card')).toHaveCount(12);
  await page.goto('/');
  await ready(page);
  await page.locator('#hero-pause').click();
  await page.locator('#hero-next').click();
  await expect(page.locator('.hero h1')).toContainText('موسیقی');
  await expect(page.locator('#hero-link')).toHaveAttribute('href', 'category.html?slug=headphones');
  const cats = await (await page.request.get('/api/categories')).json();
  for (const c of cats) {
    await page.goto('/category.html?slug=' + c.slug);
    await expect(page.locator('h1')).toHaveText(c.name);
    await expect(page.locator('#shop-products .product-card').first()).toBeVisible();
  }
});
test('Mobile menu, filters and quick-view keyboard closing', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await ready(page);
  await page.locator('#mobile-menu').click();
  await expect(page.locator('.main-nav')).toBeVisible();
  await page.locator('#mega-toggle').click();
  await expect(page.locator('#mega-menu')).toBeVisible();
  await page.locator('#mega-menu a[href="category.html?slug=smartwatches"]').click();
  await expect(page.locator('h1')).toHaveText('ساعت هوشمند');
  await page.locator('#filter-toggle').click();
  await expect(page.locator('#shop-filters')).toBeVisible();
  await noOverflow(page);
  await page.goto('/shop.html');
  await ready(page);
  await page.locator('[data-quick]').first().click();
  await expect(page.locator('.quick-view')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#app-dialog')).not.toBeVisible();
});
test('Complete mobile commerce flow: gallery, wish, cart, auth, address, checkout, tracking, settings', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/product.html?slug=iphone-silicone-case');
  await ready(page);
  await page.locator('[data-gallery]').nth(1).click();
  await expect(page.locator('#main-image')).toHaveAttribute('src', /detail/);
  await page.locator('#zoom-image').click();
  await expect(page.locator('.image-zoom')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.locator('.buy-panel [data-wish]').click();
  await expect(page.locator('.buy-panel [data-wish]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#quantity-plus').click();
  await page.locator('#product-add').click();
  await expect(page.locator('#cart-count')).toHaveText('۲');
  await page.reload();
  await ready(page);
  await expect(page.locator('#cart-count')).toHaveText('۲');
  await page.goto('/cart.html');
  await ready(page);
  await page.locator('[data-cart-minus]').click();
  await expect(page.locator('.quantity-control')).toContainText('۱');
  await page.locator('[data-cart-remove]').click();
  await expect(page.locator('#app-dialog')).toBeVisible();
  await page.locator('#confirm-no').click();
  await expect(page.locator('.cart-item')).toHaveCount(1);
  await page.goto('/register.html?next=account.html');
  await ready(page);
  await page.locator('#register-form [name=name]').fill('خریدار مرورگر');
  await page.locator('#register-form [name=email]').fill('browser@example.com');
  await page.locator('#register-form [name=password]').fill('browserPassword123');
  await page.locator('#register-form [type=checkbox]').check();
  await page.locator('#register-form button').click();
  await expect(page).toHaveURL(/account.html/);
  await expect(page.locator('#account-content')).toContainText('خریدار مرورگر');
  await page.locator('.address-form summary').click();
  const af = page.locator('#address-form');
  for (const [key, value] of Object.entries({
    title: 'خانه',
    recipient: 'خریدار مرورگر',
    phone: '09123456789',
    province: 'تهران',
    city: 'تهران',
    address: 'خیابان آزمایشی، کوچه مرورگر، پلاک ۱',
    postal_code: '1234567890',
  }))
    await af.locator(`[name=${key}]`).fill(value);
  await af.locator('button').click();
  await expect(page.locator('.address-card')).toContainText('خانه');
  await noOverflow(page);
  await page.goto('/wishlist.html');
  await ready(page);
  await expect(page.locator('#wishlist-content .product-card')).toHaveCount(1);
  await page.goto('/checkout.html');
  await ready(page);
  await page.locator('#saved-address').selectOption({ label: 'خانه — تهران' });
  await expect(page.locator('[name=postal_code]')).toHaveValue('1234567890');
  await page.locator('[name=demo_accepted]').check();
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: 'test-results/checkout-390.png', fullPage: true });
  await page.locator('#checkout-form button').click();
  await expect(page).toHaveURL(/order.html\?id=/);
  await expect(page.locator('.success-header h1')).toContainText('ثبت شد');
  await expect(page.locator('#cart-count')).toHaveText('۰');
  await noOverflow(page);
  const code = await page.locator('.success-header strong').textContent();
  await page.goto('/tracking.html');
  await ready(page);
  await page.locator('[name=code]').fill(code);
  await page.locator('[name=phone]').fill('09123456789');
  await page.locator('#tracking-form button').click();
  await expect(page.locator('#tracking-result')).toContainText('ثبت‌شده');
  await page.goto('/account.html');
  await ready(page);
  await expect(page.locator('#orders .order-row')).toHaveCount(1);
  await page.locator('#profile-form [name=name]').fill('نام تازه');
  await page.locator('#profile-form button').click();
  await expect(page.locator('.account-person')).toContainText('نام تازه');
  await page.locator('#password-form [name=current]').fill('browserPassword123');
  await page.locator('#password-form [name=password]').fill('newBrowserPassword123');
  await page.locator('#password-form button').click();
  await expect(page.locator('#toast-region')).toContainText('رمز عبور تغییر کرد');
  await page.locator('#logout').click();
  await expect(page).toHaveURL(/login.html/);
  await page.locator('#login-form [name=email]').fill('browser@example.com');
  await page.locator('#login-form [name=password]').fill('newBrowserPassword123');
  await page.locator('#login-form button').click();
  await expect(page).toHaveURL(/account.html/);
  await expect(page.locator('#orders .order-row')).toHaveCount(1);
});
test('Contact, newsletter and registration errors have actual responses', async ({ page }) => {
  await page.goto('/contact.html');
  await ready(page);
  await page.locator('#contact-form [name=name]').fill('کاربر پیام');
  await page.locator('#contact-form [name=email]').fill('message@example.com');
  await page.locator('#contact-form [name=message]').fill('پیام آزمایشی فرم تماس در مرورگر');
  await page.locator('#contact-form button').click();
  await expect(page.locator('#toast-region')).toContainText('پیام شما در پایگاه داده ثبت شد');
  await page.locator('#newsletter-email').fill('news@example.com');
  await page.locator('#newsletter-form button').click();
  await expect(page.locator('#toast-region')).toContainText('عضویت شما ثبت شد');
  await page.goto('/login.html');
  await ready(page);
  await page.locator('#login-form [name=email]').fill('unknown@example.com');
  await page.locator('#login-form [name=password]').fill('invalid-password');
  await page.locator('#login-form button').click();
  await expect(page.locator('.form-error')).toContainText('نادرست');
});
test('Authenticated cart, checkout and account layouts at all five widths', async ({ page }) => {
  await page.goto('/login.html');
  await ready(page);
  await page.locator('#login-form [name=email]').fill('browser@example.com');
  await page.locator('#login-form [name=password]').fill('newBrowserPassword123');
  await page.locator('#login-form button').click();
  await expect(page).toHaveURL(/account.html/);
  await page.goto('/product.html?slug=anker-charger-30w');
  await ready(page);
  await page.locator('#product-add').click();
  await expect(page.locator('#cart-count')).toHaveText('۱');
  for (const width of [1920, 1366, 768, 390, 360]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['/cart.html', '/checkout.html', '/account.html', '/order.html?id=1']) {
      await page.goto(route);
      await ready(page);
      await page.waitForSelector(
        route.includes('cart.html')
          ? '.cart-item'
          : route.includes('checkout')
            ? '#checkout-form'
            : route.includes('account')
              ? '#profile-form'
              : '.success-header'
      );
      await noOverflow(page);
      await loadImages(page);
    }
  }
  await page.goto('/cart.html');
  await page.locator('[data-cart-remove]').click();
  await page.locator('#confirm-yes').click();
  await expect(page.locator('#cart-content .empty-state')).toBeVisible();
});
