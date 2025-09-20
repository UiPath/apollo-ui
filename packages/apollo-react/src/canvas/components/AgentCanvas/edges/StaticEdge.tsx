import { BaseEdge, type EdgeProps, getSmoothStepPath, type Position } from "@uipath/uix/xyflow/react";

import type { AgentFlowDefaultEdge } from "../../../types";
import { EDGE_STYLES } from "../../../components/BaseCanvas/BaseCanvas.constants";
import { useAgentFlowStore } from "../store/agent-flow-store";
import { useMemo } from "react";

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

  const sourceNode = useMemo(() => nodes.find((node) => node.id === source), [nodes, source]);
  const targetNode = useMemo(() => nodes.find((node) => node.id === target), [nodes, target]);
  const isConnectedToSelectedResource = useMemo(() => {
    return (sourceNode?.type === "resource" && sourceNode?.selected) || (targetNode?.type === "resource" && targetNode?.selected);
  }, [sourceNode, targetNode]);

  const strokeColor = useMemo(() => {
    if (hasError) return "var(--color-error-icon)";
    if (isCurrentBreakpoint) return "var(--color-warning-icon)";
    if (hasSuccess) return "var(--color-success-icon)";
    if (hasRunning) return "var(--color-primary)";
    return isConnectedToSelectedResource ? "var(--color-primary)" : "var(--color-border)";
  }, [hasError, isCurrentBreakpoint, hasSuccess, hasRunning, isConnectedToSelectedResource]);

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
        strokeDasharray: "5 5",
      }}
    />
  );
};
