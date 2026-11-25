import type { Metadata } from "next";
import { Instrument_Serif, JetBrains_Mono } from "next/font/google";
import { TopBar } from "@/components/TopBar";
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

export const metadata: Metadata = {
  title: "ML Lab",
  description: "Learn machine learning by watching algorithms work, step by step.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" className={`${mono.variable} ${serif.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body>
        <TopBar
          strings={{
            home: "ML Lab home",
            search: "Search lessons and ideas",
            toLight: "Switch to light theme",
            toDark: "Switch to dark theme",
          }}
        />
        {children}
      </body>
    </html>
  );
}
