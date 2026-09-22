import {
  type PropsWithChildren,
  type ReactNode,
  useEffect,
  useEffectEvent,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { Spinner } from "@/components/ui/spinner";
import { configurei18n } from "@/lib/i18n";
import { LANGUAGE_CHANGED_EVENT } from "./shell-constants";

interface LocaleProviderProps {
  loadingElement?: ReactNode;
}

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

export const LocaleProvider = ({
  children,
  loadingElement,
}: PropsWithChildren<LocaleProviderProps>) => {
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
      loadingElement ?? (
        <div className="flex h-full w-full items-center justify-center">
          <Spinner className="size-6" />
        </div>
      )
    );

  return <LocaleProviderComponent>{children}</LocaleProviderComponent>;
};
