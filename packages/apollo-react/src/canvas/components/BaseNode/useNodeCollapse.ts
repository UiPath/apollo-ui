import { useCallback } from "react";
import { useReactFlow, useStore } from "@uipath/uix/xyflow/react";

/**
 * Configuration for collapsible node behavior.
 * When enabled, the node can hide/show connected nodes via specified handles.
 */
export interface CollapseConfig {
  /** Whether collapse is enabled for this node */
  enabled: boolean;
  /** Handle IDs that trigger collapse (e.g., "bottom" for artifact connections) */
  handleIds: string[];
  /** Current collapsed state */
  collapsed?: boolean;
  /** Callback when collapse state changes */
  onCollapseChange?: (collapsed: boolean) => void;
}

export interface UseNodeCollapseProps {
  nodeId: string;
  collapseConfig?: CollapseConfig;
}

interface UseNodeCollapseReturn {
  /** Whether the node is currently collapsed */
  isCollapsed: boolean;
  /** Whether collapse is enabled for this node */
  isCollapseEnabled: boolean;
  /** Has connected nodes that can be collapsed */
  hasCollapsibleConnections: boolean;
  /** Expand the collapsed nodes/edges */
  expand: () => void;
  /** Collapse connected nodes/edges */
  collapse: () => void;
  /** Toggle collapse state */
  toggle: () => void;
}

/**
 * Hook to manage collapse/expand behavior for a node.
 * When collapsed, hides nodes connected via specified handles.
 */
export function useNodeCollapse({ nodeId, collapseConfig }: UseNodeCollapseProps): UseNodeCollapseReturn {
  const { setNodes, setEdges } = useReactFlow();

  const isCollapseEnabled = collapseConfig?.enabled ?? false;
  const isCollapsed = collapseConfig?.collapsed ?? false;
  const handleIds = collapseConfig?.handleIds ?? [];

  // Subscribe to edges to compute connected node IDs reactively
  const connectedNodeIds = useStore(
    (state) => {
      if (!isCollapseEnabled || handleIds.length === 0) return new Set<string>();

      const connectedIds = new Set<string>();
      state.edges.forEach((edge) => {
        if (edge.source === nodeId && handleIds.includes(edge.sourceHandle ?? "")) {
          connectedIds.add(edge.target);
        }
        if (edge.target === nodeId && handleIds.includes(edge.targetHandle ?? "")) {
          connectedIds.add(edge.source);
        }
      });
      return connectedIds;
    },
    (a, b) => a.size === b.size && [...a].every((id) => b.has(id))
  );

  const hasCollapsibleConnections = connectedNodeIds.size > 0;

  /**
   * Collapse: Hide connected nodes and their edges
   */
  const collapse = useCallback(() => {
    if (!isCollapseEnabled || connectedNodeIds.size === 0) return;

    // Hide connected nodes
    setNodes((nodes) => nodes.map((node) => (connectedNodeIds.has(node.id) ? { ...node, hidden: true } : node)));

    // Hide edges connected to the hidden nodes
    setEdges((edges) =>
      edges.map((edge) => (connectedNodeIds.has(edge.source) || connectedNodeIds.has(edge.target) ? { ...edge, hidden: true } : edge))
    );

    // Call the callback if provided
    collapseConfig?.onCollapseChange?.(true);
  }, [isCollapseEnabled, connectedNodeIds, setNodes, setEdges, collapseConfig]);

  /**
   * Expand: Show previously hidden connected nodes and their edges
   */
  const expand = useCallback(() => {
    if (!isCollapseEnabled || connectedNodeIds.size === 0) return;

    // Show connected nodes
    setNodes((nodes) => nodes.map((node) => (connectedNodeIds.has(node.id) ? { ...node, hidden: false } : node)));

    // Show edges connected to the shown nodes
    setEdges((edges) =>
      edges.map((edge) => (connectedNodeIds.has(edge.source) || connectedNodeIds.has(edge.target) ? { ...edge, hidden: false } : edge))
    );

    // Call the callback if provided
    collapseConfig?.onCollapseChange?.(false);
  }, [isCollapseEnabled, connectedNodeIds, setNodes, setEdges, collapseConfig]);

  /**
   * Toggle between collapsed and expanded states
   */
  const toggle = useCallback(() => {
    if (isCollapsed) {
      expand();
    } else {
      collapse();
    }
  }, [isCollapsed, expand, collapse]);

  return {
    isCollapsed,
    isCollapseEnabled,
    hasCollapsibleConnections,
    expand,
    collapse,
    toggle,
  };
}
