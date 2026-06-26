import { assert } from "./assert";

export function assertNumberOrNull(
  value: unknown,
  entity: string,
): number | null {
  assert(
    typeof value === "number" || value === null,
    `Expected "${entity}" to be a number, but found ${typeof value}`,
  );
  return value;
}
