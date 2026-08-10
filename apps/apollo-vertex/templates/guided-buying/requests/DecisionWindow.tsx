"use client";

import { useNavigate, useParams } from "@tanstack/react-router";
import { Info } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/components/ui/button-group";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderActionsOverflow,
  PageHeaderBackButton,
  PageHeaderContent,
  PageHeaderDescription,
  PageHeaderField,
  PageHeaderFieldLabel,
  PageHeaderFieldValue,
  PageHeaderNav,
  PageHeaderTitle,
  PageHeaderTitleGroup,
} from "@/components/ui/page-header";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { AiGlow } from "@/registry/ai-glow/ai-glow";
import { AiMark } from "@/registry/ai-mark/ai-mark";
import { avatarColorFor } from "./avatar-color";
import { CommunicationRail } from "./CommunicationRail";
import {
  ACTION_LABEL,
  type ActionKey,
  DecisionActionGroup,
  resolveActionOrder,
  splitActionOrder,
} from "./DecisionActionGroup";
import { DecisionChecks } from "./DecisionChecks";
import {
  buildChecks,
  DECISION_STATUS_META,
  type DecisionStatus,
  getDecisionDetail,
  type RailFieldKey,
  type SummaryMark,
} from "./data";
import { PORecord } from "./PORecord";
import {
  RequestRecordRail,
  type RequestRecordRailHandle,
} from "./RequestRecordRail";
import { useRequests } from "./requests-context";
import { SendBackDialog } from "./SendBackDialog";

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// PLACEHOLDER [Card title] — mocks used "AI review"; "AI Summary" is the
// current fallback, unresolved either way. Same string on every request, so
// it lives here as a constant rather than on DecisionDetail.
const CARD_TITLE = "AI Summary";

/** A run of the AI summary sentence. Plain text renders as-is; a run with a
 * `targetField` also gets the accent treatment and becomes interactive —
 * hover flashes the referenced rail field, click/keyboard scrolls to it
 * first. Same span either way — Prompt B only needs to supply new marks
 * with `targetField` set, not new rendering code. */
function SummaryMarkSpan({
  mark,
  onHighlight,
}: {
  mark: SummaryMark;
  onHighlight?: (key: RailFieldKey, options?: { scroll?: boolean }) => void;
}) {
  const interactive = mark.targetField != null;
  return (
    <span
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onMouseEnter={
        interactive ? () => onHighlight?.(mark.targetField!) : undefined
      }
      onClick={
        interactive
          ? () => onHighlight?.(mark.targetField!, { scroll: true })
          : undefined
      }
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key !== "Enter" && e.key !== " ") return;
              e.preventDefault();
              onHighlight?.(mark.targetField!, { scroll: true });
            }
          : undefined
      }
      className={cn(
        "rounded-sm px-1 text-insight-900 dark:text-insight-50",
        interactive && "cursor-pointer",
      )}
      style={{
        backgroundImage: "var(--ai-gradient)",
        boxDecorationBreak: "clone",
        WebkitBoxDecorationBreak: "clone",
      }}
    >
      {mark.text}
    </span>
  );
}

/**
 * Approver decision view — /decision/$id. Four columns: nav (unchanged,
 * owned by the shell), the decision column (AI summary, checks, caveat),
 * the request rail, and the communication rail. Header spans the three
 * content columns. The action group renders in two places (header,
 * compact; card, full size) from one ordered list and one set of
 * handlers — never duplicated.
 */
export function DecisionWindow() {
  const { id } = useParams({ from: "/decision/$id" });
  const navigate = useNavigate();
  const {
    requestStatusOverrides,
    approveRequest,
    denyRequest,
    sendBackRequest,
    addNote,
  } = useRequests();
  const [poOpen, setPoOpen] = useState(false);
  const [sendBackOpen, setSendBackOpen] = useState(false);

  const railRef = useRef<RequestRecordRailHandle>(null);

  const detail = getDecisionDetail(id);

  if (!detail) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Decision request not found.</p>
      </div>
    );
  }

  const status = (requestStatusOverrides[id] ?? "pending") as DecisionStatus;
  const approved = status === "approved";
  const { label: statusLabel, status: badgeStatus } =
    DECISION_STATUS_META[status];

  const requesterInitials = initialsOf(detail.requester);
  const requesterAvatarColor = avatarColorFor(detail.requester);
  const approverFirstName = detail.approver.split(" · ")[0]!;
  const approverInitials = initialsOf(approverFirstName);
  const approverAvatarColor = avatarColorFor(approverFirstName);

  // The same checks DecisionChecks renders below — the summary sentence
  // reads from this array too, so it can't assert something the list
  // contradicts.
  const checks = buildChecks(detail);
  const deviceCheck = checks.find((c) => c.key === "deviceManagement")!;
  const deviceStatusWord = deviceCheck.status === "pass" ? "ready" : "flagged";
  const hasException = checks.some((c) => c.status === "exception");

  // The budget's own name, not a hardcoded "hardware budget" — REQ-2052's
  // is a hardware budget, but the label already carries that; deriving it
  // is what lets this sentence stay correct for a software-budget request.
  const budgetName = detail.packet.budget.label.split(" · ")[0]!.toLowerCase();
  const budgetMark: SummaryMark = {
    text: `${detail.packet.budget.pct} of the ${budgetName}`,
    targetField: "budget",
  };
  const deliveryMark: SummaryMark = { text: detail.expectedDelivery };
  // Same template, different slot — an exception means the sentence can't
  // claim nothing else needs attention, so this clause changes instead of
  // being a second authored sentence.
  const trailingClause = hasException
    ? "so review what's flagged below before deciding"
    : "so nothing else needs your attention";

  const handleHighlight = (key: RailFieldKey, options?: { scroll?: boolean }) =>
    railRef.current?.highlightField(key, options);

  const order = resolveActionOrder(detail.recommendation);
  const { row, overflow } =
    status === "pending"
      ? splitActionOrder(order)
      : { row: [] as ActionKey[], overflow: [] as ActionKey[] };
  // The header exposes only the single top-ranked action — same ordered
  // list as the card, a narrower capacity. Everything else, including the
  // card's second row action, is one click away behind the overflow.
  const { row: headerRow, overflow: headerOverflow } =
    status === "pending"
      ? splitActionOrder(order, 1)
      : { row: [] as ActionKey[], overflow: [] as ActionKey[] };

  const handleAction = (action: ActionKey) => {
    if (action === "approve") {
      approveRequest(id);
      toast.success("Approved");
    } else if (action === "reject") {
      denyRequest(id);
      toast.success("Rejected");
    } else {
      setSendBackOpen(true);
    }
  };

  const handleSendBackSubmit = (reason: string, note: string) => {
    addNote(id, `${reason}. ${note}`, approverFirstName);
    sendBackRequest(id);
    setSendBackOpen(false);
    toast.success("Sent back");
  };

  const handleCopyLink = () => {
    void navigator.clipboard.writeText(window.location.href);
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader bordered className="shrink-0 @3xl:!grid-cols-[auto_1fr_auto]">
        <PageHeaderNav>
          <PageHeaderBackButton
            onClick={() => void navigate({ to: "/approvals" })}
          />
          <PageHeaderTitleGroup>
            <PageHeaderTitle>{id}</PageHeaderTitle>
            <PageHeaderDescription>{detail.request}</PageHeaderDescription>
          </PageHeaderTitleGroup>
        </PageHeaderNav>

        <PageHeaderContent className="@3xl:justify-between @3xl:pl-6">
          <PageHeaderField>
            <PageHeaderFieldLabel>Status</PageHeaderFieldLabel>
            <PageHeaderFieldValue>
              <Badge status={badgeStatus}>{statusLabel}</Badge>
            </PageHeaderFieldValue>
          </PageHeaderField>
          <PageHeaderField>
            <PageHeaderFieldLabel>Need by</PageHeaderFieldLabel>
            <PageHeaderFieldValue>{detail.needBy}</PageHeaderFieldValue>
          </PageHeaderField>
          <PageHeaderField>
            <PageHeaderFieldLabel>Requester</PageHeaderFieldLabel>
            <PageHeaderFieldValue className="flex items-center gap-1.5">
              <Avatar className="size-[18px] shrink-0">
                <AvatarFallback
                  className={cn(
                    "text-[8px] font-semibold",
                    requesterAvatarColor.bg,
                    requesterAvatarColor.fg,
                  )}
                >
                  {requesterInitials}
                </AvatarFallback>
              </Avatar>
              {detail.requester}
            </PageHeaderFieldValue>
          </PageHeaderField>
          <PageHeaderField>
            <PageHeaderFieldLabel>Approver</PageHeaderFieldLabel>
            <PageHeaderFieldValue className="flex items-center gap-1.5">
              <Avatar className="size-[18px] shrink-0">
                <AvatarFallback
                  className={cn(
                    "text-[8px] font-semibold",
                    approverAvatarColor.bg,
                    approverAvatarColor.fg,
                  )}
                >
                  {approverInitials}
                </AvatarFallback>
              </Avatar>
              {approverFirstName}
            </PageHeaderFieldValue>
          </PageHeaderField>
        </PageHeaderContent>

        <PageHeaderActions className="@3xl:ml-6">
          {/* One exposed action, joined visually to the overflow trigger —
              everything else the card offers (the second row action, Reject,
              Copy link) is one click away, never duplicated as a second
              button here. Same order/handlers as the card, narrower
              capacity (see headerRow above). */}
          <ButtonGroup>
            {headerRow.length > 0 && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleAction(headerRow[0]!)}
              >
                {ACTION_LABEL[headerRow[0]!]}
              </Button>
            )}
            <ButtonGroupSeparator />
            <PageHeaderActionsOverflow variant="secondary" size="icon-sm">
              {headerOverflow.map((action) => (
                <DropdownMenuItem
                  key={action}
                  variant={action === "reject" ? "destructive" : "default"}
                  onSelect={() => handleAction(action)}
                >
                  {ACTION_LABEL[action]}
                </DropdownMenuItem>
              ))}
              {headerOverflow.length > 0 && <DropdownMenuSeparator />}
              <DropdownMenuItem onSelect={handleCopyLink}>
                Copy link
              </DropdownMenuItem>
            </PageHeaderActionsOverflow>
          </ButtonGroup>
        </PageHeaderActions>
      </PageHeader>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Decision column — one elevation level, no card. The glow is the
            only marker of "this is the AI region"; it's clipped to this
            column by the outer overflow-hidden and sits outside the
            scrolling wrapper so it doesn't travel with scroll. */}
        <div className="relative min-w-0 flex-1 overflow-hidden">
          <AiGlow
            variant="group"
            className="top-auto -bottom-[120px] left-1/2 h-[280px] w-[36rem] opacity-60 blur-2xl dark:opacity-25"
            style={{
              backgroundImage: "var(--ai-gradient)",
              transform: "translateX(-50%) rotate(-14deg)",
            }}
          />
          <div className="relative h-full overflow-y-auto [mask-image:linear-gradient(to_bottom,transparent,black_16px)]">
            <div className="max-w-[640px] space-y-5 px-4 pt-5 pb-16 sm:px-6 lg:px-8">
              <div className="space-y-5">
                <div className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                  <AiMark size={14} gradientId="gb-ai-mark" aria-hidden />
                  {CARD_TITLE}
                </div>

                <p className="max-w-[640px] text-[23px] font-semibold leading-snug text-foreground">
                  {approved ? (
                    <>
                      Now that you've approved it, I sent the purchase order to{" "}
                      {detail.supplier}, arriving by{" "}
                      <SummaryMarkSpan mark={deliveryMark} />.
                    </>
                  ) : (
                    <>
                      Before this reached you, I confirmed device management is{" "}
                      {deviceStatusWord} and it lands at{" "}
                      <SummaryMarkSpan
                        mark={budgetMark}
                        onHighlight={handleHighlight}
                      />{" "}
                      after approval, {trailingClause}.
                    </>
                  )}
                </p>

                <DecisionChecks checks={checks} />

                {row.length > 0 && (
                  <div className="pt-2">
                    <DecisionActionGroup row={row} onAction={handleAction} />
                  </div>
                )}
              </div>

              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Info className="size-3.5 shrink-0" aria-hidden />
                The output is AI generated. Please review.
              </p>
            </div>
          </div>
        </div>

        <div className="relative w-[280px] shrink-0 overflow-y-auto px-6">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-px bg-border [mask-image:linear-gradient(to_bottom,black_60%,transparent_100%)]"
          />
          <RequestRecordRail
            ref={railRef}
            detail={detail}
            status={status}
            onOpenPo={() => setPoOpen(true)}
          />
        </div>

        <CommunicationRail
          detail={detail}
          approverFirstName={approverFirstName}
        />
      </div>

      <SendBackDialog
        open={sendBackOpen}
        onOpenChange={setSendBackOpen}
        onSubmit={handleSendBackSubmit}
      />

      {/* Surfaces the PO without leaving the decision context — the rail's
          Linked records chip opens this once approved. */}
      <Sheet open={poOpen} onOpenChange={setPoOpen}>
        <SheetContent className="w-full gap-0 p-0 sm:max-w-2xl">
          <SheetHeader className="border-b">
            <SheetTitle>{detail.poNumber}</SheetTitle>
            <SheetDescription className="sr-only">
              Purchase order for {detail.request}
            </SheetDescription>
          </SheetHeader>
          <PORecord id={detail.poNumber} embedded />
        </SheetContent>
      </Sheet>
    </div>
  );
}
