import type { LockableFieldType, LockableValueFieldOption } from './types';

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

/**
 * Computes the plain-text shown in place of the real control once a field is locked.
 * Boolean/single-select/multi-select resolve their stored value to a display label;
 * everything else (including an invalid date, so the component never throws on
 * external input) falls back to the raw value.
 */
export function getLockedDisplayValue(
  fieldType: LockableFieldType,
  value: string,
  options: LockableValueFieldOption[]
): string {
  switch (fieldType) {
    case 'boolean':
      if (value === 'true') return 'True';
      if (value === 'false') return 'False';
      return '';
    case 'date':
      return value ? formatDateValue(value) : '';
    case 'single-select':
      return options.find((option) => option.value === value)?.label ?? value;
    case 'multi-select': {
      const parsed = parseListValue(value);
      // A malformed value (not JSON, or an array with no string entries) also
      // parses to an empty list -- fall back to the raw value so it's still
      // visible, rather than rendering as if the field were genuinely empty.
      if (parsed.length === 0 && value && value !== '[]') {
        return value;
      }
      return parsed.map((v) => options.find((option) => option.value === v)?.label ?? v).join(', ');
    }
    default:
      return value;
  }
}
