"use client";

import { useId } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AiGlow } from "@/registry/ai-glow/ai-glow";
import { AiMark } from "@/registry/ai-mark/ai-mark";
import {
  isRouteSuggestion,
  isSupplierRoute,
  ROUTE_REASONS,
  routeOwner,
  suggestionAimCorrection,
  type DetailCorrections,
  type Suggestion,
  suggestionLabel,
} from "./invoice-review-data";
import { ReasonDialog } from "./ReasonDialog";

/**
 * AI suggested fix, rendered as the AI Toolkit "Card (Primary)" glass surface:
 * a glass card floating over the AI gradient shadow (AiGlow), with the gradient
 * mark and gradient-clipped label in the header lockup. The block is
 * self-contained (no reliance on the timeline rail), so it reads correctly as a
 * terminal node or a mid node.
 *
 * Choosing an action calls onResolve and nothing else: the card renders no
 * interim confirmation. What happens next (collapse into a resolved/waiting row,
 * or a supplier draft modal) is owned by the caller, so until it commits the
 * card and its exception are untouched.
 */
export function SuggestedFixCard({
  suggestions,
  onResolve,
  disabled,
  onAim,
}: {
  suggestions: Suggestion[];
  onResolve: (s: Suggestion, reason?: string, note?: string) => void;
  disabled?: boolean;
  onAim?: (correction: DetailCorrections | null) => void;
}) {
  const gradientId = useId();

  if (suggestions.length === 0) return null;
  const [primary, ...alternatives] = suggestions;

  return (
    <div className="relative mt-5 max-w-[480px]">
      {/* AI gradient shadow behind the glass surface. */}
      <AiGlow />
      {/* Gradient definition for the single mark. */}
      <svg width={0} height={0} aria-hidden="true" className="absolute">
        <defs>
          <linearGradient
            id={gradientId}
            x1="2"
            y1="4"
            x2="22"
            y2="20"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="var(--ai-gradient-start)" />
            <stop offset="1" stopColor="var(--ai-gradient-end)" />
          </linearGradient>
        </defs>
      </svg>
      <Card
        variant="glass"
        className="relative bg-[var(--ai-glass)] dark:bg-[var(--ai-glass)]"
      >
        <CardContent className="flex flex-col">
          {/* Icon lockup: gradient mark carries the AI signal, plain label. */}
          <div className="flex items-center gap-1.5">
            <AiMark size={14} gradientId={gradientId} />
            <span
              className="text-[13px] font-bold"
              style={{
                backgroundImage: "var(--ai-gradient-text)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              Suggested fix
            </span>
          </div>
          {primary.reasoning && (
            <p className="mt-2 text-sm leading-normal text-muted-foreground">
              {primary.reasoning}
            </p>
          )}
          <div className="mt-4 flex justify-start gap-2">
            <ActionButton
              suggestion={primary}
              disabled={disabled}
              onResolve={onResolve}
              onAim={onAim}
            />
            {alternatives.map((alt, i) => (
              <ActionButton
                // suggestions are a small static list; index key is stable here
                key={`${alt.type}-${i}`}
                suggestion={alt}
                disabled={disabled}
                onResolve={onResolve}
                onAim={onAim}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * A single suggestion action. Internal routes (route to a data owner, approver,
 * etc.) open a confirm dialog naming the owner before parking; every other
 * action (a data fix, a supplier route) commits on click. Supplier routes still
 * open their own draft modal downstream, so they are left to the plain click
 * path here.
 */
function ActionButton({
  suggestion,
  disabled,
  onResolve,
  onAim,
}: {
  suggestion: Suggestion;
  disabled?: boolean;
  onResolve: (s: Suggestion, reason?: string, note?: string) => void;
  onAim?: (correction: DetailCorrections | null) => void;
}) {
  const isInternalRoute =
    isRouteSuggestion(suggestion) && !isSupplierRoute(suggestion);

  const handleAim = () => onAim?.(suggestionAimCorrection(suggestion));
  const handleClearAim = () => onAim?.(null);

  if (isInternalRoute) {
    const owner = routeOwner(suggestion);
    return (
      <ReasonDialog
        trigger={
          <Button
            variant="secondary"
            size="sm"
            disabled={disabled}
            onMouseEnter={handleAim}
            onFocus={handleAim}
            onMouseLeave={handleClearAim}
            onBlur={handleClearAim}
          >
            {suggestionLabel(suggestion)}
          </Button>
        }
        title={`Route to ${owner.name}`}
        description={owner.role}
        chips={ROUTE_REASONS}
        commitLabel="Route"
        onCommit={(reason, note) => onResolve(suggestion, reason, note)}
      />
    );
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      disabled={disabled}
      onClick={() => onResolve(suggestion)}
      onMouseEnter={handleAim}
      onFocus={handleAim}
      onMouseLeave={handleClearAim}
      onBlur={handleClearAim}
    >
      {suggestionLabel(suggestion)}
    </Button>
  );
}
