"use client";

import { Info } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const CAVEAT_TEXT = "The output is AI generated. Please review.";

/** The AI caveat, ported from the shared record card (see the report): same
 * icon, text, and muted treatment wherever it renders, so it can't drift
 * into two different caveats across screens. */
export function Caveat({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "flex items-center gap-1.5 text-xs text-muted-foreground",
        className,
      )}
    >
      <Info className="size-3.5 shrink-0" aria-hidden />
      {CAVEAT_TEXT}
    </p>
  );
}

/**
 * The decision action row shared by the approver decision view and the
 * buyer workbench's exception surface: the primary/secondary actions
 * (whatever buttons the caller passes), an optional context note, and the
 * AI caveat at the far end. Ported from the record card's own actions
 * footer (see the report), with `contextNote` added as a new, optional
 * slot, since the approver's own usage never needed one.
 *
 * The context note is a consequence of the decision, so it sits under the
 * actions rather than beside them (prompt 29): a multi-line note competing
 * with the buttons and the caveat in one flex row put all three at
 * different baselines the moment any of them wrapped. `items-start` on the
 * outer row (rather than `items-center`) keeps this from re-centering the
 * caveat against a now-taller left column, and on the actions row itself
 * keeps every button's own top edge aligned regardless of whether one of
 * them carries something beneath it (a placeholder caption, say). With no
 * `contextNote` and no such caption (the approver's own usage), every row
 * here is a single line the same height as its neighbour, so this renders
 * identically to before.
 */
export function DecisionActionRow({
  actions,
  contextNote,
  showCaveat = true,
  className,
}: {
  actions: ReactNode;
  contextNote?: ReactNode;
  showCaveat?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="flex flex-col gap-2">
        <div className="flex items-start gap-2">{actions}</div>
        {contextNote}
      </div>
      {showCaveat && <Caveat className="shrink-0" />}
    </div>
  );
}
