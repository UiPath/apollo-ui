import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo } from 'react';
import type { Node, Edge } from '@uipath/apollo-react/canvas/xyflow/react';
import { Panel } from '@uipath/apollo-react/canvas/xyflow/react';
import { BaseCanvas } from '../BaseCanvas';
import { CanvasPositionControls } from '../CanvasPositionControls';
import { GroupNode } from './GroupNode';
import { BaseNode } from '../BaseNode';
import type { GroupNodeData } from './GroupNode.types';
import type { BaseNodeData } from '../BaseNode/BaseNode.types';
import { withCanvasProviders, useCanvasStory, StoryInfoPanel } from '../../storybook-utils';
import { DefaultCanvasTranslations } from '../../types';

// ============================================================================
// Meta Configuration
// ============================================================================

const meta: Meta = {
  title: 'Canvas/GroupNode',
  parameters: { layout: 'fullscreen' },
  decorators: [withCanvasProviders()],
};

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Custom Node Types
// ============================================================================

const nodeTypes = {
  group: GroupNode,
  base: BaseNode,
};

// ============================================================================
// Initial Data
// ============================================================================

function createGroupNode(
  id: string,
  title: string,
  iconName: string,
  position: { x: number; y: number },
  size: { width: number; height: number },
  backgroundColor?: string
): Node<GroupNodeData> {
  return {
    id,
    type: 'group',
    position,
    data: { title, iconName, backgroundColor, parameters: {} },
    style: {
      width: size.width,
      height: size.height,
      backgroundColor: 'transparent',
      border: 'none',
      padding: 0,
    },
  };
}

function createChildNode(
  id: string,
  label: string,
  position: { x: number; y: number },
  parentId: string
): Node<BaseNodeData> {
  return {
    id,
    type: 'base',
    position,
    data: { parameters: {}, display: { label, shape: 'square' } },
    parentId,
    extent: 'parent',
  };
}

function createDefaultNodes(): Node<GroupNodeData | BaseNodeData>[] {
  return [
    // First group - API flow
    createGroupNode('group-1', 'API flow', 'api', { x: 50, y: 100 }, { width: 600, height: 250 }),
    createChildNode('node-1-1', 'Request', { x: 30, y: 60 }, 'group-1'),
    createChildNode('node-1-2', 'Process', { x: 200, y: 60 }, 'group-1'),
    createChildNode('node-1-3', 'Response', { x: 370, y: 60 }, 'group-1'),

    // Second group - Classification agent
    createGroupNode(
      'group-2',
      'Classification agent',
      'magic_button',
      { x: 750, y: 100 },
      { width: 500, height: 350 },
      'var(--uix-canvas-background-raised)'
    ),
    createChildNode('node-2-1', 'Classification agent', { x: 180, y: 60 }, 'group-2'),
    createChildNode('node-2-2', 'Category A', { x: 30, y: 200 }, 'group-2'),
    createChildNode('node-2-3', 'Category B', { x: 180, y: 200 }, 'group-2'),
    createChildNode('node-2-4', 'Category C', { x: 330, y: 200 }, 'group-2'),
  ];
}

function createDefaultEdges(): Edge[] {
  return [
    // Edges within first group
    { id: 'e1-1-2', source: 'node-1-1', target: 'node-1-2', type: 'smoothstep' },
    { id: 'e1-2-3', source: 'node-1-2', target: 'node-1-3', type: 'smoothstep' },
    // Edges within second group
    { id: 'e2-1-2', source: 'node-2-1', target: 'node-2-2', type: 'smoothstep' },
    { id: 'e2-1-3', source: 'node-2-1', target: 'node-2-3', type: 'smoothstep' },
    { id: 'e2-1-4', source: 'node-2-1', target: 'node-2-4', type: 'smoothstep' },
  ];
}

// ============================================================================
// Story Components
// ============================================================================

function DefaultStory() {
  const initialNodes = useMemo(() => createDefaultNodes(), []);
  const initialEdges = useMemo(() => createDefaultEdges(), []);

  const { canvasProps } = useCanvasStory({ initialNodes, initialEdges });

  return (
    <BaseCanvas {...canvasProps} nodeTypes={nodeTypes} mode="design">
      <StoryInfoPanel
        title="Group Nodes"
        description="Drag groups to move all child nodes together"
      />
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} showOrganize={false} />
      </Panel>
    </BaseCanvas>
  );
}

export const Default: Story = {
  render: () => <DefaultStory />,
};

function EmptyGroupStory() {
  const initialNodes = useMemo(
    () => [
      createGroupNode(
        'empty-group',
        'Empty Group',
        'folder',
        { x: 200, y: 150 },
        { width: 400, height: 300 }
      ),
    ],
    []
  );

  const { canvasProps } = useCanvasStory({ initialNodes });

  return (
    <BaseCanvas {...canvasProps} nodeTypes={nodeTypes} mode="design">
      <StoryInfoPanel title="Empty Group" description="A group node with no children" />
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} showOrganize={false} />
      </Panel>
    </BaseCanvas>
  );
}

// ============================================================================
// Exported Stories
// ============================================================================

export const EmptyGroup: Story = {
  render: () => <EmptyGroupStory />,
};
