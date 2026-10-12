import { describe, expect, it } from 'vitest';
import { toDateValue } from './date-value';

describe('toDateValue', () => {
  it('reads a UTC date-time with milliseconds as that instant', () => {
    expect(toDateValue('2026-09-23T07:00:00.123Z')?.getTime()).toBe(
      Date.UTC(2026, 8, 23, 7, 0, 0, 123)
    );
  });

  it('honours an explicit offset', () => {
    expect(toDateValue('2026-09-23T07:00:00+02:00')?.getTime()).toBe(
      Date.UTC(2026, 8, 23, 5, 0, 0)
    );
  });

  it('reads a date-time without an offset as local time', () => {
    expect(toDateValue('2026-09-23T07:00')?.getTime()).toBe(new Date(2026, 8, 23, 7, 0).getTime());
  });

  it('truncates fractional seconds to milliseconds', () => {
    expect(toDateValue('2026-09-23T07:00:00.1239Z')?.getUTCMilliseconds()).toBe(123);
  });

  it('reads a date-only string as local midnight on that calendar day', () => {
    const date = toDateValue('2026-09-23');
    expect([date?.getFullYear(), date?.getMonth(), date?.getDate(), date?.getHours()]).toEqual([
      2026, 8, 23, 0,
    ]);
  });

  it('returns a valid Date as the same instant', () => {
    const date = new Date(2026, 8, 23, 7, 0, 0, 123);
    expect(toDateValue(date)?.getTime()).toBe(date.getTime());
  });

  it.each([
    ['an empty string', ''],
    ['null', null],
    ['undefined', undefined],
    ['a number', 2026],
    ['a year string', '2026'],
    ['a reduced year', '26'],
    ['a reduced year-month', '202609'],
    ['an epoch-milliseconds string', '1758610800123'],
    ['a locale string', 'Wed Sep 23 2026 00:00:00 GMT-0700 (Pacific Daylight Time)'],
    ['an expression', '=vars.when'],
    ['an out-of-range day', '2026-02-30'],
    ['an Invalid Date', new Date(Number.NaN)],
    ['an object', {}],
  ])('returns undefined for %s', (_label, value) => {
    expect(toDateValue(value)).toBeUndefined();
  });
});
