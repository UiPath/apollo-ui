"use client";

import { EllipsisVertical } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/registry/button-group/button-group";
import { HOLD_REASONS, REJECT_REASONS } from "./invoice-review-data";
import { ReasonDialog } from "./ReasonDialog";

/** Which overflow dialog is open (only one at a time), or null. */
type HeaderDialog = "reject" | "hold" | null;

/**
 * Per-invoice disposition control for the page header: an Approve split-button
 * with an attached overflow (Reject / Hold). Each overflow action opens the
 * shared park-family dialog (reason chips + optional note), so the header
 * decisions read as one family with the terminal Hold and the route confirm.
 * Reject and Hold both set the runtime disposition (Reject is permanent, Hold
 * reversible). Flag is intentionally absent until it can park a resumable state
 * like Hold; a half-wired legacy flag would leave a dead menu item. Once
 * committed to a permanent disposition (approved OR rejected), BOTH halves and
 * the overflow are disabled: no further decisions. Otherwise Approve is enabled,
 * or blocked with a tooltip naming why.
 */
export function HeaderDecision({
  approved,
  rejected,
  blockedReason,
  onApprove,
  onReject,
  onHold,
}: {
  /** true once approved: both halves disable (no more disposition to make) */
  approved?: boolean;
  /** true once rejected (permanent): both halves + overflow disable */
  rejected?: boolean;
  /** when set (and not approved), Approve is disabled with this tooltip */
  blockedReason?: string | null;
  onApprove: () => void;
  onReject: (reason: string, note?: string) => void;
  onHold: (reason: string, note?: string) => void;
}) {
  const [dialog, setDialog] = useState<HeaderDialog>(null);
  // A permanent disposition locks the header: no further decisions to make.
  const locked = approved || rejected;

  return (
    <>
      <ButtonGroup>
        {locked ? (
          <Button disabled>Approve</Button>
        ) : blockedReason ? (
          // aria-disabled (not disabled) so the button keeps the pointer events the
          // tooltip needs, and stays a direct ButtonGroup child so the split
          // rounding holds.
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                aria-disabled
                onClick={(e) => e.preventDefault()}
                className={cn("opacity-50", "cursor-not-allowed")}
              >
                Approve
              </Button>
            </TooltipTrigger>
            <TooltipContent>{blockedReason}</TooltipContent>
          </Tooltip>
        ) : (
          <Button onClick={onApprove}>Approve</Button>
        )}
        {/* Rule between the two same-color halves: primary -100 (lighter) in
          light, +100 (darker) in dark. Both resolve to primary-600. */}
        <ButtonGroupSeparator className="bg-primary-600" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {/* Disabled once a permanent disposition is set: no further
                decisions from the header. */}
            <Button aria-label="More decisions" disabled={locked}>
              <EllipsisVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {/* Each opens the shared dialog; the menu closes first, then the
                controlled dialog opens (a trigger inside the item would unmount
                with the menu). Both set the runtime disposition. */}
            <DropdownMenuItem onSelect={() => setDialog("reject")}>
              Reject
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setDialog("hold")}>
              Hold
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
    </>
  );
}
