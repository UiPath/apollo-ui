import { vi } from "vitest";
import { Position } from "@xyflow/react";
import type { AgentFlowProps } from "../types";
import {
  computeNodesAndEdges,
  createResourceEdge,
  EDGE_ID_DELIMITER,
  hasModelError,
  hasModelRunning,
  hasModelSuccess,
  NODE_ID_DELIMITER,
} from "./props-helpers";
import { ResourceNodeType } from "../components/AgentCanvas";

describe("props-helpers", () => {
  const mockAgentFlowProps: AgentFlowProps = {
    name: "Test Agent",
    description: "A test agent",
    definition: {
      inputSchema: {},
      outputSchema: {},
      messages: [{ role: "User", content: "Test message" }],
      processKey: "test-process-key",
      processVersion: "1.0.0",
      feedId: "test-feed-id",
      tenantId: "test-tenant-id",
    },
    resources: [
      {
        id: "tool-1",
        name: "Test Tool",
        description: "A test tool",
        type: "tool" as const,
        iconUrl: "test-icon.png",
      },
      {
        id: "context-1",
        name: "Test Context",
        description: "A test context",
        type: "context" as const,
      },
      {
        id: "escalation-1",
        name: "Test Escalation",
        description: "A test escalation",
        type: "escalation" as const,
      },
    ],
    model: {
      name: "Test Model",
      vendorName: "Test Vendor",
      iconUrl: "model-icon.png",
    },
    spans: [],
    mode: "design" as const,
    activeResourceIds: [],
    setSpanForSelectedNode: vi.fn(),
    getNodeFromSelectedSpan: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("computeNodesAndEdges", () => {
    it("creates nodes and edges successfully", () => {
      const result = computeNodesAndEdges(mockAgentFlowProps);

      expect(result.nodes).toBeDefined();
      expect(result.edges).toBeDefined();
      expect(Array.isArray(result.nodes)).toBe(true);
      expect(Array.isArray(result.edges)).toBe(true);
    });
    it("creates agent node", () => {
      const { nodes } = computeNodesAndEdges(mockAgentFlowProps);

      const agentNode = nodes.find((node) => node.type === "agent");
      expect(agentNode).toBeDefined();
      expect(agentNode?.data.name).toBe("Test Agent");
      expect(agentNode?.data.description).toBe("A test agent");
    });

    it("creates resource nodes", () => {
      const { nodes } = computeNodesAndEdges(mockAgentFlowProps);

      const resourceNodes = nodes.filter((node) => node.type === "resource");
      expect(resourceNodes.length).toBeGreaterThan(0);
    });

    it("creates edges for resources", () => {
      const { edges } = computeNodesAndEdges(mockAgentFlowProps);

      // In design mode, edges should be created since handles are now rendered
      expect(edges.length).toBeGreaterThan(0);

      // Check that edges have basic structure
      for (const edge of edges) {
        expect(edge.source).toBeDefined();
        expect(edge.target).toBeDefined();
        expect(edge.type).toBe("default");
      }
    });

    it("creates edges for resources in view mode", () => {
      const viewProps = { ...mockAgentFlowProps, mode: "view" as const };
      const { edges } = computeNodesAndEdges(viewProps);

      expect(edges.length).toBeGreaterThan(0);

      // Check that edges have basic structure
      for (const edge of edges) {
        expect(edge.source).toBeDefined();
        expect(edge.target).toBeDefined();
        expect(edge.type).toBe("default");
      }
    });

    it("sets draggable property based on props", () => {
      const designResult = computeNodesAndEdges({ ...mockAgentFlowProps, allowDragging: true });
      const viewResult = computeNodesAndEdges({
        ...mockAgentFlowProps,
        mode: "view" as const,
      });

      const designResourceNodes = designResult.nodes.filter((node) => node.type === "resource");
      const viewResourceNodes = viewResult.nodes.filter((node) => node.type === "resource");

      for (const node of designResourceNodes) {
        // Model nodes are not draggable even in design mode
        if (node.data.type === "model") {
          expect(node.draggable).toBe(false);
        } else {
          expect(node.draggable).toBe(true);
        }
      }

      for (const node of viewResourceNodes) {
        expect(node.draggable).toBe(false);
      }
    });

    it("handles null model", () => {
      const propsWithoutModel = { ...mockAgentFlowProps, model: null };
      const result = computeNodesAndEdges(propsWithoutModel);

      expect(result.nodes).toBeDefined();
      expect(result.edges).toBeDefined();
    });

    it("does not create edges in design mode", () => {
      const designProps = { ...mockAgentFlowProps, mode: "design" as const };
      const result = computeNodesAndEdges(designProps);

      // In design mode, edges should be created since handles are now rendered
      expect(result.edges.length).toBeGreaterThan(0);
    });

    it("creates edges in view mode", () => {
      const viewProps = { ...mockAgentFlowProps, mode: "view" as const };
      const result = computeNodesAndEdges(viewProps);

      expect(result.edges.length).toBeGreaterThan(0);
    });

    it("creates model node when model is present", () => {
      const { nodes } = computeNodesAndEdges(mockAgentFlowProps);

      const modelNode = nodes.find((node) => node.type === "resource" && node.data.type === "model");

      expect(modelNode).toBeDefined();
      expect(modelNode?.data.name).toBe("Test Model");
      expect(modelNode?.data.description).toBe("Test Vendor");
      expect((modelNode?.data as any).iconUrl).toBe("model-icon.png");
    });

    it("does not create model node when model is null", () => {
      const propsWithoutModel = { ...mockAgentFlowProps, model: null };
      const { nodes } = computeNodesAndEdges(propsWithoutModel);

      const modelNode = nodes.find((node) => node.type === "resource" && node.data.type === "model");

      expect(modelNode).toBeUndefined();
    });

    it("handles parent node ID correctly", () => {
      const parentNodeId = "parent-node";
      const result = computeNodesAndEdges(mockAgentFlowProps, parentNodeId);

      const agentNode = result.nodes.find((node) => node.type === "agent");
      expect(agentNode?.id).toBe(`${parentNodeId}${NODE_ID_DELIMITER}test-process-key`);
    });

    it("sets active state for resources", () => {
      const propsWithActiveResources = {
        ...mockAgentFlowProps,
        activeResourceIds: ["tool-1", "context-1"],
      };

      const { nodes } = computeNodesAndEdges(propsWithActiveResources);

      const toolNode = nodes.find((node) => node.type === "resource" && node.data.type === "tool");
      const contextNode = nodes.find((node) => node.type === "resource" && node.data.type === "context");

      expect((toolNode?.data as any).isActive).toBe(true);
      expect((contextNode?.data as any).isActive).toBe(true);
    });
  });

  describe("hasModelError", () => {
    it("returns true when model has error status", () => {
      const spans = [
        {
          Attributes: JSON.stringify({ type: "completion" }),
          Status: 2, // ERROR status
        } as any,
      ];

      const result = hasModelError(mockAgentFlowProps.model ?? { name: "", vendorName: "", iconUrl: "" }, spans);
      expect(result).toBe(true);
    });

    it("returns false when model has success status", () => {
      const spans = [
        {
          Attributes: JSON.stringify({ type: "completion" }),
          Status: 1, // SUCCESS status
        } as any,
      ];

      const result = hasModelError(mockAgentFlowProps.model ?? { name: "", vendorName: "", iconUrl: "" }, spans);
      expect(result).toBe(false);
    });

    it("returns false when no spans exist", () => {
      const result = hasModelError(mockAgentFlowProps.model ?? { name: "", vendorName: "", iconUrl: "" }, []);
      expect(result).toBe(false);
    });

    it("returns false when span has no attributes", () => {
      const spans = [
        {
          Status: 2,
        } as any,
      ];

      const result = hasModelError(mockAgentFlowProps.model ?? { name: "", vendorName: "", iconUrl: "" }, spans);
      expect(result).toBe(false);
    });
  });

  describe("hasModelSuccess", () => {
    it("returns true when model has success status", () => {
      const spans = [
        {
          Attributes: JSON.stringify({ type: "completion" }),
          Status: 1, // SUCCESS status
        } as any,
      ];

      const result = hasModelSuccess(mockAgentFlowProps.model ?? { name: "", vendorName: "", iconUrl: "" }, spans);
      expect(result).toBe(true);
    });

    it("returns false when model has error status", () => {
      const spans = [
        {
          Attributes: JSON.stringify({ type: "completion" }),
          Status: 2, // ERROR status
        } as any,
      ];

      const result = hasModelSuccess(mockAgentFlowProps.model ?? { name: "", vendorName: "", iconUrl: "" }, spans);
      expect(result).toBe(false);
    });

    it("returns false when span type is not completion", () => {
      const spans = [
        {
          Attributes: JSON.stringify({ type: "other" }),
          Status: 1,
        } as any,
      ];

      const result = hasModelSuccess(mockAgentFlowProps.model ?? { name: "", vendorName: "", iconUrl: "" }, spans);
      expect(result).toBe(false);
    });
  });

  describe("hasModelRunning", () => {
    it("returns true when model has running status", () => {
      const spans = [
        {
          Attributes: JSON.stringify({ type: "completion" }),
          Status: 0, // RUNNING status
        } as any,
      ];

      const result = hasModelRunning(mockAgentFlowProps.model ?? { name: "", vendorName: "", iconUrl: "" }, spans);
      expect(result).toBe(true);
    });

    it("returns false when model has success status", () => {
      const spans = [
        {
          Attributes: JSON.stringify({ type: "completion" }),
          Status: 1, // SUCCESS status
        } as any,
      ];

      const result = hasModelRunning(mockAgentFlowProps.model ?? { name: "", vendorName: "", iconUrl: "" }, spans);
      expect(result).toBe(false);
    });
  });

  describe("createResourceEdge", () => {
    const mockAgentNode = {
      id: "agent-1",
      type: "agent" as const,
      position: { x: 0, y: 0 },
      data: {
        name: "Test Agent",
        description: "Test Agent Description",
        definition: {},
      },
      draggable: false,
    } as any;

    const mockToolNode = {
      id: "tool-1",
      type: "resource" as const,
      position: { x: 0, y: 0 },
      data: {
        type: "tool" as const,
        name: "Test Tool",
        description: "Test Tool Description",
        isActive: false,
      },
      draggable: true,
    } as any;

    const mockContextNode = {
      id: "context-1",
      type: "resource" as const,
      position: { x: 0, y: 0 },
      data: {
        type: "context" as const,
        name: "Test Context",
        description: "Test Context Description",
        isActive: false,
      },
      draggable: true,
    } as any;

    const mockModelNode = {
      id: "model-1",
      type: "resource" as const,
      position: { x: 0, y: 0 },
      data: {
        type: "model" as const,
        name: "Test Model",
        description: "Test Model Description",
        isActive: false,
      },
      draggable: true,
    } as any;

    const mockEscalationNode = {
      id: "escalation-1",
      type: "resource" as const,
      position: { x: 0, y: 0 },
      data: {
        type: "escalation" as const,
        name: "Test Escalation",
        description: "Test Escalation Description",
        isActive: false,
      },
      draggable: true,
    } as any;

    it("creates tool edge correctly", () => {
      const edge = createResourceEdge(mockAgentNode, mockToolNode, mockAgentFlowProps);

      expect(edge.id).toBe(`${mockAgentNode.id}${EDGE_ID_DELIMITER}${mockToolNode.id}`);
      expect(edge.source).toBe(mockAgentNode.id);
      expect(edge.target).toBe(mockToolNode.id);
      expect(edge.sourceHandle).toBe(ResourceNodeType.Tool);
      expect(edge.targetHandle).toBe(Position.Top);
      expect(edge.type).toBe("default");
      expect(edge.animated).toBe(false);
      expect(edge.selectable).toBe(false);
    });

    it("creates context edge correctly", () => {
      const edge = createResourceEdge(mockAgentNode, mockContextNode, mockAgentFlowProps);

      expect(edge.source).toBe(mockContextNode.id);
      expect(edge.target).toBe(mockAgentNode.id);
      expect(edge.sourceHandle).toBe(Position.Bottom);
      expect(edge.targetHandle).toBe(ResourceNodeType.Context);
    });

    it("creates model edge correctly", () => {
      const edge = createResourceEdge(mockAgentNode, mockModelNode, mockAgentFlowProps);

      expect(edge.source).toBe(mockAgentNode.id);
      expect(edge.target).toBe(mockModelNode.id);
      expect(edge.sourceHandle).toBe(ResourceNodeType.Model);
      expect(edge.targetHandle).toBe(Position.Top);
    });

    it("creates escalation edge correctly", () => {
      const edge = createResourceEdge(mockAgentNode, mockEscalationNode, mockAgentFlowProps);

      expect(edge.source).toBe(mockAgentNode.id);
      expect(edge.target).toBe(mockEscalationNode.id);
      expect(edge.sourceHandle).toBe(ResourceNodeType.Escalation);
      expect(edge.targetHandle).toBe(Position.Top);
    });

    it("creates animated edge in view mode with active resource", () => {
      const viewProps = { ...mockAgentFlowProps, mode: "view" as const };
      const activeToolNode = {
        ...mockToolNode,
        data: { ...mockToolNode.data, isActive: true },
      };

      const edge = createResourceEdge(mockAgentNode, activeToolNode, viewProps);

      expect(edge.animated).toBe(true);
    });

    it("creates non-animated edge in design mode", () => {
      const activeToolNode = {
        ...mockToolNode,
        data: { ...mockToolNode.data, isActive: true },
      };

      const edge = createResourceEdge(mockAgentNode, activeToolNode, mockAgentFlowProps);

      expect(edge.animated).toBe(false);
    });
  });

  describe("constants", () => {
    it("exports NODE_ID_DELIMITER", () => {
      expect(NODE_ID_DELIMITER).toBe("=>");
    });

    it("exports EDGE_ID_DELIMITER", () => {
      expect(EDGE_ID_DELIMITER).toBe("::");
    });
  });

  describe("resource status detection", () => {
    it("detects tool error status", () => {
      const spans = [
        {
          Attributes: JSON.stringify({ toolName: "Test_Tool" }),
          Status: 2, // ERROR status
        } as any,
      ];

      const propsWithSpans = { ...mockAgentFlowProps, spans };
      const { nodes } = computeNodesAndEdges(propsWithSpans);

      const toolNode = nodes.find((node) => node.type === "resource" && node.data.type === "tool");

      expect((toolNode?.data as any).hasError).toBe(true);
      expect((toolNode?.data as any).hasSuccess).toBe(false);
      expect((toolNode?.data as any).hasRunning).toBe(false);
    });

    it("detects tool success status", () => {
      const spans = [
        {
          Attributes: JSON.stringify({ toolName: "Test_Tool" }),
          Status: 1, // SUCCESS status
        } as any,
      ];

      const propsWithSpans = { ...mockAgentFlowProps, spans };
      const { nodes } = computeNodesAndEdges(propsWithSpans);

      const toolNode = nodes.find((node) => node.type === "resource" && node.data.type === "tool");

      expect((toolNode?.data as any).hasError).toBe(false);
      expect((toolNode?.data as any).hasSuccess).toBe(true);
      expect((toolNode?.data as any).hasRunning).toBe(false);
    });

    it("detects tool running status", () => {
      const spans = [
        {
          Attributes: JSON.stringify({ toolName: "Test_Tool" }),
          Status: 0, // RUNNING status
        } as any,
      ];

      const propsWithSpans = { ...mockAgentFlowProps, spans };
      const { nodes } = computeNodesAndEdges(propsWithSpans);

      const toolNode = nodes.find((node) => node.type === "resource" && node.data.type === "tool");

      expect((toolNode?.data as any).hasError).toBe(false);
      expect((toolNode?.data as any).hasSuccess).toBe(false);
      expect((toolNode?.data as any).hasRunning).toBe(true);
    });

    it("handles escalation tool name normalization", () => {
      const spans = [
        {
          Attributes: JSON.stringify({ toolName: "escalate_test_escalation" }),
          Status: 1, // SUCCESS status
        } as any,
      ];

      const propsWithSpans = { ...mockAgentFlowProps, spans };
      const { nodes } = computeNodesAndEdges(propsWithSpans);

      const escalationNode = nodes.find((node) => node.type === "resource" && node.data.type === "escalation");

      expect((escalationNode?.data as any).hasSuccess).toBe(true);
    });

    it("handles context tool name normalization", () => {
      const spans = [
        {
          Attributes: JSON.stringify({ toolName: "Test_Context" }),
          Status: 1, // SUCCESS status
        } as any,
      ];

      const propsWithSpans = { ...mockAgentFlowProps, spans };
      const { nodes } = computeNodesAndEdges(propsWithSpans);

      const contextNode = nodes.find((node) => node.type === "resource" && node.data.type === "context");

      expect((contextNode?.data as any).hasSuccess).toBe(true);
    });
  });
});
