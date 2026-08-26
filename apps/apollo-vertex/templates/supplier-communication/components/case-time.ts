import { NOW } from "../data/supplier-cases";

export type DateGroupId = "today" | "yesterday" | "week" | "older";

/** Render order. Only four buckets, because seven cases across five days do
 *  not support day-by-day headers. */
export const DATE_GROUPS: Array<{ id: DateGroupId; label: string }> = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "week", label: "Earlier this week" },
  { id: "older", label: "Older" },
];

const DAY_MS = 86_400_000;

/** Whole calendar days between two instants, ignoring the clock time. */
function daysBetween(from: Date, to: Date): number {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b.getTime() - a.getTime()) / DAY_MS);
}

/** Midnight on the Sunday that starts the week containing `d`. */
function weekStart(d: Date): number {
  const s = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  s.setDate(s.getDate() - s.getDay());
  return s.getTime();
}

/**
 * Which bucket a case falls in. "Earlier this week" is a real calendar-week
 * test rather than a day count, so the heading cannot claim something is from
 * this week when it is not.
 */
export function dateGroup(receivedAt: string): DateGroupId {
  const now = new Date(NOW);
  const at = new Date(receivedAt);
  const days = daysBetween(at, now);

  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  return weekStart(at) === weekStart(now) ? "week" : "older";
}

/** "09:14" today, "Yesterday", then "N days ago". */
export function relativeTime(receivedAt: string): string {
  const now = new Date(NOW);
  const at = new Date(receivedAt);
  const days = daysBetween(at, now);

  if (days <= 0) {
    const hh = String(at.getHours()).padStart(2, "0");
    const mm = String(at.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}
