import type { SupportedLocale } from "@/lib/i18n";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import type { TranslationKey } from "./shell-translation-key";

export const SIDEBAR_COLLAPSED_KEY = "sidebar-collapsed";
export const THEME_STORAGE_KEY = "vss-ui-theme";
export const LANGUAGE_CHANGED_EVENT = "languageChanged";

export const MAP_LOCALE_TO_TRANSLATION_KEY: Record<
  SupportedLocale,
  TranslationKey
> = {
  en: "english",
  de: "german",
  es: "spanish",
  "es-MX": "spanish-mx",
  fr: "french",
  ja: "japanese",
  ko: "korean",
  pt: "portuguese",
  "pt-BR": "portuguese-br",
  ro: "romanian",
  ru: "russian",
  tr: "turkish",
  "zh-CN": "chinese-cn",
  "zh-TW": "chinese-tw",
};

export const LOCALE_OPTIONS = SUPPORTED_LOCALES.map((locale) => ({
  code: locale,
  translationKey: MAP_LOCALE_TO_TRANSLATION_KEY[locale],
}));
