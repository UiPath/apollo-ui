import { DateTime, type Duration, Interval } from "luxon";
import type { DataFabricBinningRequest } from "../schemas/query-schema";

export type DateBinUnit =
  | "Year"
  | "Quarter"
  | "Month"
  | "Week"
  | "Day"
  | "Hour";

export function durationToDateBinUnit(duration: Duration): DateBinUnit {
  if (duration.as("years") >= 1) return "Year";
  if (duration.as("months") >= 3) return "Quarter";
  if (duration.as("months") >= 1) return "Month";
  if (duration.as("weeks") >= 1) return "Week";
  if (duration.as("days") >= 1) return "Day";
  return "Hour";
}

export function createNumericBinning(
  fieldName: string,
  numericBinSize: number,
): DataFabricBinningRequest {
  return {
    fieldName,
    type: "Numeric",
    numericBinSize,
  };
}

export function createDateBinning(
  fieldName: string,
  dateBinUnit: DateBinUnit,
): DataFabricBinningRequest {
  return {
    fieldName,
    type: "Date",
    dateBinUnit,
  };
}

function dateBinUnitToDuration(unit: DateBinUnit): Record<string, number> {
  switch (unit) {
    case "Year":
      return { years: 1 };
    case "Quarter":
      return { months: 3 };
    case "Month":
      return { months: 1 };
    case "Week":
      return { weeks: 1 };
    case "Day":
      return { days: 1 };
    case "Hour":
      return { hours: 1 };
  }
}

export function buildIntervalsFromDateBins(
  dateBinValues: string[],
  dateBinUnit: DateBinUnit,
): Interval[] {
  const durationObj = dateBinUnitToDuration(dateBinUnit);

  return dateBinValues.map((dateStr) => {
    const start = DateTime.fromISO(dateStr, { zone: "utc" });
    const end = start.plus(durationObj);
    return Interval.fromDateTimes(start, end);
  });
}

export function buildNumericBins(
  binValues: number[],
  binSize: number,
): { start: number; end: number }[] {
  return binValues.map((v) => ({
    start: v,
    end: v + binSize,
  }));
}
