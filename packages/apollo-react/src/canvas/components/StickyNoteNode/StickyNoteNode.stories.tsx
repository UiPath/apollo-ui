import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo } from 'react';
import type { Node, Edge } from '@uipath/apollo-react/canvas/xyflow/react';
import { Panel, Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { BaseCanvas } from '../BaseCanvas';
import { CanvasPositionControls } from '../CanvasPositionControls';
import { StickyNoteNode } from './StickyNoteNode';
import type { StickyNoteColor, StickyNoteData } from './StickyNoteNode.types';
import { withCanvasProviders, useCanvasStory } from '../../storybook-utils';
import { DefaultCanvasTranslations } from '../../types';

// ============================================================================
// Meta Configuration
// ============================================================================

const meta: Meta = {
  title: 'Canvas/StickyNoteNode',
  parameters: { layout: 'fullscreen' },
  decorators: [withCanvasProviders()],
};

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Helper Functions
// ============================================================================

const nodeTypes = {
  stickyNote: StickyNoteNode,
};

function createStickyNote(
  id: string,
  color: StickyNoteColor,
  content: string,
  position: { x: number; y: number },
  size: { width: number; height: number } = { width: 250, height: 150 },
  zIndex?: number
): Node<StickyNoteData> {
  return {
    id,
    type: 'stickyNote',
    position,
    data: { color, content },
    width: size.width,
    height: size.height,
    ...(zIndex !== undefined && { zIndex }),
  };
}

// ============================================================================
// Story Components
// ============================================================================

function DefaultStory() {
  const initialNodes = useMemo<Node<StickyNoteData>[]>(
    () => [
      createStickyNote(
        'sticky-yellow-note',
        'yellow',
        '**Markdown Support!**\n\nDouble-click to edit with *markdown*\n- Drag to move\n- Resize from corners',
        { x: 50, y: 50 }
      ),
      createStickyNote(
        'sticky-pink-note',
        'pink',
        '## Important\n\n~~Strikethrough~~ and `inline code` work too!',
        { x: 350, y: 50 }
      ),
      createStickyNote(
        'sticky-blue-note',
        'blue',
        '**Lists:**\n\n1. First item\n2. Second item\n3. Third item',
        { x: 350, y: 250 }
      ),
      createStickyNote('sticky-green-note', 'green', 'Green note for positive feedback', {
        x: 50,
        y: 250,
      }),
      createStickyNote('sticky-white-note', 'white', 'White note for general notes', {
        x: 50,
        y: 450,
      }),
      createStickyNote(
        'sticky-long-note',
        'yellow',
        'This is a longer sticky note with lots of content to demonstrate scrolling.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\n\nUt enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\n\nDouble-click to edit, then use mouse wheel to scroll through the content.',
        { x: 350, y: 450 },
        { width: 280, height: 200 }
      ),
    ],
    []
  );

  const { canvasProps } = useCanvasStory({ initialNodes, additionalNodeTypes: nodeTypes });

  return (
    <BaseCanvas {...canvasProps} mode="design">
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} showOrganize={false} />
      </Panel>
    </BaseCanvas>
  );
}

function createBaseNode(
  id: string,
  iconName: string,
  label: string,
  subLabel: string,
  position: { x: number; y: number },
  handleConfigurations: Array<{
    position: Position;
    handles: Array<{
      id: string;
      type: 'source' | 'target';
      handleType: 'input' | 'output';
      label: string;
    }>;
  }>
): Node {
  return {
    id,
    type: 'uipath.blank-node',
    position,
    data: {
      display: {
        icon: iconName,
        label,
        subLabel,
      },
      parameters: {},
      handleConfigurations,
    },
    zIndex: 0,
  };
}

function createPipelineNodes(): Node[] {
  return [
    // Data Ingestion Section
    createStickyNote(
      'sticky-ingestion',
      'blue',
      '## Data Ingestion\nCollect and validate incoming data',
      { x: 48, y: 48 },
      { width: 608, height: 512 },
      -10
    ),
    createBaseNode(
      'node-source',
      'cloud-upload',
      'Data Source',
      'Input Stream',
      { x: 128, y: 224 },
      [
        {
          position: Position.Right,
          handles: [{ id: 'output', type: 'source', handleType: 'output', label: 'Output' }],
        },
      ]
    ),
    createBaseNode('node-filter', 'filter', 'Filter', 'Validation Rules', { x: 416, y: 224 }, [
      {
        position: Position.Left,
        handles: [{ id: 'input', type: 'target', handleType: 'input', label: 'Input' }],
      },
      {
        position: Position.Right,
        handles: [
          { id: 'transform', type: 'source', handleType: 'output', label: 'Transform' },
          { id: 'enrich', type: 'source', handleType: 'output', label: 'Enrich' },
        ],
      },
    ]),

    // Data Processing Section
    createStickyNote(
      'sticky-processing',
      'yellow',
      '## Data Processing\nTransform and combine data streams',
      { x: 720, y: 48 },
      { width: 800, height: 512 },
      -10
    ),
    createBaseNode(
      'node-transform',
      'settings',
      'Transform',
      'Data Processing',
      { x: 800, y: 144 },
      [
        {
          position: Position.Left,
          handles: [{ id: 'input', type: 'target', handleType: 'input', label: 'Input' }],
        },
        {
          position: Position.Right,
          handles: [{ id: 'output', type: 'source', handleType: 'output', label: 'Output' }],
        },
      ]
    ),
    createBaseNode('node-enrich', 'plus-circle', 'Enrich', 'Add Metadata', { x: 800, y: 304 }, [
      {
        position: Position.Left,
        handles: [{ id: 'input', type: 'target', handleType: 'input', label: 'Input' }],
      },
      {
        position: Position.Right,
        handles: [{ id: 'output', type: 'source', handleType: 'output', label: 'Output' }],
      },
    ]),
    createBaseNode('node-merge', 'git-merge', 'Merge', 'Combine Streams', { x: 1216, y: 224 }, [
      {
        position: Position.Left,
        handles: [
          { id: 'input1', type: 'target', handleType: 'input', label: 'Stream 1' },
          { id: 'input2', type: 'target', handleType: 'input', label: 'Stream 2' },
        ],
      },
      {
        position: Position.Right,
        handles: [{ id: 'output', type: 'source', handleType: 'output', label: 'Merged' }],
      },
    ]),

    // Data Storage Section
    createStickyNote(
      'sticky-storage',
      'green',
      '## Storage & Analytics\nPersist and analyze processed data',
      { x: 1584, y: 48 },
      { width: 800, height: 512 },
      -10
    ),
    createBaseNode('node-storage', 'database', 'Storage', 'Database', { x: 1664, y: 144 }, [
      {
        position: Position.Left,
        handles: [{ id: 'input', type: 'target', handleType: 'input', label: 'Input' }],
      },
      {
        position: Position.Right,
        handles: [{ id: 'output', type: 'source', handleType: 'output', label: 'Logs' }],
      },
    ]),
    createBaseNode('node-index', 'search', 'Index', 'Search Engine', { x: 1664, y: 304 }, [
      {
        position: Position.Left,
        handles: [{ id: 'input', type: 'target', handleType: 'input', label: 'Input' }],
      },
      {
        position: Position.Right,
        handles: [{ id: 'output', type: 'source', handleType: 'output', label: 'Events' }],
      },
    ]),
    createBaseNode('node-monitor', 'bar-chart', 'Monitor', 'Analytics', { x: 2080, y: 224 }, [
      {
        position: Position.Left,
        handles: [
          { id: 'logs', type: 'target', handleType: 'input', label: 'Logs' },
          { id: 'events', type: 'target', handleType: 'input', label: 'Events' },
        ],
      },
    ]),

    // Annotation
    createStickyNote(
      'sticky-annotation',
      'pink',
      '**Data Pipeline Pattern**\n\nThis workflow demonstrates using sticky notes as visual containers to organize and document sections of a data processing pipeline. Each colored section groups related operations while nodes and edges remain fully interactive on top.',
      { x: 48, y: 608 },
      { width: 1024, height: 176 },
      -10
    ),
  ];
}

function createPipelineEdges(): Edge[] {
  return [
    // Data Ingestion flow
    {
      id: 'e-source-filter',
      source: 'node-source',
      sourceHandle: 'output',
      target: 'node-filter',
      targetHandle: 'input',
      type: 'smoothstep',
    },
    // Processing flows - parallel streams
    {
      id: 'e-filter-transform',
      source: 'node-filter',
      sourceHandle: 'transform',
      target: 'node-transform',
      targetHandle: 'input',
      type: 'smoothstep',
    },
    {
      id: 'e-filter-enrich',
      source: 'node-filter',
      sourceHandle: 'enrich',
      target: 'node-enrich',
      targetHandle: 'input',
      type: 'smoothstep',
    },
    // Merge flows
    {
      id: 'e-transform-merge',
      source: 'node-transform',
      sourceHandle: 'output',
      target: 'node-merge',
      targetHandle: 'input1',
      type: 'smoothstep',
    },
    {
      id: 'e-enrich-merge',
      source: 'node-enrich',
      sourceHandle: 'output',
      target: 'node-merge',
      targetHandle: 'input2',
      type: 'smoothstep',
    },
    // Storage flows
    {
      id: 'e-merge-storage',
      source: 'node-merge',
      sourceHandle: 'output',
      target: 'node-storage',
      targetHandle: 'input',
      type: 'smoothstep',
    },
    {
      id: 'e-merge-index',
      source: 'node-merge',
      sourceHandle: 'output',
      target: 'node-index',
      targetHandle: 'input',
      type: 'smoothstep',
    },
    // Analytics flows
    {
      id: 'e-storage-monitor',
      source: 'node-storage',
      sourceHandle: 'output',
      target: 'node-monitor',
      targetHandle: 'logs',
      type: 'smoothstep',
    },
    {
      id: 'e-index-monitor',
      source: 'node-index',
      sourceHandle: 'output',
      target: 'node-monitor',
      targetHandle: 'events',
      type: 'smoothstep',
    },
  ];
}

function WithBaseNodesStory() {
  const initialNodes = useMemo(() => createPipelineNodes(), []);
  const initialEdges = useMemo(() => createPipelineEdges(), []);

  const { canvasProps } = useCanvasStory({
    initialNodes,
    initialEdges,
    additionalNodeTypes: nodeTypes,
  });

  return (
    <BaseCanvas {...canvasProps} mode="design" elevateNodesOnSelect>
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} showOrganize={false} />
      </Panel>
    </BaseCanvas>
  );
}

// ============================================================================
// Exported Stories
// ============================================================================

export const Default: Story = {
  render: () => <DefaultStory />,
};

export const WithBaseNodes: Story = {
  render: () => <WithBaseNodesStory />,
};
