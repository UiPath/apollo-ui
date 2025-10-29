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
    draggable: false, // Agent node is not draggable
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

  const baseNode = {
    id,
    type: "resource" as const,
    position: { x: 0, y: 0 },
    draggable: Boolean(props.allowDragging && props.mode === "design"),
  };

  const resourceId = `${resource.name}:${id}`;
  const finalId = parentNodeId ? `${parentNodeId}${NODE_ID_DELIMITER}${resourceId}` : resourceId;

  switch (resource.type) {
    case "tool":
      return {
        ...baseNode,
        id: finalId,
        data: {
          ...baseData,
          type: "tool",
          iconUrl: resource.iconUrl,
          projectType: resource.projectType,
          toolType: resource.toolType,
          projectId: resource.projectId,
          parentNodeId,
          isExpandable: resource.isExpandable,
          processName: resource.processName,
        },
      };
    case "context":
      return {
        ...baseNode,
        id: finalId,
        type: "resource",
        data: {
          ...baseData,
          type: "context",
          projectId: resource.projectId,
          parentNodeId,
        },
      };
    case "mcp":
      return {
        ...baseNode,
        id: finalId,
        data: {
          ...baseData,
          type: "mcp",
          slug: resource.slug,
          folderPath: resource.folderPath,
          availableTools: resource.availableTools,
          parentNodeId,
        },
      };
    case "memory":
      return {
        ...baseNode,
        id: finalId,
        data: {
          ...baseData,
          type: "memory",
          parentNodeId,
        },
      };
    case "escalation":
    default:
      return {
        ...baseNode,
        id: finalId,
        data: {
          ...baseData,
          type: "escalation",
          projectId: resource.projectId,
          parentNodeId,
        },
      };
  }
};

export const createResourceEdge = (
  agentNode: AgentFlowNode,
  resourceNode: AgentFlowResourceNode,
  props: AgentFlowProps
): AgentFlowCustomEdge => {
  const resourceType = resourceNode.data.type;
  const isViewMode = props.mode === "view";
  const isResourceActive = resourceNode.data.isActive ?? false;

  const createEdge = (source: string, target: string, sourceHandle: string, targetHandle: string): AgentFlowCustomEdge => {
    const id = `${source}${EDGE_ID_DELIMITER}${target}`;
    return {
      id,
      source,
      target,
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

  switch (resourceType) {
    case "tool":
      return createEdge(agentNode.id, resourceNode.id, ResourceNodeType.Tool, Position.Top);
    case "context":
      return createEdge(agentNode.id, resourceNode.id, ResourceNodeType.Context, Position.Top);
    case "mcp":
      return createEdge(agentNode.id, resourceNode.id, ResourceNodeType.Tool, Position.Top);
    case "memory":
      return createEdge(agentNode.id, resourceNode.id, ResourceNodeType.Memory, Position.Bottom);
    case "escalation":
    default:
      return createEdge(agentNode.id, resourceNode.id, ResourceNodeType.Escalation, Position.Top);
  }
};

/**
 * Computes nodes and edges for the agent flow visualization
 * @param props - The agent flow properties containing resources and spans
 * @returns Object containing arrays of nodes and edges for the flow
 */
export const computeNodesAndEdges = (
  props: AgentFlowProps,
  parentNodeId?: string
): { nodes: AgentFlowCustomNode[]; edges: AgentFlowCustomEdge[] } => {
  const agentNode = createAgentNode(props, parentNodeId);

  // Filter out MCP resources if the feature flag is disabled
  const filteredResources =
    props.enableMcpTools === false ? props.resources.filter((resource) => resource.type !== "mcp") : props.resources;

  const resourceNodes = filteredResources.map((resource, index) => createResourceNode(resource, index, props, agentNode.id));

  const edges = resourceNodes.map((resourceNode) => createResourceEdge(agentNode, resourceNode, props));

  const allNodes = [agentNode, ...resourceNodes];
  const arrangedNodes = autoArrangeNodes(allNodes, edges);

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
 * @returns Object containing arrays of suggestion nodes and edges
 */
export const computeSuggestionNodesAndEdges = (
  suggestionGroup: AgentFlowSuggestionGroup,
  props: AgentFlowProps,
  agentNode: AgentFlowNode,
  existingResources: AgentFlowResource[]
): { nodes: AgentFlowResourceNode[]; edges: AgentFlowCustomEdge[] } => {
  const suggestionNodes: AgentFlowResourceNode[] = [];
  const suggestionEdges: AgentFlowCustomEdge[] = [];

  for (const suggestion of suggestionGroup.suggestions) {
    if (suggestion.type === "add" && suggestion.resource) {
      // Create a placeholder node for the new resource
      const resource = suggestion.resource;
      const index = existingResources.length + suggestionNodes.length;
      const node = createResourceNode(resource, index, props, agentNode.id);

      // Mark it as a suggestion placeholder
      node.data = {
        ...node.data,
        isSuggestion: true,
        suggestionId: suggestion.id,
        suggestionType: "add",
        isPlaceholder: true,
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
