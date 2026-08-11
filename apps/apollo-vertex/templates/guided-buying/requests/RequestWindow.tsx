"use client";

import { useClipboard } from "@mantine/hooks";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useReducedMotion } from "framer-motion";
import {
  Check,
  CheckCircle2,
  Eye,
  Link as LinkIcon,
  ListOrdered,
  type LucideIcon,
  MessageSquareText,
  MoreVertical,
  TriangleAlert,
} from "lucide-react";
import { useRef, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/components/ui/button-group";
import {
  PageHeader,
  PageHeaderActions,
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ConfirmCheck } from "../ConfirmCheck";
import { CATALOG_ITEMS, leadTime } from "../catalog/v1/data";
import { P1 } from "../P1";
import { P2 } from "../P2";
import { ActivityTrack } from "./ActivityTrack";
import { avatarColorFor } from "./avatar-color";
import { CommunicationCard } from "./CommunicationCard";
import {
  buildChecks,
  DECISION_DETAILS,
  daysSince,
  getDecisionDetail,
  getRequestDetail,
  getRequestRow,
  REQ_2052_APPROVED_DATE,
} from "./data";
import { ReceiptModal } from "./ReceiptModal";
import { RecordCard } from "./RecordCard";
import { RecordEntry } from "./RecordEntry";
import { noteProvenance, useRequests } from "./requests-context";
import {
  advanceStagesThrough,
  applyReceiptFlags,
  buildTrackStages,
  toDisplayStages,
} from "./stage-display";
import { TruncatedSubtitle } from "./TruncatedSubtitle";

// ESCALATE: wording. States the relationship between stages that the
// tracker's two label rows can't on their own — who holds the request now,
// and what happens once they clear it — templated over the same fields
// feeding the tracker itself, not authored narration. Three cases, one per
// stage this app can ever show as current (see trackStagesApproved/
// trackStagesOrdered — Submitted is always done, never current).
function buildProgressDescription(
  currentStageLabel: string | undefined,
  context: {
    approverFullName?: string;
    shippingEstimate?: string;
    needBy?: string;
  },
): string | null {
  if (currentStageLabel === "Approved") {
    const approver = context.approverFullName ?? "Your approver";
    return context.shippingEstimate
      ? `${approver} has it now. Once approved, we'll place the order (${context.shippingEstimate.toLowerCase()}).`
      : `${approver} has it now. Once approved, we'll place the order.`;
  }
  if (currentStageLabel === "Ordered") {
    return context.needBy
      ? `We have it now. Once the order ships, it's on its way to you by ${context.needBy}.`
      : `We have it now. Once the order ships, it's on its way to you.`;
  }
  if (currentStageLabel === "Received") {
    return context.needBy
      ? `It's on its way to you now, expected by ${context.needBy}. Once it arrives, you can confirm receipt to close this out.`
      : `It's on its way to you now. Once it arrives, you can confirm receipt to close this out.`;
  }
  return null;
}

// ─── Activity record — chronological entries ──────────────────────────────────

/** The record's last entry, always: who this is currently with and whether
 * they've replied. Plain, like every entry above it — it's the record's
 * last item, not a callout, so no filled/bordered box; the small dot is
 * enough to mark it as the live state rather than a past event. */
function WaitingBanner({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
      <span
        className="ml-[9px] size-1.5 shrink-0 rounded-full bg-insight-500"
        aria-hidden
      />
      {text}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * Full-page request detail at /requests/$id. Lifts all logic from PanelBody
 * (thread, urgent, send) — swaps Sheet chrome for a page header with back nav.
 * Tracking-first, not decision support: the tracker is the primary surface,
 * with an attention row that only appears when the request is genuinely off
 * its expected path — nothing here narrates what the tracker and
 * Communication already show.
 */
export function RequestWindow() {
  const { id } = useParams({ from: "/requests/$id" });
  const navigate = useNavigate();
  const {
    threads,
    addNote,
    urgent,
    markUrgent,
    submittedRows,
    receipts,
    confirmReceipt,
    requestStatusOverrides,
    fieldExceptions,
  } = useRequests();
  const reduceMotion = useReducedMotion();

  const [draft, setDraft] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const clipboard = useClipboard({ timeout: 1500 });
  const composerRef = useRef<HTMLTextAreaElement>(null);

  const detail = getRequestDetail(id);
  // A request submitted this session (via the Buy flow) wins over the static
  // seed row for the same id — same precedence as the Requests list.
  const row = submittedRows.find((r) => r.id === id) ?? getRequestRow(id);

  if (!detail) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Request not found.</p>
      </div>
    );
  }

  const notes = threads[id] ?? [];
  const isUrgent = urgent[id] === true;
  // Same record RequestRecordRail reads on the approver's side — this
  // surface and that one are separate components (no shared persona prop),
  // so the same lookup is duplicated here rather than shared.
  const shipException = (fieldExceptions[id] ?? []).find(
    (e) => e.field === "Ship to",
  );
  // Written by DecisionWindow's Approve action. P1 and P2 both read it —
  // P2 additionally treats it as "ordered" at render time, in the P2-gated
  // blocks below, never by writing a second status value.
  const isApproved = requestStatusOverrides[id] === "approved";
  // The verbatim prompt for the sidebar's "Your request" field — a live
  // submission's captured text first, then a hand-seeded scenario's own
  // recorded prompt, falling back to the generated title when neither exists.
  const verbatimRequest =
    row?.prompt ?? detail.prompt ?? row?.request ?? detail.request;
  // Same precedence as `row.submitted`/`row.updated` above: a live session's
  // generated title (already what the Requests list shows) wins over the
  // static seed, so the two never disagree the way the old cart-derived
  // title used to.
  const displayTitle = row?.request ?? detail.request;

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    addNote(id, text);
    setDraft("");
  };

  // State detection — mirrors the invoice header's HeaderDecision split
  // button, now driving the header's owed-action gate rather than a
  // per-state primary. "Po-sent"/"delivered"/"sent-back" have no live
  // example in the current seed data except REQ-2031 (delivered) — see
  // report.
  const receivedDone = detail.journeyStages?.some(
    (s) => /received|delivered/i.test(s.label) && s.state === "done",
  );
  // "Ordered" is now shared between the terminal 3-stage flow (REQ-2042,
  // no Received stage at all) and the mid-flow milestone in the 4-stage one
  // (REQ-2052-style) — so "PO sent" is distinguished by having a Received
  // stage that hasn't happened yet, not by stage label alone.
  const hasReceivedStage = detail.journeyStages?.some((s) =>
    /received/i.test(s.label),
  );
  const orderedDone = detail.journeyStages?.some(
    (s) => s.label === "Ordered" && s.state === "done",
  );
  const poSentDone =
    hasReceivedStage === true && orderedDone === true && receivedDone !== true;
  const isApprovedOrPoSent = row?.status === "approved" || poSentDone === true;
  const isTerminal = !detail.inFlight;

  const cardState = detail.sentBack
    ? "sent-back"
    : receivedDone
      ? "delivered"
      : poSentDone
        ? "po-sent"
        : isApprovedOrPoSent
          ? "approved"
          : isTerminal
            ? "ordered"
            : "pending";

  // The requester's own confirmation that goods arrived — set only once
  // they've been through the modal this session, never pre-seeded.
  const receipt = receipts[id];
  const receiptIsPartialOrDamaged =
    receipt != null &&
    (receipt.qtyReceived < receipt.qtyOrdered || receipt.damaged);

  const approverFirstName =
    detail.approver?.split(" · ")[0]?.split(" ")[0] ?? "procurement";

  const focusComposer = () => {
    composerRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    composerRef.current?.focus();
  };

  // The header always exposes exactly one action, so it's never just a
  // bare overflow trigger — an owed action (Respond, Confirm receipt) when
  // one exists, otherwise the single most relevant convenience for this
  // state; everything else stays one click away in the overflow.
  const headerPrimaryKind =
    cardState === "sent-back"
      ? "respond"
      : cardState === "delivered" && receipt == null
        ? "confirm-receipt"
        : cardState === "approved" || cardState === "po-sent"
          ? "view-order"
          : cardState === "ordered"
            ? "reorder"
            : "copy-link";

  const copyLink = () => {
    clipboard.copy(window.location.href);
    setMenuOpen(false);
  };

  const headerPrimaryAction =
    headerPrimaryKind === "respond"
      ? { label: "Respond", onClick: focusComposer }
      : headerPrimaryKind === "confirm-receipt"
        ? { label: "Confirm receipt", onClick: () => setReceiptModalOpen(true) }
        : headerPrimaryKind === "view-order"
          ? {
              label: "View order",
              onClick: () => void navigate({ to: "/catalog" }),
            }
          : headerPrimaryKind === "reorder"
            ? { label: "Reorder", onClick: () => void navigate({ to: "/buy" }) }
            : {
                label: clipboard.copied ? "Copied!" : "Copy link",
                onClick: copyLink,
              };

  const approverInitials =
    detail.approver
      ?.split(" · ")[0]
      ?.split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "?";

  const requesterInitials =
    row?.requester
      ?.split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "?";

  const approverFullName = detail.approver?.split(" · ")[0];
  const approverFirst = approverFullName?.split(" ")[0];
  const supplierName = row?.supplier;

  // Need-by proximity chip — only surfaced once it's close enough to matter,
  // either side of the date. Comfortably-ahead dates get no chip at all.
  const needByDaysLeft = detail.summary?.needByDaysLeft;
  const needByBadge =
    needByDaysLeft == null
      ? null
      : needByDaysLeft < 0
        ? {
            label: `${Math.abs(needByDaysLeft)} day${Math.abs(needByDaysLeft) === 1 ? "" : "s"} overdue`,
            status: "error" as const,
          }
        : needByDaysLeft <= 3
          ? {
              label: `${needByDaysLeft} day${needByDaysLeft === 1 ? "" : "s"} left`,
              status: "warning" as const,
            }
          : null;

  // Only used once a request actually reaches "delivered" (see the receipt
  // modal below) — REQ-2052 never sets a Received-stage date (no real basis
  // to project one), so this stays undefined for it.
  const expectedReceivedDate = detail.journeyStages?.find(
    (s) => s.label === "Received",
  )?.date;
  // The one supplier fact this scenario actually has a basis for — the
  // catalog record's own stocking lead time, a duration fact rather than a
  // projected calendar date. Feeds the Ordered stage's sub-label below.
  const suppliedItem = CATALOG_ITEMS.find((i) => i.id === "lnv-x1c-g12");
  const shippingEstimate =
    suppliedItem != null ? leadTime(suppliedItem) : undefined;

  // Same derivation the approver's own decision card tracker uses (see
  // stage-display.ts) — one function, so the isAgent/receipt-flag rules
  // can't drift between the two screens.
  const trackStages = applyReceiptFlags(buildTrackStages(detail), receipt);
  // Once actually approved, the Approved stage's date becomes the real
  // record (the same value DecisionWindow shows), not the pending seed
  // date, which was only ever an expected-by projection.
  const stagesWithApprovalDate = isApproved
    ? trackStages.map((stage) =>
        stage.label === "Approved"
          ? { ...stage, date: REQ_2052_APPROVED_DATE, overdueDays: undefined }
          : stage,
      )
    : trackStages;
  // Two renderings of the same track, gated not branched: P1 shows it
  // advanced past Approval, P2 shows it advanced past Ordering. Only one of
  // the two ever mounts, since only one tier is active at a time.
  const trackStagesApproved = isApproved
    ? advanceStagesThrough(stagesWithApprovalDate, "Approved")
    : trackStages;
  const trackStagesOrdered = isApproved
    ? advanceStagesThrough(stagesWithApprovalDate, "Ordered")
    : trackStages;
  const displayStageContext = {
    approverFullName,
    shippingEstimate,
    needBy: detail.summary?.needBy,
  };
  // Hoisted so the same transformed arrays feed both the tracker and the
  // progress description below, instead of recomputing per consumer.
  const displayStagesApproved = toDisplayStages(
    trackStagesApproved,
    displayStageContext,
  );
  const displayStagesOrdered = toDisplayStages(
    trackStagesOrdered,
    displayStageContext,
  );
  const progressDescriptionApproved = buildProgressDescription(
    trackStagesApproved.find(
      (s) => s.state === "active" || s.state === "active-warning",
    )?.label,
    displayStageContext,
  );
  const progressDescriptionOrdered = buildProgressDescription(
    trackStagesOrdered.find(
      (s) => s.state === "active" || s.state === "active-warning",
    )?.label,
    displayStageContext,
  );

  // Off path: the same signal that already colors a stage's date text amber
  // (see ActivityTrack's dateClass), so the attention row's own visibility
  // is derived from the identical data driving the sub-labels above, not a
  // second judgment call. Reads trackStagesApproved specifically, not
  // stagesWithApprovalDate — advanceStagesThrough is what actually flips
  // Approved to "done" once isApproved, clearing active-warning; the
  // un-advanced array keeps that state regardless of approval. P1/P2 agree
  // on whether Approved itself is done (they only differ on how far past
  // it "done" extends), so either tier's array gives the same answer here.
  const lateStage = trackStagesApproved.find(
    (s) => s.state === "active-warning",
  );
  const isOffPath = lateStage != null;
  const overdueDays = lateStage?.overdueDays ?? 0;

  // The approver's own decision packet — same record DecisionWindow/
  // Approvals read, so the findings below and the approver's own "What I
  // checked" can't disagree. Absent for any request that never reached
  // procurement's decision queue (see report — only REQ-2052/2054/2055/2056
  // have one today).
  const decisionDetail = getDecisionDetail(id);
  const checks = decisionDetail != null ? buildChecks(decisionDetail) : null;
  const clearedCount = checks?.filter((c) => c.status === "pass").length;
  // Signal, not silence: how many of the same approver's OTHER decisions,
  // submitted after this one, have already been decided — the actual cause
  // when nothing about the queue or the request itself is holding this up.
  // Same sources as before (DECISION_DETAILS, requestStatusOverrides,
  // submitted date via daysSince), no new fields.
  const decidedAfterCount =
    decisionDetail != null
      ? Object.values(DECISION_DETAILS).filter(
          (d) =>
            d.id !== decisionDetail.id &&
            d.approver === decisionDetail.approver &&
            requestStatusOverrides[d.id] != null &&
            daysSince(d.submitted) < daysSince(decisionDetail.submitted),
        ).length
      : null;

  // ESCALATE: wording for all three, and the section header ("What I found
  // out"). A finding whose value is zero, empty, or unavailable is omitted
  // outright rather than rendered as a negative statement — the one
  // exception is finding 1's bracketed gap, which stays (just tightened),
  // since "not tracked" is itself the honest answer, not a null result to
  // hide. The block itself renders nothing below the tracker when the
  // filtered list comes up empty — see the render below.
  const findings: { icon: LucideIcon; text: string }[] = [
    isOffPath
      ? {
          icon: Eye,
          // GAP: no last-viewed/last-seen timestamp exists anywhere in the
          // data model, keyed to an approver or otherwise (see report) —
          // bracketed to the missing datum only, not the whole clause.
          // "No decision has followed" is derived (isOffPath is exactly
          // that fact), not part of the gap.
          text: `${approverFullName ?? "Your approver"} last viewed this request [not tracked]. No decision has followed yet.`,
        }
      : null,
    decidedAfterCount != null && decidedAfterCount > 0
      ? {
          icon: ListOrdered,
          text: `${approverFullName ?? "Your approver"} has decided ${decidedAfterCount} request${decidedAfterCount === 1 ? "" : "s"} that arrived after this one.`,
        }
      : null,
    // Suppresses only when the source itself is empty (no decision record,
    // or somehow no checks on one) — not because "nothing blocking" reads
    // as a negative sentence. "4 of 4 cleared" is a real derived count,
    // same one the approver's own "What I checked" reports, and stays
    // exactly that regardless of how many of the four actually cleared.
    checks != null && checks.length > 0
      ? {
          icon: CheckCircle2,
          text: `Nothing in the request itself is blocking. ${clearedCount} of ${checks.length} checks cleared.`,
        }
      : null,
  ].filter((f): f is { icon: LucideIcon; text: string } => f != null);

  // Overdue chip — sits next to the Need by date now, since it's the
  // approver's lateness against that deadline, not a general status word.
  const overdueLabel = isOffPath
    ? `${overdueDays} day${overdueDays === 1 ? "" : "s"} overdue`
    : null;

  // Header Status field — the general state of the request, derived from
  // the same stage state driving the tracker. "In review" replaces the old
  // "Pending" wording: the approver is actively looking at it, not waiting
  // in an untouched queue.
  const statusLabel = isApproved
    ? "Approved"
    : cardState === "sent-back"
      ? "Sent back"
      : cardState === "delivered"
        ? "Delivered"
        : cardState === "po-sent" || cardState === "ordered"
          ? "Ordered"
          : cardState === "approved"
            ? "Approved"
            : "In review";

  // Same value the Submitted stage's own date on the tracker shows — row's
  // own field first (matches what My Requests already lists for this
  // request), the journey stage as a fallback for a live submission that
  // has a detail record but no seed row yet.
  const dateRequested =
    row?.submitted ??
    detail.journeyStages?.find((s) => s.label === "Submitted")?.date;

  // Messages and messages sent on the requester's behalf, in the order they
  // happened — not status changes, those live on the track above, not here.
  type LogEntry =
    | { kind: "agent"; text: string; timestamp?: string }
    | {
        kind: "user";
        text: string;
        timestamp: string;
        provenance?: string;
        /** Who actually wrote it — a thread note can come from anyone in
         * the conversation, not only the requester this page belongs to. */
        author?: string;
      }
    | { kind: "approver"; text: string; timestamp?: string };
  const activityLog: LogEntry[] = [];
  if (detail.threadSeedMessage != null) {
    activityLog.push({
      kind: "user",
      text: detail.threadSeedMessage,
      timestamp: `2:14 PM · ${approverFirstName} was notified`,
    });
  }
  for (const note of notes) {
    activityLog.push({
      kind: "user",
      text: note.text,
      // Time only — RecordEntry already renders `author` as the name
      // above this line, matching the approver's own Communication card
      // (`timestamp={note.time}`). Repeating the name here duplicated it.
      timestamp: note.time,
      provenance: noteProvenance(
        note,
        detail.teamsChannel ?? "[Teams channel name]",
      ),
      author: note.author,
    });
  }
  if (detail.nudgeText != null) {
    // Pushed after the thread notes, not before — chronologically this is
    // the most recent thing that happened (a reminder sent because the
    // conversation above stalled with no decision following it), so it
    // belongs at the bottom of the log, nearest the live "waiting" state,
    // not ahead of the exchange it's reacting to. Plain fact, not the
    // "Pending N days..." framing that used to also appear in the old
    // summary headline and the "Nudged today" button — this is just the
    // one thing that happened, not a retelling of why.
    activityLog.push({
      kind: "agent",
      text: `I sent ${approverFirst ?? "them"} a reminder`,
      timestamp: "This morning",
    });
  }
  // The confirmation itself is a record entry too — quantity received and
  // any note, attributed to the requester who submitted it.
  if (receipt != null) {
    const parts = [`Received ${receipt.qtyReceived} of ${receipt.qtyOrdered}.`];
    if (receipt.damaged) parts.push("Flagged as damaged or incorrect.");
    if (receipt.note) parts.push(receipt.note);
    activityLog.push({
      kind: "user",
      text: parts.join(" "),
      timestamp: receipt.confirmedAt,
    });
  }
  // Stays in the record in both tiers — P2 appends a second entry beneath
  // it (see the P2-gated entry below the map), it never replaces this one.
  // This is also the one fact the old AI-summary sentence's own P2 fragment
  // duplicated ("I placed the order with {supplier}") — deleting that
  // sentence loses nothing, since this entry already says it.
  if (isApproved) {
    activityLog.push({
      kind: "approver",
      text: `${approverFullName ?? "Your approver"} approved this request.`,
      timestamp: "Just now",
    });
  }
  // The record always closes on the live state — who it's with, and
  // whether they've replied. Only "pending" and "ordered" have a live data
  // example; the rest are generic but unverified visually (see report).
  const waitingLine =
    cardState === "sent-back"
      ? `Sent back by ${approverFullName ?? "your approver"}. Awaiting your reply.`
      : cardState === "delivered"
        ? receipt == null
          ? "Delivered. Awaiting your confirmation."
          : !receiptIsPartialOrDamaged
            ? "Delivered and confirmed. Nothing further to do."
            : "Delivered. Receipt confirmed with an open issue. Not fully closed."
        : cardState === "po-sent"
          ? `PO sent to ${supplierName ?? "the supplier"}. Awaiting delivery.`
          : cardState === "approved"
            ? `Approved by ${approverFullName ?? "your approver"}.`
            : cardState === "ordered"
              ? "Ordered. Nothing further to do."
              : `Waiting on ${approverFirstName}. No reply yet.`;

  // Suggested quick replies above the composer — populate the draft rather
  // than send outright, so there's still a chance to review or edit first.
  const suggestedMessages =
    cardState === "sent-back"
      ? ["Here's the updated version.", "Can you clarify what changed?"]
      : [
          `Any update on this, ${approverFirstName}?`,
          "Happy to hop on a call.",
        ];

  // ESCALATE: placeholder wording — direct substitute for the previous
  // agentLine.includes("Alex") string-match, using the approver's name
  // already derived above instead of sniffing prose for it.
  const composerPlaceholder = `Message ${approverFirst ?? "your approver"} about this request`;
  // ESCALATE: posting-destination wording — mirrors the approver's own
  // Communication card line exactly, same bracketed-placeholder convention
  // this file already uses for teamsChannel elsewhere.
  const postingDestinationLine = `Posts to ${detail.teamsChannel ?? "[Teams channel name]"} · ${id}`;

  return (
    <div className="flex h-full flex-col">
      {/* Three regions — title/nav and actions each auto-width (their own
          content, never growing or shrinking), the metadata region between
          them takes the rest (1fr). `!` on the @3xl grid-cols override
          because the registry component's own `has-[[data-slot=
          page-header-content]]:grid-cols-[3fr_6fr_3fr]` rule is a more
          specific selector than a plain override at the same breakpoint —
          same fix this app already uses on the decision view's header for
          the identical problem (a fixed fr-share stealing width from the
          title). px-10: 40px, exactly Tailwind's own spacing-scale step 10
          (2.5rem), not an arbitrary value. This does NOT match the page
          content's own horizontal padding below the header — that's
          responsive (px-4/sm:px-6/lg:px-8 → 16/24/32px) and out of scope
          here (see report). @3xl:gap-0: the grid's own uniform gap is
          replaced by asymmetric margins on Nav/Actions below, since a
          single gap value can't give the title boundary (48px) and the
          actions boundary (32px) two different sizes. Below @3xl, none of
          this applies — that's the registry component's own existing
          wrapped fallback, untouched. shrink-0: a normal-flow sibling of
          the scrolling region below, not an overlay — nothing can scroll
          behind it, so there's no risk of it covering a focus ring or a
          scroll-into-view target the way a position:sticky header could. */}
      <PageHeader
        bordered
        className="shrink-0 px-10 sm:px-10 lg:px-10 @3xl:!grid-cols-[auto_1fr_auto] @3xl:gap-0"
      >
        {/* mr-12 (48px): the title-to-metadata boundary. A grid item's
            margin is included when an `auto` track sizes itself, so this
            pushes the metadata region's own start 48px past the title's
            actual content — not a gap that could grow, a fixed boundary. */}
        <PageHeaderNav className="@3xl:mr-12">
          <PageHeaderBackButton
            onClick={() => void navigate({ to: "/requests" })}
          />
          {/* max-w-[320px]: starting value, not confirmed — see report.
              Caps the subtitle's own growth; the id above never reaches
              this width in practice, so it never truncates. */}
          <PageHeaderTitleGroup className="max-w-[320px]">
            <PageHeaderTitle>{id}</PageHeaderTitle>
            <TruncatedSubtitle text={displayTitle} />
          </PageHeaderTitleGroup>
        </PageHeaderNav>

        {/* Natural width per attribute, equal gaps between them — a grid's
            equal-width columns were leaving slack around a small pill
            (Status) and clipping a wide one (Need by, whose overdue chip
            is wider than an equal share). justify-between distributes
            whatever space is left, after gap-8's 32px minimum, equally
            into those same gaps — the space always goes between the
            attributes, never piles up as one dead gap before the actions.
            Status, Approver, Need by — one reading order across the whole
            header, not clustered against the title. */}
        <PageHeaderContent className="@3xl:justify-between @3xl:gap-8">
          {dateRequested != null && (
            <PageHeaderField className="shrink-0">
              <PageHeaderFieldLabel>Date requested</PageHeaderFieldLabel>
              <PageHeaderFieldValue className="overflow-visible">
                {dateRequested}
              </PageHeaderFieldValue>
            </PageHeaderField>
          )}
          <PageHeaderField className="shrink-0">
            <PageHeaderFieldLabel>Status</PageHeaderFieldLabel>
            <PageHeaderFieldValue className="overflow-visible">
              <Badge variant="secondary" status="info">
                {statusLabel}
              </Badge>
            </PageHeaderFieldValue>
          </PageHeaderField>
          <PageHeaderField className="shrink-0">
            <PageHeaderFieldLabel>Approver</PageHeaderFieldLabel>
            <PageHeaderFieldValue className="flex items-center gap-1.5 overflow-visible">
              <Avatar className="size-[18px] shrink-0">
                <AvatarFallback
                  className={cn(
                    "text-[8px] font-semibold",
                    avatarColorFor(approverFullName ?? "Your approver").bg,
                    avatarColorFor(approverFullName ?? "Your approver").fg,
                  )}
                >
                  {approverInitials}
                </AvatarFallback>
              </Avatar>
              {approverFullName ?? "Unassigned"}
            </PageHeaderFieldValue>
          </PageHeaderField>
          {/* Approver-lateness (overdueLabel) takes priority over the plain
              proximity chip (needByBadge) since it's the more specific,
              more urgent fact; the two never both apply here, since
              need-by-proximity hasn't also tripped for this request. The
              chip is the widest, right-most element in this field — the
              32px actions clearance (see PageHeaderActions below) is
              measured from its edge, not the date's, simply because
              nothing here clips or shrinks it out of that position. */}
          {detail.summary?.needBy != null && (
            <PageHeaderField className="shrink-0">
              <PageHeaderFieldLabel>Need by</PageHeaderFieldLabel>
              <PageHeaderFieldValue className="flex items-center gap-1.5 overflow-visible">
                {detail.summary.needBy}
                {overdueLabel != null ? (
                  <Badge status="warning" variant="secondary">
                    {overdueLabel}
                  </Badge>
                ) : (
                  needByBadge != null && (
                    <Badge status={needByBadge.status} variant="secondary">
                      {needByBadge.label}
                    </Badge>
                  )
                )}
              </PageHeaderFieldValue>
            </PageHeaderField>
          )}
        </PageHeaderContent>

        {/* ml-8 (32px): the metadata-to-actions boundary, same fixed-margin
            technique as PageHeaderNav's mr-12 above. */}
        <PageHeaderActions className="@3xl:ml-8">
          {/* Always a ButtonGroup: one exposed action (never a bare overflow
              trigger with nothing to say), the rest one click away. View
              order/Reorder/Copy link are each the exposed action for
              exactly the states they used to only appear in the overflow
              for, so they're never shown in both places at once. */}
          <ButtonGroup>
            <Button
              variant={
                headerPrimaryKind === "copy-link" ? "secondary" : "default"
              }
              onClick={headerPrimaryAction.onClick}
            >
              {headerPrimaryAction.label}
            </Button>
            <ButtonGroupSeparator
              className={
                headerPrimaryKind === "copy-link" ? undefined : "bg-primary-600"
              }
            />
            <Popover open={menuOpen} onOpenChange={setMenuOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant={
                    headerPrimaryKind === "copy-link" ? "secondary" : "default"
                  }
                  aria-label="More actions"
                >
                  <MoreVertical className="size-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-56 p-1">
                {headerPrimaryKind !== "copy-link" && (
                  <button
                    type="button"
                    className="flex w-full items-center rounded-sm px-3 py-2 text-left text-sm font-medium hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    onClick={copyLink}
                  >
                    {clipboard.copied ? "Copied!" : "Copy link"}
                  </button>
                )}
                <div className="my-1 h-px bg-border" />
                {/* No cancellation flow exists in the data model yet (no
                    "cancelled" status, no runtime action) — see report. */}
                <button
                  type="button"
                  className="flex w-full items-center rounded-sm px-3 py-2 text-left text-sm font-medium text-destructive hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  onClick={() => setMenuOpen(false)}
                >
                  Cancel request
                </button>
              </PopoverContent>
            </Popover>
          </ButtonGroup>
        </PageHeaderActions>
      </PageHeader>

      {/* Two columns, one shared scroll: the previous per-column
          overflow-y-auto was clipping the glass card's glow on its right
          edge, since setting overflow-y alone forces the browser to clip
          overflow-x too (the CSS spec resolves a 'visible' x-axis to
          'auto' whenever y isn't 'visible'), and the card's glow bleeds a
          few px past its own box into that column's own edge. The whole
          page scrolling together avoids that entirely, with the sidebar
          pinned via sticky instead of running its own independent scroll. */}
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pt-8 pb-16 sm:px-6",
          "[mask-image:linear-gradient(to_bottom,transparent,black_24px)]",
          "lg:flex-row lg:gap-8 lg:px-8",
        )}
      >
        {/* ── Main column ──────────────────────────────────────────────── */}
        <div className="min-w-0 space-y-5 lg:flex-1">
          {/* The confirmation moment — reuses the Done screen's check
              animation once, the instant `receipt` first appears. Stays in
              this state afterward: there's nothing further to summarize as
              an "AI" moment once the requester themself has confirmed the
              outcome. Sits above the tracker rather than inside a card of
              its own — the tracker/attention row have nothing left to say
              once a receipt exists, so this is the whole page's one thing
              to lead with in that state. */}
          {receipt != null && (
            <div className="flex flex-col items-center text-center">
              <ConfirmCheck reduceMotion={reduceMotion} />
              <p className="mt-3 text-base font-bold tracking-tighter text-foreground">
                Receipt confirmed
              </p>
            </div>
          )}

          {/* Tracker — the primary surface. Two label rows per stage (see
              toDisplayStages): who it's currently waiting on, and what that
              means for when the requester actually gets the goods. The AI
              zone beneath is the only place this page still speaks in the
              AI's own voice, and only when something is genuinely off
              path. Shared card template — see RecordCard.tsx; the approver's
              decision card is the same component, persona content only. */}
          <RecordCard
            label="Progress"
            caveatPlacement="footer"
            description={
              <>
                <P1>
                  {progressDescriptionApproved != null && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {progressDescriptionApproved}
                    </p>
                  )}
                </P1>
                <P2>
                  {progressDescriptionOrdered != null && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {progressDescriptionOrdered}
                    </p>
                  )}
                </P2>
              </>
            }
            primaryContent={
              detail.journeyStages != null ? (
                <>
                  <P1>
                    <ActivityTrack stages={displayStagesApproved} />
                  </P1>
                  <P2>
                    <ActivityTrack stages={displayStagesOrdered} />
                  </P2>
                </>
              ) : undefined
            }
            aiHeading="What I found out"
            aiContent={
              isOffPath && findings.length > 0 ? (
                <div className="space-y-3">
                  {findings.map((finding) => {
                    const Icon = finding.icon;
                    return (
                      <div
                        key={finding.text}
                        className="flex items-center gap-2.5"
                      >
                        <Icon
                          className="size-4 shrink-0 text-muted-foreground"
                          aria-hidden
                        />
                        <p className="text-left text-xs text-foreground">
                          {finding.text}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : undefined
            }
            actions={
              isOffPath ? (
                <>
                  {detail.nudgeText != null && (
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Check className="size-3.5" aria-hidden />
                      Nudged today
                    </span>
                  )}
                  <Button size="sm" variant="outline" onClick={focusComposer}>
                    <MessageSquareText className="size-3.5" aria-hidden />
                    Ask {approverFirst ?? "your approver"}
                  </Button>
                  {isUrgent ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled
                      className="disabled:opacity-100"
                    >
                      <Check className="size-3.5" aria-hidden />
                      Marked urgent today
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => markUrgent(id)}
                    >
                      <TriangleAlert className="size-3.5" aria-hidden />
                      Mark urgent
                    </Button>
                  )}
                </>
              ) : undefined
            }
          />

          {/* Communication — messages and messages sent on the requester's
              behalf, closing on the live waiting state. Status changes live
              on the track above, not here. Sizes to its own content — the
              composer sits directly beneath the last message, not pinned
              to a filled column height (that produced an empty box on a
              short thread, which is most of this demo, and sizing to
              content also keeps the long-thread scroll question moot for
              the glass card's own documented glow-clipping constraint).
              Shared shell — see CommunicationCard.tsx; the approver's
              Communication card is the same component. */}
          <CommunicationCard
            entries={
              <>
                {activityLog.map((entry, i) => (
                  <RecordEntry
                    key={i}
                    isPerson={entry.kind !== "agent"}
                    initials={
                      entry.kind === "approver"
                        ? approverInitials
                        : entry.kind === "user" && entry.author != null
                          ? entry.author
                              .split(" ")
                              .map((w) => w[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()
                          : requesterInitials
                    }
                    name={
                      entry.kind === "user"
                        ? (entry.author ?? row?.requester ?? "You")
                        : entry.kind === "approver"
                          ? (approverFullName ?? "Your approver")
                          : "AI Assistant"
                    }
                    timestamp={entry.timestamp}
                    text={entry.text}
                    provenance={
                      entry.kind === "user" ? entry.provenance : undefined
                    }
                  />
                ))}
                {/* P2-only — the P1 entry above stays, this appends beneath
                    it rather than replacing it. */}
                <P2>
                  {isApproved && (
                    <RecordEntry
                      isPerson={false}
                      name="AI Assistant"
                      timestamp="Just now"
                      text={`I placed the order with ${supplierName ?? "the supplier"} after ${approverFullName ?? "your approver"} approved.`}
                    />
                  )}
                </P2>
                {/* Not rendered once approved — there's no one left to be
                    waiting on, so no replacement text either. */}
                {!isApproved && <WaitingBanner text={waitingLine} />}
              </>
            }
            composer={
              // Composer — inFlight only; terminal-state actions live in
              // the sidebar.
              detail.inFlight ? (
                <>
                  {isUrgent && (
                    <div className="flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm">
                      <TriangleAlert
                        className="size-4 shrink-0 text-warning"
                        aria-hidden
                      />
                      <span className="text-foreground">
                        Marked urgent. Procurement has been notified.
                      </span>
                    </div>
                  )}

                  {/* Suggested replies — populate the draft, don't send
                      outright, so there's still a chance to review or edit. */}
                  <div className="flex flex-wrap gap-1.5">
                    {suggestedMessages.map((msg) => (
                      <button
                        key={msg}
                        type="button"
                        className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                        onClick={() => {
                          setDraft(msg);
                          composerRef.current?.focus();
                        }}
                      >
                        {msg}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2">
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
                            send();
                        }}
                        placeholder={composerPlaceholder}
                        rows={2}
                        className="block min-h-[72px] w-full resize-none rounded-t-lg bg-background px-3 py-3.5 text-sm text-foreground outline-none placeholder:text-muted-foreground dark:bg-input/30"
                      />
                      <div className="h-px bg-border" />
                      <div className="flex items-center justify-between gap-2 rounded-b-lg bg-background p-2 dark:bg-input/30">
                        <Avatar className="size-6 shrink-0">
                          <AvatarFallback
                            className={cn(
                              "text-[9px] font-semibold",
                              avatarColorFor(
                                approverFullName ?? "Your approver",
                              ).bg,
                              avatarColorFor(
                                approverFullName ?? "Your approver",
                              ).fg,
                            )}
                          >
                            {approverInitials}
                          </AvatarFallback>
                        </Avatar>
                        <Button
                          size="sm"
                          disabled={!draft.trim()}
                          onClick={send}
                        >
                          Send
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {postingDestinationLine}
                    </p>
                  </div>
                </>
              ) : undefined
            }
          />
        </div>

        {/* ── Reference column — what's in it, rarely visited. Plain list on
            the page background: no border, no fill, narrow enough (~260px)
            that it reads as reference material, not a competing column.
            pt-5 lines its first label up with the lead card's first content
            line (20px below its own top edge), not the card's outer edge —
            the wrapper's own pt-8 already accounts for the rest, uniformly
            for both columns now. space-y-4 (16px) is the field-to-field
            rhythm; the divider before linked records rides the same rhythm
            for 16px on both sides. Sticky (lg: only — mobile stays one
            plain stacked column) rather than its own independent scroll,
            so it stays in view as the page scrolls without stretching to
            match the main column's height (self-start is what lets it be
            shorter than its flex sibling in the first place). */}
        <div className="w-full space-y-4 pt-5 lg:w-[260px] lg:shrink-0 lg:self-start lg:sticky lg:top-0">
          <p className="text-base font-bold tracking-tighter text-foreground">
            Request details
          </p>
          {/* Total/Need by/Approver/Status moved to the header's metadata
              strip — keeping them here too would just duplicate them. */}
          {detail.summary?.items != null && (
            <div>
              <p className="text-sm text-muted-foreground">Items</p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {detail.summary.items}
                {detail.summary.total != null && (
                  <span className="font-normal text-muted-foreground">
                    {" "}
                    · {detail.summary.total}
                  </span>
                )}
              </p>
            </div>
          )}
          {row?.supplier != null && (
            <div>
              <p className="text-sm text-muted-foreground">Supplier</p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {row.supplier}
              </p>
            </div>
          )}
          {detail.shipTo != null &&
            (() => {
              // Split "location · address" across two lines rather than
              // wrapping the whole string mid-phrase at the column's width.
              const [shipLocation, shipAddress] = detail.shipTo.split(" · ");
              return (
                <div>
                  <p className="text-sm text-muted-foreground">Ship to</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {shipLocation}
                  </p>
                  {shipAddress != null && (
                    <p className="text-sm font-semibold text-foreground">
                      {shipAddress}
                    </p>
                  )}
                  {shipException && (
                    <p className="text-xs text-muted-foreground">
                      Ships here if the exception is declined.
                    </p>
                  )}
                  {shipException && (
                    <div className="mt-2 space-y-1.5 rounded-none border-l-2 border-warning py-1 pl-3">
                      <Badge variant="secondary" status="warning">
                        Exception requested
                      </Badge>
                      <p className="text-xs font-medium text-foreground">
                        {shipException.requestedValue}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {`${shipException.ownerName} decides. Visible to ${approverFullName ?? "your approver"} and procurement.`}
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}
          {detail.costCenter != null &&
            (() => {
              // Same split: department name on its own line, cost centre
              // code beneath it.
              const [department, costCode] = detail.costCenter.split(" · ");
              return (
                <div>
                  <p className="text-sm text-muted-foreground">Charged to</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {department}
                  </p>
                  {costCode != null && (
                    <p className="text-sm font-semibold text-foreground">
                      {costCode}
                    </p>
                  )}
                </div>
              );
            })()}
          {/* Only when it says something the header subtitle doesn't
              already — otherwise this is just the same fact twice. */}
          {verbatimRequest !== displayTitle && (
            <div>
              <p className="text-sm text-muted-foreground">Your request</p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {verbatimRequest}
              </p>
            </div>
          )}

          {/* Linked records — the divider before it rides the parent's
              space-y-4 rhythm, so it's 16px below the field above and 16px
              above this label. First chip gets the tinted "link" treatment
              (the PR — always the earliest, most-referenced record); any
              others render plain, same split as before this was data-driven. */}
          {detail.recordChips != null && detail.recordChips.length > 0 && (
            <>
              <div className="h-px bg-border" />
              <div>
                <p className="text-sm text-muted-foreground">Linked records</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {detail.recordChips.map((chip, i) =>
                    i === 0 ? (
                      <span
                        key={chip}
                        className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/8 px-2.5 py-0.5 text-[10.5px] font-semibold text-primary"
                      >
                        <LinkIcon className="size-3 shrink-0" aria-hidden />
                        {chip}
                      </span>
                    ) : (
                      <span
                        key={chip}
                        className="inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-[10.5px] text-muted-foreground"
                      >
                        {chip}
                      </span>
                    ),
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {cardState === "delivered" && (
        <ReceiptModal
          open={receiptModalOpen}
          onOpenChange={setReceiptModalOpen}
          requestId={id}
          deliveryDate={expectedReceivedDate}
          itemDescription={
            detail.summary?.items?.replace(/^\d+\s*×\s*/, "") ?? displayTitle
          }
          qtyOrdered={detail.summary?.qty ?? 0}
          onConfirm={(submission) => {
            confirmReceipt(id, {
              qtyOrdered: detail.summary?.qty ?? 0,
              qtyReceived: submission.qtyReceived,
              damaged: submission.damaged,
              note: submission.note,
            });
          }}
        />
      )}
    </div>
  );
}
