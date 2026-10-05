import { createContext } from "react";
import type { OccupantSpec } from "@/lib/composition";

/**
 * The standard states every occupant can be in. "agent-updating" means an
 * agent is changing the content right now: it stays readable, marked busy.
 */
export type OccupantState =
  | "ready"
  | "loading"
  | "empty"
  | "error"
  | "agent-updating";

export const OCCUPANT_STATES: readonly OccupantState[] = [
  "ready",
  "loading",
  "empty",
  "error",
  "agent-updating",
];

/**
 * What every occupant component takes: its neutral view model, and the
 * standard state to show. A solution's adapter builds the view model from
 * its own data; the occupant never sees the domain.
 */
export interface OccupantViewProps<ViewModel> {
  view: ViewModel;
  /** Defaults to "ready". */
  state?: OccupantState;
  /** Shows a Retry button in the error state. */
  onRetry?: () => void;
}

/**
 * For occupants whose items can be picked, like a queue whose current item
 * is open in main. The page owns which item is current; the occupant shows
 * it and asks to change it. An occupant takes these only when it lists
 * items people pick from.
 */
export interface OccupantSelectionProps {
  /** The item that's current, by id. None is current when it's omitted. */
  currentId?: string;
  /** Called with an item's id when someone picks it or steps to it. */
  onSelect?: (id: string) => void;
}

/**
 * The spec of the occupant being rendered, from its Occupant root, so the
 * kit's parts can follow it without a prop of their own.
 */
export const OccupantSpecContext = createContext<OccupantSpec | null>(null);
