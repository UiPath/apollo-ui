import { type ReactNode, createContext, useContext, useMemo } from 'react';

import type { SupportedLocale } from './ApI18nProvider';

interface ApLocaleContextValue {
  locale: SupportedLocale;
}

const ApLocaleContext = createContext<ApLocaleContextValue | undefined>(undefined);

export interface ApLocaleProviderProps {
  locale: SupportedLocale;
  children: ReactNode;
}

export function ApLocaleProvider({ locale, children }: ApLocaleProviderProps) {
  const value = useMemo<ApLocaleContextValue>(() => ({ locale }), [locale]);
  return <ApLocaleContext.Provider value={value}>{children}</ApLocaleContext.Provider>;
}

export function useApLocale(): SupportedLocale | undefined {
  return useContext(ApLocaleContext)?.locale;
}
