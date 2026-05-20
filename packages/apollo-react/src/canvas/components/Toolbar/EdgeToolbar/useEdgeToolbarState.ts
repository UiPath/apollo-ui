import { type Position, useReactFlow } from '@uipath/apollo-react/canvas/xyflow/react';
import { useCallback, useMemo } from 'react';
import { DEFAULT_SOURCE_HANDLE_ID } from '../../../constants';
import { useCanvasNodeLayout } from '../../../hooks/useCanvasNodeLayout';
import { showPreviewGraph } from '../../../utils/createPreviewGraph';
import { isPreviewEdge } from '../../../utils/createPreviewNode';
import { useBaseCanvasMode } from '../../BaseCanvas/BaseCanvasModeProvider';
import { resolveContainerAddNodePreview } from '../../LoopNode/LoopNode.helpers';
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
  const { getManifestForNode } = useCanvasNodeLayout();
  const { mode } = useBaseCanvasMode();
  const isDesignMode = mode === 'design';

  const previewEdge = isPreviewEdge({ id: edgeId, source, target });

  // Only track mouse position when hovering and in design mode (not on preview edges)
  const { positionData, handleMouseMoveOnPath } = useEdgeToolbarPositioning({
    pathElementRef,
    isEnabled: isHovered && isDesignMode && !previewEdge,
    targetPosition,
  });

  // Handle adding a node at the current mouse position along the edge
  const handleAddNodeOnEdge = useCallback(
    (position: { x: number; y: number }) => {
      const originalEdge = reactFlow.getEdges().find((edge) => edge.id === edgeId);
      if (!originalEdge) return;

      const sourceEndpoint = {
        nodeId: source,
        handleId: sourceHandleId ?? DEFAULT_SOURCE_HANDLE_ID,
      };
      const containerOverrides = resolveContainerAddNodePreview({
        source: sourceEndpoint,
        sourceHandleType: 'source',
        reactFlowInstance: reactFlow,
        getManifestForNode,
        replacedEdge: originalEdge,
      });

      showPreviewGraph({
        source: sourceEndpoint,
        reactFlowInstance: reactFlow,
        position,
        positionMode: 'drop',
        data: { originalEdge },
        sourceHandleType: 'source', // Source handle type
        handlePosition: sourcePosition,
        ignoredNodeTypes: ignoredNodeTypes ?? [],
        target: {
          nodeId: target,
          handleId: targetHandleId,
        },
        ...(containerOverrides ?? {}),
      });
    },
    [
      sourcePosition,
      source,
      sourceHandleId,
      reactFlow,
      getManifestForNode,
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
          icon: 'plus',
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

  // Show toolbar when hovering, in design mode, have a valid mouse position, and not a preview edge
  const showToolbar = isHovered && isDesignMode && positionData !== null && !previewEdge;

  return {
    showToolbar,
    toolbarPositioning: positionData,
    config,
    handleMouseMoveOnPath,
  };
}
