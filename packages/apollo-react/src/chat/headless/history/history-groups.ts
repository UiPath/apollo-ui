import { differenceInDays, differenceInMonths, isSameDay, subDays } from 'date-fns';

import type { AutopilotChatHistory } from '../../service';

/** The date bucket of a history group; `months-ago` groups carry their month count. */
export type ChatHistoryBucket =
  | { kind: 'today' }
  | { kind: 'yesterday' }
  | { kind: 'last-week' }
  | { kind: 'last-30-days' }
  | { kind: 'months-ago'; count: number };

export interface ChatHistoryGroup {
  /** Stable per bucket (`months-ago-2`), for keys and lookups. */
  key: string;
  bucket: ChatHistoryBucket;
  items: AutopilotChatHistory[];
}

export function getHistoryBucket(timestamp: string, now: Date): ChatHistoryBucket {
  const date = new Date(timestamp);
  const daysAgo = differenceInDays(now, date);

  if (isSameDay(date, now)) return { kind: 'today' };
  if (isSameDay(date, subDays(now, 1))) return { kind: 'yesterday' };
  if (daysAgo <= 7) return { kind: 'last-week' };
  if (daysAgo <= 30) return { kind: 'last-30-days' };
  return { kind: 'months-ago', count: differenceInMonths(now, date) };
}

const bucketKey = (bucket: ChatHistoryBucket) =>
  bucket.kind === 'months-ago' ? `months-ago-${bucket.count}` : bucket.kind;

/**
 * Client-side search, used when the host does not paginate history (with `paginatedHistory` the
 * host filters on `HistorySearch`): a case-insensitive match on the name.
 */
export function filterHistory(items: AutopilotChatHistory[], query: string) {
  const needle = query.toLowerCase();
  return needle ? items.filter((item) => item.name.toLowerCase().includes(needle)) : items;
}

const time = (item: AutopilotChatHistory) => new Date(item.timestamp).getTime();

/**
 * Groups history into date buckets, newest first. Groups are ordered by the first item each one
 * received, then each group's items by date, as Material always has.
 */
export function groupHistory(items: AutopilotChatHistory[], now = new Date()): ChatHistoryGroup[] {
  const groups: ChatHistoryGroup[] = [];

  for (const item of items) {
    const bucket = getHistoryBucket(item.timestamp, now);
    const key = bucketKey(bucket);
    const group = groups.find((candidate) => candidate.key === key);

    if (group) {
      group.items.push(item);
    } else {
      groups.push({ key, bucket, items: [item] });
    }
  }

  groups.sort((a, b) => time(b.items[0]!) - time(a.items[0]!));
  for (const group of groups) {
    group.items.sort((a, b) => time(b) - time(a));
  }

  return groups;
}
