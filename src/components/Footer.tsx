import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Send, Phone, Play, Mail, MapPin, ShieldCheck } from 'lucide-react';
import { useDB } from '../services/db';
import { useToast } from '../services/toast';

export default function Footer() {
  const { db } = useDB();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const s = db.settings;
  const mains = db.categories.filter((c) => !c.parentId && c.visible).sort((a, b) => a.order - b.order).slice(0, 6);

  const subscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      toast('لطفاً یک ایمیل معتبر وارد کنید.', 'error');
      return;
    }
    setEmail('');
    toast('عضویت شما در خبرنامه ثبت شد. سپاس!');
  };

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-about">
            <img src={s.logoWhite} alt="موبایل هشتگ" />
            <p>{s.footerAbout}</p>
            <div className="socials">
              <a href={s.instagram} target="_blank" rel="noreferrer" aria-label="اینستاگرام"><Camera size={18} /></a>
              <a href={s.telegram} target="_blank" rel="noreferrer" aria-label="تلگرام"><Send size={18} /></a>
              <a href={s.whatsapp} target="_blank" rel="noreferrer" aria-label="واتساپ"><Phone size={18} /></a>
              <a href={s.aparat} target="_blank" rel="noreferrer" aria-label="آپارات"><Play size={18} /></a>
            </div>
          </div>
          <div className="footer-col">
            <h4>خدمات مشتریان</h4>
            <Link to="/track-order">پیگیری سفارش</Link>
            <Link to="/faq">سوالات متداول</Link>
            <Link to="/terms">شرایط بازگشت کالا</Link>
            <Link to="/contact">تماس با ما</Link>
            <Link to="/about">درباره ما</Link>
          </div>
          <div className="footer-col">
            <h4>راهنمای خرید</h4>
            <Link to="/shop">فروشگاه</Link>
            <Link to="/offers">تخفیف‌ها</Link>
            <Link to="/bestsellers">پرفروش‌ترین‌ها</Link>
            <Link to="/blog">مجله موبایل هشتگ</Link>
            <Link to="/privacy">حریم خصوصی</Link>
          </div>
          <div>
            <h4>دسته‌بندی محصولات</h4>
            <div className="footer-col">
              {mains.map((c) => (
                <Link key={c.id} to={`/category/${c.slug}`}>{c.name}</Link>
              ))}
            </div>
          </div>
        </div>
        <div className="footer-grid" style={{ paddingTop: 0, gridTemplateColumns: '1fr 1fr' }}>
          <div className="footer-contact">
            <h4>ارتباط با ما</h4>
            <div><Phone size={16} /> {s.phone}</div>
            <div><Mail size={16} /> {s.email}</div>
            <div><MapPin size={16} /> {s.address}</div>
          </div>
          <div>
            <h4>عضویت در خبرنامه</h4>
            <form className="newsletter-box" onSubmit={subscribe}>
              <input className="input" type="email" placeholder="ایمیل شما" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="ایمیل" />
              <button className="btn btn-gold" type="submit">عضویت</button>
            </form>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} موبایل هشتگ — تمامی حقوق محفوظ است.</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <ShieldCheck size={15} /> {s.trustNote}
          </span>
        </div>
      </div>
    </footer>
  );
}
