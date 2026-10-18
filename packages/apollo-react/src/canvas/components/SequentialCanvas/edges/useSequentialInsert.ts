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
  /** Opens the Add Node panel for a connector's slot via the existing preview pipeline. */
  startInsert: (args: SequentialInsertArgs) => void;
  /**
   * Bound `AddNodeManager.onBeforeNodeAdded`. Closes over the slot from the latest
   * `startInsert`, which `onBeforeNodeAdded` itself never receives.
   */
  onBeforeNodeAdded: (newNode: Node, newEdges: Edge[]) => { newNode: Node; newEdges: Edge[] };
}

/**
 * Wires the ⊕ to the Add Node preview pipeline. The panel, constraint filtering,
 * materialization, and cancel-restore all stay in the unchanged AddNodeManager.
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
      // SequentialCanvas owns this state and clears it on cancel/commit.
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
