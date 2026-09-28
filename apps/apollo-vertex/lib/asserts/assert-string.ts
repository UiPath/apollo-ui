import { assert } from "./assert";

export function assertString(value: unknown, entity: string): string {
  assert(
    typeof value === "string",
    `Expected "${entity}" to be a string, but found ${typeof value}`,
  );
  return value;
}
