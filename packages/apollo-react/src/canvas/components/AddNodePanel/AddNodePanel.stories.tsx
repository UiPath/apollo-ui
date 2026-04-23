import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { Panel, Position, useReactFlow } from '@uipath/apollo-react/canvas/xyflow/react';
import { useMemo } from 'react';
import { useAddNodeOnConnectEnd, useCanvasEvent } from '../../hooks';
import {
  createNode,
  NodePositions,
  StoryInfoPanel,
  useCanvasStory,
  withCanvasProviders,
} from '../../storybook-utils';
import { DefaultCanvasTranslations } from '../../types';
import { type CanvasHandleActionEvent, showPreviewGraph } from '../../utils';
import { BaseCanvas } from '../BaseCanvas';
import type { BaseNodeData } from '../BaseNode';
import { CanvasPositionControls } from '../CanvasPositionControls';
import { LoopCanvasNode } from '../LoopNode';
import type { ListItem } from '../Toolbox';
import { AddNodePanel } from '.';
import { AddNodeManager } from './AddNodeManager';
import type { NodeItemData } from './AddNodePanel.types';

// ============================================================================
// Meta Configuration
// ============================================================================

const meta: Meta<typeof AddNodePanel> = {
  title: 'Canvas/AddNodePanel',
  component: AddNodePanel,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [withCanvasProviders()],
  argTypes: {
    items: { control: 'object' },
  },
};

export default meta;
type Story = StoryObj<typeof AddNodePanel>;

// ============================================================================
// Shared
// ============================================================================

const NODE_OPTIONS: ListItem<NodeItemData>[] = [
  {
    id: '1',
    name: 'Manual trigger',
    icon: { name: 'touch_app' },
    data: { type: 'manual-trigger', category: 'Triggers' },
  },
  {
    id: '2',
    name: 'Schedule trigger',
    icon: { name: 'schedule' },
    data: { type: 'schedule-trigger', category: 'Triggers' },
  },
  {
    id: '3',
    name: 'Webhook trigger',
    icon: { name: 'webhook' },
    data: { type: 'webhook-trigger', category: 'Triggers' },
  },
  {
    id: '4',
    name: 'AI Agent long long long long long long name',
    icon: { name: 'smart_toy' },
    data: { type: 'ai-agent', category: 'AI' },
    description: 'Autonomous AI assistant that processes complex multi-step workflows end to end',
  },
  {
    id: '5',
    name: 'OpenAI',
    icon: { name: 'psychology' },
    data: { type: 'openai', category: 'AI' },
    description: 'GPT models integration for natural language processing and text generation tasks',
  },
  {
    id: '6',
    name: 'Data extractor',
    icon: { name: 'file_copy' },
    data: { type: 'data-extractor', category: 'Data' },
    description:
      'Extract structured data from documents, PDFs, images, and scanned files automatically',
  },
  {
    id: '7',
    name: 'Sentiment Analyzer',
    icon: { name: 'sentiment_satisfied' },
    data: { type: 'sentiment-analyzer', category: 'AI' },
    description: 'Analyze text sentiment',
  },
  {
    id: '8',
    name: 'Action',
    icon: { name: 'settings' },
    data: { type: 'action', category: 'Actions' },
    description: 'Generic action node',
  },
];

const CATEGORY_ITEMS: ListItem<NodeItemData>[] = Object.entries(
  NODE_OPTIONS.reduce<Record<string, ListItem<NodeItemData>[]>>((acc, node) => {
    const category = node.data.category;
    if (category) {
      acc[category] = acc[category] || [];
      acc[category].push(node);
    }
    return acc;
  }, {})
).map(([category, nodes], index) => ({
  id: `category-${index}`,
  name: category,
  icon: nodes[0]?.icon,
  data: { type: 'category', category },
  children: nodes,
}));

// Tall categories that overflow the panel height so scroll position is
// actually meaningful. Used by the scroll-preservation story.
const makeLeafChildren = (
  prefix: string,
  count: number,
  iconName: string
): ListItem<NodeItemData>[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `${prefix}-${i}`,
    name: `${prefix} item ${String(i).padStart(2, '0')}`,
    icon: { name: iconName },
    data: { type: prefix, category: prefix },
  }));

// Insert a drillable subcategory partway down so exercising scroll-restore
// requires the user to scroll first.
const makeCategoryWithNestedSubcategory = (
  prefix: string,
  leafCount: number,
  subcategoryAtIndex: number,
  iconName: string,
  subIconName: string
): ListItem<NodeItemData>[] => {
  const leaves = makeLeafChildren(prefix, leafCount, iconName);
  const subcategory: ListItem<NodeItemData> = {
    id: `${prefix}-sub`,
    name: `${prefix} ▸ Subcategory (drill in, then Back)`,
    icon: { name: 'folder_open' },
    data: { type: 'subcategory', category: `${prefix}/Sub` },
    children: makeLeafChildren(`${prefix}-sub`, 30, subIconName),
  };
  return [...leaves.slice(0, subcategoryAtIndex), subcategory, ...leaves.slice(subcategoryAtIndex)];
};

const SCROLLABLE_CATEGORY_ITEMS: ListItem<NodeItemData>[] = [
  {
    id: 'scroll-category-a',
    name: 'Category A — scroll down to find the subcategory',
    icon: { name: 'folder' },
    data: { type: 'category', category: 'A' },
    children: makeCategoryWithNestedSubcategory('A', 40, 15, 'bolt', 'database'),
  },
  {
    id: 'scroll-category-b',
    name: 'Category B — subcategory near the bottom',
    icon: { name: 'folder' },
    data: { type: 'category', category: 'B' },
    children: makeCategoryWithNestedSubcategory('B', 40, 30, 'code', 'bug_report'),
  },
  {
    id: 'scroll-category-c',
    name: 'Category C — never visited, opens at top',
    icon: { name: 'folder' },
    data: { type: 'category', category: 'C' },
    children: makeCategoryWithNestedSubcategory('C', 40, 5, 'cpu', 'shield'),
  },
];

const PREVIEW_SELECTION_NODE_TYPES = {
  'uipath.control-flow.foreach': LoopCanvasNode,
  'uipath.control-flow.while': LoopCanvasNode,
};

const PREVIEW_SELECTION_LOOP_TYPES = new Set([
  'uipath.control-flow.foreach',
  'uipath.control-flow.while',
]);
const PREVIEW_SELECTION_LOOP_SIZE = { width: 720, height: 432 } as const;

function applyPreviewSelectionNodeSizing(newNode: Node, newEdges: Edge[]) {
  if (!PREVIEW_SELECTION_LOOP_TYPES.has(newNode.type!)) {
    return { newNode, newEdges };
  }

  return {
    newNode: {
      ...newNode,
      width: PREVIEW_SELECTION_LOOP_SIZE.width,
      height: PREVIEW_SELECTION_LOOP_SIZE.height,
    },
    newEdges,
  };
}

function createInitialNodes(): Node<BaseNodeData>[] {
  return [
    createNode({
      id: 'trigger',
      type: 'uipath.manual-trigger',
      position: NodePositions.row2col1,
      display: { label: 'Manual trigger' },
    }),
    createNode({
      id: 'action-1',
      type: 'uipath.blank-node',
      position: NodePositions.row2col2,
      display: { label: 'Action', subLabel: 'Process data' },
    }),
  ];
}

/**
 * Standalone panel wrapper component.
 */
function StandalonePanelWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        backgroundColor: 'var(--color-background-secondary)',
        paddingTop: '40px',
      }}
    >
      <div
        style={{
          width: '320px',
          margin: '0 auto',
          backgroundColor: 'var(--canvas-background-raised)',
          border: '1px solid var(--canvas-border-de-emp)',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ============================================================================
// Story Components
// ============================================================================

/**
 * Main preview selection story demonstrating node addition workflow.
 */
function PreviewSelectionStory() {
  const initialNodes = useMemo(() => createInitialNodes(), []);
  const { canvasProps } = useCanvasStory({
    initialNodes,
    initialEdges: [
      {
        id: 'e-trigger-action-1',
        source: 'trigger',
        target: 'action-1',
        sourceHandle: 'output',
        targetHandle: 'input',
      },
    ],
    additionalNodeTypes: PREVIEW_SELECTION_NODE_TYPES,
  });

  const reactFlowInstance = useReactFlow();
  useCanvasEvent('handle:action', (event: CanvasHandleActionEvent) => {
    if (!reactFlowInstance) return;

    const { handleId, nodeId, position, handleType } = event;
    if (handleId && nodeId) {
      const sourceHandleType = handleType === 'input' ? 'target' : 'source';
      showPreviewGraph({
        sourceNodeId: nodeId,
        sourceHandleId: handleId,
        reactFlowInstance,
        sourceHandleType,
        handlePosition: position as Position,
      });
    }
  });

  const handleAddNodeOnConnectEnd = useAddNodeOnConnectEnd();

  return (
    <BaseCanvas
      {...canvasProps}
      onConnectEnd={handleAddNodeOnConnectEnd}
      deleteKeyCode={['Backspace', 'Delete']}
      mode="design"
      defaultViewport={{ x: 0, y: 0, zoom: 1 }}
    >
      <AddNodeManager onBeforeNodeAdded={applyPreviewSelectionNodeSizing} />
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
      <StoryInfoPanel
        title="Add node with preview selection"
        description="Click + button → Creates preview → Select preview → Choose node type"
      />
    </BaseCanvas>
  );
}

/**
 * Story demonstrating source handles on all four sides.
 */
function AllSidesStory() {
  const initialNodes = useMemo(
    () => [
      createNode({
        id: 'center',
        type: 'uipath.blank-node',
        position: NodePositions.row2col2,
        display: { label: 'Hub Node', subLabel: 'Handles on all sides' },
        handleConfigurations: [
          {
            position: Position.Right,
            handles: [{ id: 'output-right', type: 'source', handleType: 'output' }],
          },
          {
            position: Position.Left,
            handles: [{ id: 'output-left', type: 'source', handleType: 'output' }],
          },
          {
            position: Position.Top,
            handles: [{ id: 'output-top', type: 'source', handleType: 'output' }],
          },
          {
            position: Position.Bottom,
            handles: [{ id: 'output-bottom', type: 'source', handleType: 'output' }],
          },
        ],
      }),
    ],
    []
  );
  const { canvasProps } = useCanvasStory({ initialNodes });

  const reactFlowInstance = useReactFlow();
  useCanvasEvent('handle:action', (event: CanvasHandleActionEvent) => {
    if (!reactFlowInstance) return;

    const { handleId, nodeId, position, handleType } = event;
    if (handleId && nodeId) {
      const sourceHandleType = handleType === 'input' ? 'target' : 'source';
      showPreviewGraph({
        sourceNodeId: nodeId,
        sourceHandleId: handleId,
        reactFlowInstance,
        sourceHandleType,
        handlePosition: position as Position,
      });
    }
  });

  return (
    <BaseCanvas {...canvasProps} mode="design" defaultViewport={{ x: 0, y: 0, zoom: 1 }}>
      <AddNodeManager />
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
      <StoryInfoPanel
        title="Source handles on all sides"
        description="Single node with output handles on Top, Bottom, Left, and Right."
      />
    </BaseCanvas>
  );
}

// ============================================================================
// Exported Stories
// ============================================================================

export const PreviewSelection: Story = {
  name: 'Add node with preview selection',
  render: () => <PreviewSelectionStory />,
};

export const HandlesOnAllSides: Story = {
  name: 'Add node on all sides',
  render: () => <AllSidesStory />,
};

export const NodePanelStaticItems: Story = {
  name: 'Add node panel with static items',
  args: {
    items: CATEGORY_ITEMS,
    onNodeSelect: (node) => console.log('Selected node:', node),
    onClose: () => console.log('Closed selector'),
  },
  render: (args) => (
    <StandalonePanelWrapper>
      <AddNodePanel {...args} />
    </StandalonePanelWrapper>
  ),
};

export const NodePanelWithCustomSearch: Story = {
  name: 'Add node panel with custom search',
  args: {
    items: CATEGORY_ITEMS,
    onNodeSelect: (node) => {
      console.log('Selected node:', node);
      alert(`Selected: ${node.data.type}`);
    },
    onClose: () => console.log('Closed selector'),
    onSearch: async (query: string) => {
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 500 + 200));
      return NODE_OPTIONS.filter((node) => node.name.toLowerCase().includes(query.toLowerCase()));
    },
  },
  render: (args) => (
    <StandalonePanelWrapper>
      <AddNodePanel {...args} />
    </StandalonePanelWrapper>
  ),
};

export const NodePanelRegistryItems: Story = {
  name: 'Add node panel using registry',
  args: {
    onNodeSelect: (node) => {
      console.log('Selected node from registry:', node);
      alert(`Selected: ${node.data.type} (${node.data.category})`);
    },
    onClose: () => console.log('Closed selector'),
    onSearch: undefined,
  },
  render: (args) => (
    <StandalonePanelWrapper>
      <AddNodePanel {...args} />
    </StandalonePanelWrapper>
  ),
};

export const NodePanelScrollPreservation: Story = {
  name: 'Scroll position preservation per navigation branch',
  parameters: {
    docs: {
      description: {
        story: [
          'Each category contains a drillable subcategory placed partway through',
          'the list, so exercising scroll-restore requires the user to scroll',
          'first. Plain items without a chevron are leaves — clicking them just',
          'selects and does not navigate.',
          '',
          'To verify the three behaviors:',
          '',
          '1. Restore on back: open Category A, scroll down until the',
          '   "Subcategory" row is visible, click it, then click Back. The list',
          '   should return to the exact scroll position you left (not snap back',
          '   to the top or to the subcategory row).',
          '2. First entry resets to top: directly after clicking a subcategory,',
          '   the inner list is at the top regardless of where the parent was',
          '   scrolled.',
          '3. Independent per branch: scroll Category A, go back to root, enter',
          '   Category B and scroll it, then back to root and re-enter A — each',
          '   branch owns its own scroll memory for as long as it is on the nav',
          '   stack.',
        ].join('\n'),
      },
    },
  },
  args: {
    items: SCROLLABLE_CATEGORY_ITEMS,
    onNodeSelect: (node) => console.log('Selected node:', node),
    onClose: () => console.log('Closed selector'),
  },
  render: (args) => (
    <StandalonePanelWrapper>
      <AddNodePanel {...args} />
    </StandalonePanelWrapper>
  ),
};
