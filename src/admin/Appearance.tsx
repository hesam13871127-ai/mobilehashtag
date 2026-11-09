import { useState } from 'react';
import { useDB } from '../services/db';
import { useToast } from '../services/toast';
import { AdminHead, ImageField } from './ui';

export default function AdminAppearance() {
  const { db, updateSettings, resetAll } = useDB();
  const { toast } = useToast();
  const s = db.settings;
  const [f, setF] = useState({ ...s });
  const set = (p: Partial<typeof s>) => setF({ ...f, ...p });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(f);
    toast('تنظیمات قالب ذخیره و در فروشگاه اعمال شد.');
  };

  return (
    <div>
      <AdminHead title="تنظیمات قالب" sub="لوگو، رنگ‌ها، سربرگ و پاصفحه" />
      <form onSubmit={submit}>
        <div className="form-card">
          <h3>هویت بصری</h3>
          <div className="form-grid">
            <div className="field"><label>نام فروشگاه</label>
              <input className="input" value={f.storeName} onChange={(e) => set({ storeName: e.target.value })} />
            </div>
            <div className="field"><label>نام انگلیسی</label>
              <input className="input" value={f.storeEn} onChange={(e) => set({ storeEn: e.target.value })} dir="ltr" />
            </div>
          </div>
          <div className="form-grid">
            <ImageField label="لوگو (پس‌زمینه روشن)" value={f.logo} onChange={(v) => set({ logo: v })} />
            <ImageField label="لوگوی پاصفحه (پس‌زمینه تیره)" value={f.logoWhite} onChange={(v) => set({ logoWhite: v })} />
          </div>
          <ImageField label="فاوآیکون" value={f.favicon} onChange={(v) => set({ favicon: v })} />
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <div className="color-row">
              <input type="color" value={f.primaryColor} onChange={(e) => set({ primaryColor: e.target.value })} aria-label="رنگ اصلی" />
              <small>رنگ اصلی (طلایی)</small>
            </div>
            <div className="color-row">
              <input type="color" value={f.secondaryColor} onChange={(e) => set({ secondaryColor: e.target.value })} aria-label="رنگ دوم" />
              <small>رنگ دوم (تیره)</small>
            </div>
          </div>
        </div>

        <div className="form-card">
          <h3>نوار اطلاع‌رسانی بالای سایت</h3>
          <div className="field"><label>متن اطلاع‌رسانی</label>
            <input className="input" value={f.announcement} onChange={(e) => set({ announcement: e.target.value })} />
          </div>
          <label className="check">
            <input type="checkbox" checked={f.announcementEnabled} onChange={(e) => set({ announcementEnabled: e.target.checked })} /> نمایش نوار اطلاع‌رسانی
          </label>
        </div>

        <div className="form-card">
          <h3>پاصفحه و شبکه‌های اجتماعی</h3>
          <div className="field"><label>متن درباره فروشگاه (پاصفحه)</label>
            <textarea className="textarea" style={{ minHeight: 70 }} value={f.footerAbout} onChange={(e) => set({ footerAbout: e.target.value })} />
          </div>
          <div className="form-grid">
            <div className="field"><label>اینستاگرام</label>
              <input className="input" value={f.instagram} onChange={(e) => set({ instagram: e.target.value })} dir="ltr" />
            </div>
            <div className="field"><label>تلگرام</label>
              <input className="input" value={f.telegram} onChange={(e) => set({ telegram: e.target.value })} dir="ltr" />
            </div>
            <div className="field"><label>واتساپ</label>
              <input className="input" value={f.whatsapp} onChange={(e) => set({ whatsapp: e.target.value })} dir="ltr" />
            </div>
            <div className="field"><label>آپارات</label>
              <input className="input" value={f.aparat} onChange={(e) => set({ aparat: e.target.value })} dir="ltr" />
            </div>
          </div>
          <div className="field"><label>متن اعتماد (پاصفحه)</label>
            <input className="input" value={f.trustNote} onChange={(e) => set({ trustNote: e.target.value })} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-gold" type="submit">ذخیره تنظیمات قالب</button>
          <button className="btn btn-ghost" type="button" onClick={() => { if (window.confirm('همه تغییرات به حالت اولیه برگردد؟')) { resetAll(); setF({ ...db.settings }); toast('داده‌ها به حالت اولیه برگشت.', 'info'); } }}>
            بازنشانی کل داده‌های نمایشی
          </button>
        </div>
      </form>
    </div>
  );
}
