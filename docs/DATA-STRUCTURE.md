# ساختار داده + نگاشت ووکامرس

مدل‌ها در `src/models/types.ts` تعریف شده‌اند و عامدانه ۱:۱ با مفاهیم ووکامرس/وردپرس هم‌خوان‌اند.

## موجودیت‌ها

| موجودیت | فیلدهای کلیدی | معادل ووکامرس/وردپرس |
|---|---|---|
| `Product` | id, name, slug, sku, brandId, categoryIds, shortDesc, fullDesc, regularPrice, salePrice, stock, image, gallery, attributes, variations, specs, weight, dimensions, featured, status | WooCommerce Product |
| `Category` | id, name, slug, description, image, parentId, order, visible | Product Category (سلسله‌مراتبی) |
| `Brand` | id, name, slug, logo, description, visible | Taxonomy اختصاصی `brand` |
| `Variation/Option` | name, options(label, priceDelta, stock) | Product Attributes + Variations |
| `Banner` | title, subtitle, buttonText, url, art, images, theme, placement(hero/promo/category/shop), order, enabled, dates | Custom Post Type `banner` یا Theme Options |
| `HomeSection` | key, title, subtitle, enabled, order, config | Theme Options / Customizer |
| `Order/OrderItem` | code, customer, address, items(price×qty), subtotal, shipping, total, shippingMethod, paymentMethod, status | WooCommerce Order |
| `Customer/Address` | name, phone, email, addresses | WP User + meta |
| `Review` | productId, author, rating, text, status | WP Comments (نوع review) |
| `Article` | title, slug, excerpt, body, image, tags, published | WP Post |
| `User` | name, phone, email, role(admin/customer) | WP User + role |
| `Settings` | storeName, phone, address, socials, shippingBase, freeShippingOver, colors, logo | Customizer / Options |

## قواعد

- قیمت‌ها به **تومان** (عدد صحیح)؛ `finalPrice = salePrice ?? regularPrice + variantDelta`.
- `offerEndsAt` فقط وقتی شمارش معکوس نمایش می‌دهد که واقعاً ست شده باشد.
- `stock <= 0` یعنی ناموجود؛ دکمه خرید غیرفعال می‌شود.
- `status: draft` محصول را از فروشگاه مخفی می‌کند ولی در پنل می‌ماند.
- اسلاگ‌ها یکتا هستند (تست خودکار تضمین می‌کند).

## نمونه رکورد محصول (خلاصه)

```json
{
  "id": "p1",
  "name": "گوشی موبایل اپل iPhone 17 Pro ظرفیت 256 گیگابایت",
  "slug": "iphone-17-pro",
  "sku": "MH-IP17P-256",
  "brandId": "apple",
  "categoryIds": ["m-mobile", "s-apple", "s-flagship"],
  "regularPrice": 128000000,
  "salePrice": 121500000,
  "stock": 14,
  "image": "/images/products/iphone-17-pro.svg",
  "variations": [{ "name": "ظرفیت حافظه", "options": [{ "label": "512 گیگ", "priceDelta": 14000000 }] }]
}
```
