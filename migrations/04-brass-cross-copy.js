// The king's cross became polished brass and the collar gained knurling.
// Rewrites only the body copy of chapters I and II (matched by eyebrow), in
// both locales, leaving every other field as editors left it.
//
//   csdx cm:stacks:migration --alias kickstart --file-path migrations/04-brass-cross-copy.js

const COPY = {
  "en-us": {
    "I — The crown":
      "Polished brass, turned and fitted to a hundredth of a millimetre, the cross is the one part all our kings share.",
    "II — The lathe":
      "Every king is turned from a single drawing, base to crown. Only the collar is knurled, as finely as a piece of watchmaking.",
  },
  "fr-ch": {
    "I — La couronne":
      "En laiton poli, tournée puis ajustée au centième de millimètre, la croix est la seule pièce que partagent tous nos rois.",
    "II — Le tour":
      "Chaque roi est tourné à partir d'un unique dessin, de la base à la couronne. Seul le col reçoit un moletage, aussi fin que celui d'une pièce d'horlogerie.",
  },
};

module.exports = async ({ migration, stackSDKInstance }) => {
  migration.addTask({
    title: "Update chapter copy for the brass cross",
    successTitle: "Chapter copy updated",
    failedTitle: "Chapter copy update failed",
    task: async () => {
      const ct = stackSDKInstance.contentType("home");
      const { items } = await ct.entry().query({ locale: "en-us" }).find();
      const uid = items[0].uid;
      for (const [locale, bodies] of Object.entries(COPY)) {
        const entry = await ct.entry(uid).fetch({ locale });
        let changed = 0;
        for (const block of entry.chapters) {
          const body = block.chapter && bodies[block.chapter.eyebrow];
          if (body) {
            block.chapter.body = body;
            changed++;
          }
        }
        if (!changed) continue;
        await entry.update({ locale });
        await ct.entry(uid).publish({ publishDetails: { locales: [locale], environments: ["preview"] }, locale });
      }
    },
  });
};
