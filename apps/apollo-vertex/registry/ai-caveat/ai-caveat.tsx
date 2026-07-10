import { Info } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

interface AiCaveatProps {
  /**
   * `standalone` (default): info-circle icon + text. Use wherever the caveat
   * is the first or only AI signal in that spot, so the icon marks it as a
   * notice. Default for single-card footers and below-grid disclosures.
   *
   * `withMark`: text only, no icon. Use ONLY when locked directly under the
   * identity mark at a group boundary, with nothing between the mark and the
   * caveat. The mark carries the AI signal; the icon would be redundant. Text
   * is indented (`pl-5`) to align under the mark label, not the mark icon.
   */
  variant?: "standalone" | "withMark";
  /**
   * Caveat copy. Defaults to the approved verbatim string. Override via
   * children only with Legal-cleared copy; do not rephrase the default.
   */
  children?: React.ReactNode;
  className?: string;
}

/**
 * A quiet fallibility disclosure for AI-generated content.
 *
 * ## When to show
 * Wherever AI generates content the user reads or acts on: recommendations,
 * actions, AI-generated insights, and summaries. Do NOT add it for identity
 * or chrome alone (mark, badges, buttons, provenance markers). Disclose once
 * per surface, never stacked on every element.
 *
 * ## Variants
 * - `standalone` (default): info icon + text. Footer on a single card, or a
 *   standalone notice below a grid of equal-height cards.
 * - `withMark`: no icon, indented text. Only at a group boundary directly
 *   under the identity mark, nothing between. ~4px below the mark.
 *
 * ## Placement rules
 * - Single card: footer inside the card (`standalone`).
 * - Group headed by a mark: once at the boundary under the mark (`withMark`),
 *   not per card.
 * - Grid of equal-height cards: once below the grid (`standalone`), not per
 *   card, because a per-card footer fights the row's equal-height stretch.
 *
 * ## Spacing
 * Content-to-caveat gap is 16px, owned by the component (`mt-4`). Host cards
 * must use `gap-0` so the card's flex gap does not compound with `mt-4`. For
 * `withMark`, callers use `className="-mt-2 mb-3"` to achieve the ~4px gap
 * under the mark's `mb-3`.
 *
 * ## Tier rule
 * Icon and text both stay `text-muted-foreground` (monochrome, unfilled). If
 * either takes a color, the component has drifted into the warning tier.
 *
 * ## Copy
 * Default is the approved verbatim string "The output is AI generated. Please
 * review." Override via `children` only with Legal-cleared copy.
 */
export function AiCaveat({
  variant = "standalone",
  children,
  className,
}: AiCaveatProps) {
  if (variant === "withMark") {
    return (
      <p className={cn("pl-5 text-xs text-muted-foreground", className)}>
        {children ?? "The output is AI generated. Please review."}
      </p>
    );
  }

  return (
    <div
      className={cn(
        "mt-4 flex items-start gap-1.5 text-xs text-muted-foreground",
        className,
      )}
    >
      <Info className="mt-px size-3.5 shrink-0" aria-hidden="true" />
      <span>{children ?? "The output is AI generated. Please review."}</span>
    </div>
  );
}
