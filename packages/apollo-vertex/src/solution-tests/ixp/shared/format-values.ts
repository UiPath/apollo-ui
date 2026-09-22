import { renderValueOrEmptyState } from "@/lib/renderValueOrEmptyState";

// Accepts a scalar or an array so the comparison view (expected/actual arrays)
// and the output view (a single value) share one formatter.
export function formatFieldValues(values: unknown): string {
  const list = Array.isArray(values) ? values : [values];
  const present = list.filter((v) => v != null && v !== "").map(String);
  return present.length > 0
    ? present.join(" | ")
    : renderValueOrEmptyState(null);
}
