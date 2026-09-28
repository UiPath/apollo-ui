import type React from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import type { SupportedLocale } from '../../../../i18n';
import { AutopilotChatInternalEvent } from '../service/ChatModel';
import { useChatService } from './chat-service.provider';

interface LocaleContextValue {
  locale: SupportedLocale;
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

export interface LocaleProviderProps {
  children: React.ReactNode;
}

export const LocaleProvider: React.FC<LocaleProviderProps> = ({ children }) => {
  const chatService = useChatService();
  const [locale, setLocale] = useState<SupportedLocale>(chatService.getLocale() as SupportedLocale);

  // Subscribe to locale changes from service (service → provider)
  useEffect(() => {
    const unsubscribe = chatService.__internalService__.on(
      AutopilotChatInternalEvent.SetLocale,
      (newLocale: SupportedLocale) => {
        setLocale(newLocale);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [chatService]);

  const value = useMemo<LocaleContextValue>(() => ({ locale }), [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
};

export const useLocale = (): LocaleContextValue => {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
};
