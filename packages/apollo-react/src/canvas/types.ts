import type { Edge, Node, Viewport as ReactFlowViewport, CoordinateExtent } from "@xyflow/react";
import type { NodeProps } from "@xyflow/system";
import type { IRawSpan } from "@uipath/portal-shell-react";
import type { BaseCanvasRef } from "./components/BaseCanvas/BaseCanvas.types";

export enum ProjectType {
  Agent = "Agent",
  Api = "Api",
}

export type Viewport = ReactFlowViewport;

export type AgentFlowModel = {
  name: string;
  vendorName: string;
  iconUrl: string;
};

export type AgentFlowToolResource = {
  id: string;
  type: "tool";
  name: string;
  description: string;
  iconUrl: string;
  guardrail: Record<string, unknown> | null;
  projectType?: string;
  isExpandable?: boolean;
  processName?: string;
};

export type AgentFlowContextResource = {
  id: string;
  type: "context";
  name: string;
  description: string;
};

export type AgentFlowEscalationResource = {
  id: string;
  type: "escalation";
  name: string;
  description: string;
};

export type AgentFlowResource = AgentFlowContextResource | AgentFlowEscalationResource | AgentFlowToolResource;
export type AgentFlowResourceType = AgentFlowResource["type"];

export type SpanAttributes = Record<string, unknown>;

export type AgentFlowProps = {
  mode: "design" | "view";

  // all modes
  definition: Record<string, unknown>;
  spans: IRawSpan[];
  name: string;
  description: string;
  model: AgentFlowModel | null;
  resources: AgentFlowResource[];
  onSelectResource?: (resourceId: string | null) => void;
  onExpandResource?: (resourceId: string, resource: AgentFlowResourceNodeData) => void;
  onCollapseResource?: (resourceId: string, resource: AgentFlowResourceNodeData) => void;
  // span <-> node mapping
  setSpanForSelectedNode?: (node: AgentFlowCustomNode, nodes: AgentFlowCustomNode[]) => void;
  getNodeFromSelectedSpan?: (nodes: AgentFlowCustomNode[]) => AgentFlowCustomNode | null;

  // design mode
  onAddModel?: () => void;
  onRemoveModel?: () => void;
  onAddResource?: (type: AgentFlowResourceType) => void;
  onRemoveResource?: (resource: AgentFlowResource) => void;
  onArgumentsClick?: () => void;
  onAgentNodeClick?: () => void;

  // view mode
  activeResourceIds?: string[];

  // timeline player
  enableTimelinePlayer?: boolean;

  // translations
  agentNodeTranslations?: AgentNodeTranslations;
  resourceNodeTranslations?: ResourceNodeTranslations;

  // canvas ref for imperative control
  canvasRef?: React.Ref<BaseCanvasRef<AgentFlowCustomNode, AgentFlowCustomEdge>>;
};

export type AgentFlowNodeData = {
  name: string;
  description: string;
  definition: Record<string, unknown>; // TODO: NEED schema/Agent type definition
  parentNodeId?: string;
};
export type AgentFlowNode = Node<AgentFlowNodeData, "agent"> & {
  extent?: "parent" | CoordinateExtent | undefined;
};
export type AgentFlowNodeProps = NodeProps<AgentFlowNode>;

type ToolResourceData = {
  type: "tool";
};
type ContextResourceData = {
  type: "context";
};
type EscalationResourceData = {
  type: "escalation";
};
type ModelResourceData = {
  type: "model";
};

export type AgentFlowResourceNodeData = (ContextResourceData | EscalationResourceData | ModelResourceData | ToolResourceData) & {
  name: string;
  description: string;
  parentNodeId?: string;
  isActive?: boolean;
  hasError?: boolean;
  hasSuccess?: boolean;
  hasRunning?: boolean;
  countBadgeValue?: number;

  order?: number;
  originalPosition?: { x: number; y: number };
  iconUrl?: string;
  projectType?: string;
  isExpandable?: boolean;
  processName?: string;
};
export type AgentFlowResourceNode = Node<AgentFlowResourceNodeData, "resource"> & {
  extent?: "parent" | CoordinateExtent | undefined;
};
export type AgentFlowResourceNodeProps = NodeProps<AgentFlowResourceNode>;

export type AgentFlowCustomNode = AgentFlowNode | AgentFlowResourceNode;
export type AgentFlowNodeDataUpdate<T extends AgentFlowCustomNode> = Partial<T["data"]>;

export type AgentFlowDefaultEdgeData = {
  label: string | null;
  isDimmed?: boolean;
};
export type AgentFlowDefaultEdge = Edge<AgentFlowDefaultEdgeData, "default">;
export type AgentFlowCustomEdge = AgentFlowDefaultEdge;

export const isAgentFlowAgentNode = (node: AgentFlowCustomNode): node is AgentFlowNode => node.type === "agent";
export const isAgentFlowResourceNode = (node: AgentFlowCustomNode): node is AgentFlowResourceNode => node.type === "resource";

export interface AgentNodeTranslations {
  arguments: string;
  input: string;
  output: string;
  user: string;
  system: string;
  autonomousAgent: string;
  codedAgent: string;
  conversationalAgent: string;
}

export const DefaultAgentNodeTranslations: AgentNodeTranslations = {
  arguments: "Arguments",
  input: "Input",
  output: "Output",
  user: "User",
  system: "System",
  autonomousAgent: "Autonomous Agent",
  codedAgent: "Coded Agent",
  conversationalAgent: "Conversational Agent",
};

export interface ResourceNodeTranslations {
  expand: string;
  collapse: string;
}

export const DefaultResourceNodeTranslations: ResourceNodeTranslations = {
  expand: "Expand",
  collapse: "Collapse",
};

export interface CodedAgentNodeTranslations {
  codedAgentStep: string;
  noDataToDisplay: string;
}

export const DefaultCodedAgentNodeTranslations: CodedAgentNodeTranslations = {
  codedAgentStep: "Coded Agent Step",
  noDataToDisplay: "No data to display",
};
