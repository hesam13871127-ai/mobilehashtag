import React, { useMemo, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Search, Heart, ShoppingCart, User, Phone, Menu, X, ChevronDown } from 'lucide-react';
import { useDB } from '../services/db';
import { useShop } from '../services/shop';

const NAV: Array<{ label: string; to: string; mega?: 'shop' | 'mobile' | 'acc' }> = [
  { label: 'خانه', to: '/' },
  { label: 'فروشگاه', to: '/shop', mega: 'shop' },
  { label: 'گوشی موبایل', to: '/category/mobile', mega: 'mobile' },
  { label: 'لوازم جانبی', to: '/categories', mega: 'acc' },
  { label: 'برندها', to: '/brands' },
  { label: 'پرفروش‌ترین‌ها', to: '/bestsellers' },
  { label: 'تخفیف‌ها', to: '/offers' },
  { label: 'مجله', to: '/blog' },
  { label: 'تماس با ما', to: '/contact' },
];

function Mega({ kind }: { kind: 'shop' | 'mobile' | 'acc' }) {
  const { db } = useDB();
  const mains = db.categories.filter((c) => !c.parentId && c.visible).sort((a, b) => a.order - b.order);
  let cols = mains;
  if (kind === 'mobile') cols = mains.filter((c) => ['m-mobile', 'm-case', 'm-glass'].includes(c.id));
  if (kind === 'acc') cols = mains.filter((c) => !['m-mobile'].includes(c.id)).slice(0, 6);
  if (kind === 'shop') cols = mains.slice(0, 6);
  return (
    <div className="mega">
      <div className="mega-grid">
        {cols.map((m) => (
          <div className="mega-col" key={m.id}>
            <h4><Link to={`/category/${m.slug}`}>{m.name}</Link></h4>
            {db.categories.filter((c) => c.parentId === m.id && c.visible).slice(0, 5).map((s) => (
              <Link key={s.id} to={`/category/${s.slug}`}>{s.name}</Link>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Header() {
  const { db } = useDB();
  const { cartCount, wishlist, user } = useShop();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [openCat, setOpenCat] = useState<string | null>(null);
  const nav = useNavigate();
  const boxRef = useRef<HTMLDivElement>(null);
  const s = db.settings;

  const suggestions = useMemo(() => {
    const t = q.trim();
    if (t.length < 2) return [];
    return db.products.filter((p) => p.status === 'published' && p.name.includes(t)).slice(0, 6);
  }, [q, db.products]);

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!q.trim()) return;
    setOpen(false);
    nav(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  const mains = db.categories.filter((c) => !c.parentId && c.visible).sort((a, b) => a.order - b.order);

  return (
    <>
      {s.announcementEnabled && <div className="announce">{s.announcement}</div>}
      <header className="header">
        <div className="container">
          <div className="header-top">
            <button className="icon-btn hamburger" onClick={() => setDrawer(true)} aria-label="منو"><Menu size={20} /></button>
            <Link to="/" className="logo" aria-label="موبایل هشتگ">
              <img src={s.logo} alt="موبایل هشتگ" />
            </Link>
            <div className="searchbox" ref={boxRef}>
              <form onSubmit={submit}>
                <Search size={19} />
                <input
                  className="input" value={q} placeholder="جستجوی گوشی، هندزفری، شارژر و..."
                  onChange={(e) => { setQ(e.target.value); setOpen(true); }}
                  onFocus={() => setOpen(true)}
                  onBlur={() => window.setTimeout(() => setOpen(false), 180)}
                  aria-label="جستجو"
                />
              </form>
              {open && suggestions.length > 0 && (
                <div className="search-results">
                  {suggestions.map((p) => (
                    <Link key={p.id} to={`/product/${p.slug}`} onClick={() => setOpen(false)}>
                      <img src={p.image} alt="" loading="lazy" />
                      <span>{p.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <div className="header-actions">
              <a className="header-phone" href={`tel:${s.phone.replace(/-/g, '')}`}>
                <Phone size={18} /> <span>{s.phone}</span>
              </a>
              <Link to="/account" className="icon-btn" aria-label="حساب کاربری" title={user ? user.name : 'حساب کاربری'}>
                <User size={20} />
              </Link>
              <Link to="/wishlist" className="icon-btn" aria-label="علاقه‌مندی‌ها">
                <Heart size={20} />
                {wishlist.length > 0 && <span className="badge">{wishlist.length}</span>}
              </Link>
              <Link to="/cart" className="icon-btn" aria-label="سبد خرید">
                <ShoppingCart size={20} />
                {cartCount > 0 && <span className="badge">{cartCount}</span>}
              </Link>
            </div>
          </div>
        </div>
        <nav className="nav" aria-label="ناوبری اصلی">
          <div className="container nav-inner">
            {NAV.map((n) => (
              <div className="nav-item" key={n.to + n.label}>
                <NavLink to={n.to} end={n.to === '/'} className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
                  {n.label}
                </NavLink>
                {n.mega && <Mega kind={n.mega} />}
              </div>
            ))}
          </div>
        </nav>
      </header>

      {drawer && (
        <>
          <div className="drawer-overlay" onClick={() => setDrawer(false)} />
          <aside className="drawer" aria-label="منوی موبایل">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <img src={s.logo} alt="موبایل هشتگ" style={{ height: 42 }} />
              <button className="icon-btn" onClick={() => setDrawer(false)} aria-label="بستن"><X size={19} /></button>
            </div>
            {NAV.map((n) => (
              <Link key={n.to + n.label} className="d-link" to={n.to} onClick={() => setDrawer(false)}>{n.label}</Link>
            ))}
            <div style={{ marginTop: 14, fontWeight: 800, fontSize: 14, color: 'var(--gold-dark)' }}>دسته‌بندی‌ها</div>
            {mains.map((m) => (
              <div key={m.id}>
                <button
                  className="d-link" style={{ background: 'none', border: 'none', borderBottom: '1px solid var(--border)', width: '100%', textAlign: 'right', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14.5, fontWeight: 600, padding: '10px 6px' }}
                  onClick={() => setOpenCat(openCat === m.id ? null : m.id)}
                >
                  {m.name} <ChevronDown size={16} style={{ transform: openCat === m.id ? 'rotate(180deg)' : 'none' }} />
                </button>
                {openCat === m.id && db.categories.filter((c) => c.parentId === m.id && c.visible).map((sub) => (
                  <Link key={sub.id} className="d-sub" to={`/category/${sub.slug}`} onClick={() => setDrawer(false)}>{sub.name}</Link>
                ))}
              </div>
            ))}
          </aside>
        </>
      )}
    </>
  );
}
