import {
  type DateTime,
  type DateTimeUnit,
  type Duration,
  Interval,
} from "luxon";
import { niceDurationNumbers, niceNumbers } from "@/lib/charts-core";

export interface NumericBin {
  start: number;
  end: number;
}

function findHighestUnit(duration: Duration): DateTimeUnit {
  if (duration.years > 0) return "year";
  if (duration.months > 0) return "month";
  if (duration.days > 0) return "day";
  if (duration.hours > 0) return "hour";
  if (duration.minutes > 0) return "minute";
  if (duration.seconds > 0) return "second";
  return "millisecond";
}

function createDatetimeBins({
  start,
  end,
  highestUnit,
  bestBinSize,
}: {
  start: DateTime;
  end: DateTime;
  highestUnit: DateTimeUnit;
  bestBinSize: Duration;
}): Interval[] {
  const bins: Interval[] = [];

  let currentStart = start;
  let currentEnd = currentStart.startOf(highestUnit).plus(bestBinSize);

  while (currentEnd < end) {
    bins.push(Interval.fromDateTimes(currentStart, currentEnd));
    currentStart = currentEnd;
    currentEnd = currentStart.plus(bestBinSize);
  }
  bins.push(Interval.fromDateTimes(currentStart, end));
  return bins;
}

export function calculateDatetimeBins({
  min,
  max,
}: {
  min: DateTime;
  max: DateTime;
}): Interval[] {
  if (min.equals(max)) {
    return [Interval.fromDateTimes(min, max)];
  }

  const bestBinSize = niceDurationNumbers({ min, max });
  const highestUnit = findHighestUnit(bestBinSize);

  return createDatetimeBins({
    start: min,
    end: max,
    highestUnit,
    bestBinSize,
  });
}

export function calculateNumericBins({
  min,
  max,
}: {
  min: number;
  max: number;
}): NumericBin[] {
  if (min === max) {
    return [{ start: min, end: max }];
  }

  const { min: niceMin, binSize } = niceNumbers({ min, max });
  const binCount = Math.ceil((max - niceMin) / binSize);

  return Array.from({ length: binCount }, (_, idx) => ({
    start: niceMin + binSize * idx,
    end: niceMin + binSize * (idx + 1),
  }));
}

export function findBinCutoffPoints(
  bins: Array<Interval | NumericBin>,
): number[] {
  return bins
    .filter((_, idx) => idx < bins.length - 1)
    .map(({ end }) => (typeof end === "number" ? end : end.toMillis()));
}
