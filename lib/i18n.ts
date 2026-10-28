// URL segment → Contentstack locale code. French first: the site opens in /fr.
export const LANGS = { fr: "fr-ch", en: "en-us" } as const;

export type Lang = keyof typeof LANGS;
export type Locale = (typeof LANGS)[Lang];

export const DEFAULT_LANG: Lang = "fr";

export const isLang = (value: string): value is Lang => value in LANGS;

export const toLocale = (lang: Lang): Locale => LANGS[lang];

// Swiss convention: apostrophe thousands separator and ".–" for whole francs,
// e.g. "CHF 4'800.–". Intl's fr-CH output uses a narrow no-break space, which
// reads as French rather than Swiss, so this is formatted by hand.
export function formatPrice(chf: number): string {
  const whole = Math.round(chf)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, "'");
  return `CHF ${whole}.–`;
}

export function fill(template: string | undefined, values: Record<string, string | number>): string {
  return (template ?? "").replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ""));
}
