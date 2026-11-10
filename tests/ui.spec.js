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

test('Contact polish: centralized demo details, hidden map, responsive homepage/footer and safe links', async ({
  page,
}) => {
  const settings = await (await page.request.get('/api/store/contact')).json();
  const errors = [],
    failed = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('response', (r) => {
    if (r.status() >= 400) failed.push(r.url());
  });
  for (const width of [1920, 1366, 768, 390, 360]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/contact.html');
    await ready(page);
    await expect(page.locator('#contact-information .contact-info-card')).toHaveCount(6);
    await expect(page.locator('#contact-information')).toContainText('اطلاعات آزمایشی');
    for (const key of ['phone', 'whatsapp', 'email', 'instagram', 'telegram']) {
      await expect(
        page.locator(`#contact-information [data-contact-field="${key}"]`)
      ).toContainText(settings[key].value);
      await expect(
        page.locator(`#footer-contact-details [data-contact-field="${key}"]`)
      ).toContainText(settings[key].value);
    }
    for (const key of ['address', 'workingHours']) {
      await expect(
        page.locator(`#contact-information [data-contact-field="${key}"]`)
      ).toContainText(settings[key]);
      await expect(
        page.locator(`#footer-contact-details [data-contact-field="${key}"]`)
      ).toContainText(settings[key]);
    }
    await expect(page.locator('#store-map')).toBeHidden();
    await expect(
      page.locator('a[href^="tel:"], a[href^="mailto:"], a[href^="https://wa.me/"]')
    ).toHaveCount(0);
    await expect(
      page.locator('a[href*="instagram.example"], a[href*="telegram.example"]')
    ).toHaveCount(0);
    await noOverflow(page);
    if ([1366, 390].includes(width)) {
      await page.screenshot({ path: `test-results/contact-polish-${width}.png`, fullPage: true });
      await page
        .locator('#site-footer')
        .screenshot({ path: `test-results/contact-footer-${width}.png` });
    }
    await page.goto('/index.html');
    await ready(page);
    const home = page.locator('#home-contact');
    for (const key of ['phone', 'whatsapp']) await expect(home).toContainText(settings[key].value);
    await expect(home).toContainText(settings.address);
    await expect(home).toContainText(settings.workingHours);
    await expect(home.locator('button')).toBeDisabled();
    await expect(home.locator('a.button')).toHaveAttribute('href', 'contact.html');
    await noOverflow(page);
    if ([1366, 390].includes(width))
      await home.screenshot({ path: `test-results/home-contact-${width}.png` });
  }
  // Follow all distinct internal HTML destinations from the contact page without leaving the site.
  await page.goto('/contact.html');
  await ready(page);
  const links = await page
    .locator('a[href]')
    .evaluateAll((as) => [
      ...new Set(
        as
          .map((a) => a.getAttribute('href'))
          .filter((h) => h && /\.html(?:\?|$)/.test(h) && !/^https?:/.test(h))
      ),
    ]);
  for (const link of links)
    expect((await page.request.get('/' + link.replace(/^\//, ''))).status(), link).toBe(200);
  expect(errors).toEqual([]);
  expect(failed).toEqual([]);
});

test('Contact form retains native validation and actual server-side persistence response', async ({
  page,
}) => {
  await page.goto('/contact.html');
  await ready(page);
  const form = page.locator('#contact-form');
  await form.locator('button').click();
  expect(await form.evaluate((f) => f.checkValidity())).toBe(false);
  await form.locator('[name=name]').fill('کاربر آزمایشی');
  await form.locator('[name=email]').fill('not-an-email');
  await form.locator('[name=message]').fill('کوتاه');
  expect(await form.evaluate((f) => f.checkValidity())).toBe(false);
  await form.locator('[name=email]').fill('contact-polish@example.com');
  await form.locator('[name=message]').fill('این پیام برای آزمون فرم تماس نسخه نهایی است.');
  const response = page.waitForResponse(
    (r) => r.url().endsWith('/api/contact') && r.request().method() === 'POST'
  );
  await form.locator('button').click();
  expect((await response).status()).toBe(201);
  await expect(page.locator('#toast-region')).toContainText('پیام شما در پایگاه داده ثبت شد');
  await expect(form.locator('[name=message]')).toHaveValue('');
});

test('Live-contact rendering uses correct tel/wa.me destinations and safe external link attributes', async ({
  page,
}) => {
  // Mock only: reserved numbers remain disabled in the shipped configuration.
  // No external destination, phone handler or WhatsApp account is contacted by this test.
  const { readContactSettings, phoneLinks } =
    await import('../backend/services/contact-settings.js');
  const sample = readContactSettings();
  const live = {
    ...sample,
    demo: false,
    hasSamples: false,
    notice: '',
    phone: { value: sample.phone.value, href: phoneLinks(sample.phone.value).tel },
    whatsapp: { value: sample.whatsapp.value, href: phoneLinks(sample.whatsapp.value).whatsapp },
    email: { value: sample.email.value, href: 'mailto:' + sample.email.value },
    instagram: {
      value: 'https://www.instagram.com/mobilehashtag_test_fixture',
      href: 'https://www.instagram.com/mobilehashtag_test_fixture',
    },
    telegram: {
      value: 'https://t.me/mobilehashtag_test_fixture',
      href: 'https://t.me/mobilehashtag_test_fixture',
    },
    address: 'نشانی آزمایشی <img src=x onerror=alert(1)>',
    map: {
      latitude: 0,
      longitude: 0,
      href: 'https://www.openstreetmap.org/?mlat=0&mlon=0#map=16/0/0',
    },
  };
  await page.route('**/api/store/contact', (r) => r.fulfill({ json: live }));
  await page.goto('/contact.html');
  await ready(page);
  await expect(page.locator('#contact-information [data-contact-field=phone] a')).toHaveAttribute(
    'href',
    'tel:+12025550142'
  );
  await expect(
    page.locator('#contact-information [data-contact-field=whatsapp] a')
  ).toHaveAttribute('href', 'https://wa.me/12025550143');
  await expect(page.locator('#header-contact-shortcut a')).toHaveAttribute(
    'href',
    'tel:+12025550142'
  );
  await expect(
    page.locator('#footer-contact-details [data-contact-field=email] a')
  ).toHaveAttribute('href', 'mailto:hello@mobile-hashtag.example');
  await expect(page.locator('#contact-information [data-contact-field=address] img')).toHaveCount(
    0
  );
  await expect(page.locator('#contact-information [data-contact-field=address]')).toContainText(
    '<img src=x onerror=alert(1)>'
  );
  await expect(page.locator('#store-map')).toBeVisible();
  for (const link of await page
    .locator(
      '#contact-information a[target="_blank"], #store-map a, #footer-contact-details a[target="_blank"]'
    )
    .all())
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  await page.goto('/index.html');
  await ready(page);
  await expect(page.locator('#home-contact [data-contact-field=whatsapp] a')).toHaveAttribute(
    'href',
    'https://wa.me/12025550143'
  );
  await expect(page.locator('#home-contact .contact-demo-label')).toHaveCount(0);
});

test('Empty contact settings hide fields; configuration failure cannot break shopping or contact form', async ({
  page,
}) => {
  const { publicContactSettings } = await import('../backend/services/contact-settings.js');
  await page.route('**/api/store/contact', (r) =>
    r.fulfill({ json: publicContactSettings({ mode: 'live' }) })
  );
  await page.goto('/contact.html');
  await ready(page);
  await expect(page.locator('#contact-information .contact-info-card')).toHaveCount(0);
  await expect(page.locator('#footer-contact-details [data-contact-field]')).toHaveCount(0);
  await expect(page.locator('#contact-form')).toBeVisible();
  await page.unroute('**/api/store/contact');
  await page.route('**/api/store/contact', (r) =>
    r.fulfill({ status: 503, json: { error: 'خطای آزمایشی تنظیمات' } })
  );
  await page.goto('/contact.html');
  await ready(page);
  await expect(page.locator('#contact-information')).toContainText('موقتاً در دسترس نیست');
  await expect(page.locator('#contact-form')).toBeVisible();
  await page.goto('/product.html?slug=iphone-silicone-case');
  await ready(page);
  await page.locator('#product-add').click();
  await expect(page.locator('#cart-count')).toHaveText('۱');
});
