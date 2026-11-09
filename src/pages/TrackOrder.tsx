import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useDB } from '../services/db';
import { useToast } from '../services/toast';
import { faDate, toman, faNum, ORDER_STATUS_FA } from '../services/format';
import { Breadcrumb, Empty } from '../components/ui';
import type { Order } from '../models/types';

const STEPS = ['pending', 'processing', 'shipped', 'completed'];

export default function TrackOrder() {
  const { db } = useDB();
  const { toast } = useToast();
  const [params] = useSearchParams();
  const [code, setCode] = useState(params.get('code') || '');
  const [phone, setPhone] = useState('');
  const [found, setFound] = useState<Order | null>(() => {
    const c = params.get('code');
    return c ? db.orders.find((o) => o.code === c) || null : null;
  });
  const [searched, setSearched] = useState(!!params.get('code'));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const o = db.orders.find((x) => x.code.trim().toUpperCase() === code.trim().toUpperCase() && (!phone.trim() || x.phone === phone.trim()));
    setFound(o || null);
    setSearched(true);
    if (!o) toast('سفارشی با این مشخصات یافت نشد.', 'error');
  };

  const stepIdx = found ? STEPS.indexOf(found.status) : -1;

  return (
    <div className="container page">
      <Breadcrumb items={[{ label: 'پیگیری سفارش' }]} />
      <div className="track-box">
        <h1 style={{ fontSize: 24, textAlign: 'center' }}>پیگیری سفارش</h1>
        <div className="card" style={{ padding: 24 }}>
          <form onSubmit={submit}>
            <div className="field"><label>کد پیگیری *</label>
              <input className="input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="مثل MH-100231" dir="ltr" style={{ textAlign: 'right' }} />
            </div>
            <div className="field"><label>شماره موبایل (اختیاری)</label>
              <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09123456789" inputMode="numeric" />
            </div>
            <button className="btn btn-gold btn-block" type="submit">پیگیری</button>
          </form>
          <p style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 0 }}>کد نمونه برای تست: <b dir="ltr">MH-100231</b></p>
        </div>

        {searched && !found && (
          <div style={{ marginTop: 16 }}><Empty title="سفارشی یافت نشد" text="کد پیگیری و شماره موبایل را بررسی کنید." /></div>
        )}
        {found && (
          <div className="card" style={{ padding: 24, marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <b dir="ltr" style={{ fontSize: 17 }}>{found.code}</b>
              <span className="badge badge-gold">{ORDER_STATUS_FA[found.status]}</span>
            </div>
            <div className="status-timeline">
              {['ثبت سفارش', 'پردازش', 'ارسال', 'تحویل'].map((s, i) => (
                <div key={s} className={found.status === 'cancelled' ? '' : stepIdx >= i ? 'done' : ''}>{s}</div>
              ))}
            </div>
            {found.status === 'cancelled' && <p style={{ color: 'var(--error)', fontWeight: 700 }}>این سفارش لغو شده است.</p>}
            <div style={{ marginTop: 16, fontSize: 14 }}>
              <div className="summary-row"><span>گیرنده</span><span>{found.customerName}</span></div>
              <div className="summary-row"><span>تاریخ ثبت</span><span>{faDate(found.createdAt)}</span></div>
              <div className="summary-row"><span>روش ارسال</span><span>{found.shippingMethod}</span></div>
              <div className="summary-row"><span>مبلغ</span><span>{toman(found.total)}</span></div>
            </div>
            <div style={{ marginTop: 12 }}>
              {found.items.map((it, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8, fontSize: 13.5 }}>
                  <img src={it.image} alt="" style={{ width: 44, height: 44, borderRadius: 9, objectFit: 'cover' }} />
                  <span style={{ flex: 1 }}>{it.name} <b>× {faNum(it.qty)}</b></span>
                </div>
              ))}
            </div>
            <Link className="btn btn-outline btn-block" style={{ marginTop: 10 }} to="/contact">نیاز به کمک؟ تماس با پشتیبانی</Link>
          </div>
        )}
      </div>
    </div>
  );
}
