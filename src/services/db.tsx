/* Central data store: loads seed data, persists every change to localStorage.
 * NOTE: localStorage persistence is a standalone-demo mechanism, NOT a secure
 * multi-user production database. See docs/ARCHITECTURE.md. */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { DB, EntityKey, Settings } from '../models/types';
import { seedDatabase } from '../data/seed';
import { uid } from './format';

const KEY = 'mh_db_v1';

function loadDB(): DB {
  const seed = seedDatabase();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return seed;
    const parsed = JSON.parse(raw) as Partial<DB>;
    return {
      ...seed,
      ...parsed,
      settings: { ...seed.settings, ...(parsed.settings || {}) },
    };
  } catch {
    return seed;
  }
}

interface DBContextValue {
  db: DB;
  save: <K extends EntityKey>(
    entity: K,
    item: DB[K] extends (infer T)[] ? Partial<T> & { id?: string } : never,
  ) => string;
  remove: (entity: EntityKey, id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  resetAll: () => void;
}

const Ctx = createContext<DBContextValue | null>(null);

export function DBProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(() => loadDB());

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(db));
    } catch {
      /* storage full — ignore, app keeps running in-memory */
    }
  }, [db]);

  const save = useCallback<DBContextValue['save']>((entity, item) => {
    const id = (item as { id?: string }).id || uid(entity.slice(0, 3));
    setDb((prev) => {
      const list = [...(prev[entity] as unknown[])];
      const idx = list.findIndex(
        (x) => (x as { id: string }).id === ((item as { id?: string }).id || id),
      );
      const full = { ...item, id } as unknown;
      if (idx >= 0) list[idx] = full;
      else list.unshift(full);
      return { ...prev, [entity]: list };
    });
    return id;
  }, []);

  const remove = useCallback((entity: EntityKey, id: string) => {
    setDb((prev) => ({
      ...prev,
      [entity]: (prev[entity] as { id: string }[]).filter((x) => x.id !== id),
    }));
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setDb((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }));
  }, []);

  const resetAll = useCallback(() => {
    const seed = seedDatabase();
    setDb(seed);
    try {
      localStorage.setItem(KEY, JSON.stringify(seed));
    } catch { /* ignore */ }
  }, []);

  const value = useMemo(
    () => ({ db, save, remove, updateSettings, resetAll }),
    [db, save, remove, updateSettings, resetAll],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDB(): DBContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useDB must be used inside DBProvider');
  return v;
}

/* ---------- selectors ---------- */
export function useProduct(slug: string) {
  const { db } = useDB();
  return db.products.find((p) => p.slug === slug);
}
export function useCategory(slug: string) {
  const { db } = useDB();
  return db.categories.find((c) => c.slug === slug);
}
export function subIds(db: DB, id: string): string[] {
  const out: string[] = [id];
  const kids = db.categories.filter((c) => c.parentId === id);
  for (const k of kids) out.push(...subIds(db, k.id));
  return out;
}
export function productsInCategory(db: DB, slug: string) {
  const cat = db.categories.find((c) => c.slug === slug);
  if (!cat) return [];
  const ids = new Set(subIds(db, cat.id));
  return db.products.filter(
    (p) => p.status === 'published' && p.categoryIds.some((c) => ids.has(c)),
  );
}
