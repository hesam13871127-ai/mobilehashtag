import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, FolderTree, Award, ShoppingBag, Image as ImageIcon,
  Home, Users, MessageSquareText, Newspaper, Palette, Settings, LogOut, Menu, ExternalLink,
} from 'lucide-react';
import { useDB } from '../services/db';
import { useShop } from '../services/shop';
import { useToast } from '../services/toast';

const ITEMS = [
  { to: '/admin', label: 'داشبورد', icon: <LayoutDashboard size={18} />, end: true },
  { to: '/admin/products', label: 'مدیریت محصولات', icon: <Package size={18} /> },
  { to: '/admin/categories', label: 'دسته‌بندی‌ها', icon: <FolderTree size={18} /> },
  { to: '/admin/brands', label: 'برندها', icon: <Award size={18} /> },
  { to: '/admin/orders', label: 'مدیریت سفارش‌ها', icon: <ShoppingBag size={18} /> },
  { to: '/admin/banners', label: 'مدیریت بنرها', icon: <ImageIcon size={18} /> },
  { to: '/admin/homepage', label: 'مدیریت صفحه اصلی', icon: <Home size={18} /> },
  { to: '/admin/customers', label: 'مشتریان', icon: <Users size={18} /> },
  { to: '/admin/reviews', label: 'نظرات', icon: <MessageSquareText size={18} /> },
  { to: '/admin/articles', label: 'مدیریت مقالات', icon: <Newspaper size={18} /> },
  { to: '/admin/appearance', label: 'تنظیمات قالب', icon: <Palette size={18} /> },
  { to: '/admin/settings', label: 'تنظیمات فروشگاه', icon: <Settings size={18} /> },
];

export default function AdminLayout() {
  const { db } = useDB();
  const { user, logout } = useShop();
  const { toast } = useToast();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const pendingReviews = db.reviews.filter((r) => r.status === 'pending').length;
  const pendingOrders = db.orders.filter((o) => o.status === 'pending').length;

  return (
    <div className="admin">
      <aside className={`admin-side${open ? ' open' : ''}`}>
        <Link to="/admin" className="logo" onClick={() => setOpen(false)}>
          <img src={db.settings.logoWhite} alt="موبایل هشتگ" />
        </Link>
        <div className="who">مدیر: {user?.name}</div>
        {ITEMS.map((it) => (
          <NavLink key={it.to} to={it.to} end={it.end} onClick={() => setOpen(false)}
            className={({ isActive }) => (isActive ? 'on' : '')}>
            {it.icon} {it.label}
            {it.to === '/admin/reviews' && pendingReviews > 0 && (
              <span className="badge badge-off" style={{ marginRight: 'auto' }}>{pendingReviews}</span>
            )}
            {it.to === '/admin/orders' && pendingOrders > 0 && (
              <span className="badge badge-gold" style={{ marginRight: 'auto' }}>{pendingOrders}</span>
            )}
          </NavLink>
        ))}
        <Link to="/" target="_blank"><ExternalLink size={18} /> مشاهده فروشگاه</Link>
        <button className="alink" onClick={() => { logout(); toast('از پنل خارج شدید.', 'info'); nav('/'); }}>
          <LogOut size={18} /> خروج
        </button>
      </aside>
      {open && <div className="drawer-overlay" onClick={() => setOpen(false)} />}
      <div className="admin-main">
        <button className="btn btn-outline btn-sm admin-burger" style={{ marginBottom: 12 }} onClick={() => setOpen(true)}>
          <Menu size={16} /> منوی مدیریت
        </button>
        <Outlet />
      </div>
    </div>
  );
}
