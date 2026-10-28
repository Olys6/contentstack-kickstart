"use client";

import { useSite } from "./SiteProvider";

export default function Footer() {
  const { settings } = useSite();
  return (
    <footer className="relative z-10 border-t border-ivory/10 bg-ink px-4 py-12 text-ivory/45 md:px-10">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <span className="font-display text-lg tracking-[0.3em] uppercase text-ivory/70" {...settings.$?.brand_name}>
          {settings.brand_name}
        </span>
        <span className="text-label" {...settings.$?.brand_tagline}>
          {settings.brand_tagline}
        </span>
        <p className="max-w-md text-sm md:text-right" {...settings.$?.footer_note}>
          {settings.footer_note}
        </p>
      </div>
    </footer>
  );
}
