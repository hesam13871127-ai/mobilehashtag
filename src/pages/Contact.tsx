import { useState } from 'react';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import { useDB } from '../services/db';
import { useToast } from '../services/toast';
import { Breadcrumb } from '../components/ui';

export default function Contact() {
  const { db } = useDB();
  const { toast } = useToast();
  const s = db.settings;
  const [f, setF] = useState({ name: '', phone: '', subject: 'سوال درباره سفارش', text: '' });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (f.name.trim().length < 3) { toast('نام خود را وارد کنید.', 'error'); return; }
    if (!/^09\d{9}$/.test(f.phone.trim())) { toast('شماره موبایل معتبر وارد کنید.', 'error'); return; }
    if (f.text.trim().length < 5) { toast('متن پیام را بنویسید.', 'error'); return; }
    setF({ name: '', phone: '', subject: 'سوال درباره سفارش', text: '' });
    toast('پیام شما ثبت شد؛ کارشناسان ما به‌زودی تماس می‌گیرند.');
  };

  return (
    <div className="container page">
      <Breadcrumb items={[{ label: 'تماس با ما' }]} />
      <h1 style={{ fontSize: 24 }}>تماس با موبایل هشتگ</h1>
      <div className="contact-grid" style={{ marginTop: 16 }}>
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ marginTop: 0 }}>اطلاعات تماس</h3>
          <div className="info-rows">
            <div><Phone size={18} color="var(--gold-dark)" /> <span><b>تلفن پشتیبانی:</b> <span dir="ltr">{s.phone}</span></span></div>
            <div><Mail size={18} color="var(--gold-dark)" /> <span><b>ایمیل:</b> {s.email}</span></div>
            <div><MapPin size={18} color="var(--gold-dark)" /> <span><b>نشانی:</b> {s.address}</span></div>
            <div style={{ border: 'none' }}><Clock size={18} color="var(--gold-dark)" /> <span><b>ساعات پاسخگویی:</b> همه‌روزه ۹ صبح تا ۹ شب</span></div>
          </div>
          <div className="socials" style={{ marginTop: 16 }}>
            <a href={s.instagram} target="_blank" rel="noreferrer">اینستاگرام</a>
            <a href={s.telegram} target="_blank" rel="noreferrer">تلگرام</a>
            <a href={s.whatsapp} target="_blank" rel="noreferrer">واتساپ</a>
          </div>
        </div>
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ marginTop: 0 }}>ارسال پیام</h3>
          <form onSubmit={submit}>
            <div className="form-grid">
              <div className="field"><label>نام شما *</label>
                <input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
              </div>
              <div className="field"><label>شماره موبایل *</label>
                <input className="input" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} inputMode="numeric" />
              </div>
            </div>
            <div className="field"><label>موضوع</label>
              <select className="select" value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })}>
                <option>سوال درباره سفارش</option>
                <option>مشاوره خرید</option>
                <option>پیگیری مرجوعی</option>
                <option>همکاری تجاری</option>
                <option>سایر</option>
              </select>
            </div>
            <div className="field"><label>متن پیام *</label>
              <textarea className="textarea" value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} />
            </div>
            <button className="btn btn-gold" type="submit">ارسال پیام</button>
          </form>
        </div>
      </div>
    </div>
  );
}
