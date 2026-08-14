"use client";

// oxlint-disable max-lines -- the 3-region escalation detail, adapted from the IP layout

import {
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileCheck,
  Info,
  Plus,
  TriangleAlert,
  User,
} from "lucide-react";
import { type PointerEvent, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { AiMark } from "@/registry/ai-mark/ai-mark";
import {
  DETECTION_LINE,
  type DraftMessage,
  type Exception,
  type ExceptionStatus,
  getExceptionSummary,
  getPerson,
  openExceptions,
  ph,
  RELEASE_RECORD,
  SUPPLIER_REPLY,
  type Suggestion,
} from "../data";
import { useRequests } from "../requests/requests-context";
import { CorrectionDraftModal } from "./CorrectionDraftModal";
import {
  applyExceptionOverrides,
  type Decision,
  type WorkbenchDetail as Detail,
  FORK_BADGE_STATUS,
  FORK_DOT,
  FORK_LABEL,
  req10482VisibleActivity,
  STATUS_BADGE,
  STATUS_LABEL,
  timelineEntryTime,
  type TimelineEntry,
  WORKBENCH_DETAILS,
  WORKBENCH_EXCEPTIONS,
  WORKBENCH_ROWS,
  type WorkbenchStatus,
} from "./data";

type CenterView = "finding" | "comms";
type RightTab = "activity" | "details" | "lines" | "source";
type Resolution = Decision | null;

const REVIEWER_INITIALS = "PV";

// ── Left queue ────────────────────────────────────────────────────────────────

const QUEUE = WORKBENCH_ROWS.filter(
  (r) => r.assignee === "You" && WORKBENCH_DETAILS[r.id] != null,
);

function QueueItem({
  id,
  onSelect,
  isActive,
}: {
  id: string;
  onSelect: (id: string) => void;
  isActive: boolean;
}) {
  const row = WORKBENCH_ROWS.find((r) => r.id === id);
  if (!row) return null;
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className="group w-full text-left"
    >
      <div
        className={cn(
          "mx-4 rounded-md border bg-card px-3.5 py-3 transition-colors",
          isActive
            ? "border-[1.5px] border-primary"
            : "border-border group-hover:bg-muted/60",
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[13px] font-semibold text-foreground">
            {row.requester}
          </span>
          <span className="shrink-0 text-xs font-semibold text-muted-foreground">
            {row.value}
          </span>
        </div>
        <div className="mt-[5px] flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1">
            <div
              className={cn(
                "size-1.5 shrink-0 rounded-full",
                FORK_DOT[row.type],
              )}
            />
            <span className="truncate text-[11px] font-medium text-muted-foreground">
              {FORK_LABEL[row.type]}
            </span>
          </div>
          <span className="ml-auto text-xs text-muted-foreground">
            {row.id}
          </span>
        </div>
      </div>
    </button>
  );
}

function NavSectionLabel({ label, count }: { label: string; count: number }) {
  return (
    <div className="px-4 pb-2 pt-4">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}{" "}
        <span className="font-normal tabular-nums text-muted-foreground/70">
          ({count})
        </span>
      </span>
    </div>
  );
}

function LeftQueue({
  activeId,
  onSelect,
  onBack,
}: {
  activeId: string;
  onSelect: (id: string) => void;
  onBack: () => void;
}) {
  const dueToday = QUEUE.filter((r) => r.dueGroup === "today");
  const dueTomorrow = QUEUE.filter((r) => r.dueGroup === "tomorrow");
  const index = QUEUE.findIndex((r) => r.id === activeId);
  const hasPrev = index > 0;
  const hasNext = index >= 0 && index < QUEUE.length - 1;

  return (
    <div className="relative flex h-full w-[300px] shrink-0 flex-col overflow-hidden border-r border-border/60">
      <div className="flex shrink-0 items-center gap-1.5 border-b border-border/50 px-3 py-2.5">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to all requests"
          className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
        </button>
        <span className="flex-1 truncate text-[13px] font-semibold">
          My queue{" "}
          <span className="font-normal tabular-nums text-muted-foreground">
            ({QUEUE.length})
          </span>
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {dueToday.length > 0 && (
          <>
            <NavSectionLabel label="Due today" count={dueToday.length} />
            <div className="space-y-2 pb-2">
              {dueToday.map((r) => (
                <QueueItem
                  key={r.id}
                  id={r.id}
                  onSelect={onSelect}
                  isActive={r.id === activeId}
                />
              ))}
            </div>
          </>
        )}
        {dueTomorrow.length > 0 && (
          <>
            <NavSectionLabel label="Due tomorrow" count={dueTomorrow.length} />
            <div className="space-y-2 pb-2">
              {dueTomorrow.map((r) => (
                <QueueItem
                  key={r.id}
                  id={r.id}
                  onSelect={onSelect}
                  isActive={r.id === activeId}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-between border-t border-border px-4 py-2.5">
        <button
          type="button"
          aria-label="Previous request"
          disabled={!hasPrev}
          onClick={() => hasPrev && onSelect(QUEUE[index - 1].id)}
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="text-xs tabular-nums text-muted-foreground">
          {index + 1} of {QUEUE.length}
        </span>
        <button
          type="button"
          aria-label="Next request"
          disabled={!hasNext}
          onClick={() => hasNext && onSelect(QUEUE[index + 1].id)}
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

// ── Center: the exception surface ─────────────────────────────────────────────
// Leads the centre pane while a request has open exceptions (see the report
// on PH-27 to PH-33 for what this displaces and when). "Open" and "active"
// share one label and color: the generic model (../data/exceptions) treats
// them identically for openness, and nothing here draws a distinction it
// doesn't make.

const EXCEPTION_STATUS_LABEL: Record<ExceptionStatus, string> = {
  open: "Open",
  active: "Open",
  waiting: "Waiting",
  resolved: "Resolved",
};

const EXCEPTION_STATUS_BADGE: Record<
  ExceptionStatus,
  "warning" | "info" | "success"
> = {
  open: "warning",
  active: "warning",
  waiting: "info",
  resolved: "success",
};

/** The comparison across sources: two sides or three, same layout either
 * way. `role` marks the governing and deviating sides where the seed says
 * so; a side with neither renders plain. */
function ExceptionFinding({ exception }: { exception: Exception }) {
  return (
    <div className="mb-4 grid w-fit grid-flow-col divide-x divide-border [&>div:first-child]:pl-0">
      {exception.finding.sides.map((side) => (
        <div key={side.label} className="flex flex-col gap-1.5 px-5 py-[14px]">
          <span className="truncate text-[11px] font-medium text-muted-foreground">
            {side.label}
          </span>
          <span
            className={cn(
              "whitespace-nowrap text-lg font-semibold leading-none text-foreground",
              side.role === "deviating" && "rounded bg-warning/15 px-1",
            )}
          >
            {side.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function suggestionLabel(suggestion: Suggestion): string {
  return suggestion.type === "accept" ? "Accept" : "Request correction";
}

/** The active exception's suggestions as an action card: a primary action,
 * at most one alternate beside it. Agent produced, so it carries the AI
 * mark and the same disclosure caption used elsewhere in this pane; the
 * status chip and headline above it restate seed values and carry neither. */
function ExceptionFixCard({
  exception,
  onAccept,
  onOpenDraft,
}: {
  exception: Exception;
  onAccept: (exceptionId: string) => void;
  onOpenDraft: (exceptionId: string, draft: DraftMessage) => void;
}) {
  if (exception.suggestions.length === 0) return null;
  const [primary, alt] = exception.suggestions;

  function handle(suggestion: Suggestion) {
    if (suggestion.type === "accept") onAccept(exception.id);
    else onOpenDraft(exception.id, suggestion.draft);
  }

  return (
    <div className="mt-5 max-w-[480px] rounded-xl border border-(--primary)/30 bg-(--primary)/[0.04] p-4">
      <div className="flex items-center gap-1.5">
        <AiMark size={14} />
        <span className="text-sm font-semibold text-foreground">
          Suggested action
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => handle(primary)}>
          {suggestionLabel(primary)}
        </Button>
        {alt && (
          <Button size="sm" variant="outline" onClick={() => handle(alt)}>
            {suggestionLabel(alt)}
          </Button>
        )}
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Info className="size-3.5 shrink-0" aria-hidden />
        The output is AI generated. Please review.
      </p>
    </div>
  );
}

/**
 * The active exception: status, headline, finding, fix card. Paging (prev,
 * next, position) renders only when more than one exception is open; the
 * position text derives from `openList`/the local cursor, nothing counted
 * or labelled by hand. The third action for a payment terms exception
 * (source material offers requesting a formal term exception) renders
 * outside the card as a no-op text link behind PH-34: its behaviour is
 * unresolved, so it's registered and left unwired rather than guessed.
 */
function handleTermExceptionRequest() {
  // Requesting a payment term exception: named by the prompt, unresolved in
  // behaviour (see PH-34). No-op until that's ruled on.
}

function ExceptionSurface({
  openList,
  onAccept,
  onOpenDraft,
}: {
  openList: Exception[];
  onAccept: (exceptionId: string) => void;
  onOpenDraft: (exceptionId: string, draft: DraftMessage) => void;
}) {
  const [cursor, setCursor] = useState(0);
  const activeIndex = Math.min(cursor, Math.max(openList.length - 1, 0));
  const active = openList[activeIndex];
  const hasPaging = openList.length > 1;

  if (!active) return null;

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-8 pt-8 sm:px-6 lg:px-8">
      {hasPaging && (
        <div className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground">
          <button
            type="button"
            aria-label="Previous exception"
            disabled={activeIndex === 0}
            onClick={() => setCursor((c) => Math.max(0, c - 1))}
            className="flex size-6 items-center justify-center rounded-md transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronLeft className="size-3.5" />
          </button>
          <span className="tabular-nums">
            {activeIndex + 1} of {openList.length}
          </span>
          <button
            type="button"
            aria-label="Next exception"
            disabled={activeIndex === openList.length - 1}
            onClick={() =>
              setCursor((c) => Math.min(openList.length - 1, c + 1))
            }
            className="flex size-6 items-center justify-center rounded-md transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      )}

      <Badge
        status={EXCEPTION_STATUS_BADGE[active.status]}
        variant="secondary"
        className="mb-4 rounded-[4px] px-2.5 py-[3px]"
      >
        {EXCEPTION_STATUS_LABEL[active.status]}
      </Badge>

      <h2 className="mb-4 max-w-[22ch] text-balance text-[28px] font-bold leading-[1.2] tracking-tight text-foreground">
        {active.headline}
      </h2>

      <ExceptionFinding exception={active} />

      <ExceptionFixCard
        exception={active}
        onAccept={onAccept}
        onOpenDraft={onOpenDraft}
      />

      {active.type === "operational" && (
        <button
          type="button"
          onClick={handleTermExceptionRequest}
          className="mt-3 inline-block max-w-[480px] text-left text-xs leading-relaxed text-primary underline underline-offset-2 hover:text-primary/80"
        >
          {ph("PH-34")}
        </button>
      )}
    </div>
  );
}

/** How a single exception resolved: a person's name, or a document's own
 * version, tagged rather than read out of a string, per the model's own
 * distinction (see the report). No control here resolves anything, this
 * only renders what already happened. */
function ExceptionResolutionLine({ exception }: { exception: Exception }) {
  const resolution = exception.resolution;
  if (!resolution) return null;
  const byPerson = resolution.resolvedBy === "person";
  return (
    <div className="flex items-center gap-2 text-sm">
      {byPerson ? (
        <User className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      ) : (
        <FileCheck
          className="size-4 shrink-0 text-muted-foreground"
          aria-hidden
        />
      )}
      <span className="text-foreground">{exception.headline}</span>
      <span className="text-muted-foreground">
        resolved by{" "}
        {byPerson ? getPerson(resolution.by).name : `document ${resolution.by}`}
      </span>
    </div>
  );
}

/**
 * The auto-release completion state: renders once every exception on the
 * request is resolved, none open, none waiting. Everything here is
 * RELEASE_RECORD (../data/cockpit-10482.ts) or the exceptions' own
 * resolution field, nothing authored. Success (green) throughout, since
 * nothing on this screen is an open exception any more. No approve, accept,
 * or confirm control appears here, this is a record of what already
 * happened automatically.
 */
function AutoReleaseCompletion({ exceptions }: { exceptions: Exception[] }) {
  return (
    <div className="flex-1 overflow-y-auto px-4 pb-8 pt-8 sm:px-6 lg:px-8">
      <Alert status="success" visual="tinted" className="max-w-[560px]">
        <CheckCircle2 />
        <AlertTitle>Validation completed automatically</AlertTitle>
        <AlertDescription>
          {timelineEntryTime(RELEASE_RECORD.when)}
        </AlertDescription>
      </Alert>

      {/* The system's own action, not a person's: the reprocessing that made
          the automatic resolution possible. AiMark, the same distinct
          marking TIMELINE's own agent-actor entries already carry. */}
      <div className="mt-4 flex max-w-[560px] items-start gap-2 text-sm text-muted-foreground">
        <AiMark size={14} className="mt-0.5 shrink-0" />
        <span>{DETECTION_LINE.text}</span>
      </div>

      <div className="mt-5 max-w-[560px] space-y-2">
        {exceptions.map((exception) => (
          <ExceptionResolutionLine key={exception.id} exception={exception} />
        ))}
      </div>

      <div className="mt-6 max-w-[560px] rounded-xl border border-border bg-muted/20 p-4">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Next step
        </p>
        <p className="mt-1.5 text-sm font-semibold text-foreground">
          {RELEASE_RECORD.nextStep.label}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {RELEASE_RECORD.nextStepOwner.name} ·{" "}
          {RELEASE_RECORD.nextStepOwner.role}
        </p>
      </div>

      <div className="mt-6 max-w-[560px]">
        <p className="mb-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Timing
        </p>
        <div className="space-y-1.5">
          {RELEASE_RECORD.timingTrail.map((event) => (
            <div
              key={event.id}
              className="flex items-center justify-between gap-3 text-xs"
            >
              <span className="text-foreground">{event.label}</span>
              <span className="shrink-0 text-muted-foreground">
                {timelineEntryTime(event.when)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-6 max-w-[560px] text-sm text-muted-foreground">
        {RELEASE_RECORD.closingStatement}
      </p>
    </div>
  );
}

function ResolvedAlert({
  detail,
  decision,
}: {
  detail: Detail;
  decision: Decision;
}) {
  const body = detail.confirmations[decision];
  const title = detail.resolvedTitles?.[decision] ?? STATUS_LABEL[decision];
  if (decision === "rejected") {
    return (
      <Alert status="error">
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{body}</AlertDescription>
      </Alert>
    );
  }
  return (
    <Alert>
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{body}</AlertDescription>
    </Alert>
  );
}

function Finding({
  detail,
  decision,
  onResolve,
}: {
  detail: Detail;
  decision: Resolution;
  onResolve: (d: Decision) => void;
}) {
  const { primary, secondary, reject } = detail.actions;
  return (
    <div className="flex-1 overflow-y-auto px-4 pb-8 pt-8 sm:px-6 lg:px-8">
      <Badge
        status={FORK_BADGE_STATUS[detail.type]}
        variant="secondary"
        className="mb-4 rounded-[4px] px-2.5 py-[3px]"
      >
        {detail.finding.tag}
      </Badge>

      <h2 className="mb-4 max-w-[22ch] text-balance text-[28px] font-bold leading-[1.2] tracking-tight text-foreground">
        {detail.finding.headline}
      </h2>

      <div className="mb-4 grid max-w-[480px] grid-cols-3 divide-x divide-border [&>div:first-child]:pl-0">
        {detail.finding.metrics.map((m) => (
          <div key={m.label} className="flex flex-col gap-1.5 px-6 py-[18px]">
            <span className="text-[10px] font-semibold uppercase leading-snug tracking-widest text-muted-foreground">
              {m.label}
            </span>
            <span
              className={cn(
                "whitespace-nowrap text-[28px] font-semibold leading-none tracking-tight",
                m.cls,
              )}
            >
              {m.value}
            </span>
          </div>
        ))}
      </div>

      <p className="mb-6 max-w-[540px] text-[14px] leading-[1.7] text-muted-foreground">
        {detail.finding.body}
      </p>

      {/* Sourcing: how the shortlist was assembled + the vendors (estimates). */}
      {detail.shortlist && (
        <div className="mb-6 max-w-[560px] space-y-2">
          {detail.shortlistNote && (
            <p className="text-xs leading-[1.6] text-muted-foreground">
              {detail.shortlistNote}
            </p>
          )}
          {detail.shortlist.map((v) => (
            <div
              key={v.name}
              className={cn(
                "rounded-xl border p-3.5",
                v.agentPick
                  ? "border-(--primary) bg-(--primary)/[0.04]"
                  : "border-border",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-foreground">
                    {v.name}
                  </span>
                  {v.agentPick && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
                      style={{ background: "var(--ai-gradient-strong)" }}
                    >
                      <AiMark size={10} aria-hidden />
                      Agent pick
                    </span>
                  )}
                </div>
                <span className="whitespace-nowrap text-base font-semibold text-foreground">
                  Est. {v.bid}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{v.source}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {v.chips.map((chip) => (
                  <span
                    key={chip}
                    className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* The judgment call the agent flagged for the buyer. */}
      {detail.attention && (
        <div className="mb-6 flex max-w-[560px] items-start gap-2 rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm">
          <TriangleAlert
            className="mt-0.5 size-4 shrink-0 text-warning"
            aria-hidden
          />
          <span className="text-foreground">
            <span className="font-semibold">Needs your call · </span>
            {detail.attention}
          </span>
        </div>
      )}

      <p className="mb-6 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Info className="size-3.5 shrink-0" aria-hidden />
        The output is AI generated. Please review.
      </p>

      {decision ? (
        <ResolvedAlert detail={detail} decision={decision} />
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => onResolve(primary.decision)}>
            {primary.label}
          </Button>
          {secondary && (
            <Button
              variant="outline"
              onClick={() => onResolve(secondary.decision)}
            >
              {secondary.label}
            </Button>
          )}
          <Button variant="ghost" onClick={() => onResolve(reject.decision)}>
            {reject.label}
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Right reference panel ─────────────────────────────────────────────────────

function renderDot(indicator: TimelineEntry["indicator"]) {
  if (indicator === "pending")
    return (
      <div className="size-4 shrink-0 rounded-full border border-dashed border-muted-foreground/40" />
    );
  if (indicator === "user")
    return (
      <Avatar className="size-4 shrink-0">
        <AvatarFallback className="bg-muted-foreground text-[7px] font-bold text-white">
          {REVIEWER_INITIALS}
        </AvatarFallback>
      </Avatar>
    );
  if (indicator === "ai-warn")
    return (
      <div className="flex size-4 shrink-0 items-center justify-center rounded-full border border-warning/40 bg-warning/20">
        <AiMark size={8} className="text-warning" />
      </div>
    );
  if (indicator === "ai-pass")
    return (
      <div className="flex size-4 shrink-0 items-center justify-center rounded-full border border-success/40 bg-success/20">
        <AiMark size={8} className="text-success" />
      </div>
    );
  return (
    <div className="flex size-4 shrink-0 items-center justify-center">
      <div className="size-2 rounded-full bg-muted-foreground/50" />
    </div>
  );
}

function ActivityTab({
  detail,
  decision,
  activity,
}: {
  detail: Detail;
  decision: Resolution;
  activity?: TimelineEntry[] | null;
}) {
  const [noteState, setNoteState] = useState<"default" | "input">("default");
  const [noteText, setNoteText] = useState("");
  const [notes, setNotes] = useState<TimelineEntry[]>([]);

  // The decision posts a first-person Autopilot confirmation at the top.
  const resolved: TimelineEntry[] = decision
    ? [
        {
          id: "resolved",
          label: detail.confirmations[decision],
          time: "Just now",
          indicator: decision === "rejected" ? "ai-warn" : "ai-pass",
        },
      ]
    : [];

  const items = [...resolved, ...notes, ...(activity ?? detail.activity)];

  const addNote = () => {
    const text = noteText.trim();
    if (!text) return;
    setNotes((prev) => [
      {
        id: `note-${prev.length}`,
        label: "You added a note",
        desc: text,
        indicator: "user",
      },
      ...prev,
    ]);
    setNoteText("");
    setNoteState("default");
  };

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="flex-1 pb-3 pl-5 pr-8 pt-5">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <div key={item.id} className="flex gap-3">
              <div className="flex w-4 flex-col items-center">
                {renderDot(item.indicator)}
                {!isLast && (
                  <div className="my-1 min-h-[10px] w-px flex-1 bg-border" />
                )}
              </div>
              <div className="min-w-0 flex-1 pb-[28px]">
                <div className="flex items-baseline justify-between gap-2">
                  <p
                    className={cn(
                      "text-[13px] font-medium leading-snug",
                      item.indicator === "pending"
                        ? "italic text-muted-foreground"
                        : "text-foreground",
                    )}
                  >
                    {item.label}
                  </p>
                  {item.time && (
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {item.time}
                    </span>
                  )}
                </div>
                {item.desc && (
                  <p className="mt-1 text-[12px] leading-[1.5] text-muted-foreground">
                    {item.desc}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="shrink-0 pb-4 pl-5 pr-8">
        <Separator className="mb-2" />
        {noteState === "input" ? (
          <div className="flex flex-col gap-1.5">
            <Textarea
              autoFocus
              placeholder="Add a note…"
              className="min-h-[64px] resize-none text-xs"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
            />
            <div className="flex justify-end gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setNoteState("default");
                  setNoteText("");
                }}
              >
                Cancel
              </Button>
              <Button size="sm" disabled={!noteText.trim()} onClick={addNote}>
                Save note
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setNoteState("input")}
            className="group flex items-center gap-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <span className="flex size-6 items-center justify-center rounded-full border border-dashed border-border group-hover:border-muted-foreground">
              <Plus className="size-3" />
            </span>
            Add a note…
          </button>
        )}
      </div>
    </div>
  );
}

function DetailsTab({ detail }: { detail: Detail }) {
  return (
    <div className="flex-1 overflow-y-auto px-5 py-5">
      <dl className="space-y-3">
        {detail.details.map((f) => (
          <div
            key={f.label}
            className="flex items-baseline justify-between gap-4"
          >
            <dt className="shrink-0 text-xs text-muted-foreground">
              {f.label}
            </dt>
            <dd className="text-right text-sm font-medium text-foreground">
              {f.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function LinesTab({ detail }: { detail: Detail }) {
  return (
    <div className="flex-1 overflow-y-auto px-5 py-5">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="border-b border-border">
            <th className="w-full pb-2 pr-3 text-left font-medium text-muted-foreground">
              Description
            </th>
            <th className="px-3 pb-2 text-right font-medium text-muted-foreground">
              Qty
            </th>
            <th className="px-3 pb-2 text-right font-medium text-muted-foreground">
              Unit
            </th>
            <th className="pb-2 pl-3 text-right font-medium text-muted-foreground">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {detail.lines.map((line) => (
            <tr key={line.description} className="border-b border-border/50">
              <td className="py-3 pr-3 text-foreground">{line.description}</td>
              <td className="px-3 py-3 text-right tabular-nums">{line.qty}</td>
              <td className="px-3 py-3 text-right tabular-nums text-muted-foreground">
                {line.unitPrice}
              </td>
              <td className="py-3 pl-3 text-right font-medium tabular-nums">
                {line.amount}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-border">
            <td colSpan={3} className="pt-3 pr-3 text-right font-semibold">
              Total
            </td>
            <td className="pt-3 pl-3 text-right font-semibold tabular-nums">
              {detail.linesTotal}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function SourceTab({ detail }: { detail: Detail }) {
  return (
    <div className="flex-1 overflow-y-auto px-5 py-5">
      <div className="rounded-lg border bg-muted/30 p-4">
        <p className="mb-3 text-xs font-medium text-muted-foreground">
          {detail.source.filename}
        </p>
        <div className="space-y-1.5">
          {detail.source.lines.map((line, i) => (
            <p
              key={line}
              className={cn(
                "text-xs leading-relaxed",
                i === 0
                  ? "font-semibold text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {line}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

function RightPanel({
  detail,
  decision,
  activity,
}: {
  detail: Detail;
  decision: Resolution;
  /** Overrides `detail.activity` when a request needs its trail cut to
   * what has actually happened (REQ-10482 today). Absent for every other
   * request, which renders `detail.activity` exactly as before. */
  activity?: TimelineEntry[] | null;
}) {
  const [tab, setTab] = useState<RightTab>("activity");
  const [width, setWidth] = useState(380);

  function startResize(e: PointerEvent) {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = width;
    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";
    function move(ev: globalThis.PointerEvent) {
      const next = startWidth - (ev.clientX - startX);
      setWidth(Math.min(640, Math.max(340, next)));
    }
    function up() {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  const tabs: { key: RightTab; label: string }[] = [
    { key: "activity", label: "Activity" },
    { key: "details", label: "Details" },
    { key: "lines", label: "Line items" },
    { key: "source", label: "Source" },
  ];

  return (
    <div
      className="relative flex h-full shrink-0 flex-col overflow-hidden border-l border-border"
      style={{ width: `${width}px` }}
    >
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize panel"
        onPointerDown={startResize}
        className="absolute left-0 top-0 z-20 h-full w-1.5 cursor-ew-resize transition-colors hover:bg-primary/30"
      />
      <div className="flex shrink-0 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "flex-1 whitespace-nowrap py-3 text-xs font-medium transition-colors",
              tab === t.key
                ? "-mb-px border-b-2 border-foreground text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        {tab === "activity" && (
          <ActivityTab
            detail={detail}
            decision={decision}
            activity={activity}
          />
        )}
        {tab === "details" && <DetailsTab detail={detail} />}
        {tab === "lines" && <LinesTab detail={detail} />}
        {tab === "source" && <SourceTab detail={detail} />}
      </div>
    </div>
  );
}

// ── Assembly ──────────────────────────────────────────────────────────────────

interface WorkbenchDetailProps {
  id: string;
  decision: Resolution;
  onDecide: (id: string, decision: Decision) => void;
  onBack: () => void;
  onSelect: (id: string) => void;
}

/** Three-region escalation detail: queue · the agent's work + the call · reference. */
export function WorkbenchDetail({
  id,
  decision,
  onDecide,
  onBack,
  onSelect,
}: WorkbenchDetailProps) {
  const [centerView, setCenterView] = useState<CenterView>("finding");
  const [draftFor, setDraftFor] = useState<{
    exceptionId: string;
    draft: DraftMessage;
  } | null>(null);
  // The requester's lens on this same request: notes they posted land in Comms,
  // and an urgent flag they raised shows in the header.
  const {
    threads,
    urgent,
    addNote,
    exceptionOverrides,
    acceptException,
    requestExceptionCorrection,
    resolveExceptionByDocument,
  } = useRequests();

  const detail = WORKBENCH_DETAILS[id];
  if (!detail) return null;

  const notes = threads[id] ?? [];
  const isUrgent = urgent[id] === true;

  // The seed's own exceptions, overlaid with this session's live status
  // changes (accept / request correction). Absent for every request except
  // REQ-10482 today. Shared with the queue row's own chip (WorkbenchList)
  // so the two never compute the open count differently.
  const exceptions = applyExceptionOverrides(
    WORKBENCH_EXCEPTIONS[id] ?? [],
    exceptionOverrides[id] ?? {},
  );
  const exceptionSummary = getExceptionSummary(exceptions);
  const openExceptionList = openExceptions(exceptions);
  // The one exception a reply can resolve right now, if any. Not
  // hardcoded to a particular exception id: whichever one is parked
  // waiting is the one the reply is for.
  const waitingException = exceptions.find((e) => e.status === "waiting");
  // Nothing open, nothing waiting, but there was something to resolve:
  // the moment validation completes and the request leaves the queue on
  // its own. A request with no exceptions at all (every J1/J2 row) never
  // satisfies this, since `exceptions` is empty for them.
  const autoReleased =
    exceptions.length > 0 &&
    exceptionSummary.openCount === 0 &&
    exceptionSummary.waitingCount === 0;
  // The header badge shares this same derivation with the queue row
  // (WorkbenchList), so the two never disagree: once released, the header
  // reads "Auto-cleared" too, not the seed's own "awaiting".
  const status: WorkbenchStatus = autoReleased
    ? "auto-cleared"
    : (decision ?? "awaiting");
  // The activity trail cut to what has actually happened, only for a
  // request that has exceptions at all (REQ-10482 today); every other
  // request's activity is untouched, `detail.activity` as before.
  const visibleActivity =
    exceptions.length > 0
      ? req10482VisibleActivity(exceptions, autoReleased)
      : null;

  function handleAcceptException(exceptionId: string) {
    acceptException(id, exceptionId);
  }

  function handleOpenDraft(exceptionId: string, draft: DraftMessage) {
    setDraftFor({ exceptionId, draft });
  }

  function handleSendDraft() {
    if (!draftFor) return;
    const waitingOn = draftFor.draft.toName ?? draftFor.draft.to;
    requestExceptionCorrection(id, draftFor.exceptionId, waitingOn);
    // The draft posts to this same request's shared thread. The requester's
    // own view reads the identical `threads` state (see the report).
    addNote(id, draftFor.draft.body, getPerson("sam-rivera").name);
    setDraftFor(null);
  }

  // The reply's trigger, chosen for this prototype: a presenter-visible
  // button rather than a live inbox or a timer (see the report). Posts the
  // supplier's own seeded reply into this same thread, then resolves the
  // waiting exception by document, not by a person acting.
  function handleSupplierReply() {
    if (!waitingException) return;
    addNote(id, SUPPLIER_REPLY.body, getPerson(SUPPLIER_REPLY.from).name);
    resolveExceptionByDocument(id, waitingException.id);
  }

  return (
    <div className="flex h-full min-h-0">
      <LeftQueue activeId={id} onSelect={onSelect} onBack={onBack} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="shrink-0 border-b border-border px-6 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-base font-semibold text-foreground">
                  {detail.request}
                </h1>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {detail.id}
                </span>
              </div>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {detail.requester} · {detail.value} · {detail.timing} · Assigned
                to you
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {isUrgent && (
                <Badge
                  status="error"
                  variant="secondary"
                  className="gap-1 rounded-[4px]"
                >
                  <TriangleAlert className="size-3" aria-hidden />
                  Urgent
                </Badge>
              )}
              <Badge
                status={FORK_BADGE_STATUS[detail.type]}
                variant="secondary"
                className="rounded-[4px]"
              >
                {FORK_LABEL[detail.type]}
              </Badge>
              <Badge status={STATUS_BADGE[status]} variant="secondary">
                {(decision && detail.resolvedTitles?.[decision]) ??
                  STATUS_LABEL[status]}
              </Badge>
            </div>
          </div>
        </div>

        {/* Center / right split */}
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            {/* Quote|Contract / Comms toggle */}
            <div className="flex shrink-0 gap-1 border-b border-border px-4 pt-2">
              {(["finding", "comms"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setCenterView(v)}
                  className={cn(
                    "px-3 py-2 text-xs font-medium transition-colors",
                    centerView === v
                      ? "-mb-px border-b-2 border-foreground text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {v === "finding" ? (
                    FORK_LABEL[detail.type]
                  ) : (
                    <>
                      Comms
                      {notes.length > 0 && (
                        <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground">
                          {notes.length}
                        </span>
                      )}
                    </>
                  )}
                </button>
              ))}
            </div>

            {centerView === "finding" ? (
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                {/* Independent of whichever exception is active below: a
                    waiting exception surfaces here regardless of order (see
                    the report), and never shares space with the active
                    exception's own content. */}
                {exceptionSummary.waitingCount > 0 && (
                  <div className="mx-4 mt-4 flex shrink-0 flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground sm:mx-6 lg:mx-8">
                    <Clock className="size-3.5 shrink-0" aria-hidden />
                    Waiting on {exceptionSummary.waitingOn}
                    {waitingException && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="ml-auto"
                        onClick={handleSupplierReply}
                      >
                        Simulate supplier reply
                      </Button>
                    )}
                  </div>
                )}
                {openExceptionList.length > 0 ? (
                  <ExceptionSurface
                    openList={openExceptionList}
                    onAccept={handleAcceptException}
                    onOpenDraft={handleOpenDraft}
                  />
                ) : autoReleased ? (
                  <AutoReleaseCompletion exceptions={exceptions} />
                ) : exceptionSummary.waitingCount === 0 ? (
                  <Finding
                    detail={detail}
                    decision={decision}
                    onResolve={(d) => onDecide(id, d)}
                  />
                ) : null}
              </div>
            ) : notes.length > 0 ? (
              <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-6 py-6">
                {notes.map((n) => {
                  const requesterName = detail.requester.split(" · ")[0];
                  const buyerName = getPerson("sam-rivera").name;
                  const role =
                    n.author === requesterName
                      ? "requester"
                      : n.author === buyerName
                        ? "you"
                        : "supplier";
                  return (
                    <div
                      key={n.id}
                      className="max-w-[80%] rounded-xl border bg-muted/40 px-3.5 py-2.5"
                    >
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">
                          {n.author}
                        </span>{" "}
                        · {role} · {n.time}
                      </p>
                      <p className="mt-1 text-sm text-foreground">{n.text}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 px-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No messages yet.
                </p>
                <p className="max-w-xs text-xs text-muted-foreground">
                  Start a thread with the requester or the vendor. Replies land
                  here.
                </p>
              </div>
            )}
          </div>

          <RightPanel
            detail={detail}
            decision={decision}
            activity={visibleActivity}
          />
        </div>
      </div>

      {draftFor && (
        <CorrectionDraftModal
          draft={draftFor.draft}
          onSend={handleSendDraft}
          onDiscard={() => setDraftFor(null)}
        />
      )}
    </div>
  );
}
