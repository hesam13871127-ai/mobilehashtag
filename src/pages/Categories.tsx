import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useDB } from '../services/db';
import { faNum } from '../services/format';
import { Breadcrumb } from '../components/ui';

export default function Categories() {
  const { db } = useDB();
  const mains = db.categories.filter((c) => !c.parentId && c.visible).sort((a, b) => a.order - b.order);
  const pub = db.products.filter((p) => p.status === 'published');
  const countIn = (id: string) => {
    const ids = new Set([id, ...db.categories.filter((c) => c.parentId === id).map((c) => c.id)]);
    return pub.filter((p) => p.categoryIds.some((c) => ids.has(c))).length;
  };
  return (
    <div className="container page">
      <Breadcrumb items={[{ label: 'دسته‌بندی‌ها' }]} />
      <h1 style={{ fontSize: 24 }}>همه دسته‌بندی‌ها</h1>
      <p style={{ color: 'var(--muted)', fontSize: 14 }}>{faNum(mains.length)} دسته‌بندی اصلی</p>
      <div className="grid-cats" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
        {mains.map((c) => (
          <Link key={c.id} className="cat-card" to={`/category/${c.slug}`}>
            <img src={c.image} alt={c.name} loading="lazy" />
            <span>{c.name}<small>{faNum(countIn(c.id))} کالا</small></span>
          </Link>
        ))}
      </div>
      {mains.map((m) => {
        const subs = db.categories.filter((c) => c.parentId === m.id && c.visible).sort((a, b) => a.order - b.order);
        if (!subs.length) return null;
        return (
          <section key={m.id} className="section">
            <div className="section-head">
              <div><h2>{m.name}</h2></div>
              <Link className="more-link" to={`/category/${m.slug}`}>مشاهده دسته <ChevronLeft size={16} /></Link>
            </div>
            <div className="sub-row">
              {subs.map((s) => (
                <Link key={s.id} to={`/category/${s.slug}`}>{s.name} <span style={{ color: '#aaa' }}>({faNum(countIn(s.id))})</span></Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
