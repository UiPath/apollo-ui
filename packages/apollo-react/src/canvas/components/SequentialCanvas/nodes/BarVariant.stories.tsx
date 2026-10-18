/**
 * Card vs Bar: the same manifest node rendered as a flow card and as a sequential
 * bar, side by side, so shape mapping and state parity can be checked at a glance.
 */

import type { Meta, StoryObj } from '@storybook/react';
import type { Edge, Node, NodeProps, NodeTypes } from '@uipath/apollo-react/canvas/xyflow/react';
import { useMemo } from 'react';
import { SEQ_BAR_HEIGHT, SEQ_BAR_WIDTH } from '../../../constants';
import { NodeRegistryProvider } from '../../../core';
import {
  type ExecutionStateContextValue,
  ExecutionStatusContext,
  type ValidationStateContextValue,
  ValidationStatusContext,
} from '../../../hooks';
import type { NodeManifest, NodeShape } from '../../../schema';
import {
  createNode,
  defaultWorkflowManifest,
  StoryInfoPanel,
  useCanvasStory,
  withCanvasProviders,
} from '../../../storybook-utils';
import {
  SequentialCanvasStoryHarness,
  sequentialWireframeManifests,
} from '../../../storybook-utils/sequential';
import type { SuggestionType } from '../../../types';
import { ValidationErrorSeverity } from '../../../types/validation';
import { CanvasIcon } from '../../../utils/icon-registry';
import { BaseCanvas } from '../../BaseCanvas';
import { BaseNode } from '../../BaseNode/BaseNode';
import type { BaseNodeData } from '../../BaseNode/BaseNode.types';
import type { BaseNodeBarAttachment } from '../../BaseNode/BaseNodeBar';
import { BaseNodeBarNode } from '../../BaseNode/BaseNodeBarNode';
import {
  type BaseNodeOverrideConfig,
  BaseNodeOverrideConfigProvider,
} from '../../BaseNode/BaseNodeConfigContext';

const meta: Meta = {
  title: 'Components/Canvas/SequentialCanvas/Card vs Bar',
  parameters: { layout: 'fullscreen' },
  decorators: [withCanvasProviders()],
};

export default meta;
type Story = StoryObj<typeof meta>;

// ---------------------------------------------------------------------------
// Row model: one manifest node, rendered twice (card + bar) with shared state.
// ---------------------------------------------------------------------------

type ExecutionValue = ReturnType<ExecutionStateContextValue['getNodeExecutionState']>;

interface ParityRow {
  key: string;
  caption: string;
  detail?: string;
  /** Manifest node type. */
  type: string;
  display?: { label?: string; subLabel?: string; shape?: NodeShape };
  data?: Partial<BaseNodeData>;
  selected?: boolean;
  dragging?: boolean;
  execution?: ExecutionValue;
  validation?: { status: ValidationErrorSeverity; message: string };
  /** Applied to both renderers through BaseNodeOverrideConfigProvider. */
  override?: BaseNodeOverrideConfig;
  readOnly?: boolean;
  /** Bar chips; the card side gets matching resource nodes wired by artifact edges. */
  attachments?: BaseNodeBarAttachment[];
  /** Vertical room for this row. */
  pitch?: number;
}

const CAPTION_X = 0;
const CARD_X = 260;
const BAR_X = 620;
const DEFAULT_PITCH = 160;
const ID_SEPARATOR = '::';
const CAPTION_NODE_TYPE = 'story::caption';
const BAR_TYPE_PREFIX = 'bar::';

const rowKeyOf = (nodeId: string) => nodeId.split(ID_SEPARATOR)[0] ?? nodeId;

const STORY_MANIFESTS: NodeManifest[] = [
  ...sequentialWireframeManifests,
  {
    nodeType: 'story.drillable-agent',
    version: '1.0.0',
    category: 'agent',
    tags: ['agent'],
    sortOrder: 1,
    drillable: true,
    display: { label: 'Drillable Agent', icon: 'agent', shape: 'square' },
    handleConfiguration: [
      { position: 'left', handles: [{ id: 'input', type: 'target', handleType: 'input' }] },
      { position: 'right', handles: [{ id: 'output', type: 'source', handleType: 'output' }] },
    ],
  },
];

const STORY_MANIFEST = {
  ...defaultWorkflowManifest,
  nodes: [...defaultWorkflowManifest.nodes, ...STORY_MANIFESTS],
};

function toolAttachment(i: number): BaseNodeBarAttachment {
  return {
    id: `tool-${i}`,
    label: `Tool ${i}`,
    icon: <CanvasIcon icon="wrench" size={12} />,
    handleId: 'tools',
  };
}

// ---------------------------------------------------------------------------
// Story-only node components.
// ---------------------------------------------------------------------------

function CaptionNode({ data }: NodeProps<Node<{ caption: string; detail?: string }>>) {
  return (
    <div className="w-[220px] pr-6 text-right">
      <div className="text-sm font-medium text-foreground">{data.caption}</div>
      {data.detail && <div className="text-xs text-muted-foreground">{data.detail}</div>}
    </div>
  );
}

const EMPTY_OVERRIDE: BaseNodeOverrideConfig = {};

function makeCells(rows: ParityRow[]) {
  const rowByKey = new Map(rows.map((row) => [row.key, row]));
  const overrideFor = (id: string) => rowByKey.get(rowKeyOf(id))?.override ?? EMPTY_OVERRIDE;

  function CardCell(props: NodeProps<Node<BaseNodeData>>) {
    return (
      <BaseNodeOverrideConfigProvider value={overrideFor(props.id)}>
        <BaseNode {...props} />
      </BaseNodeOverrideConfigProvider>
    );
  }

  // Bar nodes carry a prefixed xyflow type so one canvas can host both renderers;
  // the manifest type is restored here so presentation resolves like the card.
  const makeBarCell = (manifestType: string) =>
    function BarCell(props: NodeProps<Node<BaseNodeData>>) {
      return (
        <BaseNodeOverrideConfigProvider value={overrideFor(props.id)}>
          <BaseNodeBarNode
            {...props}
            type={manifestType}
            attachments={rowByKey.get(rowKeyOf(props.id))?.attachments}
          />
        </BaseNodeOverrideConfigProvider>
      );
    };

  const barTypes: NodeTypes = {};
  for (const row of rows) {
    barTypes[`${BAR_TYPE_PREFIX}${row.type}`] ??= makeBarCell(row.type);
  }

  return { CardCell, additionalNodeTypes: { ...barTypes, [CAPTION_NODE_TYPE]: CaptionNode } };
}

function buildGraph(rows: ParityRow[]): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let y = 0;
  for (const row of rows) {
    const common = {
      type: row.type,
      display: { label: row.caption, subLabel: row.detail, ...row.display },
      data: row.data,
      selected: row.selected,
    };
    nodes.push({
      id: `${row.key}${ID_SEPARATOR}caption`,
      type: CAPTION_NODE_TYPE,
      position: { x: CAPTION_X, y: y + 16 },
      data: { caption: row.caption, detail: row.detail },
      draggable: false,
      selectable: false,
    });
    const card: Node = {
      ...createNode({ ...common, id: `${row.key}${ID_SEPARATOR}card`, position: { x: CARD_X, y } }),
      dragging: row.dragging,
    };
    const bar: Node = {
      ...createNode({
        ...common,
        id: `${row.key}${ID_SEPARATOR}bar`,
        type: `${BAR_TYPE_PREFIX}${row.type}`,
        position: { x: BAR_X, y },
      }),
      dragging: row.dragging,
      draggable: false,
      // Layout-owned geometry, as SequentialCanvas declares it. Without a declared height
      // the bar reads xyflow's measured 0 on first render and writes it back.
      width: SEQ_BAR_WIDTH,
      height: SEQ_BAR_HEIGHT,
    };
    // createNode stamps nodeType from the xyflow type; the bar must resolve the manifest.
    bar.data = { ...bar.data, nodeType: row.type };
    nodes.push(card, bar);

    row.attachments?.forEach((attachment, i) => {
      const resourceId = `${row.key}${ID_SEPARATOR}res-${i}`;
      nodes.push(
        createNode({
          id: resourceId,
          type: 'uipath.agent.resource.tool',
          position: { x: CARD_X - 40 + i * 72, y: y + 150 },
          display: { label: attachment.label },
        })
      );
      edges.push({
        id: `${row.key}${ID_SEPARATOR}edge-${i}`,
        source: card.id,
        sourceHandle: attachment.handleId ?? 'tools',
        target: resourceId,
        targetHandle: 'input',
      });
    });

    y += row.pitch ?? DEFAULT_PITCH;
  }
  return { nodes, edges };
}

function useRowState(rows: ParityRow[]) {
  return useMemo(() => {
    const rowByKey = new Map(rows.map((row) => [row.key, row]));
    const execution: ExecutionStateContextValue = {
      getNodeExecutionState: (nodeId) => rowByKey.get(rowKeyOf(nodeId))?.execution,
      getEdgeExecutionState: () => undefined,
    };
    const validation: ValidationStateContextValue = {
      getElementValidationState: (elementId) => {
        const row = rowByKey.get(rowKeyOf(elementId));
        if (!row?.validation) return undefined;
        return {
          validationStatus: row.validation.status,
          validationError: {
            code: 'story',
            message: row.validation.message,
            description: row.validation.message,
            severity: row.validation.status,
          },
        };
      },
    };
    return { execution, validation };
  }, [rows]);
}

function ParityCanvas({
  rows,
  title,
  description,
}: {
  rows: ParityRow[];
  title: string;
  description: string;
}) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => buildGraph(rows), [rows]);
  const { CardCell, additionalNodeTypes } = useMemo(() => makeCells(rows), [rows]);
  const { canvasProps } = useCanvasStory({
    initialNodes,
    initialEdges,
    nodeComponent: CardCell,
    additionalNodeTypes,
  });

  return (
    <BaseCanvas
      {...canvasProps}
      mode="design"
      readOnlyNodeIds={readOnlyIds(rows)}
      // Every row stays mounted so the matrix can be inspected without panning.
      onlyRenderVisibleElements={false}
      fitViewOptions={{ padding: 0.1 }}
      panShortcutTeachingUIMessage=""
    >
      <StoryInfoPanel title={title} description={description} collapsible defaultCollapsed />
    </BaseCanvas>
  );
}

function readOnlyIds(rows: ParityRow[]) {
  return rows
    .filter((row) => row.readOnly)
    .flatMap((row) => [`${row.key}${ID_SEPARATOR}card`, `${row.key}${ID_SEPARATOR}bar`]);
}

function ParityStory(props: { rows: ParityRow[]; title: string; description: string }) {
  const { execution, validation } = useRowState(props.rows);
  return (
    <NodeRegistryProvider manifest={STORY_MANIFEST}>
      <ExecutionStatusContext.Provider value={execution}>
        <ValidationStatusContext.Provider value={validation}>
          <ParityCanvas {...props} />
        </ValidationStatusContext.Provider>
      </ExecutionStatusContext.Provider>
    </NodeRegistryProvider>
  );
}

// ---------------------------------------------------------------------------
// Shape mapping
// ---------------------------------------------------------------------------

const SHAPE_ROWS: ParityRow[] = [
  {
    key: 'circle',
    caption: 'Circle',
    detail: 'uipath.manual-trigger',
    type: 'uipath.manual-trigger',
  },
  { key: 'square', caption: 'Square', detail: 'uipath.api-workflow', type: 'uipath.api-workflow' },
  { key: 'rectangle', caption: 'Rectangle', detail: 'uipath.agent', type: 'uipath.agent' },
  {
    key: 'pill',
    caption: 'Pill',
    detail: 'uipath.blank-node, display.shape',
    type: 'uipath.blank-node',
    display: { shape: 'pill' },
  },
  {
    key: 'clipped',
    caption: 'Clipped',
    detail: 'uipath.blank-node, display.shape',
    type: 'uipath.blank-node',
    display: { shape: 'clipped' },
  },
  {
    key: 'document',
    caption: 'Document',
    detail: 'uipath.blank-node, display.shape',
    type: 'uipath.blank-node',
    display: { shape: 'document' },
  },
  {
    key: 'branch',
    caption: 'Square, branch owner',
    detail: 'uipath.control-flow.decision',
    type: 'uipath.control-flow.decision',
  },
  {
    key: 'container',
    caption: 'Container',
    detail: 'uipath.control-flow.foreach',
    type: 'uipath.control-flow.foreach',
    pitch: 320,
  },
];

export const ShapeMapping: Story = {
  name: 'Shape mapping',
  render: () => (
    <ParityStory
      rows={SHAPE_ROWS}
      title="Shape mapping"
      description="Every card shape maps to the same bar: icon left, label, trailing status and kebab. Shape, radius and inner-shape geometry are flow-view only. Containers become a collapsible bar whose body rows indent beneath it in SequentialCanvas."
    />
  ),
};

// ---------------------------------------------------------------------------
// State parity
// ---------------------------------------------------------------------------

const STEP = 'uipath.data.transform';
const noop = () => {};

const suggestionRow = (suggestionType: SuggestionType): ParityRow => ({
  key: `suggestion-${suggestionType}`,
  caption: `Suggestion: ${suggestionType}`,
  detail: 'data.suggestionType',
  type: STEP,
  data: { suggestionType },
});

const STATE_ROWS: ParityRow[] = [
  { key: 'default', caption: 'Default', type: STEP },
  { key: 'selected', caption: 'Selected', detail: 'node.selected', type: STEP, selected: true },
  {
    key: 'disabled',
    caption: 'Disabled',
    detail: 'override.disabled',
    type: STEP,
    override: { disabled: true },
  },
  {
    key: 'loading',
    caption: 'Loading',
    detail: 'data.loading',
    type: STEP,
    data: { loading: true },
  },
  { key: 'dragging', caption: 'Dragging', detail: 'node.dragging', type: STEP, dragging: true },
  { key: 'running', caption: 'Running', detail: 'InProgress', type: STEP, execution: 'InProgress' },
  { key: 'completed', caption: 'Completed', type: STEP, execution: 'Completed' },
  { key: 'failed', caption: 'Failed', type: STEP, execution: 'Failed' },
  {
    key: 'action-needed',
    caption: 'Action needed',
    detail: 'ActionNeeded pill',
    type: STEP,
    execution: 'ActionNeeded',
    override: { onActionNeeded: noop },
  },
  {
    key: 'validation-error',
    caption: 'Validation error',
    type: STEP,
    validation: { status: ValidationErrorSeverity.ERROR, message: 'Input is required' },
  },
  {
    key: 'validation-warning',
    caption: 'Validation warning',
    type: STEP,
    validation: { status: ValidationErrorSeverity.WARNING, message: 'Output is unused' },
  },
  suggestionRow('add'),
  suggestionRow('update'),
  suggestionRow('delete'),
  {
    key: 'collapsed',
    caption: 'Collapsed',
    detail: 'data.isCollapsed',
    type: STEP,
    data: { isCollapsed: true },
  },
  {
    key: 'drillable',
    caption: 'Drillable',
    detail: 'manifest.drillable',
    type: 'story.drillable-agent',
  },
  {
    key: 'breakpoint',
    caption: 'Breakpoint',
    detail: 'adornments.topLeft',
    type: STEP,
    execution: { status: 'None', debug: true },
  },
  {
    key: 'start-point',
    caption: 'Execution start point',
    detail: 'adornments.bottomLeft',
    type: STEP,
    execution: { status: 'None', isExecutionStartPoint: true },
  },
  {
    key: 'custom-badge',
    caption: 'Custom badge',
    detail: 'override.adornments.bottomRight',
    type: STEP,
    override: { adornments: { bottomRight: <CanvasIcon icon="sparkles" size={14} /> } },
  },
  {
    key: 'multi-exec',
    caption: 'Executed 5 times',
    detail: 'execution.count',
    type: STEP,
    execution: { status: 'Completed', count: 5 },
  },
  {
    key: 'footer',
    caption: 'Footer',
    detail: 'override.footerComponent, rectangle card',
    type: STEP,
    // The card footer is a wide-shape feature (AgentNode is its only consumer); a square card
    // wraps its column flex and pushes the footer outside the frame.
    display: { shape: 'rectangle' },
    override: {
      footerVariant: 'single',
      footerComponent: <span className="text-xs text-muted-foreground">Runs nightly at 02:00</span>,
    },
    pitch: 200,
  },
  {
    key: 'placeholder',
    caption: 'Empty label',
    detail: 'override.labelPlaceholder',
    type: STEP,
    display: { label: '', subLabel: '' },
    override: { labelPlaceholder: 'Name this step', subLabelPlaceholder: 'Describe it' },
  },
  {
    key: 'locked',
    caption: 'Read-only node',
    detail: 'readOnlyNodeIds',
    type: STEP,
    readOnly: true,
  },
  {
    key: 'attachments',
    caption: 'Two attachments',
    detail: 'artifact edges to resources',
    type: 'uipath.agent',
    attachments: [toolAttachment(1), toolAttachment(2)],
    pitch: 300,
  },
  {
    key: 'attachments-overflow',
    caption: 'Five attachments',
    detail: 'chip overflow',
    type: 'uipath.agent',
    attachments: [1, 2, 3, 4, 5].map(toolAttachment),
    pitch: 300,
  },
];

export const StateParity: Story = {
  name: 'State parity',
  render: () => (
    <ParityStory
      rows={STATE_ROWS}
      title="State parity"
      description="The same node in every state the card can show. Card and bar in a row read the same execution, validation, override and read-only inputs, so any visual difference is a parity gap in the bar renderer."
    />
  ),
};

// ---------------------------------------------------------------------------
// Toggle round trip
// ---------------------------------------------------------------------------

const ROUND_TRIP_NODES: Node[] = [
  createNode({ id: 'trigger', type: 'uipath.manual-trigger', position: { x: 0, y: 120 } }),
  createNode({
    id: 'agent',
    type: 'uipath.agent',
    position: { x: 220, y: 100 },
    display: { label: 'Triage agent' },
  }),
  createNode({
    id: 'tool-search',
    type: 'uipath.agent.resource.tool',
    position: { x: 200, y: 300 },
    display: { label: 'Search' },
  }),
  createNode({
    id: 'tool-mail',
    type: 'uipath.agent.resource.tool',
    position: { x: 330, y: 300 },
    display: { label: 'Send mail' },
  }),
  createNode({ id: 'http', type: 'uipath.http-request', position: { x: 560, y: 120 } }),
];

const ROUND_TRIP_EDGES: Edge[] = [
  {
    id: 'e-trigger-agent',
    source: 'trigger',
    sourceHandle: 'output',
    target: 'agent',
    targetHandle: 'input',
  },
  {
    id: 'e-agent-http',
    source: 'agent',
    sourceHandle: 'success',
    target: 'http',
    targetHandle: 'input',
  },
  {
    id: 'e-agent-search',
    source: 'agent',
    sourceHandle: 'tools',
    target: 'tool-search',
    targetHandle: 'input',
  },
  {
    id: 'e-agent-mail',
    source: 'agent',
    sourceHandle: 'tools',
    target: 'tool-mail',
    targetHandle: 'input',
  },
];

export const ToggleRoundTrip: Story = {
  name: 'Toggle round trip',
  render: () => (
    <div className="relative h-full w-full">
      <SequentialCanvasStoryHarness
        initialNodes={ROUND_TRIP_NODES}
        initialEdges={ROUND_TRIP_EDGES}
        extraManifests={sequentialWireframeManifests}
        initialView="flow"
        showViewSwitcher
      />
      <div className="pointer-events-none absolute bottom-4 left-4 z-10 max-w-sm rounded-md border border-border bg-background/90 px-3 py-2 text-xs text-muted-foreground shadow-sm">
        Flip the view. In Sequential the two tools attached to the agent through artifact edges
        become chips on the agent bar instead of steps. Flip back and they return as nodes.
      </div>
    </div>
  ),
};
