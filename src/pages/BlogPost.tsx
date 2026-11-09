import { Link, useParams } from 'react-router-dom';
import { faDate } from '../services/format';
import { useDB } from '../services/db';
import { Breadcrumb } from '../components/ui';
import NotFound from './NotFound';

export default function BlogPost() {
  const { slug = '' } = useParams();
  const { db } = useDB();
  const a = db.articles.find((x) => x.slug === slug && x.published);
  if (!a) return <NotFound />;
  const others = db.articles.filter((x) => x.id !== a.id && x.published).slice(0, 3);
  return (
    <div className="container page">
      <Breadcrumb items={[{ label: 'مجله', to: '/blog' }, { label: a.title }]} />
      <div className="article-hero"><img src={a.image} alt={a.title} /></div>
      <div className="article-body">
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          {a.tags.map((t) => <span key={t} className="tag">{t}</span>)}
        </div>
        <h1 style={{ fontSize: 24, marginTop: 0 }}>{a.title}</h1>
        <div className="post-meta" style={{ marginBottom: 18 }}><span>{a.author}</span><span>{faDate(a.date)}</span></div>
        <div className="prose">{a.body}</div>
      </div>
      {others.length > 0 && (
        <section className="section">
          <div className="section-head"><div><h2>مطالب مرتبط</h2></div><Link className="more-link" to="/blog">همه مطالب</Link></div>
          <div className="post-grid">
            {others.map((o) => (
              <Link key={o.id} className="post-card" to={`/blog/${o.slug}`}>
                <img src={o.image} alt={o.title} loading="lazy" />
                <div className="pb"><h3>{o.title}</h3><p>{o.excerpt}</p>
                  <div className="post-meta"><span>{o.author}</span><span>{faDate(o.date)}</span></div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
