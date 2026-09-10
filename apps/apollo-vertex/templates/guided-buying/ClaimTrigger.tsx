"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * An inline, claim-level trigger: it marks one clause of body copy as
 * something the assistant can account for, and opens the assistant panel
 * when activated.
 *
 * It carries no AI mark. The affordance is the tinted ground and the dotted
 * underline, both of which are visible at rest with no pointer near it, so
 * the clause still reads as interactive without a glyph interrupting the
 * sentence it sits inside.
 *
 * TODO(apollo-vertex): missing primitive, an inline trigger / annotated text
 * treatment. The registry has `hover-card`, `popover` and `tooltip`, but all
 * three are block or floating triggers rather than a span inside running
 * prose, and the only inline precedent
 * (`registry/solution-tests/.../internal/provenance-bar.tsx`) is
 * evaluator-specific and marked internal. Replace this with the shared
 * primitive once one exists, and delete the local styling below.
 *
 * Deliberately not tied to the headline: the same treatment is a candidate
 * for the card-level claims, so the clause and the handler both arrive as
 * props and nothing about the surrounding sentence is assumed.
 */
interface ClaimTriggerProps {
  /** The clause to wrap. Comes from the recommendation data, never from a
   * string inside a component. */
  clause: string;
  /** Accessible name, announced instead of the clause so the control reads
   * as an action rather than as a restatement of the copy. */
  label: string;
  /** Opens the assistant panel. The caller is responsible for moving focus
   * into the panel once it is open. */
  onOpen: () => void;
  /** Rendered over the trigger on arrival, for the one-shot attention pass.
   * Kept as a slot so the trigger owns none of that timing. */
  children?: ReactNode;
  className?: string;
}

export function ClaimTrigger({
  clause,
  label,
  onOpen,
  children,
  className,
}: ClaimTriggerProps) {
  return (
    <button
      type="button"
      data-slot="claim-trigger"
      onClick={onOpen}
      aria-label={label}
      className={cn(
        // Inline, so it sits in the run of the sentence and wraps with it.
        "relative inline-flex items-baseline rounded-sm px-1 py-0.5 align-baseline",
        // Rest state carries its own affordance: a tinted ground and a
        // dotted underline, both visible with no pointer anywhere near it.
        // The demo is driven by a pointer that is often off screen, so a
        // hover-only affordance would read as plain text most of the time.
        "bg-primary/5 underline decoration-primary/50 decoration-dotted decoration-from-font underline-offset-4",
        "font-medium text-foreground",
        "transition-colors",
        // Four distinct states, none of them relying on colour alone: the
        // underline firms up as well as the ground darkening.
        "hover:bg-primary/10 hover:decoration-primary",
        "focus-visible:bg-primary/10 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2",
        "active:bg-primary/15 active:decoration-solid",
        className,
      )}
    >
      <span>{clause}</span>
      {children}
    </button>
  );
}
