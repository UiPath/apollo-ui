import { Sparkles } from "lucide-react";
import type { BuyRequest } from "./types";

interface IntentHeaderProps {
  request: BuyRequest;
}

/**
 * The hero for the Selection screen: the requester's restated request as the
 * visual focus, with one quiet, auditable agent line beneath it.
 */
export function IntentHeader({ request }: IntentHeaderProps) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm text-muted-foreground">For</p>
      <h1 className="text-2xl font-semibold leading-snug text-foreground">
        “{request.summary}”
      </h1>
      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Sparkles className="size-3.5 shrink-0 text-primary" aria-hidden />
        {request.agentNote}
      </p>
    </div>
  );
}
