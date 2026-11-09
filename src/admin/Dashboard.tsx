import { Link } from 'react-router-dom';
import { Package, FolderTree, ShoppingBag, Wallet, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useDB } from '../services/db';
import { faNum, faDate, toman, ORDER_STATUS_FA } from '../services/format';
import { AdminHead, Pill } from './ui';

export default function Dashboard() {
  const { db } = useDB();
  const revenue = db.orders.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0);
  const recent = [...db.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  const low = db.products.filter((p) => p.status === 'published' && p.stock < 10).sort((a, b) => a.stock - b.stock).slice(0, 6);

  const stats = [
    { icon: <Package size={24} />, bg: '#faf3e0', fg: 'var(--gold-dark)', v: faNum(db.products.length), l: 'کل محصولات' },
    { icon: <FolderTree size={24} />, bg: '#e8f0fb', fg: '#2b4a73', v: faNum(db.categories.filter((c) => !c.parentId).length), l: 'دسته‌بندی اصلی' },
    { icon: <ShoppingBag size={24} />, bg: '#e5f5ec', fg: 'var(--success)', v: faNum(db.orders.length), l: 'کل سفارش‌ها' },
    { icon: <Wallet size={24} />, bg: '#f3ecfa', fg: '#5b4a8a', v: toman(revenue), l: 'مجموع فروش' },
  ];

  return (
    <div>
      <AdminHead title="داشبورد" sub="نمای کلی فروشگاه">
        <Link className="btn btn-outline btn-sm" to="/admin/products">مدیریت محصولات</Link>
        <Link className="btn btn-gold btn-sm" to="/admin/orders">سفارش‌های جدید</Link>
      </AdminHead>
      <div className="stat-grid">
        {stats.map((s, i) => (
          <div className="stat-card" key={i}>
            <div className="ic" style={{ background: s.bg, color: s.fg }}>{s.icon}</div>
            <div><b>{s.v}</b><small>{s.l}</small></div>
          </div>
        ))}
      </div>
      <div className="two-col">
        <div className="panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>سفارش‌های اخیر</h3>
            <Link className="more-link" to="/admin/orders">همه <ArrowLeft size={14} /></Link>
          </div>
          {recent.map((o) => (
            <div className="low-stock" key={o.id}>
              <div style={{ flex: 1 }}>
                <b dir="ltr">{o.code}</b>
                <small style={{ color: 'var(--muted)', display: 'block' }}>{o.customerName} — {faDate(o.createdAt)}</small>
              </div>
              <b>{toman(o.total)}</b>
              <Pill kind={o.status === 'completed' ? 'green' : o.status === 'cancelled' ? 'red' : 'gold'}>{ORDER_STATUS_FA[o.status]}</Pill>
            </div>
          ))}
          {recent.length === 0 && <p style={{ color: 'var(--muted)' }}>سفارشی ثبت نشده است.</p>}
        </div>
        <div>
          <div className="panel">
            <h3><AlertTriangle size={17} style={{ verticalAlign: -3, color: 'var(--error)' }} /> هشدار موجودی کم</h3>
            {low.map((p) => (
              <div className="low-stock" key={p.id}>
                <img src={p.image} alt="" />
                <span style={{ flex: 1, fontSize: 13 }}>{p.name}</span>
                <Pill kind={p.stock <= 0 ? 'red' : 'gold'}>{p.stock <= 0 ? 'ناموجود' : `تنها ${faNum(p.stock)} عدد`}</Pill>
              </div>
            ))}
            {low.length === 0 && <p style={{ color: 'var(--muted)' }}>موجودی همه کالاها مناسب است.</p>}
          </div>
          <div className="panel">
            <h3>دسترسی سریع</h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Link className="btn btn-outline btn-sm" to="/admin/products">+ محصول جدید</Link>
              <Link className="btn btn-outline btn-sm" to="/admin/banners">+ بنر جدید</Link>
              <Link className="btn btn-outline btn-sm" to="/admin/articles">+ مقاله جدید</Link>
              <Link className="btn btn-outline btn-sm" to="/admin/homepage">ویرایش صفحه اصلی</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
