import type { GuardrailValidatorFormLabels } from './i18n';

export const GUARDRAIL_FORM_LOCALES = [
  'de',
  'en',
  'es',
  'es-MX',
  'fr',
  'ja',
  'ko',
  'pt',
  'pt-BR',
  'ro',
  'ru',
  'tr',
  'zh-CN',
  'zh-TW',
] as const;

export type GuardrailFormLocale = (typeof GUARDRAIL_FORM_LOCALES)[number];

type CatalogModule = { messages: Partial<GuardrailValidatorFormLabels> };

// Written as literal imports on purpose: a template-literal dynamic import
// (import(`./locales/${locale}`)) cannot be resolved by a consumer's bundler through the
// package `exports` map, so every host that tried would silently render English defaults.
const CATALOGS = {
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
} satisfies Record<GuardrailFormLocale, () => Promise<CatalogModule>>;

/**
 * Normalize a host locale to a supported catalog tag: `pt_BR` matches `pt-BR`, matching is
 * case-insensitive, and an unsupported regional tag falls back to its base language
 * (`fr-CA` resolves to `fr`). Returns `undefined` when nothing matches.
 */
export function resolveGuardrailFormLocale(locale?: string): GuardrailFormLocale | undefined {
  const raw = locale?.trim().replace(/_/g, '-');
  if (!raw) return undefined;
  const exact = GUARDRAIL_FORM_LOCALES.find((tag) => tag.toLowerCase() === raw.toLowerCase());
  if (exact) return exact;
  const base = raw.split('-')[0]?.toLowerCase();
  return GUARDRAIL_FORM_LOCALES.find((tag) => tag.toLowerCase() === base);
}

/**
 * Load the component's message catalog for a locale. Never rejects: an unresolvable locale
 * or a failed chunk load falls back to the English catalog, then to `{}` (which resolves to
 * the built-in English defaults per key).
 */
export async function loadGuardrailValidatorFormMessages(
  locale?: string
): Promise<Partial<GuardrailValidatorFormLabels>> {
  const tag = resolveGuardrailFormLocale(locale) ?? 'en';
  try {
    return (await CATALOGS[tag]()).messages;
  } catch {
    if (tag === 'en') return {};
    try {
      return (await CATALOGS.en()).messages;
    } catch {
      return {};
    }
  }
}
