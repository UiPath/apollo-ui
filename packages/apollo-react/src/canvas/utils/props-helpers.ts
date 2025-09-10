import type { IRawSpan } from "@uipath/portal-shell-react";
import { NODE_DIMENSIONS } from "../components/BaseCanvas";
import type {
  AgentFlowCustomEdge,
  AgentFlowCustomNode,
  AgentFlowModel,
  AgentFlowNode,
  AgentFlowProps,
  AgentFlowResource,
  AgentFlowResourceNode,
} from "../types";
import { autoArrangeNodes } from "./auto-layout";
import { ResourceNodeType } from "../components/AgentCanvas/AgentFlow.constants";
import { Position } from "@xyflow/react";

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
    width: NODE_DIMENSIONS.agent.width,
    height: NODE_DIMENSIONS.agent.height,
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
    errors: resource.errors,
  };

  const baseNode = {
    id,
    type: "resource" as const,
    position: { x: 0, y: 0 },
    width: NODE_DIMENSIONS.resource.width,
    height: NODE_DIMENSIONS.resource.height,
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
        position: { x: 0, y: 0 },
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

const createModelNode = (props: AgentFlowProps, parentNodeId: string): AgentFlowResourceNode | null => {
  if (!props.model) return null;

  return {
    id: `${parentNodeId}${NODE_ID_DELIMITER}model`,
    type: "resource",
    position: { x: 0, y: 0 },
    width: NODE_DIMENSIONS.resource.width,
    height: NODE_DIMENSIONS.resource.height,
    data: {
      name: props.model.name,
      description: props.model.vendorName,
      type: "model",
      order: -1,
      isActive: props.activeResourceIds?.includes("model") ?? false,
      hasError: hasModelError(props.model, props.spans),
      hasSuccess: hasModelSuccess(props.model, props.spans),
      hasRunning: hasModelRunning(props.model, props.spans),
      iconUrl: props.model.iconUrl,
      parentNodeId,
    },
    draggable: false, // Single model node, not draggable
  };
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
      return createEdge(agentNode.id, resourceNode.id, ResourceNodeType.Tool, Position.Left);
    case "context":
      return createEdge(resourceNode.id, agentNode.id, Position.Bottom, ResourceNodeType.Context);
    case "model":
      return createEdge(resourceNode.id, agentNode.id, Position.Right, ResourceNodeType.Model);
    case "mcp":
      return createEdge(agentNode.id, resourceNode.id, ResourceNodeType.MCP, Position.Bottom);
    case "escalation":
    default:
      return createEdge(agentNode.id, resourceNode.id, ResourceNodeType.Escalation, Position.Top);
  }
};

/**
 * Computes nodes and edges for the agent flow visualization
 * @param props - The agent flow properties containing resources, model, and spans
 * @returns Object containing arrays of nodes and edges for the flow
 */
export const computeNodesAndEdges = (
  props: AgentFlowProps,
  parentNodeId?: string
): { nodes: AgentFlowCustomNode[]; edges: AgentFlowCustomEdge[] } => {
  const agentNode = createAgentNode(props, parentNodeId);
  const modelNode = createModelNode(props, agentNode.id);

  // Filter out MCP resources if the feature flag is disabled
  const filteredResources =
    props.enableMcpTools === false ? props.resources.filter((resource) => resource.type !== "mcp") : props.resources;

  const resourceNodes = filteredResources.map((resource, index) => createResourceNode(resource, index, props, agentNode.id));

  if (modelNode) resourceNodes.unshift(modelNode);

  const edges = resourceNodes.map((resourceNode) => createResourceEdge(agentNode, resourceNode, props));

  const allNodes = [agentNode, ...resourceNodes];
  const arrangedNodes = autoArrangeNodes(allNodes, edges);

  return {
    nodes: arrangedNodes,
    edges,
  };
};
