/* Shared admin UI: page head, image picker (library + upload), pills. */
import { useState } from 'react';
import { ImagePlus, Upload, Trash2, Check } from 'lucide-react';
import { useToast } from '../services/toast';
import { Modal, Pagination } from '../components/ui';
import { faNum } from '../services/format';

export const LIB_IMAGES: string[] = [
  ...['iphone-17-pro', 'iphone-16', 'galaxy-s25-ultra', 'galaxy-a56', 'redmi-note-14-pro', 'poco-x7-pro', 'airpods-pro', 'galaxy-buds-3', 'jbl-flip-6', 'soundcore-q30', 'baseus-65w', 'anker-powercore-20k', 'baseus-cable', 'magsafe-charger', 'iphone-leather-case', 'samsung-case', 'tempered-glass', 'lens-protector', 'galaxy-watch-7', 'watch-ultra-band', 'car-wireless-charger', 'gamesir-controller', 'ring-light', 'usb-c-hub', 'magsafe-powerbank', 'soundcore-speaker', 'cleaning-kit'].map((f) => `/images/products/${f}.svg`),
  ...['mobile', 'audio', 'charger-cable', 'powerbank', 'case-cover', 'glass', 'speaker', 'smartwatch', 'car', 'gaming', 'storage', 'photography', 'converter', 'general'].map((f) => `/images/categories/${f}.svg`),
  ...['apple', 'samsung', 'xiaomi', 'poco', 'anker', 'baseus', 'jbl', 'soundcore', 'huawei', 'lenovo'].map((f) => `/images/brands/${f}.svg`),
  '/images/logo/logo.svg', '/images/logo/logo-white.svg', '/images/logo/logo-mark.svg',
];

export function AdminHead({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="admin-top">
      <div>
        <h1>{title}</h1>
        {sub && <div style={{ fontSize: 13, color: 'var(--muted)' }}>{sub}</div>}
      </div>
      <div className="sp">{children}</div>
    </div>
  );
}

export function Pill({ kind, children }: { kind?: 'green' | 'red' | 'gold' | 'blue' | ''; children: React.ReactNode }) {
  return <span className={`pill${kind ? ' ' + kind : ''}`}>{children}</span>;
}

export function ImageField({ label, value, onChange, values, onChangeMany }: {
  label: string;
  value?: string;
  onChange?: (v: string) => void;
  values?: string[];
  onChangeMany?: (v: string[]) => void;
}) {
  const { toast } = useToast();
  const [libOpen, setLibOpen] = useState(false);
  const multi = !!onChangeMany;
  const list = multi ? values || [] : value ? [value] : [];

  const pick = (src: string) => {
    if (multi && onChangeMany) {
      if (!(values || []).includes(src)) onChangeMany([...(values || []), src]);
    } else if (onChange) onChange(src);
    setLibOpen(false);
  };

  const upload = (f: File | undefined) => {
    if (!f) return;
    if (f.size > 900 * 1024) { toast('حجم فایل باید کمتر از ۹۰۰ کیلوبایت باشد.', 'error'); return; }
    if (!f.type.startsWith('image/')) { toast('فقط فایل تصویری انتخاب کنید.', 'error'); return; }
    const r = new FileReader();
    r.onload = () => pick(String(r.result));
    r.readAsDataURL(f);
  };

  const removeAt = (src: string) => {
    if (multi && onChangeMany) onChangeMany((values || []).filter((x) => x !== src));
    else if (onChange) onChange('');
  };

  return (
    <div className="field">
      <label>{label}</label>
      {list.length > 0 && (
        <div className="img-pick-row" style={{ marginBottom: 8 }}>
          {list.map((src, i) => (
            <div key={i} className={`img-pick${i === 0 && multi ? ' main' : ''}`} title={i === 0 && multi ? 'تصویر اصلی' : ''}>
              <img src={src} alt="" />
              <button type="button" onClick={() => removeAt(src)} aria-label="حذف"><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => setLibOpen(true)}>
          <ImagePlus size={15} /> انتخاب از کتابخانه
        </button>
        <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer' }}>
          <Upload size={15} /> آپلود تصویر
          <input type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files?.[0])} />
        </label>
      </div>
      {libOpen && (
        <Modal title="کتابخانه تصاویر" onClose={() => setLibOpen(false)}>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 0 }}>برای انتخاب کلیک کنید ({faNum(LIB_IMAGES.length)} تصویر)</p>
          <div className="lib-grid">
            {LIB_IMAGES.map((src) => (
              <button type="button" key={src} className={list.includes(src) ? 'on' : ''} onClick={() => pick(src)}>
                <img src={src} alt="" loading="lazy" />
              </button>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}

export function SearchBar({ value, onChange, placeholder = 'جستجو...' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      className="input" style={{ minWidth: 220 }} value={value}
      onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
    />
  );
}

export function Pager({ total, page, per, onPage }: { total: number; page: number; per: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / per));
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, flexWrap: 'wrap', gap: 8 }}>
      <span style={{ fontSize: 13, color: 'var(--muted)' }}>نمایش {faNum(Math.min(total, page * per))} از {faNum(total)}</span>
      <Pagination page={Math.min(page, pages)} pages={pages} onChange={onPage} />
    </div>
  );
}

export function CheckIcon() {
  return <Check size={15} color="var(--success)" />;
}
