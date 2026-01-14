import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Edge, Node, NodeProps } from '@uipath/apollo-react/canvas/xyflow/react';
import { Panel, Position, useReactFlow } from '@uipath/apollo-react/canvas/xyflow/react';
import { ApIcon } from '@uipath/apollo-react/material/components';
import { useCallback, useMemo } from 'react';
import {
  allNodeManifests,
  StoryInfoPanel,
  useCanvasStory,
  withCanvasProviders,
} from '../../storybook-utils';
import { DefaultCanvasTranslations } from '../../types';
import { getIcon } from '../../utils/icon-registry';
import { BaseCanvas } from '../BaseCanvas';
import { NewBaseNode } from '../BaseNode/NewBaseNode';
import type { NewBaseNodeData } from '../BaseNode/NewBaseNode.types';
import { CanvasPositionControls } from '../CanvasPositionControls';
import type { NodeToolbarConfig } from '../Toolbar';

// ============================================================================
// Meta Configuration
// ============================================================================

const meta: Meta = {
  title: 'Canvas/CollapseConfig',
  parameters: { layout: 'fullscreen' },
  decorators: [withCanvasProviders()],
};

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Get manifest display config
// ============================================================================

const agentManifest = allNodeManifests.find((m) => m.nodeType === 'uipath.agent');

// ============================================================================
// Collapsible Agent Node Component
// ============================================================================

interface CollapsibleAgentNodeData extends NewBaseNodeData {
  label?: string;
  collapsed?: boolean;
}

/**
 * A wrapper around the uipath.agent node that adds collapse/expand functionality.
 * Consumer controls collapse state via node data and toolbar actions.
 */
function CollapsibleAgentNode(props: NodeProps<Node<CollapsibleAgentNodeData>>) {
  const { id, data, selected, ...nodeProps } = props;
  const { setNodes, setEdges } = useReactFlow();
  const label = data?.label ?? agentManifest?.display.label ?? 'Agent';
  const collapsed = data?.collapsed ?? false;

  // Consumer handles collapse/expand logic
  const handleToggleCollapse = useCallback(() => {
    const newCollapsed = !collapsed;

    // Update this node's collapsed state
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, collapsed: newCollapsed } } : node
      )
    );

    // Hide/show connected artifact nodes
    const artifactHandleIds = ['escalation', 'memory', 'context', 'tools'];
    setEdges((edges) => {
      const connectedNodeIds = new Set<string>();
      edges.forEach((edge) => {
        if (edge.source === id && artifactHandleIds.includes(edge.sourceHandle ?? '')) {
          connectedNodeIds.add(edge.target);
        }
      });

      // Hide/show the connected nodes
      setNodes((nodes) =>
        nodes.map((node) =>
          connectedNodeIds.has(node.id) ? { ...node, hidden: newCollapsed } : node
        )
      );

      // Hide/show the edges
      return edges.map((edge) =>
        connectedNodeIds.has(edge.target) || connectedNodeIds.has(edge.source)
          ? { ...edge, hidden: newCollapsed }
          : edge
      );
    });
  }, [id, collapsed, setNodes, setEdges]);

  // Consumer provides toolbar with collapse action
  const toolbarConfig: NodeToolbarConfig = useMemo(
    () => ({
      position: 'top',
      align: 'end',
      actions: [
        {
          id: 'collapse-toggle',
          icon: <ApIcon name={collapsed ? 'unfold_more' : 'unfold_less'} size="16px" />,
          label: collapsed ? 'Expand' : 'Collapse',
          onAction: handleToggleCollapse,
        },
      ],
      overflowActions: [],
      overflowLabel: '',
    }),
    [collapsed, handleToggleCollapse]
  );

  const handleConfigurations = useMemo(
    () => [
      {
        position: Position.Left,
        handles: [{ id: 'input', type: 'target' as const, handleType: 'input' as const }],
      },
      {
        position: Position.Right,
        handles: [
          {
            id: 'success',
            type: 'source' as const,
            handleType: 'output' as const,
            label: 'Success',
          },
          { id: 'error', type: 'source' as const, handleType: 'output' as const, label: 'Error' },
        ],
      },
      ...(!collapsed
        ? [
            {
              position: Position.Top,
              handles: [
                {
                  id: 'memory',
                  type: 'source' as const,
                  handleType: 'artifact' as const,
                  label: 'Memory',
                  showButton: true,
                  onAction: () => {},
                },
                {
                  id: 'escalation',
                  type: 'source' as const,
                  handleType: 'artifact' as const,
                  label: 'Escalations',
                  showButton: true,
                  onAction: () => {},
                },
              ],
            },
            {
              position: Position.Bottom,
              handles: [
                {
                  id: 'context',
                  type: 'source' as const,
                  handleType: 'artifact' as const,
                  label: 'Context',
                  showButton: true,
                  onAction: () => {},
                },
                {
                  id: 'tools',
                  type: 'source' as const,
                  handleType: 'artifact' as const,
                  label: 'Tools',
                  showButton: true,
                  onAction: () => {},
                },
              ],
            },
          ]
        : []),
    ],
    [collapsed]
  );

  const AgentIcon = getIcon(agentManifest?.display.icon ?? 'uipath.agent');

  return (
    <NewBaseNode
      {...nodeProps}
      id={id}
      selected={selected}
      data={data}
      icon={<AgentIcon />}
      showAddButton={selected}
      display={{
        label,
        shape: collapsed ? 'square' : (agentManifest?.display.shape ?? 'rectangle'),
        iconBackground: agentManifest?.display.iconBackground,
      }}
      handleConfigurations={handleConfigurations}
      toolbarConfig={toolbarConfig}
    />
  );
}

// ============================================================================
// Story: Default
// ============================================================================

function DefaultStory() {
  const initialNodes = useMemo<Node[]>(
    () => [
      {
        id: 'agent-1',
        type: 'uipath.agent.collapsible',
        position: { x: 400, y: 300 },
        data: {
          label: 'AI Agent',
          collapsed: false,
          parameters: {},
        },
      },
      // Memory (1)
      {
        id: 'memory-1',
        type: 'uipath.agent.resource.memory',
        position: { x: 150, y: 140 },
        data: {
          display: { label: 'Memory' },
          parameters: {},
          useSmartHandles: true,
        },
      },
      // Escalations (3)
      {
        id: 'escalation-1',
        type: 'uipath.agent.resource.escalation',
        position: { x: 350, y: 80 },
        data: {
          display: { label: 'Escalation 1' },
          parameters: {},
          useSmartHandles: true,
        },
      },
      {
        id: 'escalation-2',
        type: 'uipath.agent.resource.escalation',
        position: { x: 530, y: 80 },
        data: {
          display: { label: 'Escalation 2' },
          parameters: {},
          useSmartHandles: true,
        },
      },
      {
        id: 'escalation-3',
        type: 'uipath.agent.resource.escalation',
        position: { x: 710, y: 140 },
        data: {
          display: { label: 'Escalation 3' },
          parameters: {},
          useSmartHandles: true,
        },
      },
      // Context (2)
      {
        id: 'context-1',
        type: 'uipath.agent.resource.context',
        position: { x: 150, y: 480 },
        data: {
          display: { label: 'Context 1' },
          parameters: {},
          useSmartHandles: true,
        },
      },
      {
        id: 'context-2',
        type: 'uipath.agent.resource.context',
        position: { x: 330, y: 540 },
        data: {
          display: { label: 'Context 2' },
          parameters: {},
          useSmartHandles: true,
        },
      },
      // Tools (4)
      {
        id: 'tools-1',
        type: 'uipath.agent.resource.tool',
        position: { x: 500, y: 540 },
        data: {
          display: { label: 'Tool 1' },
          parameters: {},
          useSmartHandles: true,
        },
      },
      {
        id: 'tools-2',
        type: 'uipath.agent.resource.tool',
        position: { x: 660, y: 540 },
        data: {
          display: { label: 'Tool 2' },
          parameters: {},
          useSmartHandles: true,
        },
      },
      {
        id: 'tools-3',
        type: 'uipath.agent.resource.tool',
        position: { x: 820, y: 480 },
        data: {
          display: { label: 'Tool 3' },
          parameters: {},
          useSmartHandles: true,
        },
      },
      {
        id: 'tools-4',
        type: 'uipath.agent.resource.tool',
        position: { x: 820, y: 320 },
        data: {
          display: { label: 'Tool 4' },
          parameters: {},
          useSmartHandles: true,
        },
      },
    ],
    []
  );

  const initialEdges = useMemo<Edge[]>(
    () => [
      // Memory
      {
        id: 'e-agent-memory',
        source: 'agent-1',
        target: 'memory-1',
        sourceHandle: 'memory',
        targetHandle: 'input',
      },
      // Escalations
      {
        id: 'e-agent-escalation-1',
        source: 'agent-1',
        target: 'escalation-1',
        sourceHandle: 'escalation',
        targetHandle: 'input',
      },
      {
        id: 'e-agent-escalation-2',
        source: 'agent-1',
        target: 'escalation-2',
        sourceHandle: 'escalation',
        targetHandle: 'input',
      },
      {
        id: 'e-agent-escalation-3',
        source: 'agent-1',
        target: 'escalation-3',
        sourceHandle: 'escalation',
        targetHandle: 'input',
      },
      // Context
      {
        id: 'e-agent-context-1',
        source: 'agent-1',
        target: 'context-1',
        sourceHandle: 'context',
        targetHandle: 'input',
      },
      {
        id: 'e-agent-context-2',
        source: 'agent-1',
        target: 'context-2',
        sourceHandle: 'context',
        targetHandle: 'input',
      },
      // Tools
      {
        id: 'e-agent-tools-1',
        source: 'agent-1',
        target: 'tools-1',
        sourceHandle: 'tools',
        targetHandle: 'input',
      },
      {
        id: 'e-agent-tools-2',
        source: 'agent-1',
        target: 'tools-2',
        sourceHandle: 'tools',
        targetHandle: 'input',
      },
      {
        id: 'e-agent-tools-3',
        source: 'agent-1',
        target: 'tools-3',
        sourceHandle: 'tools',
        targetHandle: 'input',
      },
      {
        id: 'e-agent-tools-4',
        source: 'agent-1',
        target: 'tools-4',
        sourceHandle: 'tools',
        targetHandle: 'input',
      },
    ],
    []
  );

  const { canvasProps } = useCanvasStory({
    initialNodes,
    initialEdges,
    additionalNodeTypes: {
      'uipath.agent.collapsible': CollapsibleAgentNode,
    },
  });

  return (
    <BaseCanvas {...canvasProps} mode="design">
      <StoryInfoPanel
        title="Collapsible nodes (Work in Progress)"
        description="Click on the agent node to see the collapse/expand button."
      />
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
    </BaseCanvas>
  );
}

export const Default: Story = {
  render: () => <DefaultStory />,
};
