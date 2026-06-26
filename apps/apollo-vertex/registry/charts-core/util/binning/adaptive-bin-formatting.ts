import type { Interval } from "luxon";
import { formatDate, type OverrideTimeOptions } from "../format/format-date";

function getDateTimeFormat(
  binRange: Interval,
  chartRange: Interval,
): OverrideTimeOptions {
  const { start, end } = binRange;
  const { start: chartStart, end: chartEnd } = chartRange;
  const hasMultipleDays = !chartStart.hasSame(chartEnd, "day");

  const diff = end.diff(start);

  const isShowingTime = diff.as("day") < 1;

  if (isShowingTime && hasMultipleDays) {
    return {
      month: "short",
      day: "numeric",
    };
  }

  if (isShowingTime) {
    return {
      timeStyle: "short",
      hourCycle: "h23",
    };
  }

  const isShowingMonthDay = diff.as("month") < 1;
  if (isShowingMonthDay) {
    return {
      month: "short",
      day: "numeric",
    };
  }

  return {
    month: "short",
    year: "numeric",
  };
}

export const adaptiveBinFormatting = (
  locale: Intl.LocalesArgument,
  bin: Interval,
  chartRange: Interval,
) => {
  const value = bin.start;
  const formatSettings = getDateTimeFormat(bin, chartRange);

  return formatDate(locale, value, formatSettings);
};
