"use client";

import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { AiMark } from "@/registry/ai-mark/ai-mark";
import type { DraftMessage } from "../data/exceptions";

/**
 * The correction draft's send/discard step, adapted from the exception
 * review branch's supplier email modal: prop driven and mounted only while
 * open, so each open starts fresh from the seed draft rather than reading
 * from context. Fields are read only here (see the report on why): nothing
 * downstream reads an edited value, so an editable field that goes nowhere
 * would be misleading rather than useful.
 *
 * Send parks the exception in "waiting" (see the report on what it actually
 * changes); it does not send anything. Discard, Escape, and the overlay all
 * leave the exception untouched.
 *
 * Rendered only while a draft is being reviewed (the parent mounts it
 * conditionally), so `open` isn't a prop here: mounting is the open state.
 */
export function CorrectionDraftModal({
  draft,
  onSend,
  onDiscard,
}: {
  draft: DraftMessage;
  onSend: () => void;
  onDiscard: () => void;
}) {
  return (
    <Dialog
      open
      onOpenChange={(o) => {
        if (!o) onDiscard();
      }}
    >
      <DialogContent className="flex h-[560px] max-w-2xl flex-col overflow-hidden !p-0">
        <div className="flex flex-1 flex-col overflow-hidden bg-card">
          <div className="shrink-0 px-4 pb-3 pt-4">
            <DialogTitle>Email to {draft.toName ?? draft.to}</DialogTitle>
            <DialogDescription className="mt-0.5 flex items-center gap-1.5">
              <AiMark size={12} />
              <span>Drafted from the request. Review before sending.</span>
            </DialogDescription>
          </div>
          <Separator />
          <div className="shrink-0 space-y-2 border-b border-border px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="w-12 shrink-0 text-xs text-muted-foreground">
                To
              </span>
              <input
                value={draft.to}
                readOnly
                className="min-w-0 flex-1 rounded-md border border-border bg-muted/30 px-2 py-1 text-xs text-foreground focus:outline-none"
              />
            </div>
            {draft.cc && (
              <div className="flex items-center gap-2">
                <span className="w-12 shrink-0 text-xs text-muted-foreground">
                  Cc
                </span>
                <input
                  value={draft.cc}
                  readOnly
                  className="min-w-0 flex-1 rounded-md border border-border bg-muted/30 px-2 py-1 text-xs text-foreground focus:outline-none"
                />
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="w-12 shrink-0 text-xs text-muted-foreground">
                Subject
              </span>
              <input
                value={draft.subject}
                readOnly
                className="min-w-0 flex-1 rounded-md border border-border bg-muted/30 px-2 py-1 text-xs text-foreground focus:outline-none"
              />
            </div>
          </div>
          <div className="flex flex-1 flex-col overflow-hidden p-3">
            <textarea
              value={draft.body}
              readOnly
              className="w-full flex-1 resize-none rounded-lg border-[0.5px] border-border bg-card p-3 text-xs leading-relaxed text-foreground focus:outline-none"
            />
          </div>
          <div className="flex shrink-0 items-center justify-end gap-2 px-4 py-3">
            <Button variant="ghost" size="sm" onClick={onDiscard}>
              Discard
            </Button>
            <Button size="sm" onClick={onSend}>
              <Send className="size-3.5" />
              Send
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
