import { Info } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

interface AiCaveatProps {
  /**
   * `standalone` (default): leading muted info-circle icon + text. Use wherever
   * the caveat is the first or only AI signal in that spot, so the icon marks
   * it as a notice.
   *
   * `withMark`: text only, no leading icon. Use ONLY when the caveat sits
   * directly adjacent to the identity mark at a boundary, with nothing between
   * the mark and the caveat. The mark carries the AI signal; repeating the icon
   * would announce AI twice.
   */
  variant?: "standalone" | "withMark";
  /**
   * Caveat copy. Defaults to the canonical fallibility disclosure. Override
   * only the action phrase ("continue", "finalize") when context genuinely
   * differs. The reminder that AI can make mistakes stays constant.
   */
  children?: React.ReactNode;
  className?: string;
}

/**
 * A quiet caveat for AI recommendation cards. Renders a muted weight-400 line,
 * optionally with a leading info-circle icon.
 *
 * Tier rule: icon and text both stay `text-muted-foreground` (monochrome,
 * unfilled). If either takes a color, the component has drifted into the
 * warning tier and is wrong.
 *
 * When to use: on cards that make a recommendation or offer an action, once
 * per card. Insight and observation cards do not need it — they are already
 * covered by the AI mark. For a group of cards, disclose once at the group
 * boundary, not on every card.
 *
 * Do NOT add the AI mark, a badge, or a gradient here. The card header already
 * marks the card as AI (mark once); this carries only the caveat.
 */
export function AiCaveat({
  variant = "standalone",
  children,
  className,
}: AiCaveatProps) {
  if (variant === "withMark") {
    return (
      <p
        className={cn("pl-5 text-xs text-muted-foreground", className)}
      >
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
      <span>
        {children ?? "The output is AI generated. Please review."}
      </span>
    </div>
  );
}
