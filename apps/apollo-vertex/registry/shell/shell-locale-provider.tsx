import {
  type PropsWithChildren,
  useEffect,
  useEffectEvent,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { Spinner } from "@/components/ui/spinner";
import { configurei18n } from "@/lib/i18n";
import type { LanguageChangedEvent } from "./shell-language-toggle";

export const LocaleProviderComponent = ({ children }: PropsWithChildren) => {
  const { i18n } = useTranslation();

  const handleLanguageChanged = useEffectEvent((event: Event) => {
    const { selectedLanguageId } = (event as CustomEvent<LanguageChangedEvent>)
      .detail;
    i18n.changeLanguage(selectedLanguageId);
    document.documentElement.lang = selectedLanguageId;
  });

  useEffect(() => {
    document.addEventListener("languageChanged", handleLanguageChanged);
    return () =>
      document.removeEventListener("languageChanged", handleLanguageChanged);
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
    configure();
  }, []);

  if (!isConfigured)
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner className="size-10 animate-spin" />
      </div>
    );

  return <LocaleProviderComponent>{children}</LocaleProviderComponent>;
};
