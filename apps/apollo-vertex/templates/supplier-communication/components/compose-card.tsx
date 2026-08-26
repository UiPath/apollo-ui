"use client";

import type { RefObject } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AiCaveat } from "@/registry/ai-caveat/ai-caveat";
import { AiMark } from "@/registry/ai-mark/ai-mark";
import { ActionBlock } from "./action-block";

interface ComposeCardProps {
  draft: string;
  recipient: string;
  /** Focus target for the confidence chip's "Review the draft" next step. */
  textareaRef: RefObject<HTMLTextAreaElement | null>;
}

/**
 * The reply being composed: the elevated block for any case that has a draft,
 * and the only AI surface in the pane. It carries the glass + glow treatment
 * and the one disclosure per case, so nothing else in the detail repeats it.
 */
export function ComposeCard({
  draft,
  recipient,
  textareaRef,
}: ComposeCardProps) {
  return (
    <ActionBlock ai>
      <div className="mb-4 flex items-center justify-between gap-2">
        <Badge status="ai" variant="secondary">
          <AiMark size={12} />
          AI drafted
        </Badge>
      </div>

      <div className="mb-3 flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">To:</span>
        <span className="min-w-0 truncate text-foreground">{recipient}</span>
      </div>

      <Textarea
        ref={textareaRef}
        defaultValue={draft}
        aria-label="Drafted reply"
        className="min-h-[10rem] bg-background text-base leading-7 dark:bg-background"
      />

      <div className="mt-4 flex flex-wrap gap-2">
        <Button>Approve and send</Button>
        <Button variant="outline">Save edit</Button>
        <Button variant="ai-outline">
          <AiMark className="size-3.5" />
          Redraft
        </Button>
        <Button variant="ghost">Escalate</Button>
      </div>

      <AiCaveat />
    </ActionBlock>
  );
}
