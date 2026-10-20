import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { FavoritesProvider } from "@/components/FavoritesProvider";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { I18nProvider } from "@/components/I18nProvider";
import { getI18n } from "@/lib/i18n/server";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, m } = await getI18n();
  const images = [{ url: "/images/og-image.png", width: 1200, height: 630, alt: "VELTRIX" }];
  return {
    metadataBase: new URL(SITE_URL),
    title: m.meta.siteTitle,
    description: m.meta.siteDescription,
    openGraph: {
      type: "website",
      siteName: "VELTRIX",
      locale: locale === "en" ? "en_US" : "ru_RU",
      title: m.meta.siteTitle,
      description: m.meta.siteDescription,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: m.meta.siteTitle,
      description: m.meta.siteDescription,
      images: ["/images/og-image.png"],
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { locale, m } = await getI18n();
  return (
    <html lang={locale} className={inter.variable}>
      <body className="flex min-h-screen flex-col antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-bg"
        >
          {m.common.skipToContent}
        </a>
        <I18nProvider locale={locale}>
          <AuthProvider>
            <FavoritesProvider>
              <Header />
              <main id="main" className="flex-1">{children}</main>
              <Footer />
            </FavoritesProvider>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}