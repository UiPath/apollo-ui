'use client';

import * as React from 'react';
import { type DateLocale, getLoadedDateLocale, loadDateLocale } from '@/lib/date-locale';

/** The English text of the date and time pickers, overridable key by key. */
export interface DatePickerStrings {
  /** DatePicker placeholder. */
  pickDate: string;
  /** DateRangePicker placeholder. */
  pickDateRange: string;
  /** DateTimePicker placeholder. */
  pickDateTime: string;
  /** Accessible name of a trigger holding a date, when nothing else labels it. */
  selectedDate: (date: string) => string;
  /** Accessible name of a range trigger holding both ends, when nothing else labels it. */
  selectedRange: (from: string, to: string) => string;
  /** Heading of the DateTimePicker time field. */
  time: string;
  /** Accessible name of the hour segment. */
  hours: string;
  /** Accessible name of the minute segment. */
  minutes: string;
  /** Accessible name of the AM/PM choice. */
  dayPeriod: string;
  /** DateTimePicker button that empties the value. */
  clear: string;
  /** DateTimePicker button that closes the panel. */
  done: string;
}

export const DEFAULT_DATE_PICKER_STRINGS: DatePickerStrings = {
  pickDate: 'Pick a date',
  pickDateRange: 'Pick a date range',
  pickDateTime: 'Pick a date and time',
  selectedDate: (date) => `Selected date: ${date}`,
  selectedRange: (from, to) => `Selected range: ${from} to ${to}`,
  time: 'Time',
  hours: 'Hours',
  minutes: 'Minutes',
  dayPeriod: 'AM/PM',
  clear: 'Clear',
  done: 'Done',
};

interface LocaleContextValue {
  dateLocale?: DateLocale;
  datePickerStrings: DatePickerStrings;
}

const LocaleContext = React.createContext<LocaleContextValue>({
  datePickerStrings: DEFAULT_DATE_PICKER_STRINGS,
});

/** Overrides win key by key; an `undefined` override keeps the inherited string. */
function mergeStrings(
  base: DatePickerStrings,
  overrides: Partial<DatePickerStrings>
): DatePickerStrings {
  const merged = { ...base };
  for (const key of Object.keys(overrides) as (keyof DatePickerStrings)[]) {
    const value = overrides[key];
    if (value !== undefined) (merged as Record<string, unknown>)[key] = value;
  }
  return merged;
}

/**
 * Resolves a language tag to its date locale, loading it on first use. Renders in English
 * until the language arrives; a locale object is used as is.
 */
export function useResolvedDateLocale(
  locale: string | DateLocale | undefined
): DateLocale | undefined {
  const tag = typeof locale === 'string' ? locale : undefined;
  const [, rerender] = React.useReducer((n: number) => n + 1, 0);
  React.useEffect(() => {
    if (!tag || getLoadedDateLocale(tag)) return;
    let active = true;
    void loadDateLocale(tag).then(() => {
      if (active) rerender();
    });
    return () => {
      active = false;
    };
  }, [tag]);
  if (typeof locale === 'object') return locale;
  return tag ? getLoadedDateLocale(tag) : undefined;
}

/** The date locale from a component's own `locale` prop, else the nearest `LocaleProvider`. */
export function useDateLocale(locale?: string | DateLocale): DateLocale | undefined {
  const own = useResolvedDateLocale(locale);
  const inherited = React.useContext(LocaleContext).dateLocale;
  return locale === undefined ? inherited : own;
}

/** The date picker strings from the nearest `LocaleProvider`, with a component's overrides on top. */
export function useDatePickerStrings(overrides?: Partial<DatePickerStrings>): DatePickerStrings {
  const inherited = React.useContext(LocaleContext).datePickerStrings;
  return React.useMemo(
    () => (overrides ? mergeStrings(inherited, overrides) : inherited),
    [inherited, overrides]
  );
}

export interface LocaleProviderProps {
  /**
   * The platform language as a tag (`'de'`, `'pt-BR'`, `'zh-TW'`), or a locale from
   * `react-day-picker/locale`. A tag loads its locale on first use and renders in English until
   * then; await `loadDateLocale(tag)` and pass the result to avoid that. Unset, an outer
   * provider's locale applies, and English without one.
   */
  locale?: string | DateLocale;
  /** Translations for the date and time pickers, merged over any outer provider's. */
  datePickerStrings?: Partial<DatePickerStrings>;
  children: React.ReactNode;
}

/**
 * Sets the language of the apollo-wind components below it, usually once at the app root.
 * Dates, month and weekday names, the first day of the week, the 12- or 24-hour clock and the
 * calendar's own accessible labels follow `locale`. The pickers' remaining text comes from
 * `datePickerStrings`, in English unless translated. Components also take their own `locale`
 * and `strings`, which win over the provider.
 */
export function LocaleProvider({ locale, datePickerStrings, children }: LocaleProviderProps) {
  const outer = React.useContext(LocaleContext);
  const own = useResolvedDateLocale(locale);
  const dateLocale = locale === undefined ? outer.dateLocale : own;
  const value = React.useMemo<LocaleContextValue>(
    () => ({
      dateLocale,
      datePickerStrings: datePickerStrings
        ? mergeStrings(outer.datePickerStrings, datePickerStrings)
        : outer.datePickerStrings,
    }),
    [dateLocale, datePickerStrings, outer.datePickerStrings]
  );
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
