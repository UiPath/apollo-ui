import type { DateTime } from "luxon";
import { Duration, Interval } from "luxon";

import {
  DATE_TIME_NUMBER_CATEGORIES,
  MAX_BINS,
  TARGET_BINS,
} from "./constants";

export function niceDurationNumbers({
  min,
  max,
}: {
  min: DateTime;
  max: DateTime;
}) {
  let bestBinSize = Duration.fromObject({ years: 999999999 });
  const interval = Interval.fromDateTimes(min, max);
  let bestBinDiff = Number.MAX_SAFE_INTEGER;

  for (const category of DATE_TIME_NUMBER_CATEGORIES) {
    const bins = interval.splitBy(category);
    const binCount = bins.length;
    const diffWithTarget = Math.abs(binCount - TARGET_BINS);

    const isMuchLarger = binCount > TARGET_BINS * 10;
    const isInitial = bestBinDiff === Number.MAX_SAFE_INTEGER;
    if (isMuchLarger && !isInitial) {
      break;
    }

    if (diffWithTarget < bestBinDiff && binCount <= MAX_BINS) {
      bestBinDiff = diffWithTarget;
      bestBinSize = category;
    }
  }

  return bestBinSize;
}
