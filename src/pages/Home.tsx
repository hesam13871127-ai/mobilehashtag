import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Truck, Headset, BadgeCheck, LayoutGrid, ChevronLeft } from 'lucide-react';
import { useDB } from '../services/db';
import { useToast } from '../services/toast';
import { faNum, faDate } from '../services/format';
import HeroSlider from '../components/HeroSlider';
import ProductCard from '../components/ProductCard';
import { SectionHead } from '../components/ui';

function useSections() {
  const { db } = useDB();
  return useMemo(
    () => db.sections.filter((s) => s.enabled).sort((a, b) => a.order - b.order),
    [db.sections],
  );
}

export default function Home() {
  const { db } = useDB();
  const sections = useSections();
  const { toast } = useToast();
  const [email, setEmail] = useState('');

  const pub = useMemo(() => db.products.filter((p) => p.status === 'published'), [db.products]);
  const byIds = (ids: string[]) => pub.filter((p) => p.categoryIds.some((c) => ids.includes(c)));
  const mobileIds = useMemo(() => {
    const m = db.categories.find((c) => c.id === 'm-mobile');
    if (!m) return ['m-mobile'];
    return ['m-mobile', ...db.categories.filter((c) => c.parentId === 'm-mobile').map((c) => c.id)];
  }, [db.categories]);

  const featured = pub.filter((p) => p.featured).slice(0, 8);
  const offers = pub.filter((p) => p.salePrice && p.salePrice < p.regularPrice).slice(0, 8);
  const smartphones = byIds(mobileIds).slice(0, 8);
  const accessories = pub.filter((p) => !p.categoryIds.some((c) => mobileIds.includes(c))).slice(0, 8);
  const audio = byIds(['m-audio', ...db.categories.filter((c) => c.parentId === 'm-audio').map((c) => c.id)]).slice(0, 4);
  const best = [...pub].sort((a, b) => b.soldCount - a.soldCount).slice(0, 8);
  const fresh = [...pub].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8);
  const mains = db.categories.filter((c) => !c.parentId && c.visible).sort((a, b) => a.order - b.order);
  const heroes = db.banners.filter((b) => b.placement === 'hero');
  const promos = db.banners.filter((b) => b.placement === 'promo' && b.enabled).sort((a, b) => a.order - b.order).slice(0, 2);
  const brands = db.brands.filter((b) => b.visible);
  const posts = db.articles.filter((a) => a.published).slice(0, 3);

  const countIn = (id: string) => {
    const ids = new Set([id, ...db.categories.filter((c) => c.parentId === id).map((c) => c.id)]);
    return pub.filter((p) => p.categoryIds.some((c) => ids.has(c))).length;
  };

  const sec = (key: string) => sections.find((s) => s.key === key);

  const renderSection = (key: string) => {
    const meta = sec(key);
    if (!meta) return null;
    const head = (moreTo?: string) => <SectionHead title={meta.title} subtitle={meta.subtitle} moreTo={moreTo} />;
    switch (key) {
      case 'hero_slider': return <HeroSlider banners={heroes} />;
      case 'categories':
        return <section className="section">{head('/categories')}<div className="grid-cats">
          {mains.slice(0, 14).map((c) => (
            <Link key={c.id} className="cat-card" to={`/category/${c.slug}`}>
              <img src={c.image} alt={c.name} loading="lazy" />
              <span>{c.name}<small>{faNum(countIn(c.id))} کالا</small></span>
            </Link>
          ))}
        </div></section>;
      case 'featured': return featured.length ? <section className="section">{head('/shop')}<div className="grid-products">{featured.map((p) => <ProductCard key={p.id} p={p} />)}</div></section> : null;
      case 'special_offers': return offers.length ? <section className="section">{head('/offers')}<div className="grid-products">{offers.slice(0, 8).map((p) => <ProductCard key={p.id} p={p} />)}</div></section> : null;
      case 'smartphones': return <section className="section">{head('/category/mobile')}<div className="grid-products">{smartphones.map((p) => <ProductCard key={p.id} p={p} />)}</div></section>;
      case 'accessories': return <section className="section">{head('/categories')}<div className="grid-products">{accessories.map((p) => <ProductCard key={p.id} p={p} />)}</div></section>;
      case 'headphones': return audio.length ? <section className="section">{head('/category/audio')}<div className="grid-products">{audio.map((p) => <ProductCard key={p.id} p={p} />)}</div></section> : null;
      case 'bestsellers': return <section className="section">{head('/bestsellers')}<div className="grid-products">{best.slice(0, 8).map((p) => <ProductCard key={p.id} p={p} />)}</div></section>;
      case 'new_arrivals': return <section className="section">{head('/shop?sort=newest')}<div className="grid-products">{fresh.map((p) => <ProductCard key={p.id} p={p} />)}</div></section>;
      case 'promotional_banners':
        return promos.length ? <section className="section">{head()}<div className="promo-grid">
          {promos.map((b) => (
            <div key={b.id} className="promo-card" style={{ background: `linear-gradient(120deg, ${b.themeFrom}, ${b.themeTo})`, color: b.themeFrom.startsWith('#F') || b.themeFrom.startsWith('#f') ? '#222' : '#fff' }}>
              <div><h3>{b.title}</h3><p>{b.subtitle}</p><Link className="btn btn-dark btn-sm" to={b.url}>{b.buttonText}</Link></div>
              {b.art && <img src={b.art} alt={b.title} loading="lazy" />}
            </div>
          ))}
        </div></section> : null;
      case 'brands':
        return <section className="section">{head('/brands')}<div className="brand-row">
          {brands.slice(0, 10).map((b) => (
            <Link key={b.id} className="brand-card" to={`/shop?brand=${b.slug}`} title={b.name}>
              <img src={b.logo} alt={b.name} loading="lazy" />
            </Link>
          ))}
        </div></section>;
      case 'why_us': {
        const items = [
          { icon: <ShieldCheck size={26} />, t: 'ضمانت اصالت کالا', d: '۱۰۰٪ اورجینال با گارانتی' },
          { icon: <Truck size={26} />, t: 'ارسال سریع', d: 'به سراسر کشور' },
          { icon: <Headset size={26} />, t: 'پشتیبانی مشتریان', d: 'پاسخگویی سریع' },
          { icon: <BadgeCheck size={26} />, t: 'خرید مطمئن', d: 'پرداخت امن' },
          { icon: <LayoutGrid size={26} />, t: 'تنوع محصولات', d: 'هزاران کالای متنوع' },
        ];
        return <section className="section">{head()}<div className="why-grid">{items.map((w, i) => (
          <div key={i} className="why-item"><div className="ic">{w.icon}</div><h4>{w.t}</h4><p>{w.d}</p></div>
        ))}</div></section>;
      }
      case 'blog':
        return posts.length ? <section className="section">{head('/blog')}<div className="post-grid">
          {posts.map((a) => (
            <Link key={a.id} className="post-card" to={`/blog/${a.slug}`}>
              <img src={a.image} alt={a.title} loading="lazy" />
              <div className="pb"><h3>{a.title}</h3><p>{a.excerpt}</p>
                <div className="post-meta"><span>{a.author}</span><span>{faDate(a.date)}</span></div>
              </div>
            </Link>
          ))}
        </div></section> : null;
      case 'newsletter':
        return <section className="section"><div className="newsletter-sec">
          <div><h2>{meta.title}</h2><p>{meta.subtitle || 'از تخفیف‌ها و محصولات جدید زودتر از همه باخبر شوید.'}</p></div>
          <form className="newsletter-box" onSubmit={(e) => {
            e.preventDefault();
            if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) { toast('لطفاً یک ایمیل معتبر وارد کنید.', 'error'); return; }
            setEmail(''); toast('عضویت شما در خبرنامه ثبت شد.');
          }}>
            <input className="input" type="email" placeholder="ایمیل شما" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="ایمیل" />
            <button className="btn btn-gold" type="submit">عضویت</button>
          </form>
        </div></section>;
      default: return null;
    }
  };

  return (
    <div className="container" style={{ paddingBottom: 10 }}>
      {sections.map((s) => (
        <React.Fragment key={s.id}>{renderSection(s.key)}</React.Fragment>
      ))}
      {sections.length === 0 && (
        <div className="empty" style={{ margin: '40px 0' }}>
          <h3>بخشی برای نمایش وجود ندارد</h3>
          <p>از پنل مدیریت، بخش‌های صفحه اصلی را فعال کنید.</p>
          <Link className="btn btn-gold" to="/shop">مشاهده فروشگاه <ChevronLeft size={16} /></Link>
        </div>
      )}
    </div>
  );
}
