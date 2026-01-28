import type { Meta, StoryObj } from '@storybook/react-vite';
import { Column, Row } from '@uipath/apollo-react/canvas/layouts';
import { ReactFlowProvider } from '@uipath/apollo-react/canvas/xyflow/react';
import { FontVariantToken } from '@uipath/apollo-react/core';
import { ApButton, ApTypography } from '@uipath/apollo-react/material';
import { useCallback, useState } from 'react';
import type { IRawSpan } from '../../../types/TraceModels';
import { StoryInfoPanel } from '../../storybook-utils';
import {
  type AgentFlowProps,
  type AgentFlowResource,
  type AgentFlowResourceNodeData,
  type AgentFlowResourceType,
  type AgentFlowStickyNote,
  type AgentFlowSuggestionGroup,
  createPlaceholderSuggestion,
  ProjectType,
} from '../../types';
import { AgentFlow } from './AgentFlow';

const meta: Meta<typeof AgentFlow> = {
  title: 'Canvas/AgentFlow',
  component: AgentFlow,
  decorators: [
    (Story) => (
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      >
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof AgentFlow>;

// Sample data generators
const generateResourceId = () =>
  `resource-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

const sampleContexts = [
  { name: 'User Profile', description: 'Information about the current user' },
  { name: 'Session Context', description: 'Current session information' },
  { name: 'Organization Settings', description: 'Organization configuration' },
  { name: 'Environment Variables', description: 'System environment settings' },
];

const sampleTools: {
  name: string;
  description: string;
  projectType: ProjectType;
  iconUrl?: string;
}[] = [
  { name: 'Send Email', description: 'Email Service', projectType: ProjectType.Internal },
  {
    name: 'Broken Icon Tool',
    description: 'Automation',
    projectType: ProjectType.Internal,
    iconUrl: 'https://testtest.broken/blah/blah',
  },
  { name: 'Query Database', description: 'Database', projectType: ProjectType.Internal },
  { name: 'Call API', description: 'REST API', projectType: ProjectType.Api },
  { name: 'Process Document', description: 'Document AI', projectType: ProjectType.Internal },
  { name: 'Run Automation', description: 'Automation', projectType: ProjectType.Internal },
];

const sampleEscalations = [
  { name: 'Manager Approval', description: 'Escalate to manager' },
  { name: 'Amount Exceeded', description: 'Transaction limit exceeded' },
  { name: 'Security Alert', description: 'Suspicious activity detected' },
  { name: 'Manual Review', description: 'Requires human review' },
];

const sampleMcp = [
  { name: 'File parser', description: 'Parse files in the workspace' },
  {
    name: 'Budget Assistant RPC',
    description: 'Using RPC to connect to a budget assistant server API',
  },
];

let contextIndex = 0;
let toolIndex = 0;
let escalationIndex = 0;
let mcpIndex = 0;

const createSampleContext = (): AgentFlowResource => {
  const sample = sampleContexts[contextIndex % sampleContexts.length] as NonNullable<
    (typeof sampleContexts)[number]
  >;
  contextIndex++;
  return {
    id: generateResourceId(),
    type: 'context',
    name: sample.name,
    hasBreakpoint: false,
    hasGuardrails: false,
    description: sample.description,
  };
};

const createSampleTool = (): AgentFlowResource => {
  const sample = sampleTools[toolIndex % sampleTools.length] as NonNullable<
    (typeof sampleTools)[number]
  >;
  toolIndex++;
  return {
    id: generateResourceId(),
    type: 'tool',
    name: sample.name,
    description: sample.description,
    iconUrl: sample.iconUrl ?? '',
    hasBreakpoint: false,
    hasGuardrails: false,
    projectType: sample.projectType as ProjectType,
  };
};

const createSampleEscalation = (): AgentFlowResource => {
  const sample = sampleEscalations[escalationIndex % sampleEscalations.length] as NonNullable<
    (typeof sampleEscalations)[number]
  >;
  escalationIndex++;
  return {
    id: generateResourceId(),
    type: 'escalation',
    name: sample.name,
    hasBreakpoint: false,
    hasGuardrails: false,
    description: sample.description,
  };
};

const createSampleMcp = (): AgentFlowResource => {
  const sample = sampleMcp[mcpIndex % sampleMcp.length] as NonNullable<(typeof sampleMcp)[number]>;
  mcpIndex++;
  return {
    id: generateResourceId(),
    type: 'mcp',
    name: sample.name,
    slug: '',
    folderPath: '',
    availableTools: [],
    description: sample.description,
    hasBreakpoint: false,
    hasGuardrails: false,
  };
};

const createSampleMemorySpace = (): AgentFlowResource => {
  return {
    id: generateResourceId(),
    type: 'memorySpace',
    name: 'Agent Memory Space',
    description: 'Memory space for the agent',
  };
};

const sampleResources: AgentFlowResource[] = [
  {
    id: 'tool-slack',
    type: 'tool',
    name: 'Send message',
    description: 'Slack',
    iconUrl: '',
    hasBreakpoint: false,
    isCurrentBreakpoint: false,
    hasGuardrails: false,
    projectType: ProjectType.Internal,
    isDisabled: false,
  },
  {
    id: 'tool-ixp',
    type: 'tool',
    name: 'Extract data',
    description: 'IXP',
    iconUrl: '',
    hasBreakpoint: false,
    isCurrentBreakpoint: false,
    hasGuardrails: false,
    projectType: ProjectType.IXP,
    isDisabled: false,
  },
  {
    id: 'tool-claim',
    type: 'tool',
    name: 'Validate claim',
    description: 'Automation',
    iconUrl: '',
    hasBreakpoint: false,
    isCurrentBreakpoint: false,
    hasGuardrails: false,
    projectType: ProjectType.Internal,
    isDisabled: false,
  },
  {
    id: 'context-user-profile',
    type: 'context',
    name: 'User Profile',
    description: 'Information about the current user',
    hasBreakpoint: false,
    isCurrentBreakpoint: false,
  },
  {
    id: 'escalation-amount-exceeded',
    type: 'escalation',
    name: 'Amount exceeded',
    description: 'Claim form',
    hasBreakpoint: false,
    isCurrentBreakpoint: false,
  },
  {
    id: 'mcp-file-parser',
    type: 'mcp',
    name: 'File Parser',
    description: 'File Parser',
    hasBreakpoint: false,
    isCurrentBreakpoint: false,
    hasGuardrails: false,
    slug: 'file-parser',
    folderPath: 'file-parser',
    availableTools: [],
  },
];

// Real agent definition from frontend examples
const sampleAgentDefinition = {
  name: 'Test Agent',
  version: '1.0',
  settings: {
    model: 'gpt-4',
    engine: 'test-engine',
  },
  tools: [],
  resources: [],
};

// Real trace data from frontend examples
const sampleSpans: IRawSpan[] = [
  {
    Id: 'span1',
    TraceId: 'trace1',
    ParentId: 'parent1',
    Name: 'agentRun',
    StartTime: '2021-01-01T00:00:00Z',
    EndTime: '2021-01-01T00:00:30Z',
    Status: 1,
    CreatedAt: '2021-01-01T00:00:00Z',
    UpdatedAt: '2021-01-01T00:00:00Z',
    SpanType: 'agentRun',
    Attributes: JSON.stringify({ type: 'agentRun' }),
    OrganizationId: 'org1',
    TenantId: 'tenant1',
    Source: 1,
  },
  {
    Id: 'span2',
    TraceId: 'trace1',
    ParentId: 'span1',
    Name: 'contextLoad',
    StartTime: '2021-01-01T00:00:31Z',
    EndTime: '2021-01-01T00:01:00Z',
    Status: 1,
    CreatedAt: '2021-01-01T00:00:00Z',
    UpdatedAt: '2021-01-01T00:00:00Z',
    SpanType: 'contextLoad',
    Attributes: JSON.stringify({ type: 'contextLoad', contextName: 'test_context' }),
    OrganizationId: 'org1',
    TenantId: 'tenant1',
    Source: 1,
  },
  {
    Id: 'span3',
    TraceId: 'trace1',
    ParentId: 'span2',
    Name: 'completion',
    StartTime: '2021-01-01T00:01:01Z',
    EndTime: '2021-01-01T00:03:00Z',
    Status: 1,
    CreatedAt: '2021-01-01T00:00:00Z',
    UpdatedAt: '2021-01-01T00:00:00Z',
    SpanType: 'completion',
    Attributes: JSON.stringify({ type: 'completion' }),
    OrganizationId: 'org1',
    TenantId: 'tenant1',
    Source: 1,
  },
];

// Sample sticky notes for testing
const sampleStickyNotes: AgentFlowStickyNote[] = [
  {
    id: 'sticky-1',
    content:
      '## Welcome!\nThis is a **markdown** sticky note.\n\n- Supports lists\n- And formatting',
    position: { x: -150, y: -450 },
    size: { width: 320, height: 300 },
    color: 'yellow',
  },
  {
    id: 'sticky-2',
    content: 'Remember to test:\n\n1. Dragging\n2. Resizing\n3. Color changes\n4. Content editing',
    position: { x: 380, y: 0 },
    size: { width: 500, height: 450 },
    color: 'blue',
  },
  {
    id: 'sticky-3',
    content: 'Quick note: Press Delete to remove selected notes',
    position: { x: -220, y: 220 },
    size: { width: 300, height: 230 },
    color: 'pink',
  },
];

interface AgentFlowWrapperProps {
  mode: AgentFlowProps['mode'];
  initialResources?: AgentFlowResource[];
  initialStickyNotes?: AgentFlowStickyNote[];
  activeResourceIds?: string[];
  spans?: any[];
  definition?: any;
  enableTimelinePlayer?: boolean;
  enableMemory?: boolean;
  enableStickyNotes?: boolean;
  healthScore?: number;
  onHealthScoreClick?: () => void;
  allowDragging?: boolean;
  agentNodePosition?: { x: number; y: number } | undefined;
  onAgentNodePositionChange?: (position: { x: number; y: number }) => void;
  hasInstructions?: boolean;
  instructions?: { system?: string; user?: string };
}

const AgentFlowWrapper = ({
  mode,
  initialResources = sampleResources,
  initialStickyNotes = [],
  activeResourceIds,
  spans = sampleSpans,
  definition = sampleAgentDefinition,
  enableTimelinePlayer = true,
  enableMemory = true,
  enableStickyNotes = true,
  healthScore,
  onHealthScoreClick,
  allowDragging = false,
  agentNodePosition = undefined,
  onAgentNodePositionChange = () => {},
  hasInstructions,
  instructions,
}: AgentFlowWrapperProps) => {
  const [resources, setResources] = useState<AgentFlowResource[]>(initialResources);
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
  const [_sidebarMode, setSidebarMode] = useState<
    'add-context' | 'add-escalation' | 'add-model' | 'add-tool' | 'add-memory' | 'properties'
  >('properties');
  const [stickyNotes, setStickyNotes] = useState<AgentFlowStickyNote[]>(initialStickyNotes);

  // Sticky note handlers
  const handleAddStickyNote = useCallback((data: AgentFlowStickyNote) => {
    setStickyNotes((prev) => [...prev, data]);
  }, []);

  const handleUpdateStickyNote = useCallback(
    (id: string, updates: Partial<AgentFlowStickyNote>) => {
      setStickyNotes((prev) =>
        prev.map((note) => (note.id === id ? { ...note, ...updates } : note))
      );
    },
    []
  );

  const handleRemoveStickyNote = useCallback((id: string) => {
    setStickyNotes((prev) => prev.filter((note) => note.id !== id));
  }, []);

  const handleSelectResource = useCallback((resourceId: string | null) => {
    setSelectedResourceId(resourceId);
    setSidebarMode('properties');
  }, []);

  const handleAddResourceRequest = useCallback((type: AgentFlowResourceType) => {
    let newResource: AgentFlowResource;

    switch (type) {
      case 'context': {
        newResource = createSampleContext();
        break;
      }
      case 'tool': {
        newResource = createSampleTool();
        break;
      }
      case 'escalation': {
        newResource = createSampleEscalation();
        break;
      }
      case 'mcp': {
        newResource = createSampleMcp();
        break;
      }
      case 'memorySpace': {
        newResource = createSampleMemorySpace();
        break;
      }
      default: {
        return;
      }
    }

    setResources((prev) => [...prev, newResource]);
    setSelectedResourceId(newResource.id);
    setSidebarMode('properties');
  }, []);

  const handleRemoveResource = useCallback(
    (resource: AgentFlowResource) => {
      setResources((prev) => prev.filter((r) => r.id !== resource.id));
      if (selectedResourceId === resource.id) {
        setSelectedResourceId(null);
      }
    },
    [selectedResourceId]
  );

  const handleEnable = useCallback((resourceId: string, resource: AgentFlowResourceNodeData) => {
    setResources((prev) =>
      prev.map((r) => ({
        ...r,
        ...(`${resource.parentNodeId}=>${r.name}:${r.id}` === resourceId && { isDisabled: false }),
      }))
    );
  }, []);

  const handleDisable = useCallback((resourceId: string, resource: AgentFlowResourceNodeData) => {
    setResources((prev) =>
      prev.map((r) => ({
        ...r,
        ...(`${resource.parentNodeId}=>${r.name}:${r.id}` === resourceId && { isDisabled: true }),
      }))
    );
  }, []);

  const handleAddBreakpoint = useCallback(
    (resourceId: string, resource: AgentFlowResourceNodeData) => {
      setResources((prev) =>
        prev.map((r) => ({
          ...r,
          ...(`${resource.parentNodeId}=>${r.name}:${r.id}` === resourceId && {
            hasBreakpoint: true,
          }),
        }))
      );
    },
    []
  );

  const handleRemoveBreakpoint = useCallback(
    (resourceId: string, resource: AgentFlowResourceNodeData) => {
      setResources((prev) =>
        prev.map((r) => ({
          ...r,
          ...(`${resource.parentNodeId}=>${r.name}:${r.id}` === resourceId && {
            hasBreakpoint: false,
          }),
        }))
      );
    },
    []
  );

  const handleAddGuardrail = useCallback(
    (resourceId: string, resource: AgentFlowResourceNodeData) => {
      setResources((prev) =>
        prev.map((r) => ({
          ...r,
          ...(`${resource.parentNodeId}=>${r.name}:${r.id}` === resourceId && {
            hasGuardrails: true,
          }),
        }))
      );
    },
    []
  );

  // Real span/node mapping functions from frontend
  const setSpanForSelectedNode = useCallback((_node: any) => {}, []);

  const getNodeFromSelectedSpan = useCallback((_nodes: any[]) => {
    return null;
  }, []);

  const renderSidebar = () => {
    if (mode !== 'design') {
      return null;
    }

    return (
      <Column
        w={300}
        p={16}
        gap={16}
        style={{
          backgroundColor: 'var(--uix-canvas-background-secondary)',
          borderLeft: '1px solid var(--uix-canvas-border-de-emp)',
          overflowY: 'auto',
          color: 'var(--uix-canvas-foreground)',
        }}
      >
        <h3 style={{ margin: 0 }}>Design Mode</h3>
        {selectedResourceId && (
          <div>
            <strong>Selected:</strong> {selectedResourceId}
          </div>
        )}
        <div>
          <strong>Resources:</strong> {resources.length}
        </div>
        {enableStickyNotes && (
          <div>
            <strong>Sticky Notes:</strong> {stickyNotes.length}
          </div>
        )}
        {allowDragging && agentNodePosition && (
          <div
            style={{
              padding: '12px',
              backgroundColor: 'var(--uix-canvas-background)',
              borderRadius: '4px',
              border: '1px solid var(--uix-canvas-border-de-emp)',
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Agent Node Position</div>
            <div style={{ fontSize: '0.875rem', fontFamily: 'monospace' }}>
              <div>
                <strong>X:</strong> {agentNodePosition.x.toFixed(2)}
              </div>
              <div>
                <strong>Y:</strong> {agentNodePosition.y.toFixed(2)}
              </div>
            </div>
          </div>
        )}
        <div style={{ fontSize: '0.875rem', color: 'var(--uix-canvas-foreground-de-emp)' }}>
          <p>Click the + buttons on the agent node to add:</p>
          <ul>
            <li>Memory (top)</li>
            <li>Context (bottom-left)</li>
            <li>Escalations (bottom-center)</li>
            <li>Tools & MCPs (bottom-right)</li>
          </ul>
          {enableStickyNotes && (
            <>
              <p style={{ marginTop: '12px' }}>
                Use the sticky note button at the bottom to add notes.
              </p>
              <p>Press Delete/Backspace to remove selected notes.</p>
            </>
          )}
        </div>
      </Column>
    );
  };

  return (
    <ReactFlowProvider>
      <Row w="100%" h="100%" style={{ position: 'relative' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <AgentFlow
            allowDragging={allowDragging}
            agentNodePosition={agentNodePosition}
            onAgentNodePositionChange={onAgentNodePositionChange}
            definition={definition}
            spans={mode === 'view' ? spans : []}
            name="Test Agent"
            description="Test Description"
            mode={mode}
            resources={resources}
            activeResourceIds={activeResourceIds}
            setSpanForSelectedNode={setSpanForSelectedNode}
            getNodeFromSelectedSpan={getNodeFromSelectedSpan}
            onEnable={handleEnable}
            onDisable={handleDisable}
            onAddBreakpoint={handleAddBreakpoint}
            onRemoveBreakpoint={handleRemoveBreakpoint}
            onAddGuardrail={handleAddGuardrail}
            onAddResource={handleAddResourceRequest}
            onRemoveResource={handleRemoveResource}
            onSelectResource={handleSelectResource}
            enableTimelinePlayer={mode === 'view' && enableTimelinePlayer}
            enableMemory={enableMemory}
            enableStickyNotes={enableStickyNotes}
            stickyNotes={stickyNotes}
            onAddStickyNote={handleAddStickyNote}
            onUpdateStickyNote={handleUpdateStickyNote}
            onRemoveStickyNote={handleRemoveStickyNote}
            healthScore={healthScore}
            onHealthScoreClick={onHealthScoreClick}
            hasInstructions={hasInstructions}
            instructions={instructions}
          />
        </div>
        {renderSidebar()}
      </Row>
    </ReactFlowProvider>
  );
};

/**
 * Design Mode Playground
 * Comprehensive demo combining all design mode features with toggles for each
 */
type SuggestionMode = 'off' | 'placeholders' | 'autopilot';

const DesignModePlayground = () => {
  // Feature toggles
  const [hasResources, setHasResources] = useState(true);
  const [suggestionMode, setSuggestionMode] = useState<SuggestionMode>('off');
  const [enableStickyNotes, setEnableStickyNotes] = useState(true);
  const [enableDragging, setEnableDragging] = useState(true);
  const [hasInstructions, setHasInstructions] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [userPrompt, setUserPrompt] = useState('');

  // Resources state
  const [resources, setResources] = useState<AgentFlowResource[]>(sampleResources);

  // Suggestions state
  const [suggestionGroup, setSuggestionGroup] = useState<AgentFlowSuggestionGroup | null>(null);
  const [pendingStandalonePlaceholderId, setPendingStandalonePlaceholderId] = useState<
    string | null
  >(null);
  const [openModalType, setOpenModalType] = useState<AgentFlowResourceType | null>(null);
  const [placeholderBeingConfigured, setPlaceholderBeingConfigured] =
    useState<AgentFlowResourceNodeData | null>(null);

  // Sticky notes state
  const [stickyNotes, setStickyNotes] = useState<AgentFlowStickyNote[]>([]);

  // Dragging state
  const [agentNodePosition, setAgentNodePosition] = useState<{ x: number; y: number } | undefined>(
    undefined
  );
  const [resourceNodePositions, setResourceNodePositions] = useState<
    Record<string, { x: number; y: number }>
  >({});
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Selection state
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);

  // Instructions object
  const instructions = hasInstructions
    ? {
        system: systemPrompt || undefined,
        user: userPrompt || undefined,
      }
    : undefined;

  // Generate a unique key for React to remount when major state changes
  const stateKey = `${hasResources}-${suggestionMode}-${enableStickyNotes}-${enableDragging}-${hasInstructions}`;

  // Resource handlers
  const handleSelectResource = useCallback(
    (resourceId: string | null) => {
      setSelectedResourceId(resourceId);
      // Handle pane click for placeholder mode
      if (resourceId === 'pane' && pendingStandalonePlaceholderId && suggestionGroup) {
        const pendingSuggestion = suggestionGroup.suggestions.find(
          (s) => s.id === pendingStandalonePlaceholderId
        );
        if (pendingSuggestion?.isStandalone) {
          // Reject the placeholder
          const remaining = suggestionGroup.suggestions.filter(
            (s) => s.id !== pendingStandalonePlaceholderId
          );
          setSuggestionGroup(
            remaining.length > 0 ? { ...suggestionGroup, suggestions: remaining } : null
          );
        }
        setPendingStandalonePlaceholderId(null);
        setOpenModalType(null);
        setPlaceholderBeingConfigured(null);
      }
    },
    [pendingStandalonePlaceholderId, suggestionGroup]
  );

  const handleAddResourceDirect = useCallback((type: AgentFlowResourceType) => {
    let newResource: AgentFlowResource;
    switch (type) {
      case 'context':
        newResource = createSampleContext();
        break;
      case 'tool':
        newResource = createSampleTool();
        break;
      case 'escalation':
        newResource = createSampleEscalation();
        break;
      case 'mcp':
        newResource = createSampleMcp();
        break;
      case 'memorySpace':
        newResource = createSampleMemorySpace();
        break;
      default:
        return;
    }
    setResources((prev) => [...prev, newResource]);
    setSelectedResourceId(newResource.id);
  }, []);

  const handleRemoveResource = useCallback(
    (resource: AgentFlowResource) => {
      setResources((prev) => prev.filter((r) => r.id !== resource.id));
      if (selectedResourceId === resource.id) {
        setSelectedResourceId(null);
      }
    },
    [selectedResourceId]
  );

  const handleEnable = useCallback((resourceId: string, resource: AgentFlowResourceNodeData) => {
    setResources((prev) =>
      prev.map((r) => ({
        ...r,
        ...(`${resource.parentNodeId}=>${r.name}:${r.id}` === resourceId && { isDisabled: false }),
      }))
    );
  }, []);

  const handleDisable = useCallback((resourceId: string, resource: AgentFlowResourceNodeData) => {
    setResources((prev) =>
      prev.map((r) => ({
        ...r,
        ...(`${resource.parentNodeId}=>${r.name}:${r.id}` === resourceId && { isDisabled: true }),
      }))
    );
  }, []);

  const handleAddBreakpoint = useCallback(
    (resourceId: string, resource: AgentFlowResourceNodeData) => {
      setResources((prev) =>
        prev.map((r) => ({
          ...r,
          ...(`${resource.parentNodeId}=>${r.name}:${r.id}` === resourceId && {
            hasBreakpoint: true,
          }),
        }))
      );
    },
    []
  );

  const handleRemoveBreakpoint = useCallback(
    (resourceId: string, resource: AgentFlowResourceNodeData) => {
      setResources((prev) =>
        prev.map((r) => ({
          ...r,
          ...(`${resource.parentNodeId}=>${r.name}:${r.id}` === resourceId && {
            hasBreakpoint: false,
          }),
        }))
      );
    },
    []
  );

  const handleAddGuardrail = useCallback(
    (resourceId: string, resource: AgentFlowResourceNodeData) => {
      setResources((prev) =>
        prev.map((r) => ({
          ...r,
          ...(`${resource.parentNodeId}=>${r.name}:${r.id}` === resourceId && {
            hasGuardrails: true,
          }),
        }))
      );
    },
    []
  );

  // Placeholder handlers (for suggestionMode === "placeholders")
  const handleRequestPlaceholder = useCallback(
    (type: AgentFlowResourceType, cleanedSuggestionGroup: AgentFlowSuggestionGroup | null) => {
      if (suggestionMode !== 'placeholders') return null;
      if (type === 'escalation') return null; // Escalations create directly

      const placeholder: Partial<AgentFlowResource> = {
        id: `placeholder-${type}-${Date.now()}`,
        type,
        name: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
        description: `Configure this ${type}...`,
      };

      if (type === 'tool') {
        (placeholder as any).iconUrl = '';
        (placeholder as any).projectType = ProjectType.Internal;
      } else if (type === 'mcp') {
        (placeholder as any).slug = '';
        (placeholder as any).folderPath = '';
        (placeholder as any).availableTools = [];
      }

      const updated = createPlaceholderSuggestion(placeholder, cleanedSuggestionGroup, {
        isStandalone: true,
      });
      setSuggestionGroup(updated);

      const newSuggestion = updated.suggestions[updated.suggestions.length - 1];
      if (newSuggestion) {
        setPendingStandalonePlaceholderId(newSuggestion.id);
      }
      setOpenModalType(type);
      return placeholder;
    },
    [suggestionMode]
  );

  const handlePlaceholderNodeClick = useCallback(
    (resourceType: AgentFlowResourceType, placeholderData: AgentFlowResourceNodeData) => {
      setOpenModalType(resourceType);
      setPlaceholderBeingConfigured(placeholderData);
    },
    []
  );

  // Suggestion handlers
  const handleActOnSuggestion = useCallback(
    (suggestionId: string, action: 'accept' | 'reject') => {
      if (!suggestionGroup) return;

      const suggestion = suggestionGroup.suggestions.find((s) => s.id === suggestionId);
      const remaining = suggestionGroup.suggestions.filter((s) => s.id !== suggestionId);

      if (suggestion?.isStandalone && suggestionId === pendingStandalonePlaceholderId) {
        setPendingStandalonePlaceholderId(null);
        setOpenModalType(null);
        setPlaceholderBeingConfigured(null);
      }

      if (action === 'reject') {
        setSuggestionGroup(
          remaining.length > 0 ? { ...suggestionGroup, suggestions: remaining } : null
        );
        return;
      }

      if (suggestion) {
        if (suggestion.type === 'add' && suggestion.resource) {
          setResources((prev) => [...prev, suggestion.resource as AgentFlowResource]);
        } else if (
          suggestion.type === 'update' &&
          suggestion.resourceId &&
          suggestion.updatedFields
        ) {
          setResources((prev) =>
            prev.map((r) =>
              r.id === suggestion.resourceId
                ? ({ ...r, ...suggestion.updatedFields } as AgentFlowResource)
                : r
            )
          );
        } else if (suggestion.type === 'delete' && suggestion.resourceIdToDelete) {
          setResources((prev) => prev.filter((r) => r.id !== suggestion.resourceIdToDelete));
        }
      }

      setSuggestionGroup(
        remaining.length > 0 ? { ...suggestionGroup, suggestions: remaining } : null
      );
    },
    [suggestionGroup, pendingStandalonePlaceholderId]
  );

  const handleActOnSuggestionGroup = useCallback(
    (_groupId: string, action: 'accept' | 'reject') => {
      if (!suggestionGroup) return;

      const nonStandalone = suggestionGroup.suggestions.filter((s) => !s.isStandalone);
      const standalone = suggestionGroup.suggestions.filter((s) => s.isStandalone);

      if (action === 'reject') {
        setSuggestionGroup(
          standalone.length > 0 ? { ...suggestionGroup, suggestions: standalone } : null
        );
        return;
      }

      setResources((prev) => {
        let updated = [...prev];
        nonStandalone.forEach((s) => {
          if (s.type === 'add' && s.resource) {
            updated.push(s.resource as AgentFlowResource);
          } else if (s.type === 'update' && s.resourceId && s.updatedFields) {
            updated = updated.map((r) =>
              r.id === s.resourceId ? ({ ...r, ...s.updatedFields } as AgentFlowResource) : r
            );
          } else if (s.type === 'delete' && s.resourceIdToDelete) {
            updated = updated.filter((r) => r.id !== s.resourceIdToDelete);
          }
        });
        return updated;
      });

      setSuggestionGroup(
        standalone.length > 0 ? { ...suggestionGroup, suggestions: standalone } : null
      );
    },
    [suggestionGroup]
  );

  const handleConfirmModal = useCallback(() => {
    if (pendingStandalonePlaceholderId) {
      handleActOnSuggestion(pendingStandalonePlaceholderId, 'accept');
    }
    setOpenModalType(null);
    setPlaceholderBeingConfigured(null);
  }, [pendingStandalonePlaceholderId, handleActOnSuggestion]);

  const handleCancelModal = useCallback(() => {
    if (pendingStandalonePlaceholderId) {
      handleActOnSuggestion(pendingStandalonePlaceholderId, 'reject');
    }
    setOpenModalType(null);
    setPlaceholderBeingConfigured(null);
  }, [pendingStandalonePlaceholderId, handleActOnSuggestion]);

  // Autopilot suggestion creators
  const createInsertSuggestions = useCallback(() => {
    const timestamp = Date.now();
    setSuggestionGroup({
      id: `group-${timestamp}`,
      suggestions: [
        {
          id: `add-1-${timestamp}`,
          type: 'add',
          resource: {
            id: `tool-${timestamp}`,
            type: 'tool',
            name: 'Email Service',
            description: 'Send emails',
            iconUrl: '',
            hasBreakpoint: false,
            hasGuardrails: false,
            projectType: ProjectType.Internal,
          },
        },
        {
          id: `add-2-${timestamp}`,
          type: 'add',
          resource: {
            id: `ctx-${timestamp}`,
            type: 'context',
            name: 'User Preferences',
            description: 'User prefs',
            hasBreakpoint: false,
          },
        },
      ],
      metadata: { title: 'Add Suggestions' },
    });
  }, []);

  const createDeleteSuggestions = useCallback(() => {
    const timestamp = Date.now();
    const toDelete = resources.slice(0, 2);
    setSuggestionGroup({
      id: `group-${timestamp}`,
      suggestions: toDelete.map((r, i) => ({
        id: `del-${i}-${timestamp}`,
        type: 'delete' as const,
        resourceIdToDelete: r.id,
      })),
      metadata: { title: 'Delete Suggestions' },
    });
  }, [resources]);

  const createUpdateSuggestions = useCallback(() => {
    const timestamp = Date.now();
    const toUpdate = resources.slice(0, 2);
    setSuggestionGroup({
      id: `group-${timestamp}`,
      suggestions: toUpdate.map((r, i) => ({
        id: `upd-${i}-${timestamp}`,
        type: 'update' as const,
        resourceId: r.id,
        updatedFields: { name: `${r.name} (Updated)` },
      })),
      metadata: { title: 'Update Suggestions' },
    });
  }, [resources]);

  const createMixedSuggestions = useCallback(() => {
    const timestamp = Date.now();
    const existing = resources.slice(0, 2);
    setSuggestionGroup({
      id: `group-${timestamp}`,
      suggestions: [
        {
          id: `add-${timestamp}`,
          type: 'add',
          resource: {
            id: `tool-${timestamp}`,
            type: 'tool',
            name: 'New Tool',
            description: 'Added tool',
            iconUrl: '',
            hasBreakpoint: false,
            hasGuardrails: false,
            projectType: ProjectType.Internal,
          },
        },
        ...(existing[0]
          ? [
              {
                id: `upd-${timestamp}`,
                type: 'update' as const,
                resourceId: existing[0].id,
                updatedFields: { name: `${existing[0].name} (Updated)` },
              },
            ]
          : []),
        ...(existing[1]
          ? [
              {
                id: `del-${timestamp}`,
                type: 'delete' as const,
                resourceIdToDelete: existing[1].id,
              },
            ]
          : []),
      ],
      metadata: { title: 'Mixed Suggestions' },
    });
  }, [resources]);

  // Sticky notes handlers
  const handleAddStickyNote = useCallback((data: AgentFlowStickyNote) => {
    setStickyNotes((prev) => [...prev, data]);
  }, []);

  const handleUpdateStickyNote = useCallback(
    (id: string, updates: Partial<Omit<AgentFlowStickyNote, 'id'>>) => {
      setStickyNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...updates } : n)));
    },
    []
  );

  const handleRemoveStickyNote = useCallback((id: string) => {
    setStickyNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Dragging handlers
  const handleOrganize = useCallback(() => {
    setAgentNodePosition(undefined);
    setResourceNodePositions({});
  }, []);

  // Toggle handlers with state reset
  const handleToggleResources = useCallback((value: boolean) => {
    setHasResources(value);
    setResources(value ? sampleResources : []);
    setSuggestionGroup(null);
    setAgentNodePosition(undefined);
    setResourceNodePositions({});
  }, []);

  const handleToggleSuggestionMode = useCallback((mode: SuggestionMode) => {
    setSuggestionMode(mode);
    setSuggestionGroup(null);
    setPendingStandalonePlaceholderId(null);
    setOpenModalType(null);
  }, []);

  const renderSidebar = () => (
    <Column
      w={280}
      p={16}
      gap={12}
      style={{
        backgroundColor: 'var(--uix-canvas-background-secondary)',
        borderLeft: '1px solid var(--uix-canvas-border-de-emp)',
        overflowY: 'auto',
        color: 'var(--uix-canvas-foreground)',
      }}
    >
      <h3 style={{ margin: 0 }}>Current State</h3>

      {/* Selection info */}
      <div>
        <strong>Selected:</strong> {selectedResourceId || 'None'}
      </div>

      {/* Resource counts */}
      <div>
        <strong>Resources:</strong> {resources.length}
      </div>

      {/* Sticky notes info */}
      {enableStickyNotes && (
        <div>
          <strong>Sticky Notes:</strong> {stickyNotes.length}
        </div>
      )}

      {/* Suggestion info */}
      {suggestionGroup && (
        <div
          style={{
            padding: '12px',
            backgroundColor: 'var(--uix-canvas-background)',
            borderRadius: '4px',
            border: '1px solid var(--uix-canvas-border-de-emp)',
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Active Suggestions</div>
          <div style={{ fontSize: '0.875rem' }}>
            <div>
              <strong>Count:</strong> {suggestionGroup.suggestions.length}
            </div>
            <div>
              <strong>Type:</strong> {suggestionMode}
            </div>
          </div>
        </div>
      )}

      {/* Dragging info */}
      {enableDragging && (
        <div
          style={{
            padding: '12px',
            backgroundColor: 'var(--uix-canvas-background)',
            borderRadius: '4px',
            border: '1px solid var(--uix-canvas-border-de-emp)',
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Position Tracking</div>
          <div style={{ fontSize: '0.875rem', fontFamily: 'monospace' }}>
            <div>
              <strong>Zoom:</strong> {(zoomLevel * 100).toFixed(0)}%
            </div>
            {agentNodePosition && (
              <>
                <div style={{ marginTop: '8px', fontWeight: 'bold' }}>Agent Node:</div>
                <div>X: {agentNodePosition.x.toFixed(2)}</div>
                <div>Y: {agentNodePosition.y.toFixed(2)}</div>
              </>
            )}
            {Object.keys(resourceNodePositions).length > 0 && (
              <>
                <div style={{ marginTop: '8px', fontWeight: 'bold' }}>Resource Positions:</div>
                {Object.entries(resourceNodePositions).map(([id, pos]) => (
                  <div key={id} style={{ marginLeft: '8px', fontSize: '0.75rem' }}>
                    {id.split('=>').pop()?.split(':')[0]}: ({pos.x.toFixed(0)}, {pos.y.toFixed(0)})
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div
        style={{
          fontSize: '0.875rem',
          color: 'var(--uix-canvas-foreground-de-emp)',
          marginTop: '8px',
        }}
      >
        <p style={{ margin: '0 0 8px 0' }}>Click the + buttons on the agent node to add:</p>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          <li>Memory (top)</li>
          <li>Context (bottom-left)</li>
          <li>Escalations (bottom-center)</li>
          <li>Tools & MCPs (bottom-right)</li>
        </ul>
        {enableStickyNotes && (
          <p style={{ marginTop: '12px', marginBottom: 0 }}>
            Use the sticky note button at the bottom to add notes. Press Delete to remove.
          </p>
        )}
        {enableDragging && (
          <p style={{ marginTop: '12px', marginBottom: 0 }}>
            Drag nodes to reposition. Use Organize button to reset positions.
          </p>
        )}
        {suggestionMode === 'placeholders' && (
          <p style={{ marginTop: '12px', marginBottom: 0 }}>
            Placeholders appear when clicking +. Click them to configure, or click away to cancel.
          </p>
        )}
        {suggestionMode === 'autopilot' && (
          <p style={{ marginTop: '12px', marginBottom: 0 }}>
            Use suggestion buttons in controls to create batches. Accept/Reject individually or all
            at once.
          </p>
        )}
      </div>
    </Column>
  );

  const renderControlPanel = () => (
    <StoryInfoPanel title="Design Mode Playground" collapsible defaultCollapsed={false} position="top-right">
      <Column mt={12} gap={12}>
        {/* Resources toggle */}
        <Column gap={4}>
          <ApTypography variant={FontVariantToken.fontSizeS} style={{ fontWeight: 600 }}>
            Resources:
          </ApTypography>
          <Row gap={4}>
            <ApButton
              size="small"
              variant={hasResources ? 'primary' : 'secondary'}
              label="With"
              onClick={() => handleToggleResources(true)}
            />
            <ApButton
              size="small"
              variant={!hasResources ? 'primary' : 'secondary'}
              label="Empty"
              onClick={() => handleToggleResources(false)}
            />
          </Row>
        </Column>

        {/* Suggestions toggle */}
        <Column gap={4}>
          <ApTypography variant={FontVariantToken.fontSizeS} style={{ fontWeight: 600 }}>
            Suggestions:
          </ApTypography>
          <Row gap={4} style={{ flexWrap: 'wrap' }}>
            <ApButton
              size="small"
              variant={suggestionMode === 'off' ? 'primary' : 'secondary'}
              label="Off"
              onClick={() => handleToggleSuggestionMode('off')}
            />
            <ApButton
              size="small"
              variant={suggestionMode === 'placeholders' ? 'primary' : 'secondary'}
              label="Placeholders"
              onClick={() => handleToggleSuggestionMode('placeholders')}
            />
            <ApButton
              size="small"
              variant={suggestionMode === 'autopilot' ? 'primary' : 'secondary'}
              label="Autopilot"
              onClick={() => handleToggleSuggestionMode('autopilot')}
            />
          </Row>
        </Column>

        {/* Autopilot actions */}
        {suggestionMode === 'autopilot' && (
          <Column gap={4}>
            <ApTypography
              variant={FontVariantToken.fontSizeS}
              style={{ color: 'var(--uix-canvas-foreground-de-emp)' }}
            >
              Create suggestions:
            </ApTypography>
            <Row gap={4} style={{ flexWrap: 'wrap' }}>
              <ApButton
                size="small"
                variant="secondary"
                label="Inserts"
                onClick={createInsertSuggestions}
              />
              <ApButton
                size="small"
                variant="secondary"
                label="Deletes"
                onClick={createDeleteSuggestions}
              />
              <ApButton
                size="small"
                variant="secondary"
                label="Updates"
                onClick={createUpdateSuggestions}
              />
              <ApButton
                size="small"
                variant="secondary"
                label="Mixed"
                onClick={createMixedSuggestions}
              />
            </Row>
          </Column>
        )}

        {/* Sticky Notes toggle */}
        <Column gap={4}>
          <ApTypography variant={FontVariantToken.fontSizeS} style={{ fontWeight: 600 }}>
            Sticky Notes:
          </ApTypography>
          <Row gap={4}>
            <ApButton
              size="small"
              variant={enableStickyNotes ? 'primary' : 'secondary'}
              label="On"
              onClick={() => setEnableStickyNotes(true)}
            />
            <ApButton
              size="small"
              variant={!enableStickyNotes ? 'primary' : 'secondary'}
              label="Off"
              onClick={() => setEnableStickyNotes(false)}
            />
          </Row>
          {enableStickyNotes && (
            <Row gap={4}>
              <ApButton
                size="small"
                variant="secondary"
                label="Load Samples"
                onClick={() => setStickyNotes(sampleStickyNotes)}
              />
              <ApButton
                size="small"
                variant="secondary"
                label="Clear"
                onClick={() => setStickyNotes([])}
              />
            </Row>
          )}
        </Column>

        {/* Dragging toggle */}
        <Column gap={4}>
          <ApTypography variant={FontVariantToken.fontSizeS} style={{ fontWeight: 600 }}>
            Dragging:
          </ApTypography>
          <Row gap={4}>
            <ApButton
              size="small"
              variant={enableDragging ? 'primary' : 'secondary'}
              label="On"
              onClick={() => setEnableDragging(true)}
            />
            <ApButton
              size="small"
              variant={!enableDragging ? 'primary' : 'secondary'}
              label="Off"
              onClick={() => setEnableDragging(false)}
            />
          </Row>
        </Column>

        {/* Instructions toggle */}
        <Column gap={4}>
          <ApTypography variant={FontVariantToken.fontSizeS} style={{ fontWeight: 600 }}>
            Instructions:
          </ApTypography>
          <Row gap={4}>
            <ApButton
              size="small"
              variant={hasInstructions ? 'primary' : 'secondary'}
              label="With"
              onClick={() => setHasInstructions(true)}
            />
            <ApButton
              size="small"
              variant={!hasInstructions ? 'primary' : 'secondary'}
              label="Without"
              onClick={() => setHasInstructions(false)}
            />
          </Row>
          {hasInstructions && (
            <Column gap={8} style={{ marginTop: 8 }}>
              <Column gap={2}>
                <ApTypography
                  variant={FontVariantToken.fontSizeXs}
                  style={{ color: 'var(--uix-canvas-foreground-de-emp)' }}
                >
                  System prompt:
                </ApTypography>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="Enter system prompt..."
                  style={{
                    width: '100%',
                    minHeight: 60,
                    padding: 8,
                    fontSize: 12,
                    borderRadius: 4,
                    border: '1px solid var(--uix-canvas-border-de-emp)',
                    backgroundColor: 'var(--uix-canvas-background)',
                    color: 'var(--uix-canvas-foreground)',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />
              </Column>
              <Column gap={2}>
                <ApTypography
                  variant={FontVariantToken.fontSizeXs}
                  style={{ color: 'var(--uix-canvas-foreground-de-emp)' }}
                >
                  User prompt:
                </ApTypography>
                <textarea
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  placeholder="Enter user prompt..."
                  style={{
                    width: '100%',
                    minHeight: 60,
                    padding: 8,
                    fontSize: 12,
                    borderRadius: 4,
                    border: '1px solid var(--uix-canvas-border-de-emp)',
                    backgroundColor: 'var(--uix-canvas-background)',
                    color: 'var(--uix-canvas-foreground)',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />
              </Column>
            </Column>
          )}
        </Column>

        {/* Status info */}
        <Column
          gap={2}
          style={{ borderTop: '1px solid var(--uix-canvas-border-de-emp)', paddingTop: 8 }}
        >
          <ApTypography
            variant={FontVariantToken.fontSizeS}
            style={{ color: 'var(--uix-canvas-foreground-de-emp)' }}
          >
            Resources: {resources.length} | Notes: {stickyNotes.length} | Zoom:{' '}
            {(zoomLevel * 100).toFixed(0)}%
          </ApTypography>
        </Column>
      </Column>
    </StoryInfoPanel>
  );

  return (
    <ReactFlowProvider key={stateKey}>
      <Row w="100%" h="100%" style={{ position: 'relative' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <AgentFlow
            allowDragging={enableDragging}
            agentNodePosition={enableDragging ? agentNodePosition : undefined}
            onAgentNodePositionChange={setAgentNodePosition}
            resourceNodePositions={enableDragging ? resourceNodePositions : undefined}
            onResourceNodePositionChange={(id, pos) =>
              setResourceNodePositions((prev) => ({ ...prev, [id]: pos }))
            }
            zoomLevel={zoomLevel}
            onZoomLevelChange={setZoomLevel}
            definition={sampleAgentDefinition}
            spans={[]}
            name="Test Agent"
            description="Test Description"
            mode="design"
            resources={resources}
            onEnable={handleEnable}
            onDisable={handleDisable}
            onAddBreakpoint={handleAddBreakpoint}
            onRemoveBreakpoint={handleRemoveBreakpoint}
            onAddGuardrail={handleAddGuardrail}
            onAddResource={handleAddResourceDirect}
            onRemoveResource={handleRemoveResource}
            onSelectResource={handleSelectResource}
            enableTimelinePlayer={false}
            enableMemory
            enableStickyNotes={enableStickyNotes}
            stickyNotes={stickyNotes}
            onAddStickyNote={handleAddStickyNote}
            onUpdateStickyNote={handleUpdateStickyNote}
            onRemoveStickyNote={handleRemoveStickyNote}
            onOrganize={handleOrganize}
            onRequestResourcePlaceholder={
              suggestionMode === 'placeholders' ? handleRequestPlaceholder : undefined
            }
            onPlaceholderNodeClick={
              suggestionMode === 'placeholders' ? handlePlaceholderNodeClick : undefined
            }
            suggestionGroup={suggestionGroup}
            onActOnSuggestion={handleActOnSuggestion}
            onActOnSuggestionGroup={handleActOnSuggestionGroup}
            hasInstructions={hasInstructions}
            instructions={instructions}
          />
          {renderControlPanel()}
          {/* Placeholder configuration modal */}
          {openModalType && (
            <>
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  zIndex: 999,
                }}
                onClick={handleCancelModal}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  backgroundColor: 'var(--uix-canvas-background-raised)',
                  border: '1px solid var(--uix-canvas-border)',
                  borderRadius: 8,
                  padding: 24,
                  minWidth: 400,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  zIndex: 1000,
                }}
              >
                <h3 style={{ margin: '0 0 16px 0', color: 'var(--uix-canvas-foreground)' }}>
                  Configure {openModalType.charAt(0).toUpperCase() + openModalType.slice(1)}
                </h3>
                <p
                  style={{
                    margin: '0 0 24px 0',
                    color: 'var(--uix-canvas-foreground-de-emp)',
                    fontSize: '0.875rem',
                  }}
                >
                  This is a simulated configuration modal.
                  {placeholderBeingConfigured && (
                    <>
                      <br />
                      <br />
                      Placeholder: <strong>{placeholderBeingConfigured.name}</strong>
                    </>
                  )}
                </p>
                <Row gap={8} style={{ justifyContent: 'flex-end' }}>
                  <ApButton
                    size="small"
                    variant="secondary"
                    label="Cancel"
                    onClick={handleCancelModal}
                  />
                  <ApButton
                    size="small"
                    variant="primary"
                    label="Confirm"
                    onClick={handleConfirmModal}
                  />
                </Row>
              </div>
            </>
          )}
        </div>
        {renderSidebar()}
      </Row>
    </ReactFlowProvider>
  );
};

export const DesignMode: Story = {
  args: {
    mode: 'design',
  },
  render: () => <DesignModePlayground />,
  parameters: {
    docs: {
      description: {
        story:
          'Comprehensive design mode playground. Toggle any combination of features:\n\n' +
          '• **Resources**: With sample resources or empty canvas\n' +
          '• **Suggestions**: Off, Placeholders (click + buttons), or Autopilot (batch suggestions)\n' +
          '• **Sticky Notes**: Enable/disable with sample loading\n' +
          '• **Dragging**: Enable/disable position control\n' +
          '• **Instructions**: Toggle instruction prompts (system/user) on the agent node\n\n' +
          'Test features in isolation or combine them to verify interactions.',
      },
    },
  },
};

const ViewModeWrapper = () => {
  const [hasTimelinePlayer, setHasTimelinePlayer] = useState(false);
  const [hasInstructions, setHasInstructions] = useState(true);

  // Sample instructions for view mode
  const instructions = hasInstructions
    ? {
        system: 'You are a helpful assistant that helps users with their tasks.',
        user: 'Please help me complete my work efficiently.',
      }
    : undefined;

  const renderControlPanel = () => {
    return (
      <StoryInfoPanel title="View Mode Controls">
        <Column mt={12} gap={12}>
          <Column gap={4}>
            <ApTypography variant={FontVariantToken.fontSizeS} style={{ fontWeight: 600 }}>
              Timeline player:
            </ApTypography>
            <Row gap={8}>
              <ApButton
                size="small"
                variant={!hasTimelinePlayer ? 'primary' : 'secondary'}
                label="Off"
                onClick={() => setHasTimelinePlayer(false)}
              />
              <ApButton
                size="small"
                variant={hasTimelinePlayer ? 'primary' : 'secondary'}
                label="With Spans"
                onClick={() => setHasTimelinePlayer(true)}
              />
            </Row>
          </Column>
          <Column gap={4}>
            <ApTypography variant={FontVariantToken.fontSizeS} style={{ fontWeight: 600 }}>
              Instructions:
            </ApTypography>
            <Row gap={8}>
              <ApButton
                size="small"
                variant={hasInstructions ? 'primary' : 'secondary'}
                label="With"
                onClick={() => setHasInstructions(true)}
              />
              <ApButton
                size="small"
                variant={!hasInstructions ? 'primary' : 'secondary'}
                label="Without"
                onClick={() => setHasInstructions(false)}
              />
            </Row>
          </Column>
        </Column>
      </StoryInfoPanel>
    );
  };

  return (
    <ReactFlowProvider key={`${hasTimelinePlayer}-${hasInstructions}`}>
      <AgentFlowWrapper
        mode="view"
        initialResources={sampleResources}
        activeResourceIds={[]}
        spans={hasTimelinePlayer ? sampleSpans : []}
        definition={sampleAgentDefinition}
        enableTimelinePlayer={hasTimelinePlayer}
        hasInstructions={hasInstructions}
        instructions={instructions}
      />
      {renderControlPanel()}
    </ReactFlowProvider>
  );
};

export const ViewMode: Story = {
  args: {
    mode: 'view',
  },
  render: () => <ViewModeWrapper />,
  parameters: {
    docs: {
      description: {
        story:
          'Interactive view mode demo. Use the control panel to toggle:\n\n' +
          '• **Timeline player**: Show/hide the timeline with spans\n' +
          '• **Instructions**: Show/hide instruction prompts preview on the agent node',
      },
    },
  },
};

/**
 * Health Score Story
 * Demonstrates the health score badge feature on agent nodes with interactive controls
 */

const HealthScoreWrapper = ({
  mode,
  initialResources = sampleResources,
}: Pick<AgentFlowWrapperProps, 'mode' | 'initialResources'>) => {
  const [healthScore, setHealthScore] = useState<number | undefined>(95);

  const handleHealthScoreClick = useCallback(() => {
    alert('Health score clicked! This would open a panel with health score details.');
  }, []);

  const renderControlPanel = () => {
    return (
      <StoryInfoPanel title="Health Score Controls">
        <Column mt={12} gap={8}>
          <ApTypography variant={FontVariantToken.fontSizeM}>Set health score:</ApTypography>
          <Row gap={8} style={{ flexWrap: 'wrap' }}>
            <ApButton
              size="small"
              variant={healthScore === undefined ? 'primary' : 'secondary'}
              label="None"
              onClick={() => setHealthScore(undefined)}
            />
            <ApButton
              size="small"
              variant={healthScore === 0 ? 'primary' : 'secondary'}
              label="0"
              onClick={() => setHealthScore(0)}
            />
            <ApButton
              size="small"
              variant={healthScore === 50 ? 'primary' : 'secondary'}
              label="50"
              onClick={() => setHealthScore(50)}
            />
            <ApButton
              size="small"
              variant={healthScore === 95 ? 'primary' : 'secondary'}
              label="95"
              onClick={() => setHealthScore(95)}
            />
            <ApButton
              size="small"
              variant={healthScore === 100 ? 'primary' : 'secondary'}
              label="100"
              onClick={() => setHealthScore(100)}
            />
          </Row>
          <ApTypography
            variant={FontVariantToken.fontSizeS}
            style={{ color: 'var(--uix-canvas-foreground-de-emp)' }}
          >
            Current: {healthScore === undefined ? 'Not set' : healthScore}
          </ApTypography>
        </Column>
      </StoryInfoPanel>
    );
  };

  return (
    <ReactFlowProvider>
      <AgentFlow
        allowDragging
        definition={sampleAgentDefinition}
        spans={[]}
        name="Test Agent"
        description="Test Description"
        mode={mode}
        resources={initialResources}
        enableMemory
        healthScore={healthScore}
        onHealthScoreClick={handleHealthScoreClick}
      />
      {renderControlPanel()}
    </ReactFlowProvider>
  );
};

export const HealthScore: Story = {
  args: {
    mode: 'design',
  },
  render: (args) => <HealthScoreWrapper mode={args.mode} initialResources={sampleResources} />,
  parameters: {
    docs: {
      description: {
        story:
          'Interactive health score demo. Use the control panel to toggle between different health score values (None, 0, 50, 95, 100). The health score badge appears below the agent name and is clickable.',
      },
    },
  },
};
