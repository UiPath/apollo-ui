import type { Meta, StoryObj } from '@storybook/react-vite';
import { Column } from '@uipath/apollo-react/canvas/layouts';
import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { Panel } from '@uipath/apollo-react/canvas/xyflow/react';
import { useMemo, useState } from 'react';
import {
  createNode,
  NodePositions,
  StoryInfoPanel,
  useCanvasStory,
  withCanvasProviders,
} from '../../storybook-utils';
import { DefaultCanvasTranslations } from '../../types';
import { BaseCanvas } from '../BaseCanvas';
import type { BaseNodeData } from '../BaseNode';
import { CanvasPositionControls } from '../CanvasPositionControls';
import { NodeInspector } from '../NodeInspector';
import { NodePropertiesPanel } from './NodePropertiesPanel';

// ============================================================================
// Meta Configuration
// ============================================================================

const meta: Meta<typeof NodePropertiesPanel> = {
  title: 'Components/Panels/Node Flyout Panel',
  component: NodePropertiesPanel,
  parameters: { layout: 'fullscreen' },
  decorators: [withCanvasProviders()],
};

export default meta;
type Story = StoryObj<typeof NodePropertiesPanel>;

// ============================================================================
// Initial Data
// ============================================================================

function createInitialNodes(): Node<BaseNodeData>[] {
  return [
    createNode({
      id: 'decision',
      type: 'uipath.control-flow.decision',
      position: NodePositions.row1col1,
      display: { label: 'Decision Point', subLabel: 'Select this node to configure' },
    }),
    createNode({
      id: 'agent',
      type: 'uipath.agent',
      position: NodePositions.row2col1,
      display: { label: 'Review Agent', subLabel: 'Reviews loan applications' },
    }),
    createNode({
      id: 'approval',
      type: 'uipath.human-task.approval',
      position: NodePositions.row1col2,
      display: { label: 'Manager Approval', subLabel: 'Requires manager sign-off' },
    }),
  ];
}

// ============================================================================
// Story Component
// ============================================================================

function PropertiesPanelStory() {
  const [isPinned, setIsPinned] = useState(false);
  const initialNodes = useMemo(() => createInitialNodes(), []);

  const { canvasProps } = useCanvasStory({ initialNodes });

  return (
    <BaseCanvas {...canvasProps} mode="design">
      <NodePropertiesPanel
        position="right"
        enableValidation={true}
        maintainSelection={true}
        defaultPinned={isPinned}
        onPinnedChange={setIsPinned}
        onChange={(nodeId, field, value) => console.log(`Node ${nodeId}: ${field} = ${value}`)}
      />
      <StoryInfoPanel
        title="Node Properties Panel"
        description={`Click on nodes to open properties panel. Panel is ${isPinned ? 'pinned to the right' : 'floating near node'}.`}
      />
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
    </BaseCanvas>
  );
}

// ============================================================================
// Inspector Story Component
// ============================================================================

const inspectorNodes = (): Node<BaseNodeData>[] => [
  createNode({
    id: 'agent-1',
    type: 'uipath.agent',
    position: { x: 200, y: 350 },
    display: { label: 'AI Agent', subLabel: 'Claude Opus' },
    data: {
      parameters: {
        description: 'An AI agent that can perform tasks and make decisions.',
        capabilities: ['Data processing', 'Decision making', 'Integrations'],
      },
    },
  }),
  createNode({
    id: 'script-1',
    type: 'uipath.script',
    position: { x: 600, y: 200 },
    display: { label: 'Transform Data', subLabel: 'JavaScript' },
  }),
  createNode({
    id: 'decision-1',
    type: 'uipath.control-flow.decision',
    position: { x: 600, y: 450 },
    display: { label: 'Route Response', subLabel: 'Success check' },
  }),
];

const inspectorEdges = (): Edge[] => [
  { id: 'e-agent-script', source: 'agent-1', sourceHandle: 'success', target: 'script-1' },
  { id: 'e-agent-decision', source: 'agent-1', sourceHandle: 'error', target: 'decision-1' },
];

function InspectorStory() {
  const initialNodes = useMemo(() => inspectorNodes(), []);
  const initialEdges = useMemo(() => inspectorEdges(), []);
  const { canvasProps } = useCanvasStory({ initialNodes, initialEdges });

  return (
    <BaseCanvas {...canvasProps} mode="design">
      <NodeInspector />
      <Panel position="top-left">
        <Column
          p={20}
          gap={8}
          style={{
            backgroundColor: 'var(--canvas-background-secondary)',
            color: 'var(--canvas-foreground)',
          }}
        >
          <span className="text-lg font-bold">Node Inspector</span>
          <span className="text-sm">Click on nodes to see their raw data</span>
        </Column>
      </Panel>
    </BaseCanvas>
  );
}

// ============================================================================
// Exported Stories
// ============================================================================

export const Default: Story = {
  render: () => <PropertiesPanelStory />,
};

export const Inspector: Story = {
  render: () => <InspectorStory />,
};
