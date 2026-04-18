import {
  type PropsWithChildren,
  useEffect,
  useEffectEvent,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import { configurei18n } from "@/lib/i18n";
import { LANGUAGE_CHANGED_EVENT } from "./shell-constants";

export const LocaleProviderComponent = ({ children }: PropsWithChildren) => {
  const { i18n } = useTranslation();

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

export const LocaleProvider = ({ children }: PropsWithChildren) => {
  const [isConfigured, setIsConfigured] = useState(false);
  const configure = async () => {
    await configurei18n();
    setIsConfigured(true);
  };

  useEffect(() => {
    void configure();
  }, []);

  if (!isConfigured)
    return (
      <div className="flex h-screen gap-4 p-4 bg-background dark:bg-sidebar">
        <Skeleton className="h-full w-[280px]" />
        <Skeleton className="h-full flex-1 rounded-lg" />
      </div>
    );

  return <LocaleProviderComponent>{children}</LocaleProviderComponent>;
};
