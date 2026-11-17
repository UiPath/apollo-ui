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

/**
 * Resolves a host-supplied tag to a shipped catalog tag, case-insensitively.
 *
 * BCP 47 tags are case-insensitive by spec, and hosts source theirs from
 * wildly different places — PortalShell, `navigator.language`, a
 * user-preferences API — so `zh-tw`, `zh-TW` and ` ZH-tw ` must all find the
 * `zh-TW` catalog. Returns `undefined` for a tag we ship no catalog for.
 */
export function resolveSupportedLocale(tag: string | undefined): SupportedLocale | undefined {
  const raw = tag?.trim();
  if (!raw) return undefined;
  return SUPPORTED_LOCALES.find((supported) => supported.toLowerCase() === raw.toLowerCase());
}

export interface ApI18nProviderProps {
  /**
   * Apollo-react component group whose pre-built lingui catalogs should be
   * activated. Must be a key registered in `locale-registry.ts`
   * (e.g. `'canvas'`, `'chat'`, `'decision-table'`). Unknown values log
   * an error and activate empty messages.
   */
  component: string;
  /**
   * Locale to use for translations. If not provided, reads from document.documentElement.lang (set by the host app), falling back to 'en'.
   *
   * Matched case-insensitively, so any spelling of a supported tag works
   * (`zh-tw` resolves to the `zh-TW` catalog). An unsupported tag falls back
   * to English.
   *
   * @default document.documentElement.lang || 'en'
   */
  locale?: SupportedLocale | (string & {});
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
 * <ApI18nProvider component="chat">
 *   <ApChat chatServiceInstance={chatService} />
 * </ApI18nProvider>
 * ```
 */
export function ApI18nProvider({ component, locale: propLocale, children }: ApI18nProviderProps) {
  const requested = propLocale || document.documentElement.lang || 'en';
  const catalog = resolveSupportedLocale(requested) ?? 'en';

  // Which *spelling* of that language to activate. Hosts key their lingui
  // catalogs by whatever tag they were handed, and lingui compares those keys
  // byte-for-byte — so activating our canonical tag over a host sitting on
  // `zh-tw` would point the shared singleton at a bucket the host never wrote
  // to, and every host string would miss and fall back to its source text.
  // Keep the owner's spelling whenever it means the same language.
  const preferred = propLocale || i18n.locale || undefined;
  const target = preferred && resolveSupportedLocale(preferred) === catalog ? preferred : catalog;

  const loadAndActivate = useCallback(() => {
    const preImportedLocales = getAllPreImportedLocales(component);

    if (!preImportedLocales) {
      console.error(`No locales found for component: ${component}`);
      // Activate with empty messages rather than undefined forEach
      i18n.load(target, {});
      i18n.activate(target);
      return;
    }

    // Load all locales
    SUPPORTED_LOCALES.forEach((supportedLocale) => {
      const messages = preImportedLocales[supportedLocale];
      if (messages) {
        i18n.load(supportedLocale, messages);
      }
    });

    // `load` merges, so filing our catalog under the host's spelling adds our
    // strings to its bucket without disturbing the host's own.
    if (target !== catalog) {
      i18n.load(target, preImportedLocales[catalog] ?? {});
    }

    i18n.activate(target);
  }, [component, catalog, target]);

  useEffect(() => {
    loadAndActivate();
  }, [loadAndActivate]);

  return <I18nProvider i18n={i18n}>{children}</I18nProvider>;
}

export function useApI18n() {
  return i18n;
}
