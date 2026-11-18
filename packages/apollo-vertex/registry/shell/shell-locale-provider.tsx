"use client";

import {
  createContext,
  type PropsWithChildren,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useEffectEvent,
  useState,
  useSyncExternalStore,
} from "react";
import type { ResourceStore } from "i18next";
import { getI18n, I18nContext } from "react-i18next";
import { Spinner } from "@/components/ui/spinner";
import {
  configurei18n,
  hasVertexStrings,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "@/lib/i18n";
import { useVertexTranslation } from "@/lib/vertex-translation";
import { LANGUAGE_CHANGED_EVENT } from "./shell-constants";

interface LocaleProviderProps {
  loadingElement?: ReactNode;
  configureI18n?: () => Promise<void>;
  locales?: readonly SupportedLocale[];
}

const LocalesContext =
  createContext<readonly SupportedLocale[]>(SUPPORTED_LOCALES);

export const useShellLocales = () => useContext(LocalesContext);

const isNotReady = () => false;

const useHasVertexStrings = () => {
  const instance = useContext(I18nContext)?.i18n ?? getI18n();
  const subscribe = useCallback(
    (onChange: () => void) => {
      let store: ResourceStore | undefined;
      const watchStore = () => {
        if (store || !instance?.store) return;
        store = instance.store;
        store.on("added", onChange);
      };
      const onInitialized = () => {
        watchStore();
        onChange();
      };
      watchStore();
      instance?.on("initialized", onInitialized);
      return () => {
        instance?.off("initialized", onInitialized);
        store?.off("added", onChange);
      };
    },
    [instance],
  );
  const isReady = () => (instance ? hasVertexStrings(instance) : false);
  return useSyncExternalStore(subscribe, isReady, isNotReady);
};

export const LocaleProviderComponent = ({ children }: PropsWithChildren) => {
  const { i18n } = useVertexTranslation();

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
    const { selectedLanguageId } = detail;
    i18n.changeLanguage(selectedLanguageId);
    document.documentElement.lang = selectedLanguageId;
  });

  useEffect(() => {
    document.addEventListener(LANGUAGE_CHANGED_EVENT, handleLanguageChanged);
    return () =>
      document.removeEventListener(
        LANGUAGE_CHANGED_EVENT,
        handleLanguageChanged,
      );
  }, []);

  return children;
};

export const LocaleProvider = ({
  children,
  loadingElement,
  configureI18n = configurei18n,
  locales,
}: PropsWithChildren<LocaleProviderProps>) => {
  const inheritedLocales = useShellLocales();
  const hasStrings = useHasVertexStrings();
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void configureI18n().then(() => {
      if (!cancelled) setIsConfigured(true);
    });
    return () => {
      cancelled = true;
    };
  }, [configureI18n]);

  if (!hasStrings && !isConfigured)
    return (
      loadingElement ?? (
        <div className="flex h-full w-full items-center justify-center">
          <Spinner className="size-6" />
        </div>
      )
    );

  return (
    <LocalesContext.Provider value={locales ?? inheritedLocales}>
      <LocaleProviderComponent>{children}</LocaleProviderComponent>
    </LocalesContext.Provider>
  );
};
