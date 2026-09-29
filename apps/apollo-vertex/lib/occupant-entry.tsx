import type { ComponentType, ReactNode } from "react";
import type {
  OccupantState,
  OccupantViewProps,
} from "@/components/ui/occupant";
import type { OccupantSpec } from "@/lib/composition";

/** A registered occupant, ready for a preview or a check to render. */
export interface RegisteredOccupant {
  spec: OccupantSpec;
  /** Its example view names, "stress" included. */
  examples: readonly string[];
  /** Renders it with one of its examples; unknown names fall back to the first. */
  render: (
    example: string,
    options?: { state?: OccupantState; onRetry?: () => void },
  ) => ReactNode;
}

/**
 * Pairs an occupant's component with its examples, checked against the same
 * view model, and hides the view model's type so every occupant fits one list.
 */
export function defineOccupant<ViewModel>(entry: {
  spec: OccupantSpec;
  Component: ComponentType<OccupantViewProps<ViewModel>>;
  examples: Record<string, ViewModel>;
}): RegisteredOccupant {
  const names = Object.keys(entry.examples);
  const { Component } = entry;
  return {
    spec: entry.spec,
    examples: names,
    render: (example, options = {}) => {
      const view = entry.examples[example] ?? entry.examples[names[0] ?? ""];
      if (!view) return null;
      return <Component view={view} {...options} />;
    },
  };
}
