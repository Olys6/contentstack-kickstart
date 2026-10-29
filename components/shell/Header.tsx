"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { LANGS, type Lang } from "@/lib/i18n";
import { useHref, useSite } from "./SiteProvider";

export default function Header() {
  const { lang, settings, cart, setCartOpen } = useSite();
  const href = useHref();
  const pathname = usePathname();
  const count = cart.reduce((n, i) => n + i.quantity, 0);

  // Transparent over the hero; frosted once content starts passing beneath it.
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Same page, other language: /fr/pieces/roi-noyer → /en/pieces/roi-noyer
  const switchTo = (to: Lang) => pathname.replace(/^\/(fr|en)(?=\/|$)/, `/${to}`);

  return (
    <header className="fixed inset-x-0 top-0 z-40 text-ivory">
      <div
        className={`pointer-events-none absolute inset-0 border-b transition-[background-color,border-color,backdrop-filter] duration-700 ${scrolled ? "border-ivory/10 bg-ink/75 backdrop-blur-xl" : "border-transparent bg-transparent"}`}
      />
      <nav className="relative mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 md:grid md:h-20 md:grid-cols-[1fr_auto_1fr] md:px-10">
        <div className="hidden items-center gap-8 text-label md:flex">
          <Link href={href("/collection")} className="link-underline" {...settings.$?.nav_collection}>
            {settings.nav_collection}
          </Link>
        </div>

        <Link href={href("/")} className="md:text-center">
          <span className="block whitespace-nowrap font-display text-[1.15rem] tracking-[0.26em] uppercase md:text-[1.7rem] md:tracking-[0.32em]" {...settings.$?.brand_name}>
            {settings.brand_name}
          </span>
        </Link>

        <div className="flex items-center justify-end gap-5 text-label md:gap-8">
          <div className="flex items-center gap-2" aria-label="Language">
            {(Object.keys(LANGS) as Lang[]).map((l, i) => (
              <span key={l} className="flex items-center gap-2">
                {i > 0 && <span className="text-ivory/30">/</span>}
                <Link
                  href={switchTo(l)}
                  hrefLang={l}
                  aria-current={l === lang ? "true" : undefined}
                  className={l === lang ? "text-ivory" : "text-ivory/45 transition-colors hover:text-ivory"}
                >
                  {l.toUpperCase()}
                </Link>
              </span>
            ))}
          </div>
          <button type="button" onClick={() => setCartOpen(true)} className="link-underline flex items-center gap-2 uppercase">
            <span className="hidden sm:inline" {...settings.$?.cart_label}>{settings.cart_label}</span>
            <span className="sm:hidden" aria-hidden>◇</span>
            <span className="tabular-nums text-gold">{count > 0 ? `(${count})` : ""}</span>
          </button>
        </div>
      </nav>
    </header>
  );
}
