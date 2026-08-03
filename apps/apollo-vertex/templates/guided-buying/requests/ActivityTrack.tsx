"use client";

import { Check, TriangleAlert } from "lucide-react";
import { Fragment } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  /** The person this stage is about — whoever completed it, or whoever it's
   * currently waiting on — rendered as their avatar in place of the agent's
   * ✦ mark, in whatever chrome that stage's state already uses (dotted
   * ring, pulsing ring, or plain for done). Omit for agent/system stages
   * (e.g. placing the order), which keep the ✦ mark. */
  person?: { initials: string };
}

interface ActivityTrackProps {
  stages: ActivityStage[];
  className?: string;
}

function nameClass(state: JourneyStageState): string {
  if (state === "upcoming") return "text-muted-foreground/50";
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

/** The ✦ mark or, when this stage is a specific person's, their initials —
 * same size/position either way, so swapping one for the other doesn't
 * disturb the surrounding ring/border chrome. */
function StageGlyph({ person }: { person?: { initials: string } }) {
  if (person != null) {
    return <span className="text-[10px] font-semibold">{person.initials}</span>;
  }
  return <AiMark size={13} gradientId="gb-ai-mark" />;
}

/**
 * Stage node. Vocabulary adapted from the invoice app's timeline (dotted
 * ring for queued, gradient fill for agent-completed, avatar for
 * person-completed) plus one addition: the current stage is waiting on a
 * person's decision, not the system processing something, so it gets a
 * slow-pulsing ring in the AI accent rather than a spinning indeterminate
 * arc — that stays reserved for genuine in-progress system work. Active and
 * active-warning render identically; the warning only ever colors the date
 * text below (see dateClass).
 *
 * `person` swaps the ✦ mark for that person's initials in every state —
 * queued, waiting, or done — because the actor, not the stage's status,
 * decides whether it's a person's avatar or the agent's mark: Submitted and
 * Received are the requester's actions, Approved is the approver's call,
 * and only genuinely agent/system stages (placing the order) keep the mark.
 */
function StageMarker({
  state,
  person,
}: {
  state: JourneyStageState;
  person?: { initials: string };
}) {
  if (state === "upcoming") {
    return (
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-dotted border-insight-300 bg-background text-insight-400">
        <StageGlyph person={person} />
      </span>
    );
  }

  if (state === "active" || state === "active-warning") {
    return (
      <span className="relative flex size-7 shrink-0 items-center justify-center rounded-full bg-insight-50 text-insight-600 dark:bg-insight-900">
        <span
          aria-hidden
          style={{ animationDuration: "2.6s" }}
          className="absolute inset-0 animate-pulse rounded-full border-2 border-insight-400 motion-reduce:animate-none"
        />
        <StageGlyph person={person} />
      </span>
    );
  }

  // done, completed by a named person — an avatar carries it, no checkmark.
  if (person != null) {
    return (
      <Avatar className="size-7">
        <AvatarFallback className="bg-muted text-[11px] font-medium text-muted-foreground">
          {person.initials}
        </AvatarFallback>
      </Avatar>
    );
  }

  // done, agent/system-completed — gradient-filled, same treatment as the
  // guide's "Complete (gradient)" marker.
  return (
    <span
      className="flex size-7 shrink-0 items-center justify-center rounded-full text-white"
      style={{ background: "var(--ai-gradient-strong)" }}
    >
      <Check className="size-3.5" strokeWidth={3} aria-hidden />
    </span>
  );
}

/**
 * Horizontal stage track — bigger nodes than JourneyBar, a ring on the
 * current stage, and an avatar in place of the ✦ mark wherever a stage is a
 * specific person's (see StageMarker). Events belong in the Activity record
 * below, not pinned above the track — a timestamp has no meaningful
 * position on a stage node.
 */
export function ActivityTrack({ stages, className }: ActivityTrackProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      {/* Nodes + connector — the line is a separate layer running behind the
          nodes (inset by half a node's width, so it spans centre-to-centre
          of the first and last node) rather than a flex sibling stopping at
          each node's edge, so it visually passes underneath every marker
          with no gap. */}
      <div className="relative flex items-center">
        <div
          className="absolute inset-x-3.5 top-1/2 flex -translate-y-1/2"
          aria-hidden
        >
          {stages.slice(0, -1).map((stage) => (
            <div
              key={stage.label}
              className={cn(
                "h-px flex-1",
                stage.state === "done" ? "bg-primary" : "bg-border",
              )}
            />
          ))}
        </div>
        <div
          className="relative z-10 flex w-full items-center justify-between"
          aria-hidden
        >
          {stages.map((stage) => (
            <StageMarker
              key={stage.label}
              state={stage.state}
              person={stage.person}
            />
          ))}
        </div>
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
