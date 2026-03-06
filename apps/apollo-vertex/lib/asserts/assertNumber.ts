import { assert } from "./assert";

export function assertNumber(value: unknown, entity: string): number {
  assert(
    typeof value === "number",
    `Expected "${entity}" to be a number, but found ${typeof value}`,
  );
  return value;
}
