import "@testing-library/jest-dom";
import React from "react";
import { vi } from "vitest";

// Mock requestAnimationFrame for tests
(window as any).requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
  return setTimeout(callback, 0);
});

(window as any).cancelAnimationFrame = vi.fn((id: number) => {
  clearTimeout(id);
});

// Mock ReactFlow components that require DOM
vi.mock("@uipath/uix/xyflow/react", () => ({
  ReactFlow: ({
    children,
    nodes,
    edges,
    nodeTypes,
    edgeTypes,
    onNodeClick,
    onPaneClick,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodeDragStart,
    onNodeDrag,
    onNodeDragStop,
    fitViewOptions,
    defaultEdgeOptions,
    defaultViewport,
    proOptions,
    connectionMode,
    deleteKeyCode,
    selectNodesOnDrag,
    nodesDraggable,
    nodesConnectable,
    elementsSelectable,
    onlyRenderVisibleElements,
    snapToGrid,
    snapGrid,
    minZoom,
    maxZoom,
    ...otherProps
  }: {
    children?: React.ReactNode;
    [key: string]: any;
  }) => React.createElement("div", { "data-testid": "react-flow", style: otherProps.style }, children),
  ReactFlowProvider: ({ children }: { children?: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "react-flow-provider" }, children),
  useReactFlow: () => ({
    fitView: vi.fn(),
    setViewport: vi.fn(),
    getNodes: vi.fn(() => []),
    getEdges: vi.fn(() => []),
    setNodes: vi.fn(),
    setEdges: vi.fn(),
    getNode: vi.fn(),
    getInternalNode: vi.fn(() => ({
      id: "test-node",
      internals: {
        positionAbsolute: { x: 0, y: 0 },
      },
    })),
    getViewport: vi.fn(() => ({ x: 0, y: 0, zoom: 1 })),
    setCenter: vi.fn(),
    updateNodeData: vi.fn(),
  }),
  useConnection: () => ({
    inProgress: false,
  }),
  useUpdateNodeInternals: () => vi.fn((_nodeId: string) => {}),
  useNodes: vi.fn(() => []),
  useOnSelectionChange: vi.fn(),
  useStoreApi: vi.fn(() => ({
    getState: vi.fn(() => ({
      domNode: document.createElement("div"),
      nodeInternals: new Map(),
    })),
  })),
  useNodesState: () => [[], vi.fn()],
  useEdgesState: () => [[], vi.fn()],
  Controls: () => React.createElement("div", { "data-testid": "controls" }),
  MiniMap: () => React.createElement("div", { "data-testid": "minimap" }),
  Background: ({
    color,
    bgColor,
    variant,
    gap,
    size,
  }: {
    color?: string;
    bgColor?: string;
    variant?: string;
    gap?: number;
    size?: number;
  }) => React.createElement("div", { "data-testid": "background" }),
  BackgroundVariant: {
    Dots: "dots",
  },
  Panel: ({ children, position }: { children?: React.ReactNode; position?: string }) =>
    React.createElement("div", { "data-testid": "panel", "data-position": position }, children),
  BaseEdge: ({ id, path, style }: { id: string; path: string; style?: any }) =>
    React.createElement("path", {
      "data-testid": `edge-${id}`,
      d: path,
      style,
    }),
  getSimpleBezierPath: () => ["M0,0 L100,100"],
  Handle: ({ type, position, id, isConnectable }: { type: string; position: string; id: string; isConnectable?: boolean }) =>
    React.createElement("div", {
      "data-testid": `handle-${type}-${id}`,
      "data-position": position,
    }),
  Position: {
    Left: "left",
    Right: "right",
    Top: "top",
    Bottom: "bottom",
  },
  NodeToolbar: ({
    children,
    nodeId,
    isVisible,
    ...props
  }: {
    children?: React.ReactNode;
    nodeId?: string;
    isVisible?: boolean;
    [key: string]: any;
  }) => React.createElement("div", { "data-testid": "node-toolbar", ...props }, children),
  NodeResizeControl: ({
    children,
    position,
    minWidth,
    minHeight,
    onResizeStart,
    onResizeEnd,
    style,
    ...domProps
  }: {
    children?: React.ReactNode;
    position?: string;
    minWidth?: number;
    minHeight?: number;
    onResizeStart?: () => void;
    onResizeEnd?: () => void;
    style?: React.CSSProperties;
    [key: string]: any;
  }) =>
    React.createElement(
      "div",
      {
        "data-testid": `node-resize-control-${position}`,
        style,
        ...domProps,
      },
      children
    ),
  ConnectionMode: {
    Loose: "loose",
    Strict: "strict",
  },
  PanOnScrollMode: {
    Free: "free",
    Vertical: "vertical",
    Horizontal: "horizontal",
  },
  Edge: {},
  Node: {},
  NodeChange: {},
  DefaultEdgeOptions: {},
  FitViewOptions: {},
  useStore: () => ({
    transform: [0, 0, 1],
    domNode: {
      querySelector: () => document.createElement("div"),
    },
  }),
  ViewportPortal: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "viewport-portal" }, children),
  addEdge: vi.fn((connection, edges) => [...edges, { id: "new-edge", ...connection }]),
  applyEdgeChanges: vi.fn((changes: any[], edges: any[]) => {
    return edges.map((edge: any) => {
      const change = changes.find((c: any) => c.id === edge.id);
      if (change?.type === "select") {
        return { ...edge, selected: change.selected };
      }
      return edge;
    });
  }),
  applyNodeChanges: vi.fn((changes: any[], nodes: any[]) => {
    return nodes.map((node: any) => {
      const change = changes.find((c: any) => c.id === node.id);
      if (change?.type === "select") {
        return { ...node, selected: change.selected };
      }
      return node;
    });
  }),
  getIncomers: vi.fn((node: any, nodes: any[], edges: any[]) => {
    return nodes.filter((n) => edges.some((edge) => edge.target === node.id && edge.source === n.id));
  }),
  getOutgoers: vi.fn(() => []),
  getConnectedEdges: vi.fn(() => []),
}));

// Mock floating-ui
vi.mock("@floating-ui/react", () => ({
  useFloating: () => ({
    refs: {
      setReference: vi.fn(),
      setFloating: vi.fn(),
    },
    floatingStyles: {},
    context: {
      refs: {
        setReference: vi.fn(),
        setFloating: vi.fn(),
      },
    },
    update: () => {}, // Add no-op update function
  }),
  useInteractions: () => ({
    getFloatingProps: () => ({}),
    getReferenceProps: () => ({}),
  }),
  useRole: () => ({}),
  useDismiss: () => ({}),
  useClick: () => ({}),
  useHover: () => ({}),
  useFocus: () => ({}),
  useId: () => "test-id",
  useListNavigation: () => ({}),
  useTypeahead: () => ({}),
  useMergeRefs: () => vi.fn(),
  offset: () => ({}),
  shift: () => ({}),
  flip: () => ({}),
  size: () => ({}),
  autoUpdate: () => ({}),
  useFloatingContext: () => ({}),
  FloatingPortal: ({ children }: { children?: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "floating-portal" }, children),
  FloatingOverlay: ({ children }: { children?: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "floating-overlay" }, children),
  FloatingFocusManager: ({ children }: { children?: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "floating-focus-manager" }, children),
}));

// Mock Apollo UI components
vi.mock("@uipath/portal-shell-react", () => ({
  ApIcon: ({ name, size, variant, color }: { name: string; size?: string; variant?: string; color?: string }) =>
    React.createElement("div", {
      "data-testid": "ap-icon",
      "data-name": name,
      "data-size": size,
      "data-variant": variant,
      "data-color": color,
    }),
  ApIconButton: ({ children, onClick, ...props }: any) =>
    React.createElement("button", { "data-testid": "ap-icon-button", onClick, ...props }, children),
  ApTypography: ({ children, variant, color, style, ...props }: any) =>
    React.createElement("div", { "data-testid": "ap-typography", "data-variant": variant, style: { color, ...style }, ...props }, children),
  ApButton: ({ children, label, onClick, startIcon, variant, size, ...props }: any) =>
    React.createElement(
      "button",
      { "data-testid": "ap-button", onClick, "data-variant": variant, "data-size": size, ...props },
      startIcon,
      children || label
    ),
  ApTooltip: ({ children, title, content, placement }: any) =>
    React.createElement("div", { "data-testid": "ap-tooltip", "data-title": title || content, "data-placement": placement }, children),
  ApCircularProgress: ({ size }: { size?: number }) =>
    React.createElement("div", {
      "data-testid": "ap-circular-progress",
      "data-size": size,
    }),
  ApShell: ({ children, hideShell }: { children?: React.ReactNode; hideShell?: boolean }) =>
    React.createElement("div", { "data-testid": "ap-shell", "data-hide-shell": hideShell }, children),
  PortalDivider: () =>
    React.createElement("hr", {
      "data-testid": "portal-divider",
    }),
  IRawSpan: {},
  ApTextArea: ({
    label,
    value,
    placeholder,
    onValueChanged,
  }: {
    label: string;
    value: string;
    placeholder?: string;
    onValueChanged?: (e: any) => void;
  }) =>
    React.createElement(
      "div",
      {
        "data-testid": `ap-textarea-${label}`,
      },
      React.createElement("label", {}, label),
      React.createElement("textarea", {
        value,
        placeholder,
        onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => onValueChanged?.({ detail: e.target.value }),
        "aria-label": label,
      })
    ),
  ApProgressSpinner: () => React.createElement("div", { "data-testid": "ap-progress-spinner" }),
  ApSkeleton: () => React.createElement("div", { "data-testid": "ap-skeleton" }),
}));

// Mock Apollo core constants
vi.mock("@uipath/apollo-core", () => ({
  FontVariantToken: {
    fontSizeH3Bold: "fontSizeH3Bold",
    fontSizeSBold: "fontSizeSBold",
  },
  Spacing: {
    SpacingMicro: "4px",
    SpacingXs: "8px",
    SpacingS: "12px",
    SpacingBase: "16px",
  },
  Colors: {
    ColorInk300: "#8D9299",
  },
}));

// Mock sanitize-html
vi.mock("sanitize-html", () => ({
  default: (html: string) => html.replace(/<[^>]*>/g, ""),
}));

// Mock react-window
vi.mock("react-window", () => ({
  List: ({
    rowCount,
    rowProps,
    rowComponent: RowComponent,
  }: {
    rowCount: number;
    rowProps: object;
    rowComponent: (props: { index: number }) => JSX.Element;
  }) =>
    React.createElement(
      "div",
      { "data-testid": "virtualized-list" },
      Array.from({ length: rowCount }).map((_, index) =>
        React.createElement(
          "div",
          { key: index, role: "listitem" },
          React.createElement(RowComponent, {
            index,
            key: index,
            ...rowProps,
          })
        )
      )
    ),
}));
