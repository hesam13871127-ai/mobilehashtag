import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { Brand } from '../models/types';
import { useDB } from '../services/db';
import { useToast } from '../services/toast';
import { faNum, slugifyFa, uid } from '../services/format';
import { AdminHead, ImageField, Pill } from './ui';
import { Confirm, Modal } from '../components/ui';

export default function AdminBrands() {
  const { db, save, remove } = useDB();
  const { toast } = useToast();
  const [editing, setEditing] = useState<Partial<Brand> | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  return (
    <div>
      <AdminHead title="برندها" sub={`${faNum(db.brands.length)} برند`}>
        <button className="btn btn-gold btn-sm" onClick={() => setEditing({ id: uid('brn'), name: '', slug: '', logo: '', description: '', visible: true })}>
          <Plus size={15} /> برند جدید
        </button>
      </AdminHead>
      <div className="panel">
        <div className="atable-wrap">
          <table className="atable">
            <thead><tr><th>برند</th><th>نامک</th><th>کالاها</th><th>وضعیت</th><th>عملیات</th></tr></thead>
            <tbody>
              {db.brands.map((b) => (
                <tr key={b.id}>
                  <td>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <img className="thumb" src={b.logo} alt="" style={{ width: 64 }} />
                      <b>{b.name}</b>
                    </div>
                  </td>
                  <td dir="ltr" style={{ color: 'var(--muted)' }}>{b.slug}</td>
                  <td>{faNum(db.products.filter((p) => p.brandId === b.id).length)}</td>
                  <td>{b.visible ? <Pill kind="green">نمایش</Pill> : <Pill>مخفی</Pill>}</td>
                  <td>
                    <div className="row-actions">
                      <button className="mini-btn" onClick={() => setEditing({ ...b })} title="ویرایش"><Pencil size={15} /></button>
                      <button className="mini-btn danger" onClick={() => setConfirmDel(b.id)} title="حذف"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {editing && (
        <Modal title={editing.name ? 'ویرایش برند' : 'برند جدید'} onClose={() => setEditing(null)}>
          <form onSubmit={(e) => {
            e.preventDefault();
            if ((editing.name || '').trim().length < 2) { toast('نام برند را وارد کنید.', 'error'); return; }
            const slug = editing.slug?.trim() || slugifyFa(editing.name || '');
            if (db.brands.some((x) => x.slug === slug && x.id !== editing.id)) { toast('این نامک تکراری است.', 'error'); return; }
            if (!editing.logo) { toast('لوگوی برند را انتخاب کنید.', 'error'); return; }
            save('brands', { id: editing.id, name: editing.name!.trim(), slug, logo: editing.logo, description: editing.description || '', visible: editing.visible ?? true } as Brand);
            toast('برند ذخیره شد.');
            setEditing(null);
          }}>
            <div className="field"><label>نام برند *</label>
              <input className="input" value={editing.name || ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </div>
            <div className="field"><label>نامک (slug)</label>
              <input className="input" value={editing.slug || ''} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} dir="ltr" />
            </div>
            <div className="field"><label>توضیحات</label>
              <input className="input" value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
            </div>
            <ImageField label="لوگوی برند *" value={editing.logo || ''} onChange={(v) => setEditing({ ...editing, logo: v })} />
            <label className="check" style={{ marginBottom: 14 }}>
              <input type="checkbox" checked={editing.visible ?? true} onChange={(e) => setEditing({ ...editing, visible: e.target.checked })} /> نمایش در فروشگاه
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-gold" type="submit">ذخیره</button>
              <button className="btn btn-ghost" type="button" onClick={() => setEditing(null)}>انصراف</button>
            </div>
          </form>
        </Modal>
      )}
      {confirmDel && (
        <Confirm text="این برند حذف شود؟ (کالاهای آن بدون برند می‌مانند)" onCancel={() => setConfirmDel(null)} onOk={() => {
          for (const p of db.products.filter((p) => p.brandId === confirmDel))
            save('products', { ...p, brandId: '' });
          remove('brands', confirmDel);
          setConfirmDel(null);
          toast('برند حذف شد.', 'info');
        }} />
      )}
    </div>
  );
}
