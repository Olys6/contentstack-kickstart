import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getHome } from "@/lib/contentstack";
import { isLang, toLocale } from "@/lib/i18n";
import HomeView from "@/components/home/HomeView";

// Content is fetched per request so a publish in Contentstack shows up on refresh.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const home = await getHome(toLocale(lang));
  return { description: home?.seo_description };
}

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const home = await getHome(toLocale(lang));
  if (!home) notFound();
  return <HomeView initial={home} />;
}
