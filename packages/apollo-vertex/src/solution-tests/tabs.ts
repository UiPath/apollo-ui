export type SolutionTestsTab = "cases" | "runs";

export const DEFAULT_TAB: SolutionTestsTab = "cases";

/** Coerce a raw value to a known tab, falling back to the default. */
export function normalizeTab(value: unknown): SolutionTestsTab {
  return value === "runs" ? "runs" : DEFAULT_TAB;
}
