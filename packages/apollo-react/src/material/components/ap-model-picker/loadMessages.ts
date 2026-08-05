import type { Messages } from '@lingui/core';

/**
 * The picker's own message catalogs, keyed by the locale tags it ships.
 *
 * Written as literal imports on purpose: a template-literal dynamic import
 * (`import(\`./locales/${locale}\`)`) cannot be resolved by a consumer's
 * bundler through the package `exports` map, so every host that tried would
 * silently render raw `modelPicker.*` keys. Keeping the map here means hosts
 * never write it — and never rediscover that.
 */
const CATALOGS: Record<string, () => Promise<{ messages: Messages }>> = {
  de: () => import('./locales/de'),
  en: () => import('./locales/en'),
  es: () => import('./locales/es'),
  'es-MX': () => import('./locales/es-MX'),
  fr: () => import('./locales/fr'),
  ja: () => import('./locales/ja'),
  ko: () => import('./locales/ko'),
  pt: () => import('./locales/pt'),
  'pt-BR': () => import('./locales/pt-BR'),
  ro: () => import('./locales/ro'),
  ru: () => import('./locales/ru'),
  tr: () => import('./locales/tr'),
  'zh-CN': () => import('./locales/zh-CN'),
  'zh-TW': () => import('./locales/zh-TW'),
};

/** Locale tags the picker ships a catalog for. */
export const MODEL_PICKER_LOCALES = Object.keys(CATALOGS);

/**
 * Resolves a host locale to a shipped catalog tag.
 *
 * Matches case-insensitively and tolerates both separators (`pt_BR`,
 * `pt-br`), because hosts source this from wildly different places —
 * PortalShell, `navigator.language`, a user-preferences API. Falls back to
 * the base language (`fr-CA` → `fr`), then `undefined`.
 */
export function resolveModelPickerLocale(locale: string | undefined): string | undefined {
  const raw = locale?.trim().replace(/_/g, '-');
  if (!raw) return undefined;
  const exact = MODEL_PICKER_LOCALES.find((tag) => tag.toLowerCase() === raw.toLowerCase());
  if (exact) return exact;
  const base = raw.split('-')[0]?.toLowerCase();
  return MODEL_PICKER_LOCALES.find((tag) => tag.toLowerCase() === base);
}

/**
 * Loads the picker's messages for `locale`, for merging into the host's own
 * Lingui catalog:
 *
 * ```ts
 * const pickerMessages = await loadModelPickerMessages(locale);
 * // Host keys last: an app key always wins a collision.
 * i18n.loadAndActivate({ locale, messages: { ...pickerMessages, ...appMessages } });
 * ```
 *
 * Keys are namespaced `modelPicker.*`, so collisions with host keys are not
 * expected — merge in that order anyway, so a host is never held hostage to
 * a design-system key.
 *
 * Never rejects: an unknown locale, or a chunk that fails to load, falls back
 * to English and finally to `{}`. Missing messages degrade to the picker's
 * English source strings, which is a worse experience than a translation but
 * a better one than a blank UI or a thrown error inside the host's i18n
 * bootstrap.
 */
export async function loadModelPickerMessages(locale: string | undefined): Promise<Messages> {
  const tag = resolveModelPickerLocale(locale) ?? 'en';
  try {
    return (await CATALOGS[tag]()).messages;
  } catch {
    if (tag === 'en') return {} as Messages;
    try {
      return (await CATALOGS.en()).messages;
    } catch {
      return {} as Messages;
    }
  }
}
