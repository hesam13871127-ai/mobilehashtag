import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { Banner, BannerPlacement } from '../models/types';
import { useDB } from '../services/db';
import { useToast } from '../services/toast';
import { faNum, uid } from '../services/format';
import { AdminHead, ImageField, Pill } from './ui';
import { Confirm, Modal } from '../components/ui';

const PLACEMENTS: Array<{ id: BannerPlacement; label: string }> = [
  { id: 'hero', label: 'اسلایدر اصلی' },
  { id: 'promo', label: 'بنر تبلیغاتی صفحه اصلی' },
  { id: 'category', label: 'بنر صفحه دسته' },
  { id: 'shop', label: 'بنر صفحه فروشگاه' },
];
const placeLabel = (p: BannerPlacement) => PLACEMENTS.find((x) => x.id === p)?.label || p;

export default function AdminBanners() {
  const { db, save, remove } = useDB();
  const { toast } = useToast();
  const [editing, setEditing] = useState<Banner | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [tab, setTab] = useState<BannerPlacement | ''>('');

  const list = db.banners
    .filter((b) => !tab || b.placement === tab)
    .sort((a, b) => a.order - b.order);

  const move = (b: Banner, dir: -1 | 1) => {
    const sibs = db.banners.filter((x) => x.placement === b.placement).sort((a, c) => a.order - c.order);
    const i = sibs.findIndex((x) => x.id === b.id);
    const j = i + dir;
    if (j < 0 || j >= sibs.length) return;
    save('banners', { ...sibs[i], order: sibs[j].order });
    save('banners', { ...sibs[j], order: sibs[i].order });
  };

  return (
    <div>
      <AdminHead title="مدیریت بنرها" sub={`${faNum(db.banners.length)} بنر`}>
        <button className="btn btn-gold btn-sm" onClick={() => setEditing({
          id: uid('ban'), title: '', subtitle: '', buttonText: 'مشاهده', url: '/shop', art: '',
          bgImage: '', mobileImage: '', themeFrom: '#23232a', themeTo: '#4a4a55', themeAccent: '#D9B96A',
          placement: 'hero', order: db.banners.length + 1, enabled: true,
        })}>
          <Plus size={15} /> بنر جدید
        </button>
      </AdminHead>
      <div className="panel">
        <div className="toolbar-admin">
          <button className={`btn btn-sm${!tab ? ' btn-dark' : ' btn-outline'}`} onClick={() => setTab('')}>همه</button>
          {PLACEMENTS.map((p) => (
            <button key={p.id} className={`btn btn-sm${tab === p.id ? ' btn-dark' : ' btn-outline'}`} onClick={() => setTab(p.id)}>{p.label}</button>
          ))}
        </div>
        {list.map((b) => (
          <div key={b.id} className="drag-row" style={{ alignItems: 'center' }}>
            <div style={{ width: 120, height: 64, borderRadius: 10, overflow: 'hidden', background: `linear-gradient(120deg, ${b.themeFrom}, ${b.themeTo})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {b.art ? <img src={b.art} alt="" style={{ height: '100%', objectFit: 'cover' }} /> : <span style={{ color: '#fff', fontSize: 12 }}>بدون تصویر</span>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <b>{b.title}</b>
              <small>{placeLabel(b.placement)} — {b.url}</small>
            </div>
            <label className="switch" title="فعال/غیرفعال">
              <input type="checkbox" checked={b.enabled} onChange={() => { save('banners', { ...b, enabled: !b.enabled }); toast('وضعیت بنر تغییر کرد.'); }} />
              <span />
            </label>
            <div className="mv">
              <button className="mini-btn" onClick={() => move(b, -1)}>↑</button>
              <button className="mini-btn" onClick={() => move(b, 1)}>↓</button>
              <button className="mini-btn" onClick={() => setEditing({ ...b })}><Pencil size={15} /></button>
              <button className="mini-btn danger" onClick={() => setConfirmDel(b.id)}><Trash2 size={15} /></button>
            </div>
            {b.enabled ? <Pill kind="green">فعال</Pill> : <Pill>غیرفعال</Pill>}
          </div>
        ))}
        {list.length === 0 && <p style={{ color: 'var(--muted)' }}>بنری در این جایگاه ثبت نشده است.</p>}
      </div>

      {editing && <BannerForm initial={editing} onClose={() => setEditing(null)} />}
      {confirmDel && (
        <Confirm text="این بنر حذف شود؟" onCancel={() => setConfirmDel(null)} onOk={() => { remove('banners', confirmDel); setConfirmDel(null); toast('بنر حذف شد.', 'info'); }} />
      )}
    </div>
  );
}

function BannerForm({ initial, onClose }: { initial: Banner; onClose: () => void }) {
  const { save } = useDB();
  const { toast } = useToast();
  const [f, setF] = useState<Banner>({ ...initial });
  const set = (p: Partial<Banner>) => setF({ ...f, ...p });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.title.trim()) { toast('عنوان بنر را وارد کنید.', 'error'); return; }
    if (!f.art && !f.bgImage) { toast('تصویر بنر را انتخاب کنید.', 'error'); return; }
    save('banners', { ...f, title: f.title.trim() });
    toast('بنر ذخیره شد.');
    onClose();
  };

  return (
    <Modal title={initial.title ? 'ویرایش بنر' : 'بنر جدید'} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="field"><label>عنوان *</label>
          <input className="input" value={f.title} onChange={(e) => set({ title: e.target.value })} />
        </div>
        <div className="field"><label>زیرعنوان</label>
          <input className="input" value={f.subtitle} onChange={(e) => set({ subtitle: e.target.value })} />
        </div>
        <div className="form-grid">
          <div className="field"><label>متن دکمه</label>
            <input className="input" value={f.buttonText} onChange={(e) => set({ buttonText: e.target.value })} />
          </div>
          <div className="field"><label>آدرس مقصد</label>
            <input className="input" value={f.url} onChange={(e) => set({ url: e.target.value })} dir="ltr" placeholder="/shop" />
          </div>
        </div>
        <div className="form-grid">
          <div className="field"><label>جایگاه نمایش</label>
            <select className="select" value={f.placement} onChange={(e) => set({ placement: e.target.value as BannerPlacement })}>
              {PLACEMENTS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>
          <div className="field"><label>ترتیب نمایش</label>
            <input className="input" type="number" value={f.order} onChange={(e) => set({ order: Number(e.target.value) })} />
          </div>
        </div>
        <ImageField label="تصویر بنر (اثر هنری) *" value={f.art} onChange={(v) => set({ art: v })} />
        <ImageField label="پس‌زمینه دسکتاپ (اختیاری — آپلود)" value={f.bgImage} onChange={(v) => set({ bgImage: v })} />
        <ImageField label="پس‌زمینه موبایل (اختیاری — آپلود)" value={f.mobileImage} onChange={(v) => set({ mobileImage: v })} />
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 14 }}>
          {([['themeFrom', 'رنگ شروع'], ['themeTo', 'رنگ پایان'], ['themeAccent', 'رنگ تاکیدی']] as const).map(([k, l]) => (
            <div className="color-row" key={k}>
              <input type="color" value={f[k]} onChange={(e) => set({ [k]: e.target.value } as Partial<Banner>)} aria-label={l} />
              <small>{l}</small>
            </div>
          ))}
        </div>
        {/* live preview */}
        <div style={{ borderRadius: 14, overflow: 'hidden', marginBottom: 14, background: `linear-gradient(120deg, ${f.themeFrom}, ${f.themeTo})`, padding: 20, display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <b style={{ color: '#fff', fontSize: 17 }}>{f.title || 'عنوان بنر'}</b>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, margin: '4px 0 10px' }}>{f.subtitle || 'زیرعنوان...'}</p>
            <span className="btn btn-gold btn-sm">{f.buttonText || 'دکمه'}</span>
          </div>
          {f.art && <img src={f.art} alt="" style={{ width: 90, borderRadius: 10 }} />}
        </div>
        <div className="form-grid">
          <div className="field"><label>تاریخ شروع (اختیاری)</label>
            <input className="input" type="datetime-local" value={f.startsAt ? f.startsAt.slice(0, 16) : ''} onChange={(e) => set({ startsAt: e.target.value ? new Date(e.target.value).toISOString() : undefined })} />
          </div>
          <div className="field"><label>تاریخ پایان (اختیاری)</label>
            <input className="input" type="datetime-local" value={f.endsAt ? f.endsAt.slice(0, 16) : ''} onChange={(e) => set({ endsAt: e.target.value ? new Date(e.target.value).toISOString() : undefined })} />
          </div>
        </div>
        <label className="check" style={{ marginBottom: 14 }}>
          <input type="checkbox" checked={f.enabled} onChange={(e) => set({ enabled: e.target.checked })} /> بنر فعال باشد
        </label>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-gold" type="submit">ذخیره بنر</button>
          <button className="btn btn-ghost" type="button" onClick={onClose}>انصراف</button>
        </div>
      </form>
    </Modal>
  );
}
