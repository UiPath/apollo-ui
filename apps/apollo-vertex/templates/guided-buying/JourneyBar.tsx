"use client";

import { Check } from "lucide-react";
import { Fragment, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type JourneyStageState =
  | "done"
  | "active"
  | "active-warning"
  | "upcoming";

export interface JourneyStage {
  label: string;
  state: JourneyStageState;
  /** Called when clicking a done stage. "inline" labelPosition only. */
  onClick?: () => void;
}

interface JourneyBarProps {
  stages: JourneyStage[];
  /**
   * "below" (default): 13px dots, label row below, colored done-connectors.
   *   Request tracking — deck jbar pattern.
   * "inline": 6px dots, labels inline beside dots, muted connectors.
   *   Wizard progress — FlowPhaseBar pattern.
   */
  labelPosition?: "below" | "inline";
  /** Rendered below the label row. "below" mode only. */
  ownerNote?: ReactNode;
  /** Rendered below the label row. P2 slot, "below" mode only. */
  recordChips?: ReactNode;
  className?: string;
}

// ─── Dot renderers ────────────────────────────────────────────────────────────

function BelowDot({ state }: { state: JourneyStageState }) {
  if (state === "done") {
    return (
      <span className="flex size-[13px] shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Check className="size-[8px]" strokeWidth={3} aria-hidden />
      </span>
    );
  }
  if (state === "active") {
    return (
      <span className="size-[13px] shrink-0 rounded-full border-[2.5px] border-primary bg-background" />
    );
  }
  if (state === "active-warning") {
    return (
      <span className="size-[13px] shrink-0 rounded-full border-[2.5px] border-warning bg-background" />
    );
  }
  return (
    <span className="size-[13px] shrink-0 rounded-full border-2 border-border bg-background" />
  );
}

function InlineDot({ state }: { state: JourneyStageState }) {
  if (state === "done") {
    return <Check className="size-3 shrink-0" strokeWidth={2.5} aria-hidden />;
  }
  if (state === "active" || state === "active-warning") {
    return (
      <span
        className="inline-block size-1.5 shrink-0 rounded-full bg-current"
        aria-hidden
      />
    );
  }
  return (
    <span
      className="inline-block size-1.5 shrink-0 rounded-full border border-current"
      aria-hidden
    />
  );
}

// ─── Label class helpers ───────────────────────────────────────────────────────

function belowLabelClass(state: JourneyStageState): string {
  if (state === "done") return "text-primary";
  if (state === "active") return "font-semibold text-primary";
  if (state === "active-warning") return "font-semibold text-warning";
  return "text-muted-foreground";
}

function inlineLabelClass(state: JourneyStageState): string {
  if (state === "done") return "text-muted-foreground";
  if (state === "active" || state === "active-warning")
    return "font-medium text-foreground";
  return "text-muted-foreground/50";
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Unified horizontal progress / status indicator.
 *
 * Two visual modes share the same stage data model:
 * - "below": 13px named dots with a separate label row below — request tracking.
 * - "inline": 6px dots with labels beside them — wizard step progress (FlowPhaseBar).
 */
export function JourneyBar({
  stages,
  labelPosition = "below",
  ownerNote,
  recordChips,
  className,
}: JourneyBarProps) {
  if (labelPosition === "inline") {
    return (
      <div
        className={cn("flex items-center justify-center", className)}
        role="list"
        aria-label="Progress"
      >
        {stages.map((stage, i) => {
          const labelEl = stage.onClick ? (
            <button
              type="button"
              onClick={stage.onClick}
              className="flex items-center gap-1.5 transition-colors hover:text-foreground"
            >
              <InlineDot state={stage.state} />
              {stage.label}
            </button>
          ) : (
            <>
              <InlineDot state={stage.state} />
              {stage.label}
            </>
          );

          return (
            <Fragment key={stage.label}>
              {i > 0 && (
                <div
                  className="mx-2.5 h-px w-5 shrink-0 bg-border"
                  aria-hidden
                />
              )}
              <span
                role="listitem"
                className={cn(
                  "flex items-center gap-1.5 text-[13px] leading-none",
                  inlineLabelClass(stage.state),
                )}
                aria-current={
                  stage.state === "active" || stage.state === "active-warning"
                    ? "step"
                    : undefined
                }
              >
                {labelEl}
              </span>
            </Fragment>
          );
        })}
      </div>
    );
  }

  // "below" mode — dot row + label row + optional slots
  return (
    <div
      className={cn("flex flex-col", className)}
      aria-label="Request progress"
    >
      {/* Dot + connector row */}
      <div className="flex items-center" aria-hidden>
        {stages.map((stage, i) => (
          <Fragment key={stage.label}>
            {i > 0 && (
              <div
                className={cn(
                  "h-[2.5px] flex-1",
                  stages[i - 1].state === "done" ? "bg-primary" : "bg-border",
                )}
              />
            )}
            <BelowDot state={stage.state} />
          </Fragment>
        ))}
      </div>
      {/* Label row — justify-between mirrors dot spacing */}
      <div className="mt-1.5 flex justify-between">
        {stages.map((stage) => {
          const labelCls = cn(
            "text-[10.5px] leading-tight",
            belowLabelClass(stage.state),
          );
          return stage.onClick ? (
            <button
              key={stage.label}
              type="button"
              onClick={stage.onClick}
              className={cn(labelCls, "transition-colors hover:underline")}
            >
              {stage.label}
            </button>
          ) : (
            <span key={stage.label} className={labelCls}>
              {stage.label}
            </span>
          );
        })}
      </div>
      {ownerNote != null && (
        <p className="mt-2 text-xs text-muted-foreground">{ownerNote}</p>
      )}
      {recordChips != null && (
        <div className="mt-2 flex flex-wrap gap-1.5">{recordChips}</div>
      )}
    </div>
  );
}
