import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X } from 'lucide-react';
import { useDB, subIds } from '../services/db';
import { finalPrice, hasDiscount } from '../models/types';
import { faNum } from '../services/format';
import ProductCard from '../components/ProductCard';
import { Breadcrumb, Empty, Pagination } from '../components/ui';

const PER_PAGE = 12;
type Sort = 'newest' | 'cheap' | 'expensive' | 'popular' | 'rated';

export default function Shop({ mode }: { mode?: 'offers' | 'bestsellers' | 'brand' | 'search' }) {
  const { db } = useDB();
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const initialBrand = params.get('brand') || '';
  const initialSort = (params.get('sort') as Sort) || 'newest';
  const q = params.get('q') || '';

  const [selCats, setSelCats] = useState<string[]>([]);
  const [selBrands, setSelBrands] = useState<string[]>(initialBrand ? [initialBrand] : []);
  const [onlyAvail, setOnlyAvail] = useState(false);
  const [onlyOff, setOnlyOff] = useState(mode === 'offers');
  const [minP, setMinP] = useState('');
  const [maxP, setMaxP] = useState('');
  const [sort, setSort] = useState<Sort>(initialSort);
  const [page, setPage] = useState(1);

  const mains = db.categories.filter((c) => !c.parentId && c.visible).sort((a, b) => a.order - b.order);
  const brands = db.brands.filter((b) => b.visible);

  const filtered = useMemo(() => {
    let list = db.products.filter((p) => p.status === 'published');
    if (mode === 'offers') list = list.filter(hasDiscount);
    if (mode === 'bestsellers') list = [...list].sort((a, b) => b.soldCount - a.soldCount);
    if (q) list = list.filter((p) => p.name.includes(q) || p.shortDesc.includes(q));
    if (selCats.length) {
      const ids = new Set(selCats.flatMap((id) => subIds(db, id)));
      list = list.filter((p) => p.categoryIds.some((c) => ids.has(c)));
    }
    if (selBrands.length) list = list.filter((p) => selBrands.includes(p.brandId));
    if (onlyAvail) list = list.filter((p) => p.stock > 0);
    if (onlyOff) list = list.filter(hasDiscount);
    const min = Number(minP.replace(/[^0-9]/g, '')) || 0;
    const max = Number(maxP.replace(/[^0-9]/g, '')) || Infinity;
    list = list.filter((p) => finalPrice(p) >= min && finalPrice(p) <= max);
    const sorted = [...list];
    switch (sort) {
      case 'cheap': sorted.sort((a, b) => finalPrice(a) - finalPrice(b)); break;
      case 'expensive': sorted.sort((a, b) => finalPrice(b) - finalPrice(a)); break;
      case 'popular': sorted.sort((a, b) => b.soldCount - a.soldCount); break;
      case 'rated': sorted.sort((a, b) => b.rating - a.rating); break;
      default: sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    return sorted;
  }, [db, mode, q, selCats, selBrands, onlyAvail, onlyOff, minP, maxP, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const cur = Math.min(page, pages);
  const items = filtered.slice((cur - 1) * PER_PAGE, cur * PER_PAGE);

  const toggle = (arr: string[], v: string, set: (x: string[]) => void) => {
    setPage(1);
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  };
  const clearAll = () => {
    setSelCats([]); setSelBrands([]); setOnlyAvail(false);
    setOnlyOff(mode === 'offers'); setMinP(''); setMaxP(''); setSort('newest'); setPage(1);
    setParams({});
  };

  const title = mode === 'offers' ? 'تخفیف‌ها و پیشنهادهای شگفت‌انگیز' : mode === 'bestsellers' ? 'پرفروش‌ترین محصولات' : q ? `نتایج جستجو برای «${q}»` : 'فروشگاه موبایل هشتگ';
  const shopBanner = db.banners.find((b) => b.placement === 'shop' && b.enabled);
  const activeCount = selCats.length + selBrands.length + (onlyAvail ? 1 : 0) + (onlyOff && mode !== 'offers' ? 1 : 0) + (minP || maxP ? 1 : 0);

  return (
    <div className="container page">
      <Breadcrumb items={[{ label: title }]} />
      <h1 style={{ fontSize: 24, marginBottom: 4 }}>{title}</h1>
      <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 0 }}>{faNum(filtered.length)} کالا یافت شد</p>

      {!q && shopBanner && (
        <div className="shop-banner" style={{ background: `linear-gradient(120deg, ${shopBanner.themeFrom}, ${shopBanner.themeTo})` }}>
          {shopBanner.art && <img src={shopBanner.art} alt="" />}
          <div>
            <h3 style={{ margin: '0 0 4px' }}>{shopBanner.title}</h3>
            <p style={{ margin: '0 0 10px', fontSize: 13.5, opacity: 0.9 }}>{shopBanner.subtitle}</p>
            <Link className="btn btn-gold btn-sm" to={shopBanner.url}>{shopBanner.buttonText}</Link>
          </div>
        </div>
      )}

      <button className="btn btn-outline filters-toggle" style={{ marginBottom: 14 }} onClick={() => setFiltersOpen(true)}>
        <SlidersHorizontal size={17} /> فیلترها {activeCount > 0 && `(${faNum(activeCount)})`}
      </button>

      <div className="shop-layout">
        <aside className={`filters${filtersOpen ? ' open' : ''}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <b>فیلترها</b>
            <div style={{ display: 'flex', gap: 8 }}>
              {activeCount > 0 && <button className="btn btn-ghost btn-sm" onClick={clearAll}>حذف همه</button>}
              <button className="btn btn-ghost btn-sm filters-toggle" onClick={() => setFiltersOpen(false)}><X size={16} /></button>
            </div>
          </div>
          <div className="filter-group">
            <h4>دسته‌بندی</h4>
            {mains.map((c) => (
              <label key={c.id}>
                <input type="checkbox" checked={selCats.includes(c.id)} onChange={() => toggle(selCats, c.id, setSelCats)} />
                {c.name}
              </label>
            ))}
          </div>
          <div className="filter-group">
            <h4>برند</h4>
            {brands.map((b) => (
              <label key={b.id}>
                <input type="checkbox" checked={selBrands.includes(b.id)} onChange={() => toggle(selBrands, b.id, setSelBrands)} />
                {b.name}
              </label>
            ))}
          </div>
          <div className="filter-group">
            <h4>محدوده قیمت (تومان)</h4>
            <div className="price-range">
              <input className="input" placeholder="از" value={minP} onChange={(e) => { setMinP(e.target.value); setPage(1); }} inputMode="numeric" />
              <span>تا</span>
              <input className="input" placeholder="تا" value={maxP} onChange={(e) => { setMaxP(e.target.value); setPage(1); }} inputMode="numeric" />
            </div>
          </div>
          <div className="filter-group">
            <h4>وضعیت</h4>
            <label><input type="checkbox" checked={onlyAvail} onChange={(e) => { setOnlyAvail(e.target.checked); setPage(1); }} /> فقط کالاهای موجود</label>
            <label><input type="checkbox" checked={onlyOff} onChange={(e) => { setOnlyOff(e.target.checked); setPage(1); }} /> فقط تخفیف‌دارها</label>
          </div>
          <button className="btn btn-dark btn-block filters-toggle" onClick={() => setFiltersOpen(false)}>مشاهده {faNum(filtered.length)} کالا</button>
        </aside>

        <div>
          {(activeCount > 0) && (
            <div className="chips">
              {selCats.map((id) => {
                const c = db.categories.find((x) => x.id === id);
                return c ? <span key={id} className="chip">{c.name}<button onClick={() => toggle(selCats, id, setSelCats)} aria-label="حذف"><X size={13} /></button></span> : null;
              })}
              {selBrands.map((id) => {
                const b = db.brands.find((x) => x.id === id);
                return b ? <span key={id} className="chip">{b.name}<button onClick={() => toggle(selBrands, id, setSelBrands)} aria-label="حذف"><X size={13} /></button></span> : null;
              })}
              {(minP || maxP) && <span className="chip">قیمت<button onClick={() => { setMinP(''); setMaxP(''); }} aria-label="حذف"><X size={13} /></button></span>}
            </div>
          )}
          <div className="toolbar">
            <span className="count">{faNum(filtered.length)} کالا</span>
            <select className="select" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="مرتب‌سازی">
              <option value="newest">جدیدترین</option>
              <option value="cheap">ارزان‌ترین</option>
              <option value="expensive">گران‌ترین</option>
              <option value="popular">پرفروش‌ترین</option>
              <option value="rated">بالاترین امتیاز</option>
            </select>
          </div>
          {items.length === 0 ? (
            <Empty title="کالایی یافت نشد" text="فیلترها را تغییر دهید یا عبارت دیگری جستجو کنید." action={<button className="btn btn-gold" onClick={clearAll}>حذف فیلترها</button>} />
          ) : (
            <>
              <div className="grid-products" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                {items.map((p) => <ProductCard key={p.id} p={p} />)}
              </div>
              <Pagination page={cur} pages={pages} onChange={(x) => { setPage(x); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
