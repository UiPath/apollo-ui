"use client";

import { Globe } from "lucide-react";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SUPPORTED_LOCALES, SupportedLocale } from "@/lib/i18n";
import { TranslationKey } from "./TranslationKey";
import { Text } from "./text";

export type LanguageChangedEvent = {
  selectedLanguageId: string;
};

const MAP_LOCALE_TO_TRANSLATION_KEY: Record<SupportedLocale, TranslationKey> = {
  en: "english",
  de: "german",
  es: "spanish",
  "es-MX": "spanish-mx",
  fr: "french",
  ja: "japanese",
  ko: "korean",
  pt: "portuguese",
  "pt-BR": "portuguese-br",
  ru: "russian",
  tr: "turkish",
  "zh-CN": "chinese-cn",
  "zh-TW": "chinese-tw",
};

const OPTIONS = SUPPORTED_LOCALES.map((locale) => ({
  code: locale,
  translationKey: MAP_LOCALE_TO_TRANSLATION_KEY[locale],
}));

export function LanguageToggle() {
  const { i18n } = useTranslation();
  const [language, setLanguageState] = useState(i18n.language);

  const setLanguage = useCallback((code: string) => {
    setLanguageState(code);

    document.dispatchEvent(
      new CustomEvent<LanguageChangedEvent>("languageChanged", {
        detail: { selectedLanguageId: code },
      }),
    );
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Globe className="h-[1.2rem] w-[1.2rem]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {OPTIONS.map((locale) => (
          <DropdownMenuItem
            key={locale.code}
            onClick={() => setLanguage(locale.code)}
            className={language === locale.code ? "bg-accent" : ""}
          >
            <Text value={locale.translationKey} />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
