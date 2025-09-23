import type { ReactNode } from "react";
import type { BackgroundVariant, Edge, Node, ReactFlowInstance, ReactFlowProps } from "@uipath/uix/xyflow/react";

/**
 * Props for the BaseCanvas component that provides a foundation for flow-based visualizations.
 * Extends ReactFlow's props to provide additional canvas control and styling options.
 *
 * @template NodeType - The type of nodes used in the canvas, extends the base Node type
 * @template EdgeType - The type of edges used in the canvas, extends the base Edge type
 */
export interface BaseCanvasProps<NodeType extends Node = Node, EdgeType extends Edge = Edge> extends ReactFlowProps<NodeType, EdgeType> {
  /**
   * Determines the interaction mode of the canvas.
   * - "design": Full editing capabilities - add, remove, and modify nodes/edges
   * - "view": Navigation only - pan, zoom, and select but no modifications
   * - "readonly": No interactions - static display only
   *
   * @default "view"
   *
   * @remarks
   * The mode determines all interaction capabilities:
   * - "design": Can drag nodes, connect edges, delete elements, and navigate
   * - "view": Can only pan, zoom, and select nodes (no modifications)
   * - "readonly": Complete static view with no user interactions
   */
  mode?: "design" | "readonly" | "view";

  /**
   * React children to render inside the canvas.
   * Typically used for overlays, panels, or additional UI elements.
   * Children are rendered on top of the flow content.
   */
  children?: ReactNode;

  /**
   * Whether to display a background pattern on the canvas.
   * Can be used to enhance visual structure and orientation.
   * @default true
   */
  showBackground?: boolean;

  /**
   * Primary background color of the canvas.
   */
  backgroundColor?: string;

  /**
   * Secondary background color used for pattern elements (dots, lines, cross).
   */
  backgroundSecondaryColor?: string;

  /**
   * Type of background pattern to display.
   * Options: "dots", "lines", "cross"
   * Set to undefined for no pattern.
   */
  backgroundVariant?: BackgroundVariant;

  /**
   * Gap between background pattern elements in pixels.
   * Larger values create more spacing between dots/lines.
   * @default 20
   */
  backgroundGap?: number;

  /**
   * Size of individual background pattern elements in pixels.
   * For dots: diameter, for lines: thickness.
   * @default 1
   */
  backgroundSize?: number;

  /**
   * Optional function to perform automatic layout on initial render.
   * Called after nodes are mounted but before first user interaction.
   * Can be async for complex layout calculations.
   * @example
   * ```ts
   * initialAutoLayout: async () => {
   *   await calculateOptimalPositions();
   *   updateNodePositions();
   * }
   * ```
   */
  initialAutoLayout?: () => Promise<void> | void;

  /**
   * Array of node IDs to keep in view when the canvas resizes.
   * The canvas will automatically pan (without changing zoom) to keep these nodes visible.
   * If multiple nodes are specified, the canvas will try to keep all of them in view.
   *
   * Use cases:
   * - Responsive dashboards where key metrics should stay visible
   * - Split view layouts where important nodes need to remain in focus
   * - Mobile responsive designs that need to maintain visibility on orientation changes
   *
   * @example ['node1', 'node2'] - Maintain specific nodes
   * @example [] - Maintain all nodes in view
   * @example undefined - Disable automatic node maintenance
   *
   * @see useMaintainNodesInView hook for direct usage
   */
  maintainNodesInView?: string[];

  /**
   * Custom message to display in the pan shortcut teaching UI.
   * @default "Hold Space and drag to pan around the canvas!"
   */
  panShortcutTeachingUIMessage?: string;
}

/**
 * Configuration options for viewport manipulation methods.
 * Used to control how the canvas adjusts its view to show specific nodes.
 */
export interface EnsureNodesInViewOptions {
  /**
   * Padding around the target nodes in pixels.
   * Ensures nodes aren't positioned at the very edge of the viewport.
   */
  padding?: number;

  /**
   * Duration of the viewport transition animation in milliseconds.
   * Set to 0 for instant transitions.
   */
  duration?: number;

  /**
   * Minimum allowed zoom level when fitting nodes.
   * Prevents excessive zoom out.
   */
  minZoom?: number;

  /**
   * Maximum allowed zoom level when fitting nodes.
   * Prevents excessive zoom in.
   */
  maxZoom?: number;

  /**
   * Whether to maintain the current zoom level.
   * When true, only pans to show nodes without changing zoom.
   * When false, adjusts zoom to fit all specified nodes.
   */
  maintainZoom?: boolean;
}

/**
 * Ref interface for BaseCanvas providing imperative viewport control methods.
 * Use these methods to programmatically adjust the canvas view.
 *
 * @template NodeType - The type of nodes used in the canvas, extends the base Node type
 * @template EdgeType - The type of edges used in the canvas, extends the base Edge type
 */
export interface BaseCanvasRef<NodeType extends Node = Node, EdgeType extends Edge = Edge> {
  /**
   * Adjusts the viewport to ensure specified nodes are visible.
   * Pans and optionally zooms to fit all specified nodes in view.
   *
   * @param nodeIds - Array of node IDs to show in the viewport
   * @param options - Configuration for the viewport adjustment
   *
   * @example
   * ```ts
   * canvasRef.current?.ensureNodesInView(['node1', 'node2'], {
   *   padding: 100,
   *   duration: 500
   * });
   * ```
   */
  ensureNodesInView(nodeIds: string[], options?: EnsureNodesInViewOptions): void;

  /**
   * Adjusts the viewport to show all nodes in the canvas.
   * Useful for providing an overview or resetting the view.
   *
   * @param options - Configuration for the viewport adjustment
   *
   * @example
   * ```ts
   * canvasRef.current?.ensureAllNodesInView({ padding: 80 });
   * ```
   */
  ensureAllNodesInView(options?: EnsureNodesInViewOptions): void;

  /**
   * Centers the viewport on a specific node.
   * Maintains current zoom level by default.
   *
   * @param nodeId - ID of the node to center on
   * @param options - Configuration for the viewport adjustment
   *
   * @example
   * ```ts
   * canvasRef.current?.centerNode('targetNode', {
   *   duration: 1000,
   *   maintainZoom: true
   * });
   * ```
   */
  centerNode(nodeId: string, options?: EnsureNodesInViewOptions): void;

  /**
   * Direct access to the ReactFlow instance.
   * Provides full access to ReactFlow's API including methods like:
   * - getNodes(), getEdges()
   * - setNodes(), setEdges()
   * - getViewport(), setViewport()
   * - fitView(), zoomIn(), zoomOut()
   * - And many more...
   *
   * Note: This is undefined until the ReactFlow component is initialized.
   *
   * @example
   * ```ts
   * // Get all nodes
   * const nodes = canvasRef.current?.reactFlow?.getNodes();
   *
   * // Zoom to specific level
   * canvasRef.current?.reactFlow?.zoomTo(1.5);
   *
   * // Get current viewport
   * const viewport = canvasRef.current?.reactFlow?.getViewport();
   * ```
   */
  reactFlow: ReactFlowInstance<NodeType, EdgeType> | undefined;
}
