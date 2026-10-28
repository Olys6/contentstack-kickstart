import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "../globals.css";
import { getSiteSettings } from "@/lib/contentstack";
import { LANGS, isLang, toLocale } from "@/lib/i18n";
import SiteProvider from "@/components/shell/SiteProvider";
import Header from "@/components/shell/Header";
import Footer from "@/components/shell/Footer";
import CartDrawer from "@/components/shell/CartDrawer";
import SmoothScroll from "@/components/shell/SmoothScroll";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
});

const sans = Inter({ subsets: ["latin"], variable: "--font-inter" });

export function generateStaticParams() {
  return Object.keys(LANGS).map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const settings = await getSiteSettings(toLocale(lang));
  return {
    title: { default: settings?.brand_name ?? "Maison Roque", template: `%s — ${settings?.brand_name ?? "Maison Roque"}` },
    description: settings?.brand_tagline,
  };
}

export default async function LangLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const settings = await getSiteSettings(toLocale(lang));
  if (!settings) notFound();

  return (
    <html lang={lang === "fr" ? "fr-CH" : "en"} className={`${display.variable} ${sans.variable}`}>
      <body>
        <SiteProvider lang={lang} initialSettings={settings}>
          <SmoothScroll />
          <Header />
          <main>{children}</main>
          <Footer />
          <CartDrawer />
        </SiteProvider>
      </body>
    </html>
  );
}
