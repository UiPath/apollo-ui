const DURATION_UNIT_PATTERN = /\d+(?:[.,]\d+)?\s*(?:ms|mo|w|d|h|m|s)\b/gi;

/**
 * Limits an already formatted, largest-to-smallest duration to its largest units.
 * Prefixes and separators are preserved (for example, "Duration: 6m, 2w, 2d").
 */
export function formatDuration(duration: string, maxUnits = 3): string {
  if (maxUnits < 1) {
    return '';
  }

  const unitMatches = [...duration.matchAll(DURATION_UNIT_PATTERN)];
  if (unitMatches.length <= maxUnits) {
    return duration;
  }

  const lastVisibleUnit = unitMatches[maxUnits - 1];
  if (!lastVisibleUnit) {
    return duration;
  }

  return duration.slice(0, (lastVisibleUnit.index ?? 0) + lastVisibleUnit[0].length).trimEnd();
}
