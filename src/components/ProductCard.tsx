import { Link } from 'react-router-dom';
import { Heart, ShoppingCart } from 'lucide-react';
import type { Product } from '../models/types';
import { discountPercent, finalPrice, hasDiscount } from '../models/types';
import { faNum } from '../services/format';
import { useShop } from '../services/shop';
import { useToast } from '../services/toast';
import { useDB } from '../services/db';
import { Stars, Countdown } from './ui';

export default function ProductCard({ p }: { p: Product }) {
  const { addToCart, wishlist, toggleWishlist } = useShop();
  const { toast } = useToast();
  const { db } = useDB();
  const wished = wishlist.includes(p.id);
  const brand = db.brands.find((b) => b.id === p.brandId);

  const add = () => {
    if (p.stock <= 0) {
      toast('این کالا ناموجود است.', 'error');
      return;
    }
    const needsVariant = p.variations.length > 0;
    if (needsVariant) {
      toast('لطفاً ابتدا گزینه‌های کالا را انتخاب کنید.', 'info');
      return;
    }
    addToCart(p.id, '', '');
    toast(`${p.name} به سبد اضافه شد.`);
  };

  return (
    <article className="pcard">
      <div className="pcard-media">
        <Link to={`/product/${p.slug}`} aria-label={p.name}>
          <img src={p.image} alt={p.name} loading="lazy" />
        </Link>
        <div className="pcard-badges">
          {hasDiscount(p) && <span className="badge badge-off">{faNum(discountPercent(p))}٪</span>}
          {p.isNew && <span className="badge badge-new">جدید</span>}
        </div>
        <button
          className={`wish-btn${wished ? ' on' : ''}`}
          onClick={() => {
            const added = toggleWishlist(p.id);
            toast(added ? 'به علاقه‌مندی‌ها اضافه شد.' : 'از علاقه‌مندی‌ها حذف شد.', added ? 'success' : 'info');
          }}
          aria-label="افزودن به علاقه‌مندی‌ها"
        >
          <Heart size={17} />
        </button>
      </div>
      <div className="pcard-body">
        {brand && <span className="pcard-brand">{brand.name}</span>}
        <Link className="pcard-title" to={`/product/${p.slug}`}>{p.name}</Link>
        <div className="pcard-rating">
          <Stars rating={p.rating} />
          <span>({faNum(p.ratingCount)})</span>
        </div>
        <div className="pcard-price">
          {hasDiscount(p) && <span className="old">{faNum(p.regularPrice)}</span>}
          <span className="new">{faNum(finalPrice(p))}</span>
          <span className="unit">تومان</span>
        </div>
        {p.offerEndsAt && <Countdown endsAt={p.offerEndsAt} />}
        <button className="btn btn-dark btn-sm pcard-add" onClick={add} disabled={p.stock <= 0}>
          <ShoppingCart size={15} /> {p.stock <= 0 ? 'ناموجود' : 'افزودن به سبد'}
        </button>
      </div>
    </article>
  );
}
