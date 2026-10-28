// Adds fr-ch (falling back to en-us) and points the preview environment at the
// locale-prefixed routes so Live Preview / Visual Builder open the right URL.
//
//   csdx cm:stacks:migration --alias kickstart --file-path migrations/01-locales.js
//
// Override the site origin with: --inline-config baseUrl:https://your-deploy.app

module.exports = async ({ migration, stackSDKInstance, config }) => {
  const baseUrl = (config && config.baseUrl) || "http://localhost:3000";

  migration.addTask({
    title: "Ensure fr-ch locale",
    successTitle: "fr-ch locale ready",
    failedTitle: "Failed to create fr-ch locale",
    task: async () => {
      const { items } = await stackSDKInstance.locale().query().find();
      if (items.some((l) => l.code === "fr-ch")) return;
      await stackSDKInstance.locale().create({
        locale: { code: "fr-ch", name: "French - Switzerland", fallback_locale: "en-us" },
      });
    },
  });

  migration.addTask({
    title: "Point preview environment at /en and /fr",
    successTitle: "Preview environment URLs updated",
    failedTitle: "Failed to update preview environment",
    task: async () => {
      const env = await stackSDKInstance.environment("preview").fetch();
      env.urls = [
        { locale: "en-us", url: `${baseUrl}/en` },
        { locale: "fr-ch", url: `${baseUrl}/fr` },
      ];
      await env.update();
    },
  });
};
