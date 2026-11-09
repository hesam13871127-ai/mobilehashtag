import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { useDB } from '../services/db';
import { useShop } from '../services/shop';
import { useToast } from '../services/toast';
import { finalPrice } from '../models/types';
import { faNum, toman, uid } from '../services/format';
import { Breadcrumb, Empty } from '../components/ui';
import { cartTotals } from './Cart';

export default function Checkout() {
  const { db, save } = useDB();
  const { cart, clearCart, user } = useShop();
  const { toast } = useToast();
  const nav = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [postal, setPostal] = useState('');
  const [note, setNote] = useState('');
  const [ship, setShip] = useState('پست پیشتاز');
  const [pay, setPay] = useState('پرداخت آنلاین (نمایشی)');
  const [doneCode, setDoneCode] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const t = useMemo(() => cartTotals(db, cart), [db, cart]);
  const shipCost = ship === 'تحویل حضوری' ? 0 : t.shipping;
  const total = t.subtotal + shipCost;

  if (doneCode) {
    return (
      <div className="container page">
        <div className="card order-success">
          <div className="ok"><CheckCircle2 size={46} /></div>
          <h1>سفارش شما با موفقیت ثبت شد!</h1>
          <p style={{ color: 'var(--muted)' }}>کد پیگیری سفارش:</p>
          <div className="order-code" dir="ltr">{doneCode}</div>
          <p style={{ fontSize: 14 }}>همکاران ما به‌زودی برای هماهنگی ارسال با شما تماس می‌گیرند.</p>
          <div className="demo-note" style={{ maxWidth: 520, margin: '14px auto' }}>
            حالت نمایشی: در این نسخه، پرداخت واقعی انجام نمی‌شود و سفارش فقط در همین مرورگر ذخیره می‌گردد.
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link className="btn btn-gold" to={`/track-order?code=${doneCode}`}>پیگیری سفارش</Link>
            <Link className="btn btn-outline" to="/shop">بازگشت به فروشگاه</Link>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="container page">
        <Breadcrumb items={[{ label: 'تسویه حساب' }]} />
        <Empty title="سبد خرید خالی است" text="برای ثبت سفارش ابتدا کالایی به سبد اضافه کنید." action={<Link className="btn btn-gold" to="/shop">مشاهده فروشگاه</Link>} />
      </div>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (name.trim().length < 3) er.name = 'نام کامل را وارد کنید.';
    if (!/^09\d{9}$/.test(phone.trim())) er.phone = 'شماره موبایل معتبر وارد کنید (مثل 09123456789).';
    if (ship !== 'تحویل حضوری') {
      if (!city.trim()) er.city = 'شهر را وارد کنید.';
      if (address.trim().length < 8) er.address = 'نشانی کامل را وارد کنید.';
      if (!/^\d{10}$/.test(postal.trim())) er.postal = 'کد پستی ۱۰ رقمی وارد کنید.';
    }
    setErrors(er);
    if (Object.keys(er).length) { toast('لطفاً خطاهای فرم را برطرف کنید.', 'error'); return; }

    const items = cart.map((i) => {
      const p = db.products.find((x) => x.id === i.productId);
      let delta = 0;
      if (p && i.variantKey) {
        for (const oid of i.variantKey.split('|'))
          for (const v of p.variations) {
            const o = v.options.find((x) => x.id === oid);
            if (o) delta += o.priceDelta;
          }
      }
      return {
        productId: i.productId, name: p?.name || 'کالا', image: p?.image || '',
        variantLabel: i.variantLabel || undefined, price: p ? finalPrice(p, delta) : 0, qty: i.qty,
      };
    });
    const code = 'MH-' + (100236 + db.orders.length);
    save('orders', {
      id: uid('ord'), code, customerName: name.trim(), phone: phone.trim(), city: city.trim(),
      address: address.trim(), postalCode: postal.trim(), items,
      subtotal: t.subtotal, discount: 0, shipping: shipCost, total,
      shippingMethod: ship, paymentMethod: pay, status: 'pending', note: note.trim(),
      createdAt: new Date().toISOString(),
    });
    // decrement stock + increment sold
    for (const i of cart) {
      const p = db.products.find((x) => x.id === i.productId);
      if (p) save('products', { ...p, stock: Math.max(0, p.stock - i.qty), soldCount: p.soldCount + i.qty });
    }
    clearCart();
    setDoneCode(code);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="container page">
      <Breadcrumb items={[{ label: 'سبد خرید', to: '/cart' }, { label: 'تسویه حساب' }]} />
      <h1 style={{ fontSize: 24 }}>تسویه حساب</h1>
      <div className="co-steps">
        <div className="co-step on">۱. اطلاعات ارسال</div>
        <div className="co-step on">۲. روش ارسال و پرداخت</div>
        <div className="co-step">۳. ثبت سفارش</div>
      </div>
      <div className="demo-note">حالت نمایشی: درگاه پرداخت واقعی متصل نیست؛ سفارش به‌صورت نمایشی ثبت و در همین مرورگر ذخیره می‌شود.</div>
      <form onSubmit={submit}>
        <div className="co-layout">
          <div>
            <div className="card" style={{ padding: 22, marginBottom: 16 }}>
              <h3 style={{ marginTop: 0 }}>مشخصات گیرنده</h3>
              <div className="form-grid">
                <div className="field"><label>نام و نام خانوادگی *</label>
                  <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="مثلاً علی رضایی" />
                  {errors.name && <span className="field-err">{errors.name}</span>}
                </div>
                <div className="field"><label>شماره موبایل *</label>
                  <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09123456789" inputMode="numeric" dir="ltr" style={{ textAlign: 'right' }} />
                  {errors.phone && <span className="field-err">{errors.phone}</span>}
                </div>
              </div>
              <div className="form-grid">
                <div className="field"><label>شهر *</label>
                  <input className="input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="تهران" />
                  {errors.city && <span className="field-err">{errors.city}</span>}
                </div>
                <div className="field"><label>کد پستی *</label>
                  <input className="input" value={postal} onChange={(e) => setPostal(e.target.value)} placeholder="۱۰ رقمی" inputMode="numeric" />
                  {errors.postal && <span className="field-err">{errors.postal}</span>}
                </div>
              </div>
              <div className="field"><label>نشانی کامل *</label>
                <textarea className="textarea" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="خیابان، کوچه، پلاک، واحد..." style={{ minHeight: 70 }} />
                {errors.address && <span className="field-err">{errors.address}</span>}
              </div>
              <div className="field"><label>توضیحات سفارش (اختیاری)</label>
                <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="مثلاً: قبل از ارسال تماس بگیرید" />
              </div>
            </div>

            <div className="card" style={{ padding: 22, marginBottom: 16 }}>
              <h3 style={{ marginTop: 0 }}>روش ارسال</h3>
              <div className="ship-opts">
                {[['پست پیشتاز', t.shipping], ['تیپاکس', t.shipping], ['تحویل حضوری', 0]].map(([m, c]) => (
                  <label key={m as string} className={`ship-opt${ship === m ? ' on' : ''}`}>
                    <input type="radio" name="ship" checked={ship === m} onChange={() => setShip(m as string)} />
                    <span>{m}</span>
                    <span className="pr">{(c as number) === 0 ? <span className="free" style={{ color: 'var(--success)' }}>رایگان</span> : toman(c as number)}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="card" style={{ padding: 22 }}>
              <h3 style={{ marginTop: 0 }}>روش پرداخت</h3>
              <div className="pay-opts">
                {['پرداخت آنلاین (نمایشی)', 'پرداخت در محل (نمایشی)', 'کارت به کارت (نمایشی)'].map((m) => (
                  <label key={m} className={`ship-opt${pay === m ? ' on' : ''}`}>
                    <input type="radio" name="pay" checked={pay === m} onChange={() => setPay(m)} />
                    <span>{m}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <aside className="cart-summary">
            <h3 style={{ marginTop: 0 }}>خلاصه سفارش ({faNum(t.count)} کالا)</h3>
            {cart.map((i) => {
              const p = db.products.find((x) => x.id === i.productId);
              return p ? (
                <div key={i.productId + i.variantKey} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10, fontSize: 13 }}>
                  <img src={p.image} alt="" style={{ width: 46, height: 46, borderRadius: 9, objectFit: 'cover' }} />
                  <span style={{ flex: 1 }}>{p.name} <b>× {faNum(i.qty)}</b></span>
                </div>
              ) : null;
            })}
            <div className="summary-row"><span>جمع کالاها</span><span>{toman(t.subtotal)}</span></div>
            <div className="summary-row"><span>هزینه ارسال</span><span>{shipCost === 0 ? 'رایگان' : toman(shipCost)}</span></div>
            <div className="summary-row total"><span>مبلغ قابل پرداخت</span><span>{toman(total)}</span></div>
            <button className="btn btn-gold btn-block" style={{ marginTop: 14 }} type="submit">ثبت سفارش</button>
            <button className="btn btn-ghost btn-block" type="button" onClick={() => nav('/cart')}>بازگشت به سبد</button>
          </aside>
        </div>
      </form>
    </div>
  );
}
