import { AiMark } from "@/registry/ai-mark/ai-mark";
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
        <AiMark size={14} className="shrink-0" gradientId="gb-ai-mark" aria-hidden />
        {request.agentNote}
      </p>
    </div>
  );
}
