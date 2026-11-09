import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, ChevronDown } from 'lucide-react';
import type { Category } from '../models/types';
import { useDB } from '../services/db';
import { useToast } from '../services/toast';
import { faNum, slugifyFa, uid } from '../services/format';
import { AdminHead, ImageField, Pill, SearchBar } from './ui';
import { Confirm, Modal } from '../components/ui';

export default function AdminCategories() {
  const { db, save, remove } = useDB();
  const { toast } = useToast();
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<Partial<Category> | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<string[]>([]);

  const mains = useMemo(
    () => db.categories.filter((c) => !c.parentId && (!q.trim() || c.name.includes(q.trim()))).sort((a, b) => a.order - b.order),
    [db.categories, q],
  );
  const subsOf = (id: string) => db.categories.filter((c) => c.parentId === id).sort((a, b) => a.order - b.order);
  const countIn = (id: string) => db.products.filter((p) => p.categoryIds.includes(id)).length;

  const move = (c: Category, dir: -1 | 1) => {
    const siblings = c.parentId ? subsOf(c.parentId) : mains;
    const i = siblings.findIndex((x) => x.id === c.id);
    const j = i + dir;
    if (j < 0 || j >= siblings.length) return;
    const a = siblings[i], b = siblings[j];
    save('categories', { ...a, order: b.order });
    save('categories', { ...b, order: a.order });
  };

  return (
    <div>
      <AdminHead title="دسته‌بندی‌ها" sub={`${faNum(db.categories.length)} دسته`}>
        <button className="btn btn-gold btn-sm" onClick={() => setEditing({ id: uid('cat'), name: '', slug: '', description: '', image: '', parentId: null, order: mains.length + 1, visible: true })}>
          <Plus size={15} /> دسته جدید
        </button>
      </AdminHead>
      <div className="panel">
        <div className="toolbar-admin">
          <SearchBar value={q} onChange={setQ} placeholder="جستجوی دسته..." />
        </div>
        {mains.map((m) => (
          <div key={m.id} style={{ border: '1.5px solid var(--border)', borderRadius: 13, marginBottom: 10, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#faf8f3' }}>
              <button className="mini-btn" onClick={() => setCollapsed(collapsed.includes(m.id) ? collapsed.filter((x) => x !== m.id) : [...collapsed, m.id])} aria-label="باز/بسته">
                <ChevronDown size={15} style={{ transform: collapsed.includes(m.id) ? 'rotate(-90deg)' : 'none' }} />
              </button>
              <img src={m.image} alt="" style={{ width: 40, height: 40, borderRadius: 9, objectFit: 'cover' }} />
              <div style={{ flex: 1 }}>
                <b style={{ fontSize: 14 }}>{m.name}</b>
                <small style={{ color: 'var(--muted)', display: 'block' }}>/{m.slug} — {faNum(countIn(m.id))} کالای مستقیم</small>
              </div>
              {m.visible ? <Pill kind="green">نمایش</Pill> : <Pill>مخفی</Pill>}
              <div className="row-actions">
                <button className="mini-btn" title="بالا" onClick={() => move(m, -1)}>↑</button>
                <button className="mini-btn" title="پایین" onClick={() => move(m, 1)}>↓</button>
                <button className="mini-btn" title="افزودن زیردسته" onClick={() => setEditing({ id: uid('cat'), name: '', slug: '', description: '', image: m.image, parentId: m.id, order: subsOf(m.id).length + 1, visible: true })}><Plus size={15} /></button>
                <button className="mini-btn" title="ویرایش" onClick={() => setEditing({ ...m })}><Pencil size={15} /></button>
                <button className="mini-btn" title="نمایش/مخفی" onClick={() => { save('categories', { ...m, visible: !m.visible }); toast('وضعیت نمایش تغییر کرد.'); }}>{m.visible ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                <button className="mini-btn danger" title="حذف" onClick={() => setConfirmDel(m.id)}><Trash2 size={15} /></button>
              </div>
            </div>
            {!collapsed.includes(m.id) && subsOf(m.id).map((s) => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px 9px 14px', borderTop: '1px solid var(--border)', marginRight: 34 }}>
                <div style={{ flex: 1 }}>
                  <b style={{ fontSize: 13.5 }}>— {s.name}</b>
                  <small style={{ color: 'var(--muted)', display: 'block' }}>/{s.slug} — {faNum(countIn(s.id))} کالا</small>
                </div>
                {s.visible ? <Pill kind="green">نمایش</Pill> : <Pill>مخفی</Pill>}
                <div className="row-actions">
                  <button className="mini-btn" title="بالا" onClick={() => move(s, -1)}>↑</button>
                  <button className="mini-btn" title="پایین" onClick={() => move(s, 1)}>↓</button>
                  <button className="mini-btn" title="ویرایش" onClick={() => setEditing({ ...s })}><Pencil size={15} /></button>
                  <button className="mini-btn danger" title="حذف" onClick={() => setConfirmDel(s.id)}><Trash2 size={15} /></button>
                </div>
              </div>
            ))}
          </div>
        ))}
        {mains.length === 0 && <p style={{ color: 'var(--muted)' }}>دسته‌ای یافت نشد.</p>}
      </div>

      {editing && <CategoryForm initial={editing} onClose={() => setEditing(null)} />}
      {confirmDel && (
        <Confirm text="این دسته حذف شود؟ (کالاهای آن بدون دسته نمی‌شوند؛ فقط دسته حذف می‌گردد)" onCancel={() => setConfirmDel(null)} onOk={() => {
          const c = db.categories.find((x) => x.id === confirmDel);
          // detach products + children become main
          for (const p of db.products.filter((p) => p.categoryIds.includes(confirmDel)))
            save('products', { ...p, categoryIds: p.categoryIds.filter((x) => x !== confirmDel) });
          for (const k of db.categories.filter((x) => x.parentId === confirmDel))
            save('categories', { ...k, parentId: c?.parentId || null });
          remove('categories', confirmDel);
          setConfirmDel(null);
          toast('دسته حذف شد.', 'info');
        }} />
      )}
    </div>
  );
}

function CategoryForm({ initial, onClose }: { initial: Partial<Category>; onClose: () => void }) {
  const { db, save } = useDB();
  const { toast } = useToast();
  const [f, setF] = useState({ id: initial.id || uid('cat'), name: initial.name || '', slug: initial.slug || '', description: initial.description || '', image: initial.image || '', parentId: initial.parentId ?? null, order: initial.order ?? 1, visible: initial.visible ?? true });
  const mains = db.categories.filter((c) => !c.parentId && c.id !== f.id);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (f.name.trim().length < 2) { toast('نام دسته را وارد کنید.', 'error'); return; }
    const slug = f.slug.trim() || slugifyFa(f.name);
    if (db.categories.some((c) => c.slug === slug && c.id !== f.id)) { toast('این نامک تکراری است.', 'error'); return; }
    if (!f.image) { toast('تصویر دسته را انتخاب کنید.', 'error'); return; }
    save('categories', { ...f, name: f.name.trim(), slug });
    toast('دسته ذخیره شد.');
    onClose();
  };

  return (
    <Modal title={initial.name ? 'ویرایش دسته' : 'دسته جدید'} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="field"><label>نام دسته *</label>
          <input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        </div>
        <div className="form-grid">
          <div className="field"><label>نامک (slug)</label>
            <input className="input" value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} dir="ltr" />
          </div>
          <div className="field"><label>دسته والد</label>
            <select className="select" value={f.parentId || ''} onChange={(e) => setF({ ...f, parentId: e.target.value || null })}>
              <option value="">— دسته اصلی —</option>
              {mains.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
        </div>
        <div className="field"><label>توضیحات</label>
          <textarea className="textarea" style={{ minHeight: 70 }} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        </div>
        <ImageField label="تصویر دسته *" value={f.image} onChange={(v) => setF({ ...f, image: v })} />
        <div className="form-grid">
          <div className="field"><label>ترتیب نمایش</label>
            <input className="input" type="number" value={f.order} onChange={(e) => setF({ ...f, order: Number(e.target.value) })} />
          </div>
          <div className="field"><label>نمایش در فروشگاه</label>
            <div style={{ paddingTop: 8 }}><label className="switch"><input type="checkbox" checked={f.visible} onChange={(e) => setF({ ...f, visible: e.target.checked })} /><span /></label></div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-gold" type="submit">ذخیره</button>
          <button className="btn btn-ghost" type="button" onClick={onClose}>انصراف</button>
        </div>
      </form>
    </Modal>
  );
}
