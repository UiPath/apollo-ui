"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/registry/button-group/button-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/registry/popover/popover";
import {
  HOLD_REASONS,
  REJECT_REASONS,
  SEND_BACK_REASONS,
} from "./invoice-review-data";
import { ReasonDialog } from "./ReasonDialog";

type HeaderDialog = "reject" | "hold" | "send-back" | null;

/**
 * Split-button disposition control for the invoice page header.
 *
 * Face:
 *   - pendingCount = openCount + waitingCount
 *   - pendingCount > 0 → "Mark as waiting" (secondary/outline), clicking parks
 *     the invoice at its current state
 *   - pendingCount = 0 → "Approve" (primary), clicking commits approval
 *   - locked (approved/rejected) → face disabled
 *
 * Chevron opens a 5-item popover:
 *   1. Approve — disabled while pendingCount > 0, sub-line states why
 *   2. Reject invoice… — danger, opens reason dialog
 *   3. Send back — opens reason dialog, returns to submitter
 *   4. Put on hold — opens reason dialog, pauses review
 *   5. Mark as waiting — one-click, sets waiting status
 *
 * The Approve item in the popover maps to the same onApprove handler as the
 * face — the guard lives in the store action, not only the disabled prop.
 */
interface HeaderDecisionProps {
  openCount: number;
  waitingCount: number;
  approved?: boolean;
  rejected?: boolean;
  onApprove: () => void;
  onReject: (reason: string, note?: string) => void;
  onHold: (reason: string, note?: string) => void;
  onSendBack: (reason: string, note?: string) => void;
  onWait: () => void;
}

export function HeaderDecision({
  openCount,
  waitingCount,
  approved,
  rejected,
  onApprove,
  onReject,
  onHold,
  onSendBack,
  onWait,
}: HeaderDecisionProps) {
  const [dialog, setDialog] = useState<HeaderDialog>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const locked = approved || rejected;
  const pendingCount = openCount + waitingCount;
  const gateOpen = pendingCount > 0;

  // Face: shows "Approve" only when everything is resolved.
  const faceIsApprove = !locked && !gateOpen;

  const approveSub = gateOpen
    ? `${pendingCount} exception${pendingCount === 1 ? "" : "s"} open`
    : "All checks passed";

  const handleFaceClick = () => {
    if (locked) return;
    if (faceIsApprove) {
      onApprove();
    } else {
      onWait();
    }
  };

  const handlePopoverApprove = () => {
    if (gateOpen || locked) return;
    setPopoverOpen(false);
    onApprove();
  };

  return (
    <>
      <ButtonGroup>
        <Button
          disabled={locked}
          variant={faceIsApprove ? "default" : "outline"}
          onClick={handleFaceClick}
          className={cn(!faceIsApprove && "text-foreground")}
        >
          {faceIsApprove ? "Approve" : "Mark as waiting"}
        </Button>
        <ButtonGroupSeparator
          className={faceIsApprove ? "bg-primary-600" : "bg-border"}
        />
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              disabled={locked}
              variant={faceIsApprove ? "default" : "outline"}
              aria-label="More dispositions"
              className={cn(!faceIsApprove && "text-foreground")}
            >
              <ChevronDown className="size-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-60 p-1">
            {/* 1. Approve */}
            <button
              type="button"
              disabled={gateOpen || locked}
              className={cn(
                "flex w-full flex-col gap-0.5 rounded-sm px-3 py-2 text-left",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                gateOpen || locked
                  ? "cursor-not-allowed opacity-50"
                  : "hover:bg-accent",
              )}
              onClick={handlePopoverApprove}
            >
              <span className="text-sm font-medium">Approve</span>
              <span className="text-xs text-muted-foreground">
                {approveSub}
              </span>
            </button>

            <div className="my-1 h-px bg-border" />

            {/* 2. Reject invoice… */}
            <button
              type="button"
              className="flex w-full flex-col gap-0.5 rounded-sm px-3 py-2 text-left hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              onClick={() => {
                setPopoverOpen(false);
                setDialog("reject");
              }}
            >
              <span className="text-sm font-medium text-destructive">
                Reject invoice…
              </span>
            </button>

            {/* 3. Send back */}
            <button
              type="button"
              className="flex w-full flex-col gap-0.5 rounded-sm px-3 py-2 text-left hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              onClick={() => {
                setPopoverOpen(false);
                setDialog("send-back");
              }}
            >
              <span className="text-sm font-medium">Send back</span>
            </button>

            {/* 4. Put on hold */}
            <button
              type="button"
              className="flex w-full flex-col gap-0.5 rounded-sm px-3 py-2 text-left hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              onClick={() => {
                setPopoverOpen(false);
                setDialog("hold");
              }}
            >
              <span className="text-sm font-medium">Put on hold</span>
              <span className="text-xs text-muted-foreground">
                Pause internally, keep assigned
              </span>
            </button>

            {/* 5. Mark as waiting */}
            <button
              type="button"
              className="flex w-full flex-col gap-0.5 rounded-sm px-3 py-2 text-left hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              onClick={() => {
                setPopoverOpen(false);
                onWait();
              }}
            >
              <span className="text-sm font-medium">Mark as waiting</span>
              <span className="text-xs text-muted-foreground">
                Waiting on an external reply
              </span>
            </button>
          </PopoverContent>
        </Popover>
      </ButtonGroup>

      <ReasonDialog
        open={dialog === "reject"}
        onOpenChange={(o) => setDialog(o ? "reject" : null)}
        title="Reject invoice"
        description="Reject this invoice and record why. This ends the review."
        chips={REJECT_REASONS}
        commitLabel="Reject invoice"
        commitVariant="destructive"
        onCommit={onReject}
      />
      <ReasonDialog
        open={dialog === "hold"}
        onOpenChange={(o) => setDialog(o ? "hold" : null)}
        title="Hold invoice"
        description="Park this invoice with a reason. It stays in your queue until resolved."
        chips={HOLD_REASONS}
        commitLabel="Hold invoice"
        onCommit={onHold}
      />
      <ReasonDialog
        open={dialog === "send-back"}
        onOpenChange={(o) => setDialog(o ? "send-back" : null)}
        title="Send back"
        description="Return this invoice to the submitter for correction."
        chips={SEND_BACK_REASONS}
        commitLabel="Send back"
        onCommit={onSendBack}
      />
    </>
  );
}
