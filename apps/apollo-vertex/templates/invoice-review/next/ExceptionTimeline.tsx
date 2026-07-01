"use client";

import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AiMark } from "@/registry/ai-mark/ai-mark";
import { Avatar, AvatarFallback } from "@/registry/avatar/avatar";
import {
  type AgentStep,
  type Finding,
  type InvoiceException,
  type InvoiceReview,
  type Suggestion,
  highlightInSource,
} from "./invoice-review-data";
import { SuggestedFixCard } from "./SuggestedFixCard";

const REVIEWER_INITIALS = "PV";

// Marker kinds mirror the AI Toolkit timeline treatment. People are avatars,
// agents carry the mark; the strong gradient marks completed agent steps.
type MarkerKind = "agent" | "progress" | "upcoming" | "reviewer";

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
  children,
}: {
  marker: MarkerKind;
  isLast?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <li className="flex gap-3">
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

/** The focused "you are here" node with the finding and resolution. */
function LiveExceptionNode({
  exception,
  onResolve,
  isLast,
}: {
  exception: InvoiceException;
  onResolve: (s: Suggestion) => void;
  isLast?: boolean;
}) {
  const isJudgment = exception.suggestions.length === 0;
  return (
    <TimelineRow
      marker="reviewer"
      isLast={isLast}
      className={isLast ? undefined : "pb-12"}
    >
      <div className="flex min-h-7 flex-wrap items-center gap-2">
        <Badge status="warning">{exception.chip}</Badge>
      </div>
      {/* The single anchor: largest element, weight 500. Everything else steps
          down from it via size and color, not competing weight. */}
      <h2
        className="mt-3.5 line-clamp-2 text-[2rem] font-bold leading-[1.25] text-foreground"
        style={{
          letterSpacing: "-0.02em",
          textWrap: "balance",
          maxWidth: "22ch",
        }}
      >
        {exception.headline}
      </h2>
      {/* Comparison adds info (two values); a single value just restates the
          headline, so render nothing between the headline and the fix. */}
      {exception.finding.type === "compare" && (
        <div className="mt-[18px]">
          <FindingView finding={exception.finding} />
        </div>
      )}
      {isJudgment ? (
        exception.reasoning && (
          <p className="mt-5 max-w-prose text-sm leading-normal text-muted-foreground">
            {exception.reasoning}
          </p>
        )
      ) : (
        <SuggestedFixCard
          suggestions={exception.suggestions}
          onResolve={onResolve}
        />
      )}
    </TimelineRow>
  );
}

function DownstreamNode({
  gateMain,
  gateSub,
}: {
  gateMain: string;
  gateSub: string;
}) {
  return (
    <TimelineRow marker="upcoming" isLast>
      <div className="min-h-7 pt-0.5">
        <p className="text-sm font-medium text-muted-foreground">{gateMain}</p>
        <p className="text-xs text-muted-foreground">{gateSub}</p>
      </div>
    </TimelineRow>
  );
}

/**
 * The exception-review timeline for one invoice. Single vs cascade is purely
 * `review.downstream === null` vs populated. Resolve wiring (re-validation,
 * surfaced exceptions, header lock) is layered in via the review machine.
 */
export function ExceptionTimeline({
  review,
  onResolve,
}: {
  review: InvoiceReview;
  onResolve: (s: Suggestion) => void;
}) {
  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pt-8 pb-8 custom-scrollbar">
      <ol className="w-full max-w-5xl">
        <AgentHistoryPeek steps={review.agentHistory} />
        <LiveExceptionNode
          exception={review.exception}
          onResolve={onResolve}
          isLast={review.downstream === null}
        />
        {review.downstream && (
          <DownstreamNode
            gateMain={review.downstream.gateMain}
            gateSub={review.downstream.gateSub}
          />
        )}
      </ol>
    </div>
  );
}
