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

/** Plural forms the TMS doesn't deliver: translations come with `_one` and `_other` only. */
const FORMS_READ_AS_OTHER = ["zero", "two", "few", "many"];

interface LookupOptions {
  count?: unknown;
  ordinal?: boolean;
  context?: unknown;
}

interface Translator {
  resolve: (keys: unknown, options?: LookupOptions) => unknown;
  getResource: (
    code: string,
    ns: string,
    key: string,
    options?: LookupOptions,
  ) => unknown;
}

interface PluralResolver {
  getSuffix: (code: string, count: number, options?: LookupOptions) => string;
  getSuffixes: (code: string, options?: LookupOptions) => string[];
}

const isTranslator = (value: unknown): value is Translator =>
  typeof value === "object" &&
  value !== null &&
  "resolve" in value &&
  typeof value.resolve === "function" &&
  "getResource" in value &&
  typeof value.getResource === "function";

const isPluralResolver = (value: unknown): value is PluralResolver =>
  typeof value === "object" &&
  value !== null &&
  "getSuffix" in value &&
  typeof value.getSuffix === "function" &&
  "getSuffixes" in value &&
  typeof value.getSuffixes === "function";

const patched = new WeakSet<object>();
const watchedInstances = new WeakSet<I18n>();

const patchInstance = (instance: I18n) => {
  // i18next has no option for this, so it wraps three internals: the entry
  // point that resolves the keys of a `t` call, the lookup of one key in one
  // language and namespace, and the list of plural suffixes. The tests fail if
  // a new i18next version changes them.
  const separator = instance.options.pluralSeparator ?? "_";
  const contextSeparator = instance.options.contextSeparator ?? "_";
  const nsSeparator = instance.options.nsSeparator ?? ":";

  // Missing the way i18next itself sees it, so a `null` or `""` the app's
  // settings accept as a translation stays.
  const isMissing = (value: unknown) => {
    if (value === null) return instance.options.returnNull !== true;
    if (value === "") return instance.options.returnEmptyString === false;
    // What is left: `undefined` when the catalog has no key.
    return value == null;
  };

  // The keys the current `t` call asked for, with and without a namespace
  // prefix. Selector functions are left out, so their plurals aren't changed.
  let requestedKeys: string[] = [];
  const withoutNamespace = (key: string) =>
    nsSeparator && key.includes(nsSeparator)
      ? key.slice(key.indexOf(nsSeparator) + nsSeparator.length)
      : key;

  // The `_other` key to read instead of `key`, or "" to keep i18next's lookup.
  // Only the plural key i18next built for this call is replaced: the asked-for
  // key, with its context, plus the form the language picks for this count.
  // Keys that only end in `_few` or `_many`, and i18next's extra `_zero`
  // lookup at 0, are left alone.
  const otherKeyFor = (code: string, key: string, options: LookupOptions) => {
    if (typeof options.count !== "number" || options.ordinal) return "";
    const resolver: unknown = instance.services.pluralResolver;
    if (!isPluralResolver(resolver)) return "";
    const suffix = resolver.getSuffix(code, options.count, options);
    const form = suffix.slice(separator.length);
    if (!FORMS_READ_AS_OTHER.includes(form) || !key.endsWith(suffix)) return "";
    const base = key.slice(0, -suffix.length);
    const context =
      typeof options.context === "string" || typeof options.context === "number"
        ? `${contextSeparator}${options.context}`
        : "";
    const isBuilt = requestedKeys.some((requested) =>
      [requested, withoutNamespace(requested)].some(
        (asked) => base === asked || (context && base === `${asked}${context}`),
      ),
    );
    return isBuilt ? `${base}${separator}other` : "";
  };

  const translator: unknown = "translator" in instance && instance.translator;
  if (isTranslator(translator) && !patched.has(translator)) {
    patched.add(translator);

    const resolve = translator.resolve.bind(translator);
    translator.resolve = (keys, options) => {
      const previous = requestedKeys;
      requestedKeys = (Array.isArray(keys) ? keys : [keys]).filter(
        (key): key is string => typeof key === "string",
      );
      try {
        return resolve(keys, options);
      } finally {
        requestedKeys = previous;
      }
    };

    const getResource = translator.getResource.bind(translator);
    translator.getResource = (code, ns, key, options = {}) => {
      const found = getResource(code, ns, key, options);
      if (!isMissing(found)) return found;
      const otherKey = otherKeyFor(code, key, options);
      // The catalog has no key for this form: read `_other` in the same
      // language and namespace instead of falling back to English.
      return otherKey ? getResource(code, ns, otherKey, options) : found;
    };
  }

  // Lists the keys reported as missing (`saveMissingPlurals`): only the forms
  // the TMS delivers.
  const resolver: unknown = instance.services.pluralResolver;
  if (isPluralResolver(resolver) && !patched.has(resolver)) {
    patched.add(resolver);
    const getSuffixes = resolver.getSuffixes.bind(resolver);
    resolver.getSuffixes = (code, options = {}) =>
      getSuffixes(code, options).filter(
        (suffix) =>
          options.ordinal === true ||
          !FORMS_READ_AS_OTHER.some((form) => suffix === `${separator}${form}`),
      );
  }
};

/**
 * Reads a plural form from `_other` when the catalog has no key for it.
 *
 * i18next picks the plural key from the language's own rules: Romanian asks
 * for `files_few` for 2 to 19, Russian for `files_few` and `files_many`.
 * Translations from the TMS come with `_one` and `_other` only, and when the
 * asked-for key is missing, i18next shows the fallback language (English)
 * instead of `files_other`. With this, a missing `_zero`, `_two`, `_few` or
 * `_many` key is read from `_other` in the same language and namespace.
 *
 * Catalogs that have their own keys for these forms, such as a library's,
 * keep using them. Catalogs are not changed. An explicit `_zero` key for a
 * count of 0 still works, ordinal plurals are unchanged, and a string with no
 * translation at all still shows English. Missing-key reporting
 * (`saveMissingPlurals`) lists only `_one` and `_other`.
 *
 * Applying it twice is safe. It applies once the instance is initialized, and
 * again each time the app calls `init` on it.
 */
export const readMissingPluralFormsFromOther = (instance: I18n) => {
  if (instance.isInitialized) patchInstance(instance);
  if (watchedInstances.has(instance)) return;
  watchedInstances.add(instance);
  // Each `init` creates a new translator and plural resolver.
  instance.on("initialized", () => patchInstance(instance));
};

/**
 * Adds the translations bundled with Apollo Vertex to an existing i18next
 * instance, under the `apollo-vertex` namespace. Use this when the app sets up
 * i18next itself instead of using `LocaleProvider`.
 *
 * Loads the current language and its fallbacks up front, and loads other
 * languages when the app switches to them. Also applies
 * `readMissingPluralFormsFromOther` to the instance, so the app's own
 * `_one` / `_other` keys work in every language. Returns a function that stops
 * listening.
 */
export const addVertexTranslations = async (instance: I18n) => {
  readMissingPluralFormsFromOther(instance);
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

  readMissingPluralFormsFromOther(i18n);
  document.documentElement.lang = i18n.language;
};
