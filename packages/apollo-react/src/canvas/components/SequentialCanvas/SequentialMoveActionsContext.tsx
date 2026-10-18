import { createContext, useContext } from 'react';
import type { InsertionSlot } from '../../utils/sequential/sequential.types';
import type { SequentialMoveOptions } from './sequentialMoveActions';

export interface SequentialMoveActionsContextValue {
  /** The four move candidates for `nodeId`; a disabled direction is `undefined`. */
  getMoveOptions: (nodeId: string) => SequentialMoveOptions;
  /** Applies `moveSubtree` through onNodesChange / onEdgesChange; a no-op for an empty change set. */
  commitMove: (nodeId: string, slot: InsertionSlot) => void;
}

const SequentialMoveActionsContext = createContext<SequentialMoveActionsContextValue | undefined>(
  undefined
);

export const SequentialMoveActionsProvider = SequentialMoveActionsContext.Provider;

/** The move-actions binding, or `undefined` outside a provider so standalone nodes degrade gracefully. */
export function useOptionalSequentialMoveActions(): SequentialMoveActionsContextValue | undefined {
  return useContext(SequentialMoveActionsContext);
}
