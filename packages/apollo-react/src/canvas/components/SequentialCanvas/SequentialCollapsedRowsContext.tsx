import { createContext, type ReactNode, useContext } from 'react';

const EMPTY_COLLAPSED_ROWS: ReadonlySet<string> = new Set();

const SequentialCollapsedRowsContext = createContext<ReadonlySet<string>>(EMPTY_COLLAPSED_ROWS);

export interface SequentialCollapsedRowsProviderProps {
  children: ReactNode;
  collapsedStepIds: ReadonlySet<string>;
}

/**
 * Carries the collapsed row-id set down to SequentialStepNode without touching node `data`,
 * which is a by-reference passthrough from the canonical node and must not be mutated.
 * Separate from the optional SequentialViewContext because this one is always present.
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

/** The collapsed row-id set; empty outside a provider. */
export function useSequentialCollapsedRows(): ReadonlySet<string> {
  return useContext(SequentialCollapsedRowsContext);
}
