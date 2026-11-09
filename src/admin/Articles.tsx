import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { Article } from '../models/types';
import { useDB } from '../services/db';
import { useToast } from '../services/toast';
import { faNum, faDate, slugifyFa, uid } from '../services/format';
import { AdminHead, ImageField, Pill, SearchBar } from './ui';
import { Confirm, Modal } from '../components/ui';

export default function AdminArticles() {
  const { db, save, remove } = useDB();
  const { toast } = useToast();
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<Article | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const list = useMemo(() => {
    let l = [...db.articles].sort((a, b) => b.date.localeCompare(a.date));
    if (q.trim()) l = l.filter((a) => a.title.includes(q.trim()));
    return l;
  }, [db.articles, q]);

  return (
    <div>
      <AdminHead title="مدیریت مقالات" sub={`${faNum(db.articles.length)} مقاله`}>
        <button className="btn btn-gold btn-sm" onClick={() => setEditing({
          id: uid('art'), title: '', slug: '', excerpt: '', body: '', image: '',
          author: 'تحریریه موبایل هشتگ', date: new Date().toISOString(), tags: [], published: true,
        })}>
          <Plus size={15} /> مقاله جدید
        </button>
      </AdminHead>
      <div className="panel">
        <div className="toolbar-admin">
          <SearchBar value={q} onChange={setQ} placeholder="جستجوی مقاله..." />
        </div>
        <div className="atable-wrap">
          <table className="atable">
            <thead><tr><th>مقاله</th><th>نویسنده</th><th>تاریخ</th><th>وضعیت</th><th>عملیات</th></tr></thead>
            <tbody>
              {list.map((a) => (
                <tr key={a.id}>
                  <td>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <img className="thumb" src={a.image} alt="" style={{ width: 64 }} />
                      <b style={{ fontSize: 13 }}>{a.title}</b>
                    </div>
                  </td>
                  <td>{a.author}</td>
                  <td style={{ fontSize: 12.5 }}>{faDate(a.date)}</td>
                  <td>{a.published ? <Pill kind="green">منتشر شده</Pill> : <Pill>پیش‌نویس</Pill>}</td>
                  <td>
                    <div className="row-actions">
                      <button className="mini-btn" onClick={() => setEditing({ ...a, tags: [...a.tags] })}><Pencil size={15} /></button>
                      <button className="mini-btn danger" onClick={() => setConfirmDel(a.id)}><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted)' }}>مقاله‌ای یافت نشد.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <Modal title={editing.title ? 'ویرایش مقاله' : 'مقاله جدید'} onClose={() => setEditing(null)}>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (editing.title.trim().length < 3) { toast('عنوان مقاله را وارد کنید.', 'error'); return; }
            const slug = editing.slug.trim() || slugifyFa(editing.title);
            if (db.articles.some((x) => x.slug === slug && x.id !== editing.id)) { toast('این نامک تکراری است.', 'error'); return; }
            if (!editing.image) { toast('تصویر شاخص را انتخاب کنید.', 'error'); return; }
            save('articles', { ...editing, slug, title: editing.title.trim() });
            toast('مقاله ذخیره شد.');
            setEditing(null);
          }}>
            <div className="field"><label>عنوان *</label>
              <input className="input" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
            </div>
            <div className="form-grid">
              <div className="field"><label>نامک</label>
                <input className="input" value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} dir="ltr" />
              </div>
              <div className="field"><label>نویسنده</label>
                <input className="input" value={editing.author} onChange={(e) => setEditing({ ...editing, author: e.target.value })} />
              </div>
            </div>
            <div className="field"><label>خلاصه</label>
              <input className="input" value={editing.excerpt} onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })} />
            </div>
            <div className="field"><label>متن مقاله</label>
              <textarea className="textarea" style={{ minHeight: 160 }} value={editing.body} onChange={(e) => setEditing({ ...editing, body: e.target.value })} />
            </div>
            <ImageField label="تصویر شاخص *" value={editing.image} onChange={(v) => setEditing({ ...editing, image: v })} />
            <div className="field"><label>برچسب‌ها (با کاما جدا کنید)</label>
              <input className="input" value={editing.tags.join('، ')} onChange={(e) => setEditing({ ...editing, tags: e.target.value.split(/[,،]/).map((t) => t.trim()).filter(Boolean) })} />
            </div>
            <label className="check" style={{ marginBottom: 14 }}>
              <input type="checkbox" checked={editing.published} onChange={(e) => setEditing({ ...editing, published: e.target.checked })} /> منتشر شود
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-gold" type="submit">ذخیره</button>
              <button className="btn btn-ghost" type="button" onClick={() => setEditing(null)}>انصراف</button>
            </div>
          </form>
        </Modal>
      )}
      {confirmDel && (
        <Confirm text="این مقاله حذف شود؟" onCancel={() => setConfirmDel(null)} onOk={() => { remove('articles', confirmDel); setConfirmDel(null); toast('مقاله حذف شد.', 'info'); }} />
      )}
    </div>
  );
}
