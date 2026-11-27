import { useStoreApi } from '@uipath/apollo-react/canvas/xyflow/react';
import { useMemo } from 'react';
import type { ToolbarSelection } from '../utils/toolbar-resolver';

/** The canvas selection, as a node's toolbar reads and changes it. */
export function useToolbarSelection(): ToolbarSelection {
  const flowStore = useStoreApi();
  return useMemo(
    () => ({
      selectedNodeIds: () =>
        flowStore
          .getState()
          .nodes.filter((node) => node.selected)
          .map((node) => node.id),
      selectOnly: (nodeId) => {
        const { unselectNodesAndEdges, addSelectedNodes } = flowStore.getState();
        // Cleared first: while the multi-selection key is held, `addSelectedNodes` adds to the selection.
        unselectNodesAndEdges();
        addSelectedNodes([nodeId]);
      },
    }),
    [flowStore]
  );
}
