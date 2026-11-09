import { useMemo, useState } from 'react';
import { Eye, Trash2, Plus } from 'lucide-react';
import type { Customer } from '../models/types';
import { useDB } from '../services/db';
import { useToast } from '../services/toast';
import { faNum, faDate, toman, uid } from '../services/format';
import { AdminHead, Pager, SearchBar } from './ui';
import { Confirm, Modal } from '../components/ui';

const PER = 10;

export default function AdminCustomers() {
  const { db, save, remove } = useDB();
  const { toast } = useToast();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [view, setView] = useState<Customer | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState({ name: '', phone: '', email: '' });

  const all = useMemo(() => {
    // merge explicit customers + registered users + order phones
    const map = new Map<string, Customer>();
    for (const c of db.customers) map.set(c.phone, c);
    for (const u of db.users.filter((x) => x.role === 'customer')) {
      if (!map.has(u.phone)) map.set(u.phone, { id: u.id, name: u.name, phone: u.phone, email: u.email, addresses: u.addresses, createdAt: u.createdAt });
    }
    for (const o of db.orders) {
      if (!map.has(o.phone)) map.set(o.phone, { id: uid('cu'), name: o.customerName, phone: o.phone, email: '', addresses: [], createdAt: o.createdAt });
    }
    let list = [...map.values()];
    if (q.trim()) list = list.filter((c) => c.name.includes(q.trim()) || c.phone.includes(q.trim()));
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [db.customers, db.users, db.orders, q]);

  const stats = (phone: string) => {
    const orders = db.orders.filter((o) => o.phone === phone && o.status !== 'cancelled');
    return { count: orders.length, spent: orders.reduce((s, o) => s + o.total, 0) };
  };

  const pages = Math.max(1, Math.ceil(all.length / PER));
  const rows = all.slice((Math.min(page, pages) - 1) * PER, Math.min(page, pages) * PER);

  return (
    <div>
      <AdminHead title="مشتریان" sub={`${faNum(all.length)} مشتری`}>
        <button className="btn btn-gold btn-sm" onClick={() => setAdding(true)}><Plus size={15} /> مشتری جدید</button>
      </AdminHead>
      <div className="panel">
        <div className="toolbar-admin">
          <SearchBar value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="جستجوی نام یا موبایل..." />
        </div>
        <div className="atable-wrap">
          <table className="atable">
            <thead><tr><th>مشتری</th><th>موبایل</th><th>سفارش‌ها</th><th>مجموع خرید</th><th>عضویت</th><th>عملیات</th></tr></thead>
            <tbody>
              {rows.map((c) => {
                const s = stats(c.phone);
                return (
                  <tr key={c.phone}>
                    <td><b>{c.name}</b><br /><small style={{ color: 'var(--muted)' }}>{c.email || '—'}</small></td>
                    <td dir="ltr">{c.phone}</td>
                    <td>{faNum(s.count)}</td>
                    <td><b>{toman(s.spent)}</b></td>
                    <td style={{ fontSize: 12.5 }}>{faDate(c.createdAt)}</td>
                    <td>
                      <div className="row-actions">
                        <button className="mini-btn" title="جزئیات" onClick={() => setView(c)}><Eye size={15} /></button>
                        <button className="mini-btn danger" title="حذف" onClick={() => setConfirmDel(c.phone)}><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)' }}>مشتری یافت نشد.</td></tr>}
            </tbody>
          </table>
        </div>
        <Pager total={all.length} page={Math.min(page, pages)} per={PER} onPage={setPage} />
      </div>

      {view && (
        <Modal title={view.name} onClose={() => setView(null)}>
          <div style={{ fontSize: 14 }}>
            <div className="summary-row"><span>موبایل</span><span dir="ltr">{view.phone}</span></div>
            <div className="summary-row"><span>ایمیل</span><span>{view.email || '—'}</span></div>
            <h4>نشانی‌ها</h4>
            {view.addresses.length === 0 && <p style={{ color: 'var(--muted)', fontSize: 13 }}>نشانی ثبت نشده.</p>}
            {view.addresses.map((a) => (
              <div className="addr-card" key={a.id} style={{ marginBottom: 8 }}>
                <b>{a.title} — {a.city}</b><div>{a.address}</div>
              </div>
            ))}
            <h4>سفارش‌ها</h4>
            {db.orders.filter((o) => o.phone === view.phone).map((o) => (
              <div className="summary-row" key={o.id}><span dir="ltr">{o.code}</span><span>{toman(o.total)}</span></div>
            ))}
          </div>
        </Modal>
      )}
      {adding && (
        <Modal title="مشتری جدید" onClose={() => setAdding(false)}>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (f.name.trim().length < 3) { toast('نام را وارد کنید.', 'error'); return; }
            if (!/^09\d{9}$/.test(f.phone.trim())) { toast('موبایل معتبر وارد کنید.', 'error'); return; }
            save('customers', { id: uid('cu'), name: f.name.trim(), phone: f.phone.trim(), email: f.email.trim(), addresses: [], createdAt: new Date().toISOString() });
            setAdding(false); setF({ name: '', phone: '', email: '' });
            toast('مشتری اضافه شد.');
          }}>
            <div className="field"><label>نام</label><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
            <div className="field"><label>موبایل</label><input className="input" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} inputMode="numeric" /></div>
            <div className="field"><label>ایمیل</label><input className="input" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} dir="ltr" /></div>
            <button className="btn btn-gold" type="submit">ذخیره</button>
          </form>
        </Modal>
      )}
      {confirmDel && (
        <Confirm text="این مشتری حذف شود؟ (سفارش‌های او حذف نمی‌شوند)" onCancel={() => setConfirmDel(null)} onOk={() => {
          const c = db.customers.find((x) => x.phone === confirmDel);
          if (c) remove('customers', c.id);
          const u = db.users.find((x) => x.phone === confirmDel && x.role === 'customer');
          if (u) remove('users', u.id);
          setConfirmDel(null);
          toast('مشتری حذف شد.', 'info');
        }} />
      )}
    </div>
  );
}
