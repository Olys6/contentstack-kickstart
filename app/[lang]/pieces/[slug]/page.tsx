import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCollectionPage, getProduct } from "@/lib/contentstack";
import { isLang, toLocale } from "@/lib/i18n";
import ProductView from "@/components/product/ProductView";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/[lang]/pieces/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLang(lang)) return {};
  const product = await getProduct(`/pieces/${slug}`, toLocale(lang));
  return { title: product?.title, description: product?.tagline };
}

export default async function ProductRoute({ params }: PageProps<"/[lang]/pieces/[slug]">) {
  const { lang, slug } = await params;
  if (!isLang(lang)) notFound();
  const locale = toLocale(lang);
  const [product, collection] = await Promise.all([getProduct(`/pieces/${slug}`, locale), getCollectionPage(locale)]);
  if (!product) notFound();
  // The material switcher follows the editor's collection order.
  return <ProductView initial={product} siblings={collection?.products ?? [product]} />;
}
