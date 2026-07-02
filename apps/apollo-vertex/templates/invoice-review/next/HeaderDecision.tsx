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
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/registry/button-group/button-group";

/**
 * Per-invoice disposition control for the page header: a primary Approve
 * split-button with an attached overflow (Reject / Hold / Flag). Approve is
 * locked until the timeline reports the invoice is clear; the overflow stays
 * enabled so a reviewer can always Reject/Hold/Flag.
 */
export function HeaderDecision({
  onApprove,
  onReject,
  onHold,
  onFlag,
}: {
  // Accepted for API compatibility; Approve is no longer gated on it.
  canApprove: boolean;
  onApprove: () => void;
  onReject: () => void;
  onHold: () => void;
  onFlag: () => void;
}) {
  return (
    <ButtonGroup>
      <Button onClick={onApprove}>Approve</Button>
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
