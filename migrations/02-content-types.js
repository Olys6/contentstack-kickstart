// Creates (or updates in place) the Maison Roque content model.
//
//   csdx cm:stacks:migration --alias kickstart --file-path migrations/02-content-types.js
//
// Order matters: referenced types (material, product) are created before the
// types that point at them.

const text = (uid, display_name, extra = {}) => ({
  uid,
  display_name,
  data_type: "text",
  mandatory: false,
  unique: false,
  multiple: false,
  non_localizable: false,
  field_metadata: { description: "", default_value: "" },
  ...extra,
});

const multiline = (uid, display_name, extra = {}) =>
  text(uid, display_name, { field_metadata: { description: "", default_value: "", multiline: true }, ...extra });

const number = (uid, display_name, extra = {}) => ({
  uid,
  display_name,
  data_type: "number",
  mandatory: false,
  unique: false,
  multiple: false,
  non_localizable: false,
  field_metadata: { description: "", default_value: "" },
  ...extra,
});

const select = (uid, display_name, choices, extra = {}) =>
  text(uid, display_name, {
    display_type: "dropdown",
    enum: { advanced: false, choices: choices.map((value) => ({ value })) },
    field_metadata: { description: "", default_value: choices[0] },
    ...extra,
  });

const reference = (uid, display_name, to, multiple = false, extra = {}) => ({
  uid,
  display_name,
  data_type: "reference",
  reference_to: [to],
  mandatory: false,
  unique: false,
  multiple: false,
  non_localizable: false,
  field_metadata: { ref_multiple: multiple, ref_multiple_content_types: false },
  ...extra,
});

const group = (uid, display_name, schema, extra = {}) => ({
  uid,
  display_name,
  data_type: "group",
  schema,
  mandatory: false,
  multiple: false,
  non_localizable: false,
  field_metadata: {},
  ...extra,
});

const title = () => text("title", "Title", { mandatory: true, unique: false, field_metadata: { _default: true } });
const url = () => text("url", "URL", { mandatory: true, unique: false, field_metadata: { _default: true } });

const camera = () =>
  group(
    "camera",
    "Camera",
    [
      number("azimuth", "Azimuth (degrees around the piece)"),
      number("elevation", "Elevation (degrees above horizon)"),
      number("distance", "Distance (in piece heights; ~2.5 shows the whole piece)"),
      number("focus", "Focus height (0 = base, 1 = crown)"),
      number("offset", "Horizontal offset (-1 left … 1 right)"),
    ],
    { field_metadata: { description: "Where the camera sits when this chapter is centred on screen." } },
  );

const contentTypes = [
  {
    uid: "material",
    title: "Material",
    description: "A finish the king can be made in. Drives the 3D shader directly.",
    options: { is_page: false, singleton: false, title: "title", sub_title: [] },
    schema: [
      title(),
      text("slug", "Slug", { mandatory: true, unique: true, non_localizable: true }),
      text("color", "Base colour (hex)", {
        non_localizable: true,
        format: "^#[0-9a-fA-F]{6}$",
        error_messages: { format: "Use a hex colour like #6b4a2f" },
      }),
      text("accent_color", "Grain / vein colour (hex)", { non_localizable: true, format: "^#[0-9a-fA-F]{6}$" }),
      select("grain", "Grain", ["wood", "marble", "metal", "none"], { non_localizable: true }),
      number("roughness", "Roughness (0–1)", { non_localizable: true }),
      number("metalness", "Metalness (0–1)", { non_localizable: true }),
      number("clearcoat", "Clearcoat (0–1)", { non_localizable: true }),
      text("origin", "Origin"),
      multiline("description", "Description"),
    ],
  },
  {
    uid: "product",
    title: "Product",
    description: "A numbered edition of the king in one material.",
    options: { is_page: true, singleton: false, title: "title", sub_title: [], url_pattern: "", url_prefix: "/pieces/" },
    schema: [
      title(),
      url(),
      text("tagline", "Tagline"),
      multiline("description", "Description"),
      reference("material", "Material", "material", false, { mandatory: true, non_localizable: true }),
      number("price", "Price (CHF)", { mandatory: true, non_localizable: true }),
      number("edition_size", "Edition size", { non_localizable: true }),
      number("height_mm", "Height (mm)", { non_localizable: true }),
      group(
        "details",
        "Details",
        [text("label", "Label"), text("value", "Value")],
        { multiple: true },
      ),
    ],
  },
  {
    uid: "home",
    title: "Home",
    description: "The scroll story. Each chapter moves the camera and can change the material.",
    options: { is_page: true, singleton: true, title: "title", sub_title: [], url_pattern: "", url_prefix: "/" },
    schema: [
      title(),
      url(),
      text("seo_description", "SEO description"),
      {
        uid: "chapters",
        display_name: "Chapters",
        data_type: "blocks",
        multiple: true,
        mandatory: false,
        unique: false,
        non_localizable: false,
        field_metadata: { instruction: "", description: "Scroll top to bottom. The 3D king follows along." },
        blocks: [
          {
            title: "Chapter",
            uid: "chapter",
            schema: [
              text("eyebrow", "Eyebrow"),
              text("headline", "Headline"),
              multiline("body", "Body"),
              select("layout", "Layout", ["hero", "left", "right", "center"]),
              reference("material", "Material", "material"),
              camera(),
            ],
          },
          {
            title: "Collection teaser",
            uid: "collection_teaser",
            schema: [
              text("eyebrow", "Eyebrow"),
              text("headline", "Headline"),
              multiline("body", "Body"),
              text("cta_label", "CTA label"),
              reference("products", "Featured products", "product", true),
              camera(),
            ],
          },
        ],
      },
    ],
  },
  {
    uid: "collection_page",
    title: "Collection page",
    description: "The shop grid. Products appear in the order listed here.",
    options: { is_page: true, singleton: true, title: "title", sub_title: [], url_pattern: "", url_prefix: "/" },
    schema: [
      title(),
      url(),
      text("eyebrow", "Eyebrow"),
      text("headline", "Headline"),
      multiline("intro", "Intro"),
      reference("products", "Products", "product", true),
    ],
  },
  {
    uid: "site_settings",
    title: "Site settings",
    description: "Brand name and every UI label, so the whole interface is translatable.",
    options: { is_page: false, singleton: true, title: "title", sub_title: [] },
    schema: [
      title(),
      text("brand_name", "Brand name"),
      text("brand_tagline", "Brand tagline"),
      text("nav_home", "Nav: home"),
      text("nav_collection", "Nav: collection"),
      text("cart_label", "Cart button"),
      text("cart_title", "Cart title"),
      text("cart_empty", "Cart empty message"),
      text("add_to_cart", "Add to cart"),
      text("added_to_cart", "Added to cart"),
      text("remove_label", "Remove"),
      text("subtotal_label", "Subtotal"),
      text("checkout_label", "Checkout button"),
      multiline("checkout_note", "Checkout confirmation"),
      text("discover_label", "Discover link"),
      text("edition_label", "Edition label (use {n})"),
      text("height_label", "Height label"),
      text("material_label", "Material label"),
      text("scroll_hint", "Scroll hint"),
      text("clock_label", "Clock label (Geneva time)"),
      text("model_label", "3D model description for screen readers (use {name})"),
      text("footer_note", "Footer note"),
    ],
  },
];

module.exports = async ({ migration, stackSDKInstance }) => {
  for (const ct of contentTypes) {
    migration.addTask({
      title: `Content type: ${ct.uid}`,
      successTitle: `Content type ${ct.uid} ready`,
      failedTitle: `Content type ${ct.uid} failed`,
      task: async () => {
        let existing;
        try {
          existing = await stackSDKInstance.contentType(ct.uid).fetch();
        } catch {
          existing = null;
        }
        if (existing) {
          Object.assign(existing, ct);
          await existing.update();
        } else {
          await stackSDKInstance.contentType().create({ content_type: ct });
        }
      },
    });
  }
};
