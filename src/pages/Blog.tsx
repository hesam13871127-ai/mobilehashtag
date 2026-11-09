import { Link } from 'react-router-dom';
import { faDate } from '../services/format';
import { useDB } from '../services/db';
import { Breadcrumb, Empty } from '../components/ui';

export default function Blog() {
  const { db } = useDB();
  const posts = db.articles.filter((a) => a.published).sort((a, b) => b.date.localeCompare(a.date));
  return (
    <div className="container page">
      <Breadcrumb items={[{ label: 'مجله موبایل هشتگ' }]} />
      <h1 style={{ fontSize: 24 }}>مجله موبایل هشتگ</h1>
      <p style={{ color: 'var(--muted)', fontSize: 14 }}>راهنمای خرید، بررسی تخصصی و آموزش</p>
      {posts.length === 0 ? <Empty title="مقاله‌ای منتشر نشده" text="به‌زودی مطالب جدید منتشر می‌شود." /> : (
        <div className="post-grid" style={{ marginTop: 18 }}>
          {posts.map((a) => (
            <Link key={a.id} className="post-card" to={`/blog/${a.slug}`}>
              <img src={a.image} alt={a.title} loading="lazy" />
              <div className="pb">
                <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                  {a.tags.map((t) => <span key={t} className="tag">{t}</span>)}
                </div>
                <h3>{a.title}</h3>
                <p>{a.excerpt}</p>
                <div className="post-meta"><span>{a.author}</span><span>{faDate(a.date)}</span></div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
