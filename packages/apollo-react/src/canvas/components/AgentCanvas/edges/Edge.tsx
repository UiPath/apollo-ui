import type { EdgeProps } from "@uipath/uix/xyflow/react";
import { StaticEdge } from "./StaticEdge";
import { useAgentFlowStore } from "../store/agent-flow-store";

export const Edge = (props: EdgeProps) => {
  const { nodes } = useAgentFlowStore();
  const { source, target } = props;

  const sourceNode = nodes.find((node) => node.id === source);
  const targetNode = nodes.find((node) => node.id === target);

  // Helper function to check if connected nodes have error or success status
  const getConnectedNodesStatus = () => {
    let hasError = false;
    let hasSuccess = false;
    let hasRunning = false;
    let isCurrentBreakpoint = false;

    // Check source node status
    if (sourceNode?.type === "resource") {
      hasError = hasError || (sourceNode.data?.hasError ?? false);
      hasSuccess = hasSuccess || (sourceNode.data?.hasSuccess ?? false);
      hasRunning = hasRunning || (sourceNode.data?.hasRunning ?? false);
      isCurrentBreakpoint = isCurrentBreakpoint || (sourceNode.data?.isCurrentBreakpoint ?? false);
    }

    // Check target node status
    if (targetNode?.type === "resource") {
      hasError = hasError || (targetNode.data?.hasError ?? false);
      hasSuccess = hasSuccess || (targetNode.data?.hasSuccess ?? false);
      hasRunning = hasRunning || (targetNode.data?.hasRunning ?? false);
      isCurrentBreakpoint = isCurrentBreakpoint || (targetNode.data?.isCurrentBreakpoint ?? false);
    }

    return { hasError, hasSuccess, hasRunning, isCurrentBreakpoint };
  };

  const { hasError, hasSuccess, hasRunning, isCurrentBreakpoint } = getConnectedNodesStatus();
  const staticEdgeProps = {
    ...props,
    data: { label: null },
    hasError,
    hasSuccess,
    hasRunning,
    isCurrentBreakpoint,
  };

  return <StaticEdge {...staticEdgeProps} />;
};
