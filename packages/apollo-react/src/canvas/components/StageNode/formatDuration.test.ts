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

    expect(formatDurationMs(ms)).toBe('2 days, 3 hr, 4 min');
  });

  it('leaves durations with fewer than three units alone', () => {
    expect(formatDurationMs(2 * HOUR + 15 * MINUTE)).toBe('2 hr, 15 min');
  });

  it('skips units that are zero rather than padding to three', () => {
    // No hours between the days and the minutes.
    expect(formatDurationMs(2 * DAY + 4 * MINUTE)).toBe('2 days, 4 min');
  });

  it('honours a custom unit count', () => {
    const ms = 2 * DAY + 3 * HOUR + 4 * MINUTE;

    expect(formatDurationMs(ms, 'en', 1)).toBe('2 days');
  });

  it('truncates on the parts, so the cap survives translation', () => {
    // The regression this replaced: trimming formatted text only worked for unit
    // spellings that happened to look like "2h 3m".
    const ms = 2 * DAY + 3 * HOUR + 4 * MINUTE + 5 * SECOND;

    expect(formatDurationMs(ms, 'de')).toBe('2 Tg., 3 Std. und 4 Min.');
    expect(formatDurationMs(ms, 'ja')).toBe('2 日、3 時間、4 分');
  });

  it('caps long durations that would otherwise run to six units', () => {
    expect(formatDurationMs(196 * DAY + 2 * HOUR + 59 * MINUTE + 36 * SECOND)).toBe(
      '7 mths, 2 hr, 59 min'
    );
    expect(formatDurationMs(10 * DAY)).toBe('1 wk, 3 days');
  });

  it('drops sub-second precision instead of rendering a zero', () => {
    expect(formatDurationMs(1 * MINUTE + 30 * SECOND + 400)).toBe('1 min, 30 sec');
    expect(formatDurationMs(400)).toBe('');
  });

  it('returns nothing for a non-positive or unusable duration', () => {
    expect(formatDurationMs(0)).toBe('');
    expect(formatDurationMs(-1)).toBe('');
    expect(formatDurationMs(Number.NaN)).toBe('');
    expect(formatDurationMs(HOUR, 'en', 0)).toBe('');
  });
});
