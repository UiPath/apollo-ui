import { BaseEdge, getSimpleBezierPath, type Position } from "@xyflow/react";

import type { AgentFlowDefaultEdge } from "../../../types";
import { EDGE_STYLES } from "../../../components/BaseCanvas/BaseCanvas.constants";
import { useAgentFlowStore } from "../store/agent-flow-store";

type DefaultEdgeProps = AgentFlowDefaultEdge & {
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
};

export function DefaultEdgeElement({
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
}: DefaultEdgeProps) {
  const { nodes } = useAgentFlowStore();

  const sourceNode = nodes.find((node) => node.id === source);
  const targetNode = nodes.find((node) => node.id === target);
  const isConnectedToSelectedResource =
    (sourceNode?.type === "resource" && sourceNode?.selected) || (targetNode?.type === "resource" && targetNode?.selected);

  const [edgePath] = getSimpleBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const getStrokeColor = () => {
    if (hasError) return "var(--color-error-icon)";
    if (isCurrentBreakpoint) return "var(--color-warning-icon)";
    if (hasSuccess) return "var(--color-success-icon)";
    if (hasRunning) return "var(--color-primary)";
    return isConnectedToSelectedResource ? "var(--color-primary)" : "var(--color-foreground-de-emp)";
  };

  const strokeColor = getStrokeColor();
  const strokeWidth = isConnectedToSelectedResource ? EDGE_STYLES.selectedStrokeWidth : EDGE_STYLES.strokeWidth;

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      style={{
        stroke: strokeColor,
        strokeWidth,
      }}
    />
  );
}
