import type { LockableValueFieldOption } from './types';

export const DEFAULT_SELECT_OPTIONS: LockableValueFieldOption[] = [
  { label: 'Option 1', value: 'option-1' },
  { label: 'Option 2', value: 'option-2' },
  { label: 'Option 3', value: 'option-3' },
];

export function parseListValue(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Parses a date field's stored value, returning undefined for empty or invalid input.
 *
 * Date-only strings (`YYYY-MM-DD`) are parsed as a local date instead of going through
 * `new Date(string)` directly -- the latter treats date-only strings as UTC midnight,
 * which rolls over to the previous day once formatted in a negative-UTC-offset
 * timezone. Full ISO timestamps (which already carry explicit time/zone info) go
 * through `new Date` as-is.
 */
export function parseDateValue(value: string): Date | undefined {
  if (DATE_ONLY_PATTERN.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    // new Date() normalizes out-of-range components (e.g. month 13, day 40)
    // into a different valid date instead of rejecting them -- reject
    // anything that didn't round-trip back to the requested year/month/day.
    const isValid =
      !Number.isNaN(date.getTime()) &&
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day;
    return isValid ? date : undefined;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/** Formats a Date as a local `YYYY-MM-DD` string, the inverse of parseDateValue's date-only path. */
export function toDateOnlyString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Formats a date field's value for display, falling back to the raw value if it isn't a valid date. */
export function formatDateValue(value: string): string {
  const date = parseDateValue(value);
  return date
    ? date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : value;
}
