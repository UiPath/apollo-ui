import type { ControlState, SupplierCase } from "../data/supplier-cases";

/**
 * Single source of truth for how a control state looks. Changing the treatment
 * of "needs a second approver" is one edit here, not seven across the module.
 *
 * The ring colours use Vertex's semantic tokens (`--success`, `--warning`,
 * `--destructive`) rather than literal Tailwind palette steps, so the module
 * follows the theme in registry.json instead of pinning its own colours.
 *
 * Kept in a `.ts` module because oxlint's `react/only-export-components` rule
 * is enabled for `templates/**`.
 */
export const CONTROL_TONE: Record<
  ControlState,
  { badge: "success" | "warning" | "error"; ring: string }
> = {
  auto: { badge: "success", ring: "text-success" },
  review: { badge: "warning", ring: "text-warning" },
  locked: { badge: "error", ring: "text-destructive" },
};

/**
 * One plain sentence explaining why a case sits where it does. Branches on the
 * trigger first, because a system-initiated case is in its state for a
 * different reason than a classified one.
 */
export function controlRationale(c: SupplierCase): string {
  if (c.trigger) {
    return c.control === "auto"
      ? "A monitor opened this case and the outreach was low-risk and non-financial, so it went out without review."
      : "A workflow opened this case and it is now waiting on the supplier, so it stays open until they respond.";
  }

  if (c.wf === "w5") {
    return "The explainable part of this statement reconciled on its own; what was left could not be matched to a known reason, so it was escalated.";
  }

  if (c.control === "auto") {
    return "The classification cleared the auto-send threshold and the answer came straight from the system of record, so the reply went out automatically.";
  }

  if (c.control === "review") {
    return "The classification landed below the auto-send threshold, so a person confirms the reply before it goes out.";
  }

  return "This workflow touches payment or master data, so it is held for a second approver no matter how confident the classification was.";
}

/**
 * Score-to-level cutoffs for ConfidenceSignal.
 *
 * These are OURS, not the component's: confidence-signal-levels.ts defines only
 * per-level presentation (labels, bar counts, colours) and no numeric ranges,
 * so the mapping from a raw score lives here. Named explicitly so nobody later
 * mistakes it for something the component ships.
 */
export const CONFIDENCE_LEVEL_THRESHOLDS = { high: 90, medium: 70 } as const;

/**
 * The confidence level for a case, or null when no classification happened.
 *
 * Triggered cases return null rather than "unknown". "Unknown" claims the
 * system looked and could not tell; a monitor-opened case never classified
 * anything, so any level at all would be a claim about a judgement that was
 * never made. Those cases render no chip and let the control badge carry it.
 */
export function confidenceLevel(
  c: SupplierCase,
): "high" | "medium" | "low" | null {
  if (c.trigger || typeof c.confidence !== "number") return null;
  if (c.confidence >= CONFIDENCE_LEVEL_THRESHOLDS.high) return "high";
  if (c.confidence >= CONFIDENCE_LEVEL_THRESHOLDS.medium) return "medium";
  return "low";
}
