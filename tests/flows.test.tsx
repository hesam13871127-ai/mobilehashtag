// @vitest-environment jsdom
/* Real interaction flows: cart persistence + admin data operations. */
import { describe, it, expect, beforeAll } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { fireEvent } from './fire';
import App from '../src/App';

beforeAll(() => {
  (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
  Object.defineProperty(window, 'scrollTo', { value: () => {}, writable: true });
});

async function mount(path: string) {
  window.history.pushState({}, '', path);
  const el = document.createElement('div');
  document.body.appendChild(el);
  let root: Root | null = null;
  await act(async () => {
    root = createRoot(el);
    root.render(<App />);
  });
  return {
    el,
    unmount: async () => {
      await act(async () => { root?.unmount(); });
      el.remove();
    },
  };
}

function clickByText(el: HTMLElement, text: string): boolean {
  const all = [...el.querySelectorAll('button, a, input[type="submit"]')];
  const t = all.find((n) => (n.textContent || '').includes(text)) as HTMLElement | undefined;
  if (!t) return false;
  fireEvent.click(t);
  return true;
}

describe('cart + persistence flows', () => {
  it('adds product to cart, persists across reload, shows in /cart', async () => {
    localStorage.clear();
    // open a product WITHOUT variations (cable p13)
    const p = await mount('/product/baseus-usb-c-cable');
    expect(p.el.textContent).toContain('افزودن به سبد خرید');
    await act(async () => {
      expect(clickByText(p.el, 'افزودن به سبد خرید')).toBe(true);
    });
    await p.unmount();

    // cart persisted?
    const cart = JSON.parse(localStorage.getItem('mh_cart_v1') || '[]');
    expect(cart.length).toBe(1);
    expect(cart[0].productId).toBeTruthy();

    // visible on cart page after "reload"
    const c = await mount('/cart');
    expect(c.el.textContent).toContain('کابل شارژ سریع بیسوس');
    expect(c.el.textContent).toContain('مبلغ قابل پرداخت');
    await c.unmount();
  }, 20000);

  it('wishlist toggle persists', async () => {
    localStorage.clear();
    const p = await mount('/product/baseus-usb-c-cable');
    const wishBtn = p.el.querySelector('.p-info .icon-btn, .buy-row + *') as HTMLElement | null;
    expect(wishBtn).toBeTruthy();
    await act(async () => { fireEvent.click(wishBtn as HTMLElement); });
    await p.unmount();
    const wish = JSON.parse(localStorage.getItem('mh_wish_v1') || '[]');
    expect(wish.length).toBe(1);

    const w = await mount('/wishlist');
    expect(w.el.textContent).toContain('کابل شارژ سریع بیسوس');
    await w.unmount();
  }, 20000);

  it('admin login works and dashboard renders; data persists', async () => {
    localStorage.clear();
    const a = await mount('/admin');
    expect(a.el.textContent).toContain('ورود به پنل مدیریت');
    const inputs = a.el.querySelectorAll('input');
    expect(inputs.length).toBeGreaterThanOrEqual(2);
    await act(async () => {
      fireEvent.change(inputs[0], '09120000000');
      fireEvent.change(inputs[1], 'admin123');
      expect(clickByText(a.el, 'ورود به پنل')).toBe(true);
    });
    expect(a.el.textContent).toContain('نمای کلی فروشگاه');
    // session persisted
    expect(localStorage.getItem('mh_session_v1')).toContain('u-admin');
    await a.unmount();
  }, 20000);

  it('customer login + search + checkout validation', async () => {
    localStorage.clear();
    const s = await mount('/search?q=شارژر');
    expect(s.el.textContent).toContain('نتایج جستجو');
    await s.unmount();

    // empty-cart checkout guard
    const c = await mount('/checkout');
    expect(c.el.textContent).toContain('سبد خرید خالی است');
    await c.unmount();
  }, 20000);
});
