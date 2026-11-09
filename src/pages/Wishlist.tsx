import { Link } from 'react-router-dom';
import { ShoppingCart, Trash2 } from 'lucide-react';
import { useDB } from '../services/db';
import { useShop } from '../services/shop';
import { useToast } from '../services/toast';
import { finalPrice } from '../models/types';
import { faNum, toman } from '../services/format';
import { Breadcrumb, Empty } from '../components/ui';

export default function Wishlist() {
  const { db } = useDB();
  const { wishlist, toggleWishlist, addToCart } = useShop();
  const { toast } = useToast();
  const items = db.products.filter((p) => wishlist.includes(p.id) && p.status === 'published');

  return (
    <div className="container page">
      <Breadcrumb items={[{ label: 'علاقه‌مندی‌ها' }]} />
      <h1 style={{ fontSize: 24 }}>علاقه‌مندی‌ها {items.length > 0 && <span style={{ color: 'var(--muted)', fontSize: 15 }}>({faNum(items.length)})</span>}</h1>
      {items.length === 0 ? (
        <Empty title="لیست علاقه‌مندی خالی است" text="با زدن قلب روی هر کالا، آن را اینجا ذخیره کنید." action={<Link className="btn btn-gold" to="/shop">مشاهده فروشگاه</Link>} />
      ) : (
        <div>
          {items.map((p) => (
            <div className="cart-item" key={p.id}>
              <Link to={`/product/${p.slug}`}><img src={p.image} alt={p.name} /></Link>
              <div>
                <Link to={`/product/${p.slug}`}><h3>{p.name}</h3></Link>
                <div className="cprice">{toman(finalPrice(p))}</div>
              </div>
              <div className="left">
                <button className="btn btn-dark btn-sm" disabled={p.stock <= 0 || p.variations.length > 0} onClick={() => {
                  if (p.variations.length > 0) { toast('این کالا گزینه انتخابی دارد؛ وارد صفحه کالا شوید.', 'info'); return; }
                  addToCart(p.id, '', '');
                  toast('به سبد اضافه شد.');
                }}>
                  <ShoppingCart size={15} /> انتقال به سبد
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => { toggleWishlist(p.id); toast('از علاقه‌مندی‌ها حذف شد.', 'info'); }}>
                  <Trash2 size={15} /> حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
