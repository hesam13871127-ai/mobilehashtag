/* Persian formatting helpers: numbers, currency, dates. */

export function faNum(n: number | string): string {
  const num = typeof n === 'string' ? Number(n) : n;
  if (Number.isNaN(num)) return String(n);
  return num.toLocaleString('fa-IR');
}

export function toman(n: number): string {
  return `${faNum(n)} تومان`;
}

export function faDate(iso: string): string {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(d);
  } catch {
    return iso;
  }
}

export function faDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    return (
      new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(d) +
      ' — ' +
      new Intl.DateTimeFormat('fa-IR', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(d)
    );
  } catch {
    return iso;
  }
}

export function timeLeft(targetIso: string): {
  d: number;
  h: number;
  m: number;
  s: number;
  expired: boolean;
} {
  const diff = new Date(targetIso).getTime() - Date.now();
  if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0, expired: true };
  const s = Math.floor(diff / 1000);
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
    expired: false,
  };
}

export function uid(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export function slugifyFa(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\u0600-\u06FFa-zA-Z0-9\-_]/g, '')
    .replace(/-+/g, '-');
}

export const ORDER_STATUS_FA: Record<string, string> = {
  pending: 'در انتظار بررسی',
  processing: 'در حال پردازش',
  shipped: 'ارسال شده',
  completed: 'تکمیل شده',
  cancelled: 'لغوشده',
};
