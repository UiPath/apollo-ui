import { createContext, type ReactNode, useContext } from 'react';

const EMPTY_COLLAPSED_ROWS: ReadonlySet<string> = new Set();

const SequentialCollapsedRowsContext = createContext<ReadonlySet<string>>(EMPTY_COLLAPSED_ROWS);

export interface SequentialCollapsedRowsProviderProps {
  children: ReactNode;
  /** The view-local collapsed row-id set (SequentialCanvasInner's `collapsedSet`). */
  collapsedStepIds: ReadonlySet<string>;
}

/**
 * Carries the Sequential Canvas's view-local `collapsedStepIds` set down to
 * `SequentialStepNode` without touching node `data`. A
 * collapsed collapsible row must render its bar with the same decorative
 * "stacked" treatment BaseNode's card uses for drillable/collapsed nodes, but
 * the sequential clone's `data` is a by-reference passthrough from the
 * canonical node (see `useSequentialGraph.ts`) and must not be mutated (D12);
 * mutating it per collapse toggle would also break the clone/canonical
 * reference-equality memoization that keeps rename keystrokes cheap.
 *
 * Kept as a tiny dedicated context (rather than folding into the broader,
 * OPTIONAL `SequentialViewContext`) because `collapsedStepIds` is a required,
 * always-present concept of `SequentialCanvas` itself, whereas
 * `SequentialViewContext` only exists for hosts that compose an explicit
 * flow/sequential toggle and may not be mounted at all.
 */
export function SequentialCollapsedRowsProvider({
  children,
  collapsedStepIds,
}: SequentialCollapsedRowsProviderProps) {
  return (
    <SequentialCollapsedRowsContext.Provider value={collapsedStepIds}>
      {children}
    </SequentialCollapsedRowsContext.Provider>
  );
}

/** Returns the current collapsed row-id set; empty outside a provider (e.g. in isolated node tests/stories). */
export function useSequentialCollapsedRows(): ReadonlySet<string> {
  return useContext(SequentialCollapsedRowsContext);
}
