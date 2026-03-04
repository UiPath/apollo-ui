"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Globe, LogOut, Monitor, Moon, Sun } from "lucide-react";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SUPPORTED_LOCALES, type SupportedLocale } from "@/lib/i18n";
import { useAuth } from "./shell-auth-provider";
import { Text } from "./shell-text";
import { useTheme } from "./shell-theme-provider";
import type { TranslationKey } from "./shell-translation-key";
import { useUser } from "./shell-user-provider";

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
  ro: "romanian",
  ru: "russian",
  tr: "turkish",
  "zh-CN": "chinese-cn",
  "zh-TW": "chinese-tw",
};

const LOCALE_OPTIONS = SUPPORTED_LOCALES.map((locale) => ({
  code: locale,
  translationKey: MAP_LOCALE_TO_TRANSLATION_KEY[locale],
}));

interface UserProfileProps {
  isCollapsed: boolean;
}

export const UserProfile = ({ isCollapsed }: UserProfileProps) => {
  const { t, i18n } = useTranslation();
  const { user } = useUser();
  const { logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [language, setLanguageState] = useState(i18n.language);

  const setLanguage = useCallback((code: string) => {
    setLanguageState(code);
    document.dispatchEvent(
      new CustomEvent("languageChanged", {
        detail: { selectedLanguageId: code },
      }),
    );
  }, []);

  const userInitials = user
    ? user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";
  const firstName = user?.first_name as string;
  const lastName = user?.last_name as string;

  const handleSignOut = () => {
    logout();
  };

  return (
    <AnimatePresence mode="wait">
      {isCollapsed ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.button
              type="button"
              className="flex items-center justify-center cursor-pointer rounded-full"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileTap={{ scale: 0.95 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 30,
                mass: 0.5,
              }}
            >
              <Avatar className="w-8 h-8 rounded-full shrink-0">
                <AvatarFallback className="w-8 h-8 bg-muted rounded-full text-sidebar-foreground text-xs">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </motion.button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56"
            align="center"
            side="right"
            sideOffset={8}
          >
            <div className="flex flex-col gap-2 p-2">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">
                  {user?.name ?? t("business_user")}
                </span>
                <span className="text-xs opacity-60">
                  {user?.email ?? t("user_email_placeholder")}
                </span>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Sun className="w-4 h-4 dark:hidden" />
                <Moon className="w-4 h-4 hidden dark:block" />
                <span>{t("toggle_theme")}</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  <Sun className="w-4 h-4" />
                  <span>{t("light")}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  <Moon className="w-4 h-4" />
                  <span>{t("dark")}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  <Monitor className="w-4 h-4" />
                  <span>{t("system")}</span>
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Globe className="w-4 h-4" />
                <span>{t("language")}</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {LOCALE_OPTIONS.map((locale) => (
                  <DropdownMenuItem
                    key={locale.code}
                    onClick={() => setLanguage(locale.code)}
                    className={language === locale.code ? "bg-accent" : ""}
                  >
                    <Text value={locale.translationKey} />
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="w-4 h-4" />
              <span>{t("sign_out")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.button
              type="button"
              key="expanded"
              className="flex items-center gap-3 w-full min-w-0 cursor-pointer rounded-lg px-2 py-1.5 -mx-2 hover:bg-sidebar-accent transition-colors"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              whileTap={{ scale: 0.98 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 30,
                mass: 0.5,
              }}
            >
              <Avatar className="w-9 h-9 rounded-full shrink-0">
                <AvatarFallback className="w-9 h-9 bg-muted rounded-full text-sidebar-foreground">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0 flex-1 text-left">
                <span className="text-sm text-sidebar-foreground font-medium truncate">
                  {firstName} {lastName}
                </span>
                <span className="text-xs text-sidebar-foreground/70 truncate">
                  {user?.email ?? "user@company.com"}
                </span>
              </div>
            </motion.button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[280px]"
            align="start"
            side="top"
            sideOffset={8}
          >
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Sun className="w-4 h-4 dark:hidden" />
                <Moon className="w-4 h-4 hidden dark:block" />
                <span>{t("toggle_theme")}</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  <Sun className="w-4 h-4" />
                  <span>{t("light")}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  <Moon className="w-4 h-4" />
                  <span>{t("dark")}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  <Monitor className="w-4 h-4" />
                  <span>{t("system")}</span>
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Globe className="w-4 h-4" />
                <span>{t("language")}</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {LOCALE_OPTIONS.map((locale) => (
                  <DropdownMenuItem
                    key={locale.code}
                    onClick={() => setLanguage(locale.code)}
                    className={language === locale.code ? "bg-accent" : ""}
                  >
                    <Text value={locale.translationKey} />
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="w-4 h-4" />
              <span>{t("sign_out")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </AnimatePresence>
  );
};
