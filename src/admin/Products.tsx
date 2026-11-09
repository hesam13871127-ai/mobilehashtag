import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Copy, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import type { Product, ProductVariation } from '../models/types';
import { useDB } from '../services/db';
import { useToast } from '../services/toast';
import { faNum, toman, slugifyFa, uid } from '../services/format';
import { AdminHead, ImageField, Pager, Pill, SearchBar } from './ui';
import { Confirm, Modal } from '../components/ui';

const PER = 10;
const emptyProduct = (): Product => ({
  id: '', name: '', slug: '', sku: '', brandId: '', categoryIds: [],
  shortDesc: '', fullDesc: '', regularPrice: 0, salePrice: undefined, stock: 10,
  image: '', gallery: [], attributes: [], variations: [], specs: [],
  rating: 5, ratingCount: 0, soldCount: 0, status: 'published', createdAt: new Date().toISOString(),
});

export default function AdminProducts() {
  const { db, save, remove } = useDB();
  const { toast } = useToast();
  const [q, setQ] = useState('');
  const [catF, setCatF] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Product | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);

  const filtered = useMemo(() => {
    let list = [...db.products].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (q.trim()) list = list.filter((p) => p.name.includes(q.trim()) || p.sku.includes(q.trim()));
    if (catF) list = list.filter((p) => p.categoryIds.includes(catF));
    return list;
  }, [db.products, q, catF]);
  const pages = Math.max(1, Math.ceil(filtered.length / PER));
  const view = filtered.slice((Math.min(page, pages) - 1) * PER, Math.min(page, pages) * PER);

  const duplicate = (p: Product) => {
    save('products', { ...p, id: uid('pro'), name: p.name + ' (کپی)', slug: p.slug + '-copy-' + Date.now().toString(36), sku: p.sku + '-C', soldCount: 0, ratingCount: 0, createdAt: new Date().toISOString() });
    toast('محصول کپی شد.');
  };

  const bulk = (action: 'publish' | 'draft' | 'delete') => {
    if (!selected.length) { toast('ابتدا محصولی انتخاب کنید.', 'error'); return; }
    for (const id of selected) {
      if (action === 'delete') remove('products', id);
      else {
        const p = db.products.find((x) => x.id === id);
        if (p) save('products', { ...p, status: action === 'publish' ? 'published' : 'draft' });
      }
    }
    setSelected([]);
    toast('عملیات گروهی انجام شد.');
  };

  return (
    <div>
      <AdminHead title="مدیریت محصولات" sub={`${faNum(db.products.length)} محصول`}>
        <button className="btn btn-gold btn-sm" onClick={() => setEditing(emptyProduct())}><Plus size={15} /> محصول جدید</button>
      </AdminHead>
      <div className="panel">
        <div className="toolbar-admin">
          <SearchBar value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="جستجوی نام یا SKU..." />
          <select className="select" value={catF} onChange={(e) => { setCatF(e.target.value); setPage(1); }}>
            <option value="">همه دسته‌ها</option>
            {db.categories.filter((c) => !c.parentId).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {selected.length > 0 && (
            <>
              <button className="btn btn-outline btn-sm" onClick={() => bulk('publish')}>انتشار ({faNum(selected.length)})</button>
              <button className="btn btn-outline btn-sm" onClick={() => bulk('draft')}>پیش‌نویس</button>
              <button className="btn btn-danger btn-sm" onClick={() => bulk('delete')}>حذف گروهی</button>
            </>
          )}
        </div>
        <div className="atable-wrap">
          <table className="atable">
            <thead><tr>
              <th><input type="checkbox" checked={view.length > 0 && view.every((p) => selected.includes(p.id))} onChange={(e) => setSelected(e.target.checked ? view.map((p) => p.id) : [])} aria-label="انتخاب همه" /></th>
              <th>کالا</th><th>قیمت</th><th>موجودی</th><th>وضعیت</th><th>عملیات</th>
            </tr></thead>
            <tbody>
              {view.map((p) => (
                <tr key={p.id}>
                  <td><input type="checkbox" checked={selected.includes(p.id)} onChange={(e) => setSelected(e.target.checked ? [...selected, p.id] : selected.filter((x) => x !== p.id))} aria-label={p.name} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <img className="thumb" src={p.image} alt="" />
                      <div><b style={{ fontSize: 13 }}>{p.name}</b><br /><small style={{ color: 'var(--muted)' }}>{p.sku}</small></div>
                    </div>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}><b>{toman(p.salePrice && p.salePrice > 0 ? p.salePrice : p.regularPrice)}</b></td>
                  <td>{p.stock <= 0 ? <Pill kind="red">ناموجود</Pill> : faNum(p.stock)}</td>
                  <td>{p.status === 'published' ? <Pill kind="green">منتشر شده</Pill> : <Pill>پیش‌نویس</Pill>}</td>
                  <td>
                    <div className="row-actions">
                      <button className="mini-btn" title="ویرایش" onClick={() => setEditing({ ...p, gallery: [...p.gallery], specs: p.specs.map((s) => ({ ...s })), attributes: p.attributes.map((s) => ({ ...s })), variations: JSON.parse(JSON.stringify(p.variations)) })}><Pencil size={15} /></button>
                      <button className="mini-btn" title="کپی" onClick={() => duplicate(p)}><Copy size={15} /></button>
                      <button className="mini-btn" title={p.status === 'published' ? 'عدم انتشار' : 'انتشار'} onClick={() => { save('products', { ...p, status: p.status === 'published' ? 'draft' : 'published' }); toast('وضعیت محصول تغییر کرد.'); }}>
                        {p.status === 'published' ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                      <button className="mini-btn danger" title="حذف" onClick={() => setConfirmDel(p.id)}><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {view.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)' }}>محصولی یافت نشد.</td></tr>}
            </tbody>
          </table>
        </div>
        <Pager total={filtered.length} page={Math.min(page, pages)} per={PER} onPage={setPage} />
      </div>

      {editing && <ProductForm initial={editing} onClose={() => setEditing(null)} />}
      {confirmDel && (
        <Confirm text="این محصول برای همیشه حذف شود؟" onCancel={() => setConfirmDel(null)} onOk={() => { remove('products', confirmDel); setConfirmDel(null); toast('محصول حذف شد.', 'info'); }} />
      )}
    </div>
  );
}

/* ---------------- product add/edit form ---------------- */
function ProductForm({ initial, onClose }: { initial: Product; onClose: () => void }) {
  const { db, save } = useDB();
  const { toast } = useToast();
  const [f, setF] = useState<Product>({ ...initial, id: initial.id || uid('pro') });
  const set = (patch: Partial<Product>) => setF({ ...f, ...patch });

  const mains = db.categories.filter((c) => !c.parentId).sort((a, b) => a.order - b.order);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (f.name.trim().length < 3) { toast('نام محصول را وارد کنید.', 'error'); return; }
    if (!f.brandId) { toast('برند را انتخاب کنید.', 'error'); return; }
    if (!f.categoryIds.length) { toast('حداقل یک دسته انتخاب کنید.', 'error'); return; }
    if (!(f.regularPrice > 0)) { toast('قیمت معتبر وارد کنید.', 'error'); return; }
    if (!f.image) { toast('تصویر اصلی را انتخاب کنید.', 'error'); return; }
    const slug = f.slug.trim() || slugifyFa(f.name);
    if (db.products.some((p) => p.slug === slug && p.id !== f.id)) { toast('این نامک تکراری است.', 'error'); return; }
    save('products', { ...f, slug, name: f.name.trim(), gallery: f.gallery.filter((g) => g !== f.image) });
    toast(initial.name ? 'محصول به‌روزرسانی شد.' : 'محصول جدید ساخته شد.');
    onClose();
  };

  const addVar = () => {
    const name = window.prompt('نام ویژگی (مثلاً رنگ یا حافظه):');
    if (!name?.trim()) return;
    set({ variations: [...f.variations, { id: uid('var'), name: name.trim(), options: [] }] });
  };
  const addOpt = (vid: string) => {
    const label = window.prompt('عنوان گزینه (مثلاً آبی):');
    if (!label?.trim()) return;
    const delta = Number(window.prompt('اختلاف قیمت نسبت به پایه (تومان، عدد):', '0') || 0);
    set({
      variations: f.variations.map((v) => v.id === vid
        ? { ...v, options: [...v.options, { id: uid('opt'), label: label.trim(), priceDelta: Number.isNaN(delta) ? 0 : delta, stock: f.stock }] }
        : v),
    });
  };

  return (
    <Modal title={initial.name ? 'ویرایش محصول' : 'محصول جدید'} onClose={onClose}>
      <form onSubmit={submit} style={{ maxHeight: '70vh', overflowY: 'auto', paddingLeft: 4 }}>
        <div className="field"><label>نام محصول *</label>
          <input className="input" value={f.name} onChange={(e) => set({ name: e.target.value })} />
        </div>
        <div className="form-grid">
          <div className="field"><label>نامک (slug)</label>
            <input className="input" value={f.slug} onChange={(e) => set({ slug: e.target.value })} dir="ltr" placeholder="خودکار از نام" />
          </div>
          <div className="field"><label>کد SKU</label>
            <input className="input" value={f.sku} onChange={(e) => set({ sku: e.target.value })} dir="ltr" />
          </div>
        </div>
        <div className="form-grid">
          <div className="field"><label>برند *</label>
            <select className="select" value={f.brandId} onChange={(e) => set({ brandId: e.target.value })}>
              <option value="">— انتخاب —</option>
              {db.brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className="field"><label>وضعیت انتشار</label>
            <select className="select" value={f.status} onChange={(e) => set({ status: e.target.value as Product['status'] })}>
              <option value="published">منتشر شده</option>
              <option value="draft">پیش‌نویس</option>
            </select>
          </div>
        </div>
        <div className="field"><label>دسته‌بندی‌ها *</label>
          <div style={{ border: '1.5px solid var(--border)', borderRadius: 11, padding: 10, maxHeight: 150, overflowY: 'auto' }}>
            {mains.map((m) => (
              <div key={m.id}>
                <label className="check" style={{ fontWeight: 700 }}>
                  <input type="checkbox" checked={f.categoryIds.includes(m.id)} onChange={(e) => set({ categoryIds: e.target.checked ? [...f.categoryIds, m.id] : f.categoryIds.filter((x) => x !== m.id) })} />
                  {m.name}
                </label>
                <div style={{ paddingRight: 24 }}>
                  {db.categories.filter((c) => c.parentId === m.id).map((s) => (
                    <label className="check" key={s.id} style={{ fontSize: 13 }}>
                      <input type="checkbox" checked={f.categoryIds.includes(s.id)} onChange={(e) => set({ categoryIds: e.target.checked ? [...f.categoryIds, s.id] : f.categoryIds.filter((x) => x !== s.id) })} />
                      {s.name}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <ImageField label="تصویر اصلی *" value={f.image} onChange={(v) => set({ image: v })} />
        <ImageField label="گالری تصاویر" values={f.gallery} onChangeMany={(v) => set({ gallery: v })} />
        <div className="form-grid">
          <div className="field"><label>قیمت اصلی (تومان) *</label>
            <input className="input" type="number" min={0} value={f.regularPrice} onChange={(e) => set({ regularPrice: Number(e.target.value) })} />
          </div>
          <div className="field"><label>قیمت فروش ویژه (تومان)</label>
            <input className="input" type="number" min={0} value={f.salePrice || ''} onChange={(e) => set({ salePrice: e.target.value ? Number(e.target.value) : undefined })} placeholder="بدون تخفیف" />
          </div>
        </div>
        <div className="form-grid">
          <div className="field"><label>موجودی</label>
            <input className="input" type="number" min={0} value={f.stock} onChange={(e) => set({ stock: Number(e.target.value) })} />
          </div>
          <div className="field"><label>پایان پیشنهاد شگفت‌انگیز</label>
            <input className="input" type="datetime-local" value={f.offerEndsAt ? f.offerEndsAt.slice(0, 16) : ''} onChange={(e) => set({ offerEndsAt: e.target.value ? new Date(e.target.value).toISOString() : undefined })} />
          </div>
        </div>
        <div className="field"><label>توضیح کوتاه</label>
          <input className="input" value={f.shortDesc} onChange={(e) => set({ shortDesc: e.target.value })} />
        </div>
        <div className="field"><label>توضیح کامل</label>
          <textarea className="textarea" value={f.fullDesc} onChange={(e) => set({ fullDesc: e.target.value })} />
        </div>
        <div className="form-grid">
          <div className="field"><label>وزن</label>
            <input className="input" value={f.weight || ''} onChange={(e) => set({ weight: e.target.value })} placeholder="مثلاً 206 گرم" />
          </div>
          <div className="field"><label>ابعاد</label>
            <input className="input" value={f.dimensions || ''} onChange={(e) => set({ dimensions: e.target.value })} />
          </div>
        </div>
        <KVEditor title="مشخصات فنی" rows={f.specs} onChange={(specs) => set({ specs })} kLabel="نام مشخصه" vLabel="مقدار" />
        <KVEditor title="ویژگی‌ها" rows={f.attributes} onChange={(attributes) => set({ attributes })} kLabel="نام" vLabel="مقدار" />

        <div className="field">
          <label>تنوع‌ها (رنگ، حافظه و...)</label>
          {f.variations.map((v: ProductVariation) => (
            <div key={v.id} style={{ border: '1.5px solid var(--border)', borderRadius: 11, padding: 10, marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <b style={{ fontSize: 13.5 }}>{v.name}</b>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => addOpt(v.id)}>+ گزینه</button>
                  <button type="button" className="mini-btn danger" onClick={() => set({ variations: f.variations.filter((x) => x.id !== v.id) })}><Trash2 size={14} /></button>
                </div>
              </div>
              {v.options.map((o) => (
                <div key={o.id} style={{ display: 'flex', gap: 8, fontSize: 13, padding: '6px 0', borderTop: '1px dashed var(--border)', marginTop: 6 }}>
                  <span style={{ flex: 1 }}>{o.label} {o.priceDelta > 0 && <small>({toman(o.priceDelta)}+)</small>}</span>
                  <button type="button" className="mini-btn danger" onClick={() => set({ variations: f.variations.map((x) => x.id === v.id ? { ...x, options: x.options.filter((y) => y.id !== o.id) } : x) })}><Trash2 size={13} /></button>
                </div>
              ))}
              {v.options.length === 0 && <small style={{ color: 'var(--muted)' }}>گزینه‌ای ثبت نشده.</small>}
            </div>
          ))}
          <button type="button" className="btn btn-outline btn-sm" onClick={addVar}>+ افزودن تنوع</button>
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', margin: '12px 0' }}>
          <label className="check"><input type="checkbox" checked={!!f.featured} onChange={(e) => set({ featured: e.target.checked })} /> منتخب</label>
          <label className="check"><input type="checkbox" checked={!!f.isNew} onChange={(e) => set({ isNew: e.target.checked })} /> جدید</label>
          <label className="check"><input type="checkbox" checked={!!f.bestseller} onChange={(e) => set({ bestseller: e.target.checked })} /> پرفروش</label>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-gold" type="submit">ذخیره محصول</button>
          <button className="btn btn-ghost" type="button" onClick={onClose}>انصراف</button>
        </div>
      </form>
    </Modal>
  );
}

export function KVEditor({ title, rows, onChange, kLabel, vLabel }: {
  title: string; rows: Array<{ name: string; value: string }>; onChange: (r: Array<{ name: string; value: string }>) => void; kLabel: string; vLabel: string;
}) {
  const [k, setK] = useState('');
  const [v, setV] = useState('');
  return (
    <div className="field">
      <label>{title}</label>
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
          <input className="input" value={r.name} placeholder={kLabel} onChange={(e) => onChange(rows.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
          <input className="input" value={r.value} placeholder={vLabel} onChange={(e) => onChange(rows.map((x, j) => j === i ? { ...x, value: e.target.value } : x))} />
          <button type="button" className="mini-btn danger" onClick={() => onChange(rows.filter((_, j) => j !== i))}><Trash2 size={14} /></button>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8 }}>
        <input className="input" value={k} placeholder={kLabel} onChange={(e) => setK(e.target.value)} />
        <input className="input" value={v} placeholder={vLabel} onChange={(e) => setV(e.target.value)} />
        <button type="button" className="btn btn-outline btn-sm" style={{ whiteSpace: 'nowrap' }} onClick={() => { if (k.trim()) { onChange([...rows, { name: k.trim(), value: v.trim() }]); setK(''); setV(''); } }}>افزودن</button>
      </div>
    </div>
  );
}

