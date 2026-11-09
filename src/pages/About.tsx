import { Link } from 'react-router-dom';
import { ShieldCheck, Truck, Headset, BadgeCheck } from 'lucide-react';
import { useDB } from '../services/db';
import { Breadcrumb } from '../components/ui';

export default function About() {
  const { db } = useDB();
  return (
    <div className="container page">
      <Breadcrumb items={[{ label: 'درباره ما' }]} />
      <div className="about-hero">
        <h1>درباره موبایل هشتگ</h1>
        <p>فروشگاه تخصصی گوشی موبایل و لوازم جانبی؛ با مأموریت ارائه کالای ۱۰۰٪ اورجینال، قیمت منصفانه و تجربه خریدی لذت‌بخش.</p>
      </div>
      <div className="card" style={{ padding: 28 }}>
        <div className="prose">
          موبایل هشتگ از سال ۱۳۹۸ با یک فروشگاه کوچک در پاساژ علاءالدین تهران شروع به کار کرد و امروز با هزاران مشتری در سراسر کشور، یکی از معتبرترین فروشگاه‌های آنلاین موبایل است.
          {'\n\n'}
          ما مستقیماً با واردکنندگان رسمی و نمایندگی‌های برندهای اپل، سامسونگ، شیائومی، انکر و بیسوس همکاری می‌کنیم تا اصالت همه کالاها تضمین شود.
          {'\n\n'}
          تیم پشتیبانی ما همه‌روزه از ساعت ۹ صبح تا ۹ شب پاسخگوی شماست؛ چون باور داریم فروش، شروع رابطه ماست نه پایان آن.
        </div>
      </div>
      <div className="why-grid" style={{ marginTop: 20 }}>
        {[
          { icon: <ShieldCheck size={26} />, t: 'ضمانت اصالت', d: '۷ روز ضمانت بازگشت' },
          { icon: <Truck size={26} />, t: 'ارسال سریع', d: 'به سراسر کشور' },
          { icon: <Headset size={26} />, t: 'پشتیبانی', d: db.settings.phone },
          { icon: <BadgeCheck size={26} />, t: 'گارانتی معتبر', d: '۱۸ ماهه شرکتی' },
        ].map((w, i) => (
          <div key={i} className="why-item"><div className="ic">{w.icon}</div><h4>{w.t}</h4><p>{w.d}</p></div>
        ))}
      </div>
      <div style={{ textAlign: 'center', marginTop: 26 }}>
        <Link className="btn btn-gold" to="/shop">شروع خرید از موبایل هشتگ</Link>
      </div>
    </div>
  );
}
