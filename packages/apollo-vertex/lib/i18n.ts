import type { i18n as I18n, Namespace, ReadCallback } from "i18next";
import { default as i18n } from "i18next";
import { initReactI18next } from "react-i18next";
import { VERTEX_NAMESPACE } from "@/lib/vertex-translation";

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

const isSupportedLocale = (language: string): language is SupportedLocale =>
  language in localeLoaders;

const loadVertexLocale = async (instance: I18n, language: string) => {
  if (
    !isSupportedLocale(language) ||
    instance.hasResourceBundle(language, VERTEX_NAMESPACE)
  ) {
    return false;
  }
  const { default: translations } = await localeLoaders[language]();
  instance.addResourceBundle(language, VERTEX_NAMESPACE, translations);
  return true;
};

/**
 * Adds the translations bundled with Apollo Vertex to an existing i18next
 * instance, under the `apollo-vertex` namespace. Use this when the app sets up
 * i18next itself instead of using `LocaleProvider`.
 *
 * Loads the current language and its fallbacks up front, and loads other
 * languages when the app switches to them. Returns a function that stops
 * listening.
 */
export const addVertexTranslations = async (instance: I18n) => {
  // `languages` is the resolved lookup order, e.g. ["de-DE", "de", "en"].
  const loadCurrentLanguages = async () => {
    const added = await Promise.all(
      [...instance.languages, DEFAULT_LOCALE].map((language) =>
        loadVertexLocale(instance, language),
      ),
    );
    return added.includes(true);
  };

  const handleLanguageChanged = (language: string) => {
    void loadCurrentLanguages().then((added) => {
      // react-i18next re-renders on `languageChanged`, not when resources are
      // added, so switch again once the strings are in.
      if (added && instance.language === language) {
        return instance.changeLanguage(language);
      }
    });
  };

  instance.on("languageChanged", handleLanguageChanged);
  await loadCurrentLanguages();

  return () => instance.off("languageChanged", handleLanguageChanged);
};

export const configurei18n = async () => {
  await i18n
    .use({
      type: "backend",
      async read(
        language: string,
        _namespace: Namespace,
        callback: ReadCallback,
      ) {
        if (!isSupportedLocale(language)) {
          callback(new Error(`Locale not found: ${language}`), null);
          return;
        }

        const loadLocale = localeLoaders[language];

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
      // Vertex components read from the `apollo-vertex` namespace. The backend
      // serves the same locale files for every namespace.
      ns: ["translation", VERTEX_NAMESPACE],
      defaultNS: "translation",
      returnNull: false,
    });

  document.documentElement.lang = i18n.language;
};
