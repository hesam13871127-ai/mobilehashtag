/* Shared storefront UI primitives. */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, StarHalf, ChevronLeft, X, PackageOpen, Minus, Plus } from 'lucide-react';
import { faNum, timeLeft, toman } from '../services/format';

export function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <span className="stars" aria-label={`امتیاز ${faNum(rating)} از ۵`}>
      {[0, 1, 2, 3, 4].map((i) =>
        i < full ? (
          <Star key={i} size={size} fill="currentColor" />
        ) : i === full && half ? (
          <StarHalf key={i} size={size} fill="currentColor" />
        ) : (
          <Star key={i} size={size} className="dim" />
        ),
      )}
    </span>
  );
}

export function Price({ value, old, big }: { value: number; old?: number; big?: boolean }) {
  if (big)
    return (
      <div>
        {old && old > value && <div className="old">{toman(old)}</div>}
        <div className="new">{toman(value)}</div>
      </div>
    );
  return (
    <span>
      <b>{faNum(value)}</b> <small style={{ color: 'var(--muted)', fontSize: 12 }}>تومان</small>
    </span>
  );
}

export function Breadcrumb({ items }: { items: Array<{ label: string; to?: string }> }) {
  return (
    <nav className="breadcrumb" aria-label="مسیر صفحه">
      <Link to="/">خانه</Link>
      {items.map((it, i) => (
        <React.Fragment key={i}>
          <ChevronLeft size={14} />
          {it.to ? <Link to={it.to}>{it.label}</Link> : <span>{it.label}</span>}
        </React.Fragment>
      ))}
    </nav>
  );
}

export function SectionHead({ title, subtitle, moreTo, moreLabel = 'مشاهده همه' }: { title: string; subtitle?: string; moreTo?: string; moreLabel?: string }) {
  return (
    <div className="section-head">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {moreTo && (
        <Link className="more-link" to={moreTo}>
          {moreLabel} <ChevronLeft size={16} />
        </Link>
      )}
    </div>
  );
}

export function Pagination({ page, pages, onChange }: { page: number; pages: number; onChange: (p: number) => void }) {
  if (pages <= 1) return null;
  const nums: number[] = [];
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - page) <= 1) nums.push(i);
    else if (nums[nums.length - 1] !== -1) nums.push(-1);
  }
  return (
    <div className="pagination">
      <button disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="قبلی">‹</button>
      {nums.map((n, i) =>
        n === -1 ? (
          <button key={`e${i}`} disabled>…</button>
        ) : (
          <button key={n} className={n === page ? 'active' : ''} onClick={() => onChange(n)}>
            {faNum(n)}
          </button>
        ),
      )}
      <button disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label="بعدی">›</button>
    </div>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [onClose]);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="بستن"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Confirm({ text, onOk, onCancel }: { text: string; onOk: () => void; onCancel: () => void }) {
  return (
    <Modal title="تأیید عملیات" onClose={onCancel}>
      <p style={{ fontSize: 14 }}>{text}</p>
      <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
        <button className="btn btn-danger" onClick={onOk}>بله، انجام شود</button>
        <button className="btn btn-ghost" onClick={onCancel}>انصراف</button>
      </div>
    </Modal>
  );
}

export function Empty({ title, text, action }: { title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className="empty">
      <PackageOpen size={54} strokeWidth={1.4} />
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}

export function QtyInput({ value, onChange, small }: { value: number; onChange: (v: number) => void; small?: boolean }) {
  return (
    <div className="qty" style={small ? { transform: 'scale(0.88)', transformOrigin: 'right center' } : undefined}>
      <button onClick={() => onChange(value + 1)} aria-label="افزایش"><Plus size={16} /></button>
      <span>{faNum(value)}</span>
      <button onClick={() => onChange(value - 1)} aria-label="کاهش"><Minus size={16} /></button>
    </div>
  );
}

export function Countdown({ endsAt }: { endsAt: string }) {
  const [t, setT] = useState(() => timeLeft(endsAt));
  useEffect(() => {
    const id = window.setInterval(() => setT(timeLeft(endsAt)), 1000);
    return () => window.clearInterval(id);
  }, [endsAt]);
  if (t.expired) return null;
  const cell = (v: number, l: string) => (
    <div>{faNum(v)}<small>{l}</small></div>
  );
  return (
    <div className="countdown" aria-label="زمان باقی‌مانده">
      {cell(t.s, 'ثانیه')}{cell(t.m, 'دقیقه')}{cell(t.h, 'ساعت')}{cell(t.d, 'روز')}
    </div>
  );
}
