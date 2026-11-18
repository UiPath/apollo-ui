import type { i18n as I18n, Namespace, ReadCallback } from "i18next";
import { createInstance } from "i18next";
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
  if (!isSupportedLocale(language)) return;
  const { default: translations } = await localeLoaders[language]();
  const bundle: unknown = instance.getResourceBundle(
    language,
    VERTEX_NAMESPACE,
  );
  const existing: object =
    typeof bundle === "object" && bundle !== null ? bundle : {};
  if (Object.keys(translations).every((key) => key in existing)) return;
  instance.addResourceBundle(
    language,
    VERTEX_NAMESPACE,
    translations,
    true,
    false,
  );
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
  const loadCurrentLanguages = () =>
    Promise.all(
      [...instance.languages, DEFAULT_LOCALE].map((language) =>
        loadVertexLocale(instance, language),
      ),
    );

  const handleLanguageChanged = () => {
    void loadCurrentLanguages();
  };

  instance.on("languageChanged", handleLanguageChanged);
  try {
    await loadCurrentLanguages();
  } catch (error) {
    instance.off("languageChanged", handleLanguageChanged);
    throw error;
  }

  return () => instance.off("languageChanged", handleLanguageChanged);
};

export const hasVertexTranslations = (instance: I18n) =>
  instance.isInitialized &&
  [...instance.languages, DEFAULT_LOCALE]
    .filter((language) => isSupportedLocale(language))
    .every((language) =>
      instance.hasResourceBundle(language, VERTEX_NAMESPACE),
    );

const whenInitialized = (instance: I18n) =>
  new Promise<void>((resolve) => {
    if (instance.isInitialized) {
      resolve();
      return;
    }
    const handleInitialized = () => {
      instance.off("initialized", handleInitialized);
      resolve();
    };
    instance.on("initialized", handleInitialized);
  });

const vertexTranslationLoads = new WeakMap<I18n, Promise<void>>();

export const loadVertexTranslations = (instance: I18n) => {
  let load = vertexTranslationLoads.get(instance);
  if (!load) {
    load = (async () => {
      if (!instance.isInitialized) await whenInitialized(instance);
      await addVertexTranslations(instance);
    })();
    vertexTranslationLoads.set(instance, load);
    load.catch(() => vertexTranslationLoads.delete(instance));
  }
  return load;
};

let defaultInstance: I18n | undefined;

/**
 * The instance `LocaleProvider` uses when the app gives it none: English by
 * default, serving the Vertex locale files for every namespace.
 */
export const getDefaultVertexI18n = (): I18n => {
  if (defaultInstance) return defaultInstance;
  const instance = createInstance().use({
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
      try {
        const module = await localeLoaders[language]();
        callback(null, module.default);
      } catch (error: unknown) {
        callback(
          error instanceof Error ? error : new Error(String(error)),
          null,
        );
      }
    },
  });
  void instance.init({
    fallbackLng: DEFAULT_LOCALE,
    lng: DEFAULT_LOCALE,
    supportedLngs: SUPPORTED_LOCALES,
    ns: ["translation", VERTEX_NAMESPACE],
    defaultNS: "translation",
    returnNull: false,
  });
  defaultInstance = instance;
  return instance;
};
