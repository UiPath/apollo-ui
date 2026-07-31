"use client";

import { Check } from "lucide-react";
import { Fragment } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { AiMark } from "@/registry/ai-mark/ai-mark";
import type { JourneyStage, JourneyStageState } from "../JourneyBar";

export interface ActivityEvent {
  /** Avatar chip for a person acting, the ✦ mark for an agent action. */
  type: "user" | "agent";
  /** Index into `stages` — the point along the track this occurred at. */
  stageIndex: number;
  label: string;
  /** Avatar initials, "user" events only. */
  initials?: string;
}

interface ActivityTrackProps {
  stages: JourneyStage[];
  events?: ActivityEvent[];
  className?: string;
}

function nodeClass(state: JourneyStageState): string {
  if (state === "done")
    return "border-primary bg-primary text-primary-foreground";
  if (state === "active") return "border-primary bg-background text-primary";
  if (state === "active-warning")
    return "border-warning bg-background text-warning";
  return "border-border bg-background";
}

function pulseClass(state: JourneyStageState): string {
  if (state === "active") return "border-primary/50";
  if (state === "active-warning") return "border-warning/50";
  return "";
}

function labelClass(state: JourneyStageState): string {
  if (state === "done") return "text-muted-foreground";
  if (state === "active") return "font-semibold text-primary";
  // text-warning (amber) fails contrast at this size — the ringed node
  // already signals "current, needs attention," so the label just needs
  // the emphasis, not the color.
  if (state === "active-warning") return "font-semibold text-foreground";
  return "text-muted-foreground/50";
}

/**
 * Horizontal stage track with pinned activity — bigger nodes than JourneyBar,
 * a ring on the current stage, and event pins (avatar for a person, the ✦
 * mark for an agent action) stacked above the stage they occurred at.
 * Pins collapse to a count badge past three in one stage.
 */
export function ActivityTrack({
  stages,
  events = [],
  className,
}: ActivityTrackProps) {
  const eventsByStage = new Map<number, ActivityEvent[]>();
  for (const event of events) {
    const list = eventsByStage.get(event.stageIndex) ?? [];
    list.push(event);
    eventsByStage.set(event.stageIndex, list);
  }

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Event pins — mirrors the node row's column widths so each pin lands
          above the stage it belongs to. */}
      <div className="flex items-end" aria-hidden>
        {stages.map((stage, i) => {
          const stageEvents = eventsByStage.get(i) ?? [];
          return (
            <Fragment key={stage.label}>
              {i > 0 && <div className="flex-1" />}
              <div className="flex w-5 shrink-0 flex-col items-center gap-1 pb-1.5">
                {stageEvents.length > 3 ? (
                  <span className="flex size-[18px] items-center justify-center rounded-full border border-border bg-muted text-[8.5px] font-semibold text-muted-foreground">
                    +{stageEvents.length}
                  </span>
                ) : (
                  stageEvents.length > 0 && (
                    <div className="flex -space-x-1.5">
                      {stageEvents.map((event, eventIdx) =>
                        event.type === "user" ? (
                          <Avatar
                            key={eventIdx}
                            className="size-[18px] border border-background"
                          >
                            <AvatarFallback className="bg-muted text-[7px] font-medium text-muted-foreground">
                              {event.initials ?? "?"}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <span
                            key={eventIdx}
                            className="flex size-[18px] items-center justify-center rounded-full border border-background bg-insight-50 text-insight-600 dark:bg-insight-900"
                          >
                            <AiMark size={9} />
                          </span>
                        ),
                      )}
                    </div>
                  )
                )}
                {stageEvents.length > 0 && (
                  <div className="h-1.5 w-px bg-border" />
                )}
              </div>
            </Fragment>
          );
        })}
      </div>

      {/* Nodes + connectors */}
      <div className="flex items-center" aria-hidden>
        {stages.map((stage, i) => (
          <Fragment key={stage.label}>
            {i > 0 && (
              <div
                className={cn(
                  "h-1 flex-1 rounded-full",
                  stages[i - 1].state === "done" ? "bg-primary" : "bg-border",
                )}
              />
            )}
            <span
              className={cn(
                "relative flex size-5 shrink-0 items-center justify-center rounded-full border-2",
                nodeClass(stage.state),
              )}
            >
              {(stage.state === "active" ||
                stage.state === "active-warning") && (
                <span
                  aria-hidden
                  style={{ animationDuration: "2.4s" }}
                  className={cn(
                    "absolute -inset-1 animate-ping rounded-full border-2 motion-reduce:animate-none",
                    pulseClass(stage.state),
                  )}
                />
              )}
              {stage.state === "done" && (
                <Check className="size-3" strokeWidth={3} aria-hidden />
              )}
            </span>
          </Fragment>
        ))}
      </div>

      {/* Labels */}
      <div
        className="mt-2 flex justify-between"
        role="list"
        aria-label="Request progress"
      >
        {stages.map((stage) => (
          <span
            key={stage.label}
            role="listitem"
            className={cn(
              "text-[10.5px] leading-tight",
              labelClass(stage.state),
            )}
          >
            {stage.label}
          </span>
        ))}
      </div>
    </div>
  );
}
