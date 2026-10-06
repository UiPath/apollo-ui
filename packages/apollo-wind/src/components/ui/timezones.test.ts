import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  dateToZonedWallClock,
  filterZoneGroups,
  formatOffset,
  getZoneGroups,
  isValidTimeZone,
  sameZone,
  zoneCity,
  zonedWallClockToDate,
  zoneOffsetMinutes,
} from './timezones';

describe('timezones', () => {
  it('reads offsets with daylight saving', () => {
    expect(zoneOffsetMinutes('Europe/Bucharest', new Date(Date.UTC(2024, 6, 1)))).toBe(180);
    expect(zoneOffsetMinutes('Europe/Bucharest', new Date(Date.UTC(2024, 0, 1)))).toBe(120);
    expect(zoneOffsetMinutes('Asia/Kolkata', new Date(Date.UTC(2024, 0, 1)))).toBe(330);
    expect(zoneOffsetMinutes('UTC')).toBe(0);
  });

  it('formats offsets, with minutes only when present', () => {
    expect(formatOffset(0)).toBe('GMT');
    expect(formatOffset(180)).toBe('GMT+3');
    expect(formatOffset(-300)).toBe('GMT-5');
    expect(formatOffset(330)).toBe('GMT+5:30');
  });

  it('converts a wall clock in a zone to the instant and back', () => {
    const wall = { year: 2024, month: 5, day: 15, hours: 14, minutes: 0 };
    const instant = zonedWallClockToDate(wall, 'Europe/Bucharest');
    expect(instant.toISOString()).toBe('2024-06-15T11:00:00.000Z');
    expect(dateToZonedWallClock(instant, 'Europe/Bucharest')).toEqual(wall);
  });

  it('resolves a wall clock just after a DST change', () => {
    // Bucharest moved from GMT+2 to GMT+3 at 03:00 local on 31 March 2024.
    const instant = zonedWallClockToDate(
      { year: 2024, month: 2, day: 31, hours: 4, minutes: 30 },
      'Europe/Bucharest'
    );
    expect(instant.toISOString()).toBe('2024-03-31T01:30:00.000Z');
  });

  it('names cities, including renamed zones', () => {
    expect(zoneCity('America/New_York')).toBe('New York');
    expect(zoneCity('Asia/Calcutta')).toBe('Kolkata');
    expect(zoneCity('UTC')).toBe('UTC');
  });

  it('groups zones with UTC first', () => {
    const [first] = getZoneGroups();
    expect(first.label).toBe('UTC');
    expect(first.zones[0]).toBe('UTC');
  });

  it('filters by city, id and offset', () => {
    const offset = (zone: string) =>
      zone === 'Asia/Kolkata' || zone === 'Asia/Calcutta' ? 'GMT+5:30' : '';
    const cities = (query: string) =>
      filterZoneGroups(query, offset).flatMap(({ zones }) => zones.map(zoneCity));
    expect(cities('bucharest')).toEqual(['Bucharest']);
    expect(cities('europe/buch')).toEqual(['Bucharest']);
    expect(cities('+5:30')).toContain('Kolkata');
    expect(cities('kolkata')).toContain('Kolkata');
    expect(cities('zzzz')).toEqual([]);
  });
});

describe('years 0 to 99', () => {
  it('converts a wall clock in year 50 to an instant in year 50', () => {
    const instant = zonedWallClockToDate(
      { year: 50, month: 5, day: 15, hours: 14, minutes: 0 },
      'UTC'
    );
    expect(instant.getUTCFullYear()).toBe(50);
    expect(dateToZonedWallClock(instant, 'UTC')).toMatchObject({ year: 50, month: 5, day: 15 });
  });
});

describe('years before the common era', () => {
  it('reads offsets and converts wall clocks in year -1', () => {
    const instant = new Date(0);
    instant.setUTCFullYear(-1, 5, 15);
    instant.setUTCHours(14, 0, 0, 0);
    expect(zoneOffsetMinutes('UTC', instant)).toBe(0);

    const back = zonedWallClockToDate(
      { year: -1, month: 5, day: 15, hours: 14, minutes: 0 },
      'UTC'
    );
    expect(back.getTime()).toBe(instant.getTime());
  });
});

describe('offset search', () => {
  it('reads offset labels only for a query that could be an offset', () => {
    const offsetLabel = vi.fn(() => 'GMT+9');
    filterZoneGroups('tokyo', offsetLabel);
    expect(offsetLabel).not.toHaveBeenCalled();

    const groups = filterZoneGroups('+9', offsetLabel);
    expect(offsetLabel).toHaveBeenCalled();
    expect(groups.length).toBeGreaterThan(0);
  });
});

describe('legacy zone names in search', () => {
  it('matches the legacy spelling of a zone reported under its current name', () => {
    const zones = (query: string) =>
      filterZoneGroups(query, () => '').flatMap((group) => group.zones);
    const kolkata = zones('').find((zone) => zone === 'Asia/Kolkata' || zone === 'Asia/Calcutta');
    expect(kolkata).toBeDefined();
    expect(zones('calcutta')).toContain(kolkata);
    expect(zones('kolkata')).toContain(kolkata);
  });
});

describe('wall clocks around daylight saving changes', () => {
  it('moves a time inside a spring-forward gap forward by the gap', () => {
    // New York jumped from 02:00 to 03:00 on 10 March 2024, so 02:30 did not exist.
    const instant = zonedWallClockToDate(
      { year: 2024, month: 2, day: 10, hours: 2, minutes: 30 },
      'America/New_York'
    );
    expect(instant.toISOString()).toBe('2024-03-10T07:30:00.000Z');
    expect(dateToZonedWallClock(instant, 'America/New_York')).toMatchObject({
      hours: 3,
      minutes: 30,
    });
  });

  it('keeps a repeated fall-back time on the picked wall clock', () => {
    // 01:30 happened twice in New York on 3 November 2024.
    const wall = { year: 2024, month: 10, day: 3, hours: 1, minutes: 30 };
    const instant = zonedWallClockToDate(wall, 'America/New_York');
    expect(dateToZonedWallClock(instant, 'America/New_York')).toEqual(wall);
  });

  it('recognises valid and invalid zone ids', () => {
    expect(isValidTimeZone('Europe/Bucharest')).toBe(true);
    expect(isValidTimeZone('UTC')).toBe(true);
    expect(isValidTimeZone('Europe/Bucharestt')).toBe(false);
  });
});

describe('offsets with seconds', () => {
  it('converts 12:00 in Paris in 1900 at its GMT+0:09:21 offset', () => {
    const instant = zonedWallClockToDate(
      { year: 1900, month: 5, day: 15, hours: 12, minutes: 0 },
      'Europe/Paris'
    );
    expect(instant.toISOString()).toBe('1900-06-15T11:50:39.000Z');
    expect(dateToZonedWallClock(instant, 'Europe/Paris')).toMatchObject({ hours: 12, minutes: 0 });
    expect(zoneOffsetMinutes('Europe/Paris', instant)).toBe(9);
  });
});

describe('sameZone', () => {
  it('matches either spelling of a renamed zone', () => {
    expect(sameZone('Asia/Kolkata', 'Asia/Calcutta')).toBe(true);
    expect(sameZone('Asia/Calcutta', 'Asia/Kolkata')).toBe(true);
    expect(sameZone('Europe/Kyiv', 'Europe/Kiev')).toBe(true);
    expect(sameZone('Europe/Bucharest', 'Europe/Bucharest')).toBe(true);
  });

  it('matches any alias the runtime resolves', () => {
    expect(sameZone('US/Eastern', 'America/New_York')).toBe(true);
    expect(sameZone('us/eastern', 'America/New_York')).toBe(true);
    expect(sameZone('Etc/UTC', 'UTC')).toBe(true);
    expect(sameZone('US/Eastern', 'America/Chicago')).toBe(false);
  });

  it('compares an unknown id only with itself', () => {
    expect(sameZone('Not/AZone', 'Not/AZone')).toBe(true);
    expect(sameZone('Not/AZone', 'UTC')).toBe(false);
  });

  it('keeps different zones apart', () => {
    expect(sameZone('Asia/Kolkata', 'Asia/Tokyo')).toBe(false);
    expect(sameZone('Europe/Kiev', 'Europe/Bucharest')).toBe(false);
  });
});

describe('sameZone where Intl keeps aliases as given', () => {
  // Runtimes following the canonical-timezone proposal report the id as given, so
  // `resolvedOptions()` no longer resolves aliases there.
  async function loadWithVerbatimIntl() {
    const RealFormat = Intl.DateTimeFormat;
    vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(((
      locale?: string,
      options?: Intl.DateTimeFormatOptions
    ) => {
      const format = new RealFormat(locale, options);
      const resolved = format.resolvedOptions();
      format.resolvedOptions = () => ({ ...resolved, timeZone: options?.timeZone ?? 'UTC' });
      return format;
    }) as unknown as typeof Intl.DateTimeFormat);
    vi.resetModules();
    return import('./timezones');
  }

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('still matches renamed zones through the table', async () => {
    const zones = await loadWithVerbatimIntl();
    expect(zones.sameZone('Asia/Kolkata', 'Asia/Calcutta')).toBe(true);
    expect(zones.sameZone('US/Eastern', 'America/New_York')).toBe(false);
  });

  it('resolves other aliases through Temporal when the runtime has it', async () => {
    const primary: Record<string, string> = { 'US/Eastern': 'America/New_York' };
    class ZonedDateTime {
      zone: string;
      constructor(_epoch: bigint, zone: string) {
        this.zone = primary[zone] ?? zone;
      }
      equals(other: ZonedDateTime) {
        return other.zone === this.zone;
      }
    }
    vi.stubGlobal('Temporal', { ZonedDateTime });
    const zones = await loadWithVerbatimIntl();
    expect(zones.sameZone('US/Eastern', 'America/New_York')).toBe(true);
    expect(zones.sameZone('US/Eastern', 'America/Chicago')).toBe(false);
  });
});

describe('offset search with a Unicode minus', () => {
  it('reads "−5" as the hyphen in the offset labels', () => {
    const offsetLabel = (zone: string) => (zone === 'America/Chicago' ? 'GMT-5' : 'GMT+1');
    const zones = (query: string) =>
      filterZoneGroups(query, offsetLabel).flatMap((group) => group.zones);
    expect(zones('\u22125')).toContain('America/Chicago');
    expect(zones('gmt\u22125')).toContain('America/Chicago');
    expect(zones('\u22125')).toEqual(zones('-5'));
  });
});
