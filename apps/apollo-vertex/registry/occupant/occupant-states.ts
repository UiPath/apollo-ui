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
