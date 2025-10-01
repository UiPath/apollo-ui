import { useCallback, useEffect, useRef, useState } from "react";
import { useReactFlow, useStoreApi } from "@uipath/uix/xyflow/react";
import type { Node } from "@uipath/uix/xyflow/react";
import type { EnsureNodesInViewOptions } from "./BaseCanvas.types";
import { BASE_CANVAS_DEFAULTS, FIT_VIEW_DELAY_MS } from "./BaseCanvas.constants";

const waitForNodeMeasurements = (getNodes: () => Node[]): Promise<void> => {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const timeoutInMs = 500;

    const check = () => {
      const currentNodes = getNodes();
      if (currentNodes.every((node) => node.measured)) {
        resolve();
      } else if (Date.now() - startTime > timeoutInMs) {
        resolve();
      } else {
        requestAnimationFrame(check);
      }
    };
    check();
  });
};

export const useAutoLayout = (
  nodes: Node[] | undefined,
  initialAutoLayout?: () => Promise<void> | void,
  fitViewOptions?: { padding?: number; duration?: number; minZoom?: number; maxZoom?: number }
) => {
  const [isReady, setIsReady] = useState(false);
  const hasRunLayout = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reactFlow = useReactFlow();

  // Track the nodes array to detect when it's a completely new set of nodes
  const nodesRef = useRef<Node[] | undefined>([]);
  const prevNodeIds = useRef<string>("");

  // Check if this is a new set of nodes (different IDs)
  const currentNodeIds =
    nodes
      ?.map((n) => n.id)
      .sort()
      .join(",") ?? "";
  const isNewNodeSet = currentNodeIds !== prevNodeIds.current && currentNodeIds?.length > 0;

  if (isNewNodeSet) {
    hasRunLayout.current = false;
    prevNodeIds.current = currentNodeIds;
  }

  nodesRef.current = nodes;

  useEffect(() => {
    // No layout needed
    if (!initialAutoLayout) {
      setIsReady(true);
      return;
    }

    // Already ran layout for this node set
    if (hasRunLayout.current && !isNewNodeSet) {
      return;
    }

    // No nodes yet, wait for them
    if (nodes?.length === 0) {
      return;
    }

    const runLayout = async () => {
      try {
        // Wait for nodes to be measured - pass a function to get fresh nodes
        await waitForNodeMeasurements(() => reactFlow.getNodes());
        // Run consumer's layout algorithm
        await initialAutoLayout();

        // Mark as complete
        hasRunLayout.current = true;

        // Fit view with custom options if provided
        timeoutRef.current = setTimeout(() => {
          const options = fitViewOptions || BASE_CANVAS_DEFAULTS.fitViewOptions;
          reactFlow.fitView(options);
          setIsReady(true);
          timeoutRef.current = null;
        }, FIT_VIEW_DELAY_MS);
      } catch {
        // Silent fail - just mark as ready so the component doesn't hang
        setIsReady(true);
      }
    };

    runLayout();

    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [nodes?.length, reactFlow, initialAutoLayout, isNewNodeSet]);

  return { isReady };
};

export const useFitView = (nodes?: Node[], delay?: number) => {
  const reactFlow = useReactFlow();
  const currentViewport = reactFlow.getViewport();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  const fitView = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      reactFlow.fitView({
        ...BASE_CANVAS_DEFAULTS.fitViewOptions,
        minZoom: currentViewport.zoom, // Maintain current zoom level
        maxZoom: currentViewport.zoom, // Maintain current zoom level
        nodes: nodes && nodes.length > 0 ? nodes : undefined, // Fit view only if there are nodes
      });
      timeoutRef.current = null;
    }, delay ?? 0);
  }, [reactFlow, currentViewport, nodes, delay]);

  return { fitView };
};

export const useEnsureNodesInView = () => {
  const reactFlow = useReactFlow();

  const ensureNodesInView = useCallback(
    (nodeIds: string[], options?: EnsureNodesInViewOptions) => {
      const nodes = reactFlow.getNodes().filter((node) => nodeIds.includes(node.id));

      if (nodes.length === 0) {
        return;
      }

      const fitViewOptions = {
        ...BASE_CANVAS_DEFAULTS.fitViewOptions,
        nodes,
        padding: options?.padding ?? BASE_CANVAS_DEFAULTS.fitViewOptions.padding,
        duration: options?.duration ?? BASE_CANVAS_DEFAULTS.fitViewOptions.duration,
        minZoom: options?.minZoom ?? BASE_CANVAS_DEFAULTS.zoom.min,
        maxZoom: options?.maxZoom ?? BASE_CANVAS_DEFAULTS.zoom.max,
      };

      if (options?.maintainZoom) {
        const currentZoom = reactFlow.getViewport().zoom;
        fitViewOptions.minZoom = currentZoom;
        fitViewOptions.maxZoom = currentZoom;
      }

      reactFlow.fitView(fitViewOptions);
    },
    [reactFlow]
  );

  const ensureAllNodesInView = useCallback(
    (options?: EnsureNodesInViewOptions) => {
      const fitViewOptions = {
        ...BASE_CANVAS_DEFAULTS.fitViewOptions,
        padding: options?.padding ?? BASE_CANVAS_DEFAULTS.fitViewOptions.padding,
        duration: options?.duration ?? BASE_CANVAS_DEFAULTS.fitViewOptions.duration,
        minZoom: options?.minZoom ?? BASE_CANVAS_DEFAULTS.zoom.min,
        maxZoom: options?.maxZoom ?? BASE_CANVAS_DEFAULTS.zoom.max,
      };

      if (options?.maintainZoom) {
        const currentZoom = reactFlow.getViewport().zoom;
        fitViewOptions.minZoom = currentZoom;
        fitViewOptions.maxZoom = currentZoom;
      }

      reactFlow.fitView(fitViewOptions);
    },
    [reactFlow]
  );

  const centerNode = useCallback(
    (nodeId: string, options?: EnsureNodesInViewOptions) => {
      const node = reactFlow.getInternalNode(nodeId);

      if (!node) {
        return;
      }

      // Use node dimensions if available, otherwise use defaults
      const nodeWidth = node.measured?.width ?? node.width;
      const nodeHeight = node.measured?.height ?? node.height;

      if (!nodeWidth || !nodeHeight) {
        return;
      }

      const x = node.position.x + nodeWidth / 2;
      const y = node.position.y + nodeHeight / 2;
      const zoom = options?.maintainZoom ? reactFlow.getViewport().zoom : 1;

      reactFlow.setCenter(x, y, {
        zoom,
        duration: options?.duration ?? BASE_CANVAS_DEFAULTS.fitViewOptions.duration,
      });
    },
    [reactFlow]
  );

  return {
    ensureNodesInView,
    ensureAllNodesInView,
    centerNode,
  };
};

/**
 * Hook to maintain specified nodes in view when the canvas resizes.
 *
 * This hook automatically adjusts the viewport to keep certain nodes visible when the canvas
 * container changes size. It's particularly useful for responsive layouts where important
 * nodes should remain visible as the user resizes their browser or when the canvas is in
 * a resizable container.
 *
 * @param nodeIds - Array of node IDs to maintain in view.
 *                  - undefined: Disables the feature completely
 *                  - []: Empty array maintains all nodes in view
 *                  - ['id1', 'id2']: Maintains specific nodes in view
 *
 * @remarks
 * - The hook uses ResizeObserver to detect container size changes
 * - Viewport adjustments are debounced (50ms default) to improve performance
 * - The current zoom level is preserved - only panning occurs
 * - Pass undefined to disable the feature, empty array to maintain all nodes
 * - Must be used within a ReactFlow component context
 *
 * @example
 * ```tsx
 * // Keep specific nodes in view
 * useMaintainNodesInView(['important-node-1', 'important-node-2']);
 *
 * // Keep all nodes in view
 * useMaintainNodesInView([]);
 *
 * // Conditionally maintain nodes (disabled when undefined)
 * const importantNodes = isDetailView ? ['detail-1', 'detail-2'] : undefined;
 * useMaintainNodesInView(importantNodes);
 * ```
 *
 * @see {@link BaseCanvasProps.maintainNodesInView} for the component prop that uses this hook
 */
export const useMaintainNodesInView = (nodeIds?: string[]) => {
  const flowStoreApi = useStoreApi();
  const reactFlowInstance = useReactFlow();
  const resizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Store nodeIds in a ref to avoid re-running the resize observer when nodeIds change
  // This ensures the hook only responds to actual resize events, not prop changes
  const nodeIdsRef = useRef<string[] | undefined>(nodeIds);

  // Update the ref whenever nodeIds changes
  // This pattern allows us to use the latest nodeIds without re-establishing the ResizeObserver
  useEffect(() => {
    nodeIdsRef.current = nodeIds;
  }, [nodeIds]);

  useEffect(() => {
    const reactFlowContainer = flowStoreApi.getState().domNode;
    if (!reactFlowContainer) {
      return;
    }

    const handleResize = () => {
      const currentNodeIds = nodeIdsRef.current;

      // If nodeIds is undefined, the feature is disabled
      if (currentNodeIds === undefined) {
        return;
      }

      // If empty array is provided, maintain ALL nodes in view
      let nodesToMaintain = currentNodeIds;
      if (currentNodeIds.length === 0) {
        nodesToMaintain = reactFlowInstance.getNodes().map((node) => node.id);
      }

      // Clear any existing timeout to debounce rapid resize events
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }

      // Debounce the resize handling to avoid excessive viewport updates
      resizeTimeoutRef.current = setTimeout(() => {
        if (nodesToMaintain.length === 0) {
          return;
        }

        // Get current zoom level to maintain it - we only want to pan, not zoom
        const currentZoom = reactFlowInstance.getViewport().zoom;

        // Use fitView with min/max zoom locked to current zoom
        // This ensures only panning occurs to keep nodes in view
        reactFlowInstance.fitView({
          nodes: nodesToMaintain.map((id) => ({ id })),
          padding: BASE_CANVAS_DEFAULTS.fitViewOptions.padding,
          duration: BASE_CANVAS_DEFAULTS.fitViewOptions.duration,
          minZoom: currentZoom,
          maxZoom: currentZoom,
        });
      }, BASE_CANVAS_DEFAULTS.maintainNodesInView.debounceMs);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(reactFlowContainer);

    return () => {
      resizeObserver.disconnect();
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [flowStoreApi, reactFlowInstance]); // Only depend on flowStoreApi and reactFlowInstance
};
