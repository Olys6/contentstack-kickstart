"use client";

import GenevaClock from "./GenevaClock";
import { useSite } from "./SiteProvider";

export default function Footer() {
  const { settings } = useSite();
  return (
    <footer className="relative z-10 border-t border-ivory/10 bg-ink px-4 py-12 text-ivory/45 md:px-10">
      <div className="mx-auto grid max-w-[1440px] gap-10 md:grid-cols-[1fr_auto_1fr] md:items-center">
        <div className="flex flex-col gap-2">
          <span className="font-display text-lg tracking-[0.3em] uppercase text-ivory/70" {...settings.$?.brand_name}>
            {settings.brand_name}
          </span>
          <span className="text-label" {...settings.$?.brand_tagline}>
            {settings.brand_tagline}
          </span>
        </div>
        <div className="text-ivory">
          <GenevaClock />
        </div>
        <p className="max-w-md text-sm md:justify-self-end md:text-right" {...settings.$?.footer_note}>
          {settings.footer_note}
        </p>
      </div>
    </footer>
  );
}
