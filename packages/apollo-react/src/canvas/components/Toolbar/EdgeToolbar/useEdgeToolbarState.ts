import { type Edge, type Position, useReactFlow } from '@uipath/apollo-react/canvas/xyflow/react';
import { useCallback, useMemo } from 'react';
import { DEFAULT_SOURCE_HANDLE_ID } from '../../../constants';
import { useCanvasNodeLayout } from '../../../hooks/useCanvasNodeLayout';
import { showPreviewGraph } from '../../../utils/createPreviewGraph';
import { isPreviewEdge } from '../../../utils/createPreviewNode';
import { useBaseCanvasMode } from '../../BaseCanvas/BaseCanvasModeProvider';
import {
  useIsConnectionReadOnly,
  useReadOnlyConnectionCheck,
} from '../../BaseCanvas/ReadOnlyNodesContext';
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

type EdgeConnection = Pick<Edge, 'source' | 'sourceHandle' | 'target' | 'targetHandle'>;

function hasSameConnection(edge: Edge | undefined, expected: EdgeConnection): edge is Edge {
  if (!edge) {
    return false;
  }

  return (
    edge.source === expected.source &&
    edge.target === expected.target &&
    (edge.sourceHandle ?? null) === (expected.sourceHandle ?? null) &&
    (edge.targetHandle ?? null) === (expected.targetHandle ?? null)
  );
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
  const isFrozenConnection = useIsConnectionReadOnly(source, target);
  const isConnectionReadOnlyNow = useReadOnlyConnectionCheck();

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
      if (
        !hasSameConnection(originalEdge, {
          source,
          sourceHandle: sourceHandleId,
          target,
          targetHandle: targetHandleId,
        }) ||
        isConnectionReadOnlyNow(originalEdge.source, originalEdge.target)
      ) {
        return;
      }

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

      showPreviewGraph(
        {
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
        },
        {
          canApply: (edges) => {
            const currentEdge = edges.find((edge) => edge.id === edgeId);
            return (
              hasSameConnection(currentEdge, originalEdge) &&
              !isConnectionReadOnlyNow(currentEdge.source, currentEdge.target)
            );
          },
        }
      );
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
      isConnectionReadOnlyNow,
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

  // Show toolbar when hovering, in design mode, have a valid mouse position, and not a preview edge.
  // Frozen connections hide it: its only action splices a node into the edge.
  const showToolbar =
    isHovered && isDesignMode && positionData !== null && !previewEdge && !isFrozenConnection;

  return {
    showToolbar,
    toolbarPositioning: positionData,
    config,
    handleMouseMoveOnPath,
  };
}
