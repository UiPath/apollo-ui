"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

// PLACEHOLDER [Reason chip labels] — kept bracketed rather than filled in.
// Proposed values for Gabriel's ruling, not implemented here: wrong cost
// center, missing justification, quantity unclear, need a quote.
const REASONS = ["[Reason 1]", "[Reason 2]", "[Reason 3]"];

interface SendBackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (reason: string, note: string) => void;
}

/**
 * Send back's confirmation step — a reason and a note, not a single click,
 * since the note is what actually reaches the requester as a message.
 */
export function SendBackDialog({
  open,
  onOpenChange,
  onSubmit,
}: SendBackDialogProps) {
  const [reason, setReason] = useState<string | undefined>(undefined);
  const [note, setNote] = useState("");

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setReason(undefined);
      setNote("");
    }
    onOpenChange(next);
  };

  const canSubmit = reason != null && note.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send back</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Reason</p>
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              spacing={2}
              value={reason}
              onValueChange={(value) => setReason(value || undefined)}
              className="flex-wrap"
            >
              {REASONS.map((label) => (
                <ToggleGroupItem
                  key={label}
                  value={label}
                  className="rounded-full"
                >
                  {label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Note</p>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Explain what's needed before this can be decided."
              className="min-h-[88px] resize-none text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!canSubmit}
            onClick={() => {
              if (!canSubmit || reason == null) return;
              onSubmit(reason, note.trim());
            }}
          >
            Send back
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
