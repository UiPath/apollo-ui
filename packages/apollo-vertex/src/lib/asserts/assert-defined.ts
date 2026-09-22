import { assert } from "./assert";

export function assertDefined<T>(
  value: T | null | undefined,
  entity: string,
): T {
  assert(value != null, `Expected "${entity}" to have a defined value`);
  return value;
}
