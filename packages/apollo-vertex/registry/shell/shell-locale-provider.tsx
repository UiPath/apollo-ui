"use client";

import type { i18n as I18n } from "i18next";
import {
  createContext,
  type PropsWithChildren,
  type ReactNode,
  Suspense,
  use,
  useContext,
  useEffect,
  useEffectEvent,
} from "react";
import { getI18n, I18nContext, I18nextProvider } from "react-i18next";
import { Spinner } from "@/components/ui/spinner";
import {
  getDefaultVertexI18n,
  hasVertexTranslations,
  loadVertexTranslations,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "@/lib/i18n";
import { LANGUAGE_CHANGED_EVENT } from "./shell-constants";

interface LocaleProviderProps {
  /**
   * The app's i18next instance. Defaults to the enclosing `I18nextProvider`'s,
   * then the one registered with `initReactI18next`, then a Vertex-only
   * instance.
   */
  i18n?: I18n;
  /** The locales the language menu offers. Defaults to every Vertex locale. */
  locales?: readonly SupportedLocale[];
  loadingElement?: ReactNode;
}

const LocalesContext =
  createContext<readonly SupportedLocale[]>(SUPPORTED_LOCALES);

export const useShellLocales = () => useContext(LocalesContext);

const VertexTranslations = ({
  i18n,
  children,
}: PropsWithChildren<{ i18n: I18n }>) => {
  const load = loadVertexTranslations(i18n);
  if (!hasVertexTranslations(i18n)) use(load);
  return <LanguageSync i18n={i18n}>{children}</LanguageSync>;
};

const LanguageSync = ({
  i18n,
  children,
}: PropsWithChildren<{ i18n: I18n }>) => {
  const handleLanguageChanged = useEffectEvent((event: Event) => {
    if (!(event instanceof CustomEvent)) return;
    const detail: unknown = event.detail;
    if (
      typeof detail !== "object" ||
      detail === null ||
      !("selectedLanguageId" in detail) ||
      typeof detail.selectedLanguageId !== "string"
    ) {
      return;
    }
    void i18n.changeLanguage(detail.selectedLanguageId);
  });

  useEffect(() => {
    document.addEventListener(LANGUAGE_CHANGED_EVENT, handleLanguageChanged);
    return () =>
      document.removeEventListener(
        LANGUAGE_CHANGED_EVENT,
        handleLanguageChanged,
      );
  }, []);

  useEffect(() => {
    const syncDocumentLanguage = () => {
      document.documentElement.lang = i18n.language;
    };
    syncDocumentLanguage();
    i18n.on("languageChanged", syncDocumentLanguage);
    return () => i18n.off("languageChanged", syncDocumentLanguage);
  }, [i18n]);

  return children;
};

export const LocaleProvider = ({
  children,
  i18n,
  locales,
  loadingElement,
}: PropsWithChildren<LocaleProviderProps>) => {
  const enclosing = useContext(I18nContext)?.i18n;
  const instance = i18n ?? enclosing ?? getI18n() ?? getDefaultVertexI18n();
  const inheritedLocales = useShellLocales();

  const content = (
    <LocalesContext.Provider value={locales ?? inheritedLocales}>
      <Suspense
        fallback={
          loadingElement ?? (
            <div className="flex h-full w-full items-center justify-center">
              <Spinner className="size-6" />
            </div>
          )
        }
      >
        <VertexTranslations i18n={instance}>{children}</VertexTranslations>
      </Suspense>
    </LocalesContext.Provider>
  );

  if (instance === enclosing) return content;
  return <I18nextProvider i18n={instance}>{content}</I18nextProvider>;
};
