import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { useReactFlow } from '@uipath/apollo-react/canvas/xyflow/react';
import { useCallback, useRef } from 'react';
import {
  applyPreviewGraphToReactFlow,
  createPreviewGraph,
  showPreviewGraph,
} from '../../../utils/createPreviewGraph';
import { useSetSequentialInsertGapSlot } from '../SequentialInsertGapContext';
import { useOptionalSequentialInsertState } from '../SequentialInsertStateContext';
import {
  buildSequentialPreviewOptions,
  isUnconnectedSlot,
  resolvePendingSequentialInsert,
  type SequentialInsertArgs,
  type SequentialOnBeforeNodeAddedOptions,
  sequentialOnBeforeNodeAdded,
} from './sequentialInsert';

export interface UseSequentialInsertResult {
  /** Opens the Add Node panel for a connector's slot via the existing preview pipeline. */
  startInsert: (args: SequentialInsertArgs) => void;
  /**
   * Bound `AddNodeManager.onBeforeNodeAdded`. Closes over the slot from the latest
   * `startInsert`, which `onBeforeNodeAdded` itself never receives. With no pending slot the
   * add did not come from a sequence insert (an ordinary flow-view add on a canvas that also
   * shows a sequenced container): it is returned untouched with `sequenceInsert: false`.
   */
  onBeforeNodeAdded: (
    newNode: Node,
    newEdges: Edge[],
    options?: SequentialOnBeforeNodeAddedOptions
  ) => { newNode: Node; newEdges: Edge[]; sequenceInsert: boolean };
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
      const options = buildSequentialPreviewOptions(reactFlowInstance, args);
      if (!isUnconnectedSlot(args.slot)) {
        showPreviewGraph(options);
        return;
      }
      // The pipeline always builds an edge from the anchor; an unconnected insert drops it.
      const preview = createPreviewGraph(options);
      if (preview)
        applyPreviewGraphToReactFlow({ node: preview.node, edges: [] }, reactFlowInstance);
    },
    [reactFlowInstance, setInsertGapSlot, pending]
  );

  const onBeforeNodeAdded = useCallback(
    (newNode: Node, newEdges: Edge[], options?: SequentialOnBeforeNodeAddedOptions) => {
      const slot = pending.current;
      if (!slot) return { newNode, newEdges, sequenceInsert: false };
      pending.current = undefined;
      return {
        ...sequentialOnBeforeNodeAdded(newNode, newEdges, slot, options),
        sequenceInsert: true,
      };
    },
    [pending]
  );

  return { startInsert, onBeforeNodeAdded };
}
