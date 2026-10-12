import { toDateValue } from '@/lib/date-value';
import type { QuickFormFieldOption } from './types';

export const DEFAULT_SELECT_OPTIONS: QuickFormFieldOption[] = [
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

/** Formats a Date as a local `YYYY-MM-DD` string, which `toDateValue` reads back as a local date. */
export function toDateOnlyString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Formats a date field's value for display, falling back to the raw value if it isn't a valid date. */
export function formatDateValue(value: string): string {
  const date = toDateValue(value);
  return date
    ? date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : value;
}
