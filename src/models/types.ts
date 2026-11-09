/* Mobile Hashtag — domain models.
 * These models mirror WooCommerce concepts 1:1 (see docs/DATA-STRUCTURE.md)
 * so a future WordPress/WooCommerce theme can map them without redesign. */

export type PublishStatus = 'published' | 'draft';
export type StockStatus = 'instock' | 'outofstock' | 'onbackorder';

export interface VariationOption {
  id: string;
  label: string;
  priceDelta: number;
  stock: number;
}
export interface ProductVariation {
  id: string;
  name: string;
  options: VariationOption[];
}
export interface KeyValue {
  name: string;
  value: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  brandId: string;
  categoryIds: string[];
  shortDesc: string;
  fullDesc: string;
  regularPrice: number; // in Toman
  salePrice?: number; // in Toman
  stock: number;
  image: string;
  gallery: string[];
  attributes: KeyValue[];
  variations: ProductVariation[];
  specs: KeyValue[];
  weight?: string;
  dimensions?: string;
  featured?: boolean;
  isNew?: boolean;
  bestseller?: boolean;
  rating: number;
  ratingCount: number;
  soldCount: number;
  status: PublishStatus;
  offerEndsAt?: string; // ISO date — countdown only when set
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  parentId: string | null;
  order: number;
  visible: boolean;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string;
  description: string;
  visible: boolean;
}

export type BannerPlacement = 'hero' | 'promo' | 'category' | 'shop';
export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  buttonText: string;
  url: string;
  art: string; // product/library artwork shown on the banner
  bgImage: string; // optional uploaded background (desktop)
  mobileImage: string; // optional uploaded background (mobile)
  themeFrom: string;
  themeTo: string;
  themeAccent: string;
  placement: BannerPlacement;
  order: number;
  enabled: boolean;
  startsAt?: string;
  endsAt?: string;
}

export interface HomeSection {
  id: string;
  key: string;
  title: string;
  subtitle: string;
  enabled: boolean;
  order: number;
  config: Record<string, string | number | boolean>;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  image: string;
  author: string;
  date: string;
  tags: string[];
  published: boolean;
}

export interface Address {
  id: string;
  title: string;
  city: string;
  address: string;
  postalCode: string;
  phone: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  addresses: Address[];
  createdAt: string;
}

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'completed'
  | 'cancelled';

export interface OrderItem {
  productId: string;
  name: string;
  image: string;
  variantLabel?: string;
  price: number;
  qty: number;
}

export interface Order {
  id: string;
  code: string;
  customerName: string;
  phone: string;
  city: string;
  address: string;
  postalCode: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  shippingMethod: string;
  paymentMethod: string;
  status: OrderStatus;
  note: string;
  createdAt: string;
}

export interface Review {
  id: string;
  productId: string;
  author: string;
  rating: number;
  text: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  passwordHash: string; // DEMO ONLY — see docs/ARCHITECTURE.md
  role: 'admin' | 'customer';
  addresses: Address[];
  createdAt: string;
}

export interface Settings {
  storeName: string;
  storeEn: string;
  phone: string;
  email: string;
  address: string;
  announcement: string;
  announcementEnabled: boolean;
  logo: string;
  logoWhite: string;
  favicon: string;
  primaryColor: string;
  secondaryColor: string;
  footerAbout: string;
  instagram: string;
  telegram: string;
  whatsapp: string;
  aparat: string;
  shippingBase: number;
  freeShippingOver: number;
  trustNote: string;
}

export interface DB {
  products: Product[];
  categories: Category[];
  brands: Brand[];
  banners: Banner[];
  sections: HomeSection[];
  articles: Article[];
  customers: Customer[];
  orders: Order[];
  reviews: Review[];
  users: User[];
  settings: Settings;
}

export type EntityKey = Exclude<keyof DB, 'settings'>;

export interface CartItem {
  productId: string;
  variantKey: string; // e.g. "256GB|آبی" or ""
  variantLabel: string;
  qty: number;
}

export function stockStatus(p: Product): StockStatus {
  if (p.stock <= 0) return 'outofstock';
  return 'instock';
}

export function finalPrice(p: Product, variantDelta = 0): number {
  const base = p.salePrice && p.salePrice > 0 ? p.salePrice : p.regularPrice;
  return base + variantDelta;
}

export function hasDiscount(p: Product): boolean {
  return !!p.salePrice && p.salePrice > 0 && p.salePrice < p.regularPrice;
}

export function discountPercent(p: Product): number {
  if (!hasDiscount(p)) return 0;
  return Math.round((1 - (p.salePrice as number) / p.regularPrice) * 100);
}
