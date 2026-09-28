import type { Duration } from "luxon";

import type { DurationUnit } from "./duration-unit";

export const highestDurationUnit = (duration: Duration): DurationUnit => {
  if (Math.abs(duration.shiftTo("days").days) > 1) {
    return "day";
  }

  if (Math.abs(duration.shiftTo("hours").hours) > 1) {
    return "hour";
  }

  if (Math.abs(duration.shiftTo("minutes").minutes) > 1) {
    return "minute";
  }

  return "second";
};
