import type { Namespace, ReadCallback } from "i18next";
import { default as i18n } from "i18next";
import { initReactI18next } from "react-i18next";

type LocaleTranslations = Record<string, string>;
type LocaleLoader = () => Promise<{ default: LocaleTranslations }>;

const localeLoaders = {
  en: () => import("../locales/en.json"),
  de: () => import("../locales/de.json"),
  es: () => import("../locales/es.json"),
  "es-MX": () => import("../locales/es-MX.json"),
  fr: () => import("../locales/fr.json"),
  ja: () => import("../locales/ja.json"),
  ko: () => import("../locales/ko.json"),
  pt: () => import("../locales/pt.json"),
  "pt-BR": () => import("../locales/pt-BR.json"),
  ro: () => import("../locales/ro.json"),
  ru: () => import("../locales/ru.json"),
  tr: () => import("../locales/tr.json"),
  "zh-CN": () => import("../locales/zh-CN.json"),
  "zh-TW": () => import("../locales/zh-TW.json"),
} as const satisfies Record<string, LocaleLoader>;

export type SupportedLocale = keyof typeof localeLoaders;
// oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion) -- Object.keys returns string[]; keyof narrowing is safe here since localeLoaders is a closed object
export const SUPPORTED_LOCALES = Object.keys(
  localeLoaders,
) as SupportedLocale[];
const DEFAULT_LOCALE: SupportedLocale = "en";

export const configurei18n = async () => {
  if (i18n.isInitialized) {
    document.documentElement.lang = i18n.language;
    return;
  }
  await i18n
    .use({
      type: "backend",
      async read(
        language: string,
        _namespace: Namespace,
        callback: ReadCallback,
      ) {
        if (!(language in localeLoaders)) {
          callback(new Error(`Locale not found: ${language}`), null);
          return;
        }

        // oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion) -- `in` guard above validates membership but TS can't narrow string to keyof
        const loadLocale = localeLoaders[language as SupportedLocale];

        try {
          const module = await loadLocale();
          callback(null, module.default);
        } catch (error: unknown) {
          callback(
            error instanceof Error ? error : new Error(String(error)),
            null,
          );
        }
      },
    })
    .use(initReactI18next)
    .init({
      fallbackLng: DEFAULT_LOCALE,
      lng: DEFAULT_LOCALE,
      supportedLngs: SUPPORTED_LOCALES,
      returnNull: false,
    });

  document.documentElement.lang = i18n.language;
};
