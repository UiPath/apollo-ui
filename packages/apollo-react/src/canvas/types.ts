import type { Edge, Node, Viewport as ReactFlowViewport, CoordinateExtent } from "@xyflow/react";
import type { NodeProps } from "@xyflow/system";
import type { IRawSpan } from "@uipath/portal-shell-react";
import type { BaseCanvasRef } from "./components/BaseCanvas/BaseCanvas.types";

export enum ProjectType {
  Agent = "Agent",
  Api = "Api",
}

export type ErrorInfo = {
  value: string;
  label: string;
};

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
  originalName?: string;
  description: string;
  iconUrl: string;
  errors?: ErrorInfo[];
  projectType?: string;
  isExpandable?: boolean;
  processName?: string;
  hasBreakpoint?: boolean;
  isCurrentBreakpoint?: boolean;
  hasGuardrails?: boolean;
  projectId?: string;
};

export type AgentFlowContextResource = {
  id: string;
  type: "context";
  name: string;
  originalName?: string;
  description: string;
  errors?: ErrorInfo[];
  hasBreakpoint?: boolean;
  isCurrentBreakpoint?: boolean;
  hasGuardrails?: boolean;
  projectId?: string;
};

export type AgentFlowEscalationResource = {
  id: string;
  type: "escalation";
  name: string;
  originalName?: string;
  description: string;
  errors?: ErrorInfo[];
  hasBreakpoint?: boolean;
  isCurrentBreakpoint?: boolean;
  hasGuardrails?: boolean;
  projectId?: string;
};

export type AgentFlowMcpResource = {
  id: string;
  type: "mcp";
  name: string;
  originalName?: string;
  description: string;
  errors?: ErrorInfo[];
  slug: string;
  folderPath: string;
  availableTools: {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
    outputSchema?: Record<string, unknown>;
  }[];
  hasBreakpoint?: boolean;
  isCurrentBreakpoint?: boolean;
  hasGuardrails?: boolean;
  projectId?: string;
};

export type AgentFlowResource = AgentFlowContextResource | AgentFlowEscalationResource | AgentFlowMcpResource | AgentFlowToolResource;
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
  allowDragging?: boolean;
  initialSelectedResource?: {
    type: "context" | "escalation" | "mcp" | "pane" | "run" | "tool";
    name: string;
  } | null;
  onSelectResource?: (resourceId: string | null) => void;
  onExpandResource?: (resourceId: string, resource: AgentFlowResourceNodeData) => void;
  onCollapseResource?: (resourceId: string, resource: AgentFlowResourceNodeData) => void;
  // span <-> node mapping
  setSpanForSelectedNode?: (node: AgentFlowCustomNode, nodes: AgentFlowCustomNode[]) => void;
  getNodeFromSelectedSpan?: (nodes: AgentFlowCustomNode[]) => AgentFlowCustomNode | null;

  // design mode
  onAddBreakpoint?: (resourceId: string, resource: AgentFlowResourceNodeData) => void;
  onRemoveBreakpoint?: (resourceId: string, resource: AgentFlowResourceNodeData) => void;
  onAddGuardrail?: (resourceId: string, resource: AgentFlowResourceNodeData) => void;
  onGoToDefinition?: (resourceId: string, resource: AgentFlowResourceNodeData) => void;
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
  canvasTranslations?: CanvasTranslations;

  // canvas ref for imperative control
  canvasRef?: React.Ref<BaseCanvasRef<AgentFlowCustomNode, AgentFlowCustomEdge>>;

  // feature flags
  enableMcpTools?: boolean;
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
type McpResourceData = {
  type: "mcp";
};

export type AgentFlowResourceNodeData = (
  | ContextResourceData
  | EscalationResourceData
  | McpResourceData
  | ModelResourceData
  | ToolResourceData
) & {
  name: string;
  originalName?: string;
  description: string;
  errors?: ErrorInfo[];
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
  slug?: string;
  folderPath?: string;
  availableTools?: {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
    outputSchema?: Record<string, unknown>;
  }[];
  isCurrentBreakpoint?: boolean;
  hasBreakpoint?: boolean;
  hasGuardrails?: boolean;
  projectId?: string;
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
  remove: string;
  addBreakpoint: string;
  removeBreakpoint: string;
  addGuardrail: string;
  goToDefinition: string;
}

export const DefaultResourceNodeTranslations: ResourceNodeTranslations = {
  expand: "Expand",
  collapse: "Collapse",
  remove: "Remove",
  addBreakpoint: "Add breakpoint",
  removeBreakpoint: "Remove breakpoint",
  addGuardrail: "Add guardrail",
  goToDefinition: "Go to definition",
};

export interface CodedAgentNodeTranslations {
  codedAgentStep: string;
  noDataToDisplay: string;
}

export const DefaultCodedAgentNodeTranslations: CodedAgentNodeTranslations = {
  codedAgentStep: "Coded Agent Step",
  noDataToDisplay: "No data to display",
};

export interface CanvasTranslations {
  panShortcutTeaching: string;
}

export const DefaultCanvasTranslations: CanvasTranslations = {
  panShortcutTeaching: "Hold Space and drag to pan around the canvas",
};
