import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { useDB } from '../services/db';
import { useShop } from '../services/shop';
import { finalPrice } from '../models/types';
import { faNum, toman } from '../services/format';
import { Breadcrumb, Empty, QtyInput } from '../components/ui';

export function cartTotals(db: ReturnType<typeof useDB>['db'], cart: ReturnType<typeof useShop>['cart']) {
  let subtotal = 0, count = 0;
  for (const i of cart) {
    const p = db.products.find((x) => x.id === i.productId);
    if (!p) continue;
    const delta = i.variantKey ? i.variantKey.split('|').reduce((s, oid) => {
      for (const v of p.variations) {
        const o = v.options.find((x) => x.id === oid);
        if (o) s += o.priceDelta;
      }
      return s;
    }, 0) : 0;
    subtotal += finalPrice(p, delta) * i.qty;
    count += i.qty;
  }
  const shipping = subtotal === 0 || subtotal >= db.settings.freeShippingOver ? 0 : db.settings.shippingBase;
  return { subtotal, shipping, total: subtotal + shipping, count };
}

export default function Cart() {
  const { db } = useDB();
  const { cart, setQty, removeFromCart, clearCart } = useShop();
  const t = useMemo(() => cartTotals(db, cart), [db, cart]);

  const lines = cart.map((i) => {
    const p = db.products.find((x) => x.id === i.productId);
    return { i, p };
  }).filter((x) => x.p);

  return (
    <div className="container page">
      <Breadcrumb items={[{ label: 'سبد خرید' }]} />
      <h1 style={{ fontSize: 24 }}>سبد خرید {t.count > 0 && <span style={{ color: 'var(--muted)', fontSize: 15 }}>({faNum(t.count)} کالا)</span>}</h1>
      {lines.length === 0 ? (
        <Empty title="سبد خرید شما خالی است" text="می‌توانید برای مشاهده کالاها به فروشگاه بروید." action={<Link className="btn btn-gold" to="/shop">ادامه خرید</Link>} />
      ) : (
        <div className="cart-layout">
          <div>
            {lines.map(({ i, p }) => p && (
              <div className="cart-item" key={i.productId + i.variantKey}>
                <Link to={`/product/${p.slug}`}><img src={p.image} alt={p.name} /></Link>
                <div>
                  <Link to={`/product/${p.slug}`}><h3>{p.name}</h3></Link>
                  {i.variantLabel && <div className="variant">{i.variantLabel}</div>}
                  <div className="cprice">{toman(linePrice(db, i.productId, i.variantKey) * i.qty)}</div>
                  {i.qty > 1 && <div className="variant">واحدی {toman(linePrice(db, i.productId, i.variantKey))}</div>}
                </div>
                <div className="left">
                  <QtyInput small value={i.qty} onChange={(v) => setQty(i.productId, i.variantKey, v)} />
                  <button className="btn btn-ghost btn-sm" onClick={() => removeFromCart(i.productId, i.variantKey)} aria-label="حذف">
                    <Trash2 size={16} /> حذف
                  </button>
                </div>
              </div>
            ))}
            <button className="btn btn-ghost btn-sm" onClick={clearCart}>خالی کردن سبد</button>
          </div>
          <aside className="cart-summary">
            <h3 style={{ marginTop: 0 }}>خلاصه سفارش</h3>
            <div className="summary-row"><span>جمع کالاها</span><span>{toman(t.subtotal)}</span></div>
            <div className="summary-row"><span>هزینه ارسال</span>
              <span>{t.shipping === 0 ? <span className="free">رایگان</span> : toman(t.shipping)}</span>
            </div>
            {t.shipping > 0 && (
              <p style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                با {toman(db.settings.freeShippingOver - t.subtotal)} خرید بیشتر، ارسال رایگان می‌شود.
              </p>
            )}
            <div className="summary-row total"><span>مبلغ قابل پرداخت</span><span>{toman(t.total)}</span></div>
            <Link className="btn btn-gold btn-block" style={{ marginTop: 14 }} to="/checkout">ادامه و تسویه حساب</Link>
            <Link className="btn btn-outline btn-block" style={{ marginTop: 8 }} to="/shop">ادامه خرید</Link>
          </aside>
        </div>
      )}
    </div>
  );
}

function linePrice(db: ReturnType<typeof useDB>['db'], productId: string, variantKey: string): number {
  const p = db.products.find((x) => x.id === productId);
  if (!p) return 0;
  let delta = 0;
  if (variantKey) {
    for (const oid of variantKey.split('|')) {
      for (const v of p.variations) {
        const o = v.options.find((x) => x.id === oid);
        if (o) delta += o.priceDelta;
      }
    }
  }
  return finalPrice(p, delta);
}
