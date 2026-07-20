import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  type Edge,
  type Node,
  type NodeProps,
  Panel,
  Position,
  useReactFlow,
} from '@uipath/apollo-react/canvas/xyflow/react';
import { cn } from '@uipath/apollo-wind';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAddNodeOnConnectEnd, useCanvasEvent } from '../../hooks';
import {
  createNode,
  StoryInfoPanel,
  useCanvasStory,
  withCanvasProviders,
} from '../../storybook-utils';
import { DefaultCanvasTranslations } from '../../types';
import { ElementStatusValues } from '../../types/execution';
import type { CanvasHandleActionEvent } from '../../utils';
import { removePreviewFromReactFlow } from '../../utils/createPreviewNode';
import { CanvasIcon } from '../../utils/icon-registry';
import { snapToGrid } from '../../utils/NodeUtils';
import { AddNodeManager } from '../AddNodePanel';
import { createAddNodePreview } from '../AddNodePanel/createAddNodePreview';
import { BaseCanvas } from '../BaseCanvas';
import type { BaseNodeData } from '../BaseNode/BaseNode.types';
import { CanvasPositionControls } from '../CanvasPositionControls';
import { StageHeaderChipType } from '../StageNode/StageNode.types';
import { LoopNode } from './LoopNode';
import type { LoopNodeData, LoopNodeExecutionCountState } from './LoopNode.types';
import { LoopNodeExecutionCount } from './LoopNodeExecutionCount';

const meta: Meta = {
  title: 'Components/Nodes/LoopNode',
  parameters: { layout: 'fullscreen' },
  decorators: [withCanvasProviders()],
};

export default meta;
type Story = StoryObj<typeof meta>;

const LOOP_TYPE = 'uipath.control-flow.foreach';
const ACTIVITY_TYPE = 'uipath.blank-node';
const STORY_LOOP_START_HANDLE_ID = 'start';
const STORY_LOOP_CONTINUE_HANDLE_ID = 'continue';
const STORY_LOOP_SUCCESS_HANDLE_ID = 'success';

const snapPoint = (point: { x: number; y: number }) => ({
  x: snapToGrid(point.x),
  y: snapToGrid(point.y),
});

const snapSize = (size: { width: number; height: number }) => ({
  width: snapToGrid(size.width),
  height: snapToGrid(size.height),
});

function createLoopContainerNode(
  id: string,
  position: { x: number; y: number },
  size: { width: number; height: number },
  options?: { parentId?: string; selected?: boolean; data?: LoopNodeData }
): Node<LoopNodeData> {
  const snappedSize = snapSize(size);
  const display = {
    ...options?.data?.display,
    shape: 'container' as const,
  };
  const parentScope = options?.parentId
    ? { parentId: options.parentId, extent: 'parent' as const }
    : {};

  return {
    id,
    type: LOOP_TYPE,
    position: snapPoint(position),
    ...parentScope,
    selected: options?.selected ?? false,
    data: {
      ...options?.data,
      display,
    },
    style: { width: snappedSize.width, height: snappedSize.height },
  };
}

function createActivityNode(
  id: string,
  label: string,
  position: { x: number; y: number },
  options?: { parentId?: string; subLabel?: string | null }
): Node<BaseNodeData> {
  const node = createNode({
    id,
    type: ACTIVITY_TYPE,
    position: snapPoint(position),
    display: options?.subLabel ? { label, subLabel: options.subLabel } : { label },
  });

  if (options?.parentId) {
    return {
      ...node,
      parentId: options.parentId,
      extent: 'parent' as const,
    };
  }

  return node;
}

const makeEdge = (
  id: string,
  source: string,
  sourceHandle: string,
  target: string,
  targetHandle: string
): Edge => ({ id, source, sourceHandle, target, targetHandle });

// Grid geometry for laying out children inside a loop container. Every value is
// grid-aligned (a multiple of GRID_SPACING = 16) and mirrors the container safe
// area from utils/container.ts (header + frame inset + body padding + inner
// handle rail), so children never overlap the header and are never clamped by
// `extent: 'parent'`.
const CHILD_GRID = {
  childSize: 96, // blank-node footprint (DEFAULT_NODE_SIZE)
  labelAllowance: 32, // room for the label rendered beneath the node shape
  cellWidth: 176, // childSize + horizontal gap
  cellHeight: 160, // childSize + label + vertical gap
  safeLeft: 144, // container left padding (frame + body + inner handle rail)
  safeTop: 96, // container top padding (header + frame + body)
  padRight: 144, // mirror safeLeft — the safe area is symmetric horizontally
  padBottom: 48, // container bottom padding (frame + body)
} as const;

// Places `labels.length` children in a grid inside a loop and returns the child
// nodes plus the container size needed to hold them with clean margins.
function layoutLoopChildren(
  parentId: string,
  labels: string[],
  columns: number
): { children: Node[]; width: number; height: number } {
  const rows = Math.ceil(labels.length / columns);
  const usedColumns = Math.min(columns, labels.length);

  const children = labels.map((label, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    return createActivityNode(
      `${parentId}-child-${index}`,
      label,
      {
        x: CHILD_GRID.safeLeft + column * CHILD_GRID.cellWidth,
        y: CHILD_GRID.safeTop + row * CHILD_GRID.cellHeight,
      },
      { parentId }
    );
  });

  const width =
    CHILD_GRID.safeLeft +
    (usedColumns - 1) * CHILD_GRID.cellWidth +
    CHILD_GRID.childSize +
    CHILD_GRID.padRight;
  const height =
    CHILD_GRID.safeTop +
    (rows - 1) * CHILD_GRID.cellHeight +
    CHILD_GRID.childSize +
    CHILD_GRID.labelAllowance +
    CHILD_GRID.padBottom;

  return { children, width, height };
}

// Wires each grid row as an independent left-to-right chain fanning out from the
// loop's `start` handle and back into its `continue` handle. Because activity
// nodes have a fixed left input / right output, per-row chains keep every edge
// short and horizontal instead of snaking diagonally across the grid.
function loopBodyRowEdges(loopId: string, children: Node[], columns: number): Edge[] {
  const edges: Edge[] = [];

  for (let start = 0; start < children.length; start += columns) {
    const rowChildren = children.slice(start, start + columns);
    const first = rowChildren[0];
    if (!first) continue;

    const row = start / columns;
    edges.push(
      makeEdge(`${loopId}-start-r${row}`, loopId, STORY_LOOP_START_HANDLE_ID, first.id, 'input')
    );

    for (let i = 0; i < rowChildren.length - 1; i++) {
      const from = rowChildren[i];
      const to = rowChildren[i + 1];
      if (!from || !to) continue;
      edges.push(makeEdge(`${from.id}-${to.id}`, from.id, 'output', to.id, 'input'));
    }

    const last = rowChildren[rowChildren.length - 1];
    if (last) {
      edges.push(
        makeEdge(
          `${last.id}-continue-r${row}`,
          last.id,
          'output',
          loopId,
          STORY_LOOP_CONTINUE_HANDLE_ID
        )
      );
    }
  }

  return edges;
}

interface AutoPreviewSource {
  nodeId: string;
  handleId: string;
  position?: Position;
}

interface StoryInfo {
  title: string;
  description: string;
}

interface LoopCanvasStoryProps {
  initialNodes: Node[];
  initialEdges: Edge[];
  autoPreviewSource?: AutoPreviewSource;
  storyInfo: StoryInfo;
}

function LoopCanvasStory({
  initialNodes,
  initialEdges,
  autoPreviewSource,
  storyInfo,
}: LoopCanvasStoryProps) {
  const reactFlow = useReactFlow();
  const handleAddNodeOnConnectEnd = useAddNodeOnConnectEnd();
  const autoPreviewedRef = useRef(false);

  const { canvasProps, nodeTypeRegistry } = useCanvasStory({
    initialNodes,
    initialEdges,
  });

  const loopPreviewOptions = useMemo(
    () => ({
      getManifestForNode: (node: Node) =>
        node.type ? nodeTypeRegistry.getManifest(node.type) : undefined,
    }),
    [nodeTypeRegistry]
  );

  useEffect(() => {
    if (!autoPreviewSource || autoPreviewedRef.current) return;

    const frame = window.requestAnimationFrame(() => {
      if (autoPreviewedRef.current) return;

      autoPreviewedRef.current = true;
      createAddNodePreview(
        autoPreviewSource.nodeId,
        autoPreviewSource.handleId,
        reactFlow,
        autoPreviewSource.position ?? Position.Right,
        'source',
        [],
        loopPreviewOptions
      );
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [autoPreviewSource, loopPreviewOptions, reactFlow]);

  const handleHandleAction = useCallback(
    (event: CanvasHandleActionEvent) => {
      const { handleId, nodeId, position, handleType } = event;
      if (!handleId || !nodeId) return;

      createAddNodePreview(
        nodeId,
        handleId,
        reactFlow,
        position as Position,
        handleType === 'input' ? 'target' : 'source',
        [],
        loopPreviewOptions
      );
    },
    [loopPreviewOptions, reactFlow]
  );

  useCanvasEvent('handle:action', handleHandleAction);

  const handlePaneClick = useCallback(() => {
    removePreviewFromReactFlow(reactFlow);
  }, [reactFlow]);

  return (
    <BaseCanvas
      {...canvasProps}
      mode="design"
      deleteKeyCode={['Backspace', 'Delete']}
      onConnectEnd={handleAddNodeOnConnectEnd}
      onPaneClick={handlePaneClick}
    >
      <AddNodeManager />
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
      <StoryInfoPanel title={storyInfo.title} description={storyInfo.description} />
    </BaseCanvas>
  );
}

function DefaultStory() {
  const initialNodes = useMemo<Node[]>(
    () => [
      createActivityNode('ingress', 'Load records', { x: 32, y: 256 }),
      createLoopContainerNode(
        'loop-1',
        { x: 224, y: 128 },
        { width: 704, height: 368 },
        {
          selected: true,
          data: { display: { label: 'For Each claim' } },
        }
      ),
      createActivityNode('child-1', 'Analyze claims', { x: 160, y: 96 }, { parentId: 'loop-1' }),
      createActivityNode('child-2', 'Write outcome', { x: 432, y: 96 }, { parentId: 'loop-1' }),
      createActivityNode('egress', 'Publish results', { x: 1024, y: 256 }),
    ],
    []
  );

  const initialEdges = useMemo<Edge[]>(
    () => [
      {
        id: 'ingress-loop',
        source: 'ingress',
        sourceHandle: 'output',
        target: 'loop-1',
        targetHandle: 'input',
      },
      {
        id: 'loop-child-1',
        source: 'loop-1',
        sourceHandle: STORY_LOOP_START_HANDLE_ID,
        target: 'child-1',
        targetHandle: 'input',
      },
      {
        id: 'child-1-child-2',
        source: 'child-1',
        sourceHandle: 'output',
        target: 'child-2',
        targetHandle: 'input',
      },
      {
        id: 'child-2-loop',
        source: 'child-2',
        sourceHandle: 'output',
        target: 'loop-1',
        targetHandle: STORY_LOOP_CONTINUE_HANDLE_ID,
      },
      {
        id: 'loop-egress',
        source: 'loop-1',
        sourceHandle: 'success',
        target: 'egress',
        targetHandle: 'input',
      },
    ],
    []
  );

  return (
    <LoopCanvasStory
      initialNodes={initialNodes}
      initialEdges={initialEdges}
      storyInfo={{
        title: 'Loop Node',
        description:
          'Default loop container with inner start/continue handles, an outer success handle, child nodes, and insertion affordances.',
      }}
    />
  );
}

function NestedOuterOutputInsertStory() {
  const initialNodes = useMemo<Node[]>(
    () => [
      createActivityNode('ingress', 'Load records', { x: 32, y: 288 }),
      createLoopContainerNode(
        'outer-loop',
        { x: 192, y: 80 },
        { width: 1040, height: 496 },
        {
          selected: true,
          data: { display: { label: 'For Each claim' } },
        }
      ),
      createLoopContainerNode(
        'inner-loop',
        { x: 128, y: 112 },
        { width: 496, height: 304 },
        {
          parentId: 'outer-loop',
          data: { display: { label: 'For Each attachment' } },
        }
      ),
      createActivityNode(
        'inner-child',
        'Classify attachment',
        { x: 176, y: 112 },
        { parentId: 'inner-loop' }
      ),
      createActivityNode(
        'review',
        'Review finding',
        { x: 720, y: 216 },
        { parentId: 'outer-loop' }
      ),
      createActivityNode('egress', 'Publish results', { x: 1296, y: 288 }),
    ],
    []
  );

  const initialEdges = useMemo<Edge[]>(
    () => [
      {
        id: 'ingress-outer-loop',
        source: 'ingress',
        sourceHandle: 'output',
        target: 'outer-loop',
        targetHandle: 'input',
      },
      {
        id: 'outer-loop-inner-loop',
        source: 'outer-loop',
        sourceHandle: STORY_LOOP_START_HANDLE_ID,
        target: 'inner-loop',
        targetHandle: 'input',
      },
      {
        id: 'inner-loop-inner-child',
        source: 'inner-loop',
        sourceHandle: STORY_LOOP_START_HANDLE_ID,
        target: 'inner-child',
        targetHandle: 'input',
      },
      {
        id: 'inner-child-inner-loop',
        source: 'inner-child',
        sourceHandle: 'output',
        target: 'inner-loop',
        targetHandle: STORY_LOOP_CONTINUE_HANDLE_ID,
      },
      {
        id: 'inner-loop-review',
        source: 'inner-loop',
        sourceHandle: STORY_LOOP_SUCCESS_HANDLE_ID,
        target: 'review',
        targetHandle: 'input',
      },
      {
        id: 'review-outer-loop',
        source: 'review',
        sourceHandle: 'output',
        target: 'outer-loop',
        targetHandle: STORY_LOOP_CONTINUE_HANDLE_ID,
      },
      {
        id: 'outer-loop-egress',
        source: 'outer-loop',
        sourceHandle: STORY_LOOP_SUCCESS_HANDLE_ID,
        target: 'egress',
        targetHandle: 'input',
      },
    ],
    []
  );

  return (
    <LoopCanvasStory
      initialNodes={initialNodes}
      initialEdges={initialEdges}
      autoPreviewSource={{
        nodeId: 'inner-loop',
        handleId: STORY_LOOP_SUCCESS_HANDLE_ID,
        position: Position.Right,
      }}
      storyInfo={{
        title: 'Nested Loop Insert',
        description:
          'Nested loop scenario showing insertion from an inner loop output into an existing outer-loop path.',
      }}
    />
  );
}

function NestedOuterOutputAppendStory() {
  const initialNodes = useMemo<Node[]>(
    () => [
      createActivityNode('ingress', 'Load records', { x: 32, y: 272 }),
      createLoopContainerNode(
        'outer-loop',
        { x: 224, y: 96 },
        { width: 896, height: 448 },
        {
          selected: true,
          data: { display: { label: 'For Each claim' } },
        }
      ),
      createLoopContainerNode(
        'inner-loop',
        { x: 160, y: 112 },
        { width: 544, height: 304 },
        {
          parentId: 'outer-loop',
          data: { display: { label: 'For Each attachment' } },
        }
      ),
      createActivityNode(
        'inner-child',
        'Classify attachment',
        { x: 176, y: 112 },
        { parentId: 'inner-loop' }
      ),
      createActivityNode('egress', 'Publish results', { x: 1216, y: 272 }),
    ],
    []
  );

  const initialEdges = useMemo<Edge[]>(
    () => [
      {
        id: 'ingress-outer-loop',
        source: 'ingress',
        sourceHandle: 'output',
        target: 'outer-loop',
        targetHandle: 'input',
      },
      {
        id: 'outer-loop-inner-loop',
        source: 'outer-loop',
        sourceHandle: STORY_LOOP_START_HANDLE_ID,
        target: 'inner-loop',
        targetHandle: 'input',
      },
      {
        id: 'inner-loop-inner-child',
        source: 'inner-loop',
        sourceHandle: STORY_LOOP_START_HANDLE_ID,
        target: 'inner-child',
        targetHandle: 'input',
      },
      {
        id: 'inner-child-inner-loop',
        source: 'inner-child',
        sourceHandle: 'output',
        target: 'inner-loop',
        targetHandle: STORY_LOOP_CONTINUE_HANDLE_ID,
      },
      {
        id: 'outer-loop-egress',
        source: 'outer-loop',
        sourceHandle: STORY_LOOP_SUCCESS_HANDLE_ID,
        target: 'egress',
        targetHandle: 'input',
      },
    ],
    []
  );

  return (
    <LoopCanvasStory
      initialNodes={initialNodes}
      initialEdges={initialEdges}
      autoPreviewSource={{
        nodeId: 'inner-loop',
        handleId: STORY_LOOP_SUCCESS_HANDLE_ID,
        position: Position.Right,
      }}
      storyInfo={{
        title: 'Nested Loop Append',
        description:
          'Nested loop scenario showing append behavior from an inner loop output while preserving parent loop containment.',
      }}
    />
  );
}

// 24 children — a single loop densely populated to exercise re-render cost when
// the container is dragged (every child moves with the parent each frame).
const MANY_CHILD_LABELS = [
  'Validate input',
  'Normalize fields',
  'Lookup account',
  'Score risk',
  'Check policy',
  'Fetch history',
  'Enrich profile',
  'Detect anomalies',
  'Apply rules',
  'Build payload',
  'Call service',
  'Parse response',
  'Map results',
  'Update record',
  'Write audit',
  'Emit metric',
  'Queue follow-up',
  'Notify owner',
  'Tag outcome',
  'Archive copy',
  'Reconcile totals',
  'Flag exceptions',
  'Summarize run',
  'Persist state',
];

function buildManyChildrenGraph(): { nodes: Node[]; edges: Edge[] } {
  const columns = 6;
  const layout = layoutLoopChildren('loop-many', MANY_CHILD_LABELS, columns);

  const loopPosition = { x: 320, y: 96 };
  const centerY = loopPosition.y + layout.height / 2;

  const loop = createLoopContainerNode(
    'loop-many',
    loopPosition,
    { width: layout.width, height: layout.height },
    { selected: true, data: { display: { label: 'For Each record' } } }
  );

  const nodes: Node[] = [
    createActivityNode('ingress', 'Load records', { x: 32, y: centerY }),
    loop,
    ...layout.children,
    createActivityNode('egress', 'Publish results', {
      x: loopPosition.x + layout.width + 160,
      y: centerY,
    }),
  ];

  const edges: Edge[] = [
    makeEdge('ingress-loop', 'ingress', 'output', 'loop-many', 'input'),
    ...loopBodyRowEdges('loop-many', layout.children, columns),
    makeEdge('loop-egress', 'loop-many', STORY_LOOP_SUCCESS_HANDLE_ID, 'egress', 'input'),
  ];

  return { nodes, edges };
}

function ManyChildrenStory() {
  const { initialNodes, initialEdges } = useMemo(() => {
    const graph = buildManyChildrenGraph();
    return { initialNodes: graph.nodes, initialEdges: graph.edges };
  }, []);

  return (
    <LoopCanvasStory
      initialNodes={initialNodes}
      initialEdges={initialEdges}
      storyInfo={{
        title: 'Loop With Many Children',
        description:
          'A single loop containing 24 child nodes laid out in a grid. Drag the loop around — every child moves with it, so this is the stress case for container re-render performance.',
      }}
    />
  );
}

const INNER_DOCUMENT_LABELS = [
  'Download file',
  'Detect type',
  'Extract text',
  'OCR scan',
  'Classify',
  'Validate',
];

const INNER_CANDIDATE_LABELS = [
  'Match entity',
  'Score match',
  'Resolve duplicate',
  'Merge record',
  'Update index',
  'Log result',
];

function NestedLoopsManyChildrenStory() {
  const { initialNodes, initialEdges } = useMemo(() => {
    const innerColumns = 2;
    const innerA = layoutLoopChildren('inner-a', INNER_DOCUMENT_LABELS, innerColumns);
    const innerB = layoutLoopChildren('inner-b', INNER_CANDIDATE_LABELS, innerColumns);

    // Two inner loops sit side-by-side inside the outer loop, both pinned to the
    // outer container's safe area; the outer loop is sized to wrap them.
    const innerGap = 48;
    const innerAPosition = { x: CHILD_GRID.safeLeft, y: CHILD_GRID.safeTop };
    const innerBPosition = {
      x: CHILD_GRID.safeLeft + innerA.width + innerGap,
      y: CHILD_GRID.safeTop,
    };

    const outerWidth =
      CHILD_GRID.safeLeft + innerA.width + innerGap + innerB.width + CHILD_GRID.padRight;
    const outerHeight =
      CHILD_GRID.safeTop + Math.max(innerA.height, innerB.height) + CHILD_GRID.padBottom;

    const outerPosition = { x: 320, y: 96 };
    const centerY = outerPosition.y + outerHeight / 2;

    const outerLoop = createLoopContainerNode(
      'outer-loop',
      outerPosition,
      { width: outerWidth, height: outerHeight },
      { selected: true, data: { display: { label: 'For Each batch' } } }
    );
    const loopA = createLoopContainerNode(
      'inner-a',
      innerAPosition,
      { width: innerA.width, height: innerA.height },
      { parentId: 'outer-loop', data: { display: { label: 'For Each document' } } }
    );
    const loopB = createLoopContainerNode(
      'inner-b',
      innerBPosition,
      { width: innerB.width, height: innerB.height },
      { parentId: 'outer-loop', data: { display: { label: 'For Each candidate' } } }
    );

    // Parents must precede their children in the nodes array (React Flow rule).
    const nodes: Node[] = [
      createActivityNode('ingress', 'Load batches', { x: 32, y: centerY }),
      outerLoop,
      loopA,
      ...innerA.children,
      loopB,
      ...innerB.children,
      createActivityNode('egress', 'Publish results', {
        x: outerPosition.x + outerWidth + 160,
        y: centerY,
      }),
    ];

    const edges: Edge[] = [
      makeEdge('ingress-outer', 'ingress', 'output', 'outer-loop', 'input'),
      makeEdge('outer-start-inner-a', 'outer-loop', STORY_LOOP_START_HANDLE_ID, 'inner-a', 'input'),
      ...loopBodyRowEdges('inner-a', innerA.children, innerColumns),
      makeEdge('inner-a-inner-b', 'inner-a', STORY_LOOP_SUCCESS_HANDLE_ID, 'inner-b', 'input'),
      ...loopBodyRowEdges('inner-b', innerB.children, innerColumns),
      makeEdge(
        'inner-b-outer-continue',
        'inner-b',
        STORY_LOOP_SUCCESS_HANDLE_ID,
        'outer-loop',
        STORY_LOOP_CONTINUE_HANDLE_ID
      ),
      makeEdge('outer-egress', 'outer-loop', STORY_LOOP_SUCCESS_HANDLE_ID, 'egress', 'input'),
    ];

    return { initialNodes: nodes, initialEdges: edges };
  }, []);

  return (
    <LoopCanvasStory
      initialNodes={initialNodes}
      initialEdges={initialEdges}
      storyInfo={{
        title: 'Nested Loops With Many Children',
        description:
          'An outer loop containing two inner loops, each with its own grid of child nodes. Dragging the outer loop moves every descendant (inner loops and their children) — the deepest container re-render stress case.',
      }}
    />
  );
}

export const Default: Story = {
  render: () => <DefaultStory />,
};

export const NestedOuterOutputInsert: Story = {
  render: () => <NestedOuterOutputInsertStory />,
};

export const NestedOuterOutputAppend: Story = {
  render: () => <NestedOuterOutputAppendStory />,
};

export const ManyChildren: Story = {
  name: 'Loop With Many Children',
  render: () => <ManyChildrenStory />,
};

export const NestedLoopsManyChildren: Story = {
  name: 'Nested Loops With Many Children',
  render: () => <NestedLoopsManyChildrenStory />,
};

// ============================================================================
// Execution Count — LoopNodeExecutionCount doc page
// ============================================================================

type LoopCountNodeData = LoopNodeData & {
  initialIndex: number;
  initialIsAll?: boolean;
  total: number;
  interactive?: boolean;
  iterationStatuses?: Map<number, ElementStatusValues>;
  status?: ElementStatusValues;
};

const EXECUTION_COUNT_STATUS = new Map<string, ElementStatusValues>([
  ['ec-all', ElementStatusValues.InProgress],
  ['ec-full', ElementStatusValues.InProgress],
  ['ec-compact', ElementStatusValues.Completed],
  ['ec-minimal', ElementStatusValues.Failed],
]);

const EXECUTION_COUNT_ITERATION_STATUSES = new Map<string, Map<number, ElementStatusValues>>([
  [
    'ec-all',
    new Map([
      [0, ElementStatusValues.Completed],
      [1, ElementStatusValues.Completed],
      [2, ElementStatusValues.Completed],
      [3, ElementStatusValues.InProgress],
      [4, ElementStatusValues.Failed],
    ]),
  ],
  [
    'ec-full',
    new Map([
      [0, ElementStatusValues.Completed],
      [1, ElementStatusValues.Completed],
      [2, ElementStatusValues.InProgress],
    ]),
  ],
  [
    'ec-compact',
    new Map([
      [0, ElementStatusValues.Completed],
      [1, ElementStatusValues.Completed],
      [2, ElementStatusValues.Completed],
    ]),
  ],
  [
    'ec-minimal',
    new Map([
      [0, ElementStatusValues.Completed],
      [1, ElementStatusValues.Failed],
    ]),
  ],
]);

function createExecutionCountNodes(): Node<LoopCountNodeData>[] {
  return [
    {
      id: 'ec-all',
      type: LOOP_TYPE,
      position: { x: 80, y: 80 },
      data: {
        display: { label: 'For Each Order', shape: 'container' },
        initialIndex: 3,
        initialIsAll: true,
        total: 5,
        iterationStatuses: EXECUTION_COUNT_ITERATION_STATUSES.get('ec-all'),
        status: ElementStatusValues.InProgress,
      },
      style: { width: 600, height: 240 },
    },
    {
      id: 'ec-full',
      type: LOOP_TYPE,
      position: { x: 80, y: 368 },
      data: {
        display: { label: 'For Each Region', shape: 'container' },
        initialIndex: 2,
        total: 5,
        iterationStatuses: EXECUTION_COUNT_ITERATION_STATUSES.get('ec-full'),
        status: ElementStatusValues.InProgress,
      },
      style: { width: 600, height: 240 },
    },
    {
      id: 'ec-compact',
      type: LOOP_TYPE,
      position: { x: 80, y: 656 },
      data: {
        display: { label: 'For Each City', shape: 'container' },
        initialIndex: 2,
        total: 3,
        iterationStatuses: EXECUTION_COUNT_ITERATION_STATUSES.get('ec-compact'),
        status: ElementStatusValues.Completed,
      },
      style: { width: 300, height: 240 },
    },
    {
      id: 'ec-minimal',
      type: LOOP_TYPE,
      position: { x: 80, y: 944 },
      data: {
        display: { label: 'For Each Item', shape: 'container' },
        initialIndex: 1,
        total: 8,
        iterationStatuses: EXECUTION_COUNT_ITERATION_STATUSES.get('ec-minimal'),
        status: ElementStatusValues.Failed,
      },
      style: { width: 200, height: 240 },
    },
  ];
}

function LoopCountCanvasNode(props: NodeProps<Node<LoopCountNodeData>>) {
  const { data } = props;
  const [activeIndex, setActiveIndex] = useState(
    Math.max(0, Math.min(data.total - 1, data.initialIndex))
  );
  const [isAll, setIsAll] = useState(data.initialIsAll ?? false);

  useEffect(() => {
    setActiveIndex(Math.max(0, Math.min(data.total - 1, data.initialIndex)));
    setIsAll(data.initialIsAll ?? false);
  }, [data.initialIndex, data.initialIsAll, data.total]);

  const iterationPillState: LoopNodeExecutionCountState = {
    activeIndex,
    total: data.total,
    onActiveIndexChange:
      data.interactive === false
        ? undefined
        : (i) => {
            setIsAll(false);
            setActiveIndex(i);
          },
    isAll,
    onAllChange: setIsAll,
    iterationStatuses: data.iterationStatuses,
  };

  return <LoopNode {...props} iterationPillState={iterationPillState} />;
}

const LOOP_COUNT_NODE_TYPES = {
  [LOOP_TYPE]: LoopCountCanvasNode,
};

function ExecutionCountCanvas() {
  const initialNodes = useMemo(() => createExecutionCountNodes(), []);
  const { canvasProps } = useCanvasStory({
    initialNodes,
    additionalNodeTypes: LOOP_COUNT_NODE_TYPES,
  });

  return (
    <BaseCanvas {...canvasProps} mode="design">
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
    </BaseCanvas>
  );
}

function ExecutionCountPreviewButton({
  expanded,
  onExpand,
  onClose,
}: {
  expanded: boolean;
  onExpand: () => void;
  onClose: () => void;
}) {
  return expanded ? (
    <button
      type="button"
      onClick={onClose}
      className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-md border border-border bg-background/80 px-2.5 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm transition-colors hover:bg-surface-hover hover:text-foreground"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path
          d="M7.5 4.5l-6 6M10.5 1.5l-6 6M1.5 1.5l4 4M10.5 10.5l-4-4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Close
    </button>
  ) : (
    <button
      type="button"
      onClick={onExpand}
      className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-md border border-border bg-background/80 px-2.5 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm transition-colors hover:bg-surface-hover hover:text-foreground"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path
          d="M7.5 1.5h3v3M4.5 10.5h-3v-3M10.5 4.5V1.5H7.5M1.5 7.5v3h3"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Expand
    </button>
  );
}

const tierRows = [
  {
    width: '≥ 400 px',
    tier: 'full' as const,
    controls: 'All toggle · ‹ prev · k/N fraction (click-to-type) · next › · jump-to-failed ⊕',
    badgeClass: 'bg-emerald-500/10 text-emerald-600',
  },
  {
    width: '260 – 399 px',
    tier: 'compact' as const,
    controls: 'All toggle · k/N fraction (click-to-type) · jump-to-failed ⊕',
    badgeClass: 'bg-amber-500/10 text-amber-600',
  },
  {
    width: '< 260 px',
    tier: 'minimal' as const,
    controls: 'Count chip only — read-only',
    badgeClass: 'bg-sky-500/10 text-sky-600',
  },
] as const;

const ANATOMY_ITERATION_STATUSES = new Map<number, ElementStatusValues>([
  [0, ElementStatusValues.Completed],
  [1, ElementStatusValues.Completed],
  [2, ElementStatusValues.InProgress],
  [3, ElementStatusValues.Failed],
]);
const ANATOMY_TOTAL = 5;

function CollapsibleSection({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-border">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between py-5 text-left transition-colors hover:text-foreground"
      >
        <h2 className="text-2xl font-bold tracking-tight text-foreground">{title}</h2>
        <CanvasIcon icon={open ? 'chevron-up' : 'chevron-down'} size={16} />
      </button>
      {open && <div className="pb-8">{children}</div>}
    </div>
  );
}

function ExecutionCountPage({ globalTheme }: { globalTheme: string }) {
  const [expanded, setExpanded] = useState(false);
  const [anatomyOpen, setAnatomyOpen] = useState(false);
  const [headerLayoutOpen, setHeaderLayoutOpen] = useState(false);
  const [howToUseOpen, setHowToUseOpen] = useState(false);
  const allOpen = anatomyOpen && headerLayoutOpen && howToUseOpen;
  const toggleAll = () => {
    const next = !allOpen;
    setAnatomyOpen(next);
    setHeaderLayoutOpen(next);
    setHowToUseOpen(next);
  };
  const [defaultAnatIndex, setDefaultAnatIndex] = useState(3);
  const [defaultAnatIsAll, setDefaultAnatIsAll] = useState(true);
  const [anatIndex, setAnatIndex] = useState(2);
  const [anatIsAll, setAnatIsAll] = useState(false);
  const [headerIndex, setHeaderIndex] = useState(2);
  const [headerIsAll, setHeaderIsAll] = useState(false);

  return (
    <div className={cn(globalTheme, 'min-h-screen w-full bg-background text-foreground')}>
      {/* ── Header ── */}
      <div className="mx-auto max-w-4xl px-8 pt-8">
        <h2 className="mb-2 text-2xl font-bold tracking-tight text-foreground">Execution Count</h2>
        <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-primary">
            LoopNodeExecutionCount
          </code>{' '}
          is a unified segmented pill that lets users navigate loop iterations at runtime. An{' '}
          <strong className="text-foreground">All</strong> toggle on the left switches between
          aggregate and per-iteration views. The right segment shows the current fraction{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-primary">k / N</code> with
          prev/next arrows, a click-to-type jump shortcut, and an optional crosshair button that
          jumps directly to the first failed iteration. The component adapts to three size tiers
          based on the available header width.
        </p>
        <div className="mb-8 h-px bg-border" />
      </div>

      {/* ── Preview ── */}
      <div className="pb-8">
        <div className="mx-auto mb-4 max-w-4xl px-8">
          <h2 className="mb-1 text-2xl font-bold tracking-tight text-foreground">Preview</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Three loop nodes side-by-side: wide (full tier), medium (compact tier), and narrow
            (minimal tier). Interact with the pills directly on the canvas.
          </p>
        </div>
        <div className="flex justify-center">
          <div className="relative h-[480px] w-[90vw] overflow-hidden rounded-xl border border-border">
            {!expanded && <ExecutionCountCanvas />}
            <ExecutionCountPreviewButton
              expanded={false}
              onExpand={() => setExpanded(true)}
              onClose={() => setExpanded(false)}
            />
          </div>
        </div>
      </div>

      {/* Expanded overlay */}
      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setExpanded(false)}
        >
          <div
            className="relative overflow-hidden rounded-xl border border-border"
            style={{ width: '90vw', height: '90vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <ExecutionCountCanvas />
            <ExecutionCountPreviewButton
              expanded={true}
              onExpand={() => setExpanded(true)}
              onClose={() => setExpanded(false)}
            />
          </div>
        </div>
      )}

      {/* ── Sections ── */}
      <div className="mx-auto max-w-4xl px-8 pb-8">
        {/* Expand / Collapse all */}
        <div className="flex justify-end pb-2">
          <button
            type="button"
            onClick={toggleAll}
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            {allOpen ? 'Collapse all' : 'Expand all'}
          </button>
        </div>

        <CollapsibleSection
          title="Anatomy"
          open={anatomyOpen}
          onToggle={() => setAnatomyOpen((o) => !o)}
        >
          <h3 className="mb-2 text-lg font-semibold text-foreground">Default</h3>
          <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
            By default, the pill opens in the <strong className="text-foreground">All</strong> view,
            showing the aggregate execution summary across all iterations. Click{' '}
            <strong className="text-foreground">All</strong> to toggle into individual iteration
            navigation.
          </p>
          <div className="mb-8 flex items-center justify-center rounded-xl border border-border bg-card p-8">
            <LoopNodeExecutionCount
              size="full"
              state={{
                activeIndex: defaultAnatIndex,
                total: ANATOMY_TOTAL,
                onActiveIndexChange: (i) => {
                  setDefaultAnatIsAll(false);
                  setDefaultAnatIndex(i);
                },
                isAll: defaultAnatIsAll,
                onAllChange: setDefaultAnatIsAll,
                iterationStatuses: ANATOMY_ITERATION_STATUSES,
              }}
            />
          </div>

          {/* Tier cards */}
          <h3 className="mb-2 text-lg font-semibold text-foreground">Responsive</h3>
          <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
            The pill adapts to three responsive tiers based on the loop node's rendered width. As
            nodes are resized or deeply nested, controls are progressively removed so the pill never
            overflows the header.
          </p>
          <div className="mb-8 grid grid-cols-3 gap-4">
            {tierRows.map((row) => (
              <div
                key={row.tier}
                className="flex flex-col gap-3 rounded-xl border border-border bg-card p-6"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn('rounded px-1.5 py-0.5 font-mono text-[11px]', row.badgeClass)}
                  >
                    {row.tier}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">{row.width}</span>
                </div>
                <div className="flex items-center justify-center rounded-lg border border-border bg-surface-raised py-5">
                  <LoopNodeExecutionCount
                    size={row.tier}
                    state={{
                      activeIndex: anatIndex,
                      total: ANATOMY_TOTAL,
                      onActiveIndexChange: (i) => {
                        setAnatIsAll(false);
                        setAnatIndex(i);
                      },
                      isAll: anatIsAll,
                      onAllChange: setAnatIsAll,
                      iterationStatuses: ANATOMY_ITERATION_STATUSES,
                    }}
                  />
                </div>
                <p className="text-sm text-muted-foreground">{row.controls}</p>
              </div>
            ))}
          </div>

          {/* Spec table */}
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                    Node width
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                    <code className="text-xs">size</code> tier
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                    Controls visible
                  </th>
                </tr>
              </thead>
              <tbody>
                {tierRows.map((row, i) => (
                  <tr
                    key={row.tier}
                    className={i < tierRows.length - 1 ? 'border-b border-border' : ''}
                  >
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-foreground">
                      {row.width}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'rounded px-1.5 py-0.5 font-mono text-[11px]',
                          row.badgeClass
                        )}
                      >
                        {row.tier}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{row.controls}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Count Range */}
          <div className="mt-10 mb-2">
            <h3 className="mb-2 text-lg font-semibold text-foreground">Count Range</h3>
            <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
              The pill supports iteration counts from <strong className="text-foreground">1</strong>{' '}
              to <strong className="text-foreground">999</strong>. The fraction scales naturally as
              digit width increases — no truncation or overflow at any value.
            </p>
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex flex-wrap items-end gap-6">
                {[
                  { active: 0, total: 1, label: 'Minimum' },
                  { active: 4, total: 10, label: '' },
                  { active: 49, total: 100, label: '' },
                  { active: 99, total: 500, label: '' },
                  { active: 998, total: 999, label: 'Maximum' },
                ].map(({ active, total, label }) => (
                  <div key={total} className="flex flex-col items-center gap-2">
                    <LoopNodeExecutionCount
                      size="full"
                      state={{
                        activeIndex: active,
                        total,
                        isAll: false,
                        onAllChange: () => {},
                      }}
                    />
                    <span className="text-[11px] font-mono text-muted-foreground">
                      {label || `${active + 1} / ${total}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Header Layout"
          open={headerLayoutOpen}
          onToggle={() => setHeaderLayoutOpen((o) => !o)}
        >
          <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
            The loop node header is divided into two regions. The right region always renders in
            this fixed order: execution count pill first, then the sequential/parallel chip.
          </p>

          {/* Visual mockup */}
          <div className="mb-8 rounded-xl border border-border bg-card p-6">
            <div className="rounded-[18px] bg-surface-overlay px-3.5 py-2.5 shadow-sm">
              <div className="flex items-center justify-between gap-2.5 text-foreground">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="shrink-0" aria-hidden>
                    <CanvasIcon icon="repeat" size={16} />
                  </span>
                  <span className="truncate text-[15px] font-semibold leading-5">
                    For Each Region
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <LoopNodeExecutionCount
                    size="full"
                    state={{
                      activeIndex: headerIndex,
                      total: ANATOMY_TOTAL,
                      onActiveIndexChange: (i) => {
                        setHeaderIsAll(false);
                        setHeaderIndex(i);
                      },
                      isAll: headerIsAll,
                      onAllChange: setHeaderIsAll,
                      iterationStatuses: ANATOMY_ITERATION_STATUSES,
                    }}
                  />
                  <span className="flex h-6 shrink-0 items-center gap-1 rounded-full border border-border bg-surface px-2.5 text-[11px] font-semibold leading-4 text-foreground shadow-sm">
                    <span className="flex shrink-0" aria-hidden>
                      <CanvasIcon icon="align-justify" size={11} />
                    </span>
                    Sequential
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-start justify-between px-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-muted font-mono text-[10px] font-bold text-foreground">
                  A
                </span>
                <span>Icon · Title — truncates on narrow nodes</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-muted font-mono text-[10px] font-bold text-foreground">
                    B
                  </span>
                  <span>Execution Count pill</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-muted font-mono text-[10px] font-bold text-foreground">
                    C
                  </span>
                  <span>Sequential / Parallel chip</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6 overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                    Region
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                    Content
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Rule</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-foreground">
                    Left
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">Icon · Title</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    Title truncates with ellipsis as the node narrows
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-foreground">
                    Right — 1st
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    <code className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-primary">
                      LoopNodeExecutionCount
                    </code>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    Adapts to <strong>full / compact / minimal</strong> tier based on{' '}
                    <code className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-primary">
                      nodeWidth
                    </code>
                    ; always right-aligned, never overlaid
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-foreground">
                    Right — 2nd
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    Sequential / Parallel chip
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    Fixed width; always the rightmost element in the header
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
            Pass{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-primary">
              iterationPillState
            </code>{' '}
            directly to{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-primary">LoopNode</code>.
            The component computes the size tier from its measured{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-primary">width</code>{' '}
            automatically — no absolute positioning or overlay wrappers needed.
          </p>
        </CollapsibleSection>

        <CollapsibleSection
          title="How to use"
          open={howToUseOpen}
          onToggle={() => setHowToUseOpen((o) => !o)}
        >
          <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
            Build a{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-primary">
              LoopNodeExecutionCountState
            </code>{' '}
            object from your runtime data and pass it as{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-primary">
              iterationPillState
            </code>{' '}
            to <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-primary">LoopNode</code>
            . The size tier is derived automatically from the node's measured width — no overlay or
            absolute positioning needed.
          </p>
          <pre className="overflow-x-auto rounded-lg border border-border bg-card p-4 text-[13px] leading-relaxed text-foreground">
            {`import { LoopNode } from '@uipath/apollo-react/canvas';
import type { LoopNodeExecutionCountState } from '@uipath/apollo-react/canvas';

function MyLoopCanvasNode(props: NodeProps<Node<MyLoopData>>) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAll, setIsAll] = useState(false);

  const iterationPillState: LoopNodeExecutionCountState = {
    activeIndex,
    total: props.data.total,
    onActiveIndexChange: (i) => { setIsAll(false); setActiveIndex(i); },
    isAll,
    onAllChange: setIsAll,
    iterationStatuses: props.data.iterationStatuses,
  };

  // LoopNode computes full / compact / minimal tier from its measured width automatically
  return <LoopNode {...props} iterationPillState={iterationPillState} />;
}`}
          </pre>
        </CollapsibleSection>
      </div>
    </div>
  );
}

export const ExecutionCount: Story = {
  name: 'Execution Count',
  decorators: [
    withCanvasProviders({
      executionState: {
        getNodeExecutionState: (nodeId: string) => EXECUTION_COUNT_STATUS.get(nodeId),
        getEdgeExecutionState: () => undefined,
      },
      validationState: {
        getElementValidationState: () => undefined,
      },
    }),
  ],
  render: (_, { globals }) => <ExecutionCountPage globalTheme={globals.theme || 'future-dark'} />,
};

// ============================================================================
// Header Chips — rule chips, wrapped titles, and description text in the
// loop header (the case-management "stage" flavor of the loop container).
// ============================================================================

function WithHeaderChipsStory() {
  const { initialNodes, initialEdges } = useMemo(() => {
    const chipCounts = createLoopContainerNode(
      'loop-chip-counts',
      { x: 64, y: 64 },
      { width: 448, height: 256 },
      {
        data: {
          display: { label: 'Intake' },
          headerChips: [
            { type: StageHeaderChipType.Entry, count: 2, tooltip: '2 entry rules' },
            { type: StageHeaderChipType.Completion, count: 1, tooltip: '1 complete rule' },
            { type: StageHeaderChipType.Exit, count: 1, tooltip: '1 exit rule' },
          ],
        },
      }
    );

    const statusPills = createLoopContainerNode(
      'loop-status-pills',
      { x: 576, y: 64 },
      { width: 448, height: 256 },
      {
        data: {
          display: {
            label: 'A stage title long enough to wrap onto a second line before clamping',
          },
          headerChips: [
            { type: StageHeaderChipType.Optional },
            { type: StageHeaderChipType.EndsCase },
          ],
        },
      }
    );

    const withDescription = createLoopContainerNode(
      'loop-description',
      { x: 64, y: 384 },
      { width: 960, height: 256 },
      {
        data: {
          display: {
            label: 'Assessment',
            description:
              'Instance-supplied description text renders as a muted secondary line under the title and clamps at two lines. Manifest descriptions stay out of the header.',
          },
          headerChips: [
            { type: StageHeaderChipType.Entry, count: 1 },
            { type: StageHeaderChipType.ReturnToOrigin, count: 1, tooltip: 'Returns to origin' },
            { type: StageHeaderChipType.Optional },
          ],
        },
      }
    );

    return { initialNodes: [chipCounts, statusPills, withDescription], initialEdges: [] };
  }, []);

  return (
    <LoopCanvasStory
      initialNodes={initialNodes}
      initialEdges={initialEdges}
      storyInfo={{
        title: 'Header Chips',
        description:
          'Rule chips in the loop header via data.headerChips (or the headerChips prop): entry / complete / exit / return-to-origin icon chips with counts, plus Optional and Ends case status pills. Titles wrap to two lines and data.display.description adds a secondary text line, so the loop container can serve as the case-management stage visual.',
      }}
    />
  );
}

export const WithHeaderChips: Story = {
  name: 'With Header Chips',
  render: () => <WithHeaderChipsStory />,
};
