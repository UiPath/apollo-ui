"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { AiCaveat } from "@/registry/ai-caveat/ai-caveat";
import { Badge } from "@/registry/badge/badge";
import {
  CardDescription,
  CardTitle,
  GLASS_CLASSES,
} from "@/registry/card/card";
import { AiIcon } from "./ai-icon";

const CARDS = [
  {
    title: "Open invoices",
    desc: "1,248 this cycle, 37 flagged.",
    recommended: false,
    ai: false,
  },
  {
    title: "AI insights",
    desc: "Surfaced from recent activity.",
    recommended: true,
    ai: true,
  },
];

/**
 * Selectable cards that mirror the Card `selectable` behavior: a card-shaped
 * glow on select (AI gradient for ai, primary tint for standard), a primary
 * hover halo, and a solid surface when selected. Kept local (no registry edit)
 * but uses the page's --ai-glass token so it matches the plan-selector example.
 */
export function SelectableCards() {
  const [selected, setSelected] = useState<number | null>(0);

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {CARDS.map((card, i) => {
        const isSelected = selected === i;
        return (
          <div key={card.title} className="group/card relative h-full">
            {/* Selected glow: AI gradient for ai, primary tint for standard. */}
            {card.ai ? (
              <div
                aria-hidden="true"
                className={cn(
                  "pointer-events-none absolute inset-0 rounded-2xl blur-xl transition-opacity duration-150",
                  isSelected ? "opacity-100" : "opacity-0",
                )}
                style={{ background: "var(--ai-gradient)" }}
              />
            ) : (
              <div
                aria-hidden="true"
                className={cn(
                  "pointer-events-none absolute inset-0 rounded-2xl bg-primary-400/15 blur-xl transition-opacity duration-150 dark:bg-primary-400/20",
                  isSelected ? "opacity-100" : "opacity-0",
                )}
              />
            )}
            {/* Hover glow: always primary, only when not selected. */}
            <div
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute inset-0 rounded-2xl bg-primary-400/15 opacity-0 blur-xl transition-opacity duration-150 dark:bg-primary-400/20",
                !isSelected && "group-hover/card:opacity-100",
              )}
            />
            <button
              type="button"
              aria-pressed={isSelected}
              onClick={() => setSelected(isSelected ? null : i)}
              className={cn(
                "relative flex h-full w-full flex-col gap-0 p-5 text-left text-card-foreground",
                GLASS_CLASSES,
                "cursor-pointer transition-all duration-150 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
                isSelected
                  ? "border-primary bg-card dark:border-primary dark:bg-card"
                  : "bg-[var(--ai-glass)] hover:bg-card dark:bg-[var(--ai-glass)] dark:hover:bg-card",
              )}
            >
              <div className="flex items-center gap-2">
                <CardTitle>{card.title}</CardTitle>
                {card.recommended && (
                  <Badge
                    className="border-0 text-white"
                    style={{ background: "var(--ai-gradient-fill)" }}
                  >
                    <AiIcon />
                    Picked for you
                  </Badge>
                )}
              </div>
              <CardDescription className="mt-2">{card.desc}</CardDescription>
              {card.ai && <AiCaveat />}
            </button>
          </div>
        );
      })}
    </div>
  );
}
