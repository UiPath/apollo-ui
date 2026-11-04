import { DateTime } from "luxon";

/** Calendar-day buckets in display order, newest first. */
export const DAY_GROUPS = ["today", "yesterday", "week", "older"] as const;

export type DayGroup = (typeof DAY_GROUPS)[number];

/** A Luxon DateTime, a JS Date, or an ISO 8601 string. */
export type DateInput = DateTime | Date | string;

export interface FormatRelativeTimeOptions {
  /** BCP 47 locale, e.g. `i18n.language`. Defaults to Luxon's default locale. */
  locale?: string;
  /** The moment to compare against. Defaults to now. */
  now?: DateTime;
  /** Unit style: "2 hours ago" (long), "2 hr. ago" (short) or the narrowest form. */
  style?: "long" | "short" | "narrow";
}

export function toDateTime(value: DateInput): DateTime {
  if (value instanceof DateTime) return value;
  if (value instanceof Date) return DateTime.fromJSDate(value);
  return DateTime.fromISO(value);
}

/** "2 hours ago", "in 3 days". Returns an empty string for an invalid date. */
export function formatRelativeTime(
  value: DateInput,
  {
    locale,
    now = DateTime.now(),
    style = "long",
  }: FormatRelativeTimeOptions = {},
): string {
  const date = toDateTime(value);
  if (!date.isValid) return "";
  return date.toRelative({ base: now, locale, style }) ?? "";
}

/** The calendar-day bucket of `value` in `now`'s time zone. Invalid and future dates go to "older" and "today". */
export function getDayGroup(
  value: DateInput,
  now: DateTime = DateTime.now(),
): DayGroup {
  const date = toDateTime(value);
  if (!date.isValid) return "older";
  const days = Math.round(
    now.startOf("day").diff(date.setZone(now.zone).startOf("day"), "days").days,
  );

  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return "week";
  return "older";
}

/** Splits `items` into day groups in `DAY_GROUPS` order, keeping the order of items within each group and dropping empty groups. */
export function groupByDay<T>(
  items: readonly T[],
  dateOf: (item: T) => DateInput,
  now: DateTime = DateTime.now(),
): Array<{ group: DayGroup; items: T[] }> {
  const byGroup = new Map<DayGroup, T[]>();
  for (const item of items) {
    const group = getDayGroup(dateOf(item), now);
    const existing = byGroup.get(group);
    if (existing == null) byGroup.set(group, [item]);
    else existing.push(item);
  }
  return DAY_GROUPS.flatMap((group) => {
    const grouped = byGroup.get(group);
    return grouped == null ? [] : [{ group, items: grouped }];
  });
}
