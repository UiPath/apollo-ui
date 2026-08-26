"use client";

import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AiGlow } from "@/registry/ai-glow/ai-glow";

/**
 * The elevated block: the one thing on the page awaiting a human. Exactly one
 * per case. `ai` wraps it in the glass + glow treatment reserved for generated
 * content; control states (approval, escalation) get the same elevation without
 * the AI expression, since nothing there was written by a model.
 */
export function ActionBlock({
  ai = false,
  tone = "default",
  children,
}: {
  ai?: boolean;
  tone?: "default" | "error";
  children: ReactNode;
}) {
  const card = (
    <Card
      variant="glass"
      className={cn(
        "relative gap-4 p-6 shadow-lg",
        ai && "bg-[var(--ai-glass)] dark:bg-[var(--ai-glass)]",
        // dark: scope matches glass's own dark fill, which would otherwise win
        tone === "error" &&
          "border-destructive/40 bg-destructive/5 dark:bg-destructive/10",
      )}
    >
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  );

  if (!ai) return card;

  return (
    <div className="relative">
      <AiGlow />
      <div className="relative">{card}</div>
    </div>
  );
}
