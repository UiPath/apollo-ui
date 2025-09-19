import { ResourceNodeType, ResourceNodeTypeToPosition } from "../components/AgentCanvas/AgentFlow.constants";
import type { AgentFlowCustomEdge, AgentFlowCustomNode } from "../types";
import { Position } from "@uipath/uix/xyflow/react";
import { isAgentFlowAgentNode, isAgentFlowResourceNode } from "../types";

const GROUP_DISTANCE_HORIZONTAL = 280;
const GROUP_DISTANCE_VERTICAL = 200;
const GROUP_SPACING = 160;
const AGENT_NODE_OFFSET_HORIZONTAL = 360;
const AGENT_NODE_OFFSET_VERTICAL_SMALL = 50;
const AGENT_NODE_OFFSET_VERTICAL_LARGE = 300;

// Size (diameter) of the resource node in the canvas
export const RESOURCE_NODE_SIZE = 80;
export const RESOURCE_NODE_ICON_WITH_SPACING_SIZE = 24;

const RESOURCE_NODE_BOUNDARY_ICON_POSITIONS = {
  "bottom-left": {
    top: (radius: number, offset: number) => Math.abs(-radius * (1 + Math.sqrt(2) / 2)) - offset,
    left: (radius: number, offset: number) => Math.abs(radius * (1 - Math.sqrt(2) / 2)) - offset,
  },
  "bottom-right": {
    top: (radius: number, offset: number) => Math.abs(-radius * (1 + Math.sqrt(2) / 2)) - offset,
    left: (radius: number, offset: number) => Math.abs(radius * (1 + Math.sqrt(2) / 2)) - offset,
  },
  "top-left": {
    top: (radius: number, offset: number) => Math.abs(radius * (Math.sqrt(2) / 2 - 1)) - offset,
    left: (radius: number, offset: number) => Math.abs(radius * (1 - Math.sqrt(2) / 2)) - offset,
  },
  "top-right": {
    top: (radius: number, offset: number) => Math.abs(radius * (Math.sqrt(2) / 2 - 1)) - offset,
    left: (radius: number, offset: number) => Math.abs(radius * (1 + Math.sqrt(2) / 2)) - offset,
  },
};

export const getResourceNodeBoundaryIconPosition = (position: "bottom-left" | "bottom-right" | "top-left" | "top-right") => {
  return RESOURCE_NODE_BOUNDARY_ICON_POSITIONS[position];
};

/** Utility function to get the bottom-most position of an agent group */
export const getAgentGroupBottomPosition = (
  agent: AgentFlowCustomNode,
  nodes: AgentFlowCustomNode[],
  edges: AgentFlowCustomEdge[]
): { x: number; y: number } => {
  const agentWidth = agent.measured?.width ?? agent.width ?? 0;
  const agentHeight = agent.measured?.height ?? agent.height ?? 0;
  const agentBottomY = agent.position.y + agentHeight;
  let bottomMostY = agentBottomY;
  let bottomMostX = agent.position.x + agentWidth / 2; // Default to agent center

  // Keep track of nodes connected to each handle
  const groups: Record<ResourceNodeType, AgentFlowCustomNode[]> = {
    [ResourceNodeType.Context]: [],
    [ResourceNodeType.Escalation]: [],
    [ResourceNodeType.MCP]: [],
    [ResourceNodeType.Model]: [],
    [ResourceNodeType.Tool]: [],
    [ResourceNodeType.Memory]: [],
  };

  // Group nodes by which handle they're connected to
  for (const edge of edges) {
    if (edge.source === agent.id && edge.sourceHandle && edge.sourceHandle in groups) {
      const node = nodes.find((n) => n.id === edge.target);
      if (node && edge.sourceHandle in groups) {
        const group = groups[edge.sourceHandle as keyof typeof groups];
        if (group) group.push(node);
      }
    } else if (edge.target === agent.id && edge.targetHandle && edge.targetHandle in groups) {
      const node = nodes.find((n) => n.id === edge.source);
      if (node && edge.targetHandle in groups) {
        const group = groups[edge.targetHandle as keyof typeof groups];
        if (group) group.push(node);
      }
    }
  }

  // Find the bottom-most position among all connected nodes
  for (const [_, handleNodes] of Object.entries(groups)) {
    for (const node of handleNodes) {
      const nodeHeight = node.measured?.height ?? node.height ?? 0;
      const nodeBottomY = node.position.y + nodeHeight;
      if (nodeBottomY > bottomMostY) {
        bottomMostY = nodeBottomY;
        bottomMostX = node.position.x + (node.measured?.width ?? node.width ?? 0) / 2;
      }
    }
  }

  return { x: bottomMostX, y: bottomMostY };
};

const arrangeAgent = (
  agent: AgentFlowCustomNode,
  clonedNodes: AgentFlowCustomNode[],
  edges: AgentFlowCustomEdge[],
  heightOffsets: number[],
  currentDepth: number
) => {
  const agentWidth = agent.measured?.width ?? agent.width ?? 0;
  const agentHeight = agent.measured?.height ?? agent.height ?? 0;
  const agentCenterX = agent.position.x + agentWidth / 2;
  const agentCenterY = agent.position.y + agentHeight / 2;

  // Keep track of nodes connected to each handle
  const groups: Record<ResourceNodeType, AgentFlowCustomNode[]> = {
    [ResourceNodeType.Context]: [],
    [ResourceNodeType.Escalation]: [],
    [ResourceNodeType.MCP]: [],
    [ResourceNodeType.Model]: [],
    [ResourceNodeType.Tool]: [],
    [ResourceNodeType.Memory]: [],
  };

  // Group nodes by which handle they're connected to
  for (const edge of edges) {
    if (edge.source === agent.id && edge.sourceHandle && edge.sourceHandle in groups) {
      const node = clonedNodes.find((n) => n.id === edge.target);
      if (node) groups[edge.sourceHandle as keyof typeof groups].push(node);
    } else if (edge.target === agent.id && edge.targetHandle && edge.targetHandle in groups) {
      const node = clonedNodes.find((n) => n.id === edge.source);
      if (node) groups[edge.targetHandle as keyof typeof groups].push(node);
    }
  }

  // sort nodes by order
  for (const key of Object.keys(groups)) {
    groups[key as keyof typeof groups].sort((a, b) => {
      if (!isAgentFlowResourceNode(a) || !isAgentFlowResourceNode(b)) return 0;
      const orderA = a.data.order || 0;
      const orderB = b.data.order || 0;
      return orderA - orderB;
    });
  }

  // Group handles by their position to handle multiple handles per position
  const positionGroups: Record<Position, Array<{ handleId: ResourceNodeType; nodes: AgentFlowCustomNode[] }>> = {
    [Position.Top]: [],
    [Position.Bottom]: [],
    [Position.Left]: [],
    [Position.Right]: [],
  };

  // Populate position groups
  for (const [handleId, nodes] of Object.entries(groups)) {
    const position = ResourceNodeTypeToPosition[handleId as ResourceNodeType];
    if (nodes.length > 0) {
      positionGroups[position].push({ handleId: handleId as ResourceNodeType, nodes });
    }
  }

  // Position nodes for each position
  for (const [position, handleGroups] of Object.entries(positionGroups)) {
    if (handleGroups.length === 0) continue;

    if (position === Position.Top || position === Position.Bottom) {
      // Handle top and bottom positions with potential multiple handle types
      const yPosition =
        position === Position.Top ? agent.position.y - GROUP_DISTANCE_VERTICAL : agent.position.y + agentHeight + GROUP_DISTANCE_VERTICAL;

      if (handleGroups.length === 1) {
        const handleGroup = handleGroups[0];
        if (!handleGroup) continue;
        const { handleId, nodes } = handleGroup;

        // Get handle X position based on handle type and agent node handle layout
        let handleCenterX = agentCenterX;
        if (handleId === ResourceNodeType.Model) {
          handleCenterX = agentCenterX - GROUP_SPACING;
        } else if (handleId === ResourceNodeType.Escalation) {
          handleCenterX = agentCenterX;
        } else if (handleId === ResourceNodeType.Tool) {
          handleCenterX = agentCenterX + GROUP_SPACING;
        }

        for (const [i, node] of nodes.entries()) {
          const nodeWidth = node.measured?.width ?? node.width ?? 0;
          const nodeHeight = node.measured?.height ?? node.height ?? 0;
          const singleNodeOffset = nodes.length === 1 ? -(GROUP_SPACING / 2) : 0;

          node.position = {
            x: handleCenterX - nodeWidth / 2 + (i - (nodes.length - 1) / 2) * GROUP_SPACING + singleNodeOffset,
            y: position === Position.Top ? yPosition - nodeHeight : yPosition,
          };
        }
      } else if (handleGroups.length === 2) {
        // Two handle types - position them on left and right sides
        // Sort by handleId to ensure consistent ordering
        const sortedGroups = handleGroups.sort((a, b) => a.handleId.localeCompare(b.handleId));

        for (const [groupIndex, { nodes }] of sortedGroups.entries()) {
          const isFirstGroup = groupIndex === 0; // First alphabetically goes left, second goes right

          for (const [i, node] of nodes.entries()) {
            const nodeWidth = node.measured?.width ?? node.width ?? 0;
            const nodeHeight = node.measured?.height ?? node.height ?? 0;

            if (isFirstGroup) {
              // Position expanding leftward
              const startX = agentCenterX - GROUP_SPACING;
              node.position = {
                x: startX - nodeWidth / 2 - i * GROUP_SPACING,
                y: position === Position.Top ? yPosition - nodeHeight : yPosition,
              };
            } else {
              // Position expanding rightward
              const startX = agentCenterX + GROUP_SPACING;
              node.position = {
                x: startX - nodeWidth / 2 + i * GROUP_SPACING,
                y: position === Position.Top ? yPosition - nodeHeight : yPosition,
              };
            }
          }
        }
      } else if (handleGroups.length === 3) {
        // Three handle types - position them on left, center, and right sides
        // Custom sort to ensure Model comes first, then Escalation, then Tool
        const sortedGroups = handleGroups.sort((a, b) => {
          const order: Record<string, number> = {
            [ResourceNodeType.Model]: 0,
            [ResourceNodeType.Escalation]: 1,
            [ResourceNodeType.Tool]: 2,
          };
          return (order[a.handleId] ?? 999) - (order[b.handleId] ?? 999);
        });

        // First, calculate escalation positions (center group)
        const escalationGroup = sortedGroups[1];
        const escalationNodes = escalationGroup?.nodes || [];
        const escalationCount = escalationNodes.length;

        // Calculate first and last escalation positions
        const firstEscalationOffset = escalationCount > 1 ? (-(escalationCount - 1) / 2) * GROUP_SPACING : 0;
        const lastEscalationOffset = escalationCount > 1 ? ((escalationCount - 1) / 2) * GROUP_SPACING : 0;
        const firstEscalationX = agentCenterX + firstEscalationOffset;
        const lastEscalationX = agentCenterX + lastEscalationOffset;

        for (const [groupIndex, { nodes }] of sortedGroups.entries()) {
          for (const [i, node] of nodes.entries()) {
            const nodeWidth = node.measured?.width ?? node.width ?? 0;
            const nodeHeight = node.measured?.height ?? node.height ?? 0;

            let targetX;
            if (groupIndex === 0) {
              // Model - position to the left of first escalation
              targetX = firstEscalationX - GROUP_SPACING - nodeWidth / 2;
            } else if (groupIndex === 1) {
              // Escalation - position in the center of agent node
              const nodeOffset = (i - (nodes.length - 1) / 2) * GROUP_SPACING;
              targetX = agentCenterX - nodeWidth / 2 + nodeOffset;
            } else {
              // Tool - position to the right of last escalation
              const nodeOffset = i * GROUP_SPACING;
              targetX = lastEscalationX + GROUP_SPACING + nodeOffset - nodeWidth / 2;
            }

            node.position = {
              x: targetX,
              y: position === Position.Top ? yPosition - nodeHeight : yPosition,
            };
          }
        }
      } else {
        // Four or more handle types - distribute them evenly across the bottom
        // Sort by handleId to ensure consistent ordering
        const sortedGroups = handleGroups.sort((a, b) => a.handleId.localeCompare(b.handleId));
        const totalGroups = sortedGroups.length;

        for (const [groupIndex, { nodes }] of sortedGroups.entries()) {
          for (const [i, node] of nodes.entries()) {
            const nodeWidth = node.measured?.width ?? node.width ?? 0;
            const nodeHeight = node.measured?.height ?? node.height ?? 0;

            // Calculate position based on group index and total groups
            const groupOffset = (groupIndex - (totalGroups - 1) / 2) * GROUP_SPACING * 2;
            const nodeOffset = (i - (nodes.length - 1) / 2) * GROUP_SPACING;

            node.position = {
              x: agentCenterX - nodeWidth / 2 + groupOffset + nodeOffset,
              y: position === Position.Top ? yPosition - nodeHeight : yPosition,
            };
          }
        }
      }
    } else if (position === Position.Left) {
      // Handle left position
      const handleGroup = handleGroups[0];
      if (!handleGroup) continue;
      const { nodes } = handleGroup;
      for (const [i, node] of nodes.entries()) {
        // Skip parent agent nodes
        if (isAgentFlowResourceNode(node) && node.data.projectType === "Agent") {
          continue;
        }

        const nodeWidth = node.measured?.width ?? node.width ?? 0;
        const nodeHeight = node.measured?.height ?? node.height ?? 0;

        // Check if this is a model node for special positioning
        const isModelNode = isAgentFlowResourceNode(node) && node.data.type === "model";

        if (isModelNode) {
          // Special positioning for model node alignment with agent handle
          const agentHandleY = agent.position.y + agentHeight / 2;
          const modelHandleOffset = 40; // Half of the 80px avatar height

          node.position = {
            x: agent.position.x - nodeWidth - GROUP_DISTANCE_HORIZONTAL,
            y: agentHandleY - modelHandleOffset,
          };
        } else {
          // Default left positioning
          node.position = {
            x: agent.position.x - nodeWidth - GROUP_DISTANCE_HORIZONTAL,
            y: agentCenterY - nodeHeight / 2 + (i - (nodes.length - 1) / 2) * GROUP_SPACING,
          };
        }
      }
    } else if (position === Position.Right) {
      // Handle right position
      const handleGroup = handleGroups[0];
      if (!handleGroup) continue;
      const { nodes } = handleGroup;
      for (const [i, node] of nodes.entries()) {
        const _nodeWidth = node.measured?.width ?? node.width ?? 0;
        const nodeHeight = node.measured?.height ?? node.height ?? 0;
        const singleNodeOffset = nodes.length === 1 ? -(GROUP_SPACING / 2) : 0;

        node.position = {
          x: agent.position.x + agentWidth + GROUP_DISTANCE_HORIZONTAL,
          y: agentCenterY - nodeHeight / 2 + (i - (nodes.length - 1) / 2) * GROUP_SPACING + singleNodeOffset,
        };

        // Handle recursive expansion for agent nodes connected to tools
        if (isAgentFlowResourceNode(node) && node.data.projectType === "Agent") {
          const agentNode = clonedNodes.find((n) => n.data.parentNodeId === node.id);

          if (agentNode) {
            const agentNodeY = Math.max(node.position.y, heightOffsets[currentDepth] ?? 0);

            // Check for upper edges using position mapping
            const hasUpperEdge = edges.some((edge) => {
              const edgePosition = ResourceNodeTypeToPosition[edge.targetHandle as ResourceNodeType];
              return edge.source === agentNode.id && edgePosition === Position.Top;
            });

            // Count left-connected nodes using position mapping
            const leftNodesConnectedToAgentNode = edges.filter((edge) => {
              const edgePosition = ResourceNodeTypeToPosition[edge.targetHandle as ResourceNodeType];
              return edge.source === agentNode.id && edgePosition === Position.Left;
            });

            agentNode.position = {
              x: node.position.x + (node.measured?.width ?? node.width ?? 0) + GROUP_DISTANCE_HORIZONTAL + AGENT_NODE_OFFSET_HORIZONTAL,
              y:
                agentNodeY +
                (hasUpperEdge ? AGENT_NODE_OFFSET_VERTICAL_LARGE : AGENT_NODE_OFFSET_VERTICAL_SMALL) +
                (heightOffsets[currentDepth] ? (leftNodesConnectedToAgentNode.length / 2) * GROUP_SPACING : 0),
            };

            const dimensions = arrangeAgent(agentNode, clonedNodes, edges, heightOffsets, currentDepth + 1);

            heightOffsets[currentDepth] = Math.max(heightOffsets[currentDepth] ?? 0, dimensions);
          }
        }
      }
    }
  }

  const xY = getAgentGroupBottomPosition(agent, clonedNodes, edges);
  return xY.y;
};

export const autoArrangeNodes = (nodes: AgentFlowCustomNode[], edges: AgentFlowCustomEdge[]): AgentFlowCustomNode[] => {
  const clonedNodes = structuredClone(nodes);

  const agentNodes = clonedNodes.filter(isAgentFlowAgentNode).find((node) => node.data.parentNodeId === undefined);

  if (agentNodes) {
    agentNodes.position = { x: 0, y: 0 };
    // array to store the height offset at each "nested" agent node
    const heightOffsets: number[] = [];
    arrangeAgent(agentNodes, clonedNodes, edges, heightOffsets, 0);
  }

  return clonedNodes;
};
