"use client";

import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { getSiteSettings } from "@/lib/contentstack";
import { toLocale, type Lang } from "@/lib/i18n";
import type { SiteSettings } from "@/lib/types";
import { useLiveEntry } from "@/components/live/useLiveEntry";

export interface CartItem {
  url: string;
  title: string;
  price: number;
  color: string;
  quantity: number;
}

interface Site {
  lang: Lang;
  settings: SiteSettings;
  cart: CartItem[];
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addToCart: (item: Omit<CartItem, "quantity">) => void;
  removeFromCart: (url: string) => void;
  clearCart: () => void;
}

const SiteContext = createContext<Site | null>(null);

// The cart lives in localStorage, a per-browser convenience: if storage is
// unavailable it simply starts empty and lasts for the visit.
const cartStore = (() => {
  const KEY = "maison-roque:cart";
  const EMPTY: CartItem[] = [];
  const listeners = new Set<() => void>();
  let items: CartItem[] | null = null;

  const read = () => {
    if (items === null) {
      try {
        items = JSON.parse(localStorage.getItem(KEY) ?? "[]") as CartItem[];
      } catch {
        items = [];
      }
    }
    return items;
  };

  return {
    read,
    server: () => EMPTY,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    update(fn: (items: CartItem[]) => CartItem[]) {
      items = fn(read());
      try {
        localStorage.setItem(KEY, JSON.stringify(items));
      } catch {}
      listeners.forEach((l) => l());
    },
  };
})();

export function useSite() {
  const site = useContext(SiteContext);
  if (!site) throw new Error("useSite must be used inside <SiteProvider>");
  return site;
}

/** Prefix a site path with the current language: href("/collection") → "/fr/collection". */
export function useHref() {
  const { lang } = useSite();
  return useCallback((path: string) => `/${lang}${path === "/" ? "" : path}`, [lang]);
}

export default function SiteProvider({
  lang,
  initialSettings,
  children,
}: {
  lang: Lang;
  initialSettings: SiteSettings;
  children: ReactNode;
}) {
  const settings = useLiveEntry(initialSettings, () => getSiteSettings(toLocale(lang)));
  const cart = useSyncExternalStore(cartStore.subscribe, cartStore.read, cartStore.server);
  const [cartOpen, setCartOpen] = useState(false);

  const addToCart = useCallback((item: Omit<CartItem, "quantity">) => {
    cartStore.update((items) => {
      const existing = items.find((i) => i.url === item.url);
      if (existing) return items.map((i) => (i.url === item.url ? { ...i, quantity: i.quantity + 1 } : i));
      return [...items, { ...item, quantity: 1 }];
    });
    setCartOpen(true);
  }, []);

  const removeFromCart = useCallback((url: string) => cartStore.update((items) => items.filter((i) => i.url !== url)), []);
  const clearCart = useCallback(() => cartStore.update(() => []), []);

  const value = useMemo(
    () => ({ lang, settings, cart, cartOpen, setCartOpen, addToCart, removeFromCart, clearCart }),
    [lang, settings, cart, cartOpen, addToCart, removeFromCart, clearCart],
  );

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}
