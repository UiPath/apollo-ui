import type { IRawSpan } from "@uipath/portal-shell-react";
import type {
  AgentFlowCustomEdge,
  AgentFlowCustomNode,
  AgentFlowModel,
  AgentFlowNode,
  AgentFlowProps,
  AgentFlowResource,
  AgentFlowResourceNode,
  AgentFlowSuggestionGroup,
} from "../types";
import { isAgentFlowResourceNode } from "../types";
import { autoArrangeNodes } from "./auto-layout";
import { ResourceNodeType } from "../components/AgentCanvas/AgentFlow.constants";
import { Position } from "@uipath/uix/xyflow/react";

// Status constants
const SPAN_STATUS = {
  RUNNING: 0,
  SUCCESS: 1,
  ERROR: 2,
} as const;
export const NODE_ID_DELIMITER = "=>";
export const EDGE_ID_DELIMITER = "::";

const getResourceNodeId = (resource: AgentFlowResource): string => {
  return resource.id;
};

// Helper function to normalize tool names
const normalizeToolName = (resource: AgentFlowResource): string => {
  if (resource.type === "escalation") {
    return `escalate_${resource.name.toLowerCase().replace(/\s/g, "_")}`;
  }
  if (resource.type === "mcp") {
    return `mcp_${resource.name.toLowerCase().replace(/\s/g, "_")}`;
  }
  return resource.name.replace(/\s+/g, "_");
};

// Helper function to check if a resource has a specific status
const hasResourceStatus = (resource: AgentFlowResource, spans: IRawSpan[], targetStatus: number): boolean => {
  for (const span of spans) {
    const attributes = span.Attributes ? JSON.parse(span.Attributes) : null;
    if (!attributes) continue;

    // Check for tool/context/escalation/mcp status
    if (resource.type === "context" || resource.type === "escalation" || resource.type === "tool" || resource.type === "mcp") {
      const normalizedToolName = normalizeToolName(resource);

      if (attributes.toolName === normalizedToolName && span.Status === targetStatus) {
        return true;
      }
    }
  }
  return false;
};

// Helper function to check if a resource has a running status
export const hasResourceRunning = (resource: AgentFlowResource, spans: IRawSpan[]): boolean => {
  return hasResourceStatus(resource, spans, SPAN_STATUS.RUNNING);
};

// Helper function to check if a resource has an error status
export const hasResourceError = (resource: AgentFlowResource, spans: IRawSpan[]): boolean => {
  return hasResourceStatus(resource, spans, SPAN_STATUS.ERROR) || Boolean(resource.errors?.length);
};

// Helper function to check if a resource has a success status
export const hasResourceSuccess = (resource: AgentFlowResource, spans: IRawSpan[]): boolean => {
  // Only show success if there are no running spans for this resource
  if (hasResourceRunning(resource, spans)) {
    return false;
  }
  return hasResourceStatus(resource, spans, SPAN_STATUS.SUCCESS);
};

// Helper function to check if a model has a specific status
const hasModelStatus = (_model: AgentFlowModel, spans: IRawSpan[], targetStatus: number): boolean => {
  for (const span of spans) {
    const attributes = span.Attributes ? JSON.parse(span.Attributes) : null;
    if (!attributes) continue;

    // Check for model status
    if (attributes.type === "completion" && span.Status === targetStatus) {
      return true;
    }
  }
  return false;
};

// Helper function to check if a model has an error status
export const hasModelError = (model: AgentFlowModel, spans: IRawSpan[]): boolean => {
  return hasModelStatus(model, spans, SPAN_STATUS.ERROR);
};

// Helper function to check if a model has a running status
export const hasModelRunning = (model: AgentFlowModel, spans: IRawSpan[]): boolean => {
  return hasModelStatus(model, spans, SPAN_STATUS.RUNNING);
};

// Helper function to check if a model has a success status
export const hasModelSuccess = (model: AgentFlowModel, spans: IRawSpan[]): boolean => {
  // Only show success if there are no running spans for this model
  if (hasModelRunning(model, spans)) {
    return false;
  }
  return hasModelStatus(model, spans, SPAN_STATUS.SUCCESS);
};

// Helper function to check if an agent has a running status
export const hasAgentRunning = (spans: IRawSpan[]): boolean => {
  for (const span of spans) {
    const attributes = span.Attributes ? JSON.parse(span.Attributes) : null;
    if (!attributes) continue;

    // Check for agent run status
    if (attributes.type === "agentRun") {
      const isRunning = span.Status === SPAN_STATUS.RUNNING;
      return isRunning;
    }
  }
  return false;
};

const createAgentNode = (props: AgentFlowProps, parentNodeId?: string): AgentFlowNode => {
  const agentId = parentNodeId
    ? `${parentNodeId}${NODE_ID_DELIMITER}${props.definition.processKey}`
    : (props.definition.processKey as string) || "agent"; // fallback would only be for design time which won't have expanded agents

  return {
    id: agentId,
    type: "agent",
    position: { x: 0, y: 0 },
    data: {
      name: props.name,
      description: props.description,
      definition: props.definition,
      parentNodeId,
    },
    draggable: Boolean(props.allowDragging && props.mode === "design"), // Agent node is draggable in design mode, not in view mode
  };
};

const createResourceNode = (
  resource: AgentFlowResource,
  index: number,
  props: AgentFlowProps,
  parentNodeId: string
): AgentFlowResourceNode => {
  const id = getResourceNodeId(resource);

  const baseData = {
    name: resource.name,
    originalName: resource.originalName,
    description: resource.description,
    order: index,
    isActive: props.activeResourceIds?.includes(id) ?? false,
    hasError: hasResourceError(resource, props.spans),
    hasSuccess: hasResourceSuccess(resource, props.spans),
    hasRunning: hasResourceRunning(resource, props.spans),
    hasBreakpoint: resource.hasBreakpoint ?? false,
    isCurrentBreakpoint: resource.isCurrentBreakpoint ?? false,
    hasGuardrails: resource.hasGuardrails ?? false,
    isDisabled: resource.isDisabled ?? false,
    errors: resource.errors,
  };

  // Check if resource has explicit position defined
  const hasExplicitPosition = "position" in resource && typeof resource.position === "object" && resource.position !== null;

  // React Flow requires a position value, so we use {x: 0, y: 0} as placeholder when undefined
  // This will be overwritten by auto-layout for nodes without explicit positions
  const position = hasExplicitPosition ? (resource.position as { x: number; y: number }) : { x: 0, y: 0 };

  const resourceId = `${resource.name}:${id}`;
  const finalId = parentNodeId ? `${parentNodeId}${NODE_ID_DELIMITER}${resourceId}` : resourceId;

  // Helper to create base node structure
  const createBaseNode = (data: AgentFlowResourceNode["data"]): AgentFlowResourceNode => {
    const node: AgentFlowResourceNode = {
      id: finalId,
      type: "resource" as const,
      position,
      draggable: Boolean(props.allowDragging && props.mode === "design"),
      data,
      hasExplicitPosition,
    };

    return node;
  };

  switch (resource.type) {
    case "tool":
      return createBaseNode({
        ...baseData,
        type: "tool",
        iconUrl: resource.iconUrl,
        projectType: resource.projectType,
        toolType: resource.toolType,
        projectId: resource.projectId,
        parentNodeId,
        isExpandable: resource.isExpandable,
        processName: resource.processName,
      });
    case "context":
      return createBaseNode({
        ...baseData,
        type: "context",
        projectId: resource.projectId,
        parentNodeId,
      });
    case "mcp":
      return createBaseNode({
        ...baseData,
        type: "mcp",
        slug: resource.slug,
        folderPath: resource.folderPath,
        availableTools: resource.availableTools,
        parentNodeId,
      });
    case "memorySpace":
      return createBaseNode({
        ...baseData,
        type: "memorySpace",
        parentNodeId,
      });
    case "escalation":
    default:
      return createBaseNode({
        ...baseData,
        type: "escalation",
        projectId: resource.projectId,
        parentNodeId,
      });
  }
};

// Calculate optimal edge handles based on relative positions of agent and resource nodes
const calculateOptimalHandles = (
  agentNode: AgentFlowNode,
  resourceNode: AgentFlowResourceNode
): { sourceHandle: string; targetHandle: Position } => {
  const resourceType = resourceNode.data.type;

  // Get agent node center Y position
  const agentHeight = agentNode.measured?.height ?? agentNode.height ?? 0;
  const agentCenterY = agentNode.position.y + agentHeight / 2;

  // Get resource node center Y position
  const resourceHeight = resourceNode.measured?.height ?? resourceNode.height ?? 0;
  const resourceCenterY = resourceNode.position.y + resourceHeight / 2;

  // Determine source handle based on resource type
  let sourceHandle: string;
  switch (resourceType) {
    case "context":
      sourceHandle = ResourceNodeType.Context;
      break;
    case "escalation":
      sourceHandle = ResourceNodeType.Escalation;
      break;
    case "tool":
      sourceHandle = ResourceNodeType.Tool;
      break;
    case "mcp":
      sourceHandle = ResourceNodeType.Tool;
      break;
    case "memorySpace":
      sourceHandle = ResourceNodeType.MemorySpace;
      break;
    default:
      sourceHandle = resourceType;
      break;
  }

  // If resource is above the agent, connect to bottom of resource
  // If resource is below the agent, connect to top of resource
  const targetHandle = resourceCenterY < agentCenterY ? Position.Bottom : Position.Top;

  return { sourceHandle, targetHandle };
};

export const createResourceEdge = (
  agentNode: AgentFlowNode,
  resourceNode: AgentFlowResourceNode,
  props: AgentFlowProps
): AgentFlowCustomEdge => {
  const isViewMode = props.mode === "view";
  const isResourceActive = resourceNode.data.isActive ?? false;

  // Calculate optimal handles based on positions
  const { sourceHandle, targetHandle } = calculateOptimalHandles(agentNode, resourceNode);

  const id = `${agentNode.id}${EDGE_ID_DELIMITER}${resourceNode.id}`;
  return {
    id,
    source: agentNode.id,
    target: resourceNode.id,
    sourceHandle,
    targetHandle,
    type: "default",
    data: {
      label: null,
    },
    animated: isViewMode && isResourceActive,
    selectable: false,
  };
};

/**
 * Computes nodes and edges for the agent flow visualization
 * @param props - The agent flow properties containing resources and spans
 * @param existingNodes - Optional existing nodes to preserve order values
 * @returns Object containing arrays of nodes and edges for the flow
 */
export const computeNodesAndEdges = (
  props: AgentFlowProps,
  parentNodeId?: string,
  existingNodes?: AgentFlowCustomNode[]
): { nodes: AgentFlowCustomNode[]; edges: AgentFlowCustomEdge[] } => {
  const agentNode = createAgentNode(props, parentNodeId);

  // Filter out MCP resources if the feature flag is disabled
  const filteredResources =
    props.enableMcpTools === false ? props.resources.filter((resource) => resource.type !== "mcp") : props.resources;

  // Build a map of existing orders by resource ID (for both full ID and base ID)
  const existingOrderMap = new Map<string, number>();
  let maxExistingOrder = -1;

  if (existingNodes) {
    for (const node of existingNodes) {
      // Only process resource nodes with order property
      if (!isAgentFlowResourceNode(node)) continue;
      if (node.data.order === undefined) continue;

      // Store by full node ID
      existingOrderMap.set(node.id, node.data.order);

      // Also store by base resource ID (extracted from node ID)
      const parts = node.id.split(NODE_ID_DELIMITER);
      const baseId = parts[parts.length - 1] ?? node.id;
      const resourceIdPart = baseId.split(":")[1];
      if (resourceIdPart) {
        existingOrderMap.set(resourceIdPart, node.data.order);
      }

      maxExistingOrder = Math.max(maxExistingOrder, node.data.order);
    }
  }

  let nextOrderIndex = maxExistingOrder + 1;

  const resourceNodes = filteredResources.map((resource) => {
    const resourceId = getResourceNodeId(resource);

    // Check if this resource already has an order (preserve it)
    let order = existingOrderMap.get(resourceId);

    // If no existing order found, assign the next available order
    if (order === undefined) {
      order = nextOrderIndex++;
    }

    return createResourceNode(resource, order, props, agentNode.id);
  });

  const edges = resourceNodes.map((resourceNode) => createResourceEdge(agentNode, resourceNode, props));

  const allNodes = [agentNode, ...resourceNodes];
  const arrangedNodes = autoArrangeNodes(allNodes, edges, props.agentNodePosition);

  return {
    nodes: arrangedNodes,
    edges,
  };
};

/**
 * Computes suggestion nodes and edges from a suggestion group
 * @param suggestionGroup - The suggestion group containing suggestions
 * @param props - The agent flow properties
 * @param agentNode - The agent node to connect suggestions to
 * @param existingResources - Existing resources to check for updates/deletes
 * @param existingNodes - Optional existing nodes to preserve order values
 * @returns Object containing arrays of suggestion nodes and edges
 */
export const computeSuggestionNodesAndEdges = (
  suggestionGroup: AgentFlowSuggestionGroup,
  props: AgentFlowProps,
  agentNode: AgentFlowNode,
  existingResources: AgentFlowResource[],
  existingNodes?: AgentFlowCustomNode[]
): { nodes: AgentFlowResourceNode[]; edges: AgentFlowCustomEdge[] } => {
  const suggestionNodes: AgentFlowResourceNode[] = [];
  const suggestionEdges: AgentFlowCustomEdge[] = [];

  // Build a map of existing orders by suggestion ID
  const existingOrderBySuggestionId = new Map<string, number>();
  let maxExistingOrder = existingResources.length - 1;

  if (existingNodes) {
    for (const node of existingNodes) {
      if (!isAgentFlowResourceNode(node)) continue;
      if (node.data.order === undefined) continue;

      // Track max order
      maxExistingOrder = Math.max(maxExistingOrder, node.data.order);

      // If this is a suggestion node, store its order by suggestion ID
      if (node.data.suggestionId) {
        existingOrderBySuggestionId.set(node.data.suggestionId, node.data.order);
      }
    }
  }

  let nextOrderIndex = maxExistingOrder + 1;

  for (const suggestion of suggestionGroup.suggestions) {
    if (suggestion.type === "add" && suggestion.resource) {
      // Create a placeholder node for the new resource
      const resource = suggestion.resource;

      // Check if this suggestion already has an order (preserve it)
      let order = existingOrderBySuggestionId.get(suggestion.id);

      // If no existing order found, assign the next available order
      if (order === undefined) {
        order = nextOrderIndex++;
      }

      const node = createResourceNode(resource, order, props, agentNode.id);

      // Mark it as a suggestion placeholder
      // For standalone suggestions, don't set isSuggestion to true (they use click-to-accept/reject instead of toolbar)
      node.data = {
        ...node.data,
        isSuggestion: !suggestion.isStandalone,
        suggestionId: suggestion.id,
        suggestionType: "add",
        isPlaceholder: true,
        // If suggestion is processing, show running state
        hasRunning: suggestion.isProcessing,
      };

      // Make placeholder nodes semi-transparent
      node.style = {
        ...node.style,
        // opacity: 0.6,
      };

      suggestionNodes.push(node);
      suggestionEdges.push(createResourceEdge(agentNode, node, props));
    }
    // For 'update' and 'delete' types, we'll mark existing nodes in the store
    // No new nodes are created for these types
  }

  return {
    nodes: suggestionNodes,
    edges: suggestionEdges,
  };
};
