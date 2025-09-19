import { BaseEdge, getSmoothStepPath, type Position } from "@uipath/uix-xyflow/react";
import type { EdgeBase } from "@uipath/uix-xyflow/system";
import { EDGE_STYLES } from "../../../components/BaseCanvas/BaseCanvas.constants";
import { useAgentFlowStore } from "../store/agent-flow-store";

export type AnimatedEdgeProps = EdgeBase & {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition?: Position;
  targetPosition?: Position;
  reverseDirection?: boolean;
  hasError?: boolean;
  hasSuccess?: boolean;
  hasRunning?: boolean;
  isCurrentBreakpoint?: boolean;
};

export const AnimatedEdge = ({
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
}: AnimatedEdgeProps) => {
  const { nodes } = useAgentFlowStore();

  const sourceNode = nodes.find((node) => node.id === source);
  const targetNode = nodes.find((node) => node.id === target);
  const isConnectedToSelectedNode = sourceNode?.selected || targetNode?.selected;

  // Determine which node is the agent and which is the resource
  const isSourceAgent = sourceNode?.type === "agent";
  const isTargetAgent = targetNode?.type === "agent";

  // If source is agent, use normal direction; if target is agent, reverse the path
  const shouldReversePath = isTargetAgent && !isSourceAgent;

  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 20,
  });

  // Create the animation path - reverse if needed to always go from agent to resource
  const animationPath = shouldReversePath
    ? getSmoothStepPath({
        sourceX: targetX,
        sourceY: targetY,
        sourcePosition: targetPosition,
        targetX: sourceX,
        targetY: sourceY,
        targetPosition: sourcePosition,
        borderRadius: 20,
      })[0]
    : edgePath;

  const getStrokeColor = () => {
    if (hasError) return "var(--color-error-icon)";
    if (isCurrentBreakpoint) return "var(--color-warning-icon)";
    if (hasSuccess) return "var(--color-success-icon)";
    if (hasRunning) return "var(--color-primary)";
    return isConnectedToSelectedNode ? "var(--color-primary)" : "var(--color-border)";
  };

  const getCircleFill = () => {
    if (hasError) return "var(--color-error-icon)";
    if (isCurrentBreakpoint) return "var(--color-warning-icon)";
    if (hasSuccess) return "var(--color-success-icon)";
    if (hasRunning) return "var(--color-primary)";
    return "var(--color-selection-indicator)";
  };

  const strokeColor = getStrokeColor();
  const strokeWidth = isConnectedToSelectedNode
    ? EDGE_STYLES.selectedStrokeWidth
    : // : EDGE_STYLES.strokeWidth;
      2;

  const circleFill = getCircleFill();

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        type="smoothstep"
        style={{
          stroke: strokeColor,
          strokeWidth,
        }}
      />
      {/* Animated circle that always flows from agent to resource */}
      <defs>
        <path id={`edge-path-${id}`} d={animationPath} />
      </defs>
      <circle r="4" fill={circleFill} opacity="0.8">
        <animateMotion dur="2s" repeatCount="indefinite" calcMode="linear">
          <mpath href={`#edge-path-${id}`} />
        </animateMotion>
      </circle>
    </>
  );
};
