import type { Metadata } from "next";
import { Instrument_Serif, JetBrains_Mono } from "next/font/google";
import { TopBar } from "@/components/TopBar";
import { DEFAULT_LOCALE, loadUi } from "@/content/load";
import { UiProvider } from "@/i18n/ui-context";
import { themeBootstrapScript } from "@/state/theme";
import "@/styles/globals.css";

const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });
const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const ui = await loadUi(DEFAULT_LOCALE);
  return { title: ui["site.name"], description: ui["site.description"] };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const ui = await loadUi(DEFAULT_LOCALE);
  return (
    <html
      lang={DEFAULT_LOCALE}
      data-theme="light"
      className={`${mono.variable} ${serif.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body>
        <UiProvider strings={ui}>
          <TopBar
            strings={{
              home: ui["nav.home"],
              search: ui["nav.search"],
              toLight: ui["theme.toLight"],
              toDark: ui["theme.toDark"],
            }}
          />
          {children}
        </UiProvider>
      </body>
    </html>
  );
}
