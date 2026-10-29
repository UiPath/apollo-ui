import { de } from 'react-day-picker/locale/de';
import { enUS } from 'react-day-picker/locale/en-US';
import { ja } from 'react-day-picker/locale/ja';
import { zhCN } from 'react-day-picker/locale/zh-CN';
import { describe, expect, it } from 'vitest';
import {
  formatDateTime,
  formatMediumDate,
  getLoadedDateLocale,
  loadDateLocale,
  resolveUse12Hour,
} from './date-locale';

const date = new Date(2024, 5, 15, 14, 30);

describe('formatDateTime', () => {
  it('keeps the English text when no locale is given', () => {
    expect(formatDateTime(date, undefined, undefined)).toBe('June 15th, 2024 at 14:30');
    expect(formatDateTime(date, undefined, true)).toBe('June 15th, 2024 at 02:30 PM');
  });

  it("joins the date and time the language's way", () => {
    expect(formatDateTime(date, de, undefined)).toBe('15. Juni 2024 um 14:30');
    expect(formatDateTime(date, ja, undefined)).toBe('2024年6月15日 14:30');
  });

  it("uses the locale's own clock and word order", () => {
    expect(formatDateTime(date, enUS, undefined)).toBe('June 15th, 2024 at 2:30 PM');
    expect(formatDateTime(date, zhCN, undefined)).toBe('2024年6月15日 下午 2:30');
  });

  it('follows an explicit hour cycle over the locale', () => {
    expect(formatDateTime(date, enUS, false)).toBe('June 15th, 2024 at 14:30');
    expect(formatDateTime(date, de, true)).toBe('15. Juni 2024 um 02:30 nachm.');
  });
});

describe('formatMediumDate', () => {
  it('formats in the locale', () => {
    expect(formatMediumDate(date)).toBe('Jun 15, 2024');
    expect(formatMediumDate(date, de)).toBe('15. Juni 2024');
  });
});

describe('resolveUse12Hour', () => {
  it('prefers the explicit choice, then the locale, then 24-hour', () => {
    expect(resolveUse12Hour(true, de)).toBe(true);
    expect(resolveUse12Hour(undefined, enUS)).toBe(true);
    expect(resolveUse12Hour(undefined, de)).toBe(false);
    expect(resolveUse12Hour(undefined, undefined)).toBe(false);
  });
});

describe('loadDateLocale', () => {
  it('loads a platform language and caches it', async () => {
    expect(await loadDateLocale('de')).toBe(de);
    expect(getLoadedDateLocale('de')).toBe(de);
  });

  it('matches regional and underscored tags, falling back to the base language', async () => {
    expect((await loadDateLocale('zh_TW'))?.code).toBe('zh-TW');
    expect((await loadDateLocale('pt-BR'))?.code).toBe('pt-BR');
    expect((await loadDateLocale('es-MX'))?.code).toBe('es');
  });

  it('resolves an unknown language to undefined, which renders English', async () => {
    expect(await loadDateLocale('xx')).toBeUndefined();
    expect(getLoadedDateLocale('xx')).toBeUndefined();
  });

  it('does not take an inherited object key for a language', async () => {
    for (const tag of ['constructor', '__proto__', 'toString', 'hasOwnProperty-x']) {
      expect(await loadDateLocale(tag)).toBeUndefined();
      expect(getLoadedDateLocale(tag)).toBeUndefined();
    }
  });
});
