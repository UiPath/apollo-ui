import React, { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { Panel, ReactFlowProvider } from "@uipath/uix-xyflow/react";
import { describe, expect, it, vi } from "vitest";
import type { BaseCanvasProps, BaseCanvasRef } from "./BaseCanvas.types";
import { BaseCanvas } from "./BaseCanvas";

// Mock the hooks with configurable state
let mockIsReady = true;
const mockIsLayouting = false;

vi.mock("./BaseCanvas.hooks", () => ({
  useAutoLayout: () => ({
    isLayouting: mockIsLayouting,
    isReady: mockIsReady,
  }),
  useEnsureNodesInView: () => ({
    ensureNodesInView: vi.fn(),
    ensureAllNodesInView: vi.fn(),
    centerNode: vi.fn(),
  }),
  useMaintainNodesInView: vi.fn(),
}));

// Mock ReactFlow
const mockReactFlowInstance = {
  fitView: vi.fn(),
  zoomIn: vi.fn(),
  zoomOut: vi.fn(),
  getNodes: vi.fn(() => []),
  getEdges: vi.fn(() => []),
  getViewport: vi.fn(() => ({ x: 0, y: 0, zoom: 1 })),
  setViewport: vi.fn(),
  zoomTo: vi.fn(),
};

vi.mock("@uipath/uix-xyflow/react", async () => {
  const actual = await vi.importActual("@uipath/uix-xyflow/react");
  return {
    ...actual,
    ReactFlow: ({ children, style, onInit }: any) => {
      // Use useEffect to simulate onInit being called after mount
      React.useEffect(() => {
        onInit?.(mockReactFlowInstance);
      }, [onInit]);
      return (
        <div data-testid="react-flow" style={style}>
          {children}
        </div>
      );
    },
    Background: ({ variant }: any) => <div data-testid="background" data-variant={variant} />,
    Panel: ({ children, position }: any) => <div data-testid={`panel-${position}`}>{children}</div>,
    useReactFlow: () => mockReactFlowInstance,
  };
});

// Mock CanvasPositionControls
vi.mock("../CanvasPositionControls", () => ({
  CanvasPositionControls: ({ orientation }: any) => <div data-testid="canvas-controls" data-orientation={orientation} />,
}));

const defaultProps: BaseCanvasProps = {
  nodes: [],
  edges: [],
  nodeTypes: {},
};

const renderBaseCanvas = (props: Partial<BaseCanvasProps> = {}, ref?: React.Ref<BaseCanvasRef>) => {
  return render(
    <ReactFlowProvider>
      <BaseCanvas {...defaultProps} {...props} ref={ref} />
    </ReactFlowProvider>
  );
};

describe("BaseCanvas", () => {
  it("renders without crashing", () => {
    renderBaseCanvas();
    expect(screen.getByTestId("react-flow")).toBeInTheDocument();
  });

  it("renders background with default variant", () => {
    renderBaseCanvas();
    const background = screen.getByTestId("background");
    expect(background).toBeInTheDocument();
    expect(background).toHaveAttribute("data-variant", "dots");
  });

  it("renders controls in default position", () => {
    // BaseCanvas doesn't render controls by default, they must be passed as children
    renderBaseCanvas({
      children: (
        <Panel position="bottom-right">
          <div data-testid="canvas-controls" />
        </Panel>
      ),
    });
    expect(screen.getByTestId("panel-bottom-right")).toBeInTheDocument();
    expect(screen.getByTestId("canvas-controls")).toBeInTheDocument();
  });

  it("respects custom controls position", () => {
    renderBaseCanvas({
      children: (
        <Panel position="top-left">
          <div data-testid="canvas-controls" />
        </Panel>
      ),
    });
    expect(screen.getByTestId("panel-top-left")).toBeInTheDocument();
  });

  it("renders custom controls when provided", () => {
    const customControls = <div data-testid="custom-controls">Custom</div>;
    renderBaseCanvas({ children: customControls });
    expect(screen.getByTestId("custom-controls")).toBeInTheDocument();
  });

  it("renders with opacity transition when not ready", () => {
    // Set mock to not ready state
    mockIsReady = false;
    renderBaseCanvas();
    const reactFlow = screen.getByTestId("react-flow");
    expect(reactFlow).toHaveStyle({
      opacity: "0",
      transition: "opacity 0.2s ease-in-out",
    });
    // Reset mock state
    mockIsReady = true;
  });

  it("renders additional panels", () => {
    renderBaseCanvas({
      children: (
        <Panel position="top-center">
          <div data-testid="custom-panel">Panel Content</div>
        </Panel>
      ),
    });
    expect(screen.getByTestId("panel-top-center")).toBeInTheDocument();
    expect(screen.getByTestId("custom-panel")).toBeInTheDocument();
  });

  it("applies opacity transition for canvas ready state", () => {
    // Set mock to not ready state
    mockIsReady = false;
    renderBaseCanvas();
    const reactFlow = screen.getByTestId("react-flow");
    expect(reactFlow).toHaveStyle({
      opacity: "0",
      transition: "opacity 0.2s ease-in-out",
    });
    // Reset mock state
    mockIsReady = true;
  });

  it("renders children inside the canvas", () => {
    renderBaseCanvas({
      children: (
        <div data-testid="custom-child">
          <span>Custom content inside canvas</span>
        </div>
      ),
    });

    const customChild = screen.getByTestId("custom-child");
    expect(customChild).toBeInTheDocument();
    expect(screen.getByText("Custom content inside canvas")).toBeInTheDocument();
  });

  it("renders multiple children", () => {
    renderBaseCanvas({
      children: (
        <>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
        </>
      ),
    });

    expect(screen.getByTestId("child-1")).toBeInTheDocument();
    expect(screen.getByTestId("child-2")).toBeInTheDocument();
    expect(screen.getByText("Child 1")).toBeInTheDocument();
    expect(screen.getByText("Child 2")).toBeInTheDocument();
  });

  it("exposes ReactFlow instance via ref", async () => {
    const ref = createRef<BaseCanvasRef>();
    renderBaseCanvas({}, ref);

    // Wait for onInit to be called and ReactFlow instance to be available
    await vi.waitFor(() => {
      expect(ref.current?.reactFlow).toBeDefined();
    });

    // Verify the ReactFlow instance has the expected methods
    expect(ref.current?.reactFlow?.fitView).toBeDefined();
    expect(ref.current?.reactFlow?.zoomIn).toBeDefined();
    expect(ref.current?.reactFlow?.zoomOut).toBeDefined();
    expect(ref.current?.reactFlow?.getNodes).toBeDefined();
    expect(ref.current?.reactFlow?.getEdges).toBeDefined();
    expect(ref.current?.reactFlow?.getViewport).toBeDefined();
    expect(ref.current?.reactFlow?.setViewport).toBeDefined();
    expect(ref.current?.reactFlow?.zoomTo).toBeDefined();
  });

  it("ref provides access to custom methods and ReactFlow instance", async () => {
    const ref = createRef<BaseCanvasRef>();
    renderBaseCanvas({}, ref);

    // Custom methods should be available immediately
    expect(ref.current?.ensureNodesInView).toBeDefined();
    expect(ref.current?.ensureAllNodesInView).toBeDefined();
    expect(ref.current?.centerNode).toBeDefined();

    // ReactFlow instance becomes available after init
    await vi.waitFor(() => {
      expect(ref.current?.reactFlow).toBeDefined();
    });

    // Can call ReactFlow methods via the ref
    ref.current?.reactFlow?.zoomTo(1.5);
    expect(mockReactFlowInstance.zoomTo).toHaveBeenCalledWith(1.5);
  });

  it("accepts maintainNodesInView props", () => {
    const { getByTestId } = renderBaseCanvas({
      maintainNodesInView: ["node1", "node2"],
    });

    // The component should render successfully with these props
    expect(getByTestId("react-flow")).toBeInTheDocument();
  });
});
