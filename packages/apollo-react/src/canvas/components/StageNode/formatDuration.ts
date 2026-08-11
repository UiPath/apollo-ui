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
 * `unitDisplay` defaults to `narrow` ("1h, 2m, 3s"). A canvas node has no width to spend on
 * "1 hr, 2 min, 3 sec", and narrow is the wording these surfaces have always shipped. Pass `short`
 * or `long` for a roomier surface. Note that luxon's narrow forms collide for months and minutes —
 * both render as "m" — which is inherent to the locale data, not something this can disambiguate.
 *
 * Returns `''` for a non-positive, non-finite, or sub-second duration — callers skip rendering
 * rather than show "0 sec".
 */
export function formatDurationMs(
  ms: number,
  locale = 'en',
  maxUnits = 3,
  unitDisplay: 'narrow' | 'short' | 'long' = 'narrow'
): string {
  if (!Number.isFinite(ms) || ms <= 0 || maxUnits < 1) {
    return '';
  }

  const parts = Duration.fromMillis(ms)
    .shiftTo(...UNITS)
    .toObject();
  const largest: Record<string, number> = {};

  for (const unit of UNITS) {
    const value = parts[unit] ?? 0;
    // Below one whole unit does not earn a part of its own at this size.
    if (value < 1) {
      continue;
    }
    largest[unit] = value;
    if (Object.keys(largest).length === maxUnits) {
      break;
    }
  }

  const kept = Object.keys(largest);
  if (kept.length === 0) {
    return '';
  }

  // `shiftTo` leaves a fraction on the smallest unit only, and that is exactly the unit truncation
  // keeps last — so round it rather than floor it. 12.669s reads as "13s", which is what these
  // surfaces rendered before this helper existed; flooring silently shortened every duration with
  // a fractional tail. The larger units are already whole.
  const smallest = kept[kept.length - 1] as string;
  largest[smallest] = Math.round(largest[smallest] as number);
  for (const unit of kept.slice(0, -1)) {
    largest[unit] = Math.floor(largest[unit] as number);
  }

  return Duration.fromObject(largest).reconfigure({ locale }).toHuman({ unitDisplay });
}

/**
 * Formats a duration uncapped, in luxon's `long` wording, e.g.
 * `"2 weeks, 19 hours, 8 minutes, 42 seconds"`. For tooltips, where the hidden units fit.
 */
export function formatExactDurationMs(ms: number, locale = 'en'): string {
  return formatDurationMs(ms, locale, UNITS.length, 'long');
}

/**
 * Whether rendering `ms` with `maxUnits` hides any part, so callers can skip a tooltip that would
 * just repeat the text under the cursor. Sub-second precision never counts as hidden: it rounds
 * into the smallest unit shown either way.
 */
export function hasHiddenDurationParts(ms: number, maxUnits = 3): boolean {
  if (!Number.isFinite(ms) || ms <= 0) {
    return false;
  }

  const parts = Duration.fromMillis(ms)
    .shiftTo(...UNITS)
    .toObject();
  let wholeParts = 0;

  for (const unit of UNITS) {
    if ((parts[unit] ?? 0) >= 1) {
      wholeParts++;
    }
  }

  return wholeParts > maxUnits;
}
