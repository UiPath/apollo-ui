import { describe, expect, it } from "vitest";
import type { AgentFlowCustomEdge, AgentFlowCustomNode } from "../types";
import { autoArrangeNodes, getAgentGroupBottomPosition } from "./auto-layout";
import { ResourceNodeType } from "../components/AgentCanvas/AgentFlow.constants";
import { Position } from "@xyflow/react";

describe("auto-layout", () => {
  describe("getAgentGroupBottomPosition", () => {
    it("returns agent bottom position when no connected nodes", () => {
      const agent: AgentFlowCustomNode = {
        id: "agent1",
        type: "agent",
        position: { x: 100, y: 100 },
        width: 200,
        height: 140,
        data: {
          name: "Test Agent",
          description: "Test agent description",
          definition: {},
        },
      };

      const result = getAgentGroupBottomPosition(agent, [], []);

      expect(result).toEqual({ x: 200, y: 240 }); // center x and bottom y
    });

    it("returns bottom-most position from connected bottom nodes", () => {
      const agent: AgentFlowCustomNode = {
        id: "agent1",
        type: "agent",
        position: { x: 100, y: 100 },
        width: 200,
        height: 140,
        data: {
          name: "Test Agent",
          description: "Test agent description",
          definition: {},
        },
      };

      const nodes: AgentFlowCustomNode[] = [
        agent,
        {
          id: "resource1",
          type: "resource",
          position: { x: 150, y: 300 },
          width: 100,
          height: 80,
          data: {
            type: "tool",
            name: "Resource 1",
            description: "Test resource 1",
            projectType: "Skill",
          },
        },
        {
          id: "resource2",
          type: "resource",
          position: { x: 250, y: 350 },
          width: 100,
          height: 80,
          data: {
            type: "tool",
            name: "Resource 2",
            description: "Test resource 2",
            projectType: "Skill",
          },
        },
      ];

      const edges: AgentFlowCustomEdge[] = [
        {
          id: "edge1",
          source: "agent1",
          target: "resource1",
          sourceHandle: ResourceNodeType.Escalation, // handle that's on the bottom of the agent node
          targetHandle: Position.Top,
        },
        {
          id: "edge2",
          source: "agent1",
          target: "resource2",
          sourceHandle: ResourceNodeType.Escalation, // handle that's on the bottom of the agent node
          targetHandle: Position.Top,
        },
      ];

      const result = getAgentGroupBottomPosition(agent, nodes, edges);

      expect(result).toEqual({ x: 300, y: 430 }); // resource2 center x and bottom y
    });

    it("checks all connected node groups (left, right, bottom)", () => {
      const agent: AgentFlowCustomNode = {
        id: "agent1",
        type: "agent",
        position: { x: 400, y: 300 },
        width: 200,
        height: 140,
        data: {
          name: "Test Agent",
          description: "Test agent description",
          definition: {},
        },
      };

      const nodes: AgentFlowCustomNode[] = [
        agent,
        {
          id: "left1",
          type: "resource",
          position: { x: 100, y: 500 },
          width: 100,
          height: 80,
          data: {
            type: "tool",
            name: "Left Resource",
            description: "Test left resource",
            projectType: "Skill",
          },
        },
        {
          id: "right1",
          type: "resource",
          position: { x: 700, y: 450 },
          width: 100,
          height: 80,
          data: {
            type: "tool",
            name: "Right Resource",
            description: "Test right resource",
            projectType: "Skill",
          },
        },
        {
          id: "bottom1",
          type: "resource",
          position: { x: 450, y: 550 },
          width: 100,
          height: 80,
          data: {
            type: "tool",
            name: "Bottom Resource",
            description: "Test bottom resource",
            projectType: "Skill",
          },
        },
      ];

      const edges: AgentFlowCustomEdge[] = [
        {
          id: "edge1",
          source: "agent1",
          target: "left1",
          sourceHandle: ResourceNodeType.Model, // handle that's on the left of the agent node
          targetHandle: Position.Right,
        },
        {
          id: "edge2",
          source: "agent1",
          target: "right1",
          sourceHandle: ResourceNodeType.Tool, // handle that's on the right of the agent node
          targetHandle: Position.Left,
        },
        {
          id: "edge3",
          source: "agent1",
          target: "bottom1",
          sourceHandle: ResourceNodeType.Escalation, // handle that's on the bottom of the agent node
          targetHandle: Position.Top,
        },
      ];

      const result = getAgentGroupBottomPosition(agent, nodes, edges);

      expect(result).toEqual({ x: 500, y: 630 }); // bottom1 is the lowest
    });

    it("handles measured dimensions when available", () => {
      const agent: AgentFlowCustomNode = {
        id: "agent1",
        type: "agent",
        position: { x: 100, y: 100 },
        measured: { width: 250, height: 150 },
        data: {
          name: "Test Agent",
          description: "Test agent description",
          definition: {},
        },
      };

      const result = getAgentGroupBottomPosition(agent, [], []);

      expect(result).toEqual({ x: 225, y: 250 }); // uses measured dimensions
    });
  });

  describe("autoArrangeNodes", () => {
    it("returns cloned nodes without modification when no agent nodes", () => {
      const nodes: AgentFlowCustomNode[] = [
        {
          id: "resource1",
          type: "resource",
          position: { x: 100, y: 100 },
          data: {
            type: "tool",
            name: "Resource 1",
            description: "Test resource",
            projectType: "Skill",
          },
        },
      ];

      const result = autoArrangeNodes(nodes, []);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(nodes[0]);
      expect(result).not.toBe(nodes); // should be cloned
    });

    it("positions root agent at origin", () => {
      const nodes: AgentFlowCustomNode[] = [
        {
          id: "agent1",
          type: "agent",
          position: { x: 500, y: 500 },
          data: {
            name: "Test Agent",
            description: "Test agent description",
            definition: {},
          },
        },
      ];

      const result = autoArrangeNodes(nodes, []);

      expect(result[0]?.position).toEqual({ x: 0, y: 0 });
    });

    it("arranges connected resources around agent", () => {
      const nodes: AgentFlowCustomNode[] = [
        {
          id: "agent1",
          type: "agent",
          position: { x: 0, y: 0 },
          width: 200,
          height: 140,
          data: {
            name: "Test Agent",
            description: "Test agent description",
            definition: {},
          },
        },
        {
          id: "model1",
          type: "resource",
          position: { x: 0, y: 0 },
          width: 100,
          height: 80,
          data: {
            type: "model",
            name: "Test Model",
            description: "Test model description",
            projectType: "Model",
          },
        },
        {
          id: "skill1",
          type: "resource",
          position: { x: 0, y: 0 },
          width: 100,
          height: 80,
          data: {
            type: "tool",
            name: "Skill 1",
            description: "Test skill 1",
            projectType: "Skill",
            order: 1,
          },
        },
        {
          id: "skill2",
          type: "resource",
          position: { x: 0, y: 0 },
          width: 100,
          height: 80,
          data: {
            type: "tool",
            name: "Skill 2",
            description: "Test skill 2",
            projectType: "Skill",
            order: 2,
          },
        },
      ];

      const edges: AgentFlowCustomEdge[] = [
        {
          id: "edge1",
          source: "agent1",
          target: "model1",
          sourceHandle: ResourceNodeType.Model, // handle that's on the left of the agent node
          targetHandle: Position.Right,
        },
        {
          id: "edge2",
          source: "agent1",
          target: "skill1",
          sourceHandle: ResourceNodeType.Tool, // handle that's on the right of the agent node
          targetHandle: Position.Left,
        },
        {
          id: "edge3",
          source: "agent1",
          target: "skill2",
          sourceHandle: ResourceNodeType.Tool, // handle that's on the right of the agent node
          targetHandle: Position.Left,
        },
      ];

      const result = autoArrangeNodes(nodes, edges);

      // Check model is positioned to the left
      const model = result.find((n) => n.id === "model1");
      expect(model?.position.x).toBeLessThan(0);

      // Check skills are positioned to the right
      const skill1 = result.find((n) => n.id === "skill1");
      const skill2 = result.find((n) => n.id === "skill2");
      expect(skill1?.position.x).toBeGreaterThan(200);
      expect(skill2?.position.x).toBeGreaterThan(200);

      // Check skills are vertically spaced
      expect(skill2?.position.y).not.toEqual(skill1?.position.y);
    });

    it("handles nested agents", () => {
      const nodes: AgentFlowCustomNode[] = [
        {
          id: "agent1",
          type: "agent",
          position: { x: 0, y: 0 },
          width: 200,
          height: 140,
          data: {
            name: "Test Agent",
            description: "Test agent description",
            definition: {},
          },
        },
        {
          id: "agentResource",
          type: "resource",
          position: { x: 0, y: 0 },
          width: 100,
          height: 80,
          data: {
            type: "tool",
            name: "Agent Resource",
            description: "Test agent resource",
            projectType: "Agent",
          },
        },
        {
          id: "agent2",
          type: "agent",
          position: { x: 0, y: 0 },
          width: 200,
          height: 140,
          data: {
            name: "Nested Agent",
            description: "Test nested agent",
            definition: {},
            parentNodeId: "agentResource",
          },
        },
      ];

      const edges: AgentFlowCustomEdge[] = [
        {
          id: "edge1",
          source: "agent1",
          target: "agentResource",
          sourceHandle: ResourceNodeType.Tool, // handle that's on the right of the agent node
          targetHandle: Position.Left,
        },
      ];

      const result = autoArrangeNodes(nodes, edges);

      // Check nested agent is positioned further right
      const nestedAgent = result.find((n) => n.id === "agent2");
      const agentResource = result.find((n) => n.id === "agentResource");
      expect(nestedAgent?.position.x).toBeGreaterThan(agentResource?.position.x || 0);
    });

    it("sorts nodes by order property", () => {
      const nodes: AgentFlowCustomNode[] = [
        {
          id: "agent1",
          type: "agent",
          position: { x: 0, y: 0 },
          width: 200,
          height: 140,
          data: {
            name: "Test Agent",
            description: "Test agent description",
            definition: {},
          },
        },
        {
          id: "skill1",
          type: "resource",
          position: { x: 0, y: 0 },
          width: 100,
          height: 80,
          data: {
            type: "tool",
            name: "Skill 1",
            description: "Test skill 1",
            projectType: "Skill",
            order: 2,
          },
        },
        {
          id: "skill2",
          type: "resource",
          position: { x: 0, y: 0 },
          width: 100,
          height: 80,
          data: {
            type: "tool",
            name: "Skill 2",
            description: "Test skill 2",
            projectType: "Skill",
            order: 1,
          },
        },
      ];

      const edges: AgentFlowCustomEdge[] = [
        {
          id: "edge1",
          source: "agent1",
          target: "skill1",
          sourceHandle: ResourceNodeType.Tool, // handle that's on the right of the agent node
          targetHandle: Position.Left,
        },
        {
          id: "edge2",
          source: "agent1",
          target: "skill2",
          sourceHandle: ResourceNodeType.Tool, // handle that's on the right of the agent node
          targetHandle: Position.Left,
        },
      ];

      const result = autoArrangeNodes(nodes, edges);

      const skill1 = result.find((n) => n.id === "skill1");
      const skill2 = result.find((n) => n.id === "skill2");

      // skill2 (order: 1) should be positioned above skill1 (order: 2)
      expect(skill2?.position.y).toBeLessThan(skill1?.position.y || 0);
    });

    it("adds offset for single nodes to avoid straight lines", () => {
      const nodes: AgentFlowCustomNode[] = [
        {
          id: "agent1",
          type: "agent",
          position: { x: 0, y: 0 },
          width: 200,
          height: 140,
          data: {
            name: "Test Agent",
            description: "Test agent description",
            definition: {},
          },
        },
        {
          id: "context1",
          type: "resource",
          position: { x: 0, y: 0 },
          width: 100,
          height: 80,
          data: {
            type: "context",
            name: "Context Resource",
            description: "Test context resource",
            projectType: "Skill",
          },
        },
      ];

      const edges: AgentFlowCustomEdge[] = [
        {
          id: "edge1",
          source: "agent1",
          target: "context1",
          sourceHandle: "top",
          targetHandle: "bottom",
        },
      ];

      const result = autoArrangeNodes(nodes, edges);

      const context = result.find((n) => n.id === "context1");
      // Single node should not be centered
      expect(context?.position.x).not.toEqual(50); // would be 50 if centered without offset
    });
  });
});
