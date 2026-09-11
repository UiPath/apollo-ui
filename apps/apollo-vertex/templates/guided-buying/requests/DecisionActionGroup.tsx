"use client";

import { Button } from "@/components/ui/button";
import type { RecommendationValue } from "./data";

export type ActionKey = "approve" | "send-back" | "reject";

const DEFAULT_ORDER: ActionKey[] = ["approve", "send-back", "reject"];

export const ACTION_LABEL: Record<ActionKey, string> = {
  approve: "Approve",
  "send-back": "Send back",
  reject: "Reject",
};

/**
 * Ranks the three decision actions. No recommendation (null/absent) keeps
 * the fixed default order; a recommendation moves to the front and the rest
 * keep their relative order. One function, read by both tiers — a
 * recommendation is a data value, not a gate.
 */
export function resolveActionOrder(
  recommendation: RecommendationValue | null | undefined,
): ActionKey[] {
  if (recommendation == null) return DEFAULT_ORDER;
  return [
    recommendation,
    ...DEFAULT_ORDER.filter((action) => action !== recommendation),
  ];
}

const ROW_CAPACITY = 2;

/** The row shows the top-ranked actions; whatever's left over goes to the
 * caller's overflow menu. Reject lands there in every order described so
 * far, purely because it never ranks in the top two — not a special case.
 * `capacity` defaults to the card's row size; the header passes 1 to expose
 * only the top action, same ordered list either way. */
export function splitActionOrder(
  order: ActionKey[],
  capacity: number = ROW_CAPACITY,
): {
  row: ActionKey[];
  overflow: ActionKey[];
} {
  return {
    row: order.slice(0, capacity),
    overflow: order.slice(capacity),
  };
}

interface DecisionActionGroupProps {
  row: ActionKey[];
  onAction: (action: ActionKey) => void;
  disabled?: boolean;
  /** Compact sizing for the sticky bar; default sizing inside the card. */
  compact?: boolean;
}

/**
 * The row of decision buttons — mounted in both the header (compact) and
 * the card (full size), same order, same handlers, never forked. `compact`
 * only ever changes weight: smaller control height, and the top-ranked
 * action drops to secondary emphasis instead of primary, since the header
 * is persistent chrome, not the argument the card is making.
 */
export function DecisionActionGroup({
  row,
  onAction,
  disabled = false,
  compact = false,
}: DecisionActionGroupProps) {
  const primaryVariant = compact ? "secondary" : "default";
  return (
    <div className="flex items-center gap-2">
      {row.map((action, i) => (
        <Button
          key={action}
          size={compact ? "sm" : "default"}
          variant={i === 0 ? primaryVariant : "secondary"}
          disabled={disabled}
          onClick={() => onAction(action)}
        >
          {ACTION_LABEL[action]}
        </Button>
      ))}
    </div>
  );
}
