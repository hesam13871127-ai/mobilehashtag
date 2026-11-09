import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { Breadcrumb } from '../components/ui';

const FAQS = [
  { q: 'آیا کالاهای موبایل هشتگ اورجینال هستند؟', a: 'بله. همه کالاها ۱۰۰٪ اورجینال با گارانتی معتبر شرکتی عرضه می‌شوند و ۷ روز ضمانت بازگشت دارند.' },
  { q: 'هزینه و زمان ارسال چقدر است؟', a: 'سفارش‌های بالای ۲ میلیون تومان ارسال رایگان دارند. ارسال به تهران ۱ تا ۲ روز کاری و به شهرستان ۲ تا ۴ روز کاری زمان می‌برد.' },
  { q: 'آیا گوشی‌ها رجیستر شده هستند؟', a: 'بله. همه گوشی‌ها با کد رجیستری معتبر و قابل استعلام از سامانه همتا عرضه می‌شوند.' },
  { q: 'چطور سفارشم را پیگیری کنم؟', a: 'از صفحه «پیگیری سفارش» با وارد کردن کد پیگیری (مثل MH-100231) و شماره موبایل، وضعیت سفارش را ببینید.' },
  { q: 'شرایط مرجوعی کالا چیست؟', a: 'تا ۷ روز پس از تحویل، در صورت باز نشدن پلمپ، می‌توانید کالا را مرجوع کنید. هزینه بازگشت در صورت مغایرت با سفارش بر عهده ماست.' },
  { q: 'آیا امکان خرید حضوری وجود دارد؟', a: 'بله. فروشگاه حضوری ما در تهران، پاساژ علاءالدین، همه‌روزه از ۱۰ صبح تا ۹ شب پذیرای شماست.' },
  { q: 'چطور از تخفیف‌ها باخبر شوم؟', a: 'در خبرنامه سایت عضو شوید و صفحه اینستاگرام موبایل هشتگ را دنبال کنید.' },
  { q: 'گارانتی کالاها چگونه است؟', a: 'گوشی‌ها ۱۸ ماه گارانتی شرکتی و لوازم جانبی ۶ تا ۱۲ ماه گارانتی تعویض دارند.' },
];

export default function Faq() {
  const [q, setQ] = useState('');
  const list = FAQS.filter((f) => !q.trim() || f.q.includes(q.trim()) || f.a.includes(q.trim()));
  return (
    <div className="container page" style={{ maxWidth: 820 }}>
      <Breadcrumb items={[{ label: 'سوالات متداول' }]} />
      <h1 style={{ fontSize: 24 }}>سوالات متداول</h1>
      <input className="input" placeholder="جستجو در سوالات..." value={q} onChange={(e) => setQ(e.target.value)} style={{ margin: '10px 0 18px' }} aria-label="جستجو در سوالات" />
      {list.map((f, i) => (
        <details className="faq-item" key={i} open={i === 0}>
          <summary>{f.q} <ChevronDown size={18} /></summary>
          <div className="fa">{f.a}</div>
        </details>
      ))}
      {list.length === 0 && <p style={{ color: 'var(--muted)' }}>سوالی یافت نشد.</p>}
      <p style={{ marginTop: 20, fontSize: 14 }}>پاسخ خود را پیدا نکردید؟ <Link className="more-link" to="/contact">تماس با ما</Link></p>
    </div>
  );
}
