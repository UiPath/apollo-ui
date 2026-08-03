"use client";

import { AiMark } from "@/registry/ai-mark/ai-mark";

/** One record entry — a person's message or an agent action, same alignment
 * either way: avatar, name + timestamp on one line, content beneath. This is
 * a record, not a conversation, so nothing is left/right-aligned or bubbled
 * to imply a back-and-forth — every entry reads the same way down the page.
 * Shared between the requester's Communication card and the approver's. */
export function RecordEntry({
  name,
  initials,
  timestamp,
  text,
  isPerson,
}: {
  name: string;
  /** Avatar initials — person entries only, ignored for agent entries. */
  initials?: string;
  timestamp?: string;
  text: string;
  isPerson: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5">
      {isPerson ? (
        <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[9px] font-semibold text-primary">
          {initials ?? "?"}
        </div>
      ) : (
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-insight-50 text-insight-600 dark:bg-insight-900">
          <AiMark size={11} gradientId="gb-ai-mark" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm font-medium text-foreground">{name}</span>
          {timestamp != null && (
            <span className="text-[11px] text-muted-foreground">
              {timestamp}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-sm text-foreground">{text}</p>
      </div>
    </div>
  );
}
