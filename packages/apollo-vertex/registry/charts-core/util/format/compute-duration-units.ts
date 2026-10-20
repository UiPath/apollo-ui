import type { Duration } from "luxon";
import type { DurationUnit } from "./duration-unit";
import { highestDurationUnit } from "./highest-duration-unit";

export const computeDurationUnits = (
  value: Duration,
  units: DurationUnit[] = [],
): DurationUnit[] => {
  const isNegative = value.shiftTo("seconds").seconds < 0;
  const absValue = isNegative ? value.negate() : value;

  const highestUnit = highestDurationUnit(absValue);
  const valueLeft = absValue
    .minus({
      [highestUnit]: Math.floor(absValue.shiftTo(highestUnit).get(highestUnit)),
    })
    .normalize();

  const newUnits = [...units, highestUnit];
  if (valueLeft.as("seconds") < 1) {
    return newUnits;
  }

  return computeDurationUnits(valueLeft, newUnits);
};
