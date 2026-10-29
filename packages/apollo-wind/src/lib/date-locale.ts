import { format } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import type { DayPickerLocale } from 'react-day-picker/locale';

/**
 * A date-fns locale, optionally carrying react-day-picker's translated calendar labels.
 * The locales exported by `react-day-picker/locale` are of this type.
 */
export type DateLocale = DayPickerLocale;

// One entry per platform language. Each is its own chunk, so an app downloads only the
// language it uses. Unknown tags fall back to their base language, then to English. A Map, so a
// tag such as `constructor` can't match an inherited object key.
const LOADERS = new Map<string, () => Promise<DateLocale>>([
  ['en', () => import('react-day-picker/locale/en-US').then((m) => m.enUS)],
  ['de', () => import('react-day-picker/locale/de').then((m) => m.de)],
  ['es', () => import('react-day-picker/locale/es').then((m) => m.es)],
  ['fr', () => import('react-day-picker/locale/fr').then((m) => m.fr)],
  ['ja', () => import('react-day-picker/locale/ja').then((m) => m.ja)],
  ['ko', () => import('react-day-picker/locale/ko').then((m) => m.ko)],
  ['pt', () => import('react-day-picker/locale/pt').then((m) => m.pt)],
  ['pt-br', () => import('react-day-picker/locale/pt-BR').then((m) => m.ptBR)],
  ['ro', () => import('react-day-picker/locale/ro').then((m) => m.ro)],
  ['ru', () => import('react-day-picker/locale/ru').then((m) => m.ru)],
  ['tr', () => import('react-day-picker/locale/tr').then((m) => m.tr)],
  ['zh', () => import('react-day-picker/locale/zh-CN').then((m) => m.zhCN)],
  ['zh-cn', () => import('react-day-picker/locale/zh-CN').then((m) => m.zhCN)],
  ['zh-tw', () => import('react-day-picker/locale/zh-TW').then((m) => m.zhTW)],
]);

const loaded = new Map<string, DateLocale>();
const pending = new Map<string, Promise<DateLocale | undefined>>();

function loaderKey(tag: string): string | undefined {
  const normalized = tag.trim().replace(/_/g, '-').toLowerCase();
  if (LOADERS.has(normalized)) return normalized;
  const base = normalized.split('-')[0];
  return LOADERS.has(base) ? base : undefined;
}

/** The locale for a language tag if it has already loaded, without loading it. */
export function getLoadedDateLocale(tag: string): DateLocale | undefined {
  const key = loaderKey(tag);
  return key ? loaded.get(key) : undefined;
}

/**
 * Loads the date locale for a platform language tag (`'de'`, `'pt-BR'`, `'zh-TW'`). Resolves
 * to `undefined` for a language with no bundled locale, which renders in English. Await it
 * before the first render to avoid showing English while the language loads.
 */
export function loadDateLocale(tag: string): Promise<DateLocale | undefined> {
  const key = loaderKey(tag);
  const load = key ? LOADERS.get(key) : undefined;
  if (!key || !load) return Promise.resolve(undefined);
  const done = loaded.get(key);
  if (done) return Promise.resolve(done);
  let promise = pending.get(key);
  if (!promise) {
    promise = load()
      .then((locale) => {
        loaded.set(key, locale);
        return locale;
      })
      .catch(() => undefined)
      // A failed load is not cached, so a later render can retry it.
      .finally(() => pending.delete(key));
    pending.set(key, promise);
  }
  return promise;
}

/** Drops quoted literals, so `'h'` in `"HH 'h' mm"` is not read as a 12-hour token. */
function patternTokens(pattern: string): string {
  return pattern.replace(/'[^']*'/g, '');
}

/** The locale's own short time pattern, e.g. `h:mm a` in English or `HH:mm` in German. */
export function localeTimePattern(locale: DateLocale | undefined): string | undefined {
  return locale?.formatLong?.time({ width: 'short' });
}

export function isTwelveHourPattern(pattern: string): boolean {
  return /[hK]/.test(patternTokens(pattern));
}

/**
 * The hour cycle to show: an explicit choice wins, then the locale's own, then 24-hour,
 * which is what the pickers showed before they took a locale.
 */
export function resolveUse12Hour(use12Hour: boolean | undefined, locale?: DateLocale): boolean {
  if (use12Hour !== undefined) return use12Hour;
  const native = localeTimePattern(locale);
  return native ? isTwelveHourPattern(native) : false;
}

/** The time pattern for a display, in the locale's own word order when it has the hour cycle. */
function timePattern(locale: DateLocale | undefined, use12Hour: boolean | undefined): string {
  const native = localeTimePattern(locale);
  if (native && (use12Hour === undefined || isTwelveHourPattern(native) === use12Hour)) {
    return native;
  }
  return use12Hour ? 'hh:mm a' : 'HH:mm';
}

/** A long date, e.g. "June 15th, 2024" or "15. Juni 2024". */
export function formatLongDate(date: Date, locale?: DateLocale): string {
  return format(date, 'PPP', { locale });
}

/** A medium date, e.g. "Jun 15, 2024" or "15.06.2024". */
export function formatMediumDate(date: Date, locale?: DateLocale): string {
  return format(date, 'PP', { locale });
}

/**
 * A long date and a time, joined the way the language joins them: "June 15th, 2024 at 14:30",
 * "15. Juni 2024 um 14:30", "2024年6月15日 14:30".
 */
export function formatDateTime(
  date: Date,
  locale: DateLocale | undefined,
  use12Hour: boolean | undefined
): string {
  const join = (locale ?? enUS).formatLong.dateTime({ width: 'long' });
  const pattern = join
    .replace('{{date}}', 'PPP')
    .replace('{{time}}', timePattern(locale, use12Hour));
  return format(date, pattern, { locale });
}
