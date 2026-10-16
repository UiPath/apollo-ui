import { describe, expect, it } from 'vitest';

import { filterHistory, getHistoryBucket, groupHistory } from './history-groups';

const NOW = new Date(2026, 9, 16, 15, 0, 0);
const DAY = 86_400_000;
const ago = (ms: number) => new Date(NOW.getTime() - ms).toISOString();
const item = (id: string, msAgo: number, name = id) => ({ id, name, timestamp: ago(msAgo) });

describe('history buckets', () => {
  it('buckets by calendar day relative to now, then by days and months ago', () => {
    expect(getHistoryBucket(ago(14 * 3_600_000), NOW)).toEqual({ kind: 'today' });
    // Earlier than `now` by less than a day, but on the previous calendar day.
    expect(getHistoryBucket(ago(16 * 3_600_000), NOW)).toEqual({ kind: 'yesterday' });
    expect(getHistoryBucket(ago(DAY), NOW)).toEqual({ kind: 'yesterday' });
    expect(getHistoryBucket(ago(5 * DAY), NOW)).toEqual({ kind: 'last-week' });
    expect(getHistoryBucket(ago(7 * DAY), NOW)).toEqual({ kind: 'last-week' });
    expect(getHistoryBucket(ago(8 * DAY), NOW)).toEqual({ kind: 'last-30-days' });
    expect(getHistoryBucket(ago(30 * DAY), NOW)).toEqual({ kind: 'last-30-days' });
    expect(getHistoryBucket(ago(45 * DAY), NOW)).toEqual({ kind: 'months-ago', count: 1 });
    expect(getHistoryBucket(ago(100 * DAY), NOW)).toEqual({ kind: 'months-ago', count: 3 });
  });
});

describe('groupHistory', () => {
  it('orders groups and their items newest first, one group per month count', () => {
    const groups = groupHistory(
      [
        item('older-week', 6 * DAY),
        item('three-months', 100 * DAY),
        item('newer-week', 3 * DAY),
        item('month', 12 * DAY),
        item('two-months', 70 * DAY),
        item('three-months-b', 95 * DAY),
      ],
      NOW
    );

    expect(groups.map((group) => group.key)).toEqual([
      'last-week',
      'last-30-days',
      'months-ago-2',
      'months-ago-3',
    ]);
    expect(groups[0]!.items.map((entry) => entry.id)).toEqual(['newer-week', 'older-week']);
    expect(groups[3]!.items.map((entry) => entry.id)).toEqual(['three-months-b', 'three-months']);
  });

  it('orders groups by the first item each one received, as Material does', () => {
    // The 30-day group's first item is older than the week group's first, so it sorts after it
    // even though it also holds a newer item.
    const groups = groupHistory([item('a', 20 * DAY), item('b', 6 * DAY), item('c', 9 * DAY)], NOW);

    expect(groups.map((group) => group.key)).toEqual(['last-week', 'last-30-days']);
  });
});

describe('filterHistory', () => {
  it('matches names case-insensitively, and keeps everything for an empty query', () => {
    const items = [item('1', DAY, 'Invoice batch'), item('2', DAY, 'Vendor list')];

    expect(filterHistory(items, 'INVOICE').map((entry) => entry.id)).toEqual(['1']);
    expect(filterHistory(items, '')).toBe(items);
  });
});
