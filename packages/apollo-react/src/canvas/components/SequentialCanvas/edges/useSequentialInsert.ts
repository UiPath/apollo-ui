import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { useReactFlow } from '@uipath/apollo-react/canvas/xyflow/react';
import { useCallback, useEffect, useRef } from 'react';
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
    (newNode: Node, newEdges: Edge[]) => {
      const result = sequentialOnBeforeNodeAdded(newNode, newEdges, pending.current);
      pending.current = undefined;
      return result;
    },
    [pending]
  );

  return { startInsert, onBeforeNodeAdded };
}

/**
 * Ends an insert when the Add Node preview closes, whether it was committed or cancelled:
 * calls `onClosed` and drops the shared pending slot. A commit has already consumed the slot
 * by then; a cancel has not, and a slot left behind would parent the next unrelated add
 * (e.g. through a plain flow handle) into the cancelled slot's container and stamp its
 * split-edge id.
 */
export function useEndSequentialInsertOnPreviewClose(
  isPreviewOpen: boolean,
  onClosed: () => void
): void {
  const sharedState = useOptionalSequentialInsertState();
  const wasOpenRef = useRef(false);
  const onClosedRef = useRef(onClosed);
  onClosedRef.current = onClosed;

  useEffect(() => {
    if (isPreviewOpen) {
      wasOpenRef.current = true;
      return;
    }
    if (!wasOpenRef.current) return;
    wasOpenRef.current = false;
    if (sharedState) sharedState.pending.current = undefined;
    onClosedRef.current();
  }, [isPreviewOpen, sharedState]);
}
