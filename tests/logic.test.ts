import { describe, it, expect } from 'vitest';
import { finalPrice, hasDiscount, discountPercent, stockStatus } from '../src/models/types';
import { faNum, toman, timeLeft, slugifyFa, ORDER_STATUS_FA } from '../src/services/format';
import { seedDatabase } from '../src/data/seed';

const db = seedDatabase();

describe('pricing helpers', () => {
  const p: Parameters<typeof finalPrice>[0] = {
    id: 'x', name: 't', slug: 't', sku: 's', brandId: 'b', categoryIds: [],
    shortDesc: '', fullDesc: '', regularPrice: 1000000, salePrice: 800000,
    stock: 5, image: '', gallery: [], attributes: [], variations: [], specs: [],
    rating: 5, ratingCount: 1, soldCount: 0, status: 'published', createdAt: '',
  };
  it('finalPrice prefers sale price + variant delta', () => {
    expect(finalPrice(p)).toBe(800000);
    expect(finalPrice(p, 50000)).toBe(850000);
    expect(finalPrice({ ...p, salePrice: undefined })).toBe(1000000);
  });
  it('detects discounts and percent', () => {
    expect(hasDiscount(p)).toBe(true);
    expect(discountPercent(p)).toBe(20);
    expect(hasDiscount({ ...p, salePrice: 1000000 })).toBe(false);
  });
  it('stock status', () => {
    expect(stockStatus(p)).toBe('instock');
    expect(stockStatus({ ...p, stock: 0 })).toBe('outofstock');
  });
});

describe('format helpers', () => {
  it('persian digits', () => expect(faNum(1234567)).toContain('۱'));
  it('toman suffix', () => expect(toman(5000)).toContain('تومان'));
  it('timeLeft expired for past dates', () => {
    expect(timeLeft('2000-01-01').expired).toBe(true);
    const future = new Date(Date.now() + 90000).toISOString();
    const t = timeLeft(future);
    expect(t.expired).toBe(false);
    expect(t.m + t.s).toBeGreaterThan(0);
  });
  it('slugify keeps persian', () => expect(slugifyFa('گوشی اپل')).toBe('گوشی-اپل'));
  it('order statuses translated', () => {
    expect(ORDER_STATUS_FA.pending).toBeTruthy();
    expect(Object.keys(ORDER_STATUS_FA)).toHaveLength(5);
  });
});

describe('seed catalog integrity (acceptance minimums)', () => {
  it('has ≥24 products, ≥6 phones, ≥18 accessories', () => {
    expect(db.products.length).toBeGreaterThanOrEqual(24);
    const phones = db.products.filter((p) => p.categoryIds.includes('m-mobile'));
    const acc = db.products.filter((p) => !p.categoryIds.includes('m-mobile'));
    expect(phones.length).toBeGreaterThanOrEqual(6);
    expect(acc.length).toBeGreaterThanOrEqual(18);
  });
  it('has 14 main categories with subcategories', () => {
    const mains = db.categories.filter((c) => !c.parentId);
    expect(mains.length).toBe(14);
    for (const m of mains) {
      expect(db.categories.filter((c) => c.parentId === m.id).length).toBeGreaterThan(0);
    }
  });
  it('unique slugs for products and categories', () => {
    const ps = db.products.map((p) => p.slug);
    expect(new Set(ps).size).toBe(ps.length);
    const cs = db.categories.map((c) => c.slug);
    expect(new Set(cs).size).toBe(cs.length);
  });
  it('every product has brand, category, image, price', () => {
    for (const p of db.products) {
      expect(db.brands.find((b) => b.id === p.brandId), p.slug).toBeTruthy();
      expect(p.categoryIds.length, p.slug).toBeGreaterThan(0);
      expect(p.image, p.slug).toMatch(/^\/images\//);
      expect(p.regularPrice, p.slug).toBeGreaterThan(0);
    }
  });
  it('heroes ≥3, promos ≥2, brands ≥8, sections =14', () => {
    expect(db.banners.filter((b) => b.placement === 'hero' && b.enabled).length).toBeGreaterThanOrEqual(3);
    expect(db.banners.filter((b) => b.placement === 'promo' && b.enabled).length).toBeGreaterThanOrEqual(2);
    expect(db.brands.filter((b) => b.visible).length).toBeGreaterThanOrEqual(8);
    expect(db.sections.length).toBe(14);
  });
  it('seeded admin + demo users exist', () => {
    expect(db.users.find((u) => u.role === 'admin')).toBeTruthy();
    expect(db.users.find((u) => u.phone === '09121111111')).toBeTruthy();
  });
});
