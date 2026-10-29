"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { getCollectionPage } from "@/lib/contentstack";
import { fill, formatPrice, toLocale } from "@/lib/i18n";
import type { CollectionPage, Product } from "@/lib/types";
import { useLiveEntry } from "@/components/live/useLiveEntry";
import { useHref, useSite } from "@/components/shell/SiteProvider";

const PieceCanvas = dynamic(() => import("@/components/three/PieceCanvas"), { ssr: false });

// First two pieces run large (half width), the rest in thirds: an editorial 2 + 3 rhythm.
function PieceCard({ product, index, wide }: { product: Product; index: number; wide: boolean }) {
  const [hover, setHover] = useState(false);
  const { settings } = useSite();
  const href = useHref();
  const material = product.material?.[0];

  return (
    <Link
      href={href(product.url)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      className={`group relative flex flex-col bg-ink-soft ${wide ? "lg:col-span-3" : "lg:col-span-2"}`}
    >
      <div className={`relative overflow-hidden ${wide ? "aspect-[4/5] lg:aspect-[6/5]" : "aspect-[4/5]"}`}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,#1d1b17,transparent_70%)]" />
        {material && (
          <PieceCanvas
            material={material}
            spin={hover}
            distance={3.2}
            label={fill(settings.model_label, { name: product.title })}
          />
        )}
        <span className="text-label absolute left-6 top-6 text-ivory/40 tabular-nums">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>
      <div className="flex items-end justify-between gap-4 border-t border-ivory/10 p-6">
        <div>
          <h2 className="font-display text-2xl" {...product.$?.title}>
            {product.title}
          </h2>
          <p className="mt-1 text-sm text-ivory/50">
            {material?.title}
            {product.edition_size ? ` · ${fill(settings.edition_label, { n: product.edition_size })}` : ""}
          </p>
        </div>
        <span className="shrink-0 font-display text-lg lining-nums tabular-nums text-ivory/80" {...product.$?.price}>
          {formatPrice(product.price)}
        </span>
      </div>
      <span className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-gold transition-transform duration-700 group-hover:scale-x-100" />
    </Link>
  );
}

export default function CollectionView({ initial }: { initial: CollectionPage }) {
  const { lang } = useSite();
  const page = useLiveEntry(initial, () => getCollectionPage(toLocale(lang)));

  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-32 pt-40 md:px-10">
      <header className="mb-20 grid gap-8 md:grid-cols-[1fr_1fr] md:items-end">
        <div>
          {page.eyebrow && (
            <p className="text-label mb-6 text-gold" {...page.$?.eyebrow}>
              {page.eyebrow}
            </p>
          )}
          <h1 className="font-display text-[clamp(3rem,6vw,5.5rem)] font-light leading-[0.95]" {...page.$?.headline}>
            {page.headline}
          </h1>
        </div>
        {page.intro && (
          <p className="max-w-md text-ivory/60 md:justify-self-end" {...page.$?.intro}>
            {page.intro}
          </p>
        )}
      </header>
      <div className="grid gap-px bg-ivory/10 sm:grid-cols-2 lg:grid-cols-6" {...page.$?.products}>
        {page.products?.map((p, i) => (
          <PieceCard key={p.uid} product={p} index={i} wide={i < 2} />
        ))}
      </div>
    </div>
  );
}
