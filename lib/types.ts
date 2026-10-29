export interface CSLPAttribute {
  "data-cslp"?: string;
  "data-cslp-parent-field"?: string;
}
export type CSLPFieldMapping = CSLPAttribute;

/** Live Preview tags added by `addEditableTags`, keyed by field uid. */
type Editable<K extends string> = { $?: Partial<Record<K | `${K}__${number}`, CSLPFieldMapping>> };

export interface SystemFields {
  uid: string;
  locale?: string;
  _version?: number;
  _content_type_uid?: string;
  title: string;
}

export type Grain = "wood" | "marble" | "metal" | "none";

export interface Material
  extends SystemFields,
    Editable<"title" | "origin" | "description"> {
  slug: string;
  color: string;
  accent_color: string;
  grain: Grain;
  roughness: number;
  metalness: number;
  clearcoat: number;
  origin?: string;
  description?: string;
}

export interface Camera {
  azimuth: number;
  elevation: number;
  distance: number;
  focus: number;
  offset: number;
}

export interface Detail extends Editable<"label" | "value"> {
  label: string;
  value: string;
}

export interface Product
  extends SystemFields,
    Editable<"title" | "tagline" | "description" | "price" | "edition_size" | "height_mm" | "details"> {
  url: string;
  tagline?: string;
  description?: string;
  material: Material[];
  price: number;
  edition_size?: number;
  height_mm?: number;
  details?: Detail[];
}

export type ChapterLayout = "hero" | "left" | "right" | "center";

export interface Chapter extends Editable<"eyebrow" | "headline" | "body" | "layout" | "material" | "camera"> {
  eyebrow?: string;
  headline?: string;
  body?: string;
  layout: ChapterLayout;
  material?: Material[];
  camera: Camera;
  _metadata?: { uid: string };
}

export interface CollectionTeaser
  extends Editable<"eyebrow" | "headline" | "body" | "cta_label" | "products" | "camera"> {
  eyebrow?: string;
  headline?: string;
  body?: string;
  cta_label?: string;
  products?: Product[];
  camera: Camera;
  _metadata?: { uid: string };
}

export type HomeBlock = { chapter: Chapter } | { collection_teaser: CollectionTeaser };

export interface Home extends SystemFields, Editable<"title" | "chapters"> {
  url: string;
  seo_description?: string;
  chapters: HomeBlock[];
}

export interface CollectionPage extends SystemFields, Editable<"eyebrow" | "headline" | "intro" | "products"> {
  url: string;
  eyebrow?: string;
  headline?: string;
  intro?: string;
  products: Product[];
}

type SettingsKey =
  | "brand_name"
  | "brand_tagline"
  | "nav_home"
  | "nav_collection"
  | "cart_label"
  | "cart_title"
  | "cart_empty"
  | "add_to_cart"
  | "added_to_cart"
  | "remove_label"
  | "subtotal_label"
  | "checkout_label"
  | "checkout_note"
  | "discover_label"
  | "edition_label"
  | "height_label"
  | "material_label"
  | "scroll_hint"
  | "clock_label"
  | "model_label"
  | "footer_note";

export type SiteSettings = SystemFields & Editable<SettingsKey> & Record<SettingsKey, string>;
