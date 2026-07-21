import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { useReactFlow } from '@uipath/apollo-react/canvas/xyflow/react';
import { useCallback, useRef } from 'react';
import { showPreviewGraph } from '../../../utils/createPreviewGraph';
import { useSetSequentialInsertGapSlot } from '../SequentialInsertGapContext';
import { useOptionalSequentialInsertState } from '../SequentialInsertStateContext';
import {
  buildSequentialPreviewOptions,
  resolvePendingSequentialInsert,
  type SequentialInsertArgs,
  sequentialOnBeforeNodeAdded,
} from './sequentialInsert';

export interface UseSequentialInsertResult {
  /**
   * Opens the Add Node panel for a connector's insertion slot by riding the
   * existing preview pipeline (D5). Call this from the ⊕ button's click handler.
   */
  startInsert: (args: SequentialInsertArgs) => void;
  /**
   * Bound `AddNodeManager.onBeforeNodeAdded` adapter. Closes over the slot
   * captured by the most recent `startInsert` call so materialization can
   * apply the slot's canonical handle ids / containment (D5) — `onBeforeNodeAdded`
   * itself only receives the new node and edges, not the slot that started the
   * insert, so this hook is the side channel between the two.
   */
  onBeforeNodeAdded: (newNode: Node, newEdges: Edge[]) => { newNode: Node; newEdges: Edge[] };
}

/**
 * Wires the ⊕ insert affordance to the existing Add Node preview pipeline. It
 * only kicks off the preview; the panel, constraint filtering, materialization,
 * and cancel-restore all run through the unchanged AddNodeManager (which the
 * assembly mounts as a child of the canvas with `onBeforeNodeAdded` from this hook and
 * `ignoredNodeTypes` from ./sequentialInsert).
 */
export function useSequentialInsert(): UseSequentialInsertResult {
  const reactFlowInstance = useReactFlow();
  const setInsertGapSlot = useSetSequentialInsertGapSlot();
  const localPending = useRef<ReturnType<typeof resolvePendingSequentialInsert> | undefined>(
    undefined
  );
  const sharedState = useOptionalSequentialInsertState();
  const pending = sharedState?.pending ?? localPending;

  const startInsert = useCallback(
    (args: SequentialInsertArgs) => {
      pending.current = resolvePendingSequentialInsert(args.slot);
      // Surfaces the active slot for the insert-preview-gap post-pass:
      // SequentialCanvas.tsx owns the state and clears it again
      // on cancel/commit (usePreviewNode transitioning closed).
      setInsertGapSlot(args.slot);
      showPreviewGraph(buildSequentialPreviewOptions(reactFlowInstance, args));
    },
    [reactFlowInstance, setInsertGapSlot, pending]
  );

  const onBeforeNodeAdded = useCallback(
    (newNode: Node, newEdges: Edge[]) => {
      const result = sequentialOnBeforeNodeAdded(newNode, newEdges, pending.current);
      pending.current = undefined;
      return result;
    },
    [pending]
  );

  return { startInsert, onBeforeNodeAdded };
}
