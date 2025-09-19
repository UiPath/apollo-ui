import { BaseEdge, getSmoothStepPath, type Position } from "@uipath/uix/xyflow/react";

import type { AgentFlowDefaultEdge } from "../../../types";
import { EDGE_STYLES } from "../../../components/BaseCanvas/BaseCanvas.constants";
import { useAgentFlowStore } from "../store/agent-flow-store";

type StaticEdgeProps = AgentFlowDefaultEdge & {
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
}: StaticEdgeProps) => {
  const { nodes } = useAgentFlowStore();

  const sourceNode = nodes.find((node) => node.id === source);
  const targetNode = nodes.find((node) => node.id === target);
  const isConnectedToSelectedResource =
    (sourceNode?.type === "resource" && sourceNode?.selected) || (targetNode?.type === "resource" && targetNode?.selected);

  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 20,
  });

  const getStrokeColor = () => {
    if (hasError) return "var(--color-error-icon)";
    if (isCurrentBreakpoint) return "var(--color-warning-icon)";
    if (hasSuccess) return "var(--color-success-icon)";
    if (hasRunning) return "var(--color-primary)";
    return isConnectedToSelectedResource ? "var(--color-primary)" : "var(--color-border)";
  };

  const strokeColor = getStrokeColor();
  const strokeWidth = isConnectedToSelectedResource
    ? EDGE_STYLES.selectedStrokeWidth
    : // : EDGE_STYLES.strokeWidth;
      2;

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      type="smoothstep"
      style={{
        stroke: strokeColor,
        strokeWidth,
        strokeDasharray: "5 5",
      }}
    />
  );
};
