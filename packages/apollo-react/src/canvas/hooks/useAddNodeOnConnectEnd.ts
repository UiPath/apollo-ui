import { type OnConnectEnd, useReactFlow } from "@uipath/uix/xyflow/react";
import { useCallback } from "react";
import { applyPreviewToReactFlow, createPreviewNode } from "../utils";

/**
 * Use this hook to get a callback that adds a preview node when a connection ends on an empty space.
 * Uses React Flow context, so it is important that the component using this hook is a child of ReactFlowProvider.
 * @returns A callback method that can be used to handle React Flow `onConnectEnd` event.
 */
export function useAddNodeOnConnectEnd() {
  const reactFlowInstance = useReactFlow();

  return useCallback<OnConnectEnd>(
    (_event, connectionState) => {
      if (
        // Check for required data.
        !(reactFlowInstance && connectionState.fromNode && connectionState.fromHandle && connectionState.to) ||
        // Should not add preview if connecting to an existing node/handle.
        connectionState.toHandle
      ) {
        return;
      }

      const flowDropPosition = reactFlowInstance.screenToFlowPosition(connectionState.to);
      const preview = createPreviewNode(
        connectionState.fromNode.id,
        connectionState.fromHandle.id ?? "output",
        reactFlowInstance,
        flowDropPosition,
        undefined,
        connectionState.fromHandle.type
      );
      if (preview) {
        applyPreviewToReactFlow(preview, reactFlowInstance);
      }
    },
    [reactFlowInstance]
  );
}
