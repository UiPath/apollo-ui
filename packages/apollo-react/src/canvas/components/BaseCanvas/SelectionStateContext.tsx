import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { Node } from '@uipath/apollo-react/canvas/xyflow/react';

interface SelectionStateContextValue {
  /** True when more than one node is selected */
  multipleNodesSelected: boolean;
}

const SelectionStateContext = createContext<SelectionStateContextValue | null>(null);

interface SelectionStateProviderProps {
  children: ReactNode;
  nodes: Node[] | undefined;
}

/**
 * Provider that computes selection state once and shares it with all nodes.
 * This prevents O(n^2) complexity when each node would otherwise compute
 * the multi-selection state independently.
 *
 * Must be placed OUTSIDE ReactFlow so that nodes can access the context.
 * The `nodes` prop should be the same array passed to ReactFlow.
 */
export function SelectionStateProvider({ children, nodes }: SelectionStateProviderProps) {
  const multipleNodesSelected = useMemo(() => {
    if (!nodes) {
      return false;
    }

    let count = 0;
    for (const node of nodes) {
      if (node.selected) {
        count++;
        if (count > 1) return true;
      }
    }

    return false;
  }, [nodes]);

  const value = useMemo<SelectionStateContextValue>(
    () => ({ multipleNodesSelected }),
    [multipleNodesSelected]
  );

  return <SelectionStateContext.Provider value={value}>{children}</SelectionStateContext.Provider>;
}

/**
 * Hook to access selection state from context.
 * Falls back to false if used outside provider (for backwards compatibility).
 */
export function useSelectionState(): SelectionStateContextValue {
  const context = useContext(SelectionStateContext);
  // Return default value if no provider (graceful fallback)
  return context ?? { multipleNodesSelected: false };
}
