"use client";

import { useNavigate, useParams } from "@tanstack/react-router";
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
import { ActivityTrack } from "./ActivityTrack";
import { avatarColorFor } from "./avatar-color";
import { CommunicationCard } from "./CommunicationCard";
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
  getRequestDetail,
  type RailFieldKey,
  REQ_2052_APPROVED_DATE,
  type SummaryMark,
} from "./data";
import { PORecord } from "./PORecord";
import { RecordCard } from "./RecordCard";
import { RecordEntry } from "./RecordEntry";
import {
  RequestRecordRail,
  type RequestRecordRailHandle,
} from "./RequestRecordRail";
import { noteProvenance, useRequests } from "./requests-context";
import { SendBackDialog } from "./SendBackDialog";
import {
  advanceStagesThrough,
  applyReceiptFlags,
  buildTrackStages,
  simplifyApproverDates,
  toDisplayStages,
} from "./stage-display";
import { TruncatedSubtitle } from "./TruncatedSubtitle";

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

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

const COMPOSER_MIN_HEIGHT = 72;

/**
 * Approver decision view — /decision/$id. Same two-column template as the
 * requester's own request detail (RequestWindow.tsx): a main column (the
 * decision card, then Communication as a card) and a details rail. The
 * decision card is the shared RecordCard (see RecordCard.tsx) — persona
 * content differs, the zone structure doesn't. The action group renders in
 * two places (header, compact; card, full size) from one ordered list and
 * one set of handlers — never duplicated.
 */
export function DecisionWindow() {
  const { id } = useParams({ from: "/decision/$id" });
  const navigate = useNavigate();
  const {
    threads,
    addNote,
    receipts,
    requestStatusOverrides,
    approveRequest,
    denyRequest,
    sendBackRequest,
  } = useRequests();
  const [poOpen, setPoOpen] = useState(false);
  const [sendBackOpen, setSendBackOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const composerRef = useRef<HTMLTextAreaElement>(null);

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

  const requesterFirstName = detail.requester.split(" ")[0]!;
  const requesterAvatarColor = avatarColorFor(detail.requester);
  const approverFirstName = detail.approver.split(" · ")[0]!;

  // The same checks the AI zone's summary sentence reads from — the list
  // can't assert something the sentence contradicts.
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
  // FINDING: this duplicates the top action between the header and the
  // card body (both show "Approve" first for a clean recommendation) —
  // that duplication predates this port; not resolved here.
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

  // GAP: the stage tracker reads RequestDetail.journeyStages — the same
  // source the requester's own page reads, not a second copy — but only
  // REQ-2052 has one today (REQ-2054/2055/2056 have a DecisionDetail with
  // no journeyStages counterpart). The primary-content zone simply doesn't
  // render for those, same "renders nothing when absent" rule this app
  // already follows elsewhere (see RequestWindow.tsx's own gaps).
  const requestDetail = getRequestDetail(id);
  const rawStages =
    requestDetail?.journeyStages != null
      ? applyReceiptFlags(buildTrackStages(requestDetail), receipts[id])
      : undefined;
  const stagesWithApprovalDate =
    approved && rawStages != null
      ? rawStages.map((stage) =>
          stage.label === "Approved"
            ? { ...stage, date: REQ_2052_APPROVED_DATE, overdueDays: undefined }
            : stage,
        )
      : rawStages;
  const trackStages =
    approved && stagesWithApprovalDate != null
      ? advanceStagesThrough(stagesWithApprovalDate, "Approved")
      : stagesWithApprovalDate;
  // Sub-labels only where they're decision-relevant (current stage's own
  // expectation, final stage's need-by) — the submitted date and the
  // shipping estimate come out; neither changes what the approver decides.
  // The requester's own tracker never runs through simplifyApproverDates.
  const displayStages =
    trackStages != null
      ? simplifyApproverDates(
          toDisplayStages(
            trackStages,
            { needBy: requestDetail?.summary?.needBy ?? detail.needBy },
            "approver",
          ),
        )
      : undefined;

  // ESCALATE: wording. Trimmed to its substance — the AI mark and the zone
  // label already establish that the AI is speaking, so the old "Before
  // this reached you, I confirmed..." / "Now that you've approved it, I
  // sent..." lead-ins were a restatement of that, not new information.
  const summarySentence = approved ? (
    <>
      Purchase order sent to {detail.supplier}, arriving by{" "}
      <SummaryMarkSpan mark={deliveryMark} />.
    </>
  ) : (
    <>
      Device management is {deviceStatusWord}, and it lands at{" "}
      <SummaryMarkSpan mark={budgetMark} onHighlight={handleHighlight} /> after
      approval, {trailingClause}.
    </>
  );

  const notes = threads[id] ?? [];

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;
    addNote(id, text, approverFirstName);
    setDraft("");
  };

  return (
    <div className="flex h-full flex-col">
      {/* Same three-region header as the requester's own page (see that
          file's own header comment for the full rationale): title/nav and
          actions at natural width, anchored to their own edges; the
          metadata region between them at natural-width attributes with
          equal gaps, not equal-width columns. 40px container padding,
          48px title boundary, 32px actions boundary and inter-attribute
          minimum — all identical values, same tokens. The approver's
          metadata names the other party (the requester) plus Need by —
          each persona's header names the counterpart, not itself. */}
      <PageHeader
        bordered
        className="shrink-0 px-10 sm:px-10 lg:px-10 @3xl:!grid-cols-[auto_1fr_auto] @3xl:gap-0"
      >
        <PageHeaderNav className="@3xl:mr-12">
          <PageHeaderBackButton
            onClick={() => void navigate({ to: "/approvals" })}
          />
          <PageHeaderTitleGroup className="max-w-[320px]">
            <PageHeaderTitle>{id}</PageHeaderTitle>
            <TruncatedSubtitle text={detail.request} />
          </PageHeaderTitleGroup>
        </PageHeaderNav>

        <PageHeaderContent className="@3xl:justify-between @3xl:gap-8">
          <PageHeaderField className="shrink-0">
            <PageHeaderFieldLabel>Date requested</PageHeaderFieldLabel>
            <PageHeaderFieldValue className="overflow-visible">
              {detail.submitted}
            </PageHeaderFieldValue>
          </PageHeaderField>
          <PageHeaderField className="shrink-0">
            <PageHeaderFieldLabel>Status</PageHeaderFieldLabel>
            <PageHeaderFieldValue className="overflow-visible">
              <Badge status={badgeStatus} variant="secondary">
                {statusLabel}
              </Badge>
            </PageHeaderFieldValue>
          </PageHeaderField>
          <PageHeaderField className="shrink-0">
            <PageHeaderFieldLabel>Requested by</PageHeaderFieldLabel>
            <PageHeaderFieldValue className="flex items-center gap-1.5 overflow-visible">
              <Avatar className="size-[18px] shrink-0">
                <AvatarFallback
                  className={cn(
                    "text-[8px] font-semibold",
                    requesterAvatarColor.bg,
                    requesterAvatarColor.fg,
                  )}
                >
                  {initialsOf(detail.requester)}
                </AvatarFallback>
              </Avatar>
              {detail.requester}
            </PageHeaderFieldValue>
          </PageHeaderField>
          <PageHeaderField className="shrink-0">
            <PageHeaderFieldLabel>Need by</PageHeaderFieldLabel>
            <PageHeaderFieldValue className="overflow-visible">
              {detail.needBy}
            </PageHeaderFieldValue>
          </PageHeaderField>
        </PageHeaderContent>

        <PageHeaderActions className="@3xl:ml-8">
          {status === "pending" ? (
            // One exposed action, joined visually to the overflow trigger —
            // everything else the card offers (the second row action,
            // Reject, Copy link) is one click away, never duplicated as a
            // second button here. Same order/handlers as the card, narrower
            // capacity (see headerRow above).
            <ButtonGroup>
              {headerRow.length > 0 && (
                <Button
                  variant="secondary"
                  onClick={() => handleAction(headerRow[0]!)}
                >
                  {ACTION_LABEL[headerRow[0]!]}
                </Button>
              )}
              <ButtonGroupSeparator />
              <PageHeaderActionsOverflow variant="secondary" size="icon">
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
          ) : (
            // Once decided, there's nothing left to hide behind an
            // overflow trigger — Copy link is the only action, so it's the
            // exposed button, not a one-item ellipsis menu. Default size
            // (no `size="sm"`), matching the requester's own header button.
            <Button variant="secondary" onClick={handleCopyLink}>
              Copy link
            </Button>
          )}
        </PageHeaderActions>
      </PageHeader>

      {/* Two columns, one shared scroll — same wrapper as RequestWindow.tsx,
          for the same reason (a per-column overflow-y-auto clips the glass
          card's glow on its right edge). */}
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pt-8 pb-16 sm:px-6",
          "[mask-image:linear-gradient(to_bottom,transparent,black_24px)]",
          "lg:flex-row lg:gap-8 lg:px-8",
        )}
      >
        <div className="min-w-0 space-y-5 lg:flex-1">
          {/* Glow behind the card, not inside it — AiGlow sits as the
              first child of this `relative` wrapper, the card layered
              above it in its own `relative` child (see ai-glow.tsx's own
              doc comment). The card itself is `surface="solid"`: glass's
              translucency is exactly what let the glow bleed through the
              surface rather than just read behind it. */}
          <div className="relative">
            <AiGlow style={{ backgroundImage: "var(--ai-gradient)" }} />
            <div className="relative">
              <RecordCard
                surface="solid"
                layout="split"
                aiHeadingStyle="section"
                caveatPlacement="footer"
                label="Timeline"
                primaryContent={
                  displayStages != null ? (
                    <ActivityTrack
                      stages={displayStages}
                      orientation="vertical"
                    />
                  ) : undefined
                }
                aiHeading="AI summary"
                aiContent={
                  <div className="space-y-4">
                    <p className="max-w-[568px] text-[23px] font-semibold leading-snug text-foreground">
                      {summarySentence}
                    </p>
                    <DecisionChecks checks={checks} />
                  </div>
                }
                actions={
                  row.length > 0 ? (
                    <DecisionActionGroup row={row} onAction={handleAction} />
                  ) : undefined
                }
              />
            </div>
          </div>

          <CommunicationCard
            entries={
              <>
                {notes.map((note) => (
                  <RecordEntry
                    key={note.id}
                    isPerson
                    name={note.author}
                    initials={initialsOf(note.author)}
                    timestamp={note.time}
                    text={note.text}
                    provenance={noteProvenance(note, detail.teamsChannel)}
                  />
                ))}
              </>
            }
            composer={
              <>
                <div
                  className={cn(
                    "rounded-lg border border-border transition-shadow motion-safe:duration-150",
                    "focus-within:border-primary focus-within:shadow-[0_0_0_1px_var(--primary),0_0_12px_2px_color-mix(in_oklab,var(--primary)_35%,transparent)]",
                  )}
                >
                  <textarea
                    ref={composerRef}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey))
                        handleSend();
                    }}
                    placeholder={`Ask ${requesterFirstName} a question before deciding`}
                    rows={2}
                    style={{ minHeight: COMPOSER_MIN_HEIGHT }}
                    className="block w-full resize-none rounded-t-lg bg-background px-3 py-3.5 text-sm text-foreground outline-none placeholder:text-muted-foreground dark:bg-input/30"
                  />
                  <div className="h-px bg-border" />
                  <div className="flex items-center justify-between gap-2 rounded-b-lg bg-background p-2 dark:bg-input/30">
                    <Avatar className="size-6 shrink-0">
                      <AvatarFallback
                        className={cn(
                          "text-[9px] font-semibold",
                          requesterAvatarColor.bg,
                          requesterAvatarColor.fg,
                        )}
                      >
                        {initialsOf(detail.requester)}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="sm"
                      disabled={!draft.trim()}
                      onClick={handleSend}
                    >
                      Send
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Posts to {detail.teamsChannel} · {id}
                </p>
              </>
            }
          />
        </div>

        {/* Rail — same wrapper classes as RequestWindow.tsx's own reference
            column (width, sticky, pt-5), so the two line up structurally
            even though this one's content differs. */}
        <div className="w-full space-y-4 pt-5 lg:w-[260px] lg:shrink-0 lg:self-start lg:sticky lg:top-0">
          <RequestRecordRail
            ref={railRef}
            detail={detail}
            status={status}
            onOpenPo={() => setPoOpen(true)}
          />
        </div>
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
