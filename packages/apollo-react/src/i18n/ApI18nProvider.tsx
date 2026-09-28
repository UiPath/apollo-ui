import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { type ReactNode, useCallback, useEffect } from 'react';

import { getAllPreImportedLocales } from './locale-registry';

export const SUPPORTED_LOCALES = [
  'en',
  'es',
  'pt',
  'de',
  'fr',
  'ja',
  'ko',
  'ru',
  'tr',
  'zh-CN',
  'zh-TW',
  'pt-BR',
  'es-MX',
  'ro',
] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export interface ApI18nProviderProps {
  /**
   * Apollo-react component group whose pre-built lingui catalogs should be
   * activated. Must be a key registered in `locale-registry.ts`
   * (e.g. `'canvas'`, `'material/components/ap-chat'`). Unknown values log
   * an error and activate empty messages.
   */
  component: string;
  /**
   * Locale to use for translations. If not provided, reads from document.documentElement.lang (set by the host app), falling back to 'en'.
   * @default document.documentElement.lang || 'en'
   */
  locale?: SupportedLocale;
  /**
   * Children components
   */
  children: ReactNode;
}

/**
 * Activates apollo-react's pre-built lingui catalogs for a given component
 * group. Wrap any apollo-react UI (e.g. `<ApChat>`, canvas components) so its
 * strings render in the active locale.
 *
 * `component` must be a key registered in `locale-registry.ts`. Mutates the
 * shared `@lingui/core` i18n singleton, so host apps running their own
 * lingui setup should keep a single source of truth.
 *
 * @example
 * ```tsx
 * import { ApI18nProvider } from '@uipath/apollo-react/i18n';
 *
 * <ApI18nProvider component="material/components/ap-chat">
 *   <ApChat chatServiceInstance={chatService} />
 * </ApI18nProvider>
 * ```
 */
export function ApI18nProvider({ component, locale: propLocale, children }: ApI18nProviderProps) {
  const detectedLang = document.documentElement.lang as SupportedLocale;
  const fallback = SUPPORTED_LOCALES.includes(detectedLang) ? detectedLang : 'en';
  const locale = propLocale || fallback;

  const loadAndActivate = useCallback(() => {
    const preImportedLocales = getAllPreImportedLocales(component);

    if (!preImportedLocales) {
      console.error(`No locales found for component: ${component}`);
      // Activate with empty messages rather than undefined forEach
      i18n.load(locale, {});
      i18n.activate(locale);
      return;
    }

    // Load all locales
    SUPPORTED_LOCALES.forEach((supportedLocale) => {
      const messages = preImportedLocales[supportedLocale];
      if (messages) {
        i18n.load(supportedLocale, messages);
      }
    });

    i18n.activate(locale);
  }, [component, locale]);

  useEffect(() => {
    loadAndActivate();
  }, [loadAndActivate]);

  return <I18nProvider i18n={i18n}>{children}</I18nProvider>;
}

export function useApI18n() {
  return i18n;
}
