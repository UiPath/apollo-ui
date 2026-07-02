"use client";

import {
  Check,
  ChevronDown,
  ChevronRight,
  Eye,
  Search,
  UserRoundCheck,
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
import { cn } from "@/lib/utils";
import { AiMark } from "@/registry/ai-mark/ai-mark";
import { Avatar, AvatarFallback } from "@/registry/avatar/avatar";
import {
  type AgentStep,
  exceptionMeta,
  type Finding,
  type InvoiceException,
  type InvoiceReview,
  type Suggestion,
  highlightInSource,
  revalidateException,
  scopeLabel,
} from "./invoice-review-data";
import { useInvoiceRuntime } from "./invoice-runtime";
import { SuggestedFixCard } from "./SuggestedFixCard";

const REVIEWER_INITIALS = "PV";

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
  | "upcoming"
  | "reviewer"
  | "resolved"
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
  if (kind === "complete") {
    // The only flat solid-fill marker on the screen; it carries the moment.
    return (
      <span className="flex size-7 items-center justify-center rounded-full bg-success text-white">
        <Check className="size-4" />
      </span>
    );
  }
  if (kind === "upcoming") {
    return (
      <span className="flex size-7 items-center justify-center rounded-full border-2 border-dotted border-insight-300 text-insight-400">
        <AiMark size={14} />
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
  className,
  live,
  children,
}: {
  marker: MarkerKind;
  isLast?: boolean;
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
      </div>
      <div
        className={cn("flex-1 min-w-0", isLast ? "pb-0" : "pb-6", className)}
      >
        {children}
      </div>
    </li>
  );
}

/** Collapsed agent trail: one node, expandable into the individual steps. */
function AgentHistoryPeek({ steps }: { steps: AgentStep[] }) {
  const [open, setOpen] = useState(false);
  return (
    <TimelineRow marker="agent" className="pb-8">
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
        <ol className="mt-2 space-y-3 border-l border-border pl-4">
          {steps.map((step) => (
            <li key={step.title}>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium text-foreground">
                  {step.title}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {step.time}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{step.sub}</p>
            </li>
          ))}
        </ol>
      )}
    </TimelineRow>
  );
}

// A slim history row: label + muted sub (truncates) + right-aligned timestamp.
function EventRow({
  marker,
  label,
  sub,
  time,
}: {
  marker: MarkerKind;
  label: string;
  sub: string;
  time: string;
}) {
  return (
    <TimelineRow marker={marker} className="pb-5">
      <div className="flex min-h-7 items-center gap-2 pt-0.5">
        <span className="shrink-0 text-sm text-foreground">{label}</span>
        <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
          {sub}
        </span>
        <span className="shrink-0 text-xs text-muted-foreground">{time}</span>
      </div>
    </TimelineRow>
  );
}

// Matches the original ExceptionBlock metric treatment: uppercase label,
// large value, open (no card), vertical divider between sides.
function FindingCell({
  label,
  value,
  provenance,
  tone,
  inspectable,
}: {
  label: string;
  value: string;
  provenance: string;
  tone?: "warn" | "muted";
  inspectable?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 px-5 py-1">
      <span className="truncate text-[11px] font-medium uppercase tracking-[0.04em] text-muted-foreground">
        {label}
      </span>
      <span
        className={cn(
          "whitespace-nowrap text-[18px] font-medium leading-none tabular-nums",
          tone === "muted" ? "text-muted-foreground" : "text-foreground",
        )}
      >
        {tone === "warn" ? (
          // Highlight the value under review: tinted wash, normal text (not an error color).
          <mark className="-ml-1 rounded bg-warning/15 px-1 text-foreground">
            {value}
          </mark>
        ) : (
          value
        )}
      </span>
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">{provenance}</span>
        {inspectable && (
          <button
            type="button"
            onClick={() => highlightInSource(`${label}:${value}`)}
            className="inline-flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <Search className="size-3" />
            Show in source
          </button>
        )}
      </div>
    </div>
  );
}

function FindingView({ finding }: { finding: Finding }) {
  const cells = finding.type === "compare" ? finding.sides : finding.items;
  if (!cells || cells.length === 0) return null;
  return (
    <div className="grid w-fit grid-flow-col divide-x divide-border [&>div:first-child]:pl-0">
      {cells.map((c) => (
        <FindingCell key={c.label} {...c} />
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
  entering = false,
  hideFix = false,
}: {
  exception: InvoiceException;
  isNew: boolean;
  onResolve: (s: Suggestion) => void;
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
      <h2
        className={cn(
          "mt-3.5 text-[2rem] font-bold leading-[1.25] text-foreground",
          stepClass,
        )}
        style={{
          letterSpacing: "-0.02em",
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
          <FindingView finding={exception.finding} />
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
      {/* The compact resolved row emerges once the detail has faded out. */}
      <div
        className={cn(
          "flex min-h-7 items-center gap-2 pt-0.5 transition-opacity",
          collapsed
            ? "opacity-100 duration-150 delay-[120ms]"
            : "opacity-0 duration-0",
        )}
      >
        <span className="shrink-0 text-sm text-foreground">{label}</span>
        <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
          {sub}
        </span>
        <span className="shrink-0 text-xs text-muted-foreground">Just now</span>
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
}: {
  exception: InvoiceException;
  isNew: (e: InvoiceException) => boolean;
  onResolve: (s: Suggestion) => void;
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
        entering={phase === "in"}
      />
    </div>
  );
}

/** The reviewer's node: optional group header, the stage, the exception index. */
function ExceptionGroup({
  active,
  openList,
  showHeader,
  counter,
  isNew,
  onResolve,
  onSelect,
}: {
  active: InvoiceException;
  openList: InvoiceException[];
  showHeader: boolean;
  counter: string;
  isNew: (e: InvoiceException) => boolean;
  onResolve: (s: Suggestion) => void;
  onSelect: (id: string) => void;
}) {
  return (
    <TimelineRow marker="reviewer" className="pb-12" live>
      {showHeader && (
        <div className="mb-4 flex min-h-7 items-center gap-2.5">
          <span className="text-sm font-medium text-foreground">
            Needs your decision
          </span>
          <span className="h-3 w-px shrink-0 bg-border" aria-hidden="true" />
          <span className="text-xs text-muted-foreground">{counter}</span>
        </div>
      )}
      <Stage exception={active} isNew={isNew} onResolve={onResolve} />
      {openList.length >= 2 && (
        <ExceptionIndex
          items={openList}
          activeId={active.id}
          isNew={isNew}
          onSelect={onSelect}
        />
      )}
    </TimelineRow>
  );
}

// Runtime history rows accumulated as the reviewer works the loop.
type RunEvent =
  | {
      kind: "resolved";
      key: string;
      label: string;
      sub: string;
      time: string;
      shortLabel?: string;
      /** auto = cleared by a re-check, not resolved by the reviewer */
      auto?: boolean;
    }
  | {
      kind: "revalidated";
      key: string;
      label: string;
      sub: string;
      time: string;
      pending: boolean;
    };

// The three-phase resolve choreography (see ResolvingNode). One region changes
// at a time, in causal order: confirm -> check -> reveal, then commit.
type ResolvePhase = "confirm" | "check" | "reveal";
type ResolveState = {
  exc: InvoiceException;
  label: string;
  sub: string;
  shortLabel: string;
  dataPatch?: Partial<InvoiceReview>;
  phase: ResolvePhase;
  fresh: InvoiceException[];
  clearedInList: string[];
  settledSub: string;
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
  showHeader,
  counter,
  isNew,
  reducedMotion,
}: {
  resolve: ResolveState;
  openList: InvoiceException[];
  showHeader: boolean;
  counter: string;
  isNew: (e: InvoiceException) => boolean;
  reducedMotion: boolean;
}) {
  const { exc, phase, label, sub, settledSub } = resolve;
  const hasOthers = openList.some((e) => e.id !== exc.id);
  return (
    <>
      <TimelineRow marker="resolved">
        <ResolvingBlock
          exception={exc}
          label={label}
          sub={sub}
          phase={phase}
          reducedMotion={reducedMotion}
        />
      </TimelineRow>
      {phase !== "confirm" && (
        <EventRow
          marker={phase === "reveal" ? "agent" : "progress"}
          label={phase === "reveal" ? "Re-validated" : "Re-validating"}
          sub={phase === "reveal" ? settledSub : "Re-checking against Coupa"}
          time="Just now"
        />
      )}
      {(showHeader || hasOthers) && (
        <TimelineRow marker="reviewer">
          {showHeader && (
            <div className="mb-4 flex min-h-7 items-center gap-2.5">
              <span className="text-sm font-medium text-foreground">
                Needs your decision
              </span>
              <span
                className="h-3 w-px shrink-0 bg-border"
                aria-hidden="true"
              />
              <span className="text-xs text-muted-foreground">{counter}</span>
            </div>
          )}
          {openList.length >= 2 && (
            <ExceptionIndex
              items={openList}
              activeId=""
              resolvingId={exc.id}
              isNew={isNew}
              onSelect={() => {}}
            />
          )}
        </TimelineRow>
      )}
    </>
  );
}

/**
 * At completion, the reviewer's resolve log compresses into a peek (mirroring
 * the agent peek), expandable to the full accumulated log.
 */
function ResolveHistoryPeek({ events }: { events: RunEvent[] }) {
  const [open, setOpen] = useState(false);
  const resolvedByYou = events.filter(
    (e) => e.kind === "resolved" && !e.auto,
  ).length;
  const rechecks = events.filter((e) => e.kind === "revalidated").length;
  const label = `${resolvedByYou} ${
    resolvedByYou === 1 ? "issue" : "issues"
  } resolved by you, ${rechecks} ${
    rechecks === 1 ? "re-check" : "re-checks"
  } passed`;
  return (
    <TimelineRow marker="resolved" className="pb-8">
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
        <ol className="mt-2 space-y-3 border-l border-border pl-4">
          {events.map((e) => (
            <li key={e.key}>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-foreground">{e.label}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {e.time}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{e.sub}</p>
            </li>
          ))}
        </ol>
      )}
    </TimelineRow>
  );
}

/** The completion end state: the only solid-fill marker, a title at the anchor
 * scale, a summary built from the resolutions, and the disposition actions
 * (wired to the same handlers as the header Approve/Hold). */
function TerminalBlock({
  summary,
  onApprove,
  onHold,
}: {
  summary: string;
  onApprove: () => void;
  onHold: () => void;
}) {
  return (
    <TimelineRow marker="complete" isLast live>
      <div className="animate-in fade-in-0 duration-200 ease-out">
        <h2
          className="text-[22px] font-medium leading-[1.25] text-foreground"
          style={{ letterSpacing: "-0.01em" }}
        >
          All checks passed
        </h2>
        <p className="mt-1.5 max-w-prose text-sm leading-normal text-muted-foreground">
          {summary}
        </p>
        {/* Duplicates the header disposition intentionally: no resolution actions
            remain on screen here, so scopes don't mix. Header stays canonical. */}
        <div className="mt-4 flex items-center gap-2">
          <Button size="sm" onClick={onApprove}>
            Approve invoice
          </Button>
          <Button size="sm" variant="ghost" onClick={onHold}>
            Hold
          </Button>
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
  onApprove,
  onHold,
}: {
  review: InvoiceReview;
  onAllClear: () => void;
  onApprove: () => void;
  onHold: () => void;
}) {
  const runtime = useInvoiceRuntime();
  const rt = runtime.getRuntime(review.id);
  // Full ordered list = fixtures + loop-surfaced; resolved ids live in the
  // shared store so the queue and table reflect resolution live.
  const list = useMemo(
    () => [...review.exceptions, ...rt.surfaced],
    [review.exceptions, rt.surfaced],
  );
  const resolvedIds = rt.resolvedIds;

  const [activeId, setActiveId] = useState<string>(
    review.exceptions[0]?.id ?? "",
  );
  // Revalidation-surfaced items show a "New" tag until the reviewer anchors
  // them by hand (auto-advancing to one does not clear its New).
  const [acknowledged, setAcknowledged] = useState<Set<string>>(
    () => new Set(),
  );
  const [events, setEvents] = useState<RunEvent[]>([]);
  const [resolve, setResolve] = useState<ResolveState | null>(null);
  const reducedMotion = usePrefersReducedMotion();
  const revalCounter = useRef(0);
  const clearedFired = useRef(false);

  // Chat-style scroll follow: the column tracks the newest live content unless
  // the reviewer scrolls away.
  const containerRef = useRef<HTMLDivElement>(null);
  const userScrolledRef = useRef(false);
  const stickRef = useRef(true);
  const programmaticUntil = useRef(0);
  const wasResolvingRef = useRef(false);

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

  const openList = list.filter((e) => !resolvedIds.includes(e.id));
  const active = openList.find((e) => e.id === activeId) ?? openList[0] ?? null;

  const openCount = openList.length;
  const resolvedCount = resolvedIds.length;
  // Ordinal + total run over OPEN exceptions, matching the index numbering.
  const activeOrdinal = active
    ? openList.findIndex((e) => e.id === active.id) + 1
    : 0;
  const showHeader = openCount >= 2 || resolvedCount > 0;
  const allClear = !resolve && openCount === 0;
  const counter = active
    ? `Issue ${activeOrdinal} of ${openCount}${
        resolvedCount > 0 ? `, ${resolvedCount} resolved` : ""
      }`
    : "";

  const isNew = (e: InvoiceException) =>
    e.origin === "revalidation" && !acknowledged.has(e.id);

  // Fire the all-clear callback once when the invoice fully clears.
  useEffect(() => {
    if (allClear && !clearedFired.current) {
      clearedFired.current = true;
      onAllClear();
    }
    if (!allClear) clearedFired.current = false;
  }, [allClear, onAllClear]);

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

  // Follow the conversation: when a resolve sequence commits, bring the new live
  // content into view, unless the reviewer scrolled away or was reading history.
  useEffect(() => {
    const was = wasResolvingRef.current;
    wasResolvingRef.current = resolve !== null;
    if (
      was &&
      resolve === null &&
      stickRef.current &&
      !userScrolledRef.current
    ) {
      requestAnimationFrame(() => scrollToLive());
    }
  }, [resolve]);

  // Resolve choreography: confirm -> check -> reveal -> commit. One region
  // changes per phase; the next exception and any surfaced items appear only on
  // commit, so nothing about the next state is visible until re-validation
  // settles.
  useEffect(() => {
    if (!resolve) return;
    if (resolve.phase === "confirm") {
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
      let cancelled = false;
      revalidateException(review.id).then(({ cleared, surfaced }) => {
        if (cancelled) return;
        const known = new Set(list.map((e) => e.id));
        const fresh = surfaced.filter((e) => !known.has(e.id));
        const clearedInList = cleared.filter((cid) => known.has(cid));
        const settledSub =
          fresh.length > 0
            ? `All checks re-run, ${fresh.length} new issue${
                fresh.length > 1 ? "s" : ""
              } found`
            : "All checks re-run, nothing new";
        setResolve((s) =>
          s ? { ...s, phase: "reveal", fresh, clearedInList, settledSub } : s,
        );
      });
      return () => {
        cancelled = true;
      };
    }
    // reveal: hold on the settled row briefly, then commit everything at once.
    const s = resolve;
    const t = setTimeout(
      () => {
        setEvents((prev) => [
          ...prev,
          {
            kind: "resolved",
            key: `res-${s.exc.id}`,
            label: s.label,
            sub: s.sub,
            time: "Just now",
            shortLabel: s.shortLabel,
          },
          ...s.clearedInList.map((cid) => {
            const c = list.find((e) => e.id === cid);
            return {
              kind: "resolved" as const,
              key: `res-auto-${cid}`,
              label: `${c ? exceptionMeta(c).label : "Issue"} cleared`,
              sub: "Cleared automatically after re-check",
              time: "Just now",
              auto: true,
            };
          }),
          {
            kind: "revalidated",
            key: `reval-${revalCounter.current++}`,
            label: "Re-validated",
            sub: s.settledSub,
            time: "Just now",
            pending: false,
          },
        ]);
        runtime.resolveExceptions(review.id, [s.exc.id, ...s.clearedInList]);
        if (s.fresh.length > 0) runtime.surfaceExceptions(review.id, s.fresh);
        // Data-changing resolutions (e.g. a linked PO) update every surface.
        if (s.dataPatch) runtime.patchData(review.id, s.dataPatch);
        const next =
          list.find(
            (e) =>
              e.id !== s.exc.id &&
              !s.clearedInList.includes(e.id) &&
              !resolvedIds.includes(e.id),
          ) ?? s.fresh[0];
        setActiveId(next?.id ?? "");
        setResolve(null);
      },
      reducedMotion ? 250 : 350,
    );
    return () => clearTimeout(t);
  }, [resolve, list, resolvedIds, review.id, runtime, reducedMotion]);

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

  function resolveActive() {
    if (!active || resolve) return;
    // Snapshot follow intent for this sequence: only auto-scroll if the reviewer
    // was already near the bottom, and cancel it if they scroll during it.
    stickRef.current = nearBottom(120);
    userScrolledRef.current = false;
    const r = active.resolution;
    const meta = exceptionMeta(active);
    const label = r?.label ?? `${meta.label} resolved`;
    const sub = r?.sub ?? `${meta.label}, resolved by you`;
    const shortLabel = r?.shortLabel ?? `${meta.label.toLowerCase()} resolved`;
    setResolve({
      exc: active,
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

  // Summary sentence built from the reviewer's resolutions, in order.
  const shortLabels = events
    .filter((e) => e.kind === "resolved" && !e.auto && e.shortLabel)
    .map((e) => (e.kind === "resolved" ? e.shortLabel : undefined))
    .filter((x): x is string => !!x);
  const summarySentence =
    shortLabels.length > 0
      ? `${(() => {
          const joined = shortLabels.join(", ");
          return joined.charAt(0).toUpperCase() + joined.slice(1);
        })()}. This invoice is ready for your decision.`
      : "This invoice is ready for your decision.";

  return (
    <div className="relative flex-1 overflow-hidden">
      <div
        ref={containerRef}
        className="h-full overflow-y-auto px-4 sm:px-6 lg:px-8 pt-8 pb-8 custom-scrollbar [scrollbar-gutter:stable]"
      >
        <ol className="w-full max-w-5xl">
          <AgentHistoryPeek steps={review.agentHistory} />
          {allClear ? (
            <>
              {/* The resolve log compresses into a peek; the terminal block lands
                below it. The screen closes the way it opened. */}
              <ResolveHistoryPeek events={events} />
              <TerminalBlock
                summary={summarySentence}
                onApprove={onApprove}
                onHold={onHold}
              />
            </>
          ) : (
            <>
              {events.map((ev) =>
                ev.kind === "resolved" ? (
                  <EventRow
                    key={ev.key}
                    marker="resolved"
                    label={ev.label}
                    sub={ev.sub}
                    time={ev.time}
                  />
                ) : (
                  <EventRow
                    key={ev.key}
                    marker={ev.pending ? "progress" : "agent"}
                    label={ev.label}
                    sub={ev.sub}
                    time={ev.time}
                  />
                ),
              )}
              {resolve ? (
                <ResolvingNode
                  resolve={resolve}
                  openList={openList}
                  showHeader={showHeader}
                  counter={counter}
                  isNew={isNew}
                  reducedMotion={reducedMotion}
                />
              ) : active ? (
                <ExceptionGroup
                  active={active}
                  openList={openList}
                  showHeader={showHeader}
                  counter={counter}
                  isNew={isNew}
                  onResolve={resolveActive}
                  onSelect={anchor}
                />
              ) : null}
              <TimelineRow marker="upcoming" isLast>
                <p className="min-h-7 pt-1 text-[13px] leading-normal text-muted-foreground">
                  Validation runs again after each fix. Anything new surfaces
                  here.
                </p>
              </TimelineRow>
            </>
          )}
        </ol>
      </div>
      {/* Header scrim: content fades + blurs across a ~32px zone as it passes
          under the sticky header. Degrades to fade-only without backdrop-filter. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[var(--header-scrim-h,32px)] backdrop-blur-[8px] [background:linear-gradient(to_bottom,var(--background),transparent)] [mask-image:linear-gradient(to_bottom,black,transparent)]"
      />
    </div>
  );
}
