import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container page">
      <div className="notfound">
        <div className="big">404</div>
        <h1>صفحه‌ای که دنبالش هستید پیدا نشد!</h1>
        <p style={{ color: 'var(--muted)' }}>آدرس اشتباه است یا این صفحه حذف شده است.</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 18 }}>
          <Link className="btn btn-gold" to="/">بازگشت به خانه</Link>
          <Link className="btn btn-outline" to="/shop">مشاهده فروشگاه</Link>
        </div>
      </div>
    </div>
  );
}
