import { useMemo, useState } from 'react';
import { Eye, Trash2 } from 'lucide-react';
import type { Order, OrderStatus } from '../models/types';
import { useDB } from '../services/db';
import { useToast } from '../services/toast';
import { faNum, faDateTime, toman, ORDER_STATUS_FA } from '../services/format';
import { AdminHead, Pager, Pill, SearchBar } from './ui';
import { Confirm, Modal } from '../components/ui';

const PER = 10;
const STATUSES: OrderStatus[] = ['pending', 'processing', 'shipped', 'completed', 'cancelled'];

export default function AdminOrders() {
  const { db, save, remove } = useDB();
  const { toast } = useToast();
  const [q, setQ] = useState('');
  const [st, setSt] = useState('');
  const [page, setPage] = useState(1);
  const [view, setView] = useState<Order | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = [...db.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (q.trim()) list = list.filter((o) => o.code.includes(q.trim()) || o.customerName.includes(q.trim()) || o.phone.includes(q.trim()));
    if (st) list = list.filter((o) => o.status === st);
    return list;
  }, [db.orders, q, st]);
  const pages = Math.max(1, Math.ceil(filtered.length / PER));
  const rows = filtered.slice((Math.min(page, pages) - 1) * PER, Math.min(page, pages) * PER);

  const pill = (s: OrderStatus) => s === 'completed' ? 'green' : s === 'cancelled' ? 'red' : s === 'shipped' ? 'blue' : 'gold';

  return (
    <div>
      <AdminHead title="مدیریت سفارش‌ها" sub={`${faNum(db.orders.length)} سفارش`} />
      <div className="panel">
        <div className="toolbar-admin">
          <SearchBar value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="جستجوی کد، نام، موبایل..." />
          <select className="select" value={st} onChange={(e) => { setSt(e.target.value); setPage(1); }}>
            <option value="">همه وضعیت‌ها</option>
            {STATUSES.map((s) => <option key={s} value={s}>{ORDER_STATUS_FA[s]}</option>)}
          </select>
        </div>
        <div className="atable-wrap">
          <table className="atable">
            <thead><tr><th>کد</th><th>مشتری</th><th>اقلام</th><th>مبلغ</th><th>تاریخ</th><th>وضعیت</th><th>عملیات</th></tr></thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id}>
                  <td dir="ltr"><b>{o.code}</b></td>
                  <td>{o.customerName}<br /><small style={{ color: 'var(--muted)' }}>{o.phone}</small></td>
                  <td>{faNum(o.items.reduce((s, i) => s + i.qty, 0))}</td>
                  <td><b>{toman(o.total)}</b></td>
                  <td style={{ whiteSpace: 'nowrap', fontSize: 12.5 }}>{faDateTime(o.createdAt)}</td>
                  <td>
                    <select className="select" style={{ padding: '6px 10px', fontSize: 12.5 }} value={o.status} onChange={(e) => {
                      save('orders', { ...o, status: e.target.value as OrderStatus });
                      toast(`وضعیت سفارش ${o.code} تغییر کرد.`);
                    }} aria-label="وضعیت سفارش">
                      {STATUSES.map((s) => <option key={s} value={s}>{ORDER_STATUS_FA[s]}</option>)}
                    </select>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="mini-btn" title="جزئیات" onClick={() => setView(o)}><Eye size={15} /></button>
                      <button className="mini-btn danger" title="حذف" onClick={() => setConfirmDel(o.id)}><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--muted)' }}>سفارشی یافت نشد.</td></tr>}
            </tbody>
          </table>
        </div>
        <Pager total={filtered.length} page={Math.min(page, pages)} per={PER} onPage={setPage} />
      </div>

      {view && (
        <Modal title={`سفارش ${view.code}`} onClose={() => setView(null)}>
          <div style={{ fontSize: 14 }}>
            <div className="summary-row"><span>مشتری</span><span>{view.customerName} — {view.phone}</span></div>
            <div className="summary-row"><span>نشانی</span><span>{view.city} — {view.address}</span></div>
            <div className="summary-row"><span>کد پستی</span><span>{view.postalCode}</span></div>
            <div className="summary-row"><span>ارسال / پرداخت</span><span>{view.shippingMethod} / {view.paymentMethod}</span></div>
            {view.note && <div className="summary-row"><span>یادداشت</span><span>{view.note}</span></div>}
            <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />
            {view.items.map((it, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                <img src={it.image} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }} />
                <span style={{ flex: 1, fontSize: 13 }}>{it.name} {it.variantLabel && <small>({it.variantLabel})</small>} <b>× {faNum(it.qty)}</b></span>
                <b>{toman(it.price * it.qty)}</b>
              </div>
            ))}
            <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />
            <div className="summary-row"><span>جمع</span><span>{toman(view.subtotal)}</span></div>
            <div className="summary-row"><span>ارسال</span><span>{toman(view.shipping)}</span></div>
            <div className="summary-row total"><span>مبلغ نهایی</span><span>{toman(view.total)}</span></div>
            <div style={{ marginTop: 10 }}><Pill kind={pill(view.status)}>{ORDER_STATUS_FA[view.status]}</Pill></div>
          </div>
        </Modal>
      )}
      {confirmDel && (
        <Confirm text="این سفارش حذف شود؟" onCancel={() => setConfirmDel(null)} onOk={() => { remove('orders', confirmDel); setConfirmDel(null); toast('سفارش حذف شد.', 'info'); }} />
      )}
    </div>
  );
}
