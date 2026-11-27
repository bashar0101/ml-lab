import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import { VercelInsights } from "@/components/VercelInsights";
import { DEFAULT_LOCALE, loadUi } from "@/content/load";
import { localeBootstrapScript } from "@/i18n/bootstrap";
import { ogImage } from "@/og/images";
import { SITE_URL } from "@/site";
import { themeBootstrapScript } from "@/state/theme";
import "@/styles/globals.css";

// latin-ext carries Turkish letters (ğ ş ı İ).
const mono = JetBrains_Mono({ subsets: ["latin", "latin-ext"], variable: "--font-mono", display: "swap" });
const serif = Instrument_Serif({
  subsets: ["latin", "latin-ext"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});
// Only Arabic pages use it, so English and Turkish pages do not preload it.
const arabic = IBM_Plex_Sans_Arabic({ subsets: ["arabic"], weight: ["400", "600", "700"], variable: "--font-arabic", display: "swap", preload: false });

export async function generateMetadata(): Promise<Metadata> {
  const ui = await loadUi(DEFAULT_LOCALE);
  return {
    metadataBase: new URL(SITE_URL),
    title: ui["site.name"],
    description: ui["site.description"],
    openGraph: { siteName: ui["site.name"], type: "website", images: [ogImage("site", ui["site.tagline"])] },
    twitter: { card: "summary_large_image" },
  };
}

/**
 * The one root layout. Each language's shell (top bar, footer, strings) lives in app/(en) and app/[locale];
 * lang/dir on <html> are stamped per language after the build (scripts/stamp-locales.mjs) and by the
 * boot script below in development.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={DEFAULT_LOCALE} dir="ltr" data-theme="light" className={`${mono.variable} ${serif.variable} ${arabic.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript + ";" + localeBootstrapScript }} />
      </head>
      <body>
        {children}
        <VercelInsights />
      </body>
    </html>
  );
}
