import type { TimelineMarkerVariant } from "@/components/ui/timeline";
import type {
  ProgressEvent,
  ProgressStage,
  ProgressViewModel,
} from "./progress-view-model";

/** A marker, as TimelineMarker draws it. */
export interface MarkerView {
  variant: TimelineMarkerVariant;
  initials?: string;
}

const AGENT_MARKER: Record<ProgressEvent["status"], TimelineMarkerVariant> = {
  done: "completed-ai",
  "in-progress": "ai-progress",
  "needs-attention": "ai-suspended",
  failed: "ai-failed",
  cancelled: "ai-cancelled",
};

/** An event's marker, from who did it and how it stands. */
export function eventMarker({ actor, status }: ProgressEvent): MarkerView {
  if (actor.kind === "agent") return { variant: AGENT_MARKER[status] };
  if (status === "done") return { variant: "completed-user" };
  return {
    variant: "user",
    ...(actor.initials && { initials: actor.initials }),
  };
}

/**
 * A stage's marker: its latest event's marker, or, with no events yet, one
 * for its owner (an agent unless it names a person).
 */
export function stageMarker(
  stage: ProgressStage,
  view: ProgressViewModel,
): MarkerView {
  const last = view.events.findLast((event) => event.stageId === stage.id);
  if (last && stage.status !== "upcoming") return eventMarker(last);
  const person = stage.owner?.kind === "person" ? stage.owner : null;
  if (stage.status === "upcoming") {
    return person
      ? {
          variant: "user",
          ...(person.initials && { initials: person.initials }),
        }
      : { variant: "ai-upcoming" };
  }
  if (stage.status === "done") {
    return { variant: person ? "completed-user" : "completed-ai" };
  }
  return person
    ? { variant: "user", ...(person.initials && { initials: person.initials }) }
    : { variant: "ai-progress" };
}
