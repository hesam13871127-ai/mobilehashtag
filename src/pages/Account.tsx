import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { User, MapPin, Package, Heart, LogOut, Settings, Plus, Trash2 } from 'lucide-react';
import { useDB } from '../services/db';
import { useShop, demoHash } from '../services/shop';
import { useToast } from '../services/toast';
import { faNum, faDate, toman, uid, ORDER_STATUS_FA } from '../services/format';
import { Breadcrumb, Empty, Modal } from '../components/ui';

export default function Account() {
  const { db, save } = useDB();
  const { user, login, register, logout, wishlist } = useShop();
  const { toast } = useToast();
  const [tab, setTab] = useState<'profile' | 'addresses' | 'orders' | 'wishlist'>('profile');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pass, setPass] = useState('');
  const [addrOpen, setAddrOpen] = useState(false);
  const [addr, setAddr] = useState({ title: 'منزل', city: '', address: '', postalCode: '', phone: '' });
  const [newName, setNewName] = useState('');

  const myOrders = useMemo(
    () => (user ? db.orders.filter((o) => o.phone === user.phone).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) : []),
    [db.orders, user],
  );
  const myWishlist = db.products.filter((p) => wishlist.includes(p.id));

  if (!user) {
    const submit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!/^09\d{9}$/.test(phone.trim())) { toast('شماره موبایل معتبر وارد کنید.', 'error'); return; }
      if (pass.length < 4) { toast('رمز عبور حداقل ۴ کاراکتر باشد.', 'error'); return; }
      if (mode === 'register') {
        if (name.trim().length < 3) { toast('نام کامل را وارد کنید.', 'error'); return; }
        const r = register(name, phone, pass);
        toast(r.message, r.ok ? 'success' : 'error');
      } else {
        const r = login(phone, pass);
        toast(r.message, r.ok ? 'success' : 'error');
      }
    };
    return (
      <div className="container page">
        <Breadcrumb items={[{ label: 'حساب کاربری' }]} />
        <div className="auth-card">
          <h1>ورود / ثبت‌نام</h1>
          <p className="sub">برای پیگیری سفارش و خرید سریع‌تر وارد شوید</p>
          <div className="auth-tabs">
            <button className={mode === 'login' ? 'on' : ''} onClick={() => setMode('login')}>ورود</button>
            <button className={mode === 'register' ? 'on' : ''} onClick={() => setMode('register')}>ثبت‌نام</button>
          </div>
          <form onSubmit={submit}>
            {mode === 'register' && (
              <div className="field"><label>نام و نام خانوادگی</label>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="نام شما" />
              </div>
            )}
            <div className="field"><label>شماره موبایل</label>
              <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09123456789" inputMode="numeric" />
            </div>
            <div className="field"><label>رمز عبور</label>
              <input className="input" type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••••" />
            </div>
            <button className="btn btn-gold btn-block" type="submit">{mode === 'login' ? 'ورود به حساب' : 'ساخت حساب'}</button>
          </form>
          <div className="demo-note">حساب نمایشی مشتری: 09121111111 / رمز 123456</div>
        </div>
      </div>
    );
  }

  const addAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addr.city.trim() || addr.address.trim().length < 8 || !/^\d{10}$/.test(addr.postalCode.trim())) {
      toast('اطلاعات نشانی را کامل و معتبر وارد کنید.', 'error'); return;
    }
    save('users', { ...user, addresses: [...user.addresses, { ...addr, id: uid('ad'), phone: addr.phone || user.phone }] });
    setAddrOpen(false);
    setAddr({ title: 'منزل', city: '', address: '', postalCode: '', phone: '' });
    toast('نشانی جدید ذخیره شد.');
  };

  const tabs = [
    { id: 'profile' as const, label: 'پروفایل', icon: <User size={17} /> },
    { id: 'orders' as const, label: `سفارش‌ها (${faNum(myOrders.length)})`, icon: <Package size={17} /> },
    { id: 'addresses' as const, label: 'نشانی‌ها', icon: <MapPin size={17} /> },
    { id: 'wishlist' as const, label: `علاقه‌مندی‌ها (${faNum(myWishlist.length)})`, icon: <Heart size={17} /> },
  ];

  return (
    <div className="container page">
      <Breadcrumb items={[{ label: 'حساب کاربری' }]} />
      <h1 style={{ fontSize: 22 }}>سلام، {user.name} 👋</h1>
      <div className="acc-layout" style={{ marginTop: 16 }}>
        <aside className="acc-side">
          {tabs.map((t) => (
            <button key={t.id} className={tab === t.id ? 'alink on' : 'alink'} style={tab === t.id ? { background: '#faf5ea', color: 'var(--gold-dark)' } : undefined} onClick={() => setTab(t.id)}>
              {t.icon} {t.label}
            </button>
          ))}
          {user.role === 'admin' && <Link to="/admin"><Settings size={17} /> پنل مدیریت</Link>}
          <button className="alink" onClick={() => { logout(); toast('با موفقیت خارج شدید.', 'info'); }}><LogOut size={17} /> خروج از حساب</button>
        </aside>
        <div className="acc-main">
          {tab === 'profile' && (
            <div className="card">
              <h3 style={{ marginTop: 0 }}>اطلاعات حساب</h3>
              <p style={{ fontSize: 14 }}>شماره موبایل: <b dir="ltr">{user.phone}</b></p>
              <div className="field" style={{ maxWidth: 320 }}><label>نام نمایشی</label>
                <input className="input" defaultValue={user.name} onChange={(e) => setNewName(e.target.value)} placeholder={user.name} />
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button className="btn btn-dark btn-sm" onClick={() => {
                  if (newName.trim().length < 3) { toast('نام معتبر وارد کنید.', 'error'); return; }
                  save('users', { ...user, name: newName.trim() });
                  toast('نام شما به‌روزرسانی شد.');
                }}>ذخیره تغییرات</button>
              </div>
              <ChangePass userId={user.id} />
            </div>
          )}
          {tab === 'orders' && (
            <div className="card">
              <h3 style={{ marginTop: 0 }}>تاریخچه سفارش‌ها</h3>
              {myOrders.length === 0 ? <Empty title="سفارشی ثبت نشده" text="اولین سفارش خود را ثبت کنید." action={<Link className="btn btn-gold" to="/shop">مشاهده فروشگاه</Link>} /> :
                myOrders.map((o) => (
                  <div key={o.id} className="addr-card" style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                      <b dir="ltr">{o.code}</b>
                      <span className="badge badge-gold">{ORDER_STATUS_FA[o.status]}</span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--muted)' }}>{faDate(o.createdAt)} — {faNum(o.items.reduce((s, i) => s + i.qty, 0))} کالا — {toman(o.total)}</div>
                    <Link className="more-link" style={{ fontSize: 13 }} to={`/track-order?code=${o.code}`}>جزئیات و پیگیری</Link>
                  </div>
                ))}
            </div>
          )}
          {tab === 'addresses' && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>نشانی‌های من</h3>
                <button className="btn btn-gold btn-sm" onClick={() => setAddrOpen(true)}><Plus size={15} /> نشانی جدید</button>
              </div>
              <div className="addr-grid" style={{ marginTop: 14 }}>
                {user.addresses.map((a) => (
                  <div className="addr-card" key={a.id}>
                    <b>{a.title} — {a.city}</b>
                    <div>{a.address}</div>
                    <div style={{ color: 'var(--muted)' }}>کد پستی: {a.postalCode}</div>
                    <button className="btn btn-ghost btn-sm" style={{ marginTop: 6 }} onClick={() => {
                      save('users', { ...user, addresses: user.addresses.filter((x) => x.id !== a.id) });
                      toast('نشانی حذف شد.', 'info');
                    }}><Trash2 size={14} /> حذف</button>
                  </div>
                ))}
                {user.addresses.length === 0 && <p style={{ color: 'var(--muted)', fontSize: 14 }}>هنوز نشانی ثبت نشده است.</p>}
              </div>
            </div>
          )}
          {tab === 'wishlist' && (
            <div className="card">
              <h3 style={{ marginTop: 0 }}>علاقه‌مندی‌ها</h3>
              {myWishlist.length === 0 ? <Empty title="علاقه‌مندی خالی است" text="کالاهای موردعلاقه خود را ذخیره کنید." action={<Link className="btn btn-gold" to="/shop">مشاهده فروشگاه</Link>} /> :
                myWishlist.map((p) => (
                  <div key={p.id} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                    <Link to={`/product/${p.slug}`}><img src={p.image} alt="" style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover' }} /></Link>
                    <Link to={`/product/${p.slug}`} style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{p.name}</Link>
                    <Link className="btn btn-outline btn-sm" to={`/product/${p.slug}`}>مشاهده</Link>
                  </div>
                ))}
              <Link className="btn btn-ghost btn-sm" to="/wishlist">صفحه کامل علاقه‌مندی‌ها</Link>
            </div>
          )}
        </div>
      </div>
      {addrOpen && (
        <Modal title="نشانی جدید" onClose={() => setAddrOpen(false)}>
          <form onSubmit={addAddress}>
            <div className="form-grid">
              <div className="field"><label>عنوان</label>
                <select className="select" value={addr.title} onChange={(e) => setAddr({ ...addr, title: e.target.value })}>
                  <option>منزل</option><option>محل کار</option><option>سایر</option>
                </select>
              </div>
              <div className="field"><label>شهر</label>
                <input className="input" value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} />
              </div>
            </div>
            <div className="field"><label>نشانی کامل</label>
              <input className="input" value={addr.address} onChange={(e) => setAddr({ ...addr, address: e.target.value })} />
            </div>
            <div className="form-grid">
              <div className="field"><label>کد پستی</label>
                <input className="input" value={addr.postalCode} onChange={(e) => setAddr({ ...addr, postalCode: e.target.value })} inputMode="numeric" />
              </div>
              <div className="field"><label>تلفن تحویل‌گیرنده</label>
                <input className="input" value={addr.phone} onChange={(e) => setAddr({ ...addr, phone: e.target.value })} placeholder={user.phone} />
              </div>
            </div>
            <button className="btn btn-gold" type="submit">ذخیره نشانی</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function ChangePass({ userId }: { userId: string }) {
  const { db, save } = useDB();
  const { toast } = useToast();
  const [oldP, setOldP] = useState('');
  const [newP, setNewP] = useState('');
  return (
    <div style={{ marginTop: 22, borderTop: '1px solid var(--border)', paddingTop: 18 }}>
      <h4 style={{ margin: '0 0 10px' }}>تغییر رمز عبور</h4>
      <div className="form-grid" style={{ maxWidth: 560 }}>
        <div className="field"><label>رمز فعلی</label>
          <input className="input" type="password" value={oldP} onChange={(e) => setOldP(e.target.value)} />
        </div>
        <div className="field"><label>رمز جدید</label>
          <input className="input" type="password" value={newP} onChange={(e) => setNewP(e.target.value)} />
        </div>
      </div>
      <button className="btn btn-outline btn-sm" onClick={() => {
        const u = db.users.find((x) => x.id === userId);
        if (!u || u.passwordHash !== demoHash(oldP)) { toast('رمز فعلی اشتباه است.', 'error'); return; }
        if (newP.length < 4) { toast('رمز جدید حداقل ۴ کاراکتر باشد.', 'error'); return; }
        save('users', { ...u, passwordHash: demoHash(newP) });
        setOldP(''); setNewP('');
        toast('رمز عبور تغییر کرد.');
      }}>تغییر رمز</button>
    </div>
  );
}
