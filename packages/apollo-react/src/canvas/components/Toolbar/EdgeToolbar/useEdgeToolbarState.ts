import { type Edge, type Position, useReactFlow } from '@uipath/apollo-react/canvas/xyflow/react';
import { useCallback, useMemo } from 'react';
import { PREVIEW_NODE_ID } from '../../../constants';
import { applyPreviewToReactFlow, createPreviewNode } from '../../../utils/createPreviewNode';
import { useBaseCanvasMode } from '../../BaseCanvas/BaseCanvasModeProvider';
import type { EdgeToolbarConfig, EdgeToolbarPositionData } from './EdgeToolbar.types';
import { useEdgeToolbarPositioning } from './useEdgeToolbarPositioning';

export interface UseEdgeToolbarStateProps {
  edgeId: string;
  pathElementRef: React.MutableRefObject<SVGPathElement | null>;
  isHovered: boolean;
  source: string;
  target: string;
  sourceHandleId?: string | null;
  targetHandleId?: string | null;
  sourcePosition: Position;
  targetPosition: Position;
  ignoredNodeTypes?: string[];
}

export interface EdgeToolbarState {
  showToolbar: boolean;
  toolbarPositioning: EdgeToolbarPositionData | null;
  config: EdgeToolbarConfig;
  handleMouseMoveOnPath?: (event: React.MouseEvent) => void;
}

export function useEdgeToolbarState({
  edgeId,
  pathElementRef,
  isHovered,
  source,
  target,
  sourceHandleId,
  targetHandleId,
  sourcePosition,
  targetPosition,
  ignoredNodeTypes,
}: UseEdgeToolbarStateProps): EdgeToolbarState {
  const reactFlow = useReactFlow();
  const { mode } = useBaseCanvasMode();
  const isDesignMode = mode === 'design';

  // Only track mouse position when hovering and in design mode
  const { positionData, handleMouseMoveOnPath } = useEdgeToolbarPositioning({
    pathElementRef,
    isEnabled: isHovered && isDesignMode,
    targetPosition,
  });

  // Handle adding a node at the current mouse position along the edge
  const handleAddNodeOnEdge = useCallback(
    (position: { x: number; y: number }) => {
      // Store original edge to restore if preview is cancelled
      const originalEdge: Edge = {
        id: edgeId,
        source,
        sourceHandle: sourceHandleId,
        target,
        targetHandle: targetHandleId,
        type: 'default',
      };

      // Use createPreviewNode utility to create preview node with proper positioning
      const preview = createPreviewNode(
        source,
        sourceHandleId || 'output',
        reactFlow,
        position, // Drop position at mouse cursor
        { originalEdge }, // Pass original edge to restore if cancelled
        'source', // Source handle type
        undefined, // Use default node size
        sourcePosition,
        ignoredNodeTypes
      );

      if (!preview) return;

      // Create second edge from preview to target
      const secondEdge: Edge = {
        id: `${PREVIEW_NODE_ID}-${target}`,
        source: PREVIEW_NODE_ID,
        sourceHandle: 'output',
        target,
        targetHandle: targetHandleId,
        type: 'default',
      };

      // Apply preview (adds preview node and first edge: source → preview)
      applyPreviewToReactFlow(preview, reactFlow);

      // Remove original edge and add second edge (preview → target)
      reactFlow.setEdges((edges) => [
        ...edges.filter((e) => e.id !== edgeId).map((e) => ({ ...e, selected: false })),
        secondEdge,
      ]);
    },
    [
      sourcePosition,
      source,
      sourceHandleId,
      reactFlow,
      target,
      targetHandleId,
      edgeId,
      ignoredNodeTypes,
    ]
  );

  // Define toolbar actions
  const config: EdgeToolbarConfig = useMemo(
    () => ({
      actions: [
        {
          id: 'add-node',
          icon: 'add',
          label: 'Add node',
          disabled: false,
          onAction: (_edgeId: string, position: { x: number; y: number }) => {
            handleAddNodeOnEdge(position);
          },
        },
      ],
    }),
    [handleAddNodeOnEdge]
  );

  // Show toolbar when hovering, in design mode, and have a valid mouse position
  const showToolbar = isHovered && isDesignMode && positionData !== null;

  return {
    showToolbar,
    toolbarPositioning: positionData,
    config,
    handleMouseMoveOnPath,
  };
}
