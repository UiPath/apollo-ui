import { describe, expect, it } from 'vitest';
import {
  dateToZonedWallClock,
  filterZoneGroups,
  formatOffset,
  getZoneGroups,
  isValidTimeZone,
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
