import { CASES, type WorkflowId } from "../data/supplier-cases";

export type WorkflowFilter = "all" | WorkflowId;

/**
 * Cases visible for a given rail selection. Lives in a `.ts` sibling of
 * workflow-rail.tsx because oxlint's `react/only-export-components` rule is
 * enabled for `templates/**`.
 */
export function filterCases(wf: WorkflowFilter) {
  return wf === "all" ? CASES : CASES.filter((c) => c.wf === wf);
}
