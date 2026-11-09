import { useState } from 'react';
import { useDB } from '../services/db';
import { useToast } from '../services/toast';
import { AdminHead } from './ui';

export default function AdminSettings() {
  const { db, updateSettings } = useDB();
  const { toast } = useToast();
  const [f, setF] = useState({ ...db.settings });
  const set = (p: Partial<typeof f>) => setF({ ...f, ...p });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.phone.trim()) { toast('تلفن فروشگاه را وارد کنید.', 'error'); return; }
    updateSettings(f);
    toast('تنظیمات فروشگاه ذخیره شد.');
  };

  return (
    <div>
      <AdminHead title="تنظیمات فروشگاه" sub="اطلاعات تماس و هزینه ارسال" />
      <form onSubmit={submit}>
        <div className="form-card">
          <h3>اطلاعات تماس</h3>
          <div className="form-grid">
            <div className="field"><label>تلفن پشتیبانی *</label>
              <input className="input" value={f.phone} onChange={(e) => set({ phone: e.target.value })} />
            </div>
            <div className="field"><label>ایمیل</label>
              <input className="input" value={f.email} onChange={(e) => set({ email: e.target.value })} dir="ltr" />
            </div>
          </div>
          <div className="field"><label>نشانی فروشگاه</label>
            <textarea className="textarea" style={{ minHeight: 60 }} value={f.address} onChange={(e) => set({ address: e.target.value })} />
          </div>
        </div>
        <div className="form-card">
          <h3>هزینه ارسال</h3>
          <div className="form-grid">
            <div className="field"><label>هزینه پایه ارسال (تومان)</label>
              <input className="input" type="number" min={0} value={f.shippingBase} onChange={(e) => set({ shippingBase: Number(e.target.value) })} />
            </div>
            <div className="field"><label>سقف ارسال رایگان (تومان)</label>
              <input className="input" type="number" min={0} value={f.freeShippingOver} onChange={(e) => set({ freeShippingOver: Number(e.target.value) })} />
            </div>
          </div>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>سفارش‌هایی که جمع آن‌ها از سقف ارسال رایگان بیشتر باشد، هزینه ارسال ندارند.</p>
        </div>
        <button className="btn btn-gold" type="submit">ذخیره تنظیمات</button>
      </form>
    </div>
  );
}
