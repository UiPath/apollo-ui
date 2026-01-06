import type {
  CoordinateExtent,
  Edge,
  Node,
  Viewport as ReactFlowViewport,
} from '@uipath/apollo-react/canvas/xyflow/react';
import type { NodeProps } from '@uipath/apollo-react/canvas/xyflow/system';
import type { IRawSpan } from '../types/TraceModels';
import type { BaseCanvasRef } from './components/BaseCanvas/BaseCanvas.types';
import type {
  StickyNoteColor,
  StickyNoteData,
} from './components/StickyNoteNode/StickyNoteNode.types';

export interface AgentFlowStickyNote {
  id: string;
  content: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  color: StickyNoteColor;
}

export type AgentFlowStickyNoteNode = Node<StickyNoteData, 'stickyNote'>;

export enum ProjectType {
  Agent = 'Agent',
  Api = 'Api',
  Rpa = 'Rpa',
  Process = 'Process',
  ProcessOrchestration = 'ProcessOrchestration',
  Integration = 'Integration',
  IXP = 'IXP',
  Internal = 'Internal',
}

export enum BuiltInToolType {
  AnalyzeAttachments = 'AnalyzeAttachments',
  BatchTransform = 'BatchTransform',
  DeepRAG = 'DeepRAG',
  LoadAttachments = 'LoadAttachments',
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
  hasGuardrails?: boolean;
};

export type AgentFlowToolResource = {
  id: string;
  type: 'tool';
  name: string;
  originalName?: string;
  description: string;
  iconUrl: string;
  errors?: ErrorInfo[];
  projectType?: ProjectType;
  toolType?: BuiltInToolType;
  isExpandable?: boolean;
  processName?: string;
  hasBreakpoint?: boolean;
  isCurrentBreakpoint?: boolean;
  hasGuardrails?: boolean;
  projectId?: string;
  isDisabled?: boolean;
};

export type AgentFlowContextResource = {
  id: string;
  type: 'context';
  name: string;
  originalName?: string;
  description: string;
  errors?: ErrorInfo[];
  hasBreakpoint?: boolean;
  isCurrentBreakpoint?: boolean;
  hasGuardrails?: boolean;
  projectId?: string;
  isDisabled?: boolean;
};

export type AgentFlowEscalationResource = {
  id: string;
  type: 'escalation';
  name: string;
  originalName?: string;
  description: string;
  errors?: ErrorInfo[];
  hasBreakpoint?: boolean;
  isCurrentBreakpoint?: boolean;
  hasGuardrails?: boolean;
  projectId?: string;
  isDisabled?: boolean;
};

export type AgentFlowMcpResource = {
  id: string;
  type: 'mcp';
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
  isDisabled?: boolean;
};

export type AgentFlowMemorySpaceResource = {
  id: string;
  type: 'memorySpace';
  name: string;
  originalName?: string;
  description: string;
  errors?: ErrorInfo[];
  hasBreakpoint?: boolean;
  isCurrentBreakpoint?: boolean;
  hasGuardrails?: boolean;
  projectId?: string;
  isDisabled?: boolean;
};

export type AgentFlowResource =
  | AgentFlowContextResource
  | AgentFlowEscalationResource
  | AgentFlowMcpResource
  | AgentFlowToolResource
  | AgentFlowMemorySpaceResource;
export type AgentFlowResourceType = AgentFlowResource['type'];

/**
 * Suggestion Types
 *
 * These types enable autopilot-like functionality in the AgentFlow component.
 * Suggestions can be displayed as placeholder nodes (for additions) or as
 * styled overlays on existing nodes (for updates/deletions).
 *
 * @example
 * ```tsx
 * // Example: Add a new tool suggestion
 * const suggestionGroup: AgentFlowSuggestionGroup = {
 *   id: 'suggestion-group-1',
 *   suggestions: [
 *     {
 *       id: 'suggestion-1',
 *       type: 'add',
 *       resource: {
 *         id: 'new-tool-id',
 *         type: 'tool',
 *         name: 'Email Tool',
 *         description: 'Send emails',
 *         iconUrl: '...',
 *       }
 *     }
 *   ]
 * };
 *
 * // Example: Update an existing resource
 * const updateSuggestion: AgentFlowSuggestion = {
 *   id: 'suggestion-2',
 *   type: 'update',
 *   resourceId: 'existing-tool-id',
 *   updatedFields: {
 *     name: 'Updated Tool Name',
 *     description: 'Updated description'
 *   }
 * };
 *
 * // Example: Delete a resource
 * const deleteSuggestion: AgentFlowSuggestion = {
 *   id: 'suggestion-3',
 *   type: 'delete',
 *   resourceIdToDelete: 'tool-to-remove-id'
 * };
 *
 * // Usage in AgentFlow component
 * <AgentFlow
 *   suggestionGroup={suggestionGroup}
 *   onAcceptSuggestion={(suggestionId) => {
 *     // Handle individual suggestion acceptance
 *     // Update your resources state accordingly
 *   }}
 *   onRejectSuggestion={(suggestionId) => {
 *     // Handle individual suggestion rejection
 *   }}
 *   onAcceptSuggestionGroup={(groupId) => {
 *     // Handle accepting all suggestions in the group
 *   }}
 *   onRejectSuggestionGroup={(groupId) => {
 *     // Handle rejecting all suggestions in the group
 *   }}
 *   // ... other props
 * />
 * ```
 */
export type SuggestionType = 'add' | 'update' | 'delete';

export type AgentFlowSuggestion = {
  id: string;
  type: SuggestionType;
  /** For `"add"` type: the new resource to add */
  resource?: AgentFlowResource;
  /** For `"update"` type: the resource id and updated fields */
  resourceId?: string;
  updatedFields?: Partial<AgentFlowResource>;
  /** For `"delete"` type: the resource id to delete */
  resourceIdToDelete?: string;
  /** If true, this suggestion is a standalone/interactive placeholder and should not appear in the suggestion group panel */
  isStandalone?: boolean;
  isProcessing?: boolean;
};

export type AgentFlowSuggestionGroup = {
  id: string;
  suggestions: AgentFlowSuggestion[];
  metadata?: {
    /** Supports versioning so we can show/hide individual suggestion level actions if supported by the integration */
    version?: string;
    title?: string;
    description?: string;
  };
};

export type SpanAttributes = Record<string, unknown>;

export type AgentFlowProps = {
  mode: 'design' | 'view';

  // all modes
  definition: Record<string, unknown>;
  spans: IRawSpan[];
  name: string;
  description: string;
  resources: AgentFlowResource[];
  allowDragging?: boolean;
  initialSelectedResource?: {
    type: 'context' | 'escalation' | 'mcp' | 'pane' | 'run' | 'tool' | 'memorySpace';
    name: string;
  } | null;
  onSelectResource?: (resourceId: string | null) => void;
  onExpandResource?: (resourceId: string, resource: AgentFlowResourceNodeData) => void;
  onCollapseResource?: (resourceId: string, resource: AgentFlowResourceNodeData) => void;
  // span <-> node mapping
  setSpanForSelectedNode?: (node: AgentFlowCustomNode, nodes: AgentFlowCustomNode[]) => void;
  getNodeFromSelectedSpan?: (nodes: AgentFlowCustomNode[]) => AgentFlowCustomNode | null;

  // design mode
  onEnable?: (resourceId: string, resource: AgentFlowResourceNodeData) => void;
  onDisable?: (resourceId: string, resource: AgentFlowResourceNodeData) => void;
  onAddBreakpoint?: (resourceId: string, resource: AgentFlowResourceNodeData) => void;
  onRemoveBreakpoint?: (resourceId: string, resource: AgentFlowResourceNodeData) => void;
  onAddGuardrail?: (resourceId: string, resource: AgentFlowResourceNodeData) => void;
  onGoToSource?: (resourceId: string, resource: AgentFlowResourceNodeData) => void;
  onAddResource?: (type: AgentFlowResourceType) => void;
  onRemoveResource?: (resource: AgentFlowResource) => void;
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

  // layout customization
  /**
   * Initial position for the root agent node.
   * If not provided, defaults to undefined
   */
  agentNodePosition?: { x: number; y: number } | undefined;
  onAgentNodePositionChange?: (position: { x: number; y: number }) => void;
  /**
   * Positions for the resource nodes.
   * If not provided, defaults to undefined
   */
  resourceNodePositions?: Record<string, { x: number; y: number }>;
  /**
   * Called when a resource node position changes (e.g., after drag)
   * @param resourceId - The ID of the resource
   * @param position - The new position of the resource node
   */
  onResourceNodePositionChange?: (resourceId: string, position: { x: number; y: number }) => void;
  /**
   * Called when the "Organize" button is clicked.
   * This allows consumers to clear their stored positions (agentNodePosition and resourceNodePositions)
   * so that the auto-arranged positions become the new source of truth.
   */
  onOrganize?: () => void;
  /**
   * Zoom level for the canvas.
   * If not provided, defaults to undefined
   */
  zoomLevel?: number;
  onZoomLevelChange?: (zoomLevel: number) => void;

  // sticky notes
  stickyNotes?: AgentFlowStickyNote[];
  onAddStickyNote?: (data: AgentFlowStickyNote) => void;
  onUpdateStickyNote?: (id: string, updates: Partial<Omit<AgentFlowStickyNote, 'id'>>) => void;
  onRemoveStickyNote?: (id: string) => void;

  // feature flags
  enableMcpTools?: boolean;
  /** TODO: Remove once memory feature is fully implemented */
  enableMemory?: boolean;
  enableStickyNotes?: boolean;

  // health score
  healthScore?: number;
  onHealthScoreClick?: () => void;

  // suggestions
  suggestionGroup?: AgentFlowSuggestionGroup | null;
  onActOnSuggestion?: (suggestionId: string, action: 'accept' | 'reject') => void;
  onActOnSuggestionGroup?: (suggestionGroupId: string, action: 'accept' | 'reject') => void;
  suggestionTranslations?: SuggestionTranslations;

  // placeholder creation (uses suggestion system internally)
  /**
   * Called when user clicks "+" button on agent node handle.
   * If provided, enables placeholder mode where placeholders are created instead of direct resources.
   *
   * Return a partial resource to customize the placeholder.
   * Return null to bypass placeholder mode for this specific type and use direct creation via onAddResource.
   *
   * The placeholder will be shown as a suggestion that can be accepted (converted to real resource) or rejected (removed).
   *
   * If not provided, clicking "+" will directly call onAddResource (legacy behavior).
   *
   * **Important:** The component automatically ensures only one standalone placeholder exists at a time.
   * The second parameter provides a cleaned suggestion group with existing standalone placeholders removed.
   * Use this cleaned group when creating the new placeholder to ensure proper state management.
   *
   * @example
   * ```tsx
   * onRequestResourcePlaceholder={(type, cleanedSuggestionGroup) => {
   *   // Component provides cleanedSuggestionGroup with standalone placeholders already removed
   *   const placeholder = {
   *     id: `placeholder-${Date.now()}`,
   *     type,
   *     name: `New ${type}`,
   *     description: 'Configure...'
   *   };
   *
   *   // Use cleanedSuggestionGroup instead of your current suggestionGroup
   *   const updated = createPlaceholderSuggestion(placeholder, cleanedSuggestionGroup, { isStandalone: true });
   *   setSuggestionGroup(updated);
   *
   *   return placeholder;
   * }}
   * ```
   */
  onRequestResourcePlaceholder?: (
    type: AgentFlowResourceType,
    cleanedSuggestionGroup: AgentFlowSuggestionGroup | null
  ) => Partial<AgentFlowResource> | null;

  /**
   * Called when user clicks on a standalone placeholder node.
   * Use this to open the appropriate side panel or modal for configuring the resource.
   *
   * @param resourceType - The type of resource (tool, context, mcp, etc.)
   * @param placeholderData - The data of the placeholder node that was clicked
   */
  onPlaceholderNodeClick?: (
    resourceType: AgentFlowResourceType,
    placeholderData: AgentFlowResourceNodeData
  ) => void;
};

export type AgentFlowNodeData = {
  name: string;
  description: string;
  definition: Record<string, unknown>; // TODO: NEED schema/Agent type definition
  parentNodeId?: string;
  // suggestions
  isSuggestion?: boolean;
  suggestionId?: string;
  suggestionType?: SuggestionType;
  isProcessing?: boolean;
};
export type AgentFlowNode = Node<AgentFlowNodeData, 'agent'> & {
  extent?: 'parent' | CoordinateExtent | undefined;
};
export type AgentFlowNodeProps = NodeProps<AgentFlowNode>;

export type ToolResourceData = {
  type: 'tool';
  toolType?: BuiltInToolType;
};
export type ContextResourceData = {
  type: 'context';
};
export type EscalationResourceData = {
  type: 'escalation';
};
type McpResourceData = {
  type: 'mcp';
};
export type MemorySpaceResourceData = {
  type: 'memorySpace';
};

export type SharedResourceData = {
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
  projectType?: ProjectType;
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
  isDisabled?: boolean;
  projectId?: string;
  isVirtual?: boolean; // AgentFlow-specific: for virtual spacing nodes
  // suggestions
  isSuggestion?: boolean;
  suggestionId?: string;
  suggestionType?: SuggestionType;
  isPlaceholder?: boolean; // for 'add' type suggestions
};

export type AgentFlowResourceNodeData = (
  | ContextResourceData
  | EscalationResourceData
  | McpResourceData
  | ToolResourceData
  | MemorySpaceResourceData
) &
  SharedResourceData;
export type AgentFlowResourceNode = Node<AgentFlowResourceNodeData, 'resource'> & {
  extent?: 'parent' | CoordinateExtent | undefined;
  position?: { x: number; y: number } | undefined; // position of the node in the canvas, undefined means auto-layout should be used
  hasExplicitPosition?: boolean; // true if the position is explicitly set, false means auto-layout should be used
};
export type AgentFlowResourceNodeProps = NodeProps<AgentFlowResourceNode>;

export type AgentFlowCustomNode = AgentFlowNode | AgentFlowResourceNode | AgentFlowStickyNoteNode;
export type AgentFlowNodeDataUpdate<T extends AgentFlowCustomNode> = Partial<T['data']>;

export type AgentFlowDefaultEdgeData = {
  label: string | null;
  isDimmed?: boolean;
};
export type AgentFlowDefaultEdge = Edge<AgentFlowDefaultEdgeData, 'default'>;
export type AgentFlowCustomEdge = AgentFlowDefaultEdge;

export const isAgentFlowAgentNode = (node: AgentFlowCustomNode): node is AgentFlowNode =>
  node.type === 'agent';
export const isAgentFlowResourceNode = (node: AgentFlowCustomNode): node is AgentFlowResourceNode =>
  node.type === 'resource';
export const isStickyNoteNode = (node: AgentFlowCustomNode): node is AgentFlowStickyNoteNode =>
  node.type === 'stickyNote';

export interface AgentNodeTranslations {
  arguments: string;
  input: string;
  output: string;
  user: string;
  system: string;
  autonomousAgent: string;
  codedAgent: string;
  conversationalAgent: string;
  escalations: string;
  model: string;
  context: string;
  tools: string;
  memory: string;
}

export const DefaultAgentNodeTranslations: AgentNodeTranslations = {
  arguments: 'Arguments',
  input: 'Input',
  output: 'Output',
  user: 'User',
  system: 'System',
  autonomousAgent: 'Autonomous Agent',
  codedAgent: 'Coded Agent',
  conversationalAgent: 'Conversational Agent',
  escalations: 'Escalations',
  model: 'Model',
  context: 'Context',
  tools: 'Tools',
  memory: 'Memory',
};

export interface ResourceNodeTranslations {
  moreOptions: string;
  enable: string;
  disable: string;
  expand: string;
  collapse: string;
  remove: string;
  addBreakpoint: string;
  removeBreakpoint: string;
  addGuardrail: string;
  guardrailsApplied: string;
  goToSource: string;
}

export const DefaultResourceNodeTranslations: ResourceNodeTranslations = {
  moreOptions: 'More options',
  enable: 'Enable',
  disable: 'Disable',
  expand: 'Expand',
  collapse: 'Collapse',
  remove: 'Remove',
  addBreakpoint: 'Add breakpoint',
  removeBreakpoint: 'Remove breakpoint',
  addGuardrail: 'Add guardrail',
  guardrailsApplied: 'Guardrail(s) applied',
  goToSource: 'Go to source',
};

export interface CodedAgentNodeTranslations {
  codedAgentStep: string;
  noDataToDisplay: string;
}

export const DefaultCodedAgentNodeTranslations: CodedAgentNodeTranslations = {
  codedAgentStep: 'Coded Agent Step',
  noDataToDisplay: 'No data to display',
};

export interface CanvasTranslations {
  panShortcutTeaching: string;
  organize: string;
  zoomIn: string;
  zoomOut: string;
  zoomToFit: string;
  addNote: string;
}

export const DefaultCanvasTranslations: CanvasTranslations = {
  panShortcutTeaching: 'Hold Space and drag to pan around the canvas',
  organize: 'Organize',
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  zoomToFit: 'Zoom to fit',
  addNote: 'Add note',
};

export interface SuggestionTranslations {
  accept: string;
  reject: string;
  acceptAll: string;
  rejectAll: string;
}

export const DefaultSuggestionTranslations: SuggestionTranslations = {
  accept: 'Accept',
  reject: 'Reject',
  acceptAll: 'Accept all',
  rejectAll: 'Reject all',
};

/**
 * Helper function to create a placeholder suggestion for a new resource.
 * This is useful when implementing onRequestResourcePlaceholder.
 *
 * @param partialResource - Partial resource data (at minimum, provide type and id)
 * @param existingGroup - Optional existing suggestion group to merge into
 * @param options - Optional configuration for the placeholder
 * @param options.isStandalone - If true, the placeholder won't appear in the suggestion group panel UI (default: false)
 * @returns Updated suggestion group with the new placeholder
 *
 * @example
 * ```tsx
 * const [suggestionGroup, setSuggestionGroup] = useState<AgentFlowSuggestionGroup | null>(null);
 *
 * <AgentFlow
 *   onRequestResourcePlaceholder={(type) => {
 *     const partialResource: Partial<AgentFlowResource> = {
 *       id: `placeholder-${Date.now()}`,
 *       type,
 *       name: `New ${type}`,
 *       description: 'Configure this resource...',
 *     };
 *
 *     // Standalone placeholder - won't appear in suggestion group panel
 *     const updated = createPlaceholderSuggestion(partialResource, suggestionGroup, { isStandalone: true });
 *     setSuggestionGroup(updated);
 *
 *     return partialResource;
 *   }}
 * />
 * ```
 */
export function createPlaceholderSuggestion(
  partialResource: Partial<AgentFlowResource>,
  existingGroup?: AgentFlowSuggestionGroup | null,
  options?: { isStandalone?: boolean }
): AgentFlowSuggestionGroup {
  if (!partialResource.type || !partialResource.id) {
    throw new Error('partialResource must have at least type and id fields');
  }

  const fullResource: AgentFlowResource = {
    type: partialResource.type,
    id: partialResource.id,
    name: partialResource.name || `New ${partialResource.type}`,
    description: partialResource.description || '',
    ...partialResource,
  } as AgentFlowResource;

  const newSuggestion: AgentFlowSuggestion = {
    id: `suggestion-${partialResource.id}`,
    type: 'add',
    resource: fullResource,
    isStandalone: options?.isStandalone ?? false,
  };

  if (existingGroup) {
    return {
      ...existingGroup,
      suggestions: [...existingGroup.suggestions, newSuggestion],
    };
  }

  return {
    id: `placeholder-group-${Date.now()}`,
    suggestions: [newSuggestion],
    metadata: {
      title: 'New Resource',
      description: 'Complete the resource details or remove',
    },
  };
}
