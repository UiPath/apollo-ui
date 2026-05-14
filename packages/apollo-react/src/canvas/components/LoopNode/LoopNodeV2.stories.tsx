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
import { CanvasIcon } from '../../utils/icon-registry';
import { removePreviewFromReactFlow } from '../../utils/createPreviewNode';
import { snapToGrid } from '../../utils/NodeUtils';
import { AddNodeManager } from '../AddNodePanel';
import { createAddNodePreview } from '../AddNodePanel/createAddNodePreview';
import { BaseCanvas } from '../BaseCanvas';
import type { BaseNodeData } from '../BaseNode/BaseNode.types';
import { CanvasPositionControls } from '../CanvasPositionControls';
import { LoopNode } from './LoopNode';
import type { LoopNodeData } from './LoopNode.types';

const meta: Meta = {
  title: 'Components/LoopNode V2',
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

  return {
    id,
    type: LOOP_TYPE,
    position: snapPoint(position),
    parentId: options?.parentId,
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
    };
  }

  return node;
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
        title: 'Loop Node V2',
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

type LoopExecutionNodeData = LoopNodeData & {
  initialIndex: number;
  total: number;
  interactive?: boolean;
};

const LOOP_EXECUTION_SIZE = { width: 520, height: 280 };
const LOOP_EXECUTION_GRID = {
  startX: 80,
  startY: 80,
  gapX: 640,
  gapY: 360,
} as const;

const LOOP_EXECUTION_CASES: {
  id: string;
  label: string;
  status: ElementStatusValues;
  initialIndex: number;
  total: number;
  parallel?: boolean;
  interactive?: boolean;
}[] = [
  {
    id: 'loop-completed',
    label: 'Completed loop',
    status: ElementStatusValues.Completed,
    initialIndex: 2,
    total: 3,
  },
  {
    id: 'loop-running',
    label: 'Running loop',
    status: ElementStatusValues.InProgress,
    initialIndex: 1,
    total: 3,
  },
  {
    id: 'loop-paused',
    label: 'Paused loop',
    status: ElementStatusValues.Paused,
    initialIndex: 1,
    total: 4,
  },
  {
    id: 'loop-failed',
    label: 'Failed loop',
    status: ElementStatusValues.Failed,
    initialIndex: 0,
    total: 3,
  },
  {
    id: 'loop-cancelled',
    label: 'Cancelled',
    status: ElementStatusValues.Cancelled,
    initialIndex: 2,
    total: 5,
  },
  {
    id: 'loop-parallel',
    label: 'Parallel loop',
    status: ElementStatusValues.Completed,
    initialIndex: 2,
    total: 3,
    parallel: true,
  },
  {
    id: 'loop-label-only',
    label: 'Label only',
    status: ElementStatusValues.Completed,
    initialIndex: 1,
    total: 3,
    interactive: false,
  },
  {
    id: 'loop-clamped',
    label: 'Clamped active index',
    status: ElementStatusValues.Completed,
    initialIndex: 99,
    total: 3,
  },
];

const LOOP_EXECUTION_STATUS = new Map(LOOP_EXECUTION_CASES.map(({ id, status }) => [id, status]));

function createExecutionStateGrid(): Node<LoopExecutionNodeData>[] {
  return LOOP_EXECUTION_CASES.map(
    ({ id, label, initialIndex, total, parallel, interactive }, index) => {
      const colIndex = index % 2;
      const rowIndex = Math.floor(index / 2);

      return {
        id,
        type: LOOP_TYPE,
        position: {
          x: LOOP_EXECUTION_GRID.startX + colIndex * LOOP_EXECUTION_GRID.gapX,
          y: LOOP_EXECUTION_GRID.startY + rowIndex * LOOP_EXECUTION_GRID.gapY,
        },
        data: {
          display: { label, shape: 'container' },
          parallel,
          initialIndex,
          total,
          interactive,
        },
        style: LOOP_EXECUTION_SIZE,
      };
    }
  );
}

function LoopExecutionCanvasNode(props: NodeProps<Node<LoopExecutionNodeData>>) {
  const { data } = props;
  const [activeIndex, setActiveIndex] = useState(data.initialIndex);

  useEffect(() => {
    setActiveIndex(data.initialIndex);
  }, [data.initialIndex]);

  return (
    <LoopNode
      {...props}
      iterationState={{
        activeIndex,
        total: data.total,
        onActiveIndexChange: data.interactive === false ? undefined : setActiveIndex,
      }}
    />
  );
}

const LOOP_EXECUTION_NODE_TYPES = {
  [LOOP_TYPE]: LoopExecutionCanvasNode,
};

function ExecutionStatesStory() {
  const initialNodes = useMemo(() => createExecutionStateGrid(), []);
  const { canvasProps } = useCanvasStory({
    initialNodes,
    additionalNodeTypes: LOOP_EXECUTION_NODE_TYPES,
  });

  return (
    <BaseCanvas {...canvasProps} mode="design">
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
      <StoryInfoPanel
        title="Loop Execution States"
        description="Grid showing loop status border treatment, iteration navigation, clamped index handling, label-only navigation, and sequential/parallel badges."
      />
    </BaseCanvas>
  );
}

// ============================================================================
// Anatomy: LoopNode — full-page documentation layout
// ============================================================================

const LOOP_SLOT_DOCS = [
  { slot: 'topLeft',     dot: 'bg-red-500',    rule: 'Breakpoint',                         detail: 'Debug mode — pauses execution at this node.' },
  { slot: 'topRight',    dot: 'bg-emerald-500', rule: 'Status › Validation error › Warning', detail: 'First matching state wins.' },
  { slot: 'bottomLeft',  dot: 'bg-blue-500',   rule: 'Execution start point',               detail: 'Marks the entry node for the current run.' },
  { slot: 'bottomRight', dot: 'bg-amber-500',  rule: 'Output pinned',                        detail: 'Shown when the node output is mocked/pinned. LoopNode does not carry a loop count badge — that appears on child nodes.' },
] as const;

const LOOP_HANDLE_DOCS = [
  { handle: 'input',    side: 'Left outer',   boundary: 'outer', description: 'Incoming connection — the edge entering the loop.' },
  { handle: 'success',  side: 'Right outer',  boundary: 'outer', description: 'Loop completed — exits when all iterations finish.' },
  { handle: 'start',    side: 'Inner top',    boundary: 'inner', description: 'First activity inside the loop body connects here.' },
  { handle: 'continue', side: 'Inner bottom', boundary: 'inner', description: 'Last activity loops back here to begin the next iteration.' },
] as const;

const PICKER_DOCS = [
  { ctrl: '●',               label: 'Status dot',      desc: 'Colored dot indicating the current iteration\'s outcome (green = Completed, red = Failed, amber = In Progress, purple = Paused, grey = Cancelled). Only shown when per-iteration status data is available.' },
  { ctrl: '|◄',              label: 'Jump first',      desc: 'Jumps to iteration 1.' },
  { ctrl: '◄',               label: 'Step back',       desc: 'Moves one iteration back. Disabled at the start.' },
  { ctrl: '[index / total]', label: 'Position',        desc: 'Click the index number to activate an inline input — type a target, Enter to commit, Escape to cancel.' },
  { ctrl: '►',               label: 'Step forward',    desc: 'Moves one iteration forward. Disabled at the end.' },
  { ctrl: '►|',              label: 'Jump last',       desc: 'Jumps to the final iteration.' },
  { ctrl: 'All',             label: 'All toggle',      desc: 'Collapses into an aggregate view. With status data shows ✓ completed  ✗ failed; otherwise Σ total. Click again to return to individual view.' },
  { ctrl: '⊕',              label: 'Jump to failed',  desc: 'Visible only when at least one iteration has a Failed status and the loop itself has not globally failed. Jumps directly to the first failed iteration.' },
] as const;

// Demo data for anatomy live demo
const DEMO_ITERATION_STATUSES = new Map<number, string>([
  [0, 'Completed'],
  [1, 'Completed'],
  [2, 'Failed'],
  [3, 'Completed'],
  [4, 'InProgress'],
]);
const DEMO_TOTAL = 8;

function AnatomyStory() {
  const [demoIndex, setDemoIndex] = useState(0);
  const [demoIsAll, setDemoIsAll] = useState(false);
  const [demoIndexB, setDemoIndexB] = useState(0);
  const [demoIsAllB, setDemoIsAllB] = useState(false);

  return (
    <div className="min-h-screen overflow-y-auto px-8 py-12 text-foreground">
      <div className="mx-auto max-w-4xl" style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>

        {/* ── Page header ── */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">LoopNode Anatomy</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground-muted">
            LoopNode is a resizable container with a header bar, a dashed body frame for child nodes,
            and four corner adornment slots. It exposes four handles — two outer edge handles for the
            process flow and two inner handles for the loop body.
          </p>
        </div>

        <div className="h-px bg-border" />

        {/* ── Container Structure ── */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <h2 className="text-base font-semibold">Container Structure</h2>
            <p className="mt-1 text-sm text-foreground-muted">
              Three layers compose the loop container. The header's negative bottom margin creates a
              flush visual join between the header and the body frame.
            </p>
          </div>

          {/* Loop node mock */}
          <div className="rounded-xl border border-border bg-surface p-8">
            <div className="mx-auto" style={{ maxWidth: 480 }}>
              <div className="relative border border-border bg-transparent" style={{ borderRadius: 20 }}>
                <div
                  className="flex items-center justify-between gap-2 bg-surface-overlay px-3.5 py-2.5"
                  style={{ borderRadius: '18px 18px 0 0', marginBottom: -10 }}
                >
                  <div className="flex items-center gap-2">
                    <CanvasIcon icon="repeat" size={16} />
                    <span className="text-sm font-semibold">For Each claim</span>
                  </div>
                  <span className="flex h-6 items-center gap-1 rounded-full border border-border bg-surface px-2.5 text-[11px] font-semibold">
                    <CanvasIcon icon="align-justify" size={11} />
                    Sequential
                  </span>
                </div>
                <div className="m-2.5 mt-4 flex items-center justify-center rounded-xl border-[1.5px] border-dashed border-border" style={{ height: 72 }}>
                  <span className="text-xs text-foreground-muted">child nodes</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Outer container', token: 'rounded-[20px] border', desc: 'Receives hover, selected, and drag states via outline and shadow overrides.' },
              { label: 'Header', token: 'bg-surface-overlay -mb-2.5', desc: 'Negative bottom margin creates the overlap with the body frame.' },
              { label: 'Body frame', token: 'border-dashed rounded-xl m-2.5', desc: 'Child nodes live inside here. Drives minimum container resize calculations.' },
            ].map(({ label, token, desc }) => (
              <div key={label} className="rounded-lg border border-border bg-surface p-4" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div className="text-sm font-semibold">{label}</div>
                <code className="break-all rounded bg-surface-overlay px-1.5 py-0.5 font-mono text-[10px] text-foreground-muted">{token}</code>
                <div className="text-[11px] leading-tight text-foreground-muted">{desc}</div>
              </div>
            ))}
          </div>
        </section>

        <div className="h-px bg-border" />

        {/* ── Adornment Slots ── */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <h2 className="text-base font-semibold">Adornment Slots</h2>
            <p className="mt-1 text-sm text-foreground-muted">
              Four 20×20 px slots at each corner of the outer container. Slots are only visible
              when execution, debug, or validation state is active — they are hidden at rest.
            </p>
          </div>

          {/* Diagram */}
          <div className="flex justify-center rounded-xl border border-border bg-surface px-12 py-10">
            <div className="flex items-center gap-10">

              {/* Left labels — topLeft, bottomLeft */}
              <div className="flex flex-col gap-10">
                {LOOP_SLOT_DOCS.filter((_, i) => i % 2 === 0).map(({ slot, dot, rule }) => (
                  <div key={slot} className="flex items-center justify-end gap-2.5">
                    <div className="text-right">
                      <div className="font-mono text-xs font-semibold">{slot}</div>
                      <div className="text-[11px] text-foreground-muted">{rule}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-px w-6 bg-border" />
                      <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} />
                    </div>
                  </div>
                ))}
              </div>

              {/* LoopNode mock */}
              <div className="relative shrink-0" style={{ width: 280, height: 110 }}>
                <div className="absolute inset-0 border border-border bg-transparent" style={{ borderRadius: 20 }}>
                  <div
                    className="flex items-center gap-2 bg-surface-overlay px-3.5"
                    style={{ borderRadius: '18px 18px 0 0', marginBottom: -10, paddingTop: 8, paddingBottom: 8 }}
                  >
                    <CanvasIcon icon="repeat" size={13} />
                    <span className="text-[11px] font-semibold">For Each item</span>
                  </div>
                  <div className="mx-2.5 mt-4 rounded-xl border border-dashed border-border" style={{ height: 44 }} />
                </div>
                {/* Corner slot indicators */}
                <div className={`absolute rounded-full ${LOOP_SLOT_DOCS[0].dot}`} style={{ top: 6, left: 6, width: 14, height: 14 }} />
                <div className={`absolute rounded-full ${LOOP_SLOT_DOCS[1].dot}`} style={{ top: 6, right: 6, width: 14, height: 14 }} />
                <div className={`absolute rounded-full ${LOOP_SLOT_DOCS[2].dot}`} style={{ bottom: 6, left: 6, width: 14, height: 14 }} />
                <div className={`absolute rounded-full ${LOOP_SLOT_DOCS[3].dot}`} style={{ bottom: 6, right: 6, width: 14, height: 14 }} />
              </div>

              {/* Right labels — topRight, bottomRight */}
              <div className="flex flex-col gap-10">
                {LOOP_SLOT_DOCS.filter((_, i) => i % 2 !== 0).map(({ slot, dot, rule }) => (
                  <div key={slot} className="flex items-center gap-2.5">
                    <div className="flex items-center gap-1">
                      <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} />
                      <div className="h-px w-6 bg-border" />
                    </div>
                    <div>
                      <div className="font-mono text-xs font-semibold">{slot}</div>
                      <div className="text-[11px] text-foreground-muted">{rule}</div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-overlay">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">Slot</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">Priority chain</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">Notes</th>
                </tr>
              </thead>
              <tbody>
                {LOOP_SLOT_DOCS.map(({ slot, dot, rule, detail }, i) => (
                  <tr key={slot} className={i < LOOP_SLOT_DOCS.length - 1 ? 'border-b border-border' : ''}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
                        <code className="font-mono text-xs font-semibold">{slot}</code>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-foreground">{rule}</td>
                    <td className="px-4 py-3 text-xs text-foreground-muted">{detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="h-px bg-border" />

        {/* ── Handles ── */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <h2 className="text-base font-semibold">Handles</h2>
            <p className="mt-1 text-sm text-foreground-muted">
              Two outer handles carry the main process flow; two inner handles define the loop body
              entry and continuation points.
            </p>
          </div>
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-overlay">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">Handle ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">Position</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">Boundary</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">Description</th>
                </tr>
              </thead>
              <tbody>
                {LOOP_HANDLE_DOCS.map(({ handle, side, boundary, description }, i) => (
                  <tr key={handle} className={i < LOOP_HANDLE_DOCS.length - 1 ? 'border-b border-border' : ''}>
                    <td className="px-4 py-3">
                      <code className="font-mono text-xs font-semibold">{handle}</code>
                    </td>
                    <td className="px-4 py-3 text-xs text-foreground">{side}</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'rounded px-1.5 py-0.5 font-mono text-[11px]',
                        boundary === 'outer' ? 'bg-amber-500/10 text-amber-600' : 'bg-blue-500/10 text-blue-600'
                      )}>
                        {boundary}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-foreground-muted">{description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="h-px bg-border" />

        {/* ── V2 Iterations ── */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div>
            <h2 className="text-base font-semibold">V2 Iterations</h2>
            <p className="mt-1 text-sm text-foreground-muted">
              Improvements introduced in the V2 prototype. All changes are scoped to LoopNode V2
              only — the original LoopNode story is unaffected.
            </p>
          </div>

          {/* Subsection: Execution Count */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3 className="text-sm font-semibold">Execution Count</h3>
            <p className="text-sm text-foreground-muted">
              How many times the loop body has run. This count surfaces in two places at once —
              as the denominator in the iteration picker on the loop itself, and as a{' '}
              <code className="rounded bg-surface-overlay px-1 font-mono text-xs">↻ N</code>{' '}
              badge on each child node inside the loop.
            </p>

            <div className="rounded-xl border border-border bg-surface p-6">
              <div className="grid grid-cols-2 gap-8">

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">Loop — iteration picker</div>
                  <div className="flex h-6 w-fit items-center gap-0.5 rounded-full border border-border bg-surface-overlay px-2.5 text-[11px] font-semibold shadow-sm">
                    <span className="opacity-50">2 /</span>
                    <span className="text-foreground"> 5</span>
                  </div>
                  <p className="text-xs leading-relaxed text-foreground-muted">
                    The denominator <strong className="text-foreground">5</strong> is the loop's
                    execution count — how many iterations have been run or are planned for this run.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">Child node — loop count badge</div>
                  <div
                    className="flex w-fit items-center gap-0.5 rounded-full border border-border bg-surface-overlay px-1.5 shadow-sm"
                    style={{ height: 16 }}
                  >
                    <CanvasIcon icon="repeat-2" size={10} color="var(--color-foreground-emp)" />
                    <span className="text-[10px] font-semibold leading-none" style={{ color: 'var(--color-foreground-emp)' }}>5</span>
                  </div>
                  <p className="text-xs leading-relaxed text-foreground-muted">
                    Each child node shows the same count in its{' '}
                    <code className="rounded bg-surface-overlay px-1 font-mono text-[10px]">bottomRight</code>{' '}
                    adornment slot. When the loop finishes, both numbers match.
                  </p>
                </div>

              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-overlay">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">Property</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">Location</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">Meaning</th>
                  </tr>
                </thead>
                <tbody>
                  {([
                    { prop: 'total (N)',      loc: 'Picker denominator',    meaning: 'Total iterations the loop will run. Provided by the execution runtime.' },
                    { prop: 'activeIndex (k)', loc: 'Picker numerator',     meaning: 'The iteration currently being viewed, 1-based (displayed as k = activeIndex + 1).' },
                    { prop: 'count',          loc: 'Child node ↻ N badge',  meaning: 'How many times this child node has executed so far. Equals total when the loop completes.' },
                  ] as const).map(({ prop, loc, meaning }, i, arr) => (
                    <tr key={prop} className={i < arr.length - 1 ? 'border-b border-border' : ''}>
                      <td className="px-4 py-3"><code className="font-mono text-xs font-semibold">{prop}</code></td>
                      <td className="px-4 py-3 text-xs text-foreground">{loc}</td>
                      <td className="px-4 py-3 text-xs text-foreground-muted">{meaning}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Side-by-side comparison */}
          <div className="grid grid-cols-2 gap-6">

            {/* Column A */}
            <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-6">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">Option A</h3>
                  </div>
                <p className="text-xs leading-relaxed text-foreground-muted">
                  "All" as a separate chip alongside a compound picker with first / prev / next /
                  last buttons. All controls visible at all times.
                </p>
              </div>
              <div className="flex flex-1 items-center justify-center rounded-lg border border-border bg-surface-overlay py-6">
                <IterationNavigatorV2
                  state={{
                    activeIndex: demoIndex,
                    total: DEMO_TOTAL,
                    onActiveIndexChange: (i) => { setDemoIsAll(false); setDemoIndex(i); },
                    isAll: demoIsAll,
                    onAllChange: setDemoIsAll,
                    iterationStatuses: DEMO_ITERATION_STATUSES,
                  }}
                />
              </div>
              <p className="text-[11px] leading-relaxed text-foreground-muted">
                <strong className="text-foreground">Compound Picker</strong> — separate chip
                for All, four navigation buttons, click-to-type fraction.
              </p>
            </div>

            {/* Column B */}
            <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-6">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">Option B</h3>
                  </div>
                <p className="text-xs leading-relaxed text-foreground-muted">
                  "All" becomes the left segment of a single pill. First and last jump buttons
                  removed — click-to-type handles large jumps.
                </p>
              </div>
              <div className="flex flex-1 items-center justify-center rounded-lg border border-border bg-surface-overlay py-6">
                <IterationNavigatorPill
                  state={{
                    activeIndex: demoIndexB,
                    total: DEMO_TOTAL,
                    onActiveIndexChange: (i) => { setDemoIsAllB(false); setDemoIndexB(i); },
                    isAll: demoIsAllB,
                    onAllChange: setDemoIsAllB,
                    iterationStatuses: DEMO_ITERATION_STATUSES,
                  }}
                />
              </div>
              <p className="text-[11px] leading-relaxed text-foreground-muted">
                <strong className="text-foreground">Unified Segmented Pill</strong> — one
                cohesive control, lower visual weight, All integrated as a segment.
              </p>
            </div>

          </div>

          {/* Tradeoff comparison table — full width */}
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-overlay">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">Aspect</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">Option A</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">Option B</th>
                </tr>
              </thead>
              <tbody>
                {([
                  { aspect: '"All" placement',   a: 'Separate chip',             b: 'Left segment of pill' },
                  { aspect: 'First / last jump', a: '|◄ and ►| buttons',         b: 'Removed — use click-to-type' },
                  { aspect: 'Element count',     a: '3 elements + ⊕',            b: '1 pill + ⊕' },
                  { aspect: 'Discoverability',   a: 'High — all controls shown', b: 'Medium — no first/last shortcut' },
                  { aspect: 'Visual weight',     a: 'Higher',                    b: 'Lower' },
                ] as const).map(({ aspect, a, b }, i, arr) => (
                  <tr key={aspect} className={i < arr.length - 1 ? 'border-b border-border' : ''}>
                    <td className="px-4 py-3 text-xs font-medium text-foreground">{aspect}</td>
                    <td className="px-4 py-3 text-xs text-foreground-muted">{a}</td>
                    <td className="px-4 py-3 text-xs text-foreground-muted">{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Option A control reference */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h3 className="text-sm font-semibold">Option A — Control Reference</h3>
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-overlay">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">Control</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">Label</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">Behaviour</th>
                  </tr>
                </thead>
                <tbody>
                  {PICKER_DOCS.map(({ ctrl, label, desc }, i) => (
                    <tr key={ctrl} className={i < PICKER_DOCS.length - 1 ? 'border-b border-border' : ''}>
                      <td className="px-4 py-3"><code className="font-mono text-xs font-semibold">{ctrl}</code></td>
                      <td className="px-4 py-3 text-xs font-medium text-foreground">{label}</td>
                      <td className="px-4 py-3 text-xs text-foreground-muted">{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </section>

      </div>
    </div>
  );
}

// ============================================================================
// V2: Compound Iteration Picker + "All" aggregate toggle
// Lives entirely in this story file — no shared component changes.
// LoopNode is rendered with iterationState={undefined} (native nav hidden)
// and the V2 nav is overlaid absolutely into the header area.
// ============================================================================

interface LoopIterationStateV2 {
  activeIndex: number;
  total: number;
  onActiveIndexChange?: (nextIndex: number) => void;
  disabled?: boolean;
  isAll: boolean;
  onAllChange: (isAll: boolean) => void;
  iterationStatuses?: Map<number, string>;
  overallStatus?: ElementStatusValues;
}

function stopV2Event(e: React.SyntheticEvent) {
  e.stopPropagation();
}

function V2NavButton({
  onClick,
  disabled,
  ariaLabel,
  children,
}: {
  onClick: (e: React.MouseEvent) => void;
  disabled: boolean;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={cn(
        'nodrag nopan inline-flex h-4 w-4 items-center justify-center rounded-full',
        'text-foreground transition-opacity',
        disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer opacity-100'
      )}
      disabled={disabled}
      aria-label={ariaLabel}
      onClick={onClick}
      onPointerDown={stopV2Event}
      onMouseDown={stopV2Event}
    >
      {children}
    </button>
  );
}

function getIterationStatusColor(status: string | undefined): string {
  switch (status) {
    case 'Completed':  return '#22c55e';
    case 'Failed':     return '#ef4444';
    case 'InProgress': return '#f59e0b';
    case 'Paused':     return '#a855f7';
    case 'Cancelled':  return '#94a3b8';
    default:           return 'currentColor';
  }
}

function IterationNavigatorV2({ state }: { state: LoopIterationStateV2 }) {
  const { activeIndex, total, onActiveIndexChange, disabled, isAll, onAllChange, iterationStatuses, overallStatus } = state;
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const canInteract = !disabled && typeof onActiveIndexChange === 'function';
  const visibleIndex = activeIndex + 1;

  const clampToRange = (v: number) => Math.max(1, Math.min(total, v));

  // Derived status info from per-iteration status map
  const currentStatus = iterationStatuses?.get(activeIndex);
  const firstFailedIndex = iterationStatuses
    ? [...iterationStatuses.entries()].find(([, s]) => s === 'Failed')?.[0]
    : undefined;
  const completedCount = iterationStatuses
    ? [...iterationStatuses.values()].filter(s => s === 'Completed').length
    : undefined;
  const failedCount = iterationStatuses
    ? [...iterationStatuses.values()].filter(s => s === 'Failed').length
    : 0;

  const handleFirst = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canInteract && !isAll) onActiveIndexChange?.(0);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canInteract && !isAll && activeIndex > 0) onActiveIndexChange?.(activeIndex - 1);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canInteract && !isAll && activeIndex < total - 1) onActiveIndexChange?.(activeIndex + 1);
  };

  const handleLast = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canInteract && !isAll) onActiveIndexChange?.(total - 1);
  };

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canInteract || isAll || isEditing) return;
    setInputValue(String(visibleIndex));
    setIsEditing(true);
    requestAnimationFrame(() => {
      inputRef.current?.select();
    });
  };

  const commitEdit = () => {
    const parsed = parseInt(inputValue, 10);
    if (!Number.isNaN(parsed)) {
      onActiveIndexChange?.(clampToRange(parsed) - 1);
    }
    setIsEditing(false);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.key === 'Enter') commitEdit();
    if (e.key === 'Escape') setIsEditing(false);
  };

  const toggleAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAllChange(!isAll);
  };

  const handleJumpToFailed = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (firstFailedIndex !== undefined) onActiveIndexChange?.(firstFailedIndex);
  };

  const canGoFirst = canInteract && !isAll && activeIndex > 0;
  const canGoPrev = canInteract && !isAll && activeIndex > 0;
  const canGoNext = canInteract && !isAll && activeIndex < total - 1;
  const canGoLast = canInteract && !isAll && activeIndex < total - 1;

  return (
    <div
      className="nodrag nopan pointer-events-auto flex items-center gap-1.5"
      onPointerDown={stopV2Event}
      onMouseDown={stopV2Event}
      onDoubleClick={stopV2Event}
    >
      {/* All toggle chip */}
      <button
        type="button"
        onClick={toggleAll}
        onPointerDown={stopV2Event}
        onMouseDown={stopV2Event}
        aria-pressed={isAll}
        aria-label="Show aggregate across all iterations"
        className={cn(
          'nodrag nopan h-6 rounded-full border px-2.5 text-[11px] font-semibold leading-4 transition-colors',
          isAll
            ? 'border-foreground-accent bg-foreground-accent/15 text-foreground-accent'
            : 'border-border bg-surface text-foreground shadow-sm'
        )}
      >
        All
      </button>

      {isAll ? (
        /* Aggregate badge — clickable to exit All mode */
        <button
          type="button"
          className="nodrag nopan flex h-6 cursor-pointer items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 text-[11px] font-semibold leading-4 text-foreground shadow-sm transition-colors hover:border-foreground-accent/50"
          onClick={toggleAll}
          onPointerDown={stopV2Event}
          onMouseDown={stopV2Event}
          aria-label="Return to individual iteration view"
          title="Click to return to individual iteration view"
        >
          {completedCount !== undefined ? (
            <>
              <span style={{ color: getIterationStatusColor('Completed') }}>✓ {completedCount}</span>
              {failedCount > 0 && (
                <span style={{ color: getIterationStatusColor('Failed') }}>✗ {failedCount}</span>
              )}
            </>
          ) : (
            <>
              <span aria-hidden className="opacity-60">Σ</span>
              <span>{total}</span>
            </>
          )}
        </button>
      ) : (
        /* Compound picker: |◄ ◄ [index/total] ► ►| */
        <fieldset
          className="nodrag nopan m-0 flex h-6 min-w-0 shrink-0 items-center rounded-full border border-border bg-surface px-1 py-0 text-foreground shadow-sm"
          onPointerDown={stopV2Event}
          onMouseDown={stopV2Event}
          onDoubleClick={stopV2Event}
        >
          <legend className="sr-only">
            Iteration {visibleIndex} of {total}
          </legend>

          <V2NavButton onClick={handleFirst} disabled={!canGoFirst} ariaLabel="First iteration">
            <CanvasIcon icon="chevrons-left" size={12} />
          </V2NavButton>
          <V2NavButton onClick={handlePrev} disabled={!canGoPrev} ariaLabel="Previous iteration">
            <CanvasIcon icon="chevron-left" size={12} />
          </V2NavButton>

          {/* Editable fraction with status dot — click index number to jump to a specific iteration */}
          <span
            className={cn(
              'flex min-w-10 select-none items-center justify-center gap-0.5 px-1 text-[11px] font-semibold leading-4',
              canInteract && !isEditing && 'cursor-pointer hover:text-foreground-accent'
            )}
            onClick={startEdit}
            title={canInteract ? 'Click to jump to a specific iteration' : undefined}
          >
            {isEditing ? (
              <>
                <input
                  ref={inputRef}
                  type="number"
                  min={1}
                  max={total}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={handleInputKeyDown}
                  onPointerDown={stopV2Event}
                  className="w-7 appearance-none bg-transparent text-center text-[11px] font-semibold leading-4 outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none border-b border-foreground-accent"
                />
                <span className="px-0.5 opacity-60">/</span>
                <span>{total}</span>
              </>
            ) : (
              <>
                {currentStatus && (
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: getIterationStatusColor(currentStatus) }}
                  />
                )}
                <span>{visibleIndex}</span>
                <span className="px-0.5 opacity-60">/</span>
                <span>{total}</span>
              </>
            )}
          </span>

          <V2NavButton onClick={handleNext} disabled={!canGoNext} ariaLabel="Next iteration">
            <CanvasIcon icon="chevron-right" size={12} />
          </V2NavButton>
          <V2NavButton onClick={handleLast} disabled={!canGoLast} ariaLabel="Last iteration">
            <CanvasIcon icon="chevrons-right" size={12} />
          </V2NavButton>
        </fieldset>
      )}

      {/* Jump-to-failed — hidden when the loop itself is already in Failed state (adornment covers it) */}
      {firstFailedIndex !== undefined && !isAll && canInteract && overallStatus !== ElementStatusValues.Failed && (
        <button
          type="button"
          className="nodrag nopan inline-flex h-6 w-6 items-center justify-center rounded-full border border-border bg-surface shadow-sm transition-colors hover:border-red-400"
          onClick={handleJumpToFailed}
          onPointerDown={stopV2Event}
          onMouseDown={stopV2Event}
          aria-label="Jump to first failed iteration"
          title={`Jump to iteration ${firstFailedIndex + 1} (failed)`}
        >
          <CanvasIcon icon="crosshair" size={12} color={getIterationStatusColor('Failed')} />
        </button>
      )}
    </div>
  );
}

// ============================================================================
// Option B: Unified Segmented Pill
// All is the leftmost segment inside a single pill — no first/last jump buttons.
// Click-to-type on the fraction handles large jumps.
// ============================================================================

function IterationNavigatorPill({ state }: { state: LoopIterationStateV2 }) {
  const { activeIndex, total, onActiveIndexChange, disabled, isAll, onAllChange, iterationStatuses, overallStatus } = state;
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const canInteract = !disabled && typeof onActiveIndexChange === 'function';
  const visibleIndex = activeIndex + 1;
  const clampToRange = (v: number) => Math.max(1, Math.min(total, v));

  const currentStatus = iterationStatuses?.get(activeIndex);
  const firstFailedIndex = iterationStatuses
    ? [...iterationStatuses.entries()].find(([, s]) => s === 'Failed')?.[0]
    : undefined;
  const completedCount = iterationStatuses
    ? [...iterationStatuses.values()].filter(s => s === 'Completed').length
    : undefined;
  const failedCount = iterationStatuses
    ? [...iterationStatuses.values()].filter(s => s === 'Failed').length
    : 0;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canInteract && !isAll && activeIndex > 0) onActiveIndexChange?.(activeIndex - 1);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canInteract && !isAll && activeIndex < total - 1) onActiveIndexChange?.(activeIndex + 1);
  };

  const toggleAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAllChange(!isAll);
  };

  const handleJumpToFailed = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (firstFailedIndex !== undefined) onActiveIndexChange?.(firstFailedIndex);
  };

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canInteract || isAll || isEditing) return;
    setInputValue(String(visibleIndex));
    setIsEditing(true);
    requestAnimationFrame(() => inputRef.current?.select());
  };

  const commitEdit = () => {
    const parsed = parseInt(inputValue, 10);
    if (!Number.isNaN(parsed)) onActiveIndexChange?.(clampToRange(parsed) - 1);
    setIsEditing(false);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.key === 'Enter') commitEdit();
    if (e.key === 'Escape') setIsEditing(false);
  };

  const canGoPrev = canInteract && !isAll && activeIndex > 0;
  const canGoNext = canInteract && !isAll && activeIndex < total - 1;

  return (
    <div
      className="nodrag nopan pointer-events-auto flex items-center gap-1.5"
      onPointerDown={stopV2Event}
      onMouseDown={stopV2Event}
      onDoubleClick={stopV2Event}
    >
      {/* Single unified pill */}
      <div className="nodrag nopan flex h-6 items-stretch overflow-hidden rounded-full border border-border bg-surface shadow-sm">

        {/* Left segment — All toggle */}
        <button
          type="button"
          onClick={toggleAll}
          onPointerDown={stopV2Event}
          onMouseDown={stopV2Event}
          aria-pressed={isAll}
          aria-label="Show aggregate across all iterations"
          className={cn(
            'nodrag nopan select-none px-2.5 text-[11px] font-semibold leading-none transition-colors',
            isAll
              ? 'bg-foreground-accent/15 text-foreground-accent'
              : 'text-foreground hover:bg-surface-overlay'
          )}
        >
          All
        </button>

        {/* Divider */}
        <div className="w-px shrink-0 bg-border" />

        {/* Right segment — aggregate or navigation */}
        {isAll ? (
          <button
            type="button"
            onClick={toggleAll}
            onPointerDown={stopV2Event}
            onMouseDown={stopV2Event}
            className="nodrag nopan flex items-center gap-1.5 px-2.5 text-[11px] font-semibold leading-none transition-colors hover:bg-surface-overlay"
            aria-label="Return to individual iteration view"
            title="Click to return to individual iteration view"
          >
            {completedCount !== undefined ? (
              <>
                <span style={{ color: getIterationStatusColor('Completed') }}>✓ {completedCount}</span>
                {failedCount > 0 && (
                  <span style={{ color: getIterationStatusColor('Failed') }}>✗ {failedCount}</span>
                )}
              </>
            ) : (
              <>
                <span aria-hidden className="opacity-60">Σ</span>
                <span>{total}</span>
              </>
            )}
          </button>
        ) : (
          <div className="flex items-stretch">
            {/* Prev */}
            <button
              type="button"
              className={cn(
                'nodrag nopan flex w-5 items-center justify-center text-foreground transition-opacity',
                !canGoPrev ? 'cursor-not-allowed opacity-40' : 'cursor-pointer hover:bg-surface-overlay'
              )}
              disabled={!canGoPrev}
              aria-label="Previous iteration"
              onClick={handlePrev}
              onPointerDown={stopV2Event}
              onMouseDown={stopV2Event}
            >
              <CanvasIcon icon="chevron-left" size={12} />
            </button>

            {/* Editable fraction with status dot */}
            <span
              className={cn(
                'flex min-w-10 select-none items-center justify-center gap-0.5 px-1 text-[11px] font-semibold leading-none',
                canInteract && !isEditing && 'cursor-pointer hover:text-foreground-accent'
              )}
              onClick={startEdit}
              title={canInteract ? 'Click to jump to a specific iteration' : undefined}
            >
              {isEditing ? (
                <>
                  <input
                    ref={inputRef}
                    type="number"
                    min={1}
                    max={total}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={handleInputKeyDown}
                    onPointerDown={stopV2Event}
                    className="w-7 appearance-none bg-transparent text-center text-[11px] font-semibold leading-none outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none border-b border-foreground-accent"
                  />
                  <span className="px-0.5 opacity-60">/</span>
                  <span>{total}</span>
                </>
              ) : (
                <>
                  {currentStatus && (
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: getIterationStatusColor(currentStatus) }}
                    />
                  )}
                  <span>{visibleIndex}</span>
                  <span className="px-0.5 opacity-60">/</span>
                  <span>{total}</span>
                </>
              )}
            </span>

            {/* Next */}
            <button
              type="button"
              className={cn(
                'nodrag nopan flex w-5 items-center justify-center text-foreground transition-opacity',
                !canGoNext ? 'cursor-not-allowed opacity-40' : 'cursor-pointer hover:bg-surface-overlay'
              )}
              disabled={!canGoNext}
              aria-label="Next iteration"
              onClick={handleNext}
              onPointerDown={stopV2Event}
              onMouseDown={stopV2Event}
            >
              <CanvasIcon icon="chevron-right" size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Jump-to-failed shortcut — hidden when loop is globally Failed */}
      {firstFailedIndex !== undefined && !isAll && canInteract && overallStatus !== ElementStatusValues.Failed && (
        <button
          type="button"
          className="nodrag nopan inline-flex h-6 w-6 items-center justify-center rounded-full border border-border bg-surface shadow-sm transition-colors hover:border-red-400"
          onClick={handleJumpToFailed}
          onPointerDown={stopV2Event}
          onMouseDown={stopV2Event}
          aria-label="Jump to first failed iteration"
          title={`Jump to iteration ${firstFailedIndex + 1} (failed)`}
        >
          <CanvasIcon icon="crosshair" size={12} color={getIterationStatusColor('Failed')} />
        </button>
      )}
    </div>
  );
}

type LoopExecutionNodeDataV2 = LoopNodeData & {
  initialIndex: number;
  total: number;
  interactive?: boolean;
  iterationStatuses?: Map<number, string>;
  status?: ElementStatusValues;
};

// Realistic per-iteration status data for each V2 execution demo node
const LOOP_EXECUTION_ITERATION_STATUSES = new Map<string, Map<number, string>>([
  ['loop-completed',  new Map<number, string>([[0, 'Completed'], [1, 'Completed'], [2, 'Completed']])],
  ['loop-running',    new Map<number, string>([[0, 'Completed'], [1, 'InProgress']])],
  ['loop-paused',     new Map<number, string>([[0, 'Completed'], [1, 'Paused']])],
  ['loop-failed',     new Map<number, string>([[0, 'Completed'], [1, 'Completed'], [2, 'Failed']])],
  ['loop-cancelled',  new Map<number, string>([[0, 'Completed'], [1, 'Completed'], [2, 'Cancelled']])],
  ['loop-parallel',   new Map<number, string>([[0, 'Completed'], [1, 'Completed'], [2, 'Completed']])],
  ['loop-label-only', new Map<number, string>([[0, 'Completed'], [1, 'Completed'], [2, 'Completed']])],
  ['loop-clamped',    new Map<number, string>([[0, 'Completed'], [1, 'Completed'], [2, 'Completed']])],
]);

function createExecutionStateGridV2(): Node<LoopExecutionNodeDataV2>[] {
  return LOOP_EXECUTION_CASES.map(({ id, label, initialIndex, total, parallel, interactive, status }, index) => {
    const colIndex = index % 2;
    const rowIndex = Math.floor(index / 2);
    return {
      id,
      type: LOOP_TYPE,
      position: {
        x: LOOP_EXECUTION_GRID.startX + colIndex * LOOP_EXECUTION_GRID.gapX,
        y: LOOP_EXECUTION_GRID.startY + rowIndex * LOOP_EXECUTION_GRID.gapY,
      },
      data: {
        display: { label, shape: 'container' },
        parallel,
        initialIndex,
        total,
        interactive,
        iterationStatuses: LOOP_EXECUTION_ITERATION_STATUSES.get(id),
        status,
      },
      style: LOOP_EXECUTION_SIZE,
    };
  });
}

// V2 HEADER_OVERLAY_TOP: aligns with header's pt-2.5 (10px) to vertically center in the h-6 content row
// V2 HEADER_OVERLAY_RIGHT: clears the Sequential/Parallel badge (~105px) + gap-2 (8px) + px-3.5 (14px)
const V2_OVERLAY_TOP = 10;
const V2_OVERLAY_RIGHT = 130;

function LoopExecutionCanvasNodeV2(props: NodeProps<Node<LoopExecutionNodeDataV2>>) {
  const { data } = props;
  const [activeIndex, setActiveIndex] = useState(
    Math.max(0, Math.min(data.total - 1, data.initialIndex))
  );
  const [isAll, setIsAll] = useState(false);

  useEffect(() => {
    setActiveIndex(Math.max(0, Math.min(data.total - 1, data.initialIndex)));
    setIsAll(false);
  }, [data.initialIndex, data.total]);

  const iterationState: LoopIterationStateV2 = {
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
    overallStatus: data.status,
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Render LoopNode without its native iterator — we overlay V2 nav instead */}
      <LoopNode {...props} iterationState={undefined} />
      <div
        style={{
          position: 'absolute',
          top: V2_OVERLAY_TOP,
          right: V2_OVERLAY_RIGHT,
          zIndex: 10,
        }}
      >
        <IterationNavigatorV2 state={iterationState} />
      </div>
    </div>
  );
}

const LOOP_EXECUTION_NODE_TYPES_V2 = {
  [LOOP_TYPE]: LoopExecutionCanvasNodeV2,
};

function ExecutionStatesV2Story() {
  const initialNodes = useMemo(() => createExecutionStateGridV2(), []);
  const { canvasProps } = useCanvasStory({
    initialNodes,
    additionalNodeTypes: LOOP_EXECUTION_NODE_TYPES_V2,
  });

  return (
    <BaseCanvas {...canvasProps} mode="design">
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
      <StoryInfoPanel
        title="Loop Execution States V2"
        description="Compound picker with per-iteration status dots (●), richer All aggregate (✓ / ✗), and jump-to-failed shortcut (crosshair) — hidden when the loop itself is already in a Failed state."
      />
    </BaseCanvas>
  );
}

export const Anatomy: Story = {
  name: 'Anatomy',
  render: () => <AnatomyStory />,
};

export const Default: Story = {
  render: () => <DefaultStory />,
};

export const NestedOuterOutputInsert: Story = {
  render: () => <NestedOuterOutputInsertStory />,
};

export const NestedOuterOutputAppend: Story = {
  render: () => <NestedOuterOutputAppendStory />,
};

export const ExecutionStates: Story = {
  decorators: [
    withCanvasProviders({
      executionState: {
        getNodeExecutionState: (nodeId: string) => LOOP_EXECUTION_STATUS.get(nodeId),
        getEdgeExecutionState: () => undefined,
      },
      validationState: {
        getElementValidationState: () => undefined,
      },
    }),
  ],
  render: () => <ExecutionStatesStory />,
};

export const ExecutionStatesV2: Story = {
  name: 'Execution States V2 — Compound Picker',
  decorators: [
    withCanvasProviders({
      executionState: {
        getNodeExecutionState: (nodeId: string) => LOOP_EXECUTION_STATUS.get(nodeId),
        getEdgeExecutionState: () => undefined,
      },
      validationState: {
        getElementValidationState: () => undefined,
      },
    }),
  ],
  render: () => <ExecutionStatesV2Story />,
};
