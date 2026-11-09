import { useState } from 'react';
import { GripVertical, Pencil } from 'lucide-react';
import type { HomeSection } from '../models/types';
import { useDB } from '../services/db';
import { useToast } from '../services/toast';
import { AdminHead, Pill } from './ui';
import { Modal } from '../components/ui';

export default function AdminHomepage() {
  const { db, save } = useDB();
  const { toast } = useToast();
  const [editing, setEditing] = useState<HomeSection | null>(null);

  const list = [...db.sections].sort((a, b) => a.order - b.order);
  const move = (s: HomeSection, dir: -1 | 1) => {
    const i = list.findIndex((x) => x.id === s.id);
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    save('sections', { ...list[i], order: list[j].order });
    save('sections', { ...list[j], order: list[i].order });
  };

  return (
    <div>
      <AdminHead title="مدیریت صفحه اصلی" sub="ترتیب، عنوان و فعال/غیرفعال بودن بخش‌ها" />
      <div className="panel">
        <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 0 }}>
          با دکمه‌های ↑ ↓ ترتیب بخش‌ها را تغییر دهید. تغییرات بلافاصله در صفحه اصلی فروشگاه اعمال می‌شود.
        </p>
        {list.map((s, i) => (
          <div key={s.id} className="drag-row">
            <GripVertical size={18} className="grip" />
            <span className="badge badge-gray">{i + 1}</span>
            <div style={{ flex: 1 }}>
              <b>{s.title}</b>
              <small>{s.subtitle || s.key}</small>
            </div>
            {s.enabled ? <Pill kind="green">فعال</Pill> : <Pill>غیرفعال</Pill>}
            <label className="switch" title="فعال/غیرفعال">
              <input type="checkbox" checked={s.enabled} onChange={() => { save('sections', { ...s, enabled: !s.enabled }); toast(`بخش «${s.title}» ${s.enabled ? 'غیرفعال' : 'فعال'} شد.`); }} />
              <span />
            </label>
            <div className="mv">
              <button className="mini-btn" onClick={() => move(s, -1)} aria-label="بالا">↑</button>
              <button className="mini-btn" onClick={() => move(s, 1)} aria-label="پایین">↓</button>
              <button className="mini-btn" onClick={() => setEditing({ ...s })} aria-label="ویرایش عنوان"><Pencil size={15} /></button>
            </div>
          </div>
        ))}
      </div>
      {editing && (
        <Modal title="ویرایش بخش" onClose={() => setEditing(null)}>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (!editing.title.trim()) { toast('عنوان بخش را وارد کنید.', 'error'); return; }
            save('sections', editing);
            toast('بخش به‌روزرسانی شد.');
            setEditing(null);
          }}>
            <div className="field"><label>عنوان بخش</label>
              <input className="input" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
            </div>
            <div className="field"><label>زیرعنوان</label>
              <input className="input" value={editing.subtitle} onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })} />
            </div>
            <div className="field"><label>تعداد نمایش (در بخش‌های کالایی)</label>
              <input className="input" type="number" min={4} max={12} value={Number(editing.config.limit || 8)} onChange={(e) => setEditing({ ...editing, config: { ...editing.config, limit: Number(e.target.value) } })} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-gold" type="submit">ذخیره</button>
              <button className="btn btn-ghost" type="button" onClick={() => setEditing(null)}>انصراف</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
