import { describe, expect, it } from 'vitest';
import { formatDurationMs } from './formatDuration';

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe('formatDurationMs', () => {
  it('keeps only the three largest units', () => {
    // 2 days, 3 hr, 4 min, 5 sec -> the seconds are dropped.
    const ms = 2 * DAY + 3 * HOUR + 4 * MINUTE + 5 * SECOND;

    expect(formatDurationMs(ms)).toBe('2d, 3h, 4m');
  });

  it('leaves durations with fewer than three units alone', () => {
    expect(formatDurationMs(2 * HOUR + 15 * MINUTE)).toBe('2h, 15m');
  });

  it('skips units that are zero rather than padding to three', () => {
    // No hours between the days and the minutes.
    expect(formatDurationMs(2 * DAY + 4 * MINUTE)).toBe('2d, 4m');
  });

  it('honours a custom unit count', () => {
    const ms = 2 * DAY + 3 * HOUR + 4 * MINUTE;

    expect(formatDurationMs(ms, 'en', 1)).toBe('2d');
  });

  it('keeps the cap in other locales (de, ja)', () => {
    // The regression this replaced: trimming formatted text only worked for unit
    // spellings that happened to look like "2h 3m".
    const ms = 2 * DAY + 3 * HOUR + 4 * MINUTE + 5 * SECOND;

    expect(formatDurationMs(ms, 'de')).toBe('2 T, 3h und 4 Min.');
    // Narrow keeps Latin abbreviations in ja and only localises the separator. That is CLDR's
    // narrow data, not a bug here — but it is thinner than the "2時間 1分" a consumer can hand-roll,
    // so pass `short` for surfaces where ja readability matters more than width.
    expect(formatDurationMs(ms, 'ja')).toBe('2d、3h、4m');
    expect(formatDurationMs(ms, 'ja', 3, 'short')).toBe('2 日、3 時間、4 分');
  });

  it('caps long durations that would otherwise run to six units', () => {
    expect(formatDurationMs(196 * DAY + 2 * HOUR + 59 * MINUTE + 36 * SECOND)).toBe('7m, 2h, 59m');
    expect(formatDurationMs(10 * DAY)).toBe('1w, 3d');
  });

  it('rounds the smallest kept unit instead of flooring it', () => {
    // The unit truncation keeps last is the one carrying the fraction, so it has to round:
    // flooring silently shortened every duration with a fractional tail.
    expect(formatDurationMs(12_669)).toBe('13s');
  });

  it('rounds that unit in place, so a rounded-up value does not carry', () => {
    // 59.6s becomes "60s" rather than "1m". Deliberate: this matches what consumers have always
    // rendered, and rounding the total instead would carry across units and change durations that
    // are not ambiguous at all (2h 59m 36s would collapse from "2h, 59m" to "3h").
    expect(formatDurationMs(2 * HOUR + 59.6 * SECOND)).toBe('2h, 60s');
  });

  it('drops sub-second precision instead of rendering a zero', () => {
    expect(formatDurationMs(1 * MINUTE + 30 * SECOND + 400)).toBe('1m, 30s');
    expect(formatDurationMs(400)).toBe('');
  });

  it('returns nothing for a non-positive or unusable duration', () => {
    expect(formatDurationMs(0)).toBe('');
    expect(formatDurationMs(-1)).toBe('');
    expect(formatDurationMs(Number.NaN)).toBe('');
    expect(formatDurationMs(HOUR, 'en', 0)).toBe('');
  });
});
