// Seeds Maison Roque content in en-us and fr-ch, then publishes to `preview`.
// Safe to re-run: entries are matched by slug / url and updated in place.
//
//   csdx cm:stacks:migration --alias kickstart --file-path migrations/03-seed.js

const ENVIRONMENTS = ["preview"];
const LOCALES = ["en-us", "fr-ch"];

const ref = (uid, ct) => [{ uid, _content_type_uid: ct }];

const materials = [
  {
    slug: "noyer",
    shared: { color: "#5a3a22", accent_color: "#2b1a0e", grain: "wood", roughness: 0.55, metalness: 0, clearcoat: 0.6 },
    en: { title: "Jura walnut", origin: "Jura, Switzerland", description: "Air-dried for three years, finished in natural oil and beeswax." },
    fr: { title: "Noyer du Jura", origin: "Jura, Suisse", description: "Séché à l'air libre pendant trois ans, fini à l'huile naturelle et à la cire d'abeille." },
  },
  {
    slug: "marbre",
    shared: { color: "#ebe8e3", accent_color: "#8d8f94", grain: "marble", roughness: 0.22, metalness: 0, clearcoat: 0.9 },
    en: { title: "Carrara marble", origin: "Carrara, Italy", description: "Cut from a single block of Statuario, polished by hand to a soft sheen." },
    fr: { title: "Marbre de Carrare", origin: "Carrare, Italie", description: "Taillé dans un bloc unique de Statuario, poli à la main jusqu'à un lustre doux." },
  },
  {
    slug: "laiton",
    shared: { color: "#c9a464", accent_color: "#8a6a35", grain: "metal", roughness: 0.3, metalness: 1, clearcoat: 0 },
    en: { title: "Brushed brass", origin: "Vallée de Joux, Switzerland", description: "Solid brass, turned and brushed by hand. It darkens gently with every game." },
    fr: { title: "Laiton brossé", origin: "Vallée de Joux, Suisse", description: "Laiton massif, tourné et brossé à la main. Il se patine doucement au fil des parties." },
  },
  {
    slug: "chene-fume",
    shared: { color: "#3b2d23", accent_color: "#17110c", grain: "wood", roughness: 0.62, metalness: 0, clearcoat: 0.3 },
    en: { title: "Smoked oak", origin: "Vosges, France", description: "Oak darkened by ammonia fuming, a technique older than the Staunton pattern itself." },
    fr: { title: "Chêne fumé", origin: "Vosges, France", description: "Chêne assombri par fumage à l'ammoniaque, une technique plus ancienne que le modèle Staunton lui-même." },
  },
  {
    slug: "acier",
    shared: { color: "#2b2c30", accent_color: "#121316", grain: "metal", roughness: 0.4, metalness: 1, clearcoat: 0.25 },
    en: { title: "Blackened steel", origin: "Geneva, Switzerland", description: "Stainless steel, blackened and satin-finished in our Geneva workshop." },
    fr: { title: "Acier noirci", origin: "Genève, Suisse", description: "Acier inoxydable, noirci et satiné dans notre atelier genevois." },
  },
];

const details = {
  en: (weight, lead) => [
    { label: "Weight", value: weight },
    { label: "Base", value: "Charcoal wool felt" },
    { label: "Lead time", value: lead },
    { label: "Signature", value: "Numbered and signed under the base" },
  ],
  fr: (weight, lead) => [
    { label: "Poids", value: weight },
    { label: "Base", value: "Feutre de laine anthracite" },
    { label: "Délai", value: lead },
    { label: "Signature", value: "Numérotée et signée sous la base" },
  ],
};

const products = [
  {
    url: "/pieces/roi-noyer",
    material: "noyer",
    shared: { price: 1850, edition_size: 88, height_mm: 118 },
    en: { title: "The King — Walnut", tagline: "Warm, quiet, made to be held.", description: "Our first king, and still the one we reach for. Jura walnut turned on the lathe, its grain running from base to crown.", details: details.en("240 g", "6 weeks") },
    fr: { title: "Le Roi — Noyer", tagline: "Chaleureux, discret, fait pour la main.", description: "Notre premier roi, et toujours celui que nous choisissons. Noyer du Jura tourné au tour, le fil du bois courant de la base à la couronne.", details: details.fr("240 g", "6 semaines") },
  },
  {
    url: "/pieces/roi-marbre",
    material: "marbre",
    shared: { price: 3400, edition_size: 32, height_mm: 118 },
    en: { title: "The King — Marble", tagline: "Cold to the touch, impossible to ignore.", description: "Each piece is cut from the same block of Statuario, so no two kings share the same veining.", details: details.en("410 g", "12 weeks") },
    fr: { title: "Le Roi — Marbre", tagline: "Froid au toucher, impossible à ignorer.", description: "Chaque pièce est taillée dans le même bloc de Statuario : aucun roi ne partage les mêmes veines.", details: details.fr("410 g", "12 semaines") },
  },
  {
    url: "/pieces/roi-laiton",
    material: "laiton",
    shared: { price: 4800, edition_size: 24, height_mm: 118 },
    en: { title: "The King — Brass", tagline: "A king that keeps the light.", description: "Solid brass from the Vallée de Joux, brushed by hand. Over the years it takes on the patina of every game played.", details: details.en("620 g", "10 weeks") },
    fr: { title: "Le Roi — Laiton", tagline: "Un roi qui garde la lumière.", description: "Laiton massif de la Vallée de Joux, brossé à la main. Au fil des années, il prend la patine de chaque partie jouée.", details: details.fr("620 g", "10 semaines") },
  },
  {
    url: "/pieces/roi-chene-fume",
    material: "chene-fume",
    shared: { price: 1950, edition_size: 88, height_mm: 118 },
    en: { title: "The King — Smoked oak", tagline: "Darker, deeper, unhurried.", description: "Fumed oak from the Vosges, with a depth of colour that stain could never give.", details: details.en("250 g", "6 weeks") },
    fr: { title: "Le Roi — Chêne fumé", tagline: "Plus sombre, plus profond, sans hâte.", description: "Chêne des Vosges fumé, d'une profondeur de teinte qu'aucune lasure ne saurait donner.", details: details.fr("250 g", "6 semaines") },
  },
  {
    url: "/pieces/roi-acier",
    material: "acier",
    shared: { price: 2900, edition_size: 64, height_mm: 118 },
    en: { title: "The King — Steel", tagline: "Precise, as a Geneva king should be.", description: "Blackened stainless steel with a satin finish, machined to the tolerances of a watch case.", details: details.en("580 g", "8 weeks") },
    fr: { title: "Le Roi — Acier", tagline: "Précis, comme un roi genevois se doit de l'être.", description: "Acier inoxydable noirci au fini satiné, usiné aux tolérances d'une boîte de montre.", details: details.fr("580 g", "8 semaines") },
  },
];

const cam = (azimuth, elevation, distance, focus, offset) => ({ azimuth, elevation, distance, focus, offset });

const chapterShape = [
  { layout: "hero", material: "noyer", camera: cam(20, 4, 4.6, 0.2, 0) },
  { layout: "left", material: "noyer", camera: cam(-35, 18, 0.9, 0.88, 0.45) },
  { layout: "right", material: "marbre", camera: cam(70, 2, 1.7, 0.55, -0.45) },
  { layout: "left", material: "laiton", camera: cam(150, -6, 1.5, 0.5, 0.42) },
  { layout: "right", material: "chene-fume", camera: cam(220, 28, 1.2, 0.15, -0.42) },
];

const chapterCopy = {
  en: [
    { eyebrow: "Chess atelier · Geneva", headline: "The King", body: "One piece. Eight months in the workshop." },
    { eyebrow: "I — The crown", headline: "It all begins with the cross.", body: "Polished brass, turned and fitted to a hundredth of a millimetre, the cross is the one part all our kings share." },
    { eyebrow: "II — The lathe", headline: "Born from a single profile.", body: "Every king is turned from a single drawing, base to crown. Only the collar is knurled, as finely as a piece of watchmaking." },
    { eyebrow: "III — The material", headline: "Five materials, one character.", body: "Jura walnut, Carrara marble, brushed brass, smoked oak, blackened steel. Each brings its own weight, its own light and its own hours at the bench." },
    { eyebrow: "IV — The base", headline: "Weighted so it never wavers.", body: "A tungsten core and a base wrapped in wool felt. Set on the board, the king holds its ground." },
  ],
  fr: [
    { eyebrow: "Atelier d'échecs · Genève", headline: "Le Roi", body: "Une seule pièce. Huit mois d'atelier." },
    { eyebrow: "I — La couronne", headline: "Tout commence par la croix.", body: "En laiton poli, tournée puis ajustée au centième de millimètre, la croix est la seule pièce que partagent tous nos rois." },
    { eyebrow: "II — Le tour", headline: "Né d'un seul profil.", body: "Chaque roi est tourné à partir d'un unique dessin, de la base à la couronne. Seul le col reçoit un moletage, aussi fin que celui d'une pièce d'horlogerie." },
    { eyebrow: "III — La matière", headline: "Cinq matières, un caractère.", body: "Noyer du Jura, marbre de Carrare, laiton brossé, chêne fumé, acier noirci. Chaque matière impose son poids, sa lumière et son temps d'établi." },
    { eyebrow: "IV — L'assise", headline: "Lesté pour ne jamais vaciller.", body: "Un cœur de tungstène, une base gainée de feutre de laine. Posé sur l'échiquier, le roi tient sa place." },
  ],
};

const teaserCopy = {
  en: { eyebrow: "The collection", headline: "Choose your king.", body: "Every edition is numbered and signed in the workshop.", cta_label: "View the collection" },
  fr: { eyebrow: "La collection", headline: "Choisissez votre roi.", body: "Chaque édition est numérotée et signée à l'atelier.", cta_label: "Voir la collection" },
};

const collectionCopy = {
  en: { title: "Collection", eyebrow: "The collection", headline: "Five kings, five materials.", intro: "Limited editions, turned and finished by hand in our Geneva workshop. Viewings by appointment." },
  fr: { title: "Collection", eyebrow: "La collection", headline: "Cinq rois, cinq matières.", intro: "Des éditions limitées, tournées et finies à la main dans notre atelier genevois. Présentation sur rendez-vous." },
};

const settingsCopy = {
  en: {
    title: "Site settings",
    brand_name: "Maison Roque",
    brand_tagline: "Chess atelier · Geneva",
    nav_home: "The Maison",
    nav_collection: "Collection",
    cart_label: "Selection",
    cart_title: "Your selection",
    cart_empty: "Your selection is empty.",
    add_to_cart: "Add to selection",
    added_to_cart: "Added",
    remove_label: "Remove",
    subtotal_label: "Subtotal",
    checkout_label: "Request an appointment",
    checkout_note: "Thank you. A member of the atelier will contact you within 48 hours to arrange a private viewing in Geneva.",
    discover_label: "Discover",
    edition_label: "Limited to {n} pieces",
    height_label: "Height",
    material_label: "Material",
    scroll_hint: "Scroll",
    clock_label: "Geneva time",
    model_label: "3D model: {name}",
    footer_note: "A demonstration project built with Contentstack and Next.js. Maison Roque is a fictional brand.",
  },
  fr: {
    title: "Paramètres du site",
    brand_name: "Maison Roque",
    brand_tagline: "Atelier d'échecs · Genève",
    nav_home: "La Maison",
    nav_collection: "Collection",
    cart_label: "Sélection",
    cart_title: "Votre sélection",
    cart_empty: "Votre sélection est vide.",
    add_to_cart: "Ajouter à la sélection",
    added_to_cart: "Ajouté",
    remove_label: "Retirer",
    subtotal_label: "Sous-total",
    checkout_label: "Demander un rendez-vous",
    checkout_note: "Merci. Un membre de l'atelier vous contactera sous 48 heures pour convenir d'une présentation privée à Genève.",
    discover_label: "Découvrir",
    edition_label: "Édition limitée à {n} exemplaires",
    height_label: "Hauteur",
    material_label: "Matière",
    scroll_hint: "Faire défiler",
    clock_label: "Heure de Genève",
    model_label: "Modèle 3D : {name}",
    footer_note: "Projet de démonstration réalisé avec Contentstack et Next.js. Maison Roque est une marque fictive.",
  },
};

module.exports = async ({ migration, stackSDKInstance }) => {
  const uids = { material: {}, product: {} };

  // Find an entry by a field value (or the only entry for singletons),
  // create or update it in en-us, then localise it into fr-ch.
  async function upsert(ctUid, match, en, fr) {
    const ct = stackSDKInstance.contentType(ctUid);
    const query = match ? { [match[0]]: match[1] } : {};
    const { items } = await ct.entry().query({ query, locale: "en-us" }).find();
    let uid;
    if (items.length) {
      const entry = items[0];
      Object.assign(entry, en);
      await entry.update({ locale: "en-us" });
      uid = entry.uid;
    } else {
      const created = await ct.entry().create({ entry: en }, { locale: "en-us" });
      uid = created.uid;
    }
    const localized = await ct.entry(uid).fetch({ locale: "fr-ch" });
    Object.assign(localized, fr);
    await localized.update({ locale: "fr-ch" });
    return uid;
  }

  // Publishing with several locales in one call only publishes the one named in
  // `locale`, so each localised version is published on its own.
  async function publish(ctUid, uid) {
    for (const locale of LOCALES) {
      await stackSDKInstance
        .contentType(ctUid)
        .entry(uid)
        .publish({ publishDetails: { locales: [locale], environments: ENVIRONMENTS }, locale });
    }
  }

  migration.addTask({
    title: "Seed materials",
    successTitle: "Materials seeded",
    failedTitle: "Materials failed",
    task: async () => {
      for (const m of materials) {
        const uid = await upsert(
          "material",
          ["slug", m.slug],
          { ...m.en, ...m.shared, slug: m.slug },
          { ...m.fr, ...m.shared, slug: m.slug },
        );
        uids.material[m.slug] = uid;
        await publish("material", uid);
      }
    },
  });

  migration.addTask({
    title: "Seed products",
    successTitle: "Products seeded",
    failedTitle: "Products failed",
    task: async () => {
      for (const p of products) {
        const base = { ...p.shared, url: p.url, material: ref(uids.material[p.material], "material") };
        const uid = await upsert("product", ["url", p.url], { ...base, ...p.en }, { ...base, ...p.fr });
        uids.product[p.url] = uid;
        await publish("product", uid);
      }
    },
  });

  migration.addTask({
    title: "Seed collection page",
    successTitle: "Collection page seeded",
    failedTitle: "Collection page failed",
    task: async () => {
      const list = products.map((p) => ({ uid: uids.product[p.url], _content_type_uid: "product" }));
      const base = { url: "/collection", products: list };
      const uid = await upsert("collection_page", null, { ...base, ...collectionCopy.en }, { ...base, ...collectionCopy.fr });
      await publish("collection_page", uid);
    },
  });

  migration.addTask({
    title: "Seed home",
    successTitle: "Home seeded",
    failedTitle: "Home failed",
    task: async () => {
      const featured = ["/pieces/roi-noyer", "/pieces/roi-marbre", "/pieces/roi-laiton"].map((u) => ({
        uid: uids.product[u],
        _content_type_uid: "product",
      }));
      const chapters = (lang) => [
        ...chapterShape.map((shape, i) => ({
          chapter: {
            ...chapterCopy[lang][i],
            layout: shape.layout,
            material: ref(uids.material[shape.material], "material"),
            camera: shape.camera,
          },
        })),
        { collection_teaser: { ...teaserCopy[lang], products: featured, camera: cam(380, 10, 3.6, 0.2, 0) } },
      ];
      const uid = await upsert(
        "home",
        null,
        { title: "Home", url: "/", seo_description: "Maison Roque — heirloom chess kings, turned by hand in Geneva.", chapters: chapters("en") },
        { title: "Accueil", url: "/", seo_description: "Maison Roque — des rois d'échecs tournés à la main à Genève.", chapters: chapters("fr") },
      );
      await publish("home", uid);
    },
  });

  migration.addTask({
    title: "Seed site settings",
    successTitle: "Site settings seeded",
    failedTitle: "Site settings failed",
    task: async () => {
      const uid = await upsert("site_settings", null, settingsCopy.en, settingsCopy.fr);
      await publish("site_settings", uid);
    },
  });
};
