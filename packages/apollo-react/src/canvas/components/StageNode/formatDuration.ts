import { Duration } from 'luxon';

/**
 * Largest to smallest. Matches the unit set consumers already normalize to, so the wording and
 * arithmetic stay exactly what the app shows today. Sub-second precision is never shown on a
 * canvas node.
 */
const UNITS = ['years', 'months', 'weeks', 'days', 'hours', 'minutes', 'seconds'] as const;

/**
 * Formats a duration given in milliseconds, keeping only its largest `maxUnits` parts — a stage
 * that ran for months should not spell out every unit down to seconds.
 *
 * Truncation happens on the parts, before they are ever turned into text, so it holds in every
 * locale. (Formatting first and trimming the string back does not: "2 hr, 59 min" and
 * "2 Std., 59 Min." share no unit spelling.) The conversion and wording are luxon's.
 *
 * Returns `''` for a non-positive, non-finite, or sub-second duration — callers skip rendering
 * rather than show "0 sec".
 */
export function formatDurationMs(ms: number, locale = 'en', maxUnits = 3): string {
  if (!Number.isFinite(ms) || ms <= 0 || maxUnits < 1) {
    return '';
  }

  const parts = Duration.fromMillis(ms)
    .shiftTo(...UNITS)
    .toObject();
  const largest: Record<string, number> = {};

  for (const unit of UNITS) {
    // Seconds come back fractional; a partial unit is never worth a decimal here.
    const value = Math.floor(parts[unit] ?? 0);
    if (value <= 0) {
      continue;
    }
    largest[unit] = value;
    if (Object.keys(largest).length === maxUnits) {
      break;
    }
  }

  if (Object.keys(largest).length === 0) {
    return '';
  }

  return Duration.fromObject(largest).reconfigure({ locale }).toHuman({ unitDisplay: 'short' });
}
