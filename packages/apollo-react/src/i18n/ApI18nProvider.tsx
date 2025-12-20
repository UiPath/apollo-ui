import {
  ReactNode,
  useCallback,
  useEffect,
} from 'react';

import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';

import {
  getAllPreImportedLocales,
  getPreImportedMessages,
} from './locale-registry';

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
 * Load locale messages for a component
 * First checks pre-imported registry, then falls back to dynamic import
 */
async function loadMessages(
  component: string,
  locale: SupportedLocale
): Promise<Record<string, string>> {
  // Check pre-imported registry first
  const preImported = getPreImportedMessages(component, locale);
  if (preImported) {
    return preImported;
  }

  // Fallback to dynamic import for components not in registry
  try {
    const messages = await import(`../${component}/locales/${locale}.js`);
    // Handle CommonJS format: module.exports = { messages: ... }
    if (messages?.messages) {
      return messages.messages;
    }
    // Handle ES module default export
    const messageData = messages.default || messages;
    // JSON files are compiled as JS modules that export strings, so parse them
    return typeof messageData === 'string' ? JSON.parse(messageData) : messageData;
  } catch (error) {
    console.warn(`Failed to load locale ${locale} for ${component}, falling back to English`, error);
    try {
      const fallback = await import(`../${component}/locales/en.js`);
      // Handle CommonJS format
      if (fallback?.messages) {
        return fallback.messages;
      }
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
    // Try to get pre-imported locales first (faster, bundled at build time)
    const preImportedLocales = getAllPreImportedLocales(component);

    if (preImportedLocales) {
      // All locales are pre-imported, load them synchronously
      SUPPORTED_LOCALES.forEach((supportedLocale) => {
        const messages = preImportedLocales[supportedLocale];
        if (messages) {
          i18n.load(supportedLocale, messages);
        }
      });
    } else {
      // Fallback to dynamic imports for components not in registry
      const loadPromises = SUPPORTED_LOCALES.map(async (supportedLocale) => {
        const messages = await loadMessages(component, supportedLocale);
        i18n.load(supportedLocale, messages);
      });

      await Promise.allSettled(loadPromises);
    }

    // Activate the requested locale
    // Ensure the locale is loaded (even if empty) before activating
    try {
      i18n.activate(locale);
    } catch (error) {
      console.error(`Failed to activate locale ${locale} for ${component}:`, error);
      // Ensure locale has empty messages as fallback
      if (!i18n.messages[locale]) {
        i18n.load(locale, {});
      }
      i18n.activate(locale);
    }
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
