import { describe, expect, it } from 'vitest';
import {
  dateToZonedWallClock,
  filterZoneGroups,
  formatOffset,
  getZoneGroups,
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
