// @vitest-environment jsdom
/* Real render smoke tests: every route must render its own page without crashing. */
import { describe, it, expect, beforeAll } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import App from '../src/App';

beforeAll(() => {
  (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
  Object.defineProperty(window, 'scrollTo', { value: () => {}, writable: true });
  Object.defineProperty(window, 'matchMedia', {
    value: () => ({ matches: false, addListener: () => {}, removeListener: () => {} }),
    writable: true,
  });
});

async function renderPath(path: string): Promise<string> {
  localStorage.clear();
  window.history.pushState({}, '', path);
  const el = document.createElement('div');
  document.body.appendChild(el);
  let root: Root | null = null;
  await act(async () => {
    root = createRoot(el);
    root.render(<App />);
  });
  const text = el.textContent || '';
  await act(async () => {
    root?.unmount();
  });
  el.remove();
  return text;
}

async function renderAdmin(path: string): Promise<string> {
  localStorage.clear();
  localStorage.setItem('mh_session_v1', JSON.stringify('u-admin'));
  window.history.pushState({}, '', path);
  const el = document.createElement('div');
  document.body.appendChild(el);
  let root: Root | null = null;
  await act(async () => {
    root = createRoot(el);
    root.render(<App />);
  });
  const text = el.textContent || '';
  await act(async () => {
    root?.unmount();
  });
  el.remove();
  return text;
}

const ROUTES: Array<[string, string]> = [
  ['/', 'پیشنهادهای شگفت‌انگیز'],
  ['/shop', 'فروشگاه موبایل هشتگ'],
  ['/search?q=آیفون', 'نتایج جستجو'],
  ['/offers', 'تخفیف‌ها و پیشنهادهای شگفت‌انگیز'],
  ['/bestsellers', 'پرفروش‌ترین محصولات'],
  ['/brands', 'برندهای موبایل هشتگ'],
  ['/categories', 'همه دسته‌بندی‌ها'],
  ['/category/mobile', 'گوشی موبایل'],
  ['/product/iphone-17-pro', 'افزودن به سبد خرید'],
  ['/cart', 'سبد خرید'],
  ['/checkout', 'سبد خرید خالی است'],
  ['/account', 'ورود / ثبت‌نام'],
  ['/wishlist', 'علاقه‌مندی‌ها'],
  ['/about', 'درباره موبایل هشتگ'],
  ['/contact', 'ارسال پیام'],
  ['/faq', 'سوالات متداول'],
  ['/blog', 'راهنمای خرید'],
  ['/blog/best-midrange-2026', 'میان‌رده'],
  ['/track-order', 'کد پیگیری'],
  ['/privacy', 'حریم خصوصی'],
  ['/terms', 'قوانین و مقررات'],
  ['/404', 'پیدا نشد'],
  ['/no-such-page', 'پیدا نشد'],
  ['/admin', 'ورود به پنل مدیریت'],
];

describe('storefront routes render', () => {
  for (const [path, needle] of ROUTES) {
    it(`${path} renders`, async () => {
      const text = await renderPath(path);
      expect(text).toContain(needle);
    }, 15000);
  }
});

const ADMIN_ROUTES: Array<[string, string]> = [
  ['/admin', 'نمای کلی فروشگاه'],
  ['/admin/products', 'مدیریت محصولات'],
  ['/admin/categories', 'دسته‌بندی‌ها'],
  ['/admin/brands', 'برندها'],
  ['/admin/orders', 'مدیریت سفارش‌ها'],
  ['/admin/banners', 'مدیریت بنرها'],
  ['/admin/homepage', 'مدیریت صفحه اصلی'],
  ['/admin/customers', 'مشتریان'],
  ['/admin/reviews', 'نظرات مشتریان'],
  ['/admin/articles', 'مدیریت مقالات'],
  ['/admin/appearance', 'تنظیمات قالب'],
  ['/admin/settings', 'تنظیمات فروشگاه'],
];

describe('admin routes render (authenticated)', () => {
  for (const [path, needle] of ADMIN_ROUTES) {
    it(`${path} renders`, async () => {
      const text = await renderAdmin(path);
      expect(text).toContain(needle);
    }, 15000);
  }
});
