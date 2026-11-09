import { Link } from 'react-router-dom';
import { useDB } from '../services/db';
import { faNum } from '../services/format';
import { Breadcrumb } from '../components/ui';

export default function Brands() {
  const { db } = useDB();
  const brands = db.brands.filter((b) => b.visible);
  const countOf = (id: string) => db.products.filter((p) => p.status === 'published' && p.brandId === id).length;
  return (
    <div className="container page">
      <Breadcrumb items={[{ label: 'برندها' }]} />
      <h1 style={{ fontSize: 24 }}>برندهای موبایل هشتگ</h1>
      <p style={{ color: 'var(--muted)', fontSize: 14 }}>همه کالاها با ضمانت اصالت و گارانتی معتبر عرضه می‌شوند</p>
      <div className="brand-row" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', marginTop: 18 }}>
        {brands.map((b) => (
          <Link key={b.id} className="brand-card" to={`/shop?brand=${b.id}`} style={{ flexDirection: 'column', gap: 8, padding: 22 }}>
            <img src={b.logo} alt={b.name} style={{ height: 60 }} />
            <b style={{ fontSize: 15 }}>{b.name}</b>
            <small style={{ color: 'var(--muted)', fontSize: 12.5 }}>{faNum(countOf(b.id))} کالا</small>
          </Link>
        ))}
      </div>
    </div>
  );
}
