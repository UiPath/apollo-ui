import { forwardRef, memo, useCallback, useImperativeHandle, useMemo, useState } from "react";
import type { Edge, Node, ReactFlowInstance } from "@uipath/uix/xyflow/react";
import { ConnectionMode, ReactFlow } from "@uipath/uix/xyflow/react";
import { BASE_CANVAS_DEFAULTS } from "./BaseCanvas.constants";
import { useAutoLayout, useEnsureNodesInView, useMaintainNodesInView } from "./BaseCanvas.hooks";
import type { BaseCanvasProps, BaseCanvasRef } from "./BaseCanvas.types";
import { usePreventBackNavigation } from "./usePreventBackNavigation";
import { CanvasBackground } from "./CanvasBackground";
import { PanShortcutTeachingUI } from "./PanShortcutTeachingUI";

const BaseCanvasInnerComponent = <NodeType extends Node = Node, EdgeType extends Edge = Edge>(
  props: BaseCanvasProps<NodeType, EdgeType> & { innerRef?: React.Ref<BaseCanvasRef<NodeType, EdgeType>> }
) => {
  const { innerRef, ...canvasProps } = props;

  const {
    // Core props
    nodes = [],
    edges = [],
    nodeTypes,
    edgeTypes,
    children,

    // Behavior
    mode = "view",

    // Styling
    showBackground = true,
    backgroundColor = BASE_CANVAS_DEFAULTS.background.color,
    backgroundSecondaryColor = BASE_CANVAS_DEFAULTS.background.bgColor,
    backgroundVariant = BASE_CANVAS_DEFAULTS.background.variant,
    backgroundGap = BASE_CANVAS_DEFAULTS.background.gap,
    backgroundSize = BASE_CANVAS_DEFAULTS.background.size,

    // Configuration
    minZoom = BASE_CANVAS_DEFAULTS.zoom.min,
    maxZoom = BASE_CANVAS_DEFAULTS.zoom.max,
    defaultViewport = BASE_CANVAS_DEFAULTS.defaultViewport,
    fitViewOptions = BASE_CANVAS_DEFAULTS.fitViewOptions,
    defaultEdgeOptions = BASE_CANVAS_DEFAULTS.edge,

    // Event handlers
    onNodesChange,
    onEdgesChange,
    onConnect,
    onConnectStart,
    onConnectEnd,
    onNodeClick,
    onNodeDragStart,
    onNodeDrag,
    onNodeDragStop,
    onPaneClick,
    onInit,
    onSelectionChange,

    // Additional ReactFlow props
    proOptions = BASE_CANVAS_DEFAULTS.pro,
    connectionMode = ConnectionMode.Loose,
    connectionLineComponent,
    connectionLineStyle,
    deleteKeyCode = null,
    selectNodesOnDrag = true,
    nodesDraggable = true,
    nodesConnectable = true,
    elementsSelectable = true,
    onlyRenderVisibleElements = true,
    snapToGrid = BASE_CANVAS_DEFAULTS.snapToGrid,
    snapGrid = BASE_CANVAS_DEFAULTS.snapGrid,

    // Layout
    initialAutoLayout,
    maintainNodesInView,

    // Pan Shortcut Teaching UI
    panShortcutTeachingUIMessage = "Hold Space and drag to pan around the canvas!",

    // Remaining ReactFlow props
    ...reactFlowProps
  } = canvasProps;

  // Derive interactivity from mode
  const isInteractive = mode !== "readonly";
  const isDesignMode = mode === "design";

  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance<NodeType, EdgeType>>();

  const { isReady } = useAutoLayout(nodes, initialAutoLayout);
  const { ensureNodesInView, ensureAllNodesInView, centerNode } = useEnsureNodesInView();

  // Prevent browser back navigation on touch gestures
  usePreventBackNavigation();

  // Maintain specified nodes in view when canvas resizes
  // This ensures important nodes remain visible in responsive layouts
  // The hook only pans the viewport without changing the zoom level
  useMaintainNodesInView(maintainNodesInView);

  // Give precedence to edges connected to selected nodes in cases of overlapping edges
  const normalizedEdges = useMemo(
    () =>
      edges.map((edge) => {
        const isConnectedToSelectedNode = nodes.some((node) => node.selected && (node.id === edge.source || node.id === edge.target));
        return {
          ...edge,
          zIndex: isConnectedToSelectedNode ? 0 : -1,
        };
      }),
    [edges, nodes]
  );

  const handleInit = useCallback(
    (instance: ReactFlowInstance<NodeType, EdgeType>) => {
      setReactFlowInstance(instance);
      onInit?.(instance);
    },
    [onInit]
  );

  useImperativeHandle(
    innerRef as React.Ref<BaseCanvasRef<NodeType, EdgeType>>,
    () => ({
      ensureNodesInView,
      ensureAllNodesInView,
      centerNode,
      reactFlow: reactFlowInstance,
    }),
    [ensureNodesInView, ensureAllNodesInView, centerNode, reactFlowInstance]
  );

  return (
    <ReactFlow
      {...reactFlowProps}
      nodes={nodes}
      edges={normalizedEdges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      fitViewOptions={fitViewOptions}
      defaultEdgeOptions={defaultEdgeOptions}
      defaultViewport={defaultViewport}
      proOptions={proOptions}
      connectionMode={connectionMode}
      connectionLineComponent={connectionLineComponent}
      connectionLineStyle={connectionLineStyle}
      deleteKeyCode={isDesignMode ? deleteKeyCode : null}
      selectNodesOnDrag={isInteractive && selectNodesOnDrag}
      nodesDraggable={isDesignMode && nodesDraggable}
      nodesConnectable={isDesignMode && nodesConnectable}
      elementsSelectable={isInteractive && elementsSelectable}
      onlyRenderVisibleElements={onlyRenderVisibleElements}
      snapToGrid={snapToGrid}
      snapGrid={snapGrid}
      minZoom={minZoom}
      maxZoom={maxZoom}
      panOnScroll={isInteractive}
      zoomOnScroll={isInteractive}
      zoomOnDoubleClick={isInteractive}
      panOnDrag={isInteractive ? [1] : false}
      onInit={handleInit}
      onNodesChange={isDesignMode ? onNodesChange : undefined}
      onEdgesChange={isDesignMode ? onEdgesChange : undefined}
      onConnect={isDesignMode ? onConnect : undefined}
      onConnectStart={isDesignMode ? onConnectStart : undefined}
      onConnectEnd={isDesignMode ? onConnectEnd : undefined}
      onNodeClick={isInteractive ? onNodeClick : undefined}
      onNodeDragStart={isDesignMode ? onNodeDragStart : undefined}
      onNodeDrag={isDesignMode ? onNodeDrag : undefined}
      onNodeDragStop={isDesignMode ? onNodeDragStop : undefined}
      onPaneClick={isInteractive ? onPaneClick : undefined}
      onSelectionChange={onSelectionChange}
      style={{
        opacity: isReady ? 1 : 0,
        transition: BASE_CANVAS_DEFAULTS.transitions.opacity,
      }}
    >
      {showBackground && (
        <CanvasBackground
          color={backgroundColor}
          bgColor={backgroundSecondaryColor}
          variant={backgroundVariant}
          gap={backgroundGap}
          size={backgroundSize}
        />
      )}

      {mode === "design" && <PanShortcutTeachingUI message={panShortcutTeachingUIMessage} />}
      {children}
    </ReactFlow>
  );
};

const BaseCanvasInner = memo(BaseCanvasInnerComponent) as typeof BaseCanvasInnerComponent;

// Create the final component with proper typing
export const BaseCanvas = forwardRef(function BaseCanvas<NodeType extends Node = Node, EdgeType extends Edge = Edge>(
  props: BaseCanvasProps<NodeType, EdgeType>,
  ref: React.Ref<BaseCanvasRef<NodeType, EdgeType>>
) {
  return <BaseCanvasInner {...props} innerRef={ref} />;
}) as <NodeType extends Node = Node, EdgeType extends Edge = Edge>(
  props: BaseCanvasProps<NodeType, EdgeType> & { ref?: React.Ref<BaseCanvasRef<NodeType, EdgeType>> }
) => JSX.Element;
