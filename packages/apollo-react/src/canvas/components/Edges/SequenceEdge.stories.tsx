/**
 * SequenceEdge Stories
 *
 * Demonstrates the SequenceEdge component which renders smooth step edges
 * with directional arrows for workflow connections.
 */

import type { Meta, StoryObj } from '@storybook/react';
import type { Edge, EdgeTypes, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { Panel, Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { useMemo } from 'react';
import { useCanvasStory, withCanvasProviders } from '../../storybook-utils';
import { DefaultCanvasTranslations } from '../../types';
import { BaseCanvas } from '../BaseCanvas';
import { CanvasPositionControls } from '../CanvasPositionControls';
import { StickyNoteNode } from '../StickyNoteNode';
import type { StickyNoteColor, StickyNoteData } from '../StickyNoteNode/StickyNoteNode.types';
import { SequenceEdge } from './SequenceEdge';

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
  default: SequenceEdge,
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

interface LoopNodeConfig {
  id: string;
  label: string;
  x: number;
  y: number;
}

function createLoopNode(config: LoopNodeConfig): Node {
  const { id, label, x, y } = config;

  return {
    id,
    type: 'uipath.control-flow.while',
    position: { x, y },
    data: {
      display: { label },
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
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
    </BaseCanvas>
  );
}

// ============================================================================
// Readonly Mode Story (Execution States)
// ============================================================================

function ReadonlyStory() {
  const initialNodes = useMemo(
    () => [
      // Execution States Section
      createStickyNote(
        'sticky-execution',
        'green',
        '**Execution States**\nReadonly mode edge statuses',

        { x: 550, y: 80 },
        { width: 550, height: 825 }
      ),
      // Execution state nodes - arranged in a vertical flow
      createNode({
        id: 'exec-start',
        label: 'Start',
        x: 580,
        y: 160,
        sourcePositions: [Position.Right],
      }),
      createNode({
        id: 'exec-InProgress',
        label: 'In Progress',
        x: 770,
        y: 160,
        targetPositions: [Position.Left],
        sourcePositions: [Position.Right],
      }),
      createNode({
        id: 'exec-target-1',
        label: 'Target',
        x: 970,
        y: 160,
        targetPositions: [Position.Left],
      }),

      createNode({
        id: 'exec-source-2',
        label: 'Source',
        x: 580,
        y: 310,
        sourcePositions: [Position.Right],
      }),
      createNode({
        id: 'exec-Completed',
        label: 'Completed',
        x: 770,
        y: 310,
        targetPositions: [Position.Left],
        sourcePositions: [Position.Right],
      }),
      createNode({
        id: 'exec-target-2',
        label: 'Target',
        x: 970,
        y: 310,
        targetPositions: [Position.Left],
      }),

      createNode({
        id: 'exec-source-3',
        label: 'Source',
        x: 580,
        y: 460,
        sourcePositions: [Position.Right],
      }),
      createNode({
        id: 'exec-Failed',
        label: 'Failed',
        x: 770,
        y: 460,
        targetPositions: [Position.Left],
        sourcePositions: [Position.Right],
      }),
      createNode({
        id: 'exec-target-3',
        label: 'Target',
        x: 970,
        y: 460,
        targetPositions: [Position.Left],
      }),

      createNode({
        id: 'exec-source-4',
        label: 'Source',
        x: 580,
        y: 610,
        sourcePositions: [Position.Right],
      }),
      createNode({
        id: 'exec-Paused',
        label: 'Paused',
        x: 770,
        y: 610,
        targetPositions: [Position.Left],
        sourcePositions: [Position.Right],
      }),
      createNode({
        id: 'exec-target-4',
        label: 'Target',
        x: 970,
        y: 610,
        targetPositions: [Position.Left],
      }),

      createNode({
        id: 'exec-source-5',
        label: 'Source',
        x: 580,
        y: 760,
        sourcePositions: [Position.Right],
      }),
      createNode({
        id: 'exec-Cancelled',
        label: 'Cancelled',
        x: 770,
        y: 760,
        targetPositions: [Position.Left],
        sourcePositions: [Position.Right],
      }),
      createNode({
        id: 'exec-target-5',
        label: 'Target',
        x: 970,
        y: 760,
        targetPositions: [Position.Left],
      }),

      // Info panel
      createStickyNote(
        'sticky-info',
        'pink',
        '## Execution States\n\nThese states show in **readonly mode** when edges represent execution flow.\n\n**States:**\n- **InProgress**: Animated dot moving along edge\n- **Completed**: Green edge\n- **Failed**: Red edge\n- **Paused**: Orange edge\n- **Cancelled**: Red edge\n\nEdge colors are determined by target node execution status.',
        { x: 100, y: 80 },
        { width: 400, height: 320 }
      ),
    ],
    []
  );

  const initialEdges: Edge[] = useMemo(
    () => [
      // Execution state edges
      {
        id: 'e-InProgress-1',
        source: 'exec-start',
        target: 'exec-InProgress',
        sourceHandle: `out-${Position.Right}`,
        targetHandle: `in-${Position.Left}`,
        type: 'sequence',
      },
      {
        id: 'e-InProgress-2',
        source: 'exec-InProgress',
        target: 'exec-target-1',
        sourceHandle: `out-${Position.Right}`,
        targetHandle: `in-${Position.Left}`,
        type: 'sequence',
      },
      {
        id: 'e-Completed-1',
        source: 'exec-source-2',
        target: 'exec-Completed',
        sourceHandle: `out-${Position.Right}`,
        targetHandle: `in-${Position.Left}`,
        type: 'sequence',
      },
      {
        id: 'e-Completed-2',
        source: 'exec-Completed',
        target: 'exec-target-2',
        sourceHandle: `out-${Position.Right}`,
        targetHandle: `in-${Position.Left}`,
        type: 'sequence',
      },
      {
        id: 'e-Failed-1',
        source: 'exec-source-3',
        target: 'exec-Failed',
        sourceHandle: `out-${Position.Right}`,
        targetHandle: `in-${Position.Left}`,
        type: 'sequence',
      },
      {
        id: 'e-Failed-2',
        source: 'exec-Failed',
        target: 'exec-target-3',
        sourceHandle: `out-${Position.Right}`,
        targetHandle: `in-${Position.Left}`,
        type: 'sequence',
      },
      {
        id: 'e-Paused-1',
        source: 'exec-source-4',
        target: 'exec-Paused',
        sourceHandle: `out-${Position.Right}`,
        targetHandle: `in-${Position.Left}`,
        type: 'sequence',
      },
      {
        id: 'e-Paused-2',
        source: 'exec-Paused',
        target: 'exec-target-4',
        sourceHandle: `out-${Position.Right}`,
        targetHandle: `in-${Position.Left}`,
        type: 'sequence',
      },
      {
        id: 'e-Cancelled-1',
        source: 'exec-source-5',
        target: 'exec-Cancelled',
        sourceHandle: `out-${Position.Right}`,
        targetHandle: `in-${Position.Left}`,
        type: 'sequence',
      },
      {
        id: 'e-Cancelled-2',
        source: 'exec-Cancelled',
        target: 'exec-target-5',
        sourceHandle: `out-${Position.Right}`,
        targetHandle: `in-${Position.Left}`,
        type: 'sequence',
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
    <BaseCanvas {...canvasProps} edgeTypes={edgeTypes} mode="readonly">
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
    </BaseCanvas>
  );
}

// ============================================================================
// Design Mode Story (Validation States)
// ============================================================================

function DesignModeStory() {
  const initialNodes = useMemo(
    () => [
      // Validation States Section
      createStickyNote(
        'sticky-validation',
        'blue',
        '**Validation States**\nDesign mode edge validation',
        { x: 550, y: 80 },
        { width: 420, height: 675 }
      ),
      // Validation state nodes
      createNode({
        id: 'val-source-1-INFO',
        label: 'Source',
        x: 590,
        y: 160,
        sourcePositions: [Position.Right],
      }),
      createNode({
        id: 'val-target-1-INFO',
        label: 'Info',
        x: 810,
        y: 160,
        targetPositions: [Position.Left],
      }),

      createNode({
        id: 'val-source-2-WARNING',
        label: 'Source',
        x: 590,
        y: 310,
        sourcePositions: [Position.Right],
      }),
      createNode({
        id: 'val-target-2-WARNING',
        label: 'Warning',
        x: 810,
        y: 310,
        targetPositions: [Position.Left],
      }),

      createNode({
        id: 'val-source-3-ERROR',
        label: 'Source',
        x: 590,
        y: 460,
        sourcePositions: [Position.Right],
      }),
      createNode({
        id: 'val-target-3-ERROR',
        label: 'Error',
        x: 810,
        y: 460,
        targetPositions: [Position.Left],
      }),

      createNode({
        id: 'val-source-4-CRITICAL',
        label: 'Source',
        x: 590,
        y: 610,
        sourcePositions: [Position.Right],
      }),
      createNode({
        id: 'val-target-4-CRITICAL',
        label: 'Critical',
        x: 810,
        y: 610,
        targetPositions: [Position.Left],
      }),

      // Info panel
      createStickyNote(
        'sticky-info',
        'pink',
        '## Validation States\n\nThese states show in **design mode** when edges have validation errors.\n\n**Severities:**\n- **INFO**: Blue edge\n- **WARNING**: Orange edge\n- **ERROR**: Red edge\n- **CRITICAL**: Red edge\n\nEdge colors indicate validation issues.',
        { x: 100, y: 80 },
        { width: 400, height: 300 }
      ),
    ],
    []
  );

  const initialEdges: Edge[] = useMemo(
    () => [
      // Validation state edges
      {
        id: 'e-validation-INFO',
        source: 'val-source-1-INFO',
        target: 'val-target-1-INFO',
        sourceHandle: `out-${Position.Right}`,
        targetHandle: `in-${Position.Left}`,
        type: 'sequence',
      },
      {
        id: 'e-validation-WARNING',
        source: 'val-source-2-WARNING',
        target: 'val-target-2-WARNING',
        sourceHandle: `out-${Position.Right}`,
        targetHandle: `in-${Position.Left}`,
        type: 'sequence',
      },
      {
        id: 'e-validation-ERROR',
        source: 'val-source-3-ERROR',
        target: 'val-target-3-ERROR',
        sourceHandle: `out-${Position.Right}`,
        targetHandle: `in-${Position.Left}`,
        type: 'sequence',
      },
      {
        id: 'e-validation-CRITICAL',
        source: 'val-source-4-CRITICAL',
        target: 'val-target-4-CRITICAL',
        sourceHandle: `out-${Position.Right}`,
        targetHandle: `in-${Position.Left}`,
        type: 'sequence',
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
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
    </BaseCanvas>
  );
}

// ============================================================================
// Loop Edges Story
// ============================================================================

function LoopEdgesStory() {
  const initialNodes = useMemo(
    () => [
      // Complex Loop Chain Section
      createStickyNote(
        'sticky-chain',
        'pink',
        '**Loop Chain**\nMultiple loop nodes in sequence with both output and success handles',
        { x: 16 * 10, y: 16 * 25 },
        { width: 16 * 40, height: 16 * 20 }
      ),
      createNode({
        id: 'chain-start',
        label: 'Start',
        x: 16 * 11,
        y: 16 * 30,
        sourcePositions: [Position.Right],
      }),
      createLoopNode({
        id: 'chain-loop-1',
        label: 'Loop 1',
        x: 16 * 21,
        y: 16 * 30,
      }),
      createLoopNode({
        id: 'chain-loop-2',
        label: 'Loop 2',
        x: 16 * 34,
        y: 16 * 32,
      }),

      // Info panel
      createStickyNote(
        'sticky-info',
        'white',
        "## Loop Edges\n\nSequenceEdge automatically detects and renders loop edges with custom paths.\n\n**Detection:**\n- **Self-loops**: source === target\n- **LoopBack edges**: targetHandle === 'loopBack'\n\n**Visual Features:**\n- Path goes below the node with rounded corners\n- Grid-snapped to 16px for consistency\n- Success handle loops have larger height (96px vs 64px)\n- Edge toolbar works on loop paths",
        { x: 16 * 10, y: 16 * 3 },
        { width: 16 * 32, height: 16 * 21 }
      ),
    ],
    []
  );

  const initialEdges: Edge[] = useMemo(
    () => [
      // Chain edges
      {
        id: 'e-chain-start',
        source: 'chain-start',
        target: 'chain-loop-1',
        sourceHandle: `out-${Position.Right}`,
        targetHandle: 'input',
        type: 'sequence',
      },
      {
        id: 'e-chain-loop1-success',
        source: 'chain-loop-1',
        target: 'chain-loop-2',
        sourceHandle: 'body',
        targetHandle: 'input',
        type: 'sequence',
      },
      {
        id: 'e-chain-loop2-loopBack',
        source: 'chain-loop-2',
        target: 'chain-loop-2',
        sourceHandle: 'body',
        targetHandle: 'loopBack',
        type: 'sequence',
      },
      {
        id: 'e-chain-loop2-success',
        source: 'chain-loop-2',
        target: 'chain-loop-1',
        sourceHandle: 'success',
        targetHandle: 'loopBack',
        type: 'sequence',
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
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
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

export const ExecutionStates: Story = {
  render: () => <ReadonlyStory />,
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates execution states visible in readonly mode. Edges show different colors based on target node execution status, with InProgress showing an animated dot.',
      },
    },
  },
};

export const ValidationStates: Story = {
  render: () => <DesignModeStory />,
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates validation states visible in design mode. Edges show different colors based on validation severity.',
      },
    },
  },
};

export const LoopEdges: Story = {
  render: () => <LoopEdgesStory />,
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates loop edges with custom paths. SequenceEdge automatically detects self-loops and loopBack edges, rendering them with paths that go below the node. Success handle loops have larger dimensions than output handle loops.',
      },
    },
  },
};
