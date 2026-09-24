/**
 * Timezone helpers for the date-time picker. Offsets are computed rather than tabulated, so they
 * follow daylight saving without a table to maintain.
 */

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
 * A zone's UTC offset in minutes at an instant: the instant formatted in the zone, read back as
 * though it were UTC, minus the real instant.
 */
export function zoneOffsetMinutes(zone: string, at: Date = new Date()) {
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
      });
      formatters.set(zone, formatter);
    }
    const parts = formatter.formatToParts(at);
    const get = (type: Intl.DateTimeFormatPartTypes) =>
      Number(parts.find((part) => part.type === type)?.value);
    const asUTC = Date.UTC(
      get('year'),
      get('month') - 1,
      get('day'),
      get('hour') % 24,
      get('minute'),
      get('second')
    );
    // Whole seconds only: the instant's milliseconds are not in the formatted parts.
    return Math.round((asUTC - Math.floor(at.getTime() / 1000) * 1000) / 60000);
  } catch {
    return 0;
  }
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
 * summer. The offset is looked up twice because near a DST change the offset that applies
 * depends on the instant being computed.
 */
export function zonedWallClockToDate(
  { year, month, day, hours, minutes }: WallClock,
  zone: string
) {
  const naive = Date.UTC(year, month, day, hours, minutes);
  const firstPass = zoneOffsetMinutes(zone, new Date(naive));
  const secondPass = zoneOffsetMinutes(zone, new Date(naive - firstPass * 60000));
  return new Date(naive - secondPass * 60000);
}

/** The wall-clock parts of an instant read in `zone`: the inverse of `zonedWallClockToDate`. */
export function dateToZonedWallClock(date: Date, zone: string): WallClock {
  const shifted = new Date(date.getTime() + zoneOffsetMinutes(zone, date) * 60000);
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
  const q = query.trim().toLowerCase();
  const groups = getZoneGroups();
  if (!q) return groups;
  return groups
    .map(({ label, zones }) => ({
      label,
      zones: zones.filter(
        (zone) =>
          zoneCity(zone).toLowerCase().includes(q) ||
          zoneSearchText(zone).toLowerCase().includes(q) ||
          label.toLowerCase().includes(q) ||
          offsetLabel(zone).toLowerCase().includes(q)
      ),
    }))
    .filter(({ zones }) => zones.length > 0);
}
