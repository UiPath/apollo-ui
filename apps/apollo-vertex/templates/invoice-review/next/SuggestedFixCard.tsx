"use client";

import { Loader2, X } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
 * Card action grammar: at most two buttons (direct fix + delegate), plus an
 * optional ✕ icon at the header-right for the "reject / keep-as-is" path.
 *
 * The ✕ appears when the primary suggestion is a data mutation AND a verify
 * suggestion is also present. In that case the verify is lifted out of the
 * button row and rendered as the ✕ — it commits as an attestation, never a
 * silent dismiss. Hovering the ✕ rings its value (empty-sentinel aim so the
 * field is highlighted but no ghost arrow is shown).
 */
export function SuggestedFixCard({
  suggestions,
  onResolve,
  disabled,
  onAim,
  applying,
}: {
  suggestions: Suggestion[];
  onResolve: (s: Suggestion, reason?: string, note?: string) => void;
  disabled?: boolean;
  onAim?: (correction: DetailCorrections | null) => void;
  applying?: boolean;
}) {
  const gradientId = useId();

  if (suggestions.length === 0) return null;
  const [primary, ...rest] = suggestions;

  // A verify suggestion acts as the ✕ only when the primary is a data mutation.
  // When verify IS the primary (e.g. "Keep 48 units"), it stays as a button.
  const primaryIsMutation =
    primary.type === "suggest_correction" ||
    primary.type === "suggest_po" ||
    primary.type === "suggest_account" ||
    primary.type === "suggest_tax_code";
  const xIdx = primaryIsMutation
    ? rest.findIndex((s) => s.type === "verify")
    : -1;
  const xSuggestion = xIdx >= 0 ? rest[xIdx] : null;
  // Remove the ✕ suggestion from the button row, then cap at one alternate
  // (primary + one delegate = two total buttons).
  const buttonAlts = xIdx >= 0 ? rest.filter((_, i) => i !== xIdx) : rest;
  const buttonSuggestions = [primary, ...buttonAlts.slice(0, 1)];

  return (
    <TooltipProvider>
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
            {/* Header row: gradient mark + label on the left, ✕ on the right. */}
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
              {xSuggestion && (
                <div className="ml-auto">
                  <RejectButton
                    suggestion={xSuggestion}
                    disabled={disabled}
                    onResolve={onResolve}
                    onAim={onAim}
                  />
                </div>
              )}
            </div>
            {primary.reasoning && (
              <p className="mt-2 text-sm leading-normal text-muted-foreground">
                {primary.reasoning}
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {buttonSuggestions.map((s, i) => (
                <ActionButton
                  // suggestions are a small static list; index key is stable here
                  key={`${s.type}-${i}`}
                  suggestion={s}
                  disabled={disabled || applying}
                  applying={applying}
                  onResolve={onResolve}
                  onAim={onAim}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}

/**
 * The ✕ icon at the card's header-right: the "reject suggestion / keep
 * current value" path. Hovering fires the aim ring on the attested field (ring
 * only, no ghost arrow — empty-sentinel correction). Clicking commits through
 * the same resolve path as any fix action.
 */
function RejectButton({
  suggestion,
  disabled,
  onResolve,
  onAim,
}: {
  suggestion: Suggestion;
  disabled?: boolean;
  onResolve: (s: Suggestion) => void;
  onAim?: (correction: DetailCorrections | null) => void;
}) {
  const aim = suggestionAimCorrection(suggestion);
  const label = suggestionLabel(suggestion);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          disabled={disabled}
          aria-label={label}
          className="-mr-1 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={() => onResolve(suggestion)}
          onMouseEnter={() => onAim?.(aim)}
          onFocus={() => onAim?.(aim)}
          onMouseLeave={() => onAim?.(null)}
          onBlur={() => onAim?.(null)}
        >
          <X className="size-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left">{label}</TooltipContent>
    </Tooltip>
  );
}

/**
 * A single suggestion action. Internal routes open a confirm dialog naming the
 * owner before parking; a tooltip on hover discloses the full recipient so the
 * button label can stay short ("Send to owner"). Every other action commits on
 * click.
 */
function ActionButton({
  suggestion,
  disabled,
  applying,
  onResolve,
  onAim,
}: {
  suggestion: Suggestion;
  disabled?: boolean;
  applying?: boolean;
  onResolve: (s: Suggestion, reason?: string, note?: string) => void;
  onAim?: (correction: DetailCorrections | null) => void;
}) {
  const isInternalRoute =
    isRouteSuggestion(suggestion) && !isSupplierRoute(suggestion);
  const [routeDialogOpen, setRouteDialogOpen] = useState(false);

  const aim = suggestionAimCorrection(suggestion);
  const handleAim = () => onAim?.(aim);
  const handleClearAim = () => onAim?.(null);

  if (isInternalRoute) {
    const owner = routeOwner(suggestion);
    return (
      <>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="secondary"
              size="sm"
              disabled={disabled}
              onClick={() => setRouteDialogOpen(true)}
              onMouseEnter={handleAim}
              onFocus={handleAim}
              onMouseLeave={handleClearAim}
              onBlur={handleClearAim}
            >
              {suggestionLabel(suggestion)}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {owner.name} · {owner.role}
          </TooltipContent>
        </Tooltip>
        <ReasonDialog
          open={routeDialogOpen}
          onOpenChange={setRouteDialogOpen}
          title={`Route to ${owner.name}`}
          description={owner.role}
          chips={ROUTE_REASONS}
          commitLabel="Route"
          onCommit={(reason, note) => onResolve(suggestion, reason, note)}
        />
      </>
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
      {applying ? (
        <>
          <Loader2 className="size-3.5 animate-spin" />
          Applying…
        </>
      ) : (
        suggestionLabel(suggestion)
      )}
    </Button>
  );
}
