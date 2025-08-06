import { IRawSpan } from "@uipath/portal-shell-react";
import { NODE_DIMENSIONS } from "../components/BaseCanvas.constants";
import {
  AgentFlowCustomEdge,
  AgentFlowCustomNode,
  AgentFlowModel,
  AgentFlowNode,
  AgentFlowProps,
  AgentFlowResource,
  AgentFlowResourceNode,
} from "../types";
import { autoArrangeNodes } from "./auto-layout";

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
  return resource.name.replace(/\s+/g, "_");
};

// Helper function to check if a resource has a specific status
const hasResourceStatus = (resource: AgentFlowResource, spans: IRawSpan[], targetStatus: number): boolean => {
  for (const span of spans) {
    const attributes = span.Attributes ? JSON.parse(span.Attributes) : null;
    if (!attributes) continue;

    // Check for tool/context/escalation status
    if (resource.type === "context" || resource.type === "escalation" || resource.type === "tool") {
      const normalizedToolName = normalizeToolName(resource);

      if (attributes.toolName === normalizedToolName) {
        return span.Status === targetStatus;
      }
    }
  }
  return false;
};

// Helper function to check if a resource has an error status
const hasResourceError = (resource: AgentFlowResource, spans: IRawSpan[]): boolean => {
  return hasResourceStatus(resource, spans, SPAN_STATUS.ERROR);
};

// Helper function to check if a resource has a success status
const hasResourceSuccess = (resource: AgentFlowResource, spans: IRawSpan[]): boolean => {
  return hasResourceStatus(resource, spans, SPAN_STATUS.SUCCESS);
};

// Helper function to check if a resource has a running status
const hasResourceRunning = (resource: AgentFlowResource, spans: IRawSpan[]): boolean => {
  return hasResourceStatus(resource, spans, SPAN_STATUS.RUNNING);
};

// Helper function to check if a model has a specific status
const hasModelStatus = (_model: AgentFlowModel, spans: IRawSpan[], targetStatus: number): boolean => {
  for (const span of spans) {
    const attributes = span.Attributes ? JSON.parse(span.Attributes) : null;
    if (!attributes) continue;

    // Check for model status
    if (attributes.type === "completion") {
      return span.Status === targetStatus;
    }
  }
  return false;
};

// Helper function to check if a model has an error status
export const hasModelError = (model: AgentFlowModel, spans: IRawSpan[]): boolean => {
  return hasModelStatus(model, spans, SPAN_STATUS.ERROR);
};

// Helper function to check if a model has a success status
export const hasModelSuccess = (model: AgentFlowModel, spans: IRawSpan[]): boolean => {
  return hasModelStatus(model, spans, SPAN_STATUS.SUCCESS);
};

// Helper function to check if a model has a running status
export const hasModelRunning = (model: AgentFlowModel, spans: IRawSpan[]): boolean => {
  return hasModelStatus(model, spans, SPAN_STATUS.RUNNING);
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
    draggable: false,
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
    description: resource.description,
    order: index,
    isActive: props.activeResourceIds?.includes(id) ?? false,
    hasError: hasResourceError(resource, props.spans),
    hasSuccess: hasResourceSuccess(resource, props.spans),
    hasRunning: hasResourceRunning(resource, props.spans),
  };

  const baseNode = {
    id,
    type: "resource" as const,
    position: { x: 0, y: 0 },
    width: NODE_DIMENSIONS.resource.width,
    height: NODE_DIMENSIONS.resource.height,
    draggable: props.mode === "design",
  };

  const resourceId = `${resource.name}:${id}`;
  const finalId = parentNodeId ? `${parentNodeId}${NODE_ID_DELIMITER}${resourceId}` : resourceId;

  if (resource.type === "tool") {
    return {
      ...baseNode,
      id: finalId,
      data: {
        ...baseData,
        type: "tool" as const,
        iconUrl: resource.iconUrl,
        projectType: resource.projectType,
        parentNodeId: parentNodeId,
        isExpandable: resource.isExpandable,
        processName: resource.processName,
      },
      draggable: props.mode === "design",
    };
  } else if (resource.type === "context") {
    return {
      id: finalId,
      type: "resource",
      position: { x: 0, y: 0 },
      data: {
        ...baseData,
        type: "context" as const,
        parentNodeId: parentNodeId,
      },
      draggable: props.mode === "design",
    };
  }
  // escalation
  return {
    ...baseNode,
    id: finalId,
    data: {
      ...baseData,
      type: "escalation" as const,
      parentNodeId: parentNodeId,
    },
  };
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
      type: "model" as const,
      order: -1,
      isActive: props.activeResourceIds?.includes("model") ?? false,
      hasError: hasModelError(props.model, props.spans),
      hasSuccess: hasModelSuccess(props.model, props.spans),
      hasRunning: hasModelRunning(props.model, props.spans),
      iconUrl: props.model.iconUrl,
      parentNodeId: parentNodeId,
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

  const createEdge = (
    source: string,
    target: string,
    sourceHandle: string,
    targetHandle: string
  ): AgentFlowCustomEdge => {
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

  let edge: AgentFlowCustomEdge;

  if (resourceType === "tool") {
    edge = createEdge(agentNode.id, resourceNode.id, "right", "left");
  } else if (resourceType === "context") {
    edge = createEdge(resourceNode.id, agentNode.id, "bottom", "top");
  } else if (resourceType === "model") {
    edge = createEdge(resourceNode.id, agentNode.id, "right", "left");
  } else {
    // escalation
    edge = createEdge(agentNode.id, resourceNode.id, "bottom", "top");
  }

  return edge;
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
  const resourceNodes = props.resources.map((resource, index) =>
    createResourceNode(resource, index, props, agentNode.id)
  );

  if (modelNode) resourceNodes.unshift(modelNode);

  const edges = resourceNodes.map((resourceNode) => createResourceEdge(agentNode, resourceNode, props));

  const allNodes = [agentNode, ...resourceNodes];
  const arrangedNodes = autoArrangeNodes(allNodes, edges);

  return {
    nodes: arrangedNodes,
    edges,
  };
};
