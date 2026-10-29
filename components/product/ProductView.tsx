"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { getProduct } from "@/lib/contentstack";
import { fill, formatPrice, toLocale } from "@/lib/i18n";
import type { Product } from "@/lib/types";
import { useLiveEntry } from "@/components/live/useLiveEntry";
import { useHref, useSite } from "@/components/shell/SiteProvider";

const PieceCanvas = dynamic(() => import("@/components/three/PieceCanvas"), { ssr: false });

export default function ProductView({ initial, siblings }: { initial: Product; siblings: Product[] }) {
  const { lang, settings, addToCart } = useSite();
  const href = useHref();
  const product = useLiveEntry(initial, () => getProduct(initial.url, toLocale(lang)));
  const material = product.material?.[0];
  const [added, setAdded] = useState(false);

  const add = () => {
    addToCart({ url: product.url, title: product.title, price: product.price, color: material?.color ?? "#777" });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="grid min-h-[100svh] lg:grid-cols-[1.25fr_1fr]">
      <div className="relative h-[70svh] lg:sticky lg:top-0 lg:h-[100svh]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,#1f1c17,transparent_65%)]" />
        {material && (
          <PieceCanvas
            material={material}
            interactive
            distance={3.1}
            label={fill(settings.model_label, { name: product.title })}
          />
        )}
      </div>

      <div className="relative z-10 flex flex-col justify-center px-4 pb-24 pt-10 md:px-12 lg:pt-32 xl:px-20">
        {material?.origin && (
          <p className="text-label mb-6 text-gold" {...material.$?.origin}>
            {material.origin}
          </p>
        )}
        <h1 className="font-display text-[clamp(2.8rem,4.5vw,4.5rem)] font-light leading-[0.95]" {...product.$?.title}>
          {product.title}
        </h1>
        {product.tagline && (
          <p className="mt-5 font-display text-2xl font-light italic text-ivory/70" {...product.$?.tagline}>
            {product.tagline}
          </p>
        )}

        <div className="mt-10 flex items-baseline justify-between border-y border-ivory/10 py-6">
          <span className="font-display text-3xl lining-nums tabular-nums" {...product.$?.price}>
            {formatPrice(product.price)}
          </span>
          {product.edition_size ? (
            <span className="text-label text-ivory/50" {...product.$?.edition_size}>
              {fill(settings.edition_label, { n: product.edition_size })}
            </span>
          ) : null}
        </div>

        <div className="mt-8">
          <p className="text-label mb-4 text-ivory/50">
            {settings.material_label} — <span className="text-ivory">{material?.title}</span>
          </p>
          <div className="flex gap-3">
            {siblings.map((s) => {
              const m = s.material?.[0];
              const current = s.url === product.url;
              return (
                <Link
                  key={s.uid}
                  href={href(s.url)}
                  scroll={false}
                  aria-label={m?.title}
                  aria-current={current ? "true" : undefined}
                  title={m?.title}
                  className={`size-11 rounded-full transition-all duration-500 ${current ? "ring-1 ring-gold ring-offset-4 ring-offset-ink" : "ring-1 ring-ivory/15 hover:scale-110"}`}
                  style={{ background: `radial-gradient(circle at 35% 30%, ${m?.accent_color}, ${m?.color} 70%)` }}
                />
              );
            })}
          </div>
        </div>

        <button type="button" onClick={add} className="btn-primary mt-10 w-full">
          {added ? `${settings.added_to_cart} ✓` : settings.add_to_cart}
        </button>

        {product.description && (
          <p className="mt-12 leading-relaxed text-ivory/70" {...product.$?.description}>
            {product.description}
          </p>
        )}
        {material?.description && (
          <p className="mt-4 leading-relaxed text-ivory/50" {...material.$?.description}>
            {material.description}
          </p>
        )}

        <dl className="mt-10 divide-y divide-ivory/10 border-t border-ivory/10 text-sm" {...product.$?.details}>
          {product.height_mm ? (
            <div className="flex justify-between py-4">
              <dt className="text-ivory/50">{settings.height_label}</dt>
              <dd className="tabular-nums">{product.height_mm} mm</dd>
            </div>
          ) : null}
          {product.details?.map((d, i) => (
            <div key={i} className="flex justify-between gap-6 py-4" {...product.$?.[`details__${i}`]}>
              <dt className="text-ivory/50" {...d.$?.label}>
                {d.label}
              </dt>
              <dd className="text-right" {...d.$?.value}>
                {d.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
