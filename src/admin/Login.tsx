import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useDB } from '../services/db';
import { useShop } from '../services/shop';
import { useToast } from '../services/toast';

export default function AdminLogin() {
  const { db } = useDB();
  const { login } = useShop();
  const { toast } = useToast();
  const [phone, setPhone] = useState('');
  const [pass, setPass] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = login(phone.trim(), pass);
    if (!r.ok) { toast(r.message, 'error'); return; }
    const u = db.users.find((x) => x.phone === phone.trim());
    if (!u || u.role !== 'admin') { toast('این حساب دسترسی مدیریت ندارد.', 'error'); return; }
    toast('به پنل مدیریت خوش آمدید.');
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <img src={db.settings.logo} alt="موبایل هشتگ" />
        <h1>ورود به پنل مدیریت</h1>
        <p className="sub"><ShieldCheck size={14} style={{ verticalAlign: -2 }} /> مخصوص مدیران فروشگاه</p>
        <form onSubmit={submit}>
          <div className="field"><label>شماره موبایل مدیر</label>
            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09120000000" inputMode="numeric" dir="ltr" style={{ textAlign: 'right' }} />
          </div>
          <div className="field"><label>رمز عبور</label>
            <input className="input" type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••••" />
          </div>
          <button className="btn btn-gold btn-block" type="submit">ورود به پنل</button>
        </form>
        <div className="demo-note">مدیر نمایشی: 09120000000 / رمز admin123</div>
        <div style={{ textAlign: 'center', marginTop: 10 }}>
          <Link className="more-link" to="/">بازگشت به فروشگاه</Link>
        </div>
      </div>
    </div>
  );
}
