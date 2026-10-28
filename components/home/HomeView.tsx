"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { VB_EmptyBlockParentClass } from "@contentstack/live-preview-utils";
import { getHome } from "@/lib/contentstack";
import { formatPrice, toLocale } from "@/lib/i18n";
import type { Chapter, CollectionTeaser, Home, Material } from "@/lib/types";
import { useLiveEntry } from "@/components/live/useLiveEntry";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useHref, useSite } from "@/components/shell/SiteProvider";
import type { Stop } from "./StoryCanvas";

const StoryCanvas = dynamic(() => import("./StoryCanvas"), { ssr: false });

const FALLBACK_MATERIAL: Material = {
  uid: "fallback",
  title: "",
  slug: "fallback",
  color: "#5a3a22",
  accent_color: "#2b1a0e",
  grain: "wood",
  roughness: 0.55,
  metalness: 0,
  clearcoat: 0.5,
};

// Each block becomes a keyframe. A block without a material keeps the
// previous one, so editors only set a material where it should change.
function toStops(home: Home): Stop[] {
  let material = FALLBACK_MATERIAL;
  return home.chapters.map((block) => {
    const data = "chapter" in block ? block.chapter : block.collection_teaser;
    if ("chapter" in block && block.chapter.material?.[0]) material = block.chapter.material[0];
    return { camera: data.camera, material };
  });
}

// Fractional chapter index under the middle of the viewport: 2.5 means halfway
// between the centres of chapter 2 and chapter 3. Read every frame by the scene.
function useChapterProgress(container: React.RefObject<HTMLElement | null>) {
  const progress = useRef(0);
  useEffect(() => {
    let centres: number[] = [];
    const measure = () => {
      const sections = container.current?.querySelectorAll<HTMLElement>("[data-chapter]") ?? [];
      centres = [...sections].map((s) => s.getBoundingClientRect().top + window.scrollY + s.offsetHeight / 2);
    };
    let raf = 0;
    const tick = () => {
      const mid = window.scrollY + window.innerHeight / 2;
      if (centres.length > 1) {
        let i = 0;
        while (i < centres.length - 2 && mid > centres[i + 1]) i++;
        const t = (mid - centres[i]) / (centres[i + 1] - centres[i]);
        progress.current = Math.max(0, Math.min(centres.length - 1, i + t));
      }
      raf = requestAnimationFrame(tick);
    };
    measure();
    tick();
    const ro = new ResizeObserver(measure);
    if (container.current) ro.observe(container.current);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [container]);
  return progress;
}

function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: "-30% 0px -30% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, inView] as const;
}

function ChapterSection({ chapter, index, cslp }: { chapter: Chapter; index: number; cslp?: object }) {
  const [ref, inView] = useInView<HTMLDivElement>();
  const { settings } = useSite();
  const hero = chapter.layout === "hero";

  const place = {
    hero: "items-end justify-center text-center pb-[7svh]",
    center: "items-center justify-center text-center",
    left: "items-end md:items-center justify-start text-left",
    right: "items-end md:items-center justify-end text-left",
  }[chapter.layout ?? "left"];

  return (
    <section
      data-chapter={index}
      className={`relative flex px-4 md:px-[8vw] ${hero ? "min-h-[100svh]" : "min-h-[150svh]"} ${place}`}
      {...cslp}
    >
      <div
        ref={ref}
        className={`reveal ${inView || hero ? "is-in" : ""} ${hero ? "max-w-3xl" : "max-w-md max-md:sticky max-md:bottom-0 max-md:-mx-4 max-md:bg-gradient-to-t max-md:from-ink max-md:via-ink/85 max-md:to-transparent max-md:px-4 max-md:pb-10 max-md:pt-24"}`}
      >
        {chapter.eyebrow && (
          <p className="text-label mb-6 text-gold" {...chapter.$?.eyebrow}>
            {chapter.eyebrow}
          </p>
        )}
        {chapter.headline && (
          <h2
            className={`font-display font-light leading-[0.95] text-balance ${hero ? "text-[clamp(4rem,10vw,8.5rem)] tracking-[-0.02em]" : "text-[clamp(2.4rem,4.4vw,4rem)]"}`}
            {...chapter.$?.headline}
          >
            {chapter.headline}
          </h2>
        )}
        {chapter.body && (
          <p
            className={`mt-6 text-ivory/70 text-pretty ${hero ? "font-display text-2xl italic font-light" : "text-[1.05rem] leading-relaxed"}`}
            {...chapter.$?.body}
          >
            {chapter.body}
          </p>
        )}
        {hero && (
          <p className="text-label mt-10 animate-pulse text-ivory/40" {...settings.$?.scroll_hint}>
            {settings.scroll_hint} ↓
          </p>
        )}
      </div>
    </section>
  );
}

function TeaserSection({ teaser, index, cslp }: { teaser: CollectionTeaser; index: number; cslp?: object }) {
  const [ref, inView] = useInView<HTMLDivElement>();
  const href = useHref();
  return (
    <section
      data-chapter={index}
      className="relative flex min-h-[130svh] items-end bg-gradient-to-b from-transparent via-ink/40 via-60% to-ink px-4 pb-24 md:px-[8vw]"
      {...cslp}
    >
      <div ref={ref} className={`reveal is-staggered w-full ${inView ? "is-in" : ""}`}>
        <div className="mx-auto mb-14 max-w-2xl text-center">
          {teaser.eyebrow && (
            <p className="text-label mb-6 text-gold" {...teaser.$?.eyebrow}>
              {teaser.eyebrow}
            </p>
          )}
          <h2 className="font-display text-[clamp(2.6rem,5vw,4.5rem)] font-light leading-none" {...teaser.$?.headline}>
            {teaser.headline}
          </h2>
          {teaser.body && (
            <p className="mt-6 text-ivory/70" {...teaser.$?.body}>
              {teaser.body}
            </p>
          )}
        </div>
        <div className="mx-auto grid max-w-5xl gap-px bg-ivory/10 md:grid-cols-3" {...teaser.$?.products}>
          {teaser.products?.map((p) => {
            const m = p.material?.[0];
            return (
              <Link
                key={p.uid}
                href={href(p.url)}
                className="group flex items-center gap-5 bg-ink/85 p-6 backdrop-blur-md transition-colors hover:bg-ink-soft"
              >
                <span
                  className="size-11 shrink-0 rounded-full ring-1 ring-ivory/20 transition-transform duration-500 group-hover:scale-110"
                  style={{ background: `radial-gradient(circle at 35% 30%, ${m?.accent_color ?? "#999"}, ${m?.color ?? "#555"} 70%)` }}
                />
                <span className="flex-1">
                  <span className="block font-display text-xl">{p.title}</span>
                  <span className="text-sm tabular-nums text-ivory/50">{formatPrice(p.price)}</span>
                </span>
                <span className="text-ivory/40 transition-transform duration-500 group-hover:translate-x-1">→</span>
              </Link>
            );
          })}
        </div>
        {teaser.cta_label && (
          <div className="mt-12 text-center">
            <Link href={href("/collection")} className="btn-ghost" {...teaser.$?.cta_label}>
              {teaser.cta_label}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

export default function HomeView({ initial }: { initial: Home }) {
  const { lang } = useSite();
  const home = useLiveEntry(initial, () => getHome(toLocale(lang)));
  const container = useRef<HTMLDivElement>(null);
  const progress = useChapterProgress(container);
  const stops = useMemo(() => toStops(home), [home]);
  const reducedMotion = useReducedMotion();

  return (
    <>
      <div className="fixed inset-0 z-0">
        <StoryCanvas stops={stops} progress={progress} reducedMotion={reducedMotion} />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,var(--color-ink)_100%)]" />
      </div>
      <div
        ref={container}
        className={`relative z-10 ${home.chapters.length ? "" : VB_EmptyBlockParentClass}`}
        {...home.$?.chapters}
      >
        {home.chapters.map((block, i) => {
          const cslp = home.$?.[`chapters__${i}`];
          if ("chapter" in block) {
            return <ChapterSection key={block.chapter._metadata?.uid ?? i} chapter={block.chapter} index={i} cslp={cslp} />;
          }
          return (
            <TeaserSection
              key={block.collection_teaser._metadata?.uid ?? i}
              teaser={block.collection_teaser}
              index={i}
              cslp={cslp}
            />
          );
        })}
      </div>
    </>
  );
}
