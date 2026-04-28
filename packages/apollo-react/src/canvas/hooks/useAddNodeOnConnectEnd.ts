import { type OnConnectEnd, useReactFlow } from '@uipath/apollo-react/canvas/xyflow/react';
import { useCallback } from 'react';
import { showPreviewGraph } from '../utils';

const EMPTY_IGNORED_NODE_TYPES: string[] = [];

function getClientPosition(event: MouseEvent | TouchEvent): { x: number; y: number } | null {
  if ('clientX' in event) {
    return { x: event.clientX, y: event.clientY };
  }

  const touch = event.changedTouches?.[0] ?? event.touches?.[0];
  return touch ? { x: touch.clientX, y: touch.clientY } : null;
}

/**
 * Use this hook to get a callback that adds a preview node when a connection ends on an empty space.
 * Uses React Flow context, so it is important that the component using this hook is a child of ReactFlowProvider.
 * @returns A callback method that can be used to handle React Flow `onConnectEnd` event.
 */
export function useAddNodeOnConnectEnd(ignoredNodeTypes: string[] = EMPTY_IGNORED_NODE_TYPES) {
  const reactFlowInstance = useReactFlow();

  return useCallback<OnConnectEnd>(
    (event, connectionState) => {
      if (
        // Check for required data.
        !(reactFlowInstance && connectionState.fromNode && connectionState.fromHandle) ||
        // Should not add preview if connecting to an existing node/handle.
        connectionState.toHandle
      ) {
        return;
      }

      const clientPosition = getClientPosition(event);
      if (!clientPosition) return;

      const flowDropPosition = reactFlowInstance.screenToFlowPosition(clientPosition);

      showPreviewGraph({
        sourceNodeId: connectionState.fromNode.id,
        sourceHandleId: connectionState.fromHandle.id ?? 'output',
        reactFlowInstance,
        position: flowDropPosition,
        sourceHandleType: connectionState.fromHandle.type,
        handlePosition: connectionState.fromHandle.position,
        ignoredNodeTypes,
      });
    },
    [reactFlowInstance, ignoredNodeTypes]
  );
}
