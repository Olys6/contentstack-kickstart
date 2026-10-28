// Importing Contentstack SDK and specific types for region and query operations
import contentstack, { QueryOperation } from "@contentstack/delivery-sdk";

// Importing Contentstack Live Preview utilities and stack SDK
import ContentstackLivePreview, { IStackSdk } from "@contentstack/live-preview-utils";

import type { CollectionPage, Home, Product, SiteSettings } from "./types";
import type { Locale } from "./i18n";

// helper functions to retrieve Contentstack endpoints for a given region
import { getContentstackEndpoint, type ContentstackEndpoints } from "@contentstack/utils";

export const isPreview = process.env.NEXT_PUBLIC_CONTENTSTACK_PREVIEW === "true";

// object with all endpoints for region.
const endpoints = getContentstackEndpoint(process.env.NEXT_PUBLIC_CONTENTSTACK_REGION || 'NA', '', true) as ContentstackEndpoints

export const stack = contentstack.stack({
  // Setting the API key from environment variables
  apiKey: process.env.NEXT_PUBLIC_CONTENTSTACK_API_KEY as string,

  // Setting the delivery token from environment variables
  deliveryToken: process.env.NEXT_PUBLIC_CONTENTSTACK_DELIVERY_TOKEN as string,

  // Setting the environment based on environment variables
  environment: process.env.NEXT_PUBLIC_CONTENTSTACK_ENVIRONMENT as string,

  // Setting the region
  // for custom or dedicated Contentstack environments, override each endpoint individually using environment variables.
  // You can omit this if you have set a region above. Use @contentstack/utils getContentstackEndpoint to get the right urls for your region.
  region: process.env.NEXT_PUBLIC_CONTENTSTACK_REGION as any,

  // Setting the host for content delivery based on the region or environment variables
  // for custom or dedicated Contentstack environments, override each endpoint individually using environment variables.
  host: process.env.NEXT_PUBLIC_CONTENTSTACK_CONTENT_DELIVERY || endpoints.contentDelivery as string,

  live_preview: {
    // Enabling live preview if specified in environment variables
    enable: process.env.NEXT_PUBLIC_CONTENTSTACK_PREVIEW === 'true',

    // Setting the preview token from environment variables
    preview_token: process.env.NEXT_PUBLIC_CONTENTSTACK_PREVIEW_TOKEN,

    // Setting the host for live preview based on the region
    // for custom or dedicated Contentstack environments, override each endpoint individually using environment variables.
    host: process.env.NEXT_PUBLIC_CONTENTSTACK_PREVIEW_HOST || endpoints.preview as string
  }
});

// Initialize live preview functionality (once per page load)
let livePreviewStarted = false;
export function initLivePreview() {
  if (livePreviewStarted) return;
  livePreviewStarted = true;
  ContentstackLivePreview.init({
    ssr: false, // Disabling server-side rendering for live preview
    enable: process.env.NEXT_PUBLIC_CONTENTSTACK_PREVIEW === 'true', // Enabling live preview if specified in environment variables
    mode: "builder", // Setting the mode to "builder" for visual builder
    stackSdk: stack.config as IStackSdk, // Passing the stack configuration
    stackDetails: {
      apiKey: process.env.NEXT_PUBLIC_CONTENTSTACK_API_KEY as string, // Setting the API key from environment variables
      environment: process.env.NEXT_PUBLIC_CONTENTSTACK_ENVIRONMENT as string, // Setting the environment from environment variables
    },
    clientUrlParams: {
      // Setting the client URL parameters for live preview
      // for custom or dedicated Contentstack environments, override each endpoint individually using environment variables.
      host: process.env.NEXT_PUBLIC_CONTENTSTACK_CONTENT_APPLICATION || endpoints.application as string
    },
    editButton: {
      enable: true, // Enabling the edit button for live preview
      exclude: ["outsideLivePreviewPortal"] // Excluding the edit button from the live preview portal
    },
  });
}
// Fetch helpers. Each one asks for the locale with fallback to en-us, resolves
// the references the page renders, and adds Visual Builder tags in preview.

function tag<T>(entry: T | undefined, contentType: string, locale: Locale): T | undefined {
  if (entry && isPreview) {
    contentstack.Utils.addEditableTags(entry as never, contentType, true, locale);
  }
  return entry;
}

function entries(contentType: string, locale: Locale) {
  return stack.contentType(contentType).entry().locale(locale).includeFallback();
}

export async function getSiteSettings(locale: Locale) {
  const result = await entries("site_settings", locale).query().find<SiteSettings>();
  return tag(result.entries?.[0], "site_settings", locale);
}

export async function getHome(locale: Locale) {
  const result = await entries("home", locale)
    .includeReference(
      "chapters.chapter.material",
      "chapters.collection_teaser.products",
      "chapters.collection_teaser.products.material",
    )
    .query()
    .find<Home>();
  return tag(result.entries?.[0], "home", locale);
}

export async function getCollectionPage(locale: Locale) {
  const result = await entries("collection_page", locale)
    .includeReference("products", "products.material")
    .query()
    .find<CollectionPage>();
  return tag(result.entries?.[0], "collection_page", locale);
}

export async function getProduct(url: string, locale: Locale) {
  const result = await entries("product", locale)
    .includeReference("material")
    .query()
    .where("url", QueryOperation.EQUALS, url)
    .find<Product>();
  return tag(result.entries?.[0], "product", locale);
}

/** Every product with its material: powers the material switcher on the product page. */
export async function getProducts(locale: Locale) {
  const result = await entries("product", locale).includeReference("material").query().find<Product>();
  return result.entries ?? [];
}
