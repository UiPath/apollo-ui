import {
  AgentFlowCustomEdge,
  AgentFlowCustomNode,
  isAgentFlowAgentNode,
  isAgentFlowResourceNode,
} from "../types";

const GROUP_DISTANCE_HORIZONTAL = 280;
const GROUP_DISTANCE_VERTICAL = 200;
const GROUP_SPACING = 160;
const AGENT_NODE_OFFSET_HORIZONTAL = 360;
const AGENT_NODE_OFFSET_VERTICAL_SMALL = 50;
const AGENT_NODE_OFFSET_VERTICAL_LARGE = 300;

// Utility function to get the bottom-most position of an agent group
export const getAgentGroupBottomPosition = (
  agent: AgentFlowCustomNode,
  nodes: AgentFlowCustomNode[],
  edges: AgentFlowCustomEdge[]
): { x: number; y: number } => {
  const agentWidth = agent.measured?.width ?? agent.width ?? 0;
  const agentHeight = agent.measured?.height ?? agent.height ?? 0;
  const agentBottomY = agent.position.y + agentHeight;

  // Group connected nodes by direction
  const groups: Record<string, AgentFlowCustomNode[]> = {
    left: [],
    right: [],
    top: [],
    bottom: [],
  };

  for (const edge of edges) {
    if (edge.source === agent.id && edge.sourceHandle) {
      const node = nodes.find((n) => n.id === edge.target);
      if (node) groups[edge.sourceHandle].push(node);
    } else if (edge.target === agent.id && edge.targetHandle) {
      const node = nodes.find((n) => n.id === edge.source);
      if (node) groups[edge.targetHandle].push(node);
    }
  }

  // Find the bottom-most position among all connected nodes
  let bottomMostY = agentBottomY;
  let bottomMostX = agent.position.x + agentWidth / 2; // Default to agent center

  // Check bottom nodes
  for (const node of groups.bottom) {
    const nodeHeight = node.measured?.height ?? node.height ?? 0;
    const nodeBottomY = node.position.y + nodeHeight;
    if (nodeBottomY > bottomMostY) {
      bottomMostY = nodeBottomY;
      bottomMostX = node.position.x + (node.measured?.width ?? node.width ?? 0) / 2;
    }
  }

  // Check left nodes
  for (const node of groups.left) {
    const nodeHeight = node.measured?.height ?? node.height ?? 0;
    const nodeBottomY = node.position.y + nodeHeight;
    if (nodeBottomY > bottomMostY) {
      bottomMostY = nodeBottomY;
      bottomMostX = node.position.x + (node.measured?.width ?? node.width ?? 0) / 2;
    }
  }

  // Check right nodes
  for (const node of groups.right) {
    const nodeHeight = node.measured?.height ?? node.height ?? 0;
    const nodeBottomY = node.position.y + nodeHeight;
    if (nodeBottomY > bottomMostY) {
      bottomMostY = nodeBottomY;
      bottomMostX = node.position.x + (node.measured?.width ?? node.width ?? 0) / 2;
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

  // group nodes by which handle they're connected to
  const groups: Record<string, AgentFlowCustomNode[]> = {
    left: [],
    right: [],
    top: [],
    bottom: [],
  };
  for (const edge of edges) {
    if (edge.source === agent.id && edge.sourceHandle) {
      const node = clonedNodes.find((n) => n.id === edge.target);
      if (node) groups[edge.sourceHandle].push(node);
    } else if (edge.target === agent.id && edge.targetHandle) {
      const node = clonedNodes.find((n) => n.id === edge.source);
      if (node) groups[edge.targetHandle].push(node);
    }
  }

  // sort nodes by order
  for (const key of Object.keys(groups)) {
    groups[key].sort((a, b) => {
      if (!isAgentFlowResourceNode(a) || !isAgentFlowResourceNode(b)) return 0;
      const orderA = a.data.order || 0;
      const orderB = b.data.order || 0;
      return orderA - orderB;
    });
  }

  // top
  for (const [i, node] of groups.top.entries()) {
    const nodeWidth = node.measured?.width ?? node.width ?? 0;
    const nodeHeight = node.measured?.height ?? node.height ?? 0;
    // Add offset for single context node to avoid straight line
    const singleNodeOffset = groups.top.length === 1 ? -(GROUP_SPACING / 2) : 0;
    node.position = {
      x: agentCenterX - nodeWidth / 2 + (i - (groups.top.length - 1) / 2) * GROUP_SPACING + singleNodeOffset,
      y: agent.position.y - nodeHeight - GROUP_DISTANCE_VERTICAL,
    };
  }

  // bottom
  for (const [i, node] of groups.bottom.entries()) {
    const nodeWidth = node.measured?.width ?? node.width ?? 0;
    // Add offset for single escalation node to avoid straight line
    const singleNodeOffset = groups.bottom.length === 1 ? -(GROUP_SPACING / 2) : 0;
    node.position = {
      x:
        agentCenterX -
        nodeWidth / 2 +
        (i - (groups.bottom.length - 1) / 2) * GROUP_SPACING +
        singleNodeOffset,
      y: agent.position.y + agentHeight + GROUP_DISTANCE_VERTICAL,
    };
  }

  // left
  for (const [i, node] of groups.left.entries()) {
    // if the left node is a parent node, ignore it
    if (isAgentFlowResourceNode(node) && node.data.projectType === "Agent") {
      continue;
    }

    const nodeWidth = node.measured?.width ?? node.width ?? 0;
    const nodeHeight = node.measured?.height ?? node.height ?? 0;

    // special positioning for model node
    if (isAgentFlowResourceNode(node) && node.data.type === "model") {
      // For perfect alignment, we need to consider that:
      // - Agent node height is 140px, handle is at center (70px from top)
      // - Resource node displays as 80x80 avatar, handle is at center (40px from top)
      // So we need to align these center points
      const agentHandleY = agent.position.y + agentHeight / 2;
      const modelHandleOffset = 40; // Half of the 80px avatar height

      node.position = {
        x: agent.position.x - nodeWidth - GROUP_DISTANCE_HORIZONTAL,
        y: agentHandleY - modelHandleOffset,
      };
    } else {
      node.position = {
        x: agent.position.x - nodeWidth - GROUP_DISTANCE_HORIZONTAL,
        y: agentCenterY - nodeHeight / 2 + (i - (groups.left.length - 1) / 2) * GROUP_SPACING,
      };
    }
  }

  // right
  for (const [i, node] of groups.right.entries()) {
    const nodeHeight = node.measured?.height ?? node.height ?? 0;
    const nodeWidth = node.measured?.width ?? node.width ?? 0;

    const singleNodeOffset = groups.right.length === 1 ? -(GROUP_SPACING / 2) : 0;
    node.position = {
      x: agent.position.x + agentWidth + GROUP_DISTANCE_HORIZONTAL,
      y:
        agentCenterY -
        nodeHeight / 2 +
        (i - (groups.right.length - 1) / 2) * GROUP_SPACING +
        singleNodeOffset,
    };

    if (isAgentFlowResourceNode(node) && node.data.projectType === "Agent") {
      const agentNode = clonedNodes.find((n) => n.data.parentNodeId === node.id);

      if (agentNode) {
        const agentNodeY = Math.max(node.position.y, heightOffsets[currentDepth] ?? 0);

        const hasUpperEdge = edges.some(
          (edge) => edge.source === agentNode.id && edge.targetHandle === "top"
        );

        // count how many right nodes are connected to this agent node
        const rightNodesConnectedToAgentNode = edges.filter(
          (edge) => edge.source === agentNode.id && edge.targetHandle === "left"
        );

        agentNode.position = {
          x: node.position.x + nodeWidth + GROUP_DISTANCE_HORIZONTAL + AGENT_NODE_OFFSET_HORIZONTAL,
          y:
            agentNodeY +
            (hasUpperEdge ? AGENT_NODE_OFFSET_VERTICAL_LARGE : AGENT_NODE_OFFSET_VERTICAL_SMALL) +
            // 1. if no height offset, this is the only agent node in the current depth so we dont need to move it down,
            // 2. if there are right nodes connected to this agent node, we need to move the agent node down by half of the group spacing from the last known height offset
            (heightOffsets[currentDepth] ? (rightNodesConnectedToAgentNode.length / 2) * GROUP_SPACING : 0),
        };

        const dimensions = arrangeAgent(agentNode, clonedNodes, edges, heightOffsets, currentDepth + 1);

        heightOffsets[currentDepth] = Math.max(heightOffsets[currentDepth] ?? 0, dimensions);
      }
    }
  }

  const xY = getAgentGroupBottomPosition(agent, clonedNodes, edges);
  return xY.y;
};

export const autoArrangeNodes = (
  nodes: AgentFlowCustomNode[],
  edges: AgentFlowCustomEdge[]
): AgentFlowCustomNode[] => {
  const clonedNodes = structuredClone(nodes);

  const agentNodes = clonedNodes
    .filter(isAgentFlowAgentNode)
    .find((node) => node.data.parentNodeId === undefined);

  if (agentNodes) {
    agentNodes.position = { x: 0, y: 0 };
    // array to store the height offset at each "nested" agent node
    const heightOffsets: number[] = [];
    arrangeAgent(agentNodes, clonedNodes, edges, heightOffsets, 0);
  }

  return clonedNodes;
};
