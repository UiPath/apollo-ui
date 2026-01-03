import {
  BaseEdge,
  type EdgeProps,
  getSmoothStepPath,
  type Position,
} from '@uipath/apollo-react/canvas/xyflow/react';
import { useMemo } from 'react';
import { EDGE_STYLES } from '../../../components/BaseCanvas/BaseCanvas.constants';
import type { AgentFlowDefaultEdge, SuggestionType } from '../../../types';
import { useAgentFlowStore } from '../store/agent-flow-store';

type StaticEdgeProps = EdgeProps &
  AgentFlowDefaultEdge & {
    sourceX: number;
    sourceY: number;
    targetX: number;
    targetY: number;
    sourcePosition?: Position;
    targetPosition?: Position;
    hasError?: boolean;
    hasSuccess?: boolean;
    hasRunning?: boolean;
    isCurrentBreakpoint?: boolean;
    isSuggestion?: boolean;
    suggestionType?: SuggestionType;
  };

export const StaticEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  source,
  target,
  hasError = false,
  hasSuccess = false,
  hasRunning = false,
  isCurrentBreakpoint = false,
  isSuggestion = false,
  suggestionType,
}: StaticEdgeProps) => {
  const { nodes } = useAgentFlowStore();

  const sourceNode = useMemo(() => nodes.find((node) => node.id === source), [nodes, source]);
  const targetNode = useMemo(() => nodes.find((node) => node.id === target), [nodes, target]);
  const isConnectedToSelectedResource = useMemo(() => {
    return (
      (sourceNode?.type === 'resource' && sourceNode?.selected) ||
      (targetNode?.type === 'resource' && targetNode?.selected)
    );
  }, [sourceNode, targetNode]);

  const strokeColor = useMemo(() => {
    if (isSuggestion) {
      if (suggestionType === 'add') return 'var(--uix-canvas-success-icon)';
      if (suggestionType === 'update') return 'var(--uix-canvas-warning-icon)';
      if (suggestionType === 'delete') return 'var(--uix-canvas-error-icon)';
    }
    if (hasError) return 'var(--uix-canvas-error-icon)';
    if (isCurrentBreakpoint) return 'var(--uix-canvas-warning-icon)';
    if (hasSuccess) return 'var(--uix-canvas-success-icon)';
    if (hasRunning) return 'var(--uix-canvas-primary)';
    return isConnectedToSelectedResource ? 'var(--uix-canvas-primary)' : 'var(--uix-canvas-border)';
  }, [
    hasError,
    isCurrentBreakpoint,
    hasSuccess,
    hasRunning,
    isConnectedToSelectedResource,
    isSuggestion,
    suggestionType,
  ]);

  const strokeWidth = useMemo(() => {
    return isConnectedToSelectedResource ? EDGE_STYLES.selectedStrokeWidth : 2;
  }, [isConnectedToSelectedResource]);

  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 20,
  });

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      type="smoothstep"
      style={{
        stroke: strokeColor,
        strokeWidth,
        strokeDasharray: '5 5',
      }}
    />
  );
};
