"use client";

import { Globe } from "lucide-react";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SupportedLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { LANGUAGE_CHANGED_EVENT, LOCALE_OPTIONS } from "./shell-constants";
import { Text } from "./shell-text";

export type LanguageChangedEvent = {
  selectedLanguageId: SupportedLocale;
};

export function LanguageToggle() {
  const { i18n } = useTranslation();
  const language = i18n.language;

  const setLanguage = useCallback((code: SupportedLocale) => {
    document.dispatchEvent(
      new CustomEvent<LanguageChangedEvent>(LANGUAGE_CHANGED_EVENT, {
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
        {LOCALE_OPTIONS.map((locale) => (
          <DropdownMenuItem
            key={locale.code}
            onClick={() => setLanguage(locale.code)}
            className={cn(language === locale.code ? "bg-accent" : "")}
          >
            <Text value={locale.translationKey} />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
