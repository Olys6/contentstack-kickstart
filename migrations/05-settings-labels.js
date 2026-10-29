// Sets newly added site-settings labels in both locales, without touching any
// other setting. Run 02-content-types.js first (it adds the fields).
//
//   csdx cm:stacks:migration --alias kickstart --file-path migrations/05-settings-labels.js

const LABELS = {
  "en-us": { clock_label: "Geneva time", model_label: "3D model: {name}" },
  "fr-ch": { clock_label: "Heure de Genève", model_label: "Modèle 3D : {name}" },
};

module.exports = async ({ migration, stackSDKInstance }) => {
  migration.addTask({
    title: "Set site-settings labels",
    successTitle: "Labels set",
    failedTitle: "Labels failed",
    task: async () => {
      const ct = stackSDKInstance.contentType("site_settings");
      const { items } = await ct.entry().query({ locale: "en-us" }).find();
      const uid = items[0].uid;
      for (const [locale, labels] of Object.entries(LABELS)) {
        const entry = await ct.entry(uid).fetch({ locale });
        Object.assign(entry, labels);
        await entry.update({ locale });
        await ct.entry(uid).publish({ publishDetails: { locales: [locale], environments: ["preview"] }, locale });
      }
    },
  });
};
