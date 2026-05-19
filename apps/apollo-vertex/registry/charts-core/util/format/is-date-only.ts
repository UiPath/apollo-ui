import type { DateTime } from "luxon";

export function isDateOnly(date: DateTime) {
  return (
    date.hour === 0 &&
    date.minute === 0 &&
    date.second === 0 &&
    date.millisecond === 0
  );
}
