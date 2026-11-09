import { useMemo, useState } from 'react';
import { Check, X, Trash2 } from 'lucide-react';
import { useDB } from '../services/db';
import { useToast } from '../services/toast';
import { faNum, faDate } from '../services/format';
import { AdminHead, Pager, Pill, SearchBar } from './ui';
import { Stars } from '../components/ui';
import { Confirm } from '../components/ui';

const PER = 10;

export default function AdminReviews() {
  const { db, save, remove } = useDB();
  const { toast } = useToast();
  const [q, setQ] = useState('');
  const [st, setSt] = useState('');
  const [page, setPage] = useState(1);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = [...db.reviews].sort((a, b) => b.date.localeCompare(a.date));
    if (q.trim()) list = list.filter((r) => r.text.includes(q.trim()) || r.author.includes(q.trim()));
    if (st) list = list.filter((r) => r.status === st);
    return list;
  }, [db.reviews, q, st]);
  const pages = Math.max(1, Math.ceil(filtered.length / PER));
  const rows = filtered.slice((Math.min(page, pages) - 1) * PER, Math.min(page, pages) * PER);

  const setStatus = (id: string, status: 'approved' | 'rejected' | 'pending') => {
    const r = db.reviews.find((x) => x.id === id);
    if (r) { save('reviews', { ...r, status }); toast('وضعیت نظر تغییر کرد.'); }
  };

  const pill = (s: string) => s === 'approved' ? <Pill kind="green">تأیید شده</Pill> : s === 'rejected' ? <Pill kind="red">رد شده</Pill> : <Pill kind="gold">در انتظار</Pill>;

  return (
    <div>
      <AdminHead title="نظرات مشتریان" sub={`${faNum(db.reviews.filter((r) => r.status === 'pending').length)} نظر در انتظار بررسی`} />
      <div className="panel">
        <div className="toolbar-admin">
          <SearchBar value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="جستجو در نظرات..." />
          <select className="select" value={st} onChange={(e) => { setSt(e.target.value); setPage(1); }}>
            <option value="">همه</option>
            <option value="pending">در انتظار</option>
            <option value="approved">تأیید شده</option>
            <option value="rejected">رد شده</option>
          </select>
        </div>
        {rows.map((r) => {
          const p = db.products.find((x) => x.id === r.productId);
          return (
            <div className="review" key={r.id}>
              <div className="rh">
                <b>{r.author}</b>
                <Stars rating={r.rating} size={13} />
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>برای: {p?.name || '—'}</span>
                <time>{faDate(r.date)}</time>
              </div>
              <p>{r.text}</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
                {pill(r.status)}
                <span style={{ marginRight: 'auto', display: 'flex', gap: 6 }}>
                  <button className="btn btn-outline btn-sm" onClick={() => setStatus(r.id, 'approved')}><Check size={14} /> تأیید</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setStatus(r.id, 'rejected')}><X size={14} /> رد</button>
                  <button className="mini-btn danger" onClick={() => setConfirmDel(r.id)}><Trash2 size={14} /></button>
                </span>
              </div>
            </div>
          );
        })}
        {rows.length === 0 && <p style={{ color: 'var(--muted)' }}>نظری یافت نشد.</p>}
        <Pager total={filtered.length} page={Math.min(page, pages)} per={PER} onPage={setPage} />
      </div>
      {confirmDel && (
        <Confirm text="این نظر حذف شود؟" onCancel={() => setConfirmDel(null)} onOk={() => { remove('reviews', confirmDel); setConfirmDel(null); toast('نظر حذف شد.', 'info'); }} />
      )}
    </div>
  );
}
