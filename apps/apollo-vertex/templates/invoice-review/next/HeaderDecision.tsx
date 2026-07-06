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
 * Per-invoice disposition control for the page header: an Approve split-button
 * with an attached overflow (Reject / Flag). Hold is intentionally NOT here in
 * v2/v3: the terminal buttons are the only Hold entry, so there is no half-wired
 * overflow Hold. Once approved, BOTH halves are simply disabled (the header
 * chip carries the state); a nicer committed treatment comes later. Otherwise
 * Approve is enabled, or blocked with a tooltip naming why.
 */
export function HeaderDecision({
  approved,
  blockedReason,
  onApprove,
  onReject,
  onFlag,
}: {
  /** true once approved: both halves disable (no more disposition to make) */
  approved?: boolean;
  /** when set (and not approved), Approve is disabled with this tooltip */
  blockedReason?: string | null;
  onApprove: () => void;
  onReject: () => void;
  onFlag: () => void;
}) {
  return (
    <ButtonGroup>
      {approved ? (
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
          {/* Disabled once approved: no further disposition from the header. */}
          <Button aria-label="More decisions" disabled={approved}>
            <EllipsisVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {/* Reject/Flag stay legacy (on the CTA audit). Hold lives on the
              terminals only. */}
          <DropdownMenuItem onClick={onReject}>Reject</DropdownMenuItem>
          <DropdownMenuItem onClick={onFlag}>Flag</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  );
}
