import { assert } from "./assert";

export function assertBoolean(value: unknown, entity: string): boolean {
  assert(
    typeof value === "boolean",
    `Expected "${entity}" to be a boolean, but found ${typeof value}`,
  );
  return value;
}
