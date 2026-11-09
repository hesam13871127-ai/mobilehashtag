import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Outlet } from 'react-router-dom';
import { DBProvider, useDB } from './services/db';
import { ShopProvider, useShop } from './services/shop';
import { ToastProvider } from './services/toast';
import Header from './components/Header';
import Footer from './components/Footer';

import Home from './pages/Home';
import Shop from './pages/Shop';
import Categories from './pages/Categories';
import Category from './pages/Category';
import Product from './pages/Product';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Account from './pages/Account';
import Wishlist from './pages/Wishlist';
import About from './pages/About';
import Contact from './pages/Contact';
import Faq from './pages/Faq';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import Brands from './pages/Brands';
import TrackOrder from './pages/TrackOrder';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import NotFound from './pages/NotFound';

import AdminLogin from './admin/Login';
import AdminLayout from './admin/Layout';
import Dashboard from './admin/Dashboard';
import AdminProducts from './admin/Products';
import AdminCategories from './admin/Categories';
import AdminBrands from './admin/Brands';
import AdminOrders from './admin/Orders';
import AdminBanners from './admin/Banners';
import AdminHomepage from './admin/Homepage';
import AdminCustomers from './admin/Customers';
import AdminReviews from './admin/Reviews';
import AdminArticles from './admin/Articles';
import AdminAppearance from './admin/Appearance';
import AdminSettings from './admin/Settings';

function ScrollTop() {
  const { pathname, search } = useLocation();
  useEffect(() => window.scrollTo({ top: 0 }), [pathname, search]);
  return null;
}

function ThemeVars() {
  const { db } = useDB();
  useEffect(() => {
    const r = document.documentElement.style;
    r.setProperty('--gold', db.settings.primaryColor || '#B99552');
    r.setProperty('--gold-dark', db.settings.secondaryColor && db.settings.primaryColor !== '#B99552' ? db.settings.secondaryColor : '#92703B');
    const fav = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (fav && db.settings.favicon) fav.href = db.settings.favicon;
    document.title = `${db.settings.storeName} | فروشگاه گوشی موبایل و لوازم جانبی`;
  }, [db.settings]);
  return null;
}

function Storefront() {
  return (
    <>
      <Header />
      <main><Outlet /></main>
      <Footer />
    </>
  );
}

function AdminGuard() {
  const { user } = useShop();
  if (!user || user.role !== 'admin') return <AdminLogin />;
  return <AdminLayout />;
}

export default function App() {
  return (
    <BrowserRouter>
      <DBProvider>
        <ShopProvider>
          <ToastProvider>
            <ScrollTop />
            <ThemeVars />
            <Routes>
              <Route element={<Storefront />}>
                <Route index element={<Home />} />
                <Route path="shop" element={<Shop />} />
                <Route path="search" element={<Shop mode="search" />} />
                <Route path="offers" element={<Shop mode="offers" />} />
                <Route path="bestsellers" element={<Shop mode="bestsellers" />} />
                <Route path="brands" element={<Brands />} />
                <Route path="categories" element={<Categories />} />
                <Route path="category/:slug" element={<Category />} />
                <Route path="product/:slug" element={<Product />} />
                <Route path="cart" element={<Cart />} />
                <Route path="checkout" element={<Checkout />} />
                <Route path="account" element={<Account />} />
                <Route path="wishlist" element={<Wishlist />} />
                <Route path="about" element={<About />} />
                <Route path="contact" element={<Contact />} />
                <Route path="faq" element={<Faq />} />
                <Route path="blog" element={<Blog />} />
                <Route path="blog/:slug" element={<BlogPost />} />
                <Route path="track-order" element={<TrackOrder />} />
                <Route path="privacy" element={<Privacy />} />
                <Route path="terms" element={<Terms />} />
                <Route path="404" element={<NotFound />} />
                <Route path="*" element={<NotFound />} />
              </Route>
              <Route path="admin" element={<AdminGuard />}>
                <Route index element={<Dashboard />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="brands" element={<AdminBrands />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="banners" element={<AdminBanners />} />
                <Route path="homepage" element={<AdminHomepage />} />
                <Route path="customers" element={<AdminCustomers />} />
                <Route path="reviews" element={<AdminReviews />} />
                <Route path="articles" element={<AdminArticles />} />
                <Route path="appearance" element={<AdminAppearance />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>
            </Routes>
          </ToastProvider>
        </ShopProvider>
      </DBProvider>
    </BrowserRouter>
  );
}
