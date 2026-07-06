"use client";

import { EllipsisVertical } from "lucide-react";
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

/**
 * Per-invoice disposition control for the page header: a primary Approve
 * split-button with an attached overflow (Reject / Hold / Flag). The overflow
 * stays enabled so a reviewer can always Reject/Hold/Flag. When an exception is
 * routed and waiting on an outside reply, Approve is blocked (the problem is
 * genuinely unresolved) with a tooltip naming who we wait on.
 */
export function HeaderDecision({
  onApprove,
  onReject,
  onHold,
  onFlag,
  waitingOn,
}: {
  // Accepted for API compatibility; Approve is no longer gated on it.
  canApprove: boolean;
  onApprove: () => void;
  onReject: () => void;
  onHold: () => void;
  onFlag: () => void;
  /** when set, Approve is blocked: an exception is waiting on this party */
  waitingOn?: string | null;
}) {
  return (
    <ButtonGroup>
      {waitingOn ? (
        // aria-disabled (not disabled) so the button keeps the pointer events the
        // tooltip needs, and stays a direct ButtonGroup child so the split rounding
        // holds.
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
          <TooltipContent>Waiting on {waitingOn}</TooltipContent>
        </Tooltip>
      ) : (
        <Button onClick={onApprove}>Approve</Button>
      )}
      {/* Rule between the two same-color halves: primary -100 (lighter) in
          light, +100 (darker) in dark. Both resolve to primary-600. */}
      <ButtonGroupSeparator className="bg-primary-600" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button aria-label="More decisions">
            <EllipsisVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onReject}>Reject</DropdownMenuItem>
          <DropdownMenuItem onClick={onHold}>Hold</DropdownMenuItem>
          <DropdownMenuItem onClick={onFlag}>Flag</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  );
}
