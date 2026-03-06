import { DateTime } from "luxon";

import { assert } from "./assert";

export function assertDateOrString(
  value: unknown,
  entity: string,
): string | DateTime {
  assert(
    value instanceof DateTime || typeof value === "string",
    `Expected "${entity}" to be a date time or a string, but found ${typeof value}`,
  );
  return value;
}
