/**
 * Timezone helpers for the date-time picker. Offsets are computed rather than tabulated, so they
 * follow daylight saving without a table to maintain.
 */

import { utcTime } from './picker-dates';

// Zones some runtimes still report under their pre-rename id. The id is kept as the runtime
// gives it (every `Intl` call is made with it); the label and search use the current name.
const RENAMED: Record<string, string> = {
  'Asia/Calcutta': 'Asia/Kolkata',
  'Asia/Saigon': 'Asia/Ho_Chi_Minh',
  'Asia/Rangoon': 'Asia/Yangon',
  'Asia/Katmandu': 'Asia/Kathmandu',
  'Europe/Kiev': 'Europe/Kyiv',
  'Atlantic/Faeroe': 'Atlantic/Faroe',
  'Pacific/Ponape': 'Pacific/Pohnpei',
  'America/Buenos_Aires': 'America/Argentina/Buenos_Aires',
};

const FALLBACK_ZONES = [
  'America/Los_Angeles',
  'America/Denver',
  'America/Chicago',
  'America/New_York',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Bucharest',
  'Africa/Johannesburg',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
];

const REGION_ORDER = [
  'UTC',
  'America',
  'Europe',
  'Asia',
  'Africa',
  'Australia',
  'Pacific',
  'Atlantic',
  'Indian',
  'Antarctica',
  'Arctic',
];

/** "Europe/Bucharest" -> "Bucharest"; renamed zones show their current city. */
export function zoneCity(zone: string) {
  if (zone === 'UTC') return 'UTC';
  return (RENAMED[zone] ?? zone).split('/').pop()?.replace(/_/g, ' ') ?? zone;
}

// Current name -> legacy id, so a runtime that reports `Asia/Kolkata` still matches "calcutta".
const LEGACY = Object.fromEntries(
  Object.entries(RENAMED).map(([legacy, current]) => [current, legacy])
);

const canonicalZones = new Map<string, string>();

/**
 * One spelling per zone, for comparing ids. Runtimes that canonicalise `resolvedOptions()` turn
 * any alias (`US/Eastern`, `Etc/UTC`, any casing) into the id they list, which the rename table
 * then maps to the current name, so both spellings of a renamed zone meet too. Runtimes that
 * return the id as given still match the renamed zones through the table.
 */
function canonicalZone(zone: string) {
  let canonical = canonicalZones.get(zone);
  if (canonical === undefined) {
    let resolved = zone;
    try {
      resolved = new Intl.DateTimeFormat('en-US', { timeZone: zone }).resolvedOptions().timeZone;
    } catch {
      // Not a zone this runtime knows; it can still equal itself.
    }
    canonical = RENAMED[resolved] ?? resolved;
    canonicalZones.set(zone, canonical);
  }
  return canonical;
}

type TemporalLike = {
  ZonedDateTime: new (
    epochNanoseconds: bigint,
    timeZone: string
  ) => { equals: (other: unknown) => boolean };
};

const zonePairs = new Map<string, boolean>();

/**
 * Whether two zone ids name the same zone under any of their aliases, so a value of
 * `Asia/Kolkata` matches the `Asia/Calcutta` a runtime lists, and `US/Eastern` matches
 * `America/New_York`. Where `Intl` keeps aliases as given, Temporal's zone equality, which
 * resolves every alias, settles the pairs the table doesn't cover.
 */
export function sameZone(a: string, b: string) {
  if (a === b || canonicalZone(a) === canonicalZone(b)) return true;
  const { Temporal } = globalThis as typeof globalThis & { Temporal?: TemporalLike };
  if (!Temporal) return false;
  const key = `${a}\n${b}`;
  let same = zonePairs.get(key);
  if (same === undefined) {
    try {
      // `BigInt()` rather than a literal, so engines that predate BigInt still parse the module;
      // only those with Temporal, and so BigInt, reach here.
      const epoch = BigInt(0);
      same = new Temporal.ZonedDateTime(epoch, a).equals(new Temporal.ZonedDateTime(epoch, b));
    } catch {
      same = false;
    }
    zonePairs.set(key, same);
  }
  return same;
}

// Both spellings, whichever one the runtime reports.
function zoneSearchText(zone: string) {
  const other = RENAMED[zone] ?? LEGACY[zone];
  return other ? `${zone} ${other}` : zone;
}

function regionOf(zone: string) {
  if (zone === 'UTC' || zone.startsWith('Etc/')) return 'UTC';
  return zone.split('/')[0].replace(/_/g, ' ');
}

let zoneGroups: { label: string; zones: string[] }[] | undefined;

/** Every zone the runtime knows, grouped by region with common regions first. Built once. */
export function getZoneGroups() {
  if (zoneGroups) return zoneGroups;
  // Not in every engine, nor in the TypeScript lib this package targets. Older engines get a
  // short list, which search still works over.
  const { supportedValuesOf } = Intl as typeof Intl & {
    supportedValuesOf?: (key: 'timeZone') => string[];
  };
  let supported: string[] = FALLBACK_ZONES;
  try {
    supported = supportedValuesOf?.('timeZone') ?? FALLBACK_ZONES;
  } catch {
    // Keep the fallback.
  }
  // `supportedValuesOf` omits UTC, the zone a scheduling field most often wants.
  const zones = ['UTC', ...supported.filter((zone) => zone !== 'UTC')];
  const byRegion = new Map<string, string[]>();
  for (const zone of zones) {
    const region = regionOf(zone);
    byRegion.set(region, [...(byRegion.get(region) ?? []), zone]);
  }
  const ordered = [
    ...REGION_ORDER.filter((region) => byRegion.has(region)),
    ...[...byRegion.keys()].filter((region) => !REGION_ORDER.includes(region)).sort(),
  ];
  zoneGroups = ordered.map((label) => ({
    label,
    zones: (byRegion.get(label) ?? []).sort((a, b) =>
      a === 'UTC' ? -1 : b === 'UTC' ? 1 : zoneCity(a).localeCompare(zoneCity(b))
    ),
  }));
  return zoneGroups;
}

/** The viewer's own zone, as the browser reports it. */
export function localZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

const formatters = new Map<string, Intl.DateTimeFormat>();

/**
 * A zone's exact UTC offset in milliseconds at an instant: the instant formatted in the zone, read
 * back as though it were UTC, minus the real instant. Exact to the second, since historical local
 * mean time offsets have them (Paris was GMT+0:09:21 in 1900).
 */
export function zoneOffsetMs(zone: string, at: Date = new Date()) {
  try {
    let formatter = formatters.get(zone);
    if (!formatter) {
      formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: zone,
        hourCycle: 'h23',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        era: 'short',
      });
      formatters.set(zone, formatter);
    }
    const parts = formatter.formatToParts(at);
    const get = (type: Intl.DateTimeFormatPartTypes) =>
      Number(parts.find((part) => part.type === type)?.value);
    // Years before the common era come back as positive years with a BC era. Astronomical
    // numbering, the one Date uses, puts 1 BC at year 0.
    const era = parts.find((part) => part.type === 'era')?.value;
    const year = era === 'BC' ? 1 - get('year') : get('year');
    const asUTC = utcTime(
      year,
      get('month') - 1,
      get('day'),
      get('hour') % 24,
      get('minute'),
      get('second')
    );
    // Whole seconds only: the instant's milliseconds are not in the formatted parts.
    return asUTC - Math.floor(at.getTime() / 1000) * 1000;
  } catch {
    return 0;
  }
}

/**
 * A zone's UTC offset at an instant, rounded to the minute for its label. Conversions use
 * `zoneOffsetMs`, so an offset with seconds still lands on the wall clock picked.
 */
export function zoneOffsetMinutes(zone: string, at: Date = new Date()) {
  return Math.round(zoneOffsetMs(zone, at) / 60000);
}

/** "GMT+3", "GMT-5:30" or "GMT". Minutes only when the offset has them. */
export function formatOffset(minutes: number) {
  if (minutes === 0) return 'GMT';
  const sign = minutes > 0 ? '+' : '-';
  const abs = Math.abs(minutes);
  const mins = abs % 60;
  return `GMT${sign}${Math.floor(abs / 60)}${mins ? `:${String(mins).padStart(2, '0')}` : ''}`;
}

export interface WallClock {
  year: number;
  month: number;
  day: number;
  hours: number;
  minutes: number;
}

/**
 * The instant for a wall-clock time read in `zone`: 14:00 in Europe/Bucharest is 11:00Z in
 * summer. Near a DST change the offset that applies depends on the instant being computed, so
 * both candidate offsets are tried and the one that reads back as the same wall clock wins.
 *
 * A time that does not exist in the zone (02:30 on a spring-forward night in New York, where
 * clocks jump from 02:00 to 03:00) matches neither. It moves forward by the gap, to 03:30, the
 * way a JavaScript Date does, rather than back to a time before the one picked.
 */
export function zonedWallClockToDate(wall: WallClock, zone: string) {
  const { year, month, day, hours, minutes } = wall;
  const naive = utcTime(year, month, day, hours, minutes);
  const firstPass = zoneOffsetMs(zone, new Date(naive));
  const secondPass = zoneOffsetMs(zone, new Date(naive - firstPass));
  const candidates = [naive - secondPass, naive - firstPass];
  const matches = (instant: number) => {
    const read = dateToZonedWallClock(new Date(instant), zone);
    return read.day === day && read.hours === hours && read.minutes === minutes;
  };
  return new Date(candidates.find(matches) ?? Math.max(...candidates));
}

/** Whether the runtime knows `zone` as an IANA timezone. */
export function isValidTimeZone(zone: string) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

/** The wall-clock parts of an instant read in `zone`: the inverse of `zonedWallClockToDate`. */
export function dateToZonedWallClock(date: Date, zone: string): WallClock {
  const shifted = new Date(date.getTime() + zoneOffsetMs(zone, date));
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
    hours: shifted.getUTCHours(),
    minutes: shifted.getUTCMinutes(),
  };
}

/**
 * Zone groups filtered by a query over the city, the id (either spelling), the region and the
 * offset label, so "bucharest", "europe/buch" and "+5:30" all match.
 */
export function filterZoneGroups(query: string, offsetLabel: (zone: string) => string) {
  // A typed Unicode minus (−) reads as the hyphen the offset labels use, so "−5" finds GMT-5.
  const q = query
    .trim()
    .toLowerCase()
    .replace(/\u2212/g, '-');
  const groups = getZoneGroups();
  if (!q) return groups;
  // Offset labels are only worth formatting for a query that could be one: a digit, a sign or
  // "gmt". A city or region search never reads them.
  const offsetQuery = /[\d+-]|^gmt/.test(q);
  return groups
    .map(({ label, zones }) => ({
      label,
      zones: zones.filter(
        (zone) =>
          zoneCity(zone).toLowerCase().includes(q) ||
          zoneSearchText(zone).toLowerCase().includes(q) ||
          label.toLowerCase().includes(q) ||
          (offsetQuery && offsetLabel(zone).toLowerCase().includes(q))
      ),
    }))
    .filter(({ zones }) => zones.length > 0);
}
