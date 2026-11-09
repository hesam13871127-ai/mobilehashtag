import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDB, productsInCategory } from '../services/db';
import { finalPrice } from '../models/types';
import { faNum } from '../services/format';
import ProductCard from '../components/ProductCard';
import { Breadcrumb, Empty, Pagination } from '../components/ui';
import NotFound from './NotFound';

const PER_PAGE = 12;

export default function Category() {
  const { slug = '' } = useParams();
  const { db } = useDB();
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);

  const cat = db.categories.find((c) => c.slug === slug && c.visible);
  const items = useMemo(() => {
    let list = productsInCategory(db, slug);
    const s = [...list];
    if (sort === 'cheap') s.sort((a, b) => finalPrice(a) - finalPrice(b));
    else if (sort === 'expensive') s.sort((a, b) => finalPrice(b) - finalPrice(a));
    else if (sort === 'popular') s.sort((a, b) => b.soldCount - a.soldCount);
    else s.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return s;
  }, [db, slug, sort]);

  if (!cat) return <NotFound />;

  const parent = cat.parentId ? db.categories.find((c) => c.id === cat.parentId) : null;
  const siblings = cat.parentId
    ? db.categories.filter((c) => c.parentId === cat.parentId && c.visible)
    : db.categories.filter((c) => c.parentId === cat.id && c.visible);
  const catBanner = db.banners.find((b) => b.placement === 'category' && b.enabled);
  const pages = Math.max(1, Math.ceil(items.length / PER_PAGE));
  const cur = Math.min(page, pages);
  const view = items.slice((cur - 1) * PER_PAGE, cur * PER_PAGE);

  return (
    <div className="container page">
      <Breadcrumb items={[
        { label: 'دسته‌بندی‌ها', to: '/categories' },
        ...(parent ? [{ label: parent.name, to: `/category/${parent.slug}` }] : []),
        { label: cat.name },
      ]} />
      <div className="cat-head">
        <img src={cat.image} alt={cat.name} />
        <div className="cb">
          <h1>{cat.name}</h1>
          <p>{cat.description}</p>
          <p style={{ marginTop: 8, fontWeight: 700, color: 'var(--gold-dark)' }}>{faNum(items.length)} کالا</p>
        </div>
      </div>

      {siblings.length > 0 && (
        <div className="sub-row">
          {siblings.map((s) => (
            <Link key={s.id} to={`/category/${s.slug}`} className={s.slug === slug ? 'on' : ''}>{s.name}</Link>
          ))}
        </div>
      )}

      {catBanner && (
        <div className="shop-banner" style={{ background: `linear-gradient(120deg, ${catBanner.themeFrom}, ${catBanner.themeTo})` }}>
          {catBanner.art && <img src={catBanner.art} alt="" />}
          <div>
            <h3 style={{ margin: '0 0 4px' }}>{catBanner.title}</h3>
            <p style={{ margin: '0 0 10px', fontSize: 13.5, opacity: 0.9 }}>{catBanner.subtitle}</p>
            <Link className="btn btn-gold btn-sm" to={catBanner.url}>{catBanner.buttonText}</Link>
          </div>
        </div>
      )}

      <div className="toolbar">
        <span className="count">{faNum(items.length)} کالا</span>
        <select className="select" value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} aria-label="مرتب‌سازی">
          <option value="newest">جدیدترین</option>
          <option value="cheap">ارزان‌ترین</option>
          <option value="expensive">گران‌ترین</option>
          <option value="popular">پرفروش‌ترین</option>
        </select>
      </div>

      {view.length === 0 ? (
        <Empty title="در این دسته کالایی ثبت نشده" text="به‌زودی محصولات جدید اضافه می‌شود." action={<Link className="btn btn-gold" to="/shop">مشاهده فروشگاه</Link>} />
      ) : (
        <>
          <div className="grid-products" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
            {view.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
          <Pagination page={cur} pages={pages} onChange={(x) => { setPage(x); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
        </>
      )}
    </div>
  );
}
