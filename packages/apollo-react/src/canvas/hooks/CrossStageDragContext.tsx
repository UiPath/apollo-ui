/**
 * CrossStageDragContext - Shared context for cross-stage drag state
 *
 * Allows StageNode to access drag state and render drop placeholders
 */

import { createContext, useContext } from 'react';
import type { CrossStageDragState } from './useCrossStageTaskDrag';

interface CrossStageDragContextValue {
  dragState: CrossStageDragState;
}

const CrossStageDragContext = createContext<CrossStageDragContextValue | null>(null);

export const CrossStageDragProvider = CrossStageDragContext.Provider;

export function useCrossStageDragState(): CrossStageDragState | null {
  const context = useContext(CrossStageDragContext);
  return context?.dragState ?? null;
}
