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
  // Deliberately NOT part of v1: a `centerOnNode` viewport-centering action for
  // goto reference chips (D9). The chip UI was cut from this PR, so the plumbing
  // was removed rather than left as an unreachable branch. Re-add it here, and in
  // useSequentialMoveActionsValue, only alongside the UI that actually calls it.
}

const SequentialMoveActionsContext = createContext<SequentialMoveActionsContextValue | undefined>(
  undefined
);

/** Provided by `SequentialCanvas.tsx`. */
export const SequentialMoveActionsProvider = SequentialMoveActionsContext.Provider;

/**
 * Returns the current move-actions binding, or `undefined` outside a provider
 * (isolated node/edge stories and tests render `SequentialStepNode` /
 * `SequentialConnectorEdge` standalone; both must degrade gracefully -- no kebab
 * move items -- rather than throw).
 */
export function useOptionalSequentialMoveActions(): SequentialMoveActionsContextValue | undefined {
  return useContext(SequentialMoveActionsContext);
}
