import { DateTime, Interval } from "luxon";
import { assert } from "@/lib/asserts/assert";

interface GetChartRangeProps {
  type: "numeric" | "datetime";
  bins: Array<
    | Interval
    | {
        start: number;
        end: number;
      }
  >;
}
export const getChartRange = ({ type, bins }: GetChartRangeProps) => {
  if (type !== "datetime" || bins.length === 0) {
    return;
  }

  const start = bins[0]?.start;
  const end = bins.at(-1)?.end;

  assert(start instanceof DateTime, "Chart range min must be a DateTime");
  assert(end instanceof DateTime, "Chart range max must be a DateTime");

  return Interval.fromDateTimes(start, end);
};
