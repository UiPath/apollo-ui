"use client";

import { Check, Clock } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AiGlow } from "@/registry/ai-glow/ai-glow";
import { AiMark } from "@/registry/ai-mark/ai-mark";
import {
  isHoldSuggestion,
  type Suggestion,
  suggestionLabel,
} from "./invoice-review-data";

// Confirmation copy shown once a resolution is chosen (no em-dashes in UI copy).
function resolutionText(s: Suggestion): string {
  switch (s.type) {
    case "suggest_po":
      return `Linked ${(s.data.po as string) ?? "the PO"} to the invoice.`;
    case "suggest_correction":
      return "Correction applied to the invoice.";
    case "suggest_account":
      return "GL account set.";
    case "suggest_tax_code":
      return "Tax code applied.";
    case "verify":
      return "Marked verified.";
    case "retry":
      return "Re-running extraction.";
    case "suggest_email":
      return "Draft prepared for the supplier.";
    case "suggest_supplier":
      return "Message drafted to the supplier.";
    case "route":
      return "Routed to the data owner.";
    case "wait":
      return "Holding for the daily rate.";
    default:
      return "Resolved.";
  }
}

/**
 * AI suggested fix, rendered as the AI Toolkit "Card (Primary)" glass surface:
 * a glass card floating over the AI gradient shadow (AiGlow), with the gradient
 * mark and gradient-clipped label in the header lockup. The block is
 * self-contained (no reliance on the timeline rail), so it reads correctly as a
 * terminal node or a mid node. On resolve it switches to a cleared/success
 * treatment in place.
 */
export function SuggestedFixCard({
  suggestions,
  onResolve,
  disabled,
}: {
  suggestions: Suggestion[];
  onResolve: (s: Suggestion) => void;
  disabled?: boolean;
}) {
  const gradientId = useId();
  const [chosen, setChosen] = useState<Suggestion | null>(null);

  if (suggestions.length === 0) return null;
  const [primary, ...alternatives] = suggestions;

  function choose(s: Suggestion) {
    setChosen(s);
    onResolve(s);
  }

  // Resolved: same card, cleared/success treatment, confirmation at the top.
  if (chosen) {
    const hold = isHoldSuggestion(chosen);
    return (
      <Card
        variant="solid"
        className={cn(
          "mt-5 max-w-[480px]",
          hold ? "border-border bg-muted/40" : "border-success/30 bg-success/5",
        )}
      >
        <CardContent className="flex items-center gap-2">
          {hold ? (
            <Clock className="size-4 shrink-0 text-muted-foreground" />
          ) : (
            <Check className="size-4 shrink-0 text-success" />
          )}
          <span
            className={cn(
              "text-sm",
              hold ? "text-muted-foreground" : "text-success",
            )}
          >
            {resolutionText(chosen)}
          </span>
        </CardContent>
      </Card>
    );
  }

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
            <Button
              variant="secondary"
              size="sm"
              disabled={disabled}
              onClick={() => choose(primary)}
            >
              {suggestionLabel(primary)}
            </Button>
            {alternatives.map((alt, i) => (
              <Button
                // suggestions are a small static list; index key is stable here
                key={`${alt.type}-${i}`}
                variant="secondary"
                size="sm"
                disabled={disabled}
                onClick={() => choose(alt)}
              >
                {suggestionLabel(alt)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
