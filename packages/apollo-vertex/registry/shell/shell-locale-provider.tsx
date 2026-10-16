"use client";

import {
  type PropsWithChildren,
  type ReactNode,
  useEffect,
  useEffectEvent,
  useState,
} from "react";
import { Spinner } from "@/components/ui/spinner";
import { configurei18n } from "@/lib/i18n";
import { useVertexTranslation } from "@/lib/vertex-translation";
import { LANGUAGE_CHANGED_EVENT } from "./shell-constants";

interface LocaleProviderProps {
  loadingElement?: ReactNode;
  configureI18n?: () => Promise<void>;
}

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
}: PropsWithChildren<LocaleProviderProps>) => {
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

  if (!isConfigured)
    return (
      loadingElement ?? (
        <div className="flex h-full w-full items-center justify-center">
          <Spinner className="size-6" />
        </div>
      )
    );

  return <LocaleProviderComponent>{children}</LocaleProviderComponent>;
};
