import { DateTime } from "luxon";
import { assert } from "./assert";

function isDateTime(value: unknown): value is DateTime {
  return value instanceof DateTime;
}

export function assertDateTimeOrString(
  value: unknown,
  entity: string,
): DateTime {
  assert(
    isDateTime(value) || typeof value === "string",
    `Expected "${entity}" to be a date time or a string, but found ${typeof value}`,
  );

  if (isDateTime(value)) {
    return value;
  }

  return DateTime.fromISO(value);
}
