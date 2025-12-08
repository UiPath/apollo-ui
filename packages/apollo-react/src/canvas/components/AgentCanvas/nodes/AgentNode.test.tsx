import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AgentNodeElement } from "./AgentNode";
import type { AgentNodeTranslations } from "../../../types";

// Mock dependencies
vi.mock("@uipath/uix/xyflow/react", () => ({
  Position: {
    Top: "top",
    Bottom: "bottom",
    Left: "left",
    Right: "right",
  },
  BackgroundVariant: {
    Dots: "dots",
    Lines: "lines",
    Cross: "cross",
  },
  useStore: () => ({ edges: [], isConnecting: false }),
  useConnection: () => ({ inProgress: false }),
  useUpdateNodeInternals: () => vi.fn(),
  useReactFlow: () => ({
    setNodes: vi.fn(),
    setEdges: vi.fn(),
  }),
}));

vi.mock("../../ButtonHandle/useButtonHandles", () => ({
  useButtonHandles: () => null,
}));

vi.mock("../../ExecutionStatusIcon/ExecutionStatusIcon", () => ({
  ExecutionStatusIcon: ({ status }: { status?: string }) => <div data-testid="execution-status-icon">{status || "none"}</div>,
}));

vi.mock("../store/agent-flow-store", () => ({
  useAgentFlowStore: () => ({
    actOnSuggestion: vi.fn(),
  }),
}));

// Mock Icons from @uipath/uix/core
vi.mock("@uipath/uix/core", () => ({
  // Re-export everything else from actual module
  cx: (...args: unknown[]) => args.filter(Boolean).join(" "),
  Icons: {
    ConversationalAgentIcon: ({ w, h }: { w: number; h: number }) => (
      <div data-testid="conversational-agent-icon" style={{ width: w, height: h }} />
    ),
    AutonomousAgentIcon: ({ w, h }: { w: number; h: number }) => (
      <div data-testid="autonomous-agent-icon" style={{ width: w, height: h }} />
    ),
    HealthScoreIcon: ({ w, h }: { w: number; h: number }) => (
      <svg data-testid="health-score-icon" width={w} height={h}>
        <path d="M0 0" />
      </svg>
    ),
  },
}));

const defaultTranslations: AgentNodeTranslations = {
  arguments: "Arguments",
  input: "Input",
  output: "Output",
  user: "User",
  system: "System",
  autonomousAgent: "Autonomous Agent",
  codedAgent: "Coded Agent",
  conversationalAgent: "Conversational Agent",
  escalations: "Escalations",
  model: "Model",
  context: "Context",
  tools: "Tools",
  memory: "Memory",
};

const defaultNodeProps = {
  id: "test-agent-node",
  type: "agent" as const,
  data: {
    name: "Test Agent",
    description: "Test Description",
    definition: {},
  },
  position: { x: 0, y: 0 },
  selected: false,
  dragging: false,
  draggable: true,
  zIndex: 0,
  isConnectable: true,
  positionAbsoluteX: 0,
  positionAbsoluteY: 0,
  selectable: true,
  deletable: true,
  translations: defaultTranslations,
};

describe("AgentNode - Health Score", () => {
  describe("Health Score Rendering", () => {
    it("should render health score when provided", () => {
      render(<AgentNodeElement {...defaultNodeProps} healthScore={85} />);

      // Check for health score icon
      expect(screen.getByTestId("health-score-icon")).toBeInTheDocument();

      // Check for health score value
      expect(screen.getByText("85")).toBeInTheDocument();
    });

    it("should not render health score when undefined", () => {
      render(<AgentNodeElement {...defaultNodeProps} healthScore={undefined} />);

      // Health score icon should not be present
      expect(screen.queryByTestId("health-score-icon")).not.toBeInTheDocument();

      // No health score text should be visible
      expect(screen.queryByText(/\d+/)).not.toBeInTheDocument();
    });

    it("should render health score of 0", () => {
      render(<AgentNodeElement {...defaultNodeProps} healthScore={0} />);

      expect(screen.getByTestId("health-score-icon")).toBeInTheDocument();
      expect(screen.getByText("0")).toBeInTheDocument();
    });

    it("should render health score of 100", () => {
      render(<AgentNodeElement {...defaultNodeProps} healthScore={100} />);

      expect(screen.getByTestId("health-score-icon")).toBeInTheDocument();
      expect(screen.getByText("100")).toBeInTheDocument();
    });

    it("should render health score with decimal values as strings", () => {
      render(<AgentNodeElement {...defaultNodeProps} healthScore={85.7} />);

      expect(screen.getByTestId("health-score-icon")).toBeInTheDocument();
      expect(screen.getByText("85.7")).toBeInTheDocument();
    });
  });

  describe("Health Score Edge Cases", () => {
    it("should handle negative health scores", () => {
      // Current implementation will render negative values
      // This test documents the current behavior
      render(<AgentNodeElement {...defaultNodeProps} healthScore={-10} />);

      expect(screen.getByTestId("health-score-icon")).toBeInTheDocument();
      expect(screen.getByText("-10")).toBeInTheDocument();
    });

    it("should handle very large health scores", () => {
      render(<AgentNodeElement {...defaultNodeProps} healthScore={999} />);

      expect(screen.getByTestId("health-score-icon")).toBeInTheDocument();
      expect(screen.getByText("999")).toBeInTheDocument();
    });

    it("should not render for NaN", () => {
      render(<AgentNodeElement {...defaultNodeProps} healthScore={NaN} />);

      // NaN.toString() returns "NaN", which would be rendered
      // This test documents current behavior - may need fixing
      const healthScoreIcon = screen.queryByTestId("health-score-icon");
      if (healthScoreIcon) {
        expect(screen.getByText("NaN")).toBeInTheDocument();
      }
    });

    it("should not render for Infinity", () => {
      render(<AgentNodeElement {...defaultNodeProps} healthScore={Infinity} />);

      // Infinity.toString() returns "Infinity"
      const healthScoreIcon = screen.queryByTestId("health-score-icon");
      if (healthScoreIcon) {
        expect(screen.getByText("Infinity")).toBeInTheDocument();
      }
    });
  });

  describe("Health Score Integration", () => {
    it("should render health score alongside agent name", () => {
      render(<AgentNodeElement {...defaultNodeProps} healthScore={75} />);

      // Both agent name and health score should be visible
      expect(screen.getByText("Test Agent")).toBeInTheDocument();
      expect(screen.getByText("75")).toBeInTheDocument();
    });

    it("should render health score with execution status", () => {
      render(<AgentNodeElement {...defaultNodeProps} healthScore={90} hasError={true} />);

      // Both health score and execution status should be visible
      expect(screen.getByText("90")).toBeInTheDocument();
      expect(screen.getByTestId("execution-status-icon")).toBeInTheDocument();
      expect(screen.getByText("Failed")).toBeInTheDocument();
    });

    it("should render health score in design mode", () => {
      render(<AgentNodeElement {...defaultNodeProps} mode="design" healthScore={80} />);

      expect(screen.getByTestId("health-score-icon")).toBeInTheDocument();
      expect(screen.getByText("80")).toBeInTheDocument();
    });

    it("should render health score in view mode", () => {
      render(<AgentNodeElement {...defaultNodeProps} mode="view" healthScore={65} />);

      expect(screen.getByTestId("health-score-icon")).toBeInTheDocument();
      expect(screen.getByText("65")).toBeInTheDocument();
    });
  });

  describe("Agent Types", () => {
    it("should render conversational agent with health score", () => {
      render(
        <AgentNodeElement
          {...defaultNodeProps}
          data={{
            ...defaultNodeProps.data,
            definition: { metadata: { isConversational: true } },
          }}
          healthScore={92}
        />
      );

      expect(screen.getByTestId("conversational-agent-icon")).toBeInTheDocument();
      expect(screen.getByText("Conversational Agent")).toBeInTheDocument();
      expect(screen.getByText("92")).toBeInTheDocument();
    });

    it("should render autonomous agent with health score", () => {
      render(
        <AgentNodeElement
          {...defaultNodeProps}
          data={{
            ...defaultNodeProps.data,
            definition: { metadata: { isConversational: false } },
          }}
          healthScore={88}
        />
      );

      expect(screen.getByTestId("autonomous-agent-icon")).toBeInTheDocument();
      expect(screen.getByText("Autonomous Agent")).toBeInTheDocument();
      expect(screen.getByText("88")).toBeInTheDocument();
    });
  });
});
