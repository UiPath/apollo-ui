"use client";

import { cn } from "@/lib/utils";
import { useTier } from "./tier-context";

export function TierToggle() {
  const { tier, setTier } = useTier();

  return (
    <div className="flex items-center overflow-hidden rounded-md border border-border text-[11px] font-semibold">
      <button
        type="button"
        onClick={() => setTier("p1")}
        className={cn(
          "px-3 py-1.5 transition-colors",
          tier === "p1"
            ? "bg-(--gb-teal) text-white"
            : "bg-background text-muted-foreground hover:bg-muted",
        )}
      >
        P1 · Now (CGA)
      </button>
      <button
        type="button"
        onClick={() => setTier("p2")}
        className={cn(
          "px-3 py-1.5 transition-colors",
          tier === "p2"
            ? "bg-(--gb-indigo) text-white"
            : "bg-background text-muted-foreground hover:bg-muted",
        )}
      >
        P2 · Next (V2)
      </button>
    </div>
  );
}
