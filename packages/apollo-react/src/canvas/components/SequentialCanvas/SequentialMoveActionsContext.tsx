import { createContext, useContext } from 'react';
import type { InsertionSlot } from '../../utils/sequential/sequential.types';
import type { SequentialMoveOptions } from './sequentialMoveActions';

export interface SequentialMoveActionsContextValue {
  /** The four move candidates for `nodeId` (disabled direction => `undefined`). */
  getMoveOptions: (nodeId: string) => SequentialMoveOptions;
  /**
   * Applies `moveSubtree(projection, nodeId, slot, {nodes, edges})` through
   * `onNodesChange`/`onEdgesChange` (D10: the public API stays the standard
   * change callbacks, never a parallel mutation channel). A no-op for a
   * degenerate/self-targeting slot, matching `moveSubtree`'s own guard
   * (an empty `GraphChangeSet`).
   */
  commitMove: (nodeId: string, slot: InsertionSlot) => void;
  /** Centers the viewport on a node (used by the `goto` reference chip, D9). */
  centerOnNode: (nodeId: string) => void;
}

const SequentialMoveActionsContext = createContext<SequentialMoveActionsContextValue | undefined>(
  undefined
);

/** Provided by `SequentialCanvas.tsx`. */
export const SequentialMoveActionsProvider = SequentialMoveActionsContext.Provider;

/**
 * Returns the current move-actions binding, or `undefined` outside a provider
 * (isolated node/edge stories and tests render `SequentialStepNode` /
 * `SequentialConnectorEdge` standalone; both must degrade gracefully -- no
 * kebab move items, no reference-chip navigation -- rather than throw).
 */
export function useOptionalSequentialMoveActions(): SequentialMoveActionsContextValue | undefined {
  return useContext(SequentialMoveActionsContext);
}
