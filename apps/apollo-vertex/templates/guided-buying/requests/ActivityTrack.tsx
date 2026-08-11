"use client";

import { Check, TriangleAlert } from "lucide-react";
import { Fragment } from "react";
import { cn } from "@/lib/utils";
import { AiMark } from "@/registry/ai-mark/ai-mark";
import type { JourneyStage, JourneyStageState } from "../JourneyBar";

export interface ActivityStage extends JourneyStage {
  /** Second-line date — the actual date once done, an expected/projected
   * date otherwise. Omit rather than showing a placeholder when it can't
   * be derived. */
  date?: string;
  /** Days since `date` passed without this stage completing — active-warning
   * only. Renders as "· N day(s) ago" alongside the expected date, so the
   * lateness is a fact ("expected then, still hasn't happened") rather than
   * a loaded word like "overdue". Omit if it can't be derived. */
  overdueDays?: number;
  /** True only for a genuine agent/system stage (e.g. placing the order) —
   * keeps the ✦ mark. Every other stage is a plain marker: the label
   * beneath it already names whoever it belongs to, so the node itself no
   * longer carries an avatar (removed — see report). */
  isAgent?: boolean;
}

interface ActivityTrackProps {
  stages: ActivityStage[];
  className?: string;
}

// Secondary, not muted — an upcoming step is still owed, not disabled, so
// it reads at a step down from the current/done tokens rather than fading
// out. Sub-labels (dateClass, below) stay on the muted token; only the
// stage name moves.
function nameClass(state: JourneyStageState): string {
  if (state === "upcoming") return "text-secondary-foreground";
  if (state === "active" || state === "active-warning")
    return "font-medium text-foreground";
  return "text-foreground";
}

// Amber is reserved for an expected date that has passed — a fact about the
// delay, not an alarm. "active-warning" is exactly that signal; the node
// itself never carries the color (see StageMarker). text-warning alone
// fails contrast at 10.5px on the card background — warning-foreground is
// this system's accessible pairing for warning text on a light surface
// (see alert.tsx, badge.tsx), and the icon means the state doesn't rely on
// color alone either way.
function dateClass(state: JourneyStageState): string {
  if (state === "active-warning")
    return "text-warning-foreground dark:text-warning";
  return "text-muted-foreground";
}

// "Expected" only on the stage actually being forecast right now — future
// stages are already muted, which says "hasn't happened" on its own;
// repeating the word on every one of them was just noise. active-warning
// appends the elapsed time instead of swapping in a judgement word like
// "overdue" — "Expected 22 Jul · 1 day ago" states the fact (expected then,
// still hasn't happened) without editorializing, while the warning color
// and icon (see dateClass, below) keep the state itself unambiguous.
function dateText(stage: ActivityStage): string | null {
  if (stage.date == null) return null;
  if (stage.state === "active-warning") {
    const elapsed =
      stage.overdueDays != null
        ? ` · ${stage.overdueDays} day${stage.overdueDays === 1 ? "" : "s"} ago`
        : "";
    return `Expected ${stage.date}${elapsed}`;
  }
  if (stage.state === "active") return `Expected ${stage.date}`;
  return stage.date;
}

/**
 * Stage node. Three states, one rule each, applied identically whether the
 * stage is a person's or the agent's — the AI stage differs only in
 * carrying the ✦ mark, never in weight:
 * - Future (`upcoming`): solid muted fill, visible at a glance rather than
 *   a faint outline.
 * - Current (`active`/`active-warning`): an accent ring, unfilled — the
 *   ring alone signals "current," never a color change. Amber never
 *   appears here regardless of active-warning; that stays confined to the
 *   sub-label text below (see dateClass) so this component only has one
 *   reserved use of the warning role, not two.
 * - Done: filled accent + check for a person's stage; the AI gradient +
 *   check for the agent's, since a completed agent action is a genuinely
 *   distinct fact worth its own color, unlike a merely upcoming one.
 *
 * No avatars — the label beneath each node already names whoever it
 * belongs to.
 */
function StageMarker({
  state,
  isAgent,
}: {
  state: JourneyStageState;
  isAgent?: boolean;
}) {
  if (state === "upcoming") {
    return (
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {isAgent && <AiMark size={13} gradientId="gb-ai-mark" />}
      </span>
    );
  }

  if (state === "active" || state === "active-warning") {
    return (
      <span className="relative flex size-7 shrink-0 items-center justify-center rounded-full bg-background text-primary">
        <span
          aria-hidden
          style={{ animationDuration: "2.6s" }}
          className="absolute inset-0 animate-pulse rounded-full border-2 border-primary motion-reduce:animate-none"
        />
        {isAgent && <AiMark size={13} gradientId="gb-ai-mark" />}
      </span>
    );
  }

  // done, agent/system-completed — gradient-filled, same treatment as the
  // guide's "Complete (gradient)" marker.
  if (isAgent) {
    return (
      <span
        className="flex size-7 shrink-0 items-center justify-center rounded-full text-white"
        style={{ background: "var(--ai-gradient-strong)" }}
      >
        <Check className="size-3.5" strokeWidth={3} aria-hidden />
      </span>
    );
  }

  // done, plain — same primary-fill vocabulary JourneyBar's own done-dot
  // already uses elsewhere in this app, just at this component's larger
  // node size.
  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
      <Check className="size-3.5" strokeWidth={3} aria-hidden />
    </span>
  );
}

/**
 * Horizontal stage track — bigger nodes than JourneyBar, a ring on the
 * current stage, plain markers otherwise (see StageMarker). Events belong
 * in the Activity record below, not pinned above the track — a timestamp
 * has no meaningful position on a stage node.
 */
export function ActivityTrack({ stages, className }: ActivityTrackProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      {/* Nodes + connector as flex siblings — each segment fills the gap
          between two w-7 nodes and terminates at their edges, the same
          fixed-column-plus-flex-1-spacer structure the label row below
          uses, so node centers and label centers stay aligned at any
          width without two layout algorithms to reconcile. */}
      <div className="flex items-center" aria-hidden>
        {stages.map((stage, i) => (
          <Fragment key={stage.label}>
            {i > 0 && (
              <div
                className={cn(
                  "h-px flex-1",
                  stages[i - 1].state === "done" ? "bg-primary" : "bg-border",
                )}
              />
            )}
            <StageMarker state={stage.state} isAgent={stage.isAgent} />
          </Fragment>
        ))}
      </div>

      {/* Labels — name + date, each anchored under its node. Fixed w-7
          columns match the node/pin rows; text overflows the column
          visually (no clipping) in whichever direction the alignment
          calls for, so first/last aren't squeezed against the card edge. */}
      <div className="mt-2 flex" role="list" aria-label="Request progress">
        {stages.map((stage, i) => {
          const isFirst = i === 0;
          const isLast = i === stages.length - 1;
          const date = dateText(stage);
          return (
            <Fragment key={stage.label}>
              {i > 0 && <div className="flex-1" />}
              <div
                role="listitem"
                className={cn(
                  "flex w-7 shrink-0 flex-col",
                  isFirst
                    ? "items-start text-left"
                    : isLast
                      ? "items-end text-right"
                      : "items-center text-center",
                )}
              >
                <span
                  className={cn(
                    "whitespace-nowrap text-[11.5px] leading-tight",
                    nameClass(stage.state),
                  )}
                >
                  {stage.label}
                </span>
                {date != null && (
                  <span
                    className={cn(
                      "mt-0.5 flex items-center gap-1 whitespace-nowrap text-[10.5px] leading-tight",
                      dateClass(stage.state),
                    )}
                  >
                    {stage.state === "active-warning" && (
                      <TriangleAlert className="size-3 shrink-0" aria-hidden />
                    )}
                    {date}
                  </span>
                )}
              </div>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
