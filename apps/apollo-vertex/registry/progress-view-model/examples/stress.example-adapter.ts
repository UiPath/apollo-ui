/**
 * EXAMPLE ADAPTER (stress). Not shipped, and not a real domain: it fills the
 * progress view model with the data that breaks layouts, so the occupant
 * checks prove each occupant holds for any data. Very long titles and
 * values, long unbroken tokens, many stages and events, and empty or
 * missing optional values.
 */
import {
  deriveStages,
  type ProgressEvent,
  type ProgressViewModel,
} from "../progress-view-model";

/** A token with no break opportunities, which only wraps anywhere. */
const UNBROKEN =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LONG =
  "A very long value that keeps going well past any width a narrow slot can give it, to test wrapping";
const SUBJECT = `ITEM-${UNBROKEN}`;

const actor = (i: number): ProgressEvent["actor"] =>
  i % 2
    ? { kind: "person", name: `${LONG} person`, initials: "WW" }
    : { kind: "agent", name: `${LONG} agent` };
const STATUSES: ProgressEvent["status"][] = [
  "done",
  "in-progress",
  "needs-attention",
  "failed",
  "cancelled",
];
const STAGE_DEFINITIONS = Array.from({ length: 9 }, (_, i) => ({
  id: `s${i}`,
  label: i % 2 ? `${LONG} stage ${i}` : `${UNBROKEN}${i}`,
}));
const EVENTS: ProgressEvent[] = Array.from({ length: 12 }, (_, i) => ({
  id: `e${i}`,
  actor: actor(i),
  status: STATUSES[i % STATUSES.length] ?? "done",
  title: i % 2 ? `${LONG} ${i}` : `${UNBROKEN}${i}`,
  ...(i % 3 !== 2 && { detail: i % 2 ? UNBROKEN : LONG }),
  time: i % 4 ? `Sep ${i + 1}, ${UNBROKEN.slice(0, 20)}` : "",
  stageId: `s${Math.min(i, 6)}`,
}));

export const STRESS_PROGRESS: ProgressViewModel = {
  subject: SUBJECT,
  events: EVENTS,
  stages: deriveStages(STAGE_DEFINITIONS, EVENTS),
};
