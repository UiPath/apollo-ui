import type { ReactNode } from "react";
import type { OccupantState } from "@/components/ui/occupant";
import type { OccupantSpec } from "@/lib/composition";
import {
  type EntryComponent,
  WithSelection,
} from "@/lib/occupant-with-selection";

/**
 * The roles an occupant's example views play, the same for every occupant,
 * so previews and checks can switch samples by role:
 *
 * - primary: data from one domain
 * - secondary: data from a different domain, to show the occupant is neutral
 * - stress: the data that breaks layouts (long, unbroken, many, missing)
 */
export type ExampleRole = "primary" | "secondary" | "stress";

export const EXAMPLE_ROLES: readonly ExampleRole[] = [
  "primary",
  "secondary",
  "stress",
];

/** An occupant's example views, one per role. */
export type OccupantExamples<ViewModel> = Record<ExampleRole, ViewModel>;

/** A registered occupant, ready for a preview or a check to render. */
export interface RegisteredOccupant {
  spec: OccupantSpec;
  /** Renders it with one of its examples; unknown names fall back to primary. */
  render: (example: string, options?: { state?: OccupantState }) => ReactNode;
}

/**
 * Pairs an occupant's component with its examples, checked against the same
 * view model, and hides the view model's type so every occupant fits one list.
 */
export function defineOccupant<ViewModel>(entry: {
  spec: OccupantSpec;
  Component: EntryComponent<ViewModel>;
  examples: OccupantExamples<ViewModel>;
}): RegisteredOccupant {
  const { Component, examples } = entry;
  return {
    spec: entry.spec,
    render: (example, options = {}) => {
      const role = EXAMPLE_ROLES.find((r) => r === example) ?? "primary";
      return (
        <WithSelection
          key={role}
          Component={Component}
          view={examples[role]}
          {...options}
        />
      );
    },
  };
}
