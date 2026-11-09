import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Heart, ShoppingCart, ShieldCheck, Truck, RotateCcw, BadgeCheck, Check, X } from 'lucide-react';
import { useDB, useProduct } from '../services/db';
import { useShop } from '../services/shop';
import { useToast } from '../services/toast';
import { discountPercent, finalPrice, hasDiscount } from '../models/types';
import { faNum, faDate, toman } from '../services/format';
import ProductCard from '../components/ProductCard';
import { Breadcrumb, Countdown, QtyInput, SectionHead, Stars } from '../components/ui';
import NotFound from './NotFound';

export default function Product() {
  const { slug = '' } = useParams();
  const { db, save } = useDB();
  const { addToCart, wishlist, toggleWishlist, user } = useShop();
  const { toast } = useToast();
  const p = useProduct(slug);

  const [img, setImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<'desc' | 'specs' | 'reviews'>('desc');
  const [sel, setSel] = useState<Record<string, string>>({});
  const [rName, setRName] = useState('');
  const [rText, setRText] = useState('');
  const [rRate, setRRate] = useState(5);

  const gallery = useMemo(() => (p ? [p.image, ...p.gallery.filter((g) => g !== p.image)] : []), [p]);
  const delta = useMemo(() => {
    if (!p) return 0;
    return p.variations.reduce((s, v) => {
      const o = v.options.find((x) => x.id === sel[v.id]);
      return s + (o ? o.priceDelta : 0);
    }, 0);
  }, [p, sel]);
  const variantLabel = useMemo(() => {
    if (!p) return '';
    return p.variations.map((v) => v.options.find((x) => x.id === sel[v.id])?.label).filter(Boolean).join(' | ');
  }, [p, sel]);

  if (!p || p.status !== 'published') return <NotFound />;

  const brand = db.brands.find((b) => b.id === p.brandId);
  const cat = db.categories.find((c) => p.categoryIds.includes(c.id));
  const reviews = db.reviews.filter((r) => r.productId === p.id && r.status === 'approved');
  const related = db.products.filter((x) => x.id !== p.id && x.status === 'published' && x.categoryIds.some((c) => p.categoryIds.includes(c))).slice(0, 4);
  const wished = wishlist.includes(p.id);
  const out = p.stock <= 0;

  const buy = () => {
    if (out) { toast('این کالا ناموجود است.', 'error'); return; }
    for (const v of p.variations) {
      if (!sel[v.id]) { toast(`لطفاً «${v.name}» را انتخاب کنید.`, 'error'); return; }
    }
    addToCart(p.id, Object.values(sel).join('|'), variantLabel, qty);
    toast(`${p.name} به سبد اضافه شد.`);
  };

  const submitReview = (e: React.FormEvent) => {
    e.preventDefault();
    const name = (user?.name || rName).trim();
    if (!name || rText.trim().length < 4) { toast('نام و متن نظر را کامل وارد کنید.', 'error'); return; }
    save('reviews', {
      productId: p.id, author: name, rating: rRate, text: rText.trim(),
      date: new Date().toISOString(), status: 'pending',
    });
    setRText(''); setRName('');
    toast('نظر شما ثبت شد و پس از تأیید نمایش داده می‌شود.');
  };

  return (
    <div className="container page">
      <Breadcrumb items={[
        { label: 'فروشگاه', to: '/shop' },
        ...(cat ? [{ label: cat.name, to: `/category/${cat.slug}` }] : []),
        { label: p.name },
      ]} />
      <div className="p-layout">
        <div>
          <div className="gallery-main">
            <img src={gallery[img] || p.image} alt={p.name} />
            <div className="pcard-badges">
              {hasDiscount(p) && <span className="badge badge-off">{faNum(discountPercent(p))}٪ تخفیف</span>}
              {p.isNew && <span className="badge badge-new">جدید</span>}
            </div>
          </div>
          {gallery.length > 1 && (
            <div className="gallery-thumbs">
              {gallery.map((g, i) => (
                <button key={i} className={i === img ? 'on' : ''} onClick={() => setImg(i)} aria-label={`تصویر ${faNum(i + 1)}`}>
                  <img src={g} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-info">
          {brand && <Link className="p-brand" to={`/shop?brand=${brand.slug}`}>{brand.name}</Link>}
          <h1>{p.name}</h1>
          <div className="p-meta">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Stars rating={p.rating} /> {faNum(p.rating)} ({faNum(p.ratingCount)} نظر)</span>
            <span>کد کالا: {p.sku}</span>
            <span>{faNum(p.soldCount)} فروش</span>
          </div>
          <div className="p-short">{p.shortDesc}</div>

          {p.variations.map((v) => (
            <div className="var-group" key={v.id}>
              <b>{v.name}:</b>
              <div className="var-opts">
                {v.options.map((o) => (
                  <button key={o.id} className={`var-opt${sel[v.id] === o.id ? ' active' : ''}`} onClick={() => setSel({ ...sel, [v.id]: o.id })}>
                    {o.label}
                    {o.priceDelta > 0 && <small>+ {toman(o.priceDelta)}</small>}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="price-box">
            {hasDiscount(p) && <div className="old">{toman(p.regularPrice)}</div>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span className="new">{toman(finalPrice(p, delta))}</span>
              {hasDiscount(p) && <span className="badge badge-off save">{faNum(discountPercent(p))}٪</span>}
            </div>
            <div style={{ marginTop: 8 }}>
              {out ? <span className="stock-out"><X size={15} /> ناموجود</span>
                : <span className="stock-ok"><Check size={15} /> موجود در انبار {p.stock < 10 && `(تنها ${faNum(p.stock)} عدد)`}</span>}
            </div>
            {p.offerEndsAt && <div style={{ marginTop: 10 }}><Countdown endsAt={p.offerEndsAt} /></div>}
          </div>

          <div className="buy-row">
            <QtyInput value={qty} onChange={(v) => setQty(Math.max(1, Math.min(p.stock || 99, v)))} />
            <button className="btn btn-gold" onClick={buy} disabled={out}>
              <ShoppingCart size={18} /> افزودن به سبد خرید
            </button>
            <button className={`icon-btn${wished ? '' : ''}`} style={{ width: 50, height: 50, color: wished ? 'var(--error)' : undefined, borderColor: wished ? 'var(--error)' : undefined }} onClick={() => toggleWishlist(p.id)} aria-label="علاقه‌مندی">
              <Heart size={20} fill={wished ? 'currentColor' : 'none'} />
            </button>
          </div>

          <div className="p-services">
            <div><ShieldCheck size={16} /> ضمانت اصالت کالا</div>
            <div><Truck size={16} /> ارسال سریع سراسری</div>
            <div><RotateCcw size={16} /> ۷ روز مهلت بازگشت</div>
            <div><BadgeCheck size={16} /> گارانتی معتبر شرکتی</div>
          </div>
        </div>
      </div>

      <div className="tabs">
        <div className="tab-heads">
          <button className={tab === 'desc' ? 'on' : ''} onClick={() => setTab('desc')}>توضیحات</button>
          <button className={tab === 'specs' ? 'on' : ''} onClick={() => setTab('specs')}>مشخصات فنی</button>
          <button className={tab === 'reviews' ? 'on' : ''} onClick={() => setTab('reviews')}>نظرات ({faNum(reviews.length)})</button>
        </div>
        {tab === 'desc' && (
          <div className="card" style={{ padding: 24 }}>
            <div className="prose">{p.fullDesc}</div>
            {p.attributes.length > 0 && (
              <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {p.attributes.map((a, i) => <span key={i} className="badge badge-gray">{a.name}: {a.value}</span>)}
              </div>
            )}
            {(p.weight || p.dimensions) && (
              <p style={{ color: 'var(--muted)', fontSize: 13.5, marginBottom: 0 }}>
                {p.weight && `وزن: ${p.weight} `} {p.dimensions && `| ابعاد: ${p.dimensions}`}
              </p>
            )}
          </div>
        )}
        {tab === 'specs' && (
          p.specs.length ? (
            <table className="spec-table"><tbody>
              {p.specs.map((s, i) => <tr key={i}><td>{s.name}</td><td>{s.value}</td></tr>)}
            </tbody></table>
          ) : <div className="empty"><h3>مشخصاتی ثبت نشده</h3><p>به‌زودی تکمیل می‌شود.</p></div>
        )}
        {tab === 'reviews' && (
          <div>
            {reviews.length === 0 && <div className="empty"><h3>هنوز نظری ثبت نشده</h3><p>اولین نفری باشید که نظر می‌دهد.</p></div>}
            {reviews.map((r) => (
              <div className="review" key={r.id}>
                <div className="rh"><b>{r.author}</b><Stars rating={r.rating} size={13} /><time>{faDate(r.date)}</time></div>
                <p>{r.text}</p>
              </div>
            ))}
            <div className="card" style={{ padding: 22, marginTop: 16 }}>
              <h3 style={{ marginTop: 0, fontSize: 16 }}>ثبت نظر</h3>
              <form onSubmit={submitReview}>
                {!user && (
                  <div className="field"><label>نام شما</label>
                    <input className="input" value={rName} onChange={(e) => setRName(e.target.value)} placeholder="مثلاً علی رضایی" />
                  </div>
                )}
                <div className="field"><label>امتیاز شما</label>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[1, 2, 3, 4, 5].map((v) => (
                      <button type="button" key={v} onClick={() => setRRate(v)} aria-label={`${faNum(v)} ستاره`} style={{ background: 'none', border: 'none', color: v <= rRate ? '#e3a008' : '#d8d4ca' }}>
                        <Stars rating={v <= rRate ? 1 : 0} size={22} />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="field"><label>متن نظر</label>
                  <textarea className="textarea" value={rText} onChange={(e) => setRText(e.target.value)} placeholder="تجربه خود از این کالا را بنویسید..." />
                </div>
                <button className="btn btn-gold" type="submit">ثبت نظر</button>
              </form>
            </div>
          </div>
        )}
      </div>

      {related.length > 0 && (
        <section className="section">
          <SectionHead title="کالاهای مرتبط" moreTo="/shop" />
          <div className="grid-products">{related.map((x) => <ProductCard key={x.id} p={x} />)}</div>
        </section>
      )}
    </div>
  );
}
