"use client";

// oxlint-disable max-lines -- the approver decision view: one header, one
// record card assembling shared zones, one communication card, and the
// PO sheet, deliberately kept in one file (see the report).

import { useNavigate, useParams } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/components/ui/button-group";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  AgentSummary,
  type SummaryMark,
  SummaryMarkSpan,
} from "../AgentSummary";
import type { Exception } from "../data/exceptions";
import { ph } from "../data/placeholders";
import { TERM_YEARS } from "../data/req-10482";
import { ExceptionEvidence, exceptionHeadline } from "../ExceptionEvidence";
import { P2 } from "../P2";
import { ActivityTrack } from "./ActivityTrack";
import { avatarColorFor } from "./avatar-color";
import { CommunicationCard } from "./CommunicationCard";
import {
  ACTION_LABEL,
  type ActionKey,
  resolveActionOrder,
  splitActionOrder,
} from "./DecisionActionGroup";
import { DecisionChecks } from "./DecisionChecks";
import {
  ATTACHMENT_STATE_LABEL,
  buildChecks,
  DECISION_STATUS_META,
  type DecisionDetail,
  type DecisionStatus,
  getDecisionDetail,
  getRequestDetail,
  type RailFieldKey,
  REQ_2052_APPROVED_DATE,
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

function handleCopyLink() {
  void navigator.clipboard.writeText(window.location.href);
}

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** P2-only multi-year commitment (Chunk C2, replacing what section 6,
 * module 1 rendered through the C1 cleanup: the same BudgetImpactCallout
 * the rail already shows). That was the same card twice, once in the rail
 * (P1) and once here — this rail card stays exactly as it is (untouched,
 * see the report); this module now states a fact the rail can't: J3-18's
 * own source covers the annual figure fitting the budget and what remains
 * this year (both already in the rail, via BudgetImpactCallout), plus
 * years 2 and 3, confirmed at renewal — the net-new fact, and the reason
 * this module still earns a place next to the rail's own card instead of
 * repeating it. No figure appears twice under two labels: this reads only
 * the renewal horizon, nothing the rail already states.
 *
 * Every figure derives from `recurringCommitment`/`TERM_YEARS`; the
 * sentence itself is a content ruling, bracketed (PH-56) the same way
 * every other module's wording on this page already is. Same `<P2>` gate
 * as before (see the call site), not a second one. Apollo Vertex has no
 * surface component built for a multi-year commitment readout specifically
 * (checked: no timeline/roadmap/milestone primitive in the registry) — the
 * closest existing surface is the same `Card variant="glass"` shape every
 * other module on this page already uses, not a new one. See the report. */
function MultiYearCommitmentModule({
  recurringCommitment,
}: {
  recurringCommitment: NonNullable<DecisionDetail["recurringCommitment"]>;
}) {
  const remainingYears = TERM_YEARS - 1;
  return (
    <Card variant="glass">
      <CardContent>
        <p className="text-xs text-muted-foreground">
          {ph(
            "PH-56",
            `${remainingYears} more year${remainingYears === 1 ? "" : "s"} confirmed at renewal, ${recurringCommitment.total} total over the ${recurringCommitment.term} term`,
          )}
        </p>
      </CardContent>
    </Card>
  );
}

/** P2-only exceptions resolved (Chunk C1, section 6, module 2): the
 * request's own exceptions.ts records (Chunk B), not re-authored here.
 * Heading and evidence link label are both bracketed placeholders read
 * from the record (escalations 4 and 5), not authored in this component. */
function ExceptionsResolvedModule({
  exceptions,
  heading,
  linkLabel,
  onViewEvidence,
}: {
  exceptions: Exception[];
  heading?: string;
  linkLabel?: string;
  /** Opens the evidence overlay for the clicked exception specifically
   * (Chunk C2: previously one shared no-op for every row). */
  onViewEvidence: (exception: Exception) => void;
}) {
  return (
    <Card variant="glass">
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">{heading}</p>
        <div className="divide-y divide-border">
          {exceptions.map((exception) => (
            <div
              key={exception.id}
              className="flex items-center justify-between gap-3 py-2 text-sm"
            >
              <span className="text-foreground">{exception.headline}</span>
              <button
                type="button"
                onClick={() => onViewEvidence(exception)}
                className="shrink-0 text-xs text-primary underline underline-offset-4"
              >
                {linkLabel}
              </button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

const COMPOSER_MIN_HEIGHT = 72;

/**
 * Approver decision view, /decision/$id. Same two-column template as the
 * requester's own request detail (RequestWindow.tsx): a main column (the
 * decision card, then Communication as a card) and a details rail. The
 * decision card is the shared RecordCard (see RecordCard.tsx). Persona
 * content differs, the zone structure doesn't. The action group renders in
 * two places (header, compact; card, full size) from one ordered list and
 * one set of handlers, never duplicated.
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
  // Evidence and preview overlays (Chunk C2): both reuse the Dialog
  // pattern ReceiptModal.tsx/CorrectionDraftModal.tsx already establish,
  // the same way poOpen above already reuses Sheet for the PO record.
  // evidenceException holds which exception's evidence is open, not just
  // whether one is (the exceptions module's own "view evidence" link is
  // per row, not a single toggle).
  const [evidenceException, setEvidenceException] = useState<Exception | null>(
    null,
  );
  const [previewOpen, setPreviewOpen] = useState(false);
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

  const requesterFirstName = detail.requester.split(" ")[0] ?? detail.requester;
  const requesterAvatarColor = avatarColorFor(detail.requester);
  const approverFirstName = detail.approver.split(" · ")[0] ?? detail.approver;

  // The same checks the AI zone's summary sentence reads from. The list
  // can't assert something the sentence contradicts.
  const checks = buildChecks(detail);
  const deviceStatus = checks.find((c) => c.key === "deviceManagement")?.status;
  const deviceStatusWord = deviceStatus === "pass" ? "ready" : "flagged";
  const hasException = checks.some((c) => c.status === "exception");

  // The budget's own name, not a hardcoded "hardware budget". REQ-2052's
  // is a hardware budget, but the label already carries that; deriving it
  // is what lets this sentence stay correct for a software-budget request.
  const budgetNameRaw = detail.packet.budget.label.split(" · ")[0];
  const budgetName = (
    budgetNameRaw ?? detail.packet.budget.label
  ).toLowerCase();
  const budgetMark: SummaryMark = {
    text: `${detail.packet.budget.pct} of the ${budgetName}`,
    targetField: "budget",
  };
  // expectedDelivery is optional (Chunk C1 cleanup: absent for a request
  // with no physical fulfilment), but this mark only ever renders in the
  // default sentence below, which only renders when `summaryConclusion` is
  // absent — true for every record that still has expectedDelivery. The
  // fallback is unreachable in practice, not a real display value.
  const deliveryMark: SummaryMark = { text: detail.expectedDelivery ?? "" };
  // Same template, different slot. An exception means the sentence can't
  // claim nothing else needs attention, so this clause changes instead of
  // being a second authored sentence.
  const trailingClause = hasException
    ? "so review what's flagged below before deciding"
    : "so nothing else needs your attention";

  // `key` widens to a plain string at the shared SummaryMarkSpan boundary
  // (see ../AgentSummary.tsx); every mark this screen builds still only
  // ever sets a real RailFieldKey, so narrowing back here is safe.
  const handleHighlight = (key: string, options?: { scroll?: boolean }) =>
    railRef.current?.highlightField(key as RailFieldKey, options);

  const order = resolveActionOrder(detail.recommendation);
  // The header exposes the single top-ranked action; everything else,
  // including what used to be the card's own second row action, is one
  // click away behind the overflow. RESOLVED (prompt 31): the card no
  // longer renders its own action row at all, so "Approve" appears exactly
  // once, in the header, not duplicated between the header and the card
  // body as before.
  const { row: headerRow, overflow: headerOverflow } =
    status === "pending"
      ? splitActionOrder(order, 1)
      : { row: [] as ActionKey[], overflow: [] as ActionKey[] };
  const [topHeaderAction] = headerRow;

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

  // GAP: the stage tracker reads RequestDetail.journeyStages, the same
  // source the requester's own page reads, not a second copy. But only
  // REQ-2052 has one today (REQ-2054/2055/2056 have a DecisionDetail with
  // no journeyStages counterpart). The primary-content zone simply doesn't
  // render for those, same "renders nothing when absent" rule this app
  // already follows elsewhere (see RequestWindow.tsx's own gaps).
  const requestDetail = getRequestDetail(id);
  const rawStages =
    requestDetail?.journeyStages == null
      ? requestDetail?.journeyStages
      : applyReceiptFlags(buildTrackStages(requestDetail), receipts[id]);
  const stagesWithApprovalDate =
    !approved || rawStages == null
      ? rawStages
      : rawStages.map((stage) => {
          if (stage.label !== "Approved") return stage;
          const { overdueDays: _overdueDays, ...stageWithoutOverdue } = stage;
          return { ...stageWithoutOverdue, date: REQ_2052_APPROVED_DATE };
        });
  const trackStages =
    !approved || stagesWithApprovalDate == null
      ? stagesWithApprovalDate
      : advanceStagesThrough(stagesWithApprovalDate, "Approved");
  // Sub-labels only where they're decision-relevant (current stage's own
  // expectation, final stage's need-by). The submitted date and the
  // shipping estimate come out; neither changes what the approver decides.
  // The requester's own tracker never runs through simplifyApproverDates.
  const displayStages =
    trackStages == null
      ? trackStages
      : simplifyApproverDates(
          toDisplayStages(
            trackStages,
            { needBy: requestDetail?.summary?.needBy ?? detail.needBy },
            "approver",
          ),
        );

  // ESCALATE: wording. Trimmed to its substance: the AI mark and the zone
  // label already establish that the AI is speaking, so the old "Before
  // this reached you, I confirmed..." / "Now that you've approved it, I
  // sent..." lead-ins were a restatement of that, not new information.
  //
  // Chunk C1: this sentence is REQ-2052 shaped (a device management check,
  // a shipped good) and doesn't generalize to every request type — a
  // software renewal has neither. `detail.summaryConclusion`, when a
  // record supplies one, overrides it entirely rather than adding a third
  // branch here; REQ-2052 (and every other record without one) renders
  // through this exact same code, unchanged.
  const summarySentence = detail.summaryConclusion ? (
    approved ? (
      detail.summaryConclusion.approved
    ) : (
      detail.summaryConclusion.pending
    )
  ) : approved ? (
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
          minimum, all identical values, same tokens.

          Canonical item order, shared with the buyer's own header
          (WorkbenchDetail.tsx): identity, Requested by, Date requested,
          Need by, Status, trailing action (prompt 31). This surface has no
          Value or Assigned to item, so it renders the rest, in this order,
          and omits those two.

          Header back control: this header carries one because it's the
          only path back to the approvals list. The buyer's own header
          doesn't, because his queue pane already carries one; the rule is
          "a back control only where no sibling pane already provides it",
          not a per-surface accident (see WorkbenchDetail.tsx's own header
          comment). */}
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
            <PageHeaderFieldLabel>Date requested</PageHeaderFieldLabel>
            <PageHeaderFieldValue className="overflow-visible">
              {detail.submitted}
            </PageHeaderFieldValue>
          </PageHeaderField>
          <PageHeaderField className="shrink-0">
            <PageHeaderFieldLabel>Need by</PageHeaderFieldLabel>
            <PageHeaderFieldValue className="overflow-visible">
              {detail.needBy}
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
        </PageHeaderContent>

        <PageHeaderActions className="@3xl:ml-8">
          {status === "pending" ? (
            // One exposed action, joined visually to the overflow trigger.
            // Everything else the card offers (the second row action,
            // Reject, Copy link) is one click away, never duplicated as a
            // second button here. Same order/handlers as the card, narrower
            // capacity (see headerRow above).
            <ButtonGroup>
              {topHeaderAction && (
                <Button
                  variant="secondary"
                  onClick={() => handleAction(topHeaderAction)}
                >
                  {ACTION_LABEL[topHeaderAction]}
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
            // overflow trigger. Copy link is the only action, so it's the
            // exposed button, not a one-item ellipsis menu. Default size
            // (no `size="sm"`), matching the requester's own header button.
            <Button variant="secondary" onClick={handleCopyLink}>
              Copy link
            </Button>
          )}
        </PageHeaderActions>
      </PageHeader>

      {/* Two columns, one shared scroll, same wrapper as RequestWindow.tsx,
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
          {/* Glow behind the card, not inside it. AiGlow sits as the
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
                  displayStages == null ? null : (
                    <ActivityTrack
                      stages={displayStages}
                      orientation="vertical"
                    />
                  )
                }
                aiHeading="AI summary"
                aiContent={
                  <AgentSummary
                    conclusion={summarySentence}
                    evidence={<DecisionChecks checks={checks} />}
                  />
                }
              />
            </div>
          </div>

          {/* P2 insert only (Chunk C1, section 6): both modules gated on
              REQ-10482-specific fields (recurringCommitment, exceptions),
              absent on every other record, so this renders nothing for
              REQ-2052 in either tier and nothing at all in P1. Nothing
              above or below this block moves or changes. */}
          <P2>
            {detail.recurringCommitment && (
              <MultiYearCommitmentModule
                recurringCommitment={detail.recurringCommitment}
              />
            )}
            {detail.exceptions && detail.exceptions.length > 0 && (
              <ExceptionsResolvedModule
                exceptions={detail.exceptions}
                heading={detail.exceptionsHeading}
                linkLabel={detail.evidenceLinkLabel}
                onViewEvidence={setEvidenceException}
              />
            )}
          </P2>

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

        {/* Rail, same wrapper classes as RequestWindow.tsx's own reference
            column (width, sticky, pt-5), so the two line up structurally
            even though this one's content differs. */}
        <div className="w-full space-y-4 pt-5 lg:w-[260px] lg:shrink-0 lg:self-start lg:sticky lg:top-0">
          <RequestRecordRail
            ref={railRef}
            detail={detail}
            status={status}
            onOpenPo={() => setPoOpen(true)}
            onPreviewAttachment={() => setPreviewOpen(true)}
          />
        </div>
      </div>

      <SendBackDialog
        open={sendBackOpen}
        onOpenChange={setSendBackOpen}
        onSubmit={handleSendBackSubmit}
      />

      {/* Surfaces the PO without leaving the decision context. The rail's
          Linked records chip opens this once approved. Only mounted when
          poNumber exists (Chunk C1 cleanup: optional now, absent for a
          request no PO will ever exist for) — the rail's own chip that
          calls onOpenPo is already omitted for the same records, so poOpen
          can't become true for them either; this mirrors that condition
          rather than relying only on it never being triggered. */}
      {detail.poNumber != null && (
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
      )}

      {/* Evidence overlay (Chunk C2): the exceptions module's two "view
          evidence" links open the same ExceptionEvidence the workbench
          renders inline for Sam, in place here instead — same Dialog
          pattern as ReceiptModal.tsx/CorrectionDraftModal.tsx, not a
          route. Closes by clearing evidenceException rather than a
          separate open flag, so there's one source of truth for both
          "is it open" and "which exception." */}
      <Dialog
        open={evidenceException != null}
        onOpenChange={(open) => !open && setEvidenceException(null)}
      >
        <DialogContent className="sm:max-w-lg">
          {evidenceException && (
            <>
              <DialogHeader>
                <DialogTitle className="text-balance text-[20px] leading-[1.2]">
                  {exceptionHeadline(evidenceException)}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Evidence for {evidenceException.headline}
                </DialogDescription>
              </DialogHeader>
              <ExceptionEvidence exception={evidenceException} />
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Order form preview (Chunk C2): a stub naming the document and its
          state, not a document renderer — see the report. Same Dialog
          pattern as the evidence overlay above. */}
      {detail.attachment && (
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <FileText
                  className="size-4 shrink-0 text-muted-foreground"
                  aria-hidden
                />
                {detail.attachment.filename}
              </DialogTitle>
              <DialogDescription>
                {ATTACHMENT_STATE_LABEL[detail.attachment.state]}
                {detail.contractReference && ` · ${detail.contractReference}`}
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              {ph("PH-57", "Preview content")}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
