import { AnimatedEdge } from "./AnimatedEdge";
import { StaticEdge } from "./StaticEdge";
import { useAgentFlowStore } from "../store/agent-flow-store";

export const Edge = (props: any) => {
  const { nodes, props: storeProps } = useAgentFlowStore();
  const { source, target, data } = props;
  const mode = storeProps?.mode || "view"; // Default to "view" if storeProps is undefined

  const sourceNode = nodes.find((node) => node.id === source);
  const targetNode = nodes.find((node) => node.id === target);

  // Check if this is an edge FROM agent node TO a selected resource node
  const isAgentToSelectedResource = sourceNode?.type === "agent" && targetNode?.type === "resource" && Boolean(targetNode?.selected);

  // Check if this is an edge FROM a selected resource node TO agent node (for model edges)
  const isSelectedResourceToAgent = sourceNode?.type === "resource" && targetNode?.type === "agent" && Boolean(sourceNode?.selected);

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

  // Only use animated edges in view mode, not in design mode
  if (mode === "view") {
    if (isAgentToSelectedResource) {
      return (
        <AnimatedEdge
          {...props}
          hasError={hasError}
          hasSuccess={hasSuccess}
          hasRunning={hasRunning}
          isCurrentBreakpoint={isCurrentBreakpoint}
        />
      );
    }

    if (isSelectedResourceToAgent) {
      return (
        <AnimatedEdge
          {...props}
          reverseDirection={true}
          hasError={hasError}
          hasSuccess={hasSuccess}
          hasRunning={hasRunning}
          isCurrentBreakpoint={isCurrentBreakpoint}
        />
      );
    }
  }

  // For StaticEdge, we need to ensure the data has the required label property
  const edgeData = data ?? {};
  const staticEdgeProps = {
    ...props,
    data: { ...edgeData },
    hasError,
    hasSuccess,
    hasRunning,
    isCurrentBreakpoint,
  };

  return <StaticEdge {...staticEdgeProps} />;
};
