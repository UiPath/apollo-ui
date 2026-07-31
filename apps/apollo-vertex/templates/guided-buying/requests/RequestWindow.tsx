"use client";

import { useClipboard } from "@mantine/hooks";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  Bell,
  Check,
  ChevronDown,
  Copy,
  Info,
  Link as LinkIcon,
  MoreHorizontal,
  TriangleAlert,
} from "lucide-react";
import { useRef, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { P2 } from "../P2";
import { type ActivityEvent, ActivityTrack } from "./ActivityTrack";
import { getRequestDetail, getRequestRow } from "./data";
import { useRequests } from "./requests-context";

// ─── Thread message bubble ────────────────────────────────────────────────────

function MessageBubble({
  text,
  timestamp,
}: {
  text: string;
  timestamp: string;
}) {
  return (
    <div className="flex items-end justify-end gap-2">
      <div className="max-w-[74%]">
        <div className="rounded-2xl rounded-br-sm bg-muted px-3.5 py-2.5 text-sm text-foreground">
          {text}
        </div>
        <p className="mt-1 text-right text-[10.5px] text-muted-foreground">
          {timestamp}
        </p>
      </div>
      <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[9px] font-semibold text-primary">
        MW
      </div>
    </div>
  );
}

// ─── P2 nudge capsule — system event in the thread ───────────────────────────

function NudgeCapsule({ text }: { text: string }) {
  return (
    <div className="flex justify-center">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/8 px-3 py-1 text-[10.5px] text-primary">
        <Bell className="size-3 shrink-0" aria-hidden />
        {text}
      </span>
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
 * text, emphasis only (the sentence must still read correctly without it). */
function Highlight({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="rounded-sm px-1 text-insight-900 dark:text-insight-50"
      style={{ backgroundImage: "var(--ai-gradient)" }}
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
  const { threads, addNote, urgent, markUrgent, submittedRows } = useRequests();

  const [draft, setDraft] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [nudged, setNudged] = useState(false);
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
  const hasMessages =
    detail.threadSeedMessage != null ||
    notes.length > 0 ||
    detail.nudgeText != null;

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
  const poSentDone = detail.journeyStages?.some(
    (s) => /po sent/i.test(s.label) && s.state === "done",
  );
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

  const approverFirstName =
    detail.approver?.split(" · ")[0]?.split(" ")[0] ?? "procurement";

  const focusComposer = () => {
    composerRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    composerRef.current?.focus();
  };

  // The header's primary is only ever an owed action — everything else
  // (View order, Reorder) is a navigational convenience, not an
  // obligation, so it moves to the overflow menu instead.
  const headerPrimaryAction =
    cardState === "delivered"
      ? {
          label: "Confirm receipt",
          onClick: () => void navigate({ to: "/close/$id", params: { id } }),
        }
      : cardState === "sent-back"
        ? { label: "Respond", onClick: focusComposer }
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
    summaryText = (
      <>
        {items} <Highlight>arrived</Highlight>
        {shipToShort != null && <> at {shipToShort}</>}
        {savings != null && <>, saving {savings}</>}. Enrollment is confirmed
        and the units are handed off.
      </>
    );
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
        I configured {items}
        {detail.pricingNote != null && <> {detail.pricingNote}</>}
        {savings != null && <>, saving {savings}</>}, and sent it to{" "}
        {approverFullName ?? "procurement"}. It's been with{" "}
        {approverFirst ?? "them"} for{" "}
        <Highlight>
          {daysWaiting != null
            ? `${spellDays(Number(daysWaiting))} days`
            : "a bit"}
        </Highlight>
        .
        {turnaround != null && (
          <>
            {" "}
            {approverFirst != null
              ? `${approverFirst} usually decides`
              : "They usually decide"}{" "}
            within {turnaround}
            {detail.nudgeText != null
              ? ", so I sent a reminder this morning."
              : "."}
          </>
        )}
      </>
    );
  }

  // Event pins — derived from live thread state (notes/nudge/urgency), not a
  // separate hardcoded list, so a note sent mid-session shows up here too.
  const activeStageIndex =
    detail.journeyStages?.findIndex(
      (s) => s.state === "active" || s.state === "active-warning",
    ) ?? -1;
  const currentStageIndex =
    activeStageIndex >= 0
      ? activeStageIndex
      : (detail.journeyStages?.length ?? 1) - 1;

  const activityEvents: ActivityEvent[] = [];
  if (detail.journeyStages != null) {
    activityEvents.push({
      type: "agent",
      stageIndex: 0,
      label: detail.agentLine,
    });
    if (detail.threadSeedMessage != null) {
      activityEvents.push({
        type: "user",
        stageIndex: currentStageIndex,
        label: detail.threadSeedMessage,
        initials: requesterInitials,
      });
    }
    for (const note of notes) {
      activityEvents.push({
        type: "user",
        stageIndex: currentStageIndex,
        label: note.text,
        initials: requesterInitials,
      });
    }
    // Unconditional on nudgeText, not on live isUrgent state — the reminder
    // it describes already happened this morning, same as the thread's own
    // NudgeCapsule below (P2-gated only, not tied to the session's nudge).
    if (detail.nudgeText != null) {
      activityEvents.push({
        type: "agent",
        stageIndex: currentStageIndex,
        label: detail.nudgeText,
      });
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* auto_1fr_auto: nav and actions size to their own content instead of
          a fixed fr-share, so the title never loses space to the fields or
          the split button (see report — this is the invoice header's own
          fix for the same problem). */}
      <PageHeader bordered className="@3xl:!grid-cols-[auto_1fr_auto]">
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
              <PageHeaderFieldValue>
                {detail.summary.needBy}
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
                {detail.hasClose && cardState !== "delivered" && (
                  <button
                    type="button"
                    className="flex w-full items-center rounded-sm px-3 py-2 text-left text-sm font-medium hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    onClick={() => {
                      setMenuOpen(false);
                      void navigate({ to: "/close/$id", params: { id } });
                    }}
                  >
                    Delivery receipt
                  </button>
                )}
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
          fixed sidebar. Stacks on narrow viewports. */}
      <div className="grid grid-cols-1 gap-4 px-4 pb-8 sm:px-6 lg:grid-cols-[1fr_200px] lg:gap-8 lg:px-8">
        {/* ── Main column ──────────────────────────────────────────────── */}
        <div className="min-w-0 space-y-4">
          {/* Status card — an AI moment: mark + label, one summary sentence
              with the notable fact highlighted, activity track, then
              actions. Merges what used to be three tellings of the same
              story (summary line, stage-bar waiting note, thread nudge
              line) into one. */}
          <Card variant="glass">
            <CardContent className="p-5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                <AiMark size={14} gradientId="gb-ai-mark" aria-hidden />
                AI Summary
              </div>

              <p className="mt-5 text-[23px] font-semibold leading-snug text-foreground">
                {summaryText}
              </p>

              {detail.journeyStages != null && (
                <ActivityTrack
                  stages={detail.journeyStages}
                  events={activityEvents}
                  className="mt-5"
                />
              )}

              {/* Secondary actions — Nudge and Mark urgent live only here,
                  directly beneath the stage track whose current-stage label
                  already carries the elapsed-time context that makes
                  nudging a reasonable judgement call. Neither is owed, so
                  neither belongs in the header. Real button chrome, not
                  text: a completed action keeps its button shape (filled
                  muted, check icon, past tense) instead of turning to text. */}
              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <div className="flex items-center gap-2">
                  {cardState === "pending" && (
                    <>
                      {nudged ? (
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
                        <Button
                          size="sm"
                          variant="outline"
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
                  <Button
                    size="icon-sm"
                    variant="outline"
                    onClick={copyLink}
                    aria-label={clipboard.copied ? "Link copied" : "Copy link"}
                  >
                    {clipboard.copied ? (
                      <Check className="size-3.5" aria-hidden />
                    ) : (
                      <Copy className="size-3.5" aria-hidden />
                    )}
                  </Button>
                </div>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Info className="size-3.5 shrink-0" aria-hidden />
                  The output is AI generated. Please review.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Conversation — grows to fill the column; same caveat position
              and no terminal actions regardless of state (see sidebar). */}
          <Card variant="glass" className="flex-1">
            <CardContent className="flex h-full flex-col px-4 py-3.5">
              <p className="mb-3 text-[12.5px] font-semibold text-foreground">
                Conversation on this request
              </p>

              {hasMessages ? (
                <div className="space-y-3">
                  {/* Seed message — pre-populated from deck data */}
                  {detail.threadSeedMessage != null && (
                    <MessageBubble
                      text={detail.threadSeedMessage}
                      timestamp="You · 2:14 PM · Alex was notified"
                    />
                  )}

                  {/* Dynamic notes posted in this session */}
                  {notes.map((n) => (
                    <MessageBubble
                      key={n.id}
                      text={n.text}
                      timestamp={`${n.author} · ${n.time}`}
                    />
                  ))}

                  {/* P2: system nudge capsule */}
                  {detail.nudgeText != null && (
                    <P2>
                      <NudgeCapsule text={detail.nudgeText} />
                    </P2>
                  )}
                </div>
              ) : (
                <div className="flex flex-1 items-center justify-center py-8">
                  <p className="text-sm text-muted-foreground">
                    No messages yet.
                  </p>
                </div>
              )}

              {/* Composer — inFlight only; terminal-state actions live in the
                  sidebar now, not here. The AI-disclaimer caveat now lives
                  once, in the status card above, instead of duplicated here. */}
              {detail.inFlight && (
                <div className="mt-3 space-y-3 border-t border-border pt-4">
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
            the page background: no border, no fill, narrow enough (~200px)
            that it reads as reference material, not a competing column.
            pt-5 lines its first label up with the lead card's first content
            line (20px below its own top edge), not the card's outer edge.
            space-y-4 (16px) is the field-to-field rhythm; the divider before
            linked records rides the same rhythm for 16px on both sides. */}
        <div className="w-full space-y-4 pt-5 lg:max-w-[200px]">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
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
          <div>
            <p className="text-sm text-muted-foreground">Your request</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {verbatimRequest}
            </p>
          </div>

          {/* Linked records — same P2 gate the journey card used to carry;
              the divider before it rides the parent's space-y-4 rhythm, so
              it's 16px below the field above and 16px above this label. */}
          {detail.nudgeText != null && (
            <P2>
              <div className="h-px bg-border" />
              <div>
                <p className="text-sm text-muted-foreground">Linked records</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/8 px-2.5 py-0.5 text-[10.5px] font-semibold text-primary">
                    <LinkIcon className="size-3 shrink-0" aria-hidden />
                    PR-2052
                  </span>
                  <span className="inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-[10.5px] text-muted-foreground">
                    PO · created on approval
                  </span>
                </div>
              </div>
            </P2>
          )}
        </div>
      </div>
    </div>
  );
}
