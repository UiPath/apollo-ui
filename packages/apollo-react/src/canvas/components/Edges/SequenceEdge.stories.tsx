/**
 * SequenceEdge Stories
 *
 * Demonstrates the SequenceEdge component which renders smooth step edges
 * with directional arrows for workflow connections.
 */
import { useMemo } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import type { Node, Edge, EdgeTypes } from '@uipath/apollo-react/canvas/xyflow/react';
import { Panel, Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { BaseCanvas } from '../BaseCanvas';
import { CanvasPositionControls } from '../CanvasPositionControls';
import { StickyNoteNode } from '../StickyNoteNode';
import type { StickyNoteColor, StickyNoteData } from '../StickyNoteNode/StickyNoteNode.types';
import { withCanvasProviders, useCanvasStory } from '../../storybook-utils';
import { SequenceEdge } from './SequenceEdge';
import { DefaultCanvasTranslations } from '../../types';

// ============================================================================
// Meta Configuration
// ============================================================================

const meta: Meta = {
  title: 'Canvas/Edges/SequenceEdge',
  parameters: { layout: 'fullscreen' },
  decorators: [withCanvasProviders()],
};

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Shared Configuration
// ============================================================================

const edgeTypes: EdgeTypes = {
  sequence: SequenceEdge,
};

const nodeTypes = {
  stickyNote: StickyNoteNode,
};

// ============================================================================
// Helper Functions
// ============================================================================

interface NodeConfig {
  id: string;
  label: string;
  x: number;
  y: number;
  sourcePositions?: Position[];
  targetPositions?: Position[];
}

function createNode(config: NodeConfig): Node {
  const { id, label, x, y, sourcePositions = [], targetPositions = [] } = config;

  const handleConfigurations = [
    ...sourcePositions.map((position) => ({
      position,
      handles: [{ id: `out-${position}`, type: 'source' as const, handleType: 'output' as const }],
    })),
    ...targetPositions.map((position) => ({
      position,
      handles: [{ id: `in-${position}`, type: 'target' as const, handleType: 'input' as const }],
    })),
  ];

  return {
    id,
    type: 'uipath.blank-node',
    position: { x, y },
    data: {
      display: { label },
      handleConfigurations,
      parameters: {},
    },
    zIndex: 0,
  };
}

function createStickyNote(
  id: string,
  color: StickyNoteColor,
  content: string,
  position: { x: number; y: number },
  size: { width: number; height: number }
): Node<StickyNoteData> {
  return {
    id,
    type: 'stickyNote',
    position,
    data: { color, content },
    width: size.width,
    height: size.height,
    zIndex: -10,
  };
}

// ============================================================================
// Story Component
// ============================================================================

function DefaultStory() {
  const initialNodes = useMemo(
    () => [
      // All Directions Section - Star pattern: outer nodes → center
      createStickyNote(
        'sticky-directions',
        'yellow',
        '**All Directions**\nArrows point into center node',
        { x: 100, y: 80 },
        { width: 550, height: 590 }
      ),
      // Center node - receives all edges (target handles on all sides)
      createNode({
        id: 'center',
        label: 'Center',
        x: 300,
        y: 300,
        targetPositions: [Position.Top, Position.Bottom, Position.Left, Position.Right],
      }),
      // Outer nodes - each sends an edge to center (source handle only)
      createNode({ id: 'top', label: 'Top', x: 300, y: 130, sourcePositions: [Position.Bottom] }),
      createNode({
        id: 'bottom',
        label: 'Bottom',
        x: 300,
        y: 470,
        sourcePositions: [Position.Top],
      }),
      createNode({ id: 'left', label: 'Left', x: 130, y: 300, sourcePositions: [Position.Right] }),
      createNode({ id: 'right', label: 'Right', x: 470, y: 300, sourcePositions: [Position.Left] }),

      // Preview Section
      createStickyNote(
        'sticky-preview',
        'blue',
        '**Preview**\nDashed primary color',
        { x: 760, y: 80 },
        { width: 420, height: 200 }
      ),
      createNode({
        id: 'preview-source',
        label: 'Preview',
        x: 800,
        y: 150,
        sourcePositions: [Position.Right],
      }),
      createNode({
        id: 'preview-target',
        label: 'Target',
        x: 1020,
        y: 150,
        targetPositions: [Position.Left],
      }),

      // Diff States Section
      createStickyNote(
        'sticky-diff',
        'white',
        '**Diff States**\nFor version comparison',
        { x: 760, y: 330 },
        { width: 420, height: 340 }
      ),
      createNode({
        id: 'added-source',
        label: 'Added',
        x: 800,
        y: 410,
        sourcePositions: [Position.Right],
      }),
      createNode({
        id: 'added-target',
        label: 'Target',
        x: 1020,
        y: 410,
        targetPositions: [Position.Left],
      }),
      createNode({
        id: 'removed-source',
        label: 'Removed',
        x: 800,
        y: 530,
        sourcePositions: [Position.Right],
      }),
      createNode({
        id: 'removed-target',
        label: 'Target',
        x: 1020,
        y: 530,
        targetPositions: [Position.Left],
      }),

      // Info panel
      createStickyNote(
        'sticky-info',
        'pink',
        '## SequenceEdge\n\nSmooth step edge with directional arrows.\n\n**States:**\n- Default (gray)\n- Hover (primary hover)\n- Selected (primary + outline)\n- Preview (dashed primary)\n- Diff Added (green)\n- Diff Removed (red dashed)',
        { x: 100, y: 720 },
        { width: 350, height: 280 }
      ),
    ],
    []
  );

  const initialEdges: Edge[] = useMemo(
    () => [
      // Star pattern: all outer nodes → center
      {
        id: 'e-top-to-center',
        source: 'top',
        target: 'center',
        sourceHandle: `out-${Position.Bottom}`,
        targetHandle: `in-${Position.Top}`,
        type: 'sequence',
      },
      {
        id: 'e-bottom-to-center',
        source: 'bottom',
        target: 'center',
        sourceHandle: `out-${Position.Top}`,
        targetHandle: `in-${Position.Bottom}`,
        type: 'sequence',
      },
      {
        id: 'e-left-to-center',
        source: 'left',
        target: 'center',
        sourceHandle: `out-${Position.Right}`,
        targetHandle: `in-${Position.Left}`,
        type: 'sequence',
      },
      {
        id: 'e-right-to-center',
        source: 'right',
        target: 'center',
        sourceHandle: `out-${Position.Left}`,
        targetHandle: `in-${Position.Right}`,
        type: 'sequence',
      },
      // Preview edge
      {
        id: 'preview-edge-id',
        source: 'preview-source',
        target: 'preview-target',
        sourceHandle: `out-${Position.Right}`,
        targetHandle: `in-${Position.Left}`,
        type: 'sequence',
      },
      // Diff edges
      {
        id: 'e-added',
        source: 'added-source',
        target: 'added-target',
        sourceHandle: `out-${Position.Right}`,
        targetHandle: `in-${Position.Left}`,
        type: 'sequence',
        data: { isDiffAdded: true },
        style: { stroke: 'var(--palette-positive-base)' },
      },
      {
        id: 'e-removed',
        source: 'removed-source',
        target: 'removed-target',
        sourceHandle: `out-${Position.Right}`,
        targetHandle: `in-${Position.Left}`,
        type: 'sequence',
        data: { isDiffRemoved: true },
        style: { stroke: 'var(--palette-negative-base)', strokeDasharray: '5,5' },
      },
    ],
    []
  );

  const { canvasProps } = useCanvasStory({
    initialNodes,
    initialEdges,
    additionalNodeTypes: nodeTypes,
  });

  return (
    <BaseCanvas {...canvasProps} edgeTypes={edgeTypes} mode="design">
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
