import {
  CASES,
  type SupplierCase,
  type WorkflowId,
} from "../data/supplier-cases";

export type WorkflowFilter = "all" | WorkflowId;

/**
 * Cases visible for a given rail selection. Lives in a `.ts` sibling of
 * workflow-rail.tsx because oxlint's `react/only-export-components` rule is
 * enabled for `templates/**`.
 */
export function filterCases(wf: WorkflowFilter) {
  return wf === "all" ? CASES : CASES.filter((c) => c.wf === wf);
}

export type StatusFilter = "all" | "needs" | "flight";

const STATUS_FILTERS: StatusFilter[] = ["all", "needs", "flight"];

/** Radix hands tab values back as plain strings; narrow rather than assert. */
export function isStatusFilter(value: string): value is StatusFilter {
  return STATUS_FILTERS.some((s) => s === value);
}

/**
 * Whether someone at the AP desk has to do something.
 *
 * This is NOT `control !== "auto"`, which is the assumption this comment exists
 * to head off. Harborview is the counter-example: its control state is "review"
 * and its label reads "Awaiting response", but the PO already went out and the
 * reminder cadence runs on a schedule. The next move belongs to the supplier,
 * so filing it under "Needs you" would put a case in the work queue that has no
 * work in it.
 *
 * The `trigger` half is what encodes that. A triggered case was opened by a
 * monitor or an upstream workflow and its outbound has already been sent, so
 * whatever it is waiting on is external. What is left needing a person is a
 * case the agent could not close on its own AND that started from an inbound
 * message: a draft held back for approval, a four-eyes signature, or an
 * escalation sitting with compliance.
 */
export function needsHuman(c: SupplierCase): boolean {
  return c.control !== "auto" && !c.trigger;
}

/** Narrow an already workflow-filtered set to one status tab. */
export function filterByStatus(
  cases: SupplierCase[],
  status: StatusFilter,
): SupplierCase[] {
  if (status === "all") return cases;
  return cases.filter((c) => needsHuman(c) === (status === "needs"));
}
