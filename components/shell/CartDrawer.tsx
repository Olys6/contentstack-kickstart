"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getProducts } from "@/lib/contentstack";
import { formatPrice, toLocale } from "@/lib/i18n";
import { useHref, useSite } from "./SiteProvider";

export default function CartDrawer() {
  const { lang, settings, cart, cartOpen, setCartOpen, removeFromCart, clearCart } = useSite();
  const href = useHref();
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [confirmed, setConfirmed] = useState(false);

  // Items keep the title they were added with; refresh them in the current
  // language so switching FR/EN never leaves the cart half-translated.
  useEffect(() => {
    if (!cart.length) return;
    let live = true;
    getProducts(toLocale(lang)).then((products) => {
      if (live) setTitles(Object.fromEntries(products.map((p) => [p.url, p.title])));
    });
    return () => {
      live = false;
    };
  }, [lang, cart.length]);

  useEffect(() => {
    if (!cartOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setCartOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cartOpen, setCartOpen]);

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const close = () => {
    setCartOpen(false);
    setTimeout(() => setConfirmed(false), 500);
  };

  return (
    <div className={`fixed inset-0 z-50 ${cartOpen ? "" : "pointer-events-none"}`} aria-hidden={!cartOpen}>
      <button
        type="button"
        aria-label="Close"
        tabIndex={cartOpen ? 0 : -1}
        onClick={close}
        className={`absolute inset-0 bg-ink/60 backdrop-blur-sm transition-opacity duration-700 ${cartOpen ? "opacity-100" : "opacity-0"}`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={settings.cart_title}
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-ivory/10 bg-ink-soft text-ivory transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${cartOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-8 pt-8">
          <h2 className="font-display text-3xl font-light" {...settings.$?.cart_title}>
            {settings.cart_title}
          </h2>
          <button type="button" onClick={close} className="text-label text-ivory/60 hover:text-ivory" tabIndex={cartOpen ? 0 : -1}>
            ✕
          </button>
        </div>

        {confirmed ? (
          <div className="flex flex-1 flex-col justify-center px-8">
            <span className="mb-6 block h-px w-12 bg-gold" />
            <p className="font-display text-2xl font-light leading-snug" {...settings.$?.checkout_note}>
              {settings.checkout_note}
            </p>
          </div>
        ) : cart.length === 0 ? (
          <p className="flex flex-1 items-center px-8 text-ivory/50" {...settings.$?.cart_empty}>
            {settings.cart_empty}
          </p>
        ) : (
          <>
            <ul className="mt-10 flex-1 divide-y divide-ivory/10 overflow-y-auto px-8">
              {cart.map((item) => (
                <li key={item.url} className="flex items-center gap-5 py-6">
                  <span className="size-10 shrink-0 rounded-full ring-1 ring-ivory/20" style={{ background: item.color }} />
                  <div className="flex-1">
                    <Link href={href(item.url)} onClick={close} className="font-display text-xl">
                      {titles[item.url] ?? item.title}
                    </Link>
                    <p className="mt-1 text-sm tabular-nums text-ivory/50">
                      {item.quantity > 1 && `${item.quantity} × `}
                      {formatPrice(item.price)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.url)}
                    className="text-label text-ivory/40 hover:text-ivory"
                  >
                    {settings.remove_label}
                  </button>
                </li>
              ))}
            </ul>
            <div className="border-t border-ivory/10 px-8 py-8">
              <div className="mb-6 flex items-baseline justify-between">
                <span className="text-label text-ivory/60">{settings.subtotal_label}</span>
                <span className="font-display text-2xl lining-nums tabular-nums">{formatPrice(subtotal)}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setConfirmed(true);
                  clearCart();
                }}
                className="btn-primary w-full"
                {...settings.$?.checkout_label}
              >
                {settings.checkout_label}
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
