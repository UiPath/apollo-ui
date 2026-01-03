import { Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it } from 'vitest';
import { ResourceNodeType } from '../components/AgentCanvas/AgentFlow.constants';
import { type AgentFlowCustomEdge, type AgentFlowCustomNode, ProjectType } from '../types';
import { autoArrangeNodes, getAgentGroupBottomPosition } from './auto-layout';

describe('auto-layout', () => {
  describe('getAgentGroupBottomPosition', () => {
    it('returns agent bottom position when no connected nodes', () => {
      const agent: AgentFlowCustomNode = {
        id: 'agent1',
        type: 'agent',
        position: { x: 100, y: 100 },
        width: 200,
        height: 140,
        data: {
          name: 'Test Agent',
          description: 'Test agent description',
          definition: {},
        },
      };

      const result = getAgentGroupBottomPosition(agent, [], []);

      expect(result).toEqual({ x: 200, y: 240 }); // center x and bottom y
    });

    it('returns bottom-most position from connected bottom nodes', () => {
      const agent: AgentFlowCustomNode = {
        id: 'agent1',
        type: 'agent',
        position: { x: 100, y: 100 },
        width: 200,
        height: 140,
        data: {
          name: 'Test Agent',
          description: 'Test agent description',
          definition: {},
        },
      };

      const nodes: AgentFlowCustomNode[] = [
        agent,
        {
          id: 'resource1',
          type: 'resource',
          position: { x: 150, y: 300 },
          width: 100,
          height: 80,
          data: {
            type: 'tool',
            name: 'Resource 1',
            description: 'Test resource 1',
            projectType: ProjectType.Internal,
          },
        },
        {
          id: 'resource2',
          type: 'resource',
          position: { x: 250, y: 350 },
          width: 100,
          height: 80,
          data: {
            type: 'tool',
            name: 'Resource 2',
            description: 'Test resource 2',
            projectType: ProjectType.Internal,
          },
        },
      ];

      const edges: AgentFlowCustomEdge[] = [
        {
          id: 'edge1',
          source: 'agent1',
          target: 'resource1',
          sourceHandle: ResourceNodeType.Escalation, // handle that's on the top of the agent node
          targetHandle: Position.Bottom,
        },
        {
          id: 'edge2',
          source: 'agent1',
          target: 'resource2',
          sourceHandle: ResourceNodeType.Escalation, // handle that's on the top of the agent node
          targetHandle: Position.Bottom,
        },
      ];

      const result = getAgentGroupBottomPosition(agent, nodes, edges);

      expect(result).toEqual({ x: 300, y: 430 }); // resource2 center x and bottom y
    });

    it('checks all connected node groups (left, right, bottom)', () => {
      const agent: AgentFlowCustomNode = {
        id: 'agent1',
        type: 'agent',
        position: { x: 400, y: 300 },
        width: 200,
        height: 140,
        data: {
          name: 'Test Agent',
          description: 'Test agent description',
          definition: {},
        },
      };

      const nodes: AgentFlowCustomNode[] = [
        agent,
        {
          id: 'left1',
          type: 'resource',
          position: { x: 100, y: 500 },
          width: 100,
          height: 80,
          data: {
            type: 'tool',
            name: 'Left Resource',
            description: 'Test left resource',
            projectType: ProjectType.Internal,
          },
        },
        {
          id: 'right1',
          type: 'resource',
          position: { x: 700, y: 450 },
          width: 100,
          height: 80,
          data: {
            type: 'tool',
            name: 'Right Resource',
            description: 'Test right resource',
            projectType: ProjectType.Internal,
          },
        },
        {
          id: 'bottom1',
          type: 'resource',
          position: { x: 450, y: 550 },
          width: 100,
          height: 80,
          data: {
            type: 'tool',
            name: 'Bottom Resource',
            description: 'Test bottom resource',
            projectType: ProjectType.Internal,
          },
        },
      ];

      const edges: AgentFlowCustomEdge[] = [
        {
          id: 'edge1',
          source: 'agent1',
          target: 'left1',
          sourceHandle: ResourceNodeType.Context, // handle that's on the left of the agent node
          targetHandle: Position.Right,
        },
        {
          id: 'edge2',
          source: 'agent1',
          target: 'right1',
          sourceHandle: ResourceNodeType.Tool, // handle that's on the right of the agent node
          targetHandle: Position.Left,
        },
        {
          id: 'edge3',
          source: 'agent1',
          target: 'bottom1',
          sourceHandle: ResourceNodeType.Escalation, // handle that's on the top of the agent node
          targetHandle: Position.Bottom,
        },
      ];

      const result = getAgentGroupBottomPosition(agent, nodes, edges);

      expect(result).toEqual({ x: 500, y: 630 }); // bottom1 is the lowest
    });

    it('handles measured dimensions when available', () => {
      const agent: AgentFlowCustomNode = {
        id: 'agent1',
        type: 'agent',
        position: { x: 100, y: 100 },
        measured: { width: 250, height: 150 },
        data: {
          name: 'Test Agent',
          description: 'Test agent description',
          definition: {},
        },
      };

      const result = getAgentGroupBottomPosition(agent, [], []);

      expect(result).toEqual({ x: 225, y: 250 }); // uses measured dimensions
    });
  });

  describe('autoArrangeNodes', () => {
    it('returns cloned nodes without modification when no agent nodes', () => {
      const nodes: AgentFlowCustomNode[] = [
        {
          id: 'resource1',
          type: 'resource',
          position: { x: 100, y: 100 },
          data: {
            type: 'tool',
            name: 'Resource 1',
            description: 'Test resource',
            projectType: ProjectType.Internal,
          },
        },
      ];

      const result = autoArrangeNodes(nodes, []);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(nodes[0]);
      expect(result).not.toBe(nodes); // should be cloned
    });

    it('positions root agent at origin', () => {
      const nodes: AgentFlowCustomNode[] = [
        {
          id: 'agent1',
          type: 'agent',
          position: { x: 500, y: 500 },
          data: {
            name: 'Test Agent',
            description: 'Test agent description',
            definition: {},
          },
        },
      ];

      const result = autoArrangeNodes(nodes, []);

      expect(result[0]?.position).toEqual({ x: 0, y: 0 });
    });

    it('arranges connected resources around agent', () => {
      const nodes: AgentFlowCustomNode[] = [
        {
          id: 'agent1',
          type: 'agent',
          position: { x: 0, y: 0 },
          width: 200,
          height: 140,
          data: {
            name: 'Test Agent',
            description: 'Test agent description',
            definition: {},
          },
        },
        {
          id: 'context1',
          type: 'resource',
          position: { x: 0, y: 0 },
          width: 100,
          height: 80,
          data: {
            type: 'context',
            name: 'Test Context',
            description: 'Test context description',
            projectType: ProjectType.Internal,
          },
        },
        {
          id: 'skill1',
          type: 'resource',
          position: { x: 0, y: 0 },
          width: 100,
          height: 80,
          data: {
            type: 'tool',
            name: 'Skill 1',
            description: 'Test skill 1',
            projectType: ProjectType.Internal,
            order: 1,
          },
        },
        {
          id: 'skill2',
          type: 'resource',
          position: { x: 0, y: 0 },
          width: 100,
          height: 80,
          data: {
            type: 'tool',
            name: 'Skill 2',
            description: 'Test skill 2',
            projectType: ProjectType.Internal,
            order: 2,
          },
        },
      ];

      const edges: AgentFlowCustomEdge[] = [
        {
          id: 'edge1',
          source: 'agent1',
          target: 'context1',
          sourceHandle: ResourceNodeType.Context, // handle that's on the bottom of the agent node
          targetHandle: Position.Bottom,
        },
        {
          id: 'edge2',
          source: 'agent1',
          target: 'skill1',
          sourceHandle: ResourceNodeType.Tool, // handle that's on the bottom of the agent node
          targetHandle: Position.Top,
        },
        {
          id: 'edge3',
          source: 'agent1',
          target: 'skill2',
          sourceHandle: ResourceNodeType.Tool, // handle that's on the bottom of the agent node
          targetHandle: Position.Top,
        },
      ];

      const result = autoArrangeNodes(nodes, edges);

      // Check model is positioned below the agent
      const context = result.find((n) => n.id === 'context1');
      const skill1 = result.find((n) => n.id === 'skill1');
      const skill2 = result.find((n) => n.id === 'skill2');

      // All nodes should be positioned below the agent
      expect(context?.position.y).toBeGreaterThan(140); // Below agent height
      expect(skill1?.position.y).toBeGreaterThan(140);
      expect(skill2?.position.y).toBeGreaterThan(140);

      // All nodes should be at roughly the same Y position (all at bottom)
      expect(Math.abs((context?.position.y || 0) - (skill1?.position.y || 0))).toBeLessThan(10);
      expect(Math.abs((skill1?.position.y || 0) - (skill2?.position.y || 0))).toBeLessThan(10);

      // But should be spaced horizontally
      expect(skill1?.position.x).not.toEqual(skill2?.position.x);
      expect(context?.position.x).not.toEqual(skill1?.position.x);
      expect(context?.position.x).not.toEqual(skill2?.position.x);
    });

    it('handles nested agents', () => {
      const nodes: AgentFlowCustomNode[] = [
        {
          id: 'agent1',
          type: 'agent',
          position: { x: 0, y: 0 },
          width: 200,
          height: 140,
          data: {
            name: 'Test Agent',
            description: 'Test agent description',
            definition: {},
          },
        },
        {
          id: 'agentResource',
          type: 'resource',
          position: { x: 0, y: 0 },
          width: 100,
          height: 80,
          data: {
            type: 'tool',
            name: 'Agent Resource',
            description: 'Test agent resource',
            projectType: ProjectType.Agent,
          },
        },
        {
          id: 'agent2',
          type: 'agent',
          position: { x: 0, y: 0 },
          width: 200,
          height: 140,
          data: {
            name: 'Nested Agent',
            description: 'Test nested agent',
            definition: {},
            parentNodeId: 'agentResource',
          },
        },
      ];

      const edges: AgentFlowCustomEdge[] = [
        {
          id: 'edge1',
          source: 'agent1',
          target: 'agentResource',
          sourceHandle: ResourceNodeType.Tool, // handle that's on the right of the agent node
          targetHandle: Position.Left,
        },
      ];

      const result = autoArrangeNodes(nodes, edges);

      // Check that nodes are positioned (agentResource should be positioned by the edge)
      const nestedAgent = result.find((n) => n.id === 'agent2');
      const agentResource = result.find((n) => n.id === 'agentResource');

      // AgentResource should be positioned to the right of agent1
      expect(agentResource?.position.x).toBeGreaterThan(0);

      // Nested agent should maintain its original position since it's not connected by edges
      // and the auto-layout doesn't currently handle parentNodeId relationships without edges
      expect(nestedAgent?.position.x).toBe(0);
      expect(nestedAgent?.position.y).toBe(0);
    });

    it('sorts nodes by order property', () => {
      const nodes: AgentFlowCustomNode[] = [
        {
          id: 'agent1',
          type: 'agent',
          position: { x: 0, y: 0 },
          width: 200,
          height: 140,
          data: {
            name: 'Test Agent',
            description: 'Test agent description',
            definition: {},
          },
        },
        {
          id: 'skill1',
          type: 'resource',
          position: { x: 0, y: 0 },
          width: 100,
          height: 80,
          data: {
            type: 'tool',
            name: 'Skill 1',
            description: 'Test skill 1',
            projectType: ProjectType.Internal,
            order: 2,
          },
        },
        {
          id: 'skill2',
          type: 'resource',
          position: { x: 0, y: 0 },
          width: 100,
          height: 80,
          data: {
            type: 'tool',
            name: 'Skill 2',
            description: 'Test skill 2',
            projectType: ProjectType.Internal,
            order: 1,
          },
        },
      ];

      const edges: AgentFlowCustomEdge[] = [
        {
          id: 'edge1',
          source: 'agent1',
          target: 'skill1',
          sourceHandle: ResourceNodeType.Tool, // handle that's on the bottom of the agent node
          targetHandle: Position.Top,
        },
        {
          id: 'edge2',
          source: 'agent1',
          target: 'skill2',
          sourceHandle: ResourceNodeType.Tool, // handle that's on the bottom of the agent node
          targetHandle: Position.Top,
        },
      ];

      const result = autoArrangeNodes(nodes, edges);

      const skill1 = result.find((n) => n.id === 'skill1');
      const skill2 = result.find((n) => n.id === 'skill2');

      // skill2 (order: 1) should be positioned to the left of skill1 (order: 2) when both are at bottom
      expect(skill2?.position.x).toBeLessThan(skill1?.position.x || 0);
    });

    it('adds offset for single nodes to avoid straight lines', () => {
      const nodes: AgentFlowCustomNode[] = [
        {
          id: 'agent1',
          type: 'agent',
          position: { x: 0, y: 0 },
          width: 200,
          height: 140,
          data: {
            name: 'Test Agent',
            description: 'Test agent description',
            definition: {},
          },
        },
        {
          id: 'context1',
          type: 'resource',
          position: { x: 0, y: 0 },
          width: 100,
          height: 80,
          data: {
            type: 'context',
            name: 'Context Resource',
            description: 'Test context resource',
            projectType: ProjectType.Internal,
          },
        },
      ];

      const edges: AgentFlowCustomEdge[] = [
        {
          id: 'edge1',
          source: 'agent1',
          target: 'context1',
          sourceHandle: 'top',
          targetHandle: 'bottom',
        },
      ];

      const result = autoArrangeNodes(nodes, edges);

      const context = result.find((n) => n.id === 'context1');
      // Single node should not be centered
      expect(context?.position.x).not.toEqual(50); // would be 50 if centered without offset
    });
  });
});
