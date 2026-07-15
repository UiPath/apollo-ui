"use client";

import {
  ArrowDown,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Eye,
  Highlighter,
  Pause,
  UserRound,
  UserRoundCheck,
  X,
} from "lucide-react";
import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { AiMark } from "@/registry/ai-mark/ai-mark";
import { Avatar, AvatarFallback } from "@/registry/avatar/avatar";
import {
  type AgentStep,
  approveInvoice,
  buildApproval,
  buildHold,
  buildResume,
  EXCEPTION_META,
  type ExceptionType,
  exceptionMeta,
  type Finding,
  followUpWeekday,
  generateFollowUpBody,
  generateSupplierEmailBody,
  HOLD_REASONS,
  holdInvoice,
  type InvoiceException,
  type InvoiceReview,
  isRouteSuggestion,
  isSupplierRoute,
  type RunEvent,
  type RunEventInput,
  receiveCorrectedInvoice,
  resumeInvoice,
  revalidateException,
  routeMeta,
  routeOwner,
  routeToOwner,
  type Suggestion,
  type SupplierEmailDraft,
  scopeLabel,
  sendSupplierEmail,
} from "./invoice-review-data";
import { useInvoiceRuntime } from "./invoice-runtime";
import { ReasonDialog } from "./ReasonDialog";
import { SuggestedFixCard } from "./SuggestedFixCard";
import { SupplierEmailModal } from "./SupplierEmailModal";

const REVIEWER_INITIALS = "PV";

// Relative times render capitalized in standalone slots ("Just now"). For
// mid-sentence interpolation, lowercase a leading "Just now" only; other outputs
// (e.g. "3m ago") are already lowercase. Standalone timestamps stay capitalized.
function midSentenceTime(time: string): string {
  return time.replace(/^Just now\b/, "just now");
}

// Honors prefers-reduced-motion: animations are skipped, phase delays kept so
// the causal sequence still reads as discrete steps.
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

// Marker kinds mirror the AI Toolkit timeline treatment. People are avatars,
// agents carry the mark, resolved facts are a green check (a system fact, not a
// person, so not an avatar).
type MarkerKind =
  | "agent"
  | "progress"
  | "reviewer"
  | "resolved"
  | "waiting"
  | "waiting-complete"
  | "held"
  | "rejected"
  | "complete";

function TimelineMarker({ kind }: { kind: MarkerKind }) {
  if (kind === "reviewer") {
    return (
      <Avatar className="size-7">
        <AvatarFallback className="text-[11px] font-medium text-muted-foreground">
          {REVIEWER_INITIALS}
        </AvatarFallback>
      </Avatar>
    );
  }
  if (kind === "resolved") {
    return (
      <span className="flex size-7 items-center justify-center rounded-full bg-success/15 text-success">
        {/* Nudge right to optically center (the check badge weights it left). */}
        <UserRoundCheck className="size-3.5 translate-x-px" />
      </span>
    );
  }
  if (kind === "waiting") {
    // Same actor-circle grammar as resolved, info tint. A plain person (no
    // check): a check in blue would still read as completed. This is parked.
    return (
      <span className="flex size-7 items-center justify-center rounded-full bg-info/15 text-info">
        <UserRound className="size-3.5" />
      </span>
    );
  }
  if (kind === "waiting-complete") {
    // Waiting terminal: info-tone circle with a clock. Not a solid fill; the
    // solid marker stays reserved for true completion.
    return (
      <span className="flex size-7 items-center justify-center rounded-full bg-info/15 text-info">
        <Clock className="size-4" />
      </span>
    );
  }
  if (kind === "held") {
    // Reviewer hold: neutral pause. Not green (not done), not the info clock
    // (not an external dependency) — a deliberate deferral.
    return (
      <span className="flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Pause className="size-3.5" />
      </span>
    );
  }
  if (kind === "rejected") {
    // Terminal counterpart to approval: a solid destructive fill. Rejection is
    // the most consequential call, so it carries the same weight as the green
    // completion moment, in the destructive tone.
    return (
      <span className="flex size-7 items-center justify-center rounded-full bg-destructive text-white">
        <X className="size-4" />
      </span>
    );
  }
  if (kind === "complete") {
    // A flat solid-fill marker; it carries the completion moment (its rejected
    // counterpart above is the only other solid marker).
    return (
      <span className="flex size-7 items-center justify-center rounded-full bg-success text-white">
        <Check className="size-4" />
      </span>
    );
  }
  if (kind === "progress") {
    return (
      <span className="relative flex size-7 items-center justify-center rounded-full bg-insight-50 text-insight-600 dark:bg-insight-900">
        <span
          className="absolute inset-0 animate-spin rounded-full"
          style={{
            background:
              "conic-gradient(from 0deg, transparent, var(--insight-600))",
            WebkitMask:
              "radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px))",
            mask: "radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px))",
          }}
        />
        <AiMark size={14} className="text-insight-600" />
      </span>
    );
  }
  // agent complete: strong gradient fill with the white mark.
  return (
    <span
      className="flex size-7 items-center justify-center rounded-full text-white"
      style={{ background: "var(--ai-gradient-strong)" }}
    >
      <AiMark size={14} />
    </span>
  );
}

/** A rail row: marker + connector on the left, content on the right. */
function TimelineRow({
  marker,
  isLast,
  tail,
  tailGrow,
  className,
  live,
  children,
}: {
  marker: MarkerKind;
  isLast?: boolean;
  /** open-story terminals only: a rail tail fading out below the last marker
   *  ("more to come"). Closed terminals (approved/rejected) omit it. */
  tail?: boolean;
  /** grow the tail to the row's full height (fades down alongside tall content,
   *  e.g. toward the suggested fix card) instead of the short fixed gesture. */
  tailGrow?: boolean;
  className?: string;
  /** marks the newest live block, so the column can scroll to follow it */
  live?: boolean;
  children: ReactNode;
}) {
  return (
    <li className="flex gap-3" data-live={live || undefined}>
      <div className="flex flex-col items-center">
        <TimelineMarker kind={marker} />
        {!isLast && <span className="my-1 w-px flex-1 bg-border" />}
        {isLast && tail && (
          <span
            className={cn(
              "mt-1 w-px [background-image:linear-gradient(to_bottom,var(--color-border),transparent)]",
              tailGrow ? "flex-1" : "h-12",
            )}
          />
        )}
      </div>
      <div
        className={cn("flex-1 min-w-0", isLast ? "pb-0" : "pb-6", className)}
      >
        {children}
      </div>
    </li>
  );
}

// Column rhythm, tokenized so it reads as hierarchy rather than incidental
// padding. Rows own the gap below them (this keeps the connector rail
// continuous): consecutive events sit 20px apart, and the row before a section
// transition (history -> present, present -> done) opens 28px of air.
const ROW_GAP = "pb-5"; // 20px, event-to-event
const SECTION_GAP = "pb-7"; // 28px, into a section node

// The scroll-to-latest pill reveals past this distance from the bottom, set
// beyond the 120px auto-follow stick zone so it can't flicker at the boundary.
const PILL_REVEAL_PX = 160;

// Expanded-peek list shell (agent history + resolve history). Shared so both
// peeks indent to the same x (titles align across peeks). Spacing: 12px from the
// parent node to the first step (mt-3), 8px between steps (space-y-2), so the
// steps sit tighter than their offset from the parent.
const PEEK_LIST = "mt-3 space-y-2 border-l border-border pl-4";

/**
 * The single metadata separator for the whole column. One grammar: a middot
 * joins metadata, nothing else does. Spacing (6px each side) comes from the
 * parent flex gap, so every join reads identically.
 */
function Middot() {
  return (
    <span aria-hidden="true" className="shrink-0 text-sm text-muted-foreground">
      ·
    </span>
  );
}

/** Collapsed agent trail: one node, expandable into the individual steps. */
function AgentHistoryPeek({
  steps,
  bottomGap = ROW_GAP,
}: {
  steps: AgentStep[];
  /** gap below the peek: 28px when a section node follows, else 20px */
  bottomGap?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <TimelineRow marker="agent" className={bottomGap}>
      <p className="text-xs font-medium text-muted-foreground">Activity</p>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-0.5 flex w-full items-center gap-1.5 text-left"
      >
        <span className="text-sm font-medium text-foreground">
          {steps.length} checks cleared before escalating
        </span>
        {open ? (
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        )}
      </button>
      {open && (
        <ol className={PEEK_LIST}>
          {steps.map((step) => (
            // No exception attached => flat step, no chevron.
            <PeekRow
              key={step.title}
              label={step.title}
              sub={step.sub}
              time={step.time}
            />
          ))}
        </ol>
      )}
    </TimelineRow>
  );
}

// A slim history row on the rail: the shared single-line body under a marker.
// Optionally expands to a plain detail (a disposition note), so a reviewer note
// stays readable even before the log compresses into the completion peek.
function EventRow({
  marker,
  label,
  sub,
  time,
  gap = ROW_GAP,
  expandDetail,
  reducedMotion = false,
  isLast = false,
  tail = false,
}: {
  marker: MarkerKind;
  label: string;
  sub: string;
  time: string;
  gap?: string;
  expandDetail?: ReactNode;
  reducedMotion?: boolean;
  isLast?: boolean;
  tail?: boolean;
}) {
  return (
    <TimelineRow marker={marker} className={gap} isLast={isLast} tail={tail}>
      <EventRowBody
        label={label}
        sub={sub}
        time={time}
        expandDetail={expandDetail}
        reducedMotion={reducedMotion}
      />
    </TimelineRow>
  );
}

// Matches the original ExceptionBlock metric treatment: sentence-case label,
// large value, open (no card), vertical divider between sides.
function FindingCell({
  label,
  value,
  provenance,
  tone,
  muted,
  onInspect,
}: {
  label: string;
  value: string;
  provenance: string;
  tone?: "warn" | "muted";
  /** read-only history: drop all values to secondary foreground (warn stays highlighted, on muted text) */
  muted?: boolean;
  /** live ON INVOICE value only: renders the inline "Show in source" trigger */
  onInspect?: () => void;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 px-5 py-1">
      <span className="truncate text-[11px] font-medium text-muted-foreground">
        {label}
      </span>
      {/* Value + inline inspect trigger on one row; the button carries negative
          vertical margin so its hit area doesn't grow the line or shift the
          sub-label below. */}
      <div className="flex items-center gap-1">
        <span
          className={cn(
            "whitespace-nowrap text-[18px] font-medium leading-none tabular-nums",
            muted || tone === "muted"
              ? "text-muted-foreground"
              : "text-foreground",
          )}
        >
          {tone === "warn" ? (
            // Highlight the value under review: tinted wash, normal text (not an error color).
            <mark
              className={cn(
                "-ml-1 rounded bg-warning/15 px-1",
                muted ? "text-muted-foreground" : "text-foreground",
              )}
            >
              {value}
            </mark>
          ) : (
            value
          )}
        </span>
        {onInspect && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={onInspect}
                aria-label="Show in source"
                className="-my-1.5 shrink-0 text-muted-foreground"
              >
                <Highlighter className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Show in source</TooltipContent>
          </Tooltip>
        )}
      </div>
      <span className="text-xs text-muted-foreground">{provenance}</span>
    </div>
  );
}

function FindingView({
  finding,
  muted,
  onInspect,
}: {
  finding: Finding;
  muted?: boolean;
  /** when set, the ON INVOICE (warn) value gets the inspect trigger */
  onInspect?: () => void;
}) {
  const cells = finding.type === "compare" ? finding.sides : finding.items;
  if (!cells || cells.length === 0) return null;
  return (
    <div className="grid w-fit grid-flow-col divide-x divide-border [&>div:first-child]:pl-0">
      {cells.map((c) => (
        <FindingCell
          key={c.label}
          {...c}
          muted={muted}
          // The trigger belongs on the disputed value: the warn-toned ON INVOICE
          // evidence, the chip that rhymes with the document highlight.
          onInspect={c.tone === "warn" ? onInspect : undefined}
        />
      ))}
    </div>
  );
}

/** The live "you are here" exception: chip + scope, headline, finding, fix. */
// Staggered entrance for the stage sections when the active exception swaps.
const ENTER_STEP =
  "animate-in fade-in-0 slide-in-from-right-3 duration-150 ease-out";

function LiveExceptionContent({
  exception,
  isNew,
  onResolve,
  onShowInSource,
  entering = false,
  hideFix = false,
}: {
  exception: InvoiceException;
  isNew: boolean;
  onResolve: (s: Suggestion, reason?: string, note?: string) => void;
  onShowInSource: (exc: InvoiceException) => void;
  entering?: boolean;
  /** Suppress the fix card (used while the block collapses into history). */
  hideFix?: boolean;
}) {
  const isJudgment = exception.suggestions.length === 0;
  // Each section fades and slides in a beat after the previous one.
  const stepClass = entering ? ENTER_STEP : undefined;
  const stepStyle = (i: number): CSSProperties | undefined =>
    entering
      ? { animationDelay: `${i * 70}ms`, animationFillMode: "both" }
      : undefined;
  return (
    <>
      <div
        className={cn("flex min-h-7 flex-wrap items-center gap-2", stepClass)}
        style={stepStyle(0)}
      >
        {/* Live chip is the primary (solid) treatment; waiting rows stay soft. */}
        <Badge status={exceptionMeta(exception).tone} variant="default">
          {exceptionMeta(exception).label}
        </Badge>
        {isNew && (
          <Badge status="info" variant="secondary">
            New
          </Badge>
        )}
      </div>
      {/* The single anchor: largest element. Everything else steps down from it
          via size and color. */}
      {/* Wraps freely; never truncates/ellipsizes on the stage. */}
      {/* Focus/current anchor is bold; historical + terminal titles stay 500. */}
      <h2
        className={cn(
          "mt-3.5 text-[22px] font-bold leading-[1.25] text-foreground",
          stepClass,
        )}
        style={{
          letterSpacing: "-0.01em",
          textWrap: "balance",
          maxWidth: "22ch",
          ...stepStyle(1),
        }}
      >
        {exception.headline}
      </h2>
      {/* Comparison adds info (two values); a single value just restates the
          headline, so render nothing between the headline and the fix. */}
      {exception.finding.type === "compare" && (
        <div className={cn("mt-[18px]", stepClass)} style={stepStyle(2)}>
          {/* The inspect trigger rides the ON INVOICE evidence value (the amber
              chip that rhymes with the document highlight), not the action row.
              Live + anchored only; suppressed while collapsing (hideFix). */}
          <FindingView
            finding={exception.finding}
            onInspect={
              !hideFix && exception.sourceAnchors?.length
                ? () => onShowInSource(exception)
                : undefined
            }
          />
        </div>
      )}
      {!hideFix &&
        (isJudgment ? (
          exception.reasoning && (
            <p
              className={cn(
                "mt-5 max-w-prose text-sm leading-normal text-muted-foreground",
                stepClass,
              )}
              style={stepStyle(3)}
            >
              {exception.reasoning}
            </p>
          )
        ) : (
          <div className={stepClass} style={stepStyle(3)}>
            <SuggestedFixCard
              key={exception.id}
              suggestions={exception.suggestions}
              onResolve={onResolve}
            />
          </div>
        ))}
    </>
  );
}

/**
 * Stable index of all open exceptions (master-detail with the stage above).
 * Rows keep a fixed order and never disappear on selection; clicking a row
 * projects it onto the stage. The active row is highlighted and shows a
 * "Viewing" indicator in place of its scope label.
 */
function ExceptionIndex({
  items,
  activeId,
  isNew,
  onSelect,
  resolvingId,
}: {
  items: InvoiceException[];
  activeId: string;
  isNew: (e: InvoiceException) => boolean;
  onSelect: (id: string) => void;
  /** During a resolve, this row shows a resolved-in-place state (no Viewing). */
  resolvingId?: string;
}) {
  // Dev guard: "Viewing" must only ever point at the exception on stage.
  if (
    process.env.NODE_ENV !== "production" &&
    activeId &&
    !items.some((e) => e.id === activeId)
  ) {
    console.error(
      "[ExceptionIndex] Viewing points at an id not in the index:",
      activeId,
    );
  }
  return (
    <ul className="mt-5 divide-y divide-border overflow-hidden rounded-lg border border-border">
      {items.map((e, i) => {
        const isResolving = e.id === resolvingId;
        const isActive = !isResolving && e.id === activeId;
        return (
          <li key={e.id}>
            <button
              type="button"
              onClick={() => onSelect(e.id)}
              disabled={isResolving}
              aria-current={isActive || undefined}
              className={cn(
                "flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary",
                isActive ? "bg-muted/60" : "hover:bg-muted/40",
                isResolving && "hover:bg-transparent",
              )}
            >
              {isResolving ? (
                <Check className="size-3.5 shrink-0 text-success" />
              ) : (
                <span
                  className={cn(
                    "w-3.5 shrink-0 text-center text-xs tabular-nums",
                    isActive
                      ? "font-medium text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {i + 1}
                </span>
              )}
              <Badge
                status={exceptionMeta(e).tone}
                variant="secondary"
                className="shrink-0"
              >
                {exceptionMeta(e).label}
              </Badge>
              <span
                className={cn(
                  "min-w-0 flex-1 truncate text-sm",
                  isActive
                    ? "font-medium text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {e.headline}
              </span>
              {isActive ? (
                <span className="flex shrink-0 items-center gap-1 text-xs text-primary">
                  <Eye className="size-3.5" />
                  Viewing
                </span>
              ) : (
                <>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {scopeLabel(e.scope)}
                  </span>
                  {isNew(e) && (
                    <Badge
                      status="info"
                      variant="secondary"
                      className="shrink-0"
                    >
                      New
                    </Badge>
                  )}
                </>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * A resolving exception collapsing in place into its resolved timeline row. The
 * exception detail collapses (grid-rows) while the compact resolved row fades
 * in; nothing above it moves. Reduced motion jumps straight to the end state.
 */
function ResolvingBlock({
  exception,
  label,
  sub,
  phase,
  reducedMotion,
}: {
  exception: InvoiceException;
  label: string;
  sub: string;
  phase: "confirm" | "check" | "reveal";
  reducedMotion: boolean;
}) {
  const [collapsed, setCollapsed] = useState(
    reducedMotion || phase !== "confirm",
  );
  useEffect(() => {
    if (reducedMotion || phase !== "confirm") {
      setCollapsed(true);
      return;
    }
    const t = setTimeout(() => setCollapsed(true), 30);
    return () => clearTimeout(t);
  }, [phase, reducedMotion]);

  return (
    <div>
      {/* The compact resolved row emerges once the detail has faded out. Same
          shared anatomy as the committed row it becomes, so nothing pops on
          commit. The wrapper only carries the fade. */}
      <div
        className={cn(
          "transition-opacity",
          collapsed
            ? "opacity-100 duration-150 delay-[120ms]"
            : "opacity-0 duration-0",
        )}
      >
        <EventRowBody label={label} sub={sub} time="Just now" />
      </div>
      {/* The exception detail (minus the fix card) collapses to zero height.
          Its content fades out fast (~120ms) so the height animates on
          invisible content and never clips a glyph mid-collapse. */}
      <div
        className="grid transition-[grid-template-rows] duration-[250ms] ease-out"
        style={{ gridTemplateRows: collapsed ? "0fr" : "1fr" }}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className={cn(
              "pt-3 transition-opacity duration-[120ms]",
              collapsed && "opacity-0",
            )}
          >
            <LiveExceptionContent
              exception={exception}
              isNew={false}
              onResolve={() => {}}
              onShowInSource={() => {}}
              hideFix
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * The stage projects the selected exception. On swap the outgoing content fades
 * out and shifts left, the incoming fades in and shifts from the right (~150ms).
 * Only the stage animates; the index below never moves.
 */
function Stage({
  exception,
  isNew,
  onResolve,
  onShowInSource,
}: {
  exception: InvoiceException;
  isNew: (e: InvoiceException) => boolean;
  onResolve: (s: Suggestion, reason?: string, note?: string) => void;
  onShowInSource: (exc: InvoiceException) => void;
}) {
  const [displayed, setDisplayed] = useState(exception);
  const [phase, setPhase] = useState<"in" | "out">("in");

  useEffect(() => {
    if (exception.id === displayed.id) return;
    setPhase("out");
    // Let the old content clear (~150ms) plus a short beat before the new
    // content staggers in.
    const t = setTimeout(() => {
      setDisplayed(exception);
      setPhase("in");
    }, 200);
    return () => clearTimeout(t);
  }, [exception.id, displayed.id]);

  return (
    <div
      className={cn(
        phase === "out" &&
          "animate-out fade-out-0 slide-out-to-left-4 fill-mode-forwards duration-150 ease-in",
      )}
    >
      {/* Keyed so the staggered entrance replays for each newly selected item. */}
      <LiveExceptionContent
        key={displayed.id}
        exception={displayed}
        isNew={isNew(displayed)}
        onResolve={onResolve}
        onShowInSource={onShowInSource}
        entering={phase === "in"}
      />
    </div>
  );
}

/** The reviewer's node: optional group header, the stage, the exception index. */
// Tone dots for the Findings map.
const DOT_TONE: Record<string, string> = {
  error: "bg-destructive",
  warning: "bg-warning",
  info: "bg-info",
};

// --- Findings map (cursor model) --------------------------------------------

type FindingsRowState = "pending" | "current" | "resolved";

type FindingsIndividual = {
  kind: "individual";
  exception: InvoiceException;
  state: FindingsRowState;
};

type FindingsGroup = {
  kind: "group";
  type: ExceptionType;
  members: InvoiceException[];
  lines: number[];
  state: FindingsRowState;
  /** 0-based index of the active member in members[]; null when no member is active */
  currentMemberIdx: number | null;
  resolvedCount: number;
};

type FindingsRow = FindingsIndividual | FindingsGroup;

/** Returns "Line N", "Lines N–M" (consecutive), or "Lines N, M" (non-consecutive). */
function lineRangeLabel(lines: number[]): string | null {
  if (lines.length === 0) return null;
  if (lines.length === 1) return `Line ${lines[0]}`;
  const sorted = [...lines].sort((a, b) => a - b);
  const consecutive = sorted.every(
    (n, i) => i === 0 || n === sorted[i - 1] + 1,
  );
  return consecutive
    ? `Lines ${sorted[0]}–${sorted[sorted.length - 1]}`
    : `Lines ${sorted.join(", ")}`;
}

/** Synthesis text for an individual exception row; falls back to the type label. */
function rowSynthesis(e: InvoiceException): string {
  if (e.synthesis && e.synthesis.length <= 45) return e.synthesis;
  return EXCEPTION_META[e.type].label;
}

/**
 * Builds the fixed-order findings rows from the full non-waiting exception list.
 * Types with 2+ members collapse into a group row; singletons remain individual.
 * Row positions are stable: order follows first occurrence of each type in `items`.
 */
function buildFindingsRows(
  items: InvoiceException[],
  resolvedIds: ReadonlySet<string>,
  activeId: string,
): FindingsRow[] {
  const byType = new Map<ExceptionType, InvoiceException[]>();
  const typeOrder: ExceptionType[] = [];
  for (const e of items) {
    if (!byType.has(e.type)) {
      typeOrder.push(e.type);
      byType.set(e.type, []);
    }
    byType.get(e.type)?.push(e);
  }

  const rows: FindingsRow[] = [];
  for (const type of typeOrder) {
    const members = byType.get(type);
    if (!members) continue;
    if (members.length > 1) {
      const resolvedCount = members.filter((m) => resolvedIds.has(m.id)).length;
      const currentMemberIdx = members.findIndex((m) => m.id === activeId);
      const lineSet = new Set<number>();
      for (const m of members) {
        if (m.scope.level === "line") lineSet.add(m.scope.line);
      }
      const lines = [...lineSet].sort((a, b) => a - b);
      let state: FindingsRowState;
      if (currentMemberIdx >= 0) {
        state = "current";
      } else if (resolvedCount === members.length) {
        state = "resolved";
      } else {
        state = "pending";
      }
      rows.push({
        kind: "group",
        type,
        members,
        lines,
        state,
        currentMemberIdx: currentMemberIdx >= 0 ? currentMemberIdx : null,
        resolvedCount,
      });
    } else {
      const e = members[0];
      let state: FindingsRowState;
      if (e.id === activeId) {
        state = "current";
      } else if (resolvedIds.has(e.id)) {
        state = "resolved";
      } else {
        state = "pending";
      }
      rows.push({ kind: "individual", exception: e, state });
    }
  }
  return rows;
}

function FindingsIndividualRow({
  row,
  onSelect,
}: {
  row: FindingsIndividual;
  onSelect: (id: string) => void;
}) {
  const { exception: e, state } = row;
  const isPending = state === "pending";
  const isCurrent = state === "current";
  const isResolved = state === "resolved";

  const rowContent = (
    <>
      {isResolved ? (
        <Check className="size-3.5 shrink-0 text-muted-foreground" />
      ) : isCurrent ? (
        <span className="size-2 shrink-0 rounded-full bg-warning" />
      ) : (
        <span
          className={cn(
            "size-1.5 shrink-0 rounded-full",
            DOT_TONE[exceptionMeta(e).tone] ?? "bg-muted-foreground",
          )}
        />
      )}
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-[13px]",
          isResolved
            ? "text-muted-foreground"
            : isCurrent
              ? "font-medium text-foreground"
              : "text-foreground",
        )}
      >
        {rowSynthesis(e)}
        {e.scope.level === "line" && (
          <span className="font-normal text-muted-foreground">
            {" · "}Line {e.scope.line}
          </span>
        )}
      </span>
      {isCurrent && (
        <span className="shrink-0 text-[10px] font-medium text-muted-foreground">
          Current
        </span>
      )}
      {isPending && (
        <ChevronRight className="size-3 shrink-0 text-muted-foreground" />
      )}
    </>
  );

  if (isPending) {
    return (
      <button
        type="button"
        onClick={() => onSelect(e.id)}
        className="flex min-h-7 w-full items-center gap-2 rounded px-2 text-left transition-colors duration-[120ms] hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
      >
        {rowContent}
      </button>
    );
  }
  return (
    <div
      className={cn(
        "flex min-h-7 items-center gap-2 rounded px-2",
        isCurrent && "rounded-md bg-muted/30 ring-1 ring-inset ring-border/60",
      )}
    >
      {rowContent}
    </div>
  );
}

function FindingsGroupRow({
  row,
  effectiveResolved,
  onSelect,
}: {
  row: FindingsGroup;
  effectiveResolved: ReadonlySet<string>;
  onSelect: (id: string) => void;
}) {
  const { type, members, lines, state, resolvedCount } = row;
  const meta = EXCEPTION_META[type];
  const isPending = state === "pending";
  const isCurrent = state === "current";
  const isResolved = state === "resolved";

  const locator = lineRangeLabel(lines);
  const unresolved = members.filter((m) => !effectiveResolved.has(m.id));
  // Progress: how many members are done so far (changes on resolve, not cursor move).
  const progressText = `${resolvedCount} of ${members.length} done`;
  const firstPendingId = unresolved[0]?.id ?? members[0].id;

  const rowContent = (
    <>
      {isResolved ? (
        <Check className="size-3.5 shrink-0 text-muted-foreground" />
      ) : isCurrent ? (
        <span className="size-2 shrink-0 rounded-full bg-warning" />
      ) : (
        <span
          className={cn(
            "size-1.5 shrink-0 rounded-full",
            DOT_TONE[meta.tone] ?? "bg-muted-foreground",
          )}
        />
      )}
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-[13px]",
          isResolved
            ? "text-muted-foreground"
            : isCurrent
              ? "font-medium text-foreground"
              : "text-foreground",
        )}
      >
        {meta.label}
        {!isResolved && locator && (
          <span className="font-normal text-muted-foreground">
            {" · "}
            {locator}
          </span>
        )}
        {isResolved && (
          <span className="font-normal text-muted-foreground">
            {" · "}
            {resolvedCount} done
          </span>
        )}
      </span>
      {isCurrent && (
        <>
          <Badge
            variant="outline"
            className="h-4 shrink-0 px-1.5 text-[11px] text-muted-foreground"
          >
            {progressText}
          </Badge>
          <span className="shrink-0 text-[10px] font-medium text-muted-foreground">
            Current
          </span>
        </>
      )}
      {isPending && (
        <>
          <Badge
            variant="outline"
            className="h-4 shrink-0 px-1.5 text-[11px] text-muted-foreground"
          >
            {unresolved.length}
          </Badge>
          <ChevronRight className="size-3 shrink-0 text-muted-foreground" />
        </>
      )}
    </>
  );

  if (isPending) {
    return (
      <button
        type="button"
        onClick={() => onSelect(firstPendingId)}
        className="flex h-7 w-full items-center gap-2 rounded px-2 text-left transition-colors duration-[120ms] hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
      >
        {rowContent}
      </button>
    );
  }
  return (
    <div
      className={cn(
        "flex min-h-7 items-center gap-2 rounded px-2",
        isCurrent && "rounded-md bg-muted/30 ring-1 ring-inset ring-border/60",
      )}
    >
      {rowContent}
    </div>
  );
}

/**
 * Findings map: lists ALL non-waiting findings (open + resolved) in fixed
 * escalation order. The cursor (activeId) marks one row current at all times;
 * resolved rows stay in place with a muted check. Hides when only one finding
 * total. `resolvingId` transiently treats an exception as resolved during the
 * resolve choreography so the in-flight row shows a resolved-in-place state.
 */
function FindingsMap({
  items,
  activeId,
  resolvedIds,
  resolvingId,
  onSelect,
}: {
  items: InvoiceException[];
  activeId: string;
  resolvedIds: ReadonlySet<string>;
  resolvingId?: string;
  onSelect: (id: string) => void;
}) {
  if (items.length <= 1) return null;

  const effectiveResolved: ReadonlySet<string> = resolvingId
    ? new Set([...resolvedIds, resolvingId])
    : resolvedIds;

  const rows = buildFindingsRows(items, effectiveResolved, activeId);
  const totalCount = items.length;
  const resolvedCount = items.filter((e) => effectiveResolved.has(e.id)).length;

  const headerLabel =
    resolvedCount > 0
      ? `Findings · ${resolvedCount} of ${totalCount} resolved`
      : `Findings · ${totalCount}`;

  return (
    <div className="mt-5">
      <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">
        {headerLabel}
      </p>
      <ul className="space-y-px">
        {rows.map((row) =>
          row.kind === "individual" ? (
            <li key={row.exception.id}>
              <FindingsIndividualRow row={row} onSelect={onSelect} />
            </li>
          ) : (
            <li key={row.type}>
              <FindingsGroupRow
                row={row}
                effectiveResolved={effectiveResolved}
                onSelect={onSelect}
              />
            </li>
          ),
        )}
      </ul>
    </div>
  );
}

function ExceptionGroup({
  active,
  openList,
  nonWaitingList,
  resolvedIdSet,
  showHeader,
  counter,
  isNew,
  variant,
  onResolve,
  onShowInSource,
  onSelect,
}: {
  active: InvoiceException;
  openList: InvoiceException[];
  nonWaitingList: InvoiceException[];
  resolvedIdSet: ReadonlySet<string>;
  showHeader: boolean;
  counter: string;
  isNew: (e: InvoiceException) => boolean;
  variant: "strip" | "index";
  onResolve: (s: Suggestion, reason?: string, note?: string) => void;
  onShowInSource: (exc: InvoiceException) => void;
  onSelect: (id: string) => void;
}) {
  return (
    // Terminal node of the live rail: isLast so no connector dangles below the
    // decision area. tail + tailGrow: an open story, so the rail runs down the
    // decision content and fades out as it approaches the suggested fix card.
    <TimelineRow marker="reviewer" className="pb-12" isLast tail tailGrow live>
      {showHeader && (
        <div className="mb-4 flex min-h-7 items-center gap-1.5">
          <span className="text-sm font-medium text-foreground">
            Needs your decision
          </span>
          <Middot />
          <span className="text-xs text-muted-foreground">{counter}</span>
        </div>
      )}
      <Stage
        exception={active}
        isNew={isNew}
        onResolve={onResolve}
        onShowInSource={onShowInSource}
      />
      {variant === "index" ? (
        openList.length >= 2 && (
          <ExceptionIndex
            items={openList}
            activeId={active.id}
            isNew={isNew}
            onSelect={onSelect}
          />
        )
      ) : (
        <FindingsMap
          items={nonWaitingList}
          activeId={active.id}
          resolvedIds={resolvedIdSet}
          onSelect={onSelect}
        />
      )}
    </TimelineRow>
  );
}

// The event log (RunEvent) now lives in the runtime store (invoice-review-data),
// so history survives remounts. These are the derived row types used for render.
type ResolvedEvent = Extract<RunEvent, { kind: "resolved" }>;
type WaitingEvent = Extract<RunEvent, { kind: "waiting" }>;
type FollowedUpEvent = Extract<RunEvent, { kind: "followed-up" }>;
// Rows that expand to their original exception (resolved / waiting / follow-up).
type ExpandableEvent = ResolvedEvent | WaitingEvent | FollowedUpEvent;

/** The attribution line for a stamp: "· by you · {time}" / "· waiting ... ·". */
function stampByLine(event: ExpandableEvent): string {
  if (event.kind === "waiting") {
    const to = event.draft?.to;
    return to
      ? `· ${to} · waiting for a corrected invoice · ${event.time}`
      : `· waiting for a corrected invoice · ${event.time}`;
  }
  if (event.kind === "followed-up") {
    return `· ${event.draft.to} · reminder sent · ${event.time}`;
  }
  return `${event.auto ? "· automatically" : "· by you"} · ${event.time}`;
}

/**
 * Height + opacity collapse for an expanded row. User-initiated, so it may
 * displace content below. Reduced motion snaps to the end state.
 */
function ExpandRegion({
  open,
  reducedMotion,
  children,
}: {
  open: boolean;
  reducedMotion: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid",
        open ? "opacity-100" : "opacity-0",
        !reducedMotion &&
          "transition-[grid-template-rows,opacity] duration-200 ease-out",
      )}
      style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}

/**
 * The read-only sent email (subject + body). One renderer shared by the expanded
 * waiting/follow-up history rows and the waiting terminal's request card, so
 * "render the sent email" never drifts into two implementations.
 */
function SentEmailBlock({ draft }: { draft: SupplierEmailDraft }) {
  return (
    <div>
      <p className="text-[13px] font-medium text-foreground">{draft.subject}</p>
      <p className="mt-1 whitespace-pre-line text-[13px] leading-relaxed text-muted-foreground">
        {draft.body}
      </p>
    </div>
  );
}

/**
 * The stamp shown in place of the fix actions in the history view. Resolved rows
 * get a success check; waiting and follow-up rows get an info clock, read-only.
 */
function HistoryStamp({ event }: { event: ExpandableEvent }) {
  const waiting = event.kind === "waiting" || event.kind === "followed-up";
  return (
    <div className="flex items-center gap-1.5">
      {waiting ? (
        <Clock className="size-3.5 shrink-0 text-info" />
      ) : (
        <Check className="size-3.5 shrink-0 text-success" />
      )}
      <span className="text-[13px] font-medium text-foreground">
        {event.label}
      </span>
      <span className="text-xs text-muted-foreground">
        {stampByLine(event)}
      </span>
    </div>
  );
}

/**
 * The original exception in past-tense, read-only form. Past tense is carried by
 * color and opacity, not size or labels: chip untouched, headline stepped to a
 * secondary foreground, values muted, the fix reduced to a resolution stamp.
 * Values come from the exception record as captured, not from patched data.
 */
function HistoricalExceptionView({ event }: { event: ExpandableEvent }) {
  const exception = event.exception;
  if (!exception) return null;
  const meta = exceptionMeta(exception);
  const reasoning = exception.suggestions[0]?.reasoning ?? exception.reasoning;
  return (
    <div className="opacity-[0.85]">
      <div className="flex min-h-7 flex-wrap items-center gap-2">
        {/* Badge treatment untouched; only the surrounding context reads as past.
            No scope label here: the headline below already carries the scope. */}
        <Badge status={meta.tone} variant="secondary">
          {meta.label}
        </Badge>
      </div>
      {/* Anchor headline shape, stepped to a secondary foreground. */}
      <h3
        className="mt-3 text-[22px] font-medium leading-[1.25] text-secondary-foreground"
        style={{
          letterSpacing: "-0.01em",
          maxWidth: "22ch",
          textWrap: "balance",
        }}
      >
        {exception.headline}
      </h3>
      {/* Match the live stage: only comparisons add information worth showing. */}
      {exception.finding.type === "compare" && (
        <div className="mt-[18px]">
          <FindingView finding={exception.finding} muted />
        </div>
      )}
      {/* Quiet fix shell: reasoning as it was, actions replaced by the stamp. */}
      <Card
        variant="solid"
        className="mt-5 max-w-[480px] border-border bg-muted/40"
      >
        <CardContent className="flex flex-col gap-4">
          {reasoning && (
            <p className="text-sm leading-normal text-muted-foreground">
              {reasoning}
            </p>
          )}
          <HistoryStamp event={event} />
          {/* The selected reason chip on an internal route, then the reviewer's
              optional note. Plain text, no AI marker: the reviewer's own words. */}
          {event.kind === "waiting" && event.reason && (
            <p className="text-sm leading-normal text-secondary-foreground">
              Reason: {event.reason}
            </p>
          )}
          {event.kind === "waiting" && event.note && (
            <p className="text-sm leading-normal text-secondary-foreground">
              Note: {event.note}
            </p>
          )}
          {/* Audit artifact: the message we actually sent the supplier. Read-only,
              inside the shell, at the historical view's muted treatment. */}
          {(event.kind === "waiting" || event.kind === "followed-up") &&
            event.draft && (
              <div className="border-t border-border/60 pt-3">
                <SentEmailBlock draft={event.draft} />
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * The single row anatomy shared by every row in the column: one inline run of
 * title (primary) + sub (muted, truncates only when it genuinely overflows) +
 * "· {relative time}" (muted), with the expand chevron immediately after the
 * time when the row carries a hidden original exception. Nothing is
 * right-aligned; the run hugs the left so the chevron sits where the eye already
 * is. When expandable, the whole run is the toggle and the original exception
 * unfolds beneath it (lossless history). Expansion is per-session, local to the
 * row, so it survives resolve commits below it and multiple rows can be open.
 */
function EventRowBody({
  label,
  sub,
  time,
  expandableEvent,
  expandDetail,
  reducedMotion = false,
}: {
  label: string;
  sub: string;
  time: string;
  /** present with an attached exception => the row expands to the original */
  expandableEvent?: ExpandableEvent;
  /** generic expandable content for rows without an exception (e.g. a hold note) */
  expandDetail?: ReactNode;
  reducedMotion?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const exception = expandableEvent?.exception;
  // Exception rows expand to the full historical view; other rows may still
  // expand to a plain detail (a hold note). Either makes the row a toggle.
  const detail =
    exception && expandableEvent ? (
      <HistoricalExceptionView event={expandableEvent} />
    ) : (
      expandDetail
    );
  const expandable = !!detail;

  const run = (
    <>
      {/* Title + sub inline on the left; title anchors the scan (500 weight),
          sub is secondary and truncates before reaching the time column. */}
      <span className="mr-2 shrink-0 text-sm font-medium text-foreground">
        {label}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm text-secondary-foreground">
        {sub}
      </span>
      {/* Right-aligned time column: tabular-nums so times digit-align down the
          column, never wraps or truncates, 16px min gap from the sub. */}
      <span className="ml-4 shrink-0 whitespace-nowrap text-xs tabular-nums text-muted-foreground">
        {time}
      </span>
      {/* Fixed 20px chevron slot, outside the time alignment. Empty on
          non-expandable rows so every time right-aligns to the same edge. */}
      <span className="flex w-5 shrink-0 items-center justify-center">
        {expandable && (
          <ChevronRight
            className={cn(
              "size-3.5 text-muted-foreground",
              !reducedMotion && "transition-transform duration-200",
              open && "rotate-90",
            )}
          />
        )}
      </span>
    </>
  );

  if (!expandable) {
    return <div className="flex min-h-7 items-center pt-0.5">{run}</div>;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex min-h-7 w-full items-center rounded pt-0.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {run}
      </button>
      <ExpandRegion open={open} reducedMotion={reducedMotion}>
        <div className="pt-4">{detail}</div>
      </ExpandRegion>
    </>
  );
}

/**
 * A history row on the rail: the shared body under an actor marker. Resolved
 * events get the success marker; waiting (routed) and follow-up events get the
 * info marker.
 */
function HistoryEventRow({
  event,
  reducedMotion,
  gap = ROW_GAP,
}: {
  event: ExpandableEvent;
  reducedMotion: boolean;
  gap?: string;
}) {
  return (
    <TimelineRow
      marker={event.kind === "resolved" ? "resolved" : "waiting"}
      className={gap}
    >
      <EventRowBody
        label={event.label}
        sub={event.sub}
        time={event.time}
        expandableEvent={event}
        reducedMotion={reducedMotion}
      />
    </TimelineRow>
  );
}

// The three-phase resolve choreography (see ResolvingNode). One region changes
// at a time, in causal order: confirm -> check -> reveal, then commit.
//
// mode "fix" runs all three phases (collapse -> re-validate -> reveal). mode
// "route" changes no data, so it collapses the block into a waiting row and
// commits after confirm: no re-check, no "Re-validated" event.
type ResolvePhase = "confirm" | "check" | "reveal";
type ResolveMode = "fix" | "route";
type ResolveState = {
  exc: InvoiceException;
  mode: ResolveMode;
  label: string;
  sub: string;
  shortLabel: string;
  dataPatch?: Partial<InvoiceReview>;
  phase: ResolvePhase;
  fresh: InvoiceException[];
  clearedInList: string[];
  settledSub: string;
  /** route mode: who we are waiting on (drives the waiting row + park) */
  waitingOn?: string;
  /** internal route: the owner's role, for the terminal summary line */
  waitingRole?: string;
  /** internal route: the selected reason chip, for the expanded routed event */
  reason?: string;
  /** internal route: the reviewer's optional handoff note */
  note?: string;
  /** supplier route: the sent email, frozen onto the waiting record on commit */
  draft?: SupplierEmailDraft;
  /** corrected-invoice path: use this seam result instead of revalidateException */
  correctedRevalidation?: { cleared: string[]; surfaced: InvoiceException[] };
};

/**
 * Renders the resolve sequence in place of the live group while a resolve is in
 * flight. Nothing inserts above it: the resolving exception collapses into its
 * resolved row (Phase 1), a re-validating row appears below (Phase 2, spinner ->
 * AI mark at reveal), and the still-open issues stay listed with the resolving
 * item shown resolved-in-place. The next exception and any surfaced items only
 * appear on commit, handled by the parent.
 */
function ResolvingNode({
  resolve,
  openList,
  nonWaitingList,
  resolvedIdSet,
  showHeader,
  counter,
  isNew,
  variant,
  reducedMotion,
}: {
  resolve: ResolveState;
  openList: InvoiceException[];
  nonWaitingList: InvoiceException[];
  resolvedIdSet: ReadonlySet<string>;
  showHeader: boolean;
  counter: string;
  isNew: (e: InvoiceException) => boolean;
  variant: "strip" | "index";
  reducedMotion: boolean;
}) {
  const { exc, mode, phase, label, sub, settledSub } = resolve;
  const others = openList.filter((e) => e.id !== exc.id);
  const hasOthers = others.length > 0;
  // Route mode parks the exception into a waiting row (info marker) and never
  // re-checks, so no re-validating row appears.
  const isRoute = mode === "route";
  // Which row ends the rail, so its connector terminates cleanly (nothing
  // follows the resolving node now that the explainer is gone).
  const showReValidate = !isRoute && phase !== "confirm";
  const showReviewer = showHeader || hasOthers;
  return (
    <>
      <TimelineRow
        marker={isRoute ? "waiting" : "resolved"}
        isLast={!showReValidate && !showReviewer}
        tail={!showReValidate && !showReviewer}
      >
        <ResolvingBlock
          exception={exc}
          label={label}
          sub={sub}
          phase={phase}
          reducedMotion={reducedMotion}
        />
      </TimelineRow>
      {showReValidate && (
        <EventRow
          marker={phase === "reveal" ? "agent" : "progress"}
          label={phase === "reveal" ? "Re-validated" : "Re-validating"}
          sub={phase === "reveal" ? settledSub : "Re-checking against Coupa"}
          time="Just now"
          isLast={!showReviewer}
          tail={!showReviewer}
        />
      )}
      {showReviewer && (
        <TimelineRow marker="reviewer" isLast tail>
          {showHeader && (
            <div className="mb-4 flex min-h-7 items-center gap-1.5">
              <span className="text-sm font-medium text-foreground">
                Needs your decision
              </span>
              <Middot />
              <span className="text-xs text-muted-foreground">{counter}</span>
            </div>
          )}
          {variant === "index" ? (
            openList.length >= 2 && (
              <ExceptionIndex
                items={openList}
                activeId=""
                resolvingId={exc.id}
                isNew={isNew}
                onSelect={() => {}}
              />
            )
          ) : (
            <FindingsMap
              items={nonWaitingList}
              activeId=""
              resolvedIds={resolvedIdSet}
              resolvingId={exc.id}
              onSelect={() => {}}
            />
          )}
        </TimelineRow>
      )}
    </>
  );
}

/**
 * One row inside any expanded peek (agent history or resolve history): the shared
 * single-line body in a list item. The chevron and expansion are the only
 * optional parts, present only when an exception is attached; agent steps pass
 * none and render flat. One row anatomy for the entire column.
 */
function PeekRow({
  label,
  sub,
  time,
  expandableEvent,
  expandDetail,
  reducedMotion,
}: {
  label: string;
  sub: string;
  time: string;
  expandableEvent?: ExpandableEvent;
  expandDetail?: ReactNode;
  reducedMotion?: boolean;
}) {
  return (
    <li>
      <EventRowBody
        label={label}
        sub={sub}
        time={time}
        expandableEvent={expandableEvent}
        expandDetail={expandDetail}
        reducedMotion={reducedMotion}
      />
    </li>
  );
}

/** A plain expanded detail for a non-exception event: the reviewer's note on a
 *  hold. Matches the historical note treatment (no AI marker). */
function EventNoteDetail({ note }: { note: string }) {
  return (
    <p className="text-sm leading-normal text-secondary-foreground">
      Note: {note}
    </p>
  );
}

/**
 * At completion, the reviewer's resolve log compresses into a peek (mirroring
 * the agent peek), expandable to the full accumulated log. Collapsing the peek
 * unmounts its rows, so it collapses any rows opened within it.
 */
function ResolveHistoryPeek({
  events,
  waitingCount,
  reducedMotion,
}: {
  events: RunEvent[];
  /** CURRENT waiting count, not the historical waiting-event count: a returned
   *  exception leaves its waiting row in history but is no longer waiting. */
  waitingCount: number;
  reducedMotion: boolean;
}) {
  const [open, setOpen] = useState(false);
  const resolvedByYou = events.filter(
    (e) => e.kind === "resolved" && !e.auto,
  ).length;
  const rechecks = events.filter((e) => e.kind === "revalidated").length;
  // Build from parts, omitting any zero-count clause. Waiting reflects live
  // state (passed in), so it never renders under "All checks passed".
  const parts: string[] = [];
  if (resolvedByYou > 0) {
    parts.push(
      `${resolvedByYou} ${resolvedByYou === 1 ? "issue" : "issues"} resolved by you`,
    );
  }
  if (rechecks > 0) {
    parts.push(
      `${rechecks} ${rechecks === 1 ? "re-check" : "re-checks"} passed`,
    );
  }
  if (waitingCount > 0) parts.push(`${waitingCount} waiting`);
  const label = parts.length > 0 ? parts.join(", ") : "Earlier activity";
  return (
    <TimelineRow marker="resolved" className={SECTION_GAP}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-7 w-full items-center gap-1.5 text-left"
      >
        <span className="text-sm text-muted-foreground">{label}</span>
        {open ? (
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        )}
      </button>
      {open && (
        <ol className={PEEK_LIST}>
          {events.map((e) => (
            <PeekRow
              key={e.key}
              label={e.label}
              sub={e.sub}
              time={e.time}
              expandableEvent={
                e.kind === "resolved" ||
                e.kind === "waiting" ||
                e.kind === "followed-up"
                  ? e
                  : undefined
              }
              expandDetail={
                e.kind === "disposition" && e.note ? (
                  <EventNoteDetail note={e.note} />
                ) : undefined
              }
              reducedMotion={reducedMotion}
            />
          ))}
        </ol>
      )}
    </TimelineRow>
  );
}

/**
 * A quiet Hold trigger + the shared park-family dialog (reason chips + optional
 * note), so Hold and Route read as one family and match standard dialog chrome.
 * Cancel / X / Esc / overlay dismiss with zero trace; commit is the only write.
 */
function HoldDialog({
  label,
  onHold,
}: {
  label: string;
  onHold: (reason: string, note?: string) => void;
}) {
  return (
    <ReasonDialog
      trigger={
        <Button size="sm" variant="secondary">
          {label}
        </Button>
      }
      title="Hold invoice"
      description="Park this invoice with a reason. It stays in your queue until resolved."
      chips={HOLD_REASONS}
      commitLabel="Hold invoice"
      onCommit={onHold}
    />
  );
}

/** The completion end state: the only solid-fill marker, a title at the anchor
 * scale, a summary built from the resolutions, and the disposition actions. */
function TerminalBlock({
  summary,
  onApprove,
  onHold,
}: {
  summary: string;
  onApprove: () => void;
  onHold: (reason: string, note?: string) => void;
}) {
  return (
    // Decision still pending (approve/hold), so the story is open: tail.
    <TimelineRow marker="complete" isLast tail live>
      <div className="animate-in fade-in-0 duration-200 ease-out">
        <h2
          className="text-[22px] font-bold leading-[1.25] text-foreground"
          style={{ letterSpacing: "-0.01em" }}
        >
          All checks passed
        </h2>
        <p className="mt-1.5 max-w-prose text-sm leading-normal text-muted-foreground">
          {summary}
        </p>
        <div className="mt-4 flex items-center gap-2">
          <Button size="sm" onClick={onApprove}>
            Approve invoice
          </Button>
          <HoldDialog label="Hold" onHold={onHold} />
        </div>
      </div>
    </TimelineRow>
  );
}

/**
 * Approved end state: true completion, the structural mirror of the rejected
 * terminal. The outcome is the terminal (solid green check + "Approved"); "All
 * checks passed" demotes to a history row above it. No tail (hard stop).
 */
function ApprovedTerminalBlock({
  review,
  time,
  reducedMotion,
}: {
  review: InvoiceReview;
  time: string;
  reducedMotion: boolean;
}) {
  return (
    <TimelineRow marker="complete" isLast live>
      <div
        className={cn(
          !reducedMotion && "animate-in fade-in-0 duration-200 ease-out",
        )}
      >
        <h2
          className="text-[22px] font-bold leading-[1.25] text-foreground"
          style={{ letterSpacing: "-0.01em" }}
        >
          Approved
        </h2>
        {/* Stamp line in the established grammar: amount · vendor · time. */}
        <div className="mt-1.5 flex min-h-7 flex-wrap items-center gap-x-1.5">
          <span className="text-sm text-muted-foreground tabular-nums">
            {review.amount} · {review.supplier} · {midSentenceTime(time)}
          </span>
        </div>
        <p className="mt-3 text-[13px] text-muted-foreground">
          Sent for payment.
        </p>
      </div>
    </TimelineRow>
  );
}

/**
 * Held end state: a reversible reviewer park. Neutral pause marker (not green,
 * not the info clock). Single Resume action restores the frozen state exactly
 * (hold never mutated the state beneath it). The dev return trigger stays
 * available when waiting is frozen underneath, so the loop is still demoable.
 */
function HeldTerminalBlock({
  reason,
  frozenWaiting,
  reducedMotion,
  onResume,
  showDevTrigger,
  onSimulateCorrected,
}: {
  reason?: string;
  frozenWaiting: boolean;
  reducedMotion: boolean;
  onResume: () => void;
  showDevTrigger: boolean;
  onSimulateCorrected: () => void;
}) {
  const resumeSentence = frozenWaiting
    ? "Resume to return to the waiting request."
    : "Resume to return this invoice to your decision.";
  return (
    <TimelineRow marker="held" isLast tail live>
      <div
        className={cn(
          !reducedMotion && "animate-in fade-in-0 duration-200 ease-out",
        )}
      >
        <h2
          className="text-[22px] font-bold leading-[1.25] text-foreground"
          style={{ letterSpacing: "-0.01em" }}
        >
          On hold
        </h2>
        <p className="mt-1.5 max-w-prose text-sm leading-normal text-muted-foreground">
          {reason ? `On hold: ${reason}.` : "Held by you."} {resumeSentence}
        </p>
        <div className="mt-4 flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={onResume}>
            Resume review
          </Button>
          {showDevTrigger && (
            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground"
              onClick={onSimulateCorrected}
            >
              Simulate corrected invoice
            </Button>
          )}
        </div>
      </div>
    </TimelineRow>
  );
}

/**
 * Rejected end state: a permanent reviewer decision (like approval, no undo). It
 * supersedes whatever was underneath (live, waiting, passed); nothing is frozen
 * for restoration, the record just ends. Destructive marker, no actions, no dev
 * trigger. History above it stays readable (expandable), not editable.
 */
function RejectedTerminalBlock({
  reason,
  note,
  reducedMotion,
}: {
  reason?: string;
  note?: string;
  reducedMotion: boolean;
}) {
  return (
    <TimelineRow marker="rejected" isLast live>
      <div
        className={cn(
          !reducedMotion && "animate-in fade-in-0 duration-200 ease-out",
        )}
      >
        <h2
          className="text-[22px] font-bold leading-[1.25] text-foreground"
          style={{ letterSpacing: "-0.01em" }}
        >
          Rejected
        </h2>
        <p className="mt-1.5 max-w-prose text-sm leading-normal text-muted-foreground">
          {reason ? `Rejected: ${reason}.` : "Rejected."} This ends the review;
          the supplier can resubmit a corrected invoice.
        </p>
        {note && (
          <p className="mt-3 max-w-prose text-sm leading-normal text-secondary-foreground">
            Note: {note}
          </p>
        )}
        <p className="mt-3 text-[13px] text-muted-foreground">
          Rejected and returned to supplier.
        </p>
      </div>
    </TimelineRow>
  );
}

/**
 * One waiting exception's request card in the terminal: what was sent (row 1),
 * the artifact (row 2, expandable to the shared sent-email renderer), and the
 * timing/clock line (row 3). Draftless (internal route) cards drop the artifact
 * row and show the notified variant of the timing line.
 */
function RequestCard({
  event,
  followUpTime,
  reducedMotion,
}: {
  event: WaitingEvent;
  /** relative time of the latest follow-up for this exception, if any */
  followUpTime?: string;
  reducedMotion: boolean;
}) {
  const [showMsg, setShowMsg] = useState(false);
  const draft = event.draft;
  return (
    <div className="rounded-xl border-[0.5px] border-border bg-card p-3">
      {/* Row 1: what happened */}
      <div className="flex min-h-6 flex-wrap items-baseline gap-x-1.5">
        {draft ? (
          <>
            <span className="text-sm font-medium text-foreground">
              Correction request sent
            </span>
            <span className="text-sm text-muted-foreground">to {draft.to}</span>
          </>
        ) : (
          <span className="text-sm font-medium text-foreground">
            {event.label}
          </span>
        )}
        <span className="text-xs text-muted-foreground">· {event.time}</span>
      </div>

      {/* Row 2: the artifact (draft routes only). */}
      {draft && (
        <>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="min-w-0 flex-1 truncate text-[13px] text-muted-foreground">
              {draft.subject}
            </span>
            <button
              type="button"
              onClick={() => setShowMsg((v) => !v)}
              aria-expanded={showMsg}
              className="shrink-0 text-[13px] text-primary hover:underline"
            >
              {showMsg ? "Hide message" : "View message"}
            </button>
          </div>
          <ExpandRegion open={showMsg} reducedMotion={reducedMotion}>
            <div className="pt-3">
              <SentEmailBlock draft={draft} />
            </div>
          </ExpandRegion>
        </>
      )}

      {/* Row 3: the clock. The SLA sentence is fixture copy: LANDING SLOT for
          real vendor response-window data (see followUpWeekday). */}
      <div className="mt-3 flex items-center gap-1.5 border-t border-border/60 pt-3">
        <Clock className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="text-[13px] text-muted-foreground">
          {followUpTime
            ? `Follow-up sent ${midSentenceTime(followUpTime)}.`
            : draft
              ? `Suppliers typically respond in 2 to 3 business days. Follow-up available ${followUpWeekday()}.`
              : "You'll be notified when this is resolved."}
        </span>
      </div>
    </div>
  );
}

/**
 * The blocked end state: everything actionable is done, but routed exceptions
 * are still waiting on corrected invoices/data. Info-tone clock marker (the solid
 * marker stays reserved for true completion), no Approve. One request card per
 * waiting exception; a single actions row (Follow up / Hold invoice) below. With
 * ?dev=1 a muted button simulates the return seam so the full loop is demoable.
 */
function WaitingTerminalBlock({
  waitingOn,
  summary,
  cards,
  followUpByExc,
  reducedMotion,
  onFollowUp,
  onHold,
  showDevTrigger,
  onSimulateCorrected,
}: {
  waitingOn: string;
  summary: string;
  cards: WaitingEvent[];
  followUpByExc: Record<string, string>;
  reducedMotion: boolean;
  onFollowUp: (event: WaitingEvent) => void;
  onHold: (reason: string, note?: string) => void;
  showDevTrigger: boolean;
  onSimulateCorrected: () => void;
}) {
  // Follow up (v1) acts on the first still-waiting exception with a sent email;
  // draftless (internal) waiting offers no follow-up.
  const followUpTarget = cards.find((c) => c.draft);
  return (
    <TimelineRow marker="waiting-complete" isLast tail live>
      <div className="animate-in fade-in-0 duration-200 ease-out">
        <h2
          className="text-[22px] font-bold leading-[1.25] text-foreground"
          style={{ letterSpacing: "-0.01em" }}
        >
          Waiting on {waitingOn}
        </h2>
        <p className="mt-1.5 max-w-prose text-sm leading-normal text-muted-foreground">
          {summary}
        </p>
        {/* One card per waiting exception, stacked 12px. */}
        <div className="mt-4 flex max-w-[520px] flex-col gap-3">
          {cards.map((c) => (
            <RequestCard
              key={c.key}
              event={c}
              followUpTime={followUpByExc[c.exception.id]}
              reducedMotion={reducedMotion}
            />
          ))}
        </div>
        {/* Actions row, once. Follow up is outlined (NOT filled: the main thing
            is not done); Hold invoice is a quiet text button. */}
        <div className="mt-4 flex items-center gap-2">
          {followUpTarget && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onFollowUp(followUpTarget)}
            >
              Follow up
            </Button>
          )}
          <HoldDialog label="Hold invoice" onHold={onHold} />
          {showDevTrigger && (
            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground"
              onClick={onSimulateCorrected}
            >
              Simulate corrected invoice
            </Button>
          )}
        </div>
      </div>
    </TimelineRow>
  );
}

/**
 * The exception-review timeline for one invoice. Renders the agent history, the
 * resolved/re-validated events, the live exception group, and the loop footer.
 * Resolving the live exception re-runs validation (stub), which may clear items
 * or surface new ones; the anchor then advances to the next open exception.
 *
 * Keyed by invoice id upstream, so all loop state resets on invoice change.
 */
export function ExceptionTimeline({
  review,
  onAllClear,
  exceptionListVariant = "strip",
}: {
  review: InvoiceReview;
  onAllClear: () => void;
  /** "strip" = the Up next preview (default); "index" = the bordered index. */
  exceptionListVariant?: "strip" | "index";
}) {
  const runtime = useInvoiceRuntime();
  const rt = runtime.getRuntime(review.id);
  // Invoice disposition (approve/hold) is the single source in v2/v3.
  const disposition = rt.disposition;
  // Full ordered list = fixtures + loop-surfaced; resolved ids live in the
  // shared store so the queue and table reflect resolution live.
  const list = useMemo(
    () => [...review.exceptions, ...rt.surfaced],
    [review.exceptions, rt.surfaced],
  );
  const resolvedIds = rt.resolvedIds;
  // Waiting (routed) exceptions: parked, not resolved, excluded from the open
  // set. waitingOn drives the terminal title, header tooltip, and queue chip.
  const waitingRefs = rt.waiting;
  const waitingIds = waitingRefs.map((w) => w.id);
  const waitingCount = waitingRefs.length;
  const waitingOn = waitingRefs[0]?.waitingOn ?? "supplier";
  // Internal routes carry the owner's role; its presence marks the wait as an
  // internal handoff (vs the supplier), which shifts the terminal summary copy.
  const waitingRole = waitingRefs[0]?.waitingRole;

  const [activeId, setActiveId] = useState<string>(
    review.exceptions[0]?.id ?? "",
  );
  // Revalidation-surfaced items show a "New" tag until the reviewer anchors
  // them by hand (auto-advancing to one does not clear its New).
  const [acknowledged, setAcknowledged] = useState<Set<string>>(
    () => new Set(),
  );
  // The event log lives in the runtime store (survives remount); read it here.
  const events = rt.events;
  const [resolve, setResolve] = useState<ResolveState | null>(null);
  // Approve is the one true completion, so it earns the full resolve
  // choreography (confirm -> check -> reveal) before the terminal, unlike the
  // snappy hold/reject dispositions. Transient local phase (reduced motion skips
  // it); the committed disposition is what survives remount.
  const [approving, setApproving] = useState(false);
  // Supplier email draft modal. "route": the confirmation step for a supplier
  // route (Send commits the park). "followup": a reminder on an already-parked
  // exception (Send only logs a Followed up event; waiting is unchanged). Null =
  // closed; nothing is committed yet.
  const [emailModal, setEmailModal] = useState<
    | {
        mode: "route";
        exc: InvoiceException;
        suggestion: Suggestion;
        initial: { to: string; subject: string; body: string };
      }
    | {
        mode: "followup";
        exc: InvoiceException;
        initial: { to: string; subject: string; body: string };
      }
    | null
  >(null);
  const reducedMotion = usePrefersReducedMotion();
  const clearedFired = useRef(false);

  // Chat-style scroll follow: the column tracks the newest live content unless
  // the reviewer scrolls away.
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLOListElement>(null);
  const userScrolledRef = useRef(false);
  const stickRef = useRef(true);
  const programmaticUntil = useRef(0);
  const wasResolvingRef = useRef(false);
  // Scroll-to-latest pill: visible when scrolled far from the live edge; the dot
  // flags new events committed while the reviewer was scrolled away.
  const [pillVisible, setPillVisible] = useState(false);
  const [hasNewBelow, setHasNewBelow] = useState(false);
  // Dev-only return-seam trigger, gated on ?dev=1 so the full loop is demoable.
  const [devMode, setDevMode] = useState(false);
  useEffect(() => {
    setDevMode(new URLSearchParams(window.location.search).get("dev") === "1");
  }, []);

  const nearBottom = (px = 120) => {
    const c = containerRef.current;
    return c ? c.scrollHeight - c.scrollTop - c.clientHeight <= px : true;
  };
  const behavior: ScrollBehavior = reducedMotion ? "auto" : "smooth";
  // Land the live block's top ~24px below the sticky header so the present
  // stays in frame and history scrolls out of view above it. The browser clamps
  // to max scroll, so when the remaining content already fits the viewport this
  // settles at the column bottom instead.
  const scrollToLive = () => {
    const c = containerRef.current;
    if (!c) return;
    programmaticUntil.current = Date.now() + 700;
    const live = c.querySelector<HTMLElement>("[data-live]");
    if (!live) {
      c.scrollTo({ top: c.scrollHeight, behavior });
      return;
    }
    const delta =
      live.getBoundingClientRect().top - c.getBoundingClientRect().top - 24;
    c.scrollTo({ top: c.scrollTop + delta, behavior });
  };
  const scrollToBottom = () => {
    const c = containerRef.current;
    if (!c) return;
    programmaticUntil.current = Date.now() + 700;
    c.scrollTo({ top: c.scrollHeight, behavior });
  };

  // Derive the pill from container geometry. Read-only w.r.t. the auto-follow
  // machine: it never touches the follow refs, so it can't change those rules.
  const syncPill = () => {
    const c = containerRef.current;
    if (!c) return;
    const overflows = c.scrollHeight > c.clientHeight + 1;
    const distance = c.scrollHeight - c.scrollTop - c.clientHeight;
    setPillVisible(overflows && distance > PILL_REVEAL_PX);
    // Manually reaching the live edge clears the new-content dot.
    if (nearBottom()) setHasNewBelow(false);
  };

  // The pill re-anchors the reviewer to the live edge: it scrolls to the bottom
  // AND resets the follow machine (clear the user-scrolled flag, restore the
  // near-bottom stick) so auto-follow re-engages for subsequent resolves.
  const scrollToLatest = () => {
    userScrolledRef.current = false;
    stickRef.current = true;
    setHasNewBelow(false);
    scrollToBottom();
  };

  const openList = list.filter(
    (e) => !resolvedIds.includes(e.id) && !waitingIds.includes(e.id),
  );
  // All non-waiting findings in escalation order (open + resolved). Used by the
  // Findings map so rows stay stable through resolves.
  const nonWaitingList = list.filter((e) => !waitingIds.includes(e.id));
  const resolvedIdSet: ReadonlySet<string> = new Set(resolvedIds);
  const active = openList.find((e) => e.id === activeId) ?? openList[0] ?? null;

  const openCount = openList.length;
  const resolvedCount = resolvedIds.length;
  // Ordinal + total are over ALL non-waiting findings (fixed at escalation),
  // matching the Findings map's stable row positions.
  const activeOrdinal = active
    ? nonWaitingList.findIndex((e) => e.id === active.id) + 1
    : 0;
  const showHeader =
    nonWaitingList.length >= 2 || resolvedCount > 0 || waitingCount > 0;
  // All actionable work is done. fullyResolved = true completion (Approve);
  // waitingDone = blocked on a routed exception (waiting terminal, no Approve).
  const allDone = !resolve && openCount === 0;
  const fullyResolved = allDone && waitingCount === 0;
  const waitingDone = allDone && waitingCount > 0;
  const counter = active
    ? `Issue ${activeOrdinal} of ${nonWaitingList.length}`
    : "";

  const isNew = (e: InvoiceException) =>
    e.origin === "revalidation" && !acknowledged.has(e.id);

  // Fire the all-clear callback once when the invoice is fully resolved (not when
  // it is merely blocked on a waiting exception; that must not unlock Approve).
  useEffect(() => {
    if (fullyResolved && !clearedFired.current) {
      clearedFired.current = true;
      onAllClear();
    }
    if (!fullyResolved) clearedFired.current = false;
  }, [fullyResolved, onAllClear]);

  // Once an exception has been viewed (active), its "New" tag clears for good.
  useEffect(() => {
    const id = active?.id;
    if (!id) return;
    setAcknowledged((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, [active?.id]);

  // Sync cursor to the runtime so Details panel can highlight the active line row.
  // runtime intentionally omitted: it changes every time cursorMap updates, which
  // would re-trigger this effect → setCursor → new cursorMap → infinite loop.
  useEffect(() => {
    runtime.setCursor(review.id, active?.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id, review.id]);

  // Cancel auto-follow the moment the reviewer scrolls the column themselves
  // (wheel, touch, keys, or a scrollbar drag detected outside a programmatic
  // scroll window).
  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    const markUser = () => {
      userScrolledRef.current = true;
    };
    const onScroll = () => {
      if (Date.now() > programmaticUntil.current)
        userScrolledRef.current = true;
    };
    c.addEventListener("wheel", markUser, { passive: true });
    c.addEventListener("touchmove", markUser, { passive: true });
    c.addEventListener("keydown", markUser);
    c.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      c.removeEventListener("wheel", markUser);
      c.removeEventListener("touchmove", markUser);
      c.removeEventListener("keydown", markUser);
      c.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Scroll-to-latest pill: recompute on scroll and on content/viewport resize.
  // A separate listener from the auto-follow effect below, which stays untouched.
  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    const onScroll = () => syncPill();
    c.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(() => syncPill());
    if (contentRef.current) ro.observe(contentRef.current);
    ro.observe(c);
    syncPill();
    return () => {
      c.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, []);

  // Follow the conversation: when a resolve sequence commits, bring the new live
  // content into view, unless the reviewer scrolled away or was reading history.
  useEffect(() => {
    const was = wasResolvingRef.current;
    wasResolvingRef.current = resolve !== null;
    if (was && resolve === null) {
      if (stickRef.current && !userScrolledRef.current) {
        requestAnimationFrame(() => scrollToLive());
      } else {
        // New events committed while auto-follow was canceled: flag the pill so
        // the reviewer knows the live edge moved. (Auto-follow rule unchanged.)
        setHasNewBelow(true);
      }
    }
  }, [resolve]);

  // Resolve choreography. Fix mode: confirm -> check -> reveal -> commit, one
  // region per phase, next state hidden until re-validation settles. Route mode:
  // confirm (collapse into a waiting row) -> commit; no re-check, no
  // "Re-validated" event, because routing changes no data.
  useEffect(() => {
    if (!resolve) return;
    const nextOpenId = (excId: string, alsoSkip: string[] = []) => {
      const waitingIdSet = new Set(waitingRefs.map((w) => w.id));
      return list.find(
        (e) =>
          e.id !== excId &&
          !alsoSkip.includes(e.id) &&
          !resolvedIds.includes(e.id) &&
          !waitingIdSet.has(e.id),
      );
    };

    if (resolve.phase === "confirm") {
      if (resolve.mode === "route") {
        // Route commit: park the exception into a waiting row, advance. No re-check.
        const s = resolve;
        const t = setTimeout(
          () => {
            const on = s.waitingOn ?? "supplier";
            // Park + append the waiting row atomically.
            runtime.parkException(
              review.id,
              {
                id: s.exc.id,
                waitingOn: on,
                waitingRole: s.waitingRole,
                label: s.label,
                draft: s.draft,
              },
              {
                kind: "waiting",
                label: s.label,
                sub: s.sub,
                time: "Just now",
                shortLabel: s.shortLabel,
                waitingOn: on,
                exception: s.exc,
                draft: s.draft,
                reason: s.reason,
                note: s.note,
              },
            );
            setActiveId(nextOpenId(s.exc.id)?.id ?? "");
            setResolve(null);
          },
          reducedMotion ? 250 : 450,
        );
        return () => clearTimeout(t);
      }
      const t = setTimeout(
        () => setResolve((s) => (s ? { ...s, phase: "check" } : s)),
        reducedMotion ? 250 : 450,
      );
      return () => clearTimeout(t);
    }
    if (resolve.phase === "check") {
      // Small correction to keep the resolved row + spinner in view.
      if (stickRef.current && !userScrolledRef.current) {
        requestAnimationFrame(() => scrollToBottom());
      }
      const s = resolve;
      const applyReval = ({
        cleared,
        surfaced,
      }: {
        cleared: string[];
        surfaced: InvoiceException[];
      }) => {
        const known = new Set(list.map((e) => e.id));
        const fresh = surfaced.filter((e) => !known.has(e.id));
        // exclude the exception being resolved so it never doubles as an auto-clear
        const clearedInList = cleared.filter(
          (cid) => known.has(cid) && cid !== s.exc.id,
        );
        const settledSub =
          fresh.length > 0
            ? `All checks re-run, ${fresh.length} new issue${
                fresh.length > 1 ? "s" : ""
              } found`
            : "All checks re-run, nothing new";
        setResolve((cur) =>
          cur
            ? { ...cur, phase: "reveal", fresh, clearedInList, settledSub }
            : cur,
        );
      };
      // Corrected-invoice path honors the seam result; the fix path re-checks.
      if (s.correctedRevalidation) {
        applyReval(s.correctedRevalidation);
        return;
      }
      let cancelled = false;
      revalidateException(review.id).then((r) => {
        if (!cancelled) applyReval(r);
      });
      return () => {
        cancelled = true;
      };
    }
    // reveal: hold on the settled row briefly, then commit everything at once.
    // State changes + their events land in ONE runtime mutation (atomic).
    const s = resolve;
    const t = setTimeout(
      () => {
        const events: RunEventInput[] = [
          {
            kind: "resolved",
            label: s.label,
            sub: s.sub,
            time: "Just now",
            shortLabel: s.shortLabel,
            exception: s.exc,
          },
          ...s.clearedInList.map((cid): RunEventInput => {
            const c = list.find((e) => e.id === cid);
            return {
              kind: "resolved",
              label: `${c ? exceptionMeta(c).label : "Issue"} cleared`,
              sub: "Cleared automatically after re-check",
              time: "Just now",
              auto: true,
              exception: c,
            };
          }),
          {
            kind: "revalidated",
            label: "Re-validated",
            sub: s.settledSub,
            time: "Just now",
            pending: false,
          },
        ];
        runtime.commitResolve(review.id, {
          resolvedIds: [s.exc.id, ...s.clearedInList],
          surfaced: s.fresh,
          dataPatch: s.dataPatch,
          events,
        });
        setActiveId(
          nextOpenId(s.exc.id, s.clearedInList)?.id ?? s.fresh[0]?.id ?? "",
        );
        setResolve(null);
      },
      reducedMotion ? 250 : 350,
    );
    return () => clearTimeout(t);
  }, [
    resolve,
    list,
    resolvedIds,
    waitingRefs,
    review.id,
    runtime,
    reducedMotion,
  ]);

  function anchor(id: string) {
    if (resolve) return;
    setActiveId(id);
    setAcknowledged((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    // Bring the newly expanded exception into view (user intent, always).
    requestAnimationFrame(() => scrollToLive());
  }

  // Start the route choreography (collapse -> park). Carries the sent email when
  // the route went through the draft modal; the sub then shows the recipient.
  function startRoute(
    exc: InvoiceException,
    suggestion: Suggestion,
    draft?: SupplierEmailDraft,
    note?: string,
    reason?: string,
  ) {
    const rm = routeMeta(exc, suggestion);
    setResolve({
      exc,
      mode: "route",
      label: rm.title,
      sub: draft ? `${rm.sub} · ${draft.to}` : rm.sub,
      shortLabel: rm.shortLabel,
      waitingOn: rm.waitingOn,
      waitingRole: rm.waitingRole,
      reason,
      note,
      draft,
      phase: "confirm",
      fresh: [],
      clearedInList: [],
      settledSub: "",
    });
  }

  // Jump to the source document and highlight the exception's disputed regions.
  // Anchor-driven: only exceptions carrying sourceAnchors reach here (the button
  // is hidden otherwise). Pure navigation via the runtime; the tab switch +
  // scroll + highlight are handled by the root effect and the Source tab.
  function showInSource(exc: InvoiceException) {
    if (!exc.sourceAnchors?.length) return;
    runtime.showInSource(review.id, exc.id, exc.sourceAnchors);
  }

  function resolveActive(s: Suggestion, reason?: string, note?: string) {
    if (!active || resolve || emailModal) return;
    // Supplier routes confirm through the draft modal: nothing about the
    // exception changes until the message is sent (Send commits the park).
    if (isSupplierRoute(s)) {
      setEmailModal({
        mode: "route",
        exc: active,
        suggestion: s,
        initial: {
          to: review.vendorEmail,
          subject: `Invoice correction request: Invoice ${review.id}`,
          body: generateSupplierEmailBody(review, active),
        },
      });
      return;
    }
    // Snapshot follow intent for this sequence: only auto-scroll if the reviewer
    // was already near the bottom, and cancel it if they scroll during it.
    stickRef.current = nearBottom(120);
    userScrolledRef.current = false;
    // Internal routes (data owner, etc.) confirmed through the route popover: it
    // resolves the named owner and carries the optional note. Hand off via the
    // seam, then park directly (no modal, no re-check).
    if (isRouteSuggestion(s)) {
      void routeToOwner(review.id, active.id, routeOwner(s), reason, note);
      startRoute(active, s, undefined, note, reason);
      return;
    }
    const meta = exceptionMeta(active);
    const r = active.resolution;
    const label = r?.label ?? `${meta.label} resolved`;
    const sub = r?.sub ?? `${meta.label}, resolved by you`;
    // Do NOT lowercase the label: it would mangle acronyms ("PO" -> "po", "VAT"
    // -> "vat"). Labels are written sentence-ready; use as-is. Fixtures can
    // supply a lowercase shortLabel for a smoother completion summary.
    const shortLabel = r?.shortLabel ?? `${meta.label} resolved`;
    setResolve({
      exc: active,
      mode: "fix",
      label,
      sub,
      shortLabel,
      dataPatch: r?.dataPatch,
      phase: "confirm",
      fresh: [],
      clearedInList: [],
      settledSub: "",
    });
  }

  // Open the draft modal as a follow-up on an already-parked exception.
  function onFollowUp(event: WaitingEvent) {
    if (resolve || emailModal || !event.draft) return;
    setEmailModal({
      mode: "followup",
      exc: event.exception,
      initial: {
        to: event.draft.to,
        subject: `Re: ${event.draft.subject}`,
        body: generateFollowUpBody(review, event.draft),
      },
    });
  }

  // Send from the draft modal, via the outbound seam. Route mode runs the route
  // choreography (commits the park). Follow-up mode only logs a "Followed up"
  // event: the exception stays parked, nothing re-validates.
  function onEmailSend(draft: SupplierEmailDraft) {
    const m = emailModal;
    if (!m) return;
    setEmailModal(null);
    void sendSupplierEmail(review.id, m.exc.id, draft);
    if (m.mode === "route") {
      stickRef.current = nearBottom(120);
      userScrolledRef.current = false;
      startRoute(m.exc, m.suggestion, { ...draft, sentTime: "Just now" });
      return;
    }
    // Follow-up changes no state: pure append.
    runtime.appendEvents(review.id, [
      {
        kind: "followed-up",
        label: "Followed up",
        sub: `${exceptionMeta(m.exc).label}, reminder sent`,
        time: "Just now",
        exception: m.exc,
        draft: { ...draft, sentTime: "Just now" },
      },
    ]);
  }

  // The return seam (dev-only trigger). A corrected invoice arrives for the
  // parked exception: append the received event, reopen the exception, then run
  // the standard re-validation choreography honestly (data changed this time).
  async function simulateCorrected() {
    if (resolve) return;
    const wref = waitingRefs[0];
    if (!wref) return;
    const exc = list.find((e) => e.id === wref.id);
    if (!exc) return;
    const meta = exceptionMeta(exc);
    const { document, revalidation } = await receiveCorrectedInvoice(
      review.id,
      exc.id,
    );
    const received: RunEventInput = {
      kind: "received",
      label: "Corrected invoice received",
      sub: `${document} attached by supplier`,
      time: "Just now",
    };
    // Seam-freeze while held: apply the arrival's state change AND its events in
    // ONE atomic mutation (unpark + resolve + received/re-validated), so a
    // remount can never catch a half-applied return. The held terminal does not
    // move; Resume then lands on the honest post-arrival (approvable) state.
    if (disposition?.type === "held") {
      runtime.commitResolve(review.id, {
        unparkIds: [exc.id],
        resolvedIds: [
          exc.id,
          ...revalidation.cleared.filter((c) => c !== exc.id),
        ],
        surfaced: revalidation.surfaced,
        events: [
          received,
          {
            kind: "revalidated",
            label: "Re-validated",
            sub: "All checks re-run, nothing new",
            time: "Just now",
            pending: false,
          },
        ],
      });
      return;
    }
    stickRef.current = nearBottom(120);
    userScrolledRef.current = false;
    // Active path: unpark + log the arrival atomically, then the choreography
    // resolves it (each step is its own atomic, coherent mutation).
    runtime.commitResolve(review.id, {
      unparkIds: [exc.id],
      events: [received],
    });
    setResolve({
      exc,
      mode: "fix",
      label: `${meta.label} cleared`,
      sub: `Cleared by ${document}`,
      // No shortLabel: the summary's "corrected invoice cleared" clause is
      // derived once from the "received" event, so it isn't double-counted here.
      shortLabel: "",
      phase: "check",
      fresh: [],
      clearedInList: [],
      settledSub: "",
      correctedRevalidation: revalidation,
    });
  }

  // Invoice disposition (v2/v3 single source): both Approve entry points and the
  // terminal Hold/Resume flow through the runtime seams, which append the event
  // atomically. The terminal then re-renders from rt.disposition; no observer.
  function commitApproval() {
    approveInvoice(review.id);
    const { disposition: d, event } = buildApproval(review);
    runtime.setDisposition(review.id, d, event);
  }
  function approve() {
    // Reduced motion: commit straight to the revealed terminal.
    if (reducedMotion) {
      commitApproval();
      return;
    }
    setApproving(true);
  }
  function hold(reason: string, note?: string) {
    holdInvoice(review.id, reason, note);
    const { disposition: d, event } = buildHold(review, reason, note);
    runtime.setDisposition(review.id, d, event);
  }
  function resume() {
    resumeInvoice(review.id);
    const { disposition: d, event } = buildResume();
    runtime.setDisposition(review.id, d, event);
  }

  // Approve choreography: confirm (~450ms) then a final re-check (~1200ms), then
  // commit the disposition — the terminal reveals from rt.disposition. The same
  // durations the resolve choreography uses.
  useEffect(() => {
    if (!approving) return;
    const t = setTimeout(() => {
      commitApproval();
      setApproving(false);
    }, 450 + 1200);
    return () => clearTimeout(t);
    // commitApproval closes over stable review/runtime; approving is the trigger.
    // biome-ignore lint/correctness/useExhaustiveDependencies: approving drives it
  }, [approving]);

  // Summary sentences built from the reviewer's resolutions, in order. A
  // corrected-invoice return clears its waiting exception via the "received"
  // event (not a resolved row), so map it to its own clause after the fixes.
  const shortLabels = events
    .filter((e) => e.kind === "resolved" && !e.auto && e.shortLabel)
    .map((e) => (e.kind === "resolved" ? e.shortLabel : undefined))
    .filter((x): x is string => !!x);
  if (events.some((e) => e.kind === "received")) {
    shortLabels.push("corrected invoice cleared");
  }
  // Capitalized, period-free list of what the reviewer resolved (e.g. "High
  // value reviewed, No exchange rate resolved"). Sub of the demoted "All checks
  // passed" history row; also the lead clause of the pre-decision summary.
  const resolutionSummary =
    shortLabels.length > 0
      ? (() => {
          const joined = shortLabels.join(", ");
          return joined.charAt(0).toUpperCase() + joined.slice(1);
        })()
      : "";
  const resolvedClause = resolutionSummary ? `${resolutionSummary}. ` : "";
  const summarySentence = `${resolvedClause}This invoice is ready for your decision.`;
  // Supplier waits re-run when the corrected invoice arrives; internal handoffs
  // name the owner + role and re-run when the corrected data arrives.
  const waitingSummary = waitingRole
    ? `${resolvedClause}One issue is with ${waitingOn}, ${waitingRole}; validation re-runs when the corrected data arrives.`
    : `${resolvedClause}One issue is with the ${waitingOn}; validation re-runs when the corrected invoice arrives.`;

  // Request cards = the waiting events for exceptions still parked now. followUp
  // times index the latest reminder per exception (drives row 3).
  const waitingCards = events.filter(
    (e): e is WaitingEvent =>
      e.kind === "waiting" && waitingIds.includes(e.exception.id),
  );
  const followUpByExc: Record<string, string> = {};
  for (const e of events) {
    if (e.kind === "followed-up") followUpByExc[e.exception.id] = e.time;
  }

  // The full event log rendered as rows: shared by the live view and the held
  // view (a header Hold can pause the invoice mid-review, before completion).
  const eventRows = events.map((ev, i) => {
    // The last event sits before the present (group) node: a section
    // transition, so it opens 28px instead of the 20px event gap.
    const gap = i === events.length - 1 ? SECTION_GAP : ROW_GAP;
    if (
      ev.kind === "resolved" ||
      ev.kind === "waiting" ||
      ev.kind === "followed-up"
    ) {
      return (
        <HistoryEventRow
          key={ev.key}
          event={ev}
          reducedMotion={reducedMotion}
          gap={gap}
        />
      );
    }
    // Flat rows: disposition (a reviewer action -> person marker, per its stated
    // actor), revalidated (agent, spinner while pending), received (agent).
    const marker: MarkerKind =
      ev.kind === "disposition"
        ? ev.actor === "reviewer"
          ? "reviewer"
          : "agent"
        : ev.kind === "revalidated" && ev.pending
          ? "progress"
          : "agent";
    return (
      <EventRow
        key={ev.key}
        marker={marker}
        label={ev.label}
        sub={ev.sub}
        time={ev.time}
        gap={gap}
        expandDetail={
          ev.kind === "disposition" && ev.note ? (
            <EventNoteDetail note={ev.note} />
          ) : undefined
        }
        reducedMotion={reducedMotion}
      />
    );
  });

  // Held is a whole-invoice overlay: it can be set from the terminal OR the
  // header (mid-review), so it renders regardless of allDone. Accumulated
  // history shows as the completion peek when done, else inline.
  const heldView = disposition?.type === "held";
  // Rejected is permanent and supersedes everything underneath (live, waiting,
  // passed), so it takes precedence over every other view. Same history shell as
  // held; the record is readable but the terminal has no actions.
  const rejectedView = disposition?.type === "rejected";

  return (
    <div className="relative flex-1 overflow-hidden">
      <div
        ref={containerRef}
        className="h-full overflow-y-auto px-4 sm:px-6 lg:px-8 pt-8 pb-8 custom-scrollbar [scrollbar-gutter:stable]"
      >
        <ol ref={contentRef} className="w-full max-w-5xl">
          <AgentHistoryPeek
            steps={review.agentHistory}
            bottomGap={!allDone && events.length === 0 ? SECTION_GAP : ROW_GAP}
          />
          {rejectedView ? (
            <>
              {/* Rejected supersedes whatever was underneath. Show the readable
                  history (peek when the loop had finished, else inline) then the
                  rejected terminal. No actions, no dev trigger. */}
              {allDone ? (
                <ResolveHistoryPeek
                  events={events}
                  waitingCount={waitingCount}
                  reducedMotion={reducedMotion}
                />
              ) : (
                eventRows
              )}
              <RejectedTerminalBlock
                reason={
                  disposition?.type === "rejected"
                    ? disposition.reason
                    : undefined
                }
                note={
                  disposition?.type === "rejected"
                    ? disposition.note
                    : undefined
                }
                reducedMotion={reducedMotion}
              />
            </>
          ) : heldView ? (
            <>
              {/* Held pauses the whole invoice. Show the accumulated history
                  (peek when the loop had finished, else inline) then the held
                  terminal + Resume, so Hold is coherent from the header too. */}
              {allDone ? (
                <ResolveHistoryPeek
                  events={events}
                  waitingCount={waitingCount}
                  reducedMotion={reducedMotion}
                />
              ) : (
                eventRows
              )}
              <HeldTerminalBlock
                reason={
                  disposition?.type === "held" ? disposition.reason : undefined
                }
                frozenWaiting={waitingCount > 0}
                reducedMotion={reducedMotion}
                onResume={resume}
                showDevTrigger={devMode && waitingCount > 0}
                onSimulateCorrected={simulateCorrected}
              />
            </>
          ) : allDone ? (
            <>
              {/* The log compresses into a peek; the terminal lands below it.
                Disposition wins when set: approved is true completion (the
                terminal), with "All checks passed" demoted to a history row
                above it; otherwise the waiting or passed terminal. */}
              <ResolveHistoryPeek
                events={events}
                waitingCount={waitingCount}
                reducedMotion={reducedMotion}
              />
              {disposition?.type === "approved" ? (
                <>
                  {/* Demoted milestone: checks are system-asserted (sparkle),
                      the resolution summary as sub, before the Approved outcome. */}
                  <EventRow
                    marker="agent"
                    label="All checks passed"
                    sub={resolutionSummary}
                    time={disposition.time}
                  />
                  <ApprovedTerminalBlock
                    review={review}
                    time={disposition.time}
                    reducedMotion={reducedMotion}
                  />
                </>
              ) : waitingDone ? (
                <WaitingTerminalBlock
                  waitingOn={waitingOn}
                  summary={waitingSummary}
                  cards={waitingCards}
                  followUpByExc={followUpByExc}
                  reducedMotion={reducedMotion}
                  onFollowUp={onFollowUp}
                  onHold={hold}
                  showDevTrigger={devMode}
                  onSimulateCorrected={simulateCorrected}
                />
              ) : approving ? (
                // Approve choreography in flight: the final re-check, reusing the
                // resolve choreography's progress row, before the terminal reveals.
                // Open/in-progress, so it ends with the fading tail.
                <EventRow
                  marker="progress"
                  label="Re-validating"
                  sub="Running a final check"
                  time="Just now"
                  isLast
                  tail
                />
              ) : (
                <TerminalBlock
                  summary={summarySentence}
                  onApprove={approve}
                  onHold={hold}
                />
              )}
            </>
          ) : (
            <>
              {eventRows}
              {resolve ? (
                <ResolvingNode
                  resolve={resolve}
                  openList={openList}
                  nonWaitingList={nonWaitingList}
                  resolvedIdSet={resolvedIdSet}
                  showHeader={showHeader}
                  counter={counter}
                  isNew={isNew}
                  variant={exceptionListVariant}
                  reducedMotion={reducedMotion}
                />
              ) : active ? (
                <ExceptionGroup
                  active={active}
                  openList={openList}
                  nonWaitingList={nonWaitingList}
                  resolvedIdSet={resolvedIdSet}
                  showHeader={showHeader}
                  counter={counter}
                  isNew={isNew}
                  variant={exceptionListVariant}
                  onResolve={resolveActive}
                  onShowInSource={showInSource}
                  onSelect={anchor}
                />
              ) : null}
            </>
          )}
        </ol>
      </div>
      {/* Scroll-to-latest pill: positioned in the scroll container's viewport,
          not the content flow (it never scrolls or shifts layout). Above content,
          below the header scrim. Only the button captures pointer events. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-5 z-[5] flex justify-center">
        <button
          type="button"
          aria-label="Scroll to latest"
          onClick={scrollToLatest}
          className={cn(
            "pointer-events-auto relative flex size-9 items-center justify-center rounded-full border-[0.5px] border-border bg-popover text-foreground shadow-md transition duration-150 ease-out",
            pillVisible
              ? "scale-100 opacity-100"
              : "pointer-events-none scale-90 opacity-0",
          )}
        >
          <ArrowDown className="size-4" />
          {hasNewBelow && (
            <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-info ring-2 ring-popover" />
          )}
        </button>
      </div>
      {/* Header scrim: content fades + blurs across a ~32px zone as it passes
          under the sticky header. Degrades to fade-only without backdrop-filter. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[var(--header-scrim-h,32px)] backdrop-blur-[8px] [background:linear-gradient(to_bottom,var(--background),transparent)] [mask-image:linear-gradient(to_bottom,black,transparent)]"
      />
      {/* Supplier route confirmation. Mounted only while open (fresh draft per
          open); Send commits the park, Discard/Esc/X leave the exception live. */}
      {emailModal && (
        <SupplierEmailModal
          key={`${emailModal.mode}-${emailModal.exc.id}`}
          open
          vendor={review.supplier}
          initial={emailModal.initial}
          reducedMotion={reducedMotion}
          onSend={onEmailSend}
          onDiscard={() => setEmailModal(null)}
        />
      )}
    </div>
  );
}
