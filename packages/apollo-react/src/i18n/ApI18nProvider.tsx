import {
  ReactNode,
  useCallback,
  useEffect,
} from 'react';

import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';

/**
 * List of all supported locales
 */
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

/**
 * Supported locales for Apollo components
 */
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

/**
 * Dynamically load locale messages for a component
 */
async function loadMessages(
  component: string,
  locale: SupportedLocale
): Promise<Record<string, string>> {
  try {
    const messages = await import(`../${component}/locales/${locale}.js`);
    const messageData = messages.default || messages;
    // JSON files are compiled as JS modules that export strings, so parse them
    return typeof messageData === 'string' ? JSON.parse(messageData) : messageData;
  } catch (error) {
    console.warn(`Failed to load locale ${locale} for ${component}, falling back to English`, error);
    try {
      const fallback = await import(`../${component}/locales/en.js`);
      const fallbackData = fallback.default || fallback;
      // JSON files are compiled as JS modules that export strings, so parse them
      return typeof fallbackData === 'string' ? JSON.parse(fallbackData) : fallbackData;
    } catch {
      console.error(`Failed to load fallback locale for ${component}`);
      return {};
    }
  }
}

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
  // Use prop locale if provided, otherwise default to 'en'
  const locale = propLocale || 'en';

  const loadAndActivate = useCallback(async () => {
    const messages = await loadMessages(component, locale);
    i18n.load(locale, messages);
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

/**
 * Hook to access the current i18n instance
 * @returns The Lingui i18n instance
 */
export function useApI18n() {
  return i18n;
}
