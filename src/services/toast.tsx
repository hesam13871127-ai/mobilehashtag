import React, {
  createContext, useCallback, useContext, useMemo, useState, type ReactNode,
} from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { uid } from './format';

export type ToastKind = 'success' | 'error' | 'info';
interface Toast { id: string; kind: ToastKind; text: string; }
interface ToastValue { toast: (text: string, kind?: ToastKind) => void; }

const Ctx = createContext<ToastValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const toast = useCallback((text: string, kind: ToastKind = 'success') => {
    const id = uid('t');
    setItems((p) => [...p.slice(-3), { id, kind, text }]);
    window.setTimeout(() => setItems((p) => p.filter((x) => x.id !== id)), 3200);
  }, []);
  const value = useMemo(() => ({ toast }), [toast]);
  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`toast toast-${t.kind}`}>
            {t.kind === 'success' ? <CheckCircle2 size={19} /> : t.kind === 'error' ? <AlertCircle size={19} /> : <Info size={19} />}
            <span>{t.text}</span>
            <button aria-label="بستن" onClick={() => setItems((p) => p.filter((x) => x.id !== t.id))}>
              <X size={15} />
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast(): ToastValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useToast must be used inside ToastProvider');
  return v;
}
