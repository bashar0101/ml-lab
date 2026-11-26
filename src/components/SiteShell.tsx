import { Footer } from "@/components/Footer";
import { TopBar } from "@/components/TopBar";
import { loadUi } from "@/content/load";
import { LocaleProvider } from "@/i18n/locale-context";
import type { Locale } from "@/i18n/locales";
import { UiProvider } from "@/i18n/ui-context";

/** Top bar, page and footer in one language. */
export async function SiteShell({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const ui = await loadUi(locale);
  return (
    <UiProvider strings={ui}>
      <LocaleProvider locale={locale}>
        <TopBar locale={locale} strings={{ home: ui["nav.home"], toLight: ui["theme.toLight"], toDark: ui["theme.toDark"] }} />
        {children}
        <Footer
          locale={locale}
          strings={{
            name: ui["site.name"],
            line: ui["home.footer"],
            about: ui["nav.about"],
            contact: ui["footer.contact"],
            privacy: ui["footer.privacy"],
            terms: ui["footer.terms"],
            github: ui["footer.github"],
          }}
        />
      </LocaleProvider>
    </UiProvider>
  );
}
