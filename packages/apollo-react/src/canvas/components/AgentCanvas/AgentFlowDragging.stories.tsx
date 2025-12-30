import { useCallback, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ReactFlowProvider } from '@uipath/apollo-react/canvas/xyflow/react';
import { Column, Row } from '@uipath/apollo-react/canvas/layouts';
import { AgentFlow } from './AgentFlow';
import {
  ProjectType,
  type AgentFlowProps,
  type AgentFlowResource,
  type AgentFlowResourceNodeData,
  type AgentFlowResourceType,
} from '../../types';

const meta: Meta<typeof AgentFlow> = {
  title: 'Canvas/AgentFlow with Dragging',
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

const sampleTools = [
  { name: 'Send Email', description: 'Email Service', projectType: ProjectType.Internal },
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
    iconUrl: '',
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

/**
 * Design Mode with Dragging
 * Demonstrates the ability to drag the agent node and zoom in design mode
 */
const DesignModeWithDraggingComponent = (_args: AgentFlowProps) => {
  const [agentNodePosition, onAgentNodePositionChange] = useState<
    { x: number; y: number } | undefined
  >({ x: 100, y: 400 });
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Initialize resourceNodePositions with one resource having a custom position
  const [resourceNodePositions, setResourceNodePositions] = useState<
    Record<string, { x: number; y: number }>
  >(() => {
    const firstResource = sampleResources[0];
    if (firstResource) {
      return {
        [`agent=>${firstResource.name}:${firstResource.id}`]: { x: 1400, y: 700 },
      };
    }
    return {};
  });

  const [resources, setResources] = useState<AgentFlowResource[]>(sampleResources);
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);

  const handleSelectResource = useCallback((resourceId: string | null) => {
    setSelectedResourceId(resourceId);
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

  const handleSetResourceNodePosition = useCallback(
    (resourceId: string, position: { x: number; y: number }) => {
      setResourceNodePositions((prev) => ({
        ...prev,
        [resourceId]: position,
      }));
    },
    []
  );

  const setSpanForSelectedNode = useCallback((_node: any) => {}, []);

  const getNodeFromSelectedSpan = useCallback((_nodes: any[]) => {
    return null;
  }, []);

  const renderSidebar = () => {
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
        <h3 style={{ margin: 0 }}>Design Mode with Dragging</h3>
        {selectedResourceId && (
          <div>
            <strong>Selected:</strong> {selectedResourceId}
          </div>
        )}
        <div>
          <strong>Resources:</strong> {resources.length}
        </div>
        {agentNodePosition && (
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
        <div
          style={{
            padding: '12px',
            backgroundColor: 'var(--uix-canvas-background)',
            borderRadius: '4px',
            border: '1px solid var(--uix-canvas-border-de-emp)',
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Zoom Level</div>
          <div style={{ fontSize: '0.875rem', fontFamily: 'monospace' }}>
            <strong>{(zoomLevel * 100).toFixed(0)}%</strong>
          </div>
        </div>
        <div
          style={{
            padding: '12px',
            backgroundColor: 'var(--uix-canvas-background)',
            borderRadius: '4px',
            border: '1px solid var(--uix-canvas-border-de-emp)',
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Resource Positions</div>
          <div
            style={{
              fontSize: '0.75rem',
              fontFamily: 'monospace',
              maxHeight: '400px',
              overflowY: 'auto',
            }}
          >
            {resources.map((resource) => {
              // Find position from resourceNodePositions state
              // Node ID pattern: {agentNodeId}=>{resource.name}:{resource.id}
              const nodeId = `agent=>${resource.name}:${resource.id}`;
              const position = resourceNodePositions[nodeId];
              return (
                <div
                  key={resource.id}
                  style={{
                    padding: '8px',
                    marginBottom: '8px',
                    backgroundColor: 'var(--uix-canvas-background)',
                    borderRadius: '4px',
                    border: '1px solid var(--uix-canvas-border-de-emp)',
                  }}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '0.8125rem' }}>
                    {resource.name}
                  </div>
                  <div
                    style={{
                      color: 'var(--uix-canvas-foreground-de-emp)',
                      fontSize: '0.75rem',
                      marginBottom: '4px',
                    }}
                  >
                    {resource.type} • {resource.id.substring(0, 12)}...
                  </div>
                  {position ? (
                    <div style={{ color: 'var(--uix-canvas-primary)' }}>
                      <div>
                        <strong>X:</strong> {position.x.toFixed(2)}
                      </div>
                      <div>
                        <strong>Y:</strong> {position.y.toFixed(2)}
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{ color: 'var(--uix-canvas-foreground-de-emp)', fontStyle: 'italic' }}
                    >
                      Auto-positioned
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ fontSize: '0.875rem', color: 'var(--uix-canvas-foreground-de-emp)' }}>
          <p>Click the + buttons on the agent node to add:</p>
          <ul>
            <li>Memory (top)</li>
            <li>Context (bottom-left)</li>
            <li>Escalations (bottom-center)</li>
            <li>Tools & MCPs (bottom-right)</li>
          </ul>
        </div>
      </Column>
    );
  };

  return (
    <ReactFlowProvider>
      <Row w="100%" h="100%" style={{ position: 'relative' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <AgentFlow
            allowDragging={true}
            agentNodePosition={agentNodePosition}
            onAgentNodePositionChange={onAgentNodePositionChange}
            resourceNodePositions={resourceNodePositions}
            onResourceNodePositionChange={handleSetResourceNodePosition}
            zoomLevel={zoomLevel}
            onZoomLevelChange={setZoomLevel}
            definition={sampleAgentDefinition}
            spans={[]}
            name="Test Agent"
            description="Test Description"
            mode="design"
            resources={resources}
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
            enableTimelinePlayer={false}
            enableMemory={true}
          />
        </div>
        {renderSidebar()}
      </Row>
    </ReactFlowProvider>
  );
};

export const DesignModeWithDragging: Story = {
  args: {
    mode: 'design',
    resources: sampleResources,
    definition: sampleAgentDefinition,
    spans: [],
    name: 'Test Agent',
    description: 'Test Description',
    enableTimelinePlayer: false,
  },
  render: (args) => <DesignModeWithDraggingComponent {...args} />,
};

/**
 * Design Mode with Dragging Empty Positions
 * Demonstrates the ability to drag the agent node and zoom in design mode
 */
const DesignModeWithDraggingEmptyComponent = (_args: AgentFlowProps) => {
  const [agentNodePosition, onAgentNodePositionChange] = useState<
    { x: number; y: number } | undefined
  >(undefined);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const [resourceNodePositions, setResourceNodePositions] = useState<
    Record<string, { x: number; y: number }>
  >(() => {
    return {};
  });

  const [resources, setResources] = useState<AgentFlowResource[]>(sampleResources);
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);

  const handleSelectResource = useCallback((resourceId: string | null) => {
    setSelectedResourceId(resourceId);
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

  const handleSetResourceNodePosition = useCallback(
    (resourceId: string, position: { x: number; y: number }) => {
      setResourceNodePositions((prev) => ({
        ...prev,
        [resourceId]: position,
      }));
    },
    []
  );

  const setSpanForSelectedNode = useCallback((_node: any) => {}, []);

  const getNodeFromSelectedSpan = useCallback((_nodes: any[]) => {
    return null;
  }, []);

  const renderSidebar = () => {
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
        <h3 style={{ margin: 0 }}>Design Mode with Dragging</h3>
        {selectedResourceId && (
          <div>
            <strong>Selected:</strong> {selectedResourceId}
          </div>
        )}
        <div>
          <strong>Resources:</strong> {resources.length}
        </div>
        {agentNodePosition && (
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
        <div
          style={{
            padding: '12px',
            backgroundColor: 'var(--uix-canvas-background)',
            borderRadius: '4px',
            border: '1px solid var(--uix-canvas-border-de-emp)',
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Zoom Level</div>
          <div style={{ fontSize: '0.875rem', fontFamily: 'monospace' }}>
            <strong>{(zoomLevel * 100).toFixed(0)}%</strong>
          </div>
        </div>
        <div
          style={{
            padding: '12px',
            backgroundColor: 'var(--uix-canvas-background)',
            borderRadius: '4px',
            border: '1px solid var(--uix-canvas-border-de-emp)',
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Resource Positions</div>
          <div
            style={{
              fontSize: '0.75rem',
              fontFamily: 'monospace',
              maxHeight: '400px',
              overflowY: 'auto',
            }}
          >
            {resources.map((resource) => {
              // Find position from resourceNodePositions state
              // Node ID pattern: {agentNodeId}=>{resource.name}:{resource.id}
              const nodeId = `agent=>${resource.name}:${resource.id}`;
              const position = resourceNodePositions[nodeId];
              return (
                <div
                  key={resource.id}
                  style={{
                    padding: '8px',
                    marginBottom: '8px',
                    backgroundColor: 'var(--uix-canvas-background)',
                    borderRadius: '4px',
                    border: '1px solid var(--uix-canvas-border-de-emp)',
                  }}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '0.8125rem' }}>
                    {resource.name}
                  </div>
                  <div
                    style={{
                      color: 'var(--uix-canvas-foreground-de-emp)',
                      fontSize: '0.75rem',
                      marginBottom: '4px',
                    }}
                  >
                    {resource.type} • {resource.id.substring(0, 12)}...
                  </div>
                  {position ? (
                    <div style={{ color: 'var(--uix-canvas-primary)' }}>
                      <div>
                        <strong>X:</strong> {position.x.toFixed(2)}
                      </div>
                      <div>
                        <strong>Y:</strong> {position.y.toFixed(2)}
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{ color: 'var(--uix-canvas-foreground-de-emp)', fontStyle: 'italic' }}
                    >
                      Auto-positioned
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ fontSize: '0.875rem', color: 'var(--uix-canvas-foreground-de-emp)' }}>
          <p>Click the + buttons on the agent node to add:</p>
          <ul>
            <li>Memory (top)</li>
            <li>Context (bottom-left)</li>
            <li>Escalations (bottom-center)</li>
            <li>Tools & MCPs (bottom-right)</li>
          </ul>
        </div>
      </Column>
    );
  };

  return (
    <ReactFlowProvider>
      <Row w="100%" h="100%" style={{ position: 'relative' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <AgentFlow
            allowDragging={true}
            agentNodePosition={agentNodePosition}
            onAgentNodePositionChange={onAgentNodePositionChange}
            resourceNodePositions={resourceNodePositions}
            onResourceNodePositionChange={handleSetResourceNodePosition}
            zoomLevel={zoomLevel}
            onZoomLevelChange={setZoomLevel}
            definition={sampleAgentDefinition}
            spans={[]}
            name="Test Agent"
            description="Test Description"
            mode="design"
            resources={resources}
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
            enableTimelinePlayer={false}
            enableMemory={true}
          />
        </div>
        {renderSidebar()}
      </Row>
    </ReactFlowProvider>
  );
};

export const DesignModeWithDraggingEmpty: Story = {
  args: {
    mode: 'design',
    resources: sampleResources,
    definition: sampleAgentDefinition,
    spans: [],
    name: 'Test Agent',
    description: 'Test Description',
    enableTimelinePlayer: false,
  },
  render: (args) => <DesignModeWithDraggingEmptyComponent {...args} />,
};

/**
 * Design Mode with Zoom Level Only
 * Demonstrates zoom-only control - all nodes are auto-positioned but zoom is controlled
 */
const DesignModeWithZoomLevelOnlyComponent = (_args: AgentFlowProps) => {
  // Only control zoom level - start at 150%
  const [zoomLevel, setZoomLevel] = useState<number>(1.5);

  const [resources, setResources] = useState<AgentFlowResource[]>(sampleResources);
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);

  const handleSelectResource = useCallback((resourceId: string | null) => {
    setSelectedResourceId(resourceId);
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

  const setSpanForSelectedNode = useCallback((_node: any) => {}, []);

  const getNodeFromSelectedSpan = useCallback((_nodes: any[]) => {
    return null;
  }, []);

  const renderSidebar = () => {
    return (
      <Column
        w={300}
        p={16}
        gap={16}
        style={{
          backgroundColor: 'var(--uix-canvas-background-secondary)',
          borderLeft: '1px solid var(--uix-canvas-border-de-emp)',
          color: 'var(--uix-canvas-foreground)',
          overflowY: 'auto',
        }}
      >
        <h3 style={{ margin: 0 }}>Zoom Level Control</h3>
        {selectedResourceId && (
          <div>
            <strong>Selected:</strong> {selectedResourceId}
          </div>
        )}
        <div>
          <strong>Resources:</strong> {resources.length}
        </div>

        {/* Agent Node Position */}
        <div
          style={{
            padding: '12px',
            backgroundColor: 'var(--uix-canvas-background)',
            borderRadius: '4px',
            border: '1px solid var(--uix-canvas-border-de-emp)',
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Agent Node Position</div>
          <div
            style={{
              fontSize: '0.875rem',
              fontFamily: 'monospace',
              color: 'var(--uix-canvas-foreground-de-emp)',
              fontStyle: 'italic',
            }}
          >
            Auto-positioned
          </div>
        </div>

        {/* Zoom Level */}
        <div
          style={{
            padding: '12px',
            backgroundColor: 'var(--uix-canvas-background)',
            borderRadius: '4px',
            border: '1px solid var(--uix-canvas-border-de-emp)',
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Zoom Level</div>
          <div
            style={{
              fontSize: '1.5rem',
              fontFamily: 'monospace',
              fontWeight: 'bold',
              color: 'var(--uix-canvas-primary)',
            }}
          >
            {(zoomLevel * 100).toFixed(0)}%
          </div>
          <div
            style={{
              fontSize: '0.75rem',
              color: 'var(--uix-canvas-foreground-de-emp)',
              marginTop: '8px',
            }}
          >
            Use mouse wheel or trackpad to zoom in/out
          </div>
        </div>

        {/* Resource Positions */}
        <div
          style={{
            padding: '12px',
            backgroundColor: 'var(--uix-canvas-background)',
            borderRadius: '4px',
            border: '1px solid var(--uix-canvas-border-de-emp)',
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Resource Positions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {resources.map((resource) => {
              const resourceId = `agent=>${resource.name}:${resource.id}`;
              return (
                <div
                  key={resourceId}
                  style={{
                    fontSize: '0.75rem',
                    padding: '8px',
                    backgroundColor: 'var(--uix-canvas-background)',
                    borderRadius: '4px',
                    border: '1px solid var(--uix-canvas-border-de-emp)',
                  }}
                >
                  <div style={{ fontWeight: '500', marginBottom: '4px' }}>{resource.name}</div>
                  <div
                    style={{
                      fontFamily: 'monospace',
                      color: 'var(--uix-canvas-foreground-de-emp)',
                      fontStyle: 'italic',
                    }}
                  >
                    Auto-positioned
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div
          style={{
            padding: '12px',
            backgroundColor: 'var(--uix-canvas-background)',
            borderRadius: '4px',
            border: '1px solid var(--uix-canvas-warning-icon)',
          }}
        >
          <div
            style={{
              fontWeight: 'bold',
              marginBottom: '8px',
              color: 'var(--uix-canvas-warning-text)',
            }}
          >
            ℹ️ Note
          </div>
          <div
            style={{
              fontSize: '0.75rem',
              color: 'var(--uix-canvas-warning-text)',
              lineHeight: '1.5',
            }}
          >
            <p style={{ margin: '0 0 8px 0' }}>
              This story demonstrates <strong>zoom-only control</strong>:
            </p>
            <ul style={{ margin: '0 0 8px 0', paddingLeft: '20px' }}>
              <li>Initial zoom level is set to 150%</li>
              <li>All nodes (agent + resources) are auto-positioned</li>
              <li>Zoom changes are captured and displayed in real-time</li>
            </ul>
          </div>
        </div>
      </Column>
    );
  };

  return (
    <ReactFlowProvider>
      <Row w="100%" h="100%" style={{ position: 'relative' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <AgentFlow
            allowDragging={true}
            // No agentNodePosition - let it auto-position
            // No resourceNodePositions - let them auto-position
            zoomLevel={zoomLevel}
            onZoomLevelChange={setZoomLevel}
            definition={sampleAgentDefinition}
            spans={[]}
            name="Test Agent"
            description="Test Description"
            mode="design"
            resources={resources}
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
            enableTimelinePlayer={false}
            enableMemory={true}
          />
        </div>
        {renderSidebar()}
      </Row>
    </ReactFlowProvider>
  );
};

export const DesignModeWithZoomLevelOnly: Story = {
  args: {
    mode: 'design',
    resources: sampleResources,
    definition: sampleAgentDefinition,
    spans: [],
    name: 'Test Agent',
    description: 'Test Description',
    enableTimelinePlayer: false,
  },
  render: (args) => <DesignModeWithZoomLevelOnlyComponent {...args} />,
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates zoom-only control where all nodes are auto-positioned but the zoom level is controlled by the parent. Initial zoom is set to 150%. Perfect for persisting user zoom preferences while using automatic layout.',
      },
    },
  },
};
