import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCollectionPage } from "@/lib/contentstack";
import { isLang, toLocale } from "@/lib/i18n";
import CollectionView from "@/components/collection/CollectionView";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/[lang]/collection">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const page = await getCollectionPage(toLocale(lang));
  return { title: page?.eyebrow, description: page?.intro };
}

export default async function CollectionRoute({ params }: PageProps<"/[lang]/collection">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const page = await getCollectionPage(toLocale(lang));
  if (!page) notFound();
  return <CollectionView initial={page} />;
}
