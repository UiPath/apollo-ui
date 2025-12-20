import {
  ReactNode,
  useCallback,
  useEffect,
} from 'react';

import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';

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
] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export interface ApI18nProviderProps {
  /**
   * Component path relative to src/ where locales are stored.
   * Example: 'material/components/ap-chat'
   */
  component: string;
  /**
   * Locale to use for translations. If not provided, will attempt to use locale from LocaleProvider context.
   * @default 'en'
   */
  locale?: SupportedLocale;
  /**
   * Children components
   */
  children: ReactNode;
}

/**
 * Component-scoped i18n provider for Apollo components.
 *
 * @internal This is an internal API scoped to specific components.
 * Not exposed in the public package exports.
 *
 * @example
 * ```tsx
 * import { ApI18nProvider } from '../../../i18n';
 *
 * function MyComponent() {
 *   return (
 *     <ApI18nProvider component="material/components/ap-chat">
 *       <ApChat chatServiceInstance={chatService} />
 *     </ApI18nProvider>
 *   );
 * }
 * ```
 */
export function ApI18nProvider({
  component,
  locale: propLocale,
  children,
}: ApI18nProviderProps) {
  const locale = propLocale || 'en';

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

  return (
    <I18nProvider i18n={i18n}>
      {children}
    </I18nProvider>
  );
}

export function useApI18n() {
  return i18n;
}
