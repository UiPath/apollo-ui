/**
 * The neutral view model for progress occupants: the activity timeline and
 * the stage strip. It has no domain terms. A solution's adapter maps its own
 * data into this shape; the occupants never see the domain.
 */

export type ActorKind = "person" | "agent";

/** Who did a step. */
export interface ProgressActor {
  kind: ActorKind;
  name: string;
  /** Shown in a person's marker. */
  initials?: string;
}

export type ProgressEventStatus =
  | "done"
  | "in-progress"
  | "needs-attention"
  | "failed"
  | "cancelled";

/** One thing that happened. */
export interface ProgressEvent {
  id: string;
  actor: ProgressActor;
  status: ProgressEventStatus;
  title: string;
  detail?: string;
  /** Already formatted for display. */
  time: string;
  /** The stage it belongs to, by id. */
  stageId?: string;
}

export type ProgressStageStatus = "done" | "current" | "upcoming";

/** One step in the overall flow. */
export interface ProgressStage {
  id: string;
  label: string;
  status: ProgressStageStatus;
  /** Who does the stage. Defaults to an agent. */
  owner?: ProgressActor;
}

export interface ProgressViewModel {
  /** What this is the progress of, for accessible names, e.g. an item's id. */
  subject: string;
  /** Oldest first. */
  events: ProgressEvent[];
  /** In order. At most one is current. */
  stages: ProgressStage[];
}

/** A stage as an adapter defines it, before its status is known. */
export type ProgressStageDefinition = Omit<ProgressStage, "status">;

/**
 * For adapters: stage statuses from the events. The current stage is the
 * latest event's stage; stages before it are done, stages after it upcoming.
 */
export function deriveStages(
  definitions: readonly ProgressStageDefinition[],
  events: readonly ProgressEvent[],
): ProgressStage[] {
  const latest = events.at(-1);
  const current = definitions.findIndex(
    (stage) => stage.id === latest?.stageId,
  );
  return definitions.map((stage, index) => {
    if (current === -1 || index > current)
      return { ...stage, status: "upcoming" };
    return { ...stage, status: index === current ? "current" : "done" };
  });
}
