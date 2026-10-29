import type { VariablePickerItem } from '@/components/ui/variable-picker';
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
/** Unset, `localeCode` falls back to the browser's language. */
export function formatDateValue(value: string, localeCode?: string): string {
  const date = toDateValue(value);
  return date
    ? date.toLocaleDateString(localeCode, { year: 'numeric', month: 'long', day: 'numeric' })
    : value;
}

export interface VariablePickerSource {
  items: VariablePickerItem[];
  /** The consumer's own entry for a picked item: rebuilding it from the item would drop `type`. */
  resolve: (item: VariablePickerItem) => QuickFormFieldOption;
}

/** Maps `variables` onto picker items, keeping a way back to each consumer entry. */
export function toVariablePickerSource(variables: QuickFormFieldOption[]): VariablePickerSource {
  // Ids come from tree position: neither labels nor values are required to be unique.
  const byId = new Map<string, QuickFormFieldOption>();
  const toItem = (v: QuickFormFieldOption, id: string): VariablePickerItem => {
    byId.set(id, v);
    return {
      id,
      label: v.label,
      ...(v.value ? { value: v.value } : {}),
      ...(v.type ? { type: v.type } : {}),
      ...(v.children ? { children: v.children.map((c, i) => toItem(c, `${id}/${i}`)) } : {}),
    };
  };
  return {
    items: variables.map((v, i) => toItem(v, String(i))),
    resolve: (item) => byId.get(item.id) ?? { label: item.label, value: item.value ?? '' },
  };
}
