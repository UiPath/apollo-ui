import { describe, expect, it } from 'vitest';
import { formatDuration } from './formatDuration';

describe('formatDuration', () => {
  it('keeps only the three largest comma-separated units', () => {
    expect(formatDuration('6m, 2w, 2d, 2h, 59m, 36s')).toBe('6m, 2w, 2d');
  });

  it('preserves a duration prefix and whitespace separators', () => {
    expect(formatDuration('Duration: 6m 2w 2d 2h 59m 36s')).toBe('Duration: 6m 2w 2d');
  });

  it('leaves durations with three or fewer units unchanged', () => {
    expect(formatDuration('2h 15m')).toBe('2h 15m');
  });

  it('leaves unrecognized host-provided text unchanged', () => {
    expect(formatDuration('Still running')).toBe('Still running');
  });
});
