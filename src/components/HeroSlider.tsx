import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Banner } from '../models/types';

function isLight(hex: string): boolean {
  const h = hex.replace('#', '');
  if (h.length < 6) return false;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (r * 0.299 + g * 0.587 + b * 0.114) > 150;
}

export default function HeroSlider({ banners }: { banners: Banner[] }) {
  const [i, setI] = useState(0);
  const list = banners.filter((b) => b.enabled).sort((a, b) => a.order - b.order);
  useEffect(() => {
    if (list.length < 2) return;
    const id = window.setInterval(() => setI((v) => (v + 1) % list.length), 6000);
    return () => window.clearInterval(id);
  }, [list.length]);
  if (list.length === 0) return null;
  const idx = i % list.length;
  return (
    <div className="hero" role="region" aria-label="پیشنهادهای ویژه">
      {list.map((b, k) => (
        <div
          key={b.id}
          className={`slide${k === idx ? ' active' : ''}${isLight(b.themeFrom) ? ' light' : ''}`}
          style={{ background: `linear-gradient(120deg, ${b.themeFrom}, ${b.themeTo})` }}
        >
          <div className="slide-content">
            <span className="badge badge-gold" style={{ marginBottom: 10 }}>پیشنهاد ویژه</span>
            <h1>{b.title}</h1>
            <p>{b.subtitle}</p>
            <Link className="btn btn-gold" to={b.url}>{b.buttonText}</Link>
          </div>
          <div className="slide-art">
            {b.art && <img src={b.art} alt={b.title} loading={k === 0 ? 'eager' : 'lazy'} />}
          </div>
        </div>
      ))}
      {list.length > 1 && (
        <>
          <button className="arrow prev" onClick={() => setI((idx - 1 + list.length) % list.length)} aria-label="اسلاید قبلی"><ChevronRight size={20} /></button>
          <button className="arrow next" onClick={() => setI((idx + 1) % list.length)} aria-label="اسلاید بعدی"><ChevronLeft size={20} /></button>
          <div className="dots">
            {list.map((b, k) => (
              <button key={b.id} className={k === idx ? 'on' : ''} onClick={() => setI(k)} aria-label={`اسلاید ${k + 1}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
