/* Shop session: cart, wishlist, demo authentication.
 * Auth is DEMO ONLY (hashed with a non-cryptographic demo hash, stored in
 * localStorage). Never treat it as production security. */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { CartItem, User } from '../models/types';
import { useDB } from './db';
import { uid } from './format';

const CART_KEY = 'mh_cart_v1';
const WISH_KEY = 'mh_wish_v1';
const SESSION_KEY = 'mh_session_v1';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* ignore */ }
}

/** DEMO-ONLY hash. NOT secure. Documented in docs/ARCHITECTURE.md */
export function demoHash(s: string): string {
  let h1 = 0x811c9dc5;
  const salted = `mh#${s}#demo`;
  for (let i = 0; i < salted.length; i++) {
    h1 ^= salted.charCodeAt(i);
    h1 = Math.imul(h1, 0x01000193) >>> 0;
  }
  return 'dh_' + h1.toString(16);
}

interface ShopValue {
  cart: CartItem[];
  cartCount: number;
  addToCart: (productId: string, variantKey: string, variantLabel: string, qty?: number) => void;
  setQty: (productId: string, variantKey: string, qty: number) => void;
  removeFromCart: (productId: string, variantKey: string) => void;
  clearCart: () => void;
  wishlist: string[];
  toggleWishlist: (productId: string) => boolean;
  user: User | null;
  login: (phone: string, password: string) => { ok: boolean; message: string };
  register: (name: string, phone: string, password: string) => { ok: boolean; message: string };
  logout: () => void;
}

const Ctx = createContext<ShopValue | null>(null);

export function ShopProvider({ children }: { children: ReactNode }) {
  const { db, save } = useDB();
  const [cart, setCart] = useState<CartItem[]>(() => read(CART_KEY, []));
  const [wishlist, setWishlist] = useState<string[]>(() => read(WISH_KEY, []));
  const [userId, setUserId] = useState<string | null>(() => read(SESSION_KEY, null));

  useEffect(() => write(CART_KEY, cart), [cart]);
  useEffect(() => write(WISH_KEY, wishlist), [wishlist]);
  useEffect(() => write(SESSION_KEY, userId), [userId]);

  const user = useMemo(
    () => db.users.find((u) => u.id === userId) || null,
    [db.users, userId],
  );

  const addToCart = useCallback(
    (productId: string, variantKey: string, variantLabel: string, qty = 1) => {
      setCart((prev) => {
        const idx = prev.findIndex(
          (i) => i.productId === productId && i.variantKey === variantKey,
        );
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], qty: Math.min(99, next[idx].qty + qty) };
          return next;
        }
        return [...prev, { productId, variantKey, variantLabel, qty }];
      });
    },
    [],
  );
  const setQty = useCallback((productId: string, variantKey: string, qty: number) => {
    setCart((prev) =>
      qty <= 0
        ? prev.filter((i) => !(i.productId === productId && i.variantKey === variantKey))
        : prev.map((i) =>
            i.productId === productId && i.variantKey === variantKey
              ? { ...i, qty: Math.min(99, qty) }
              : i,
          ),
    );
  }, []);
  const removeFromCart = useCallback((productId: string, variantKey: string) => {
    setCart((prev) =>
      prev.filter((i) => !(i.productId === productId && i.variantKey === variantKey)),
    );
  }, []);
  const clearCart = useCallback(() => setCart([]), []);

  const toggleWishlist = useCallback((productId: string) => {
    let added = false;
    setWishlist((prev) => {
      if (prev.includes(productId)) return prev.filter((x) => x !== productId);
      added = true;
      return [...prev, productId];
    });
    return added;
  }, []);

  const login = useCallback(
    (phone: string, password: string) => {
      const u = db.users.find((x) => x.phone === phone.trim());
      if (!u || u.passwordHash !== demoHash(password))
        return { ok: false, message: 'شماره موبایل یا رمز عبور اشتباه است.' };
      setUserId(u.id);
      return { ok: true, message: `خوش آمدید ${u.name}` };
    },
    [db.users],
  );
  const register = useCallback(
    (name: string, phone: string, password: string) => {
      if (db.users.some((x) => x.phone === phone.trim()))
        return { ok: false, message: 'این شماره موبایل قبلاً ثبت شده است.' };
      const id = save('users', {
        id: uid('user'),
        name: name.trim(),
        phone: phone.trim(),
        email: '',
        passwordHash: demoHash(password),
        role: 'customer',
        addresses: [],
        createdAt: new Date().toISOString(),
      } as User);
      setUserId(id);
      return { ok: true, message: 'حساب شما با موفقیت ساخته شد.' };
    },
    [db.users, save],
  );
  const logout = useCallback(() => setUserId(null), []);

  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.qty, 0), [cart]);
  const value = useMemo<ShopValue>(
    () => ({
      cart, cartCount, addToCart, setQty, removeFromCart, clearCart,
      wishlist, toggleWishlist, user, login, register, logout,
    }),
    [cart, cartCount, addToCart, setQty, removeFromCart, clearCart, wishlist, toggleWishlist, user, login, register, logout],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useShop(): ShopValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useShop must be used inside ShopProvider');
  return v;
}
