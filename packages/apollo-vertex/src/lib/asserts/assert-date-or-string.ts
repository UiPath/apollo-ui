import { assert } from "./assert";

export function assertDateOrString(
  value: unknown,
  entity: string,
): string | Date {
  assert(
    value instanceof Date || typeof value === "string",
    `Expected "${entity}" to be a date or a string, but found ${typeof value}`,
  );
  return value;
}
