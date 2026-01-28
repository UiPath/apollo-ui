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
  ru: () => import("../locales/ru.json"),
  tr: () => import("../locales/tr.json"),
  "zh-CN": () => import("../locales/zh-CN.json"),
  "zh-TW": () => import("../locales/zh-TW.json"),
} as const satisfies Record<string, LocaleLoader>;

export type SupportedLocale = keyof typeof localeLoaders;
export const SUPPORTED_LOCALES = Object.keys(
  localeLoaders,
) as SupportedLocale[];
const DEFAULT_LOCALE: SupportedLocale = "en";

export const configurei18n = async () => {
  await i18n
    .use({
      type: "backend",
      read(language: string, _namespace: Namespace, callback: ReadCallback) {
        const loadLocale = localeLoaders[language as SupportedLocale];

        if (!loadLocale) {
          callback(new Error(`Locale not found: ${language}`), null);
          return;
        }

        loadLocale()
          .then((module) => callback(null, module.default))
          .catch((error) => callback(error, null));
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
