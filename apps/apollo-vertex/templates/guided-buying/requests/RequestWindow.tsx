"use client";

import { useClipboard } from "@mantine/hooks";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useReducedMotion } from "framer-motion";
import {
  Bell,
  Check,
  ChevronDown,
  History,
  Info,
  Link as LinkIcon,
  MoreHorizontal,
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
import { Card, CardContent } from "@/components/ui/card";
import {
  PageHeader,
  PageHeaderActions,
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { AiMark } from "@/registry/ai-mark/ai-mark";
import { ConfirmCheck } from "../ConfirmCheck";
import { type ActivityStage, ActivityTrack } from "./ActivityTrack";
import { getRequestDetail, getRequestRow } from "./data";
import { ReceiptModal } from "./ReceiptModal";
import { RecordEntry } from "./RecordEntry";
import { useRequests } from "./requests-context";

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

// ─── Status card copy helpers ─────────────────────────────────────────────────

const DAY_WORDS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
];

/** Spells out small day counts ("2" → "two") to match the summary's prose voice. */
function spellDays(n: number): string {
  return DAY_WORDS[n] ?? String(n);
}

/** The card's one notable-fact phrase — a soft AI-gradient wash behind the
 * text, emphasis only (the sentence must still read correctly without it).
 * Prefer a short phrase that can't wrap; box-decoration-break: clone is a
 * backstop so a highlight that does wrap across a line still paints as one
 * continuous shape per line instead of the default disconnected slices. */
function Highlight({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="rounded-sm px-1 text-insight-900 dark:text-insight-50"
      style={{
        backgroundImage: "var(--ai-gradient)",
        boxDecorationBreak: "clone",
        WebkitBoxDecorationBreak: "clone",
      }}
    >
      {children}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * Full-page request detail at /requests/$id. Lifts all logic from PanelBody
 * (thread, urgent, send) — swaps Sheet chrome for a page header with back nav.
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
  } = useRequests();
  const reduceMotion = useReducedMotion();

  const [draft, setDraft] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [nudged, setNudged] = useState(false);
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

  // A nudge already went out today whenever the data says so (the summary
  // sentence and thread capsule already describe it) — the button reflects
  // that from the first render, not only after a fresh in-session click.
  const alreadyNudged = nudged || detail.nudgeText != null;

  const focusComposer = () => {
    composerRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    composerRef.current?.focus();
  };

  // The header's primary is only ever an owed action — everything else
  // (View order, Reorder) is a navigational convenience, not an
  // obligation, so it moves to the overflow menu instead. "Confirm receipt"
  // is owed as soon as goods arrive, until the requester confirms it —
  // once confirmed there's nothing further owed, so the header goes quiet.
  const headerPrimaryAction =
    cardState === "sent-back"
      ? { label: "Respond", onClick: focusComposer }
      : cardState === "delivered" && receipt == null
        ? { label: "Confirm receipt", onClick: () => setReceiptModalOpen(true) }
        : null;

  const copyLink = () => {
    clipboard.copy(window.location.href);
    setMenuOpen(false);
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

  // ── Status card — state-aware AI-summary sentence ─────────────────────────
  // One flowing sentence per state; every figure comes from `detail`/`row`,
  // with just the one notable fact highlighted. Only "pending" (REQ-2052,
  // REQ-2051, REQ-2053) and "ordered" (REQ-2042) have a live data example —
  // "approved", "po-sent" and "delivered" run generically but are unverified
  // visually. See report.
  const approverFullName = detail.approver?.split(" · ")[0];
  const approverFirst = approverFullName?.split(" ")[0];
  const supplierName = row?.supplier;
  const savings = detail.summary?.savings;
  const items = detail.summary?.items ?? displayTitle;
  const turnaround = detail.turnaround;
  const daysWaiting = detail.statusLabel?.match(/(\d+)\s+day/)?.[1];

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

  // Slack between the projected delivery and the need-by date, derived from
  // the track's own "Received" projection — not just the delay, so a wait
  // that still lands early doesn't read as more urgent than it is.
  const expectedReceivedDate = detail.journeyStages?.find(
    (s) => s.label === "Received",
  )?.date;
  const needByDate = detail.summary?.needBy;
  const deliverySlackDays =
    expectedReceivedDate != null && needByDate != null
      ? Math.round(
          (new Date(needByDate).getTime() -
            new Date(expectedReceivedDate).getTime()) /
            86_400_000,
        )
      : null;

  let summaryText: React.ReactNode;

  if (cardState === "sent-back") {
    summaryText = (
      <>
        {approverFullName ?? "Your approver"}{" "}
        <Highlight>sent this back</Highlight> for changes. Take a look and reply
        when it's ready to go again.
      </>
    );
  } else if (cardState === "delivered") {
    const shipToShort = detail.shipTo?.split(" · ")[0];
    if (receipt == null) {
      // Arrived per the carrier, but the requester hasn't confirmed it yet
      // — no claim about enrollment or handoff until they do.
      summaryText = (
        <>
          {items} <Highlight>arrived</Highlight>
          {shipToShort != null && <> at {shipToShort}</>}
          {savings != null && <>, saving {savings}</>}. Confirm receipt to close
          out the request.
        </>
      );
    } else if (!receiptIsPartialOrDamaged) {
      summaryText = (
        <>
          {items} arrived{shipToShort != null && <> at {shipToShort}</>}
          {savings != null && <>, saving {savings}</>}, and{" "}
          <Highlight>receipt is confirmed</Highlight>. Nothing further to do.
        </>
      );
    } else {
      const outstanding = receipt.qtyOrdered - receipt.qtyReceived;
      summaryText = (
        <>
          <Highlight>
            {receipt.qtyReceived} of {receipt.qtyOrdered}
          </Highlight>{" "}
          {items} arrived{shipToShort != null && <> at {shipToShort}</>}.
          {outstanding > 0 && (
            <>
              {" "}
              {outstanding} unit{outstanding === 1 ? "" : "s"} still
              outstanding.
            </>
          )}
          {receipt.damaged && (
            <> A supplier issue was opened for damaged or incorrect items.</>
          )}
        </>
      );
    }
  } else if (cardState === "po-sent") {
    summaryText = (
      <>
        I placed the order for {items}
        {savings != null && <>, saving {savings}</>}, and{" "}
        <Highlight>sent the PO</Highlight> to {supplierName ?? "the vendor"}.
        Expect delivery by {detail.summary?.needBy ?? "the requested date"}.
      </>
    );
  } else if (cardState === "approved") {
    summaryText = (
      <>
        I configured {items}
        {savings != null && <>, saving {savings}</>}, and sent it to{" "}
        {approverFullName ?? "your approver"} for approval.{" "}
        <Highlight>Approved</Highlight> — the purchase order should follow
        {turnaround != null && <> within {turnaround}</>}.
      </>
    );
  } else if (cardState === "ordered") {
    summaryText = (
      <>
        {items} ({detail.summary?.total ?? "—"}) is{" "}
        <Highlight>ordered</Highlight> and complete
        {savings != null && <>, saving {savings}</>}. Nothing further to do.
      </>
    );
  } else {
    summaryText = (
      <>
        {approverFirst ?? "Your approver"} has had this{" "}
        <Highlight>
          {daysWaiting != null
            ? `${spellDays(Number(daysWaiting))} days`
            : "a bit"}
        </Highlight>
        {turnaround != null && <> and usually decides within {turnaround}</>}
        {detail.nudgeText != null
          ? ", so I sent a reminder this morning."
          : "."}
        {/* The delay is already reported above — this is the slack, so the
            wait doesn't read as more urgent than the dates actually say. */}
        {deliverySlackDays != null && deliverySlackDays > 0 && (
          <>
            {" "}
            Even with the wait, delivery is still projected for{" "}
            {expectedReceivedDate}, {deliverySlackDays} days ahead of the{" "}
            {needByDate} need-by.
          </>
        )}
      </>
    );
  }

  // Attribute stages to whoever actually acts on them — completed or not:
  // the requester submits and confirms receipt, the named approver approves
  // (or is currently the one being waited on). Anything else (placing the
  // order) has no person to credit, so it keeps the agent's ✦ mark.
  const trackStages: ActivityStage[] = (detail.journeyStages ?? []).map(
    (stage) => {
      if (stage.label === "Submitted" || stage.label === "Received") {
        return { ...stage, person: { initials: requesterInitials } };
      }
      if (stage.label === "Approved" && detail.approver != null) {
        return { ...stage, person: { initials: approverInitials } };
      }
      return stage;
    },
  );
  // A partial or damaged receipt means the request isn't fully closed even
  // though the goods physically arrived — say so right on the Received
  // stage's own date line rather than only in the summary sentence above.
  if (receiptIsPartialOrDamaged) {
    const receivedIndex = trackStages.findIndex((s) =>
      /received/i.test(s.label),
    );
    if (receivedIndex !== -1) {
      const stage = trackStages[receivedIndex]!;
      const flags: string[] = [];
      if (receipt.qtyReceived < receipt.qtyOrdered) {
        flags.push(`${receipt.qtyReceived} of ${receipt.qtyOrdered} received`);
      }
      if (receipt.damaged) flags.push("issue opened");
      trackStages[receivedIndex] = {
        ...stage,
        date:
          stage.date != null
            ? `${stage.date} · ${flags.join(" · ")}`
            : flags.join(" · "),
      };
    }
  }

  // Messages and messages sent on the requester's behalf, in the order they
  // happened — not status changes, those live on the track above, not here.
  type LogEntry =
    | { kind: "agent"; text: string; timestamp?: string }
    | { kind: "user"; text: string; timestamp: string };
  const activityLog: LogEntry[] = [];
  // No opening "I configured X and sent it..." entry — that's what the AI
  // Summary headline above already says, in its own words.
  if (detail.threadSeedMessage != null) {
    activityLog.push({
      kind: "user",
      text: detail.threadSeedMessage,
      timestamp: `2:14 PM · ${approverFirstName} was notified`,
    });
  }
  if (detail.nudgeText != null) {
    // Plain fact, not the "Pending N days..." framing that used to also
    // appear in the summary headline and the "Nudged today" button — this
    // is just the one thing that happened, not a retelling of why.
    activityLog.push({
      kind: "agent",
      text: `I sent ${approverFirst ?? "them"} a reminder`,
      timestamp: "This morning",
    });
  }
  for (const note of notes) {
    activityLog.push({
      kind: "user",
      text: note.text,
      timestamp: `${note.author} · ${note.time}`,
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

  return (
    <div className="flex h-full flex-col">
      {/* auto_1fr_auto: nav and actions size to their own content instead of
          a fixed fr-share, so the title never loses space to the fields or
          the split button (see report — this is the invoice header's own
          fix for the same problem). shrink-0: a normal-flow sibling of the
          scrolling region below, not an overlay — nothing can scroll behind
          it, so there's no risk of it covering a focus ring or a
          scroll-into-view target the way a position:sticky header could. */}
      <PageHeader bordered className="shrink-0 @3xl:!grid-cols-[auto_1fr_auto]">
        <PageHeaderNav>
          <PageHeaderBackButton
            onClick={() => void navigate({ to: "/requests" })}
          />
          <PageHeaderTitleGroup>
            <PageHeaderTitle>{id}</PageHeaderTitle>
            {/* PageHeaderDescription sets the native `title` attribute for
                string children, so a truncated line still shows the full
                text on hover — no separate tooltip needed. */}
            <PageHeaderDescription>{displayTitle}</PageHeaderDescription>
          </PageHeaderTitleGroup>
        </PageHeaderNav>

        <PageHeaderContent className="@3xl:justify-between @3xl:pl-6">
          <PageHeaderField>
            <PageHeaderFieldLabel>Total</PageHeaderFieldLabel>
            <PageHeaderFieldValue>
              {detail.summary?.total ?? "—"}
            </PageHeaderFieldValue>
          </PageHeaderField>
          {detail.summary?.needBy != null && (
            <PageHeaderField>
              <PageHeaderFieldLabel>Need by</PageHeaderFieldLabel>
              <PageHeaderFieldValue className="flex items-center gap-1.5">
                {detail.summary.needBy}
                {needByBadge != null && (
                  <Badge status={needByBadge.status} variant="secondary">
                    {needByBadge.label}
                  </Badge>
                )}
              </PageHeaderFieldValue>
            </PageHeaderField>
          )}
          {row?.requester != null && (
            <PageHeaderField>
              <PageHeaderFieldLabel>Requester</PageHeaderFieldLabel>
              <PageHeaderFieldValue className="flex items-center gap-1.5">
                <Avatar className="size-[18px] shrink-0">
                  <AvatarFallback className="bg-muted text-[8px] font-semibold text-muted-foreground">
                    {requesterInitials}
                  </AvatarFallback>
                </Avatar>
                {row.requester}
              </PageHeaderFieldValue>
            </PageHeaderField>
          )}
          {detail.approver != null && (
            <PageHeaderField>
              <PageHeaderFieldLabel>Approver</PageHeaderFieldLabel>
              <PageHeaderFieldValue className="flex items-center gap-1.5">
                <Avatar className="size-[18px] shrink-0">
                  <AvatarFallback className="bg-primary/20 text-[8px] font-semibold text-primary">
                    {approverInitials}
                  </AvatarFallback>
                </Avatar>
                {detail.approver.split(" · ")[0]}
              </PageHeaderFieldValue>
            </PageHeaderField>
          )}
        </PageHeaderContent>

        <PageHeaderActions className="@3xl:ml-6">
          {/* Overflow content is shared between the two trigger shapes below
              — only one of them ever mounts, so reusing the same element is
              safe. View order/Reorder live here now: they're navigational
              conveniences, not owed actions, so they don't belong in the
              header's primary slot. */}
          {(() => {
            const overflowContent = (
              <PopoverContent align="end" className="w-56 p-1">
                {(cardState === "approved" || cardState === "po-sent") && (
                  <button
                    type="button"
                    className="flex w-full items-center rounded-sm px-3 py-2 text-left text-sm font-medium hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    onClick={() => {
                      setMenuOpen(false);
                      void navigate({ to: "/catalog" });
                    }}
                  >
                    View order
                  </button>
                )}
                {cardState === "ordered" && (
                  <button
                    type="button"
                    className="flex w-full items-center rounded-sm px-3 py-2 text-left text-sm font-medium hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    onClick={() => {
                      setMenuOpen(false);
                      void navigate({ to: "/buy" });
                    }}
                  >
                    Reorder
                  </button>
                )}
                {detail.inFlight && detail.approver != null && (
                  <button
                    type="button"
                    className="flex w-full items-center gap-1 rounded-sm px-3 py-2 text-left text-sm font-medium hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    onClick={() => {
                      setMenuOpen(false);
                      void navigate({ to: "/decision/$id", params: { id } });
                    }}
                  >
                    Approver view
                    <span className="text-muted-foreground">(demo)</span>
                  </button>
                )}
                <button
                  type="button"
                  className="flex w-full items-center rounded-sm px-3 py-2 text-left text-sm font-medium hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  onClick={copyLink}
                >
                  {clipboard.copied ? "Copied!" : "Copy link"}
                </button>
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
            );

            if (headerPrimaryAction != null) {
              return (
                <ButtonGroup>
                  <Button onClick={headerPrimaryAction.onClick}>
                    {headerPrimaryAction.label}
                  </Button>
                  <ButtonGroupSeparator className="bg-primary-600" />
                  <Popover open={menuOpen} onOpenChange={setMenuOpen}>
                    <PopoverTrigger asChild>
                      <Button aria-label="More actions">
                        <ChevronDown className="size-4" />
                      </Button>
                    </PopoverTrigger>
                    {overflowContent}
                  </Popover>
                </ButtonGroup>
              );
            }

            return (
              <Popover open={menuOpen} onOpenChange={setMenuOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="More actions"
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>
                </PopoverTrigger>
                {overflowContent}
              </Popover>
            );
          })()}
        </PageHeaderActions>
      </PageHeader>

      {/* Two columns: the narrative (agent line, journey, conversation) grows;
          the record — everything you'd look up rather than read — sits in a
          fixed sidebar. Stacks (one shared scroll) on narrow viewports; at
          lg: each column scrolls on its own, so the sidebar doesn't stretch
          page height just to keep up with a long conversation. The mask
          fades the top 24px of whichever region is scrolling — mobile's
          single shared one below, or each lg: column individually — so
          content passing that boundary fades out instead of clipping hard. */}
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pt-8 pb-8 sm:px-6",
          "[mask-image:linear-gradient(to_bottom,transparent,black_24px)]",
          "lg:flex-row lg:gap-8 lg:overflow-hidden lg:px-0 lg:pt-0 lg:pb-0 lg:[mask-image:none]",
        )}
      >
        {/* ── Main column ──────────────────────────────────────────────── */}
        <div className="min-w-0 space-y-5 lg:flex-1 lg:overflow-y-auto lg:pl-8 lg:pt-8 lg:pb-8 lg:[mask-image:linear-gradient(to_bottom,transparent,black_24px)]">
          {/* Status card — an AI moment: mark + label, one summary sentence
              with the notable fact highlighted, activity track, then
              actions. Merges what used to be three tellings of the same
              story (summary line, stage-bar waiting note, thread nudge
              line) into one. */}
          <Card variant="glass" className="py-0">
            <CardContent className="p-5">
              {/* The confirmation moment — reuses the Done screen's check
                  animation once, the instant `receipt` first appears (a
                  fresh mount, since this branch wasn't rendered before).
                  Stays in this state afterward: there's nothing further to
                  summarize as an "AI" moment once the requester themself
                  has confirmed the outcome. */}
              {receipt != null ? (
                <div className="flex flex-col items-center text-center">
                  <ConfirmCheck reduceMotion={reduceMotion} />
                  <p className="mt-3 text-base font-bold tracking-tighter text-foreground">
                    Receipt confirmed
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-base font-bold tracking-tighter text-foreground">
                  <AiMark size={14} gradientId="gb-ai-mark" aria-hidden />
                  AI Summary
                </div>
              )}

              <p className="mt-5 max-w-[640px] text-[23px] font-semibold leading-snug text-foreground">
                {summaryText}
              </p>

              {detail.journeyStages != null && (
                <ActivityTrack stages={trackStages} className="mt-5" />
              )}

              {/* Secondary actions — Nudge and Mark urgent live only here,
                  directly beneath the stage track whose current-stage label
                  already carries the elapsed-time context that makes
                  nudging a reasonable judgement call. Neither is owed, so
                  neither belongs in the header. Real button chrome, not
                  text: a completed action keeps its button shape (filled
                  muted, check icon, past tense) instead of turning to text.
                  Copy link lives in the header overflow only now — this row
                  is for actions specific to the request's current state.
                  "Message {approver}" was cut too: it only scrolled to the
                  composer already visible on the page below. */}
              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <div className="flex items-center gap-2">
                  {cardState === "pending" && (
                    <>
                      {alreadyNudged ? (
                        // Spent — a record of what happened, not an offer to
                        // delegate to the agent, so no AI treatment here.
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled
                          className="disabled:opacity-100"
                        >
                          <Check className="size-3.5" aria-hidden />
                          Nudged today
                        </Button>
                      ) : (
                        // Live — delegating the nudge to the agent, same
                        // category as the toolkit's "Ask AI" example.
                        <Button
                          size="sm"
                          variant="ai-soft"
                          onClick={() => setNudged(true)}
                        >
                          <Bell className="size-3.5" aria-hidden />
                          Nudge {approverFirstName}
                        </Button>
                      )}
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
                  )}
                </div>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Info className="size-3.5 shrink-0" aria-hidden />
                  The output is AI generated. Please review.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Communication — messages and messages sent on the requester's
              behalf, closing on the live waiting state. Status changes live
              on the track above, not here. Same caveat position and no
              terminal actions regardless of state (see sidebar). Entry gap
              (16px) and the divider before the composer (20px) both draw
              from the same 16/20 rhythm the summary card itself uses. */}
          <Card variant="glass" className="py-0">
            <CardContent className="p-5">
              <div className="flex items-center gap-1.5 text-base font-bold tracking-tighter text-foreground">
                <History size={14} aria-hidden />
                Communication
                <span className="font-normal text-muted-foreground">
                  · {activityLog.length}
                </span>
              </div>

              <div className="mt-4 space-y-4">
                {activityLog.map((entry, i) => (
                  <RecordEntry
                    key={i}
                    isPerson={entry.kind === "user"}
                    initials={requesterInitials}
                    name={
                      entry.kind === "user"
                        ? (row?.requester ?? "You")
                        : "AI Assistant"
                    }
                    timestamp={entry.timestamp}
                    text={entry.text}
                  />
                ))}
                <WaitingBanner text={waitingLine} />
              </div>

              {/* Composer — inFlight only; terminal-state actions live in the
                  sidebar now, not here. The AI-disclaimer caveat now lives
                  once, in the status card above, instead of duplicated here. */}
              {detail.inFlight && (
                <div className="mt-5 space-y-3 border-t border-border pt-5">
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
                    <Textarea
                      ref={composerRef}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey))
                          send();
                      }}
                      placeholder={`Message ${detail.agentLine.includes("Alex") ? "Alex" : "procurement"} about this request…`}
                      className="min-h-[72px] resize-none text-sm"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" disabled={!draft.trim()} onClick={send}>
                        Send
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Reference column — what's in it, rarely visited. Plain list on
            the page background: no border, no fill, narrow enough (~260px)
            that it reads as reference material, not a competing column.
            pt-5 lines its first label up with the lead card's first content
            line (20px below its own top edge), not the card's outer edge —
            at lg:, that's pt-[52px] instead: the 32px the shared wrapper
            used to contribute (now zeroed there, moved here since this
            column carries its own padding once it scrolls independently)
            plus the original 20px. space-y-4 (16px) is the field-to-field
            rhythm; the divider before linked records rides the same rhythm
            for 16px on both sides. Independent scroll (lg: only — mobile
            stays one shared scroll with the main column) so a long
            conversation in the main column doesn't stretch this list past
            the viewport, and vice versa. */}
        <div className="w-full space-y-4 pt-5 lg:w-[260px] lg:shrink-0 lg:overflow-y-auto lg:pr-8 lg:pt-[52px] lg:pb-8 lg:[mask-image:linear-gradient(to_bottom,transparent,black_24px)]">
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
