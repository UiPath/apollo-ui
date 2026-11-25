/**
 * Every element of a BPMN canvas, rendered from apollo canvas primitives.
 *
 * The node and edge model is BPMN's own (see `bpmn.model.tsx`) and lives in plain React
 * state here, standing in for the host's own store. No manifest, no `BaseNode`, no
 * `CanvasEdge`, and nothing writes the xyflow store.
 */
import type { Meta, StoryObj } from '@storybook/react';
import {
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
  type NodeProps,
  type NodeTypes,
  Position,
} from '@uipath/apollo-react/canvas/xyflow/react';
import {
  memo,
  type ReactNode,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { StoryInfoPanel, withCanvasProviders } from '../../storybook-utils';
import { BaseCanvas } from '../BaseCanvas';
import type { Point } from '../Edges/shared/types';
import { bpmnEdgeTypes } from './BpmnEdge';
import { BPMN_GATEWAY_TYPES, BPMN_TASK_TYPES, bpmnNodeTypes } from './BpmnNodes';
import {
  connectionDiagram,
  type Diagram,
  defaultSize,
  dropDiagram,
  elementCatalog,
  exampleDiagram,
} from './bpmn.diagram';
import {
  type BpmnActions,
  BpmnActionsProvider,
  type BpmnButtonReveal,
  type BpmnButtonShape,
  type BpmnControls,
  BpmnControlsProvider,
  type BpmnEdge,
  type BpmnEventDefinition,
  type BpmnLoop,
  type BpmnNode,
  BpmnOverlayProvider,
  BpmnStringsProvider,
  bpmnHandleId,
  bpmnHandleSide,
} from './bpmn.model';

const STORY_STRINGS = { edgeLabelPlaceholder: 'Double-click to add label' };

interface StoryArgs {
  buttonReveal: BpmnButtonReveal;
  buttonShape: BpmnButtonShape;
  overlay: boolean;
  zoomScale: boolean;
  selectedButtonOutline: boolean;
  buttonOutset: number;
}

const meta: Meta<StoryArgs> = {
  title: 'Templates/BPMN Elements',
  parameters: { layout: 'fullscreen' },
  decorators: [withCanvasProviders()],
  args: {
    buttonReveal: 'expand-on-hover',
    buttonShape: 'circle',
    overlay: false,
    zoomScale: true,
    selectedButtonOutline: true,
    buttonOutset: 2,
  },
  argTypes: {
    buttonReveal: {
      name: 'Handle "+" button',
      control: 'inline-radio',
      options: ['expand-on-hover', 'always'],
    },
    buttonShape: {
      name: 'Expanding "+" shape',
      control: 'inline-radio',
      options: ['circle', 'rounded'],
      if: { arg: 'buttonReveal', eq: 'expand-on-hover' },
    },
    overlay: {
      name: 'Overlay above flows',
      description:
        'Stacks every flow above the nodes, as a host with one paint order does, and draws the toolbar, the "+" and outside labels in an overlay above both.',
      control: 'boolean',
    },
    zoomScale: {
      name: 'Scale selected controls with zoom',
      description:
        'Keeps the toolbar and "+" buttons of a selected node the same size on screen as the canvas zooms out, up to 2.5x.',
      control: 'boolean',
    },
    selectedButtonOutline: {
      name: 'Primary outline on selected "+"',
      control: 'boolean',
    },
    buttonOutset: {
      name: 'Expanding "+" outset (px)',
      control: { type: 'range', min: 0, max: 8, step: 1 },
      if: { arg: 'buttonReveal', eq: 'expand-on-hover' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Row heading for the element gallery. */
const HeadingNode = memo(function HeadingNode({ data }: NodeProps<BpmnNode>) {
  return (
    <div className="text-sm font-semibold whitespace-nowrap text-foreground-muted">
      {data.label}
    </div>
  );
});

/** Caption under a catalog item that has no label of its own. */
const CaptionNode = memo(function CaptionNode({ data, width }: NodeProps<BpmnNode>) {
  return (
    <div className="text-center text-xs font-semibold text-foreground" style={{ width }}>
      {data.label}
    </div>
  );
});

const storyNodeTypes: NodeTypes = {
  ...bpmnNodeTypes,
  'story:heading': HeadingNode,
  'story:caption': CaptionNode,
};

const OPPOSITE: Record<Position, Position> = {
  [Position.Left]: Position.Right,
  [Position.Right]: Position.Left,
  [Position.Top]: Position.Bottom,
  [Position.Bottom]: Position.Top,
};
const EVENT_CYCLE: (BpmnEventDefinition | undefined)[] = [
  undefined,
  'message',
  'timer',
  'signal',
  'error',
];
const LOOP_CYCLE: (BpmnLoop | undefined)[] = [undefined, 'loop', 'parallel', 'sequential'];
const DELETE_KEYS = ['Backspace', 'Delete'];
const STACKED_EDGE_Z_INDEX = 100;
// Above a selected flow, which xyflow lifts by 1000.
const OVERLAY = { zIndex: STACKED_EDGE_Z_INDEX + 1002 };

const next = <T,>(cycle: T[], current: T) =>
  cycle[(cycle.indexOf(current) + 1) % cycle.length] as T;
const byId = (nodes: BpmnNode[], id?: string) => nodes.find((node) => node.id === id);

/** Absolute position of a node's own origin, walking up `parentId`. */
function originOf(nodes: BpmnNode[], id?: string): Point {
  let x = 0;
  let y = 0;
  for (let current = byId(nodes, id); current; current = byId(nodes, current.parentId)) {
    x += current.position.x;
    y += current.position.y;
  }
  return { x, y };
}

/** The lane, pool or sub-process a node's siblings live in. A boundary event's parent is its host. */
function containerOf(nodes: BpmnNode[], node: BpmnNode) {
  return node.type === 'bpmn:BoundaryEvent' ? byId(nodes, node.parentId)?.parentId : node.parentId;
}

function poolOf(nodes: BpmnNode[], id: string) {
  let current = byId(nodes, id);
  while (current && current.type !== 'bpmn:Participant') current = byId(nodes, current.parentId);
  return current?.id;
}

/** A cut-down version of a host's connection rules. The real rules stay with the host. */
function connectionType(nodes: BpmnNode[], source: string, target: string) {
  const types = [byId(nodes, source)?.type ?? '', byId(nodes, target)?.type ?? ''];
  if (types.includes('bpmn:TextAnnotation')) return 'bpmn:Association';
  if (types.some((type) => type.startsWith('bpmn:Data'))) return 'bpmn:DataOutputAssociation';
  if (types.includes('bpmn:Participant') || poolOf(nodes, source) !== poolOf(nodes, target)) {
    return 'bpmn:MessageFlow';
  }
  return 'bpmn:SequenceFlow';
}

// Frames the whole diagram on load without enlarging a small one. The extra top padding keeps
// it clear of the info panel.
const FIT_VIEW = {
  padding: { top: '96px', right: '24px', bottom: '24px', left: '24px' },
  maxZoom: 1,
  duration: 0,
} as const;

interface BpmnCanvasStoryProps extends StoryArgs {
  title: string;
  description: ReactNode;
  initial: Diagram;
}

function BpmnCanvasStory({
  buttonReveal,
  buttonShape,
  overlay,
  zoomScale,
  selectedButtonOutline,
  buttonOutset,
  title,
  description,
  initial,
}: BpmnCanvasStoryProps) {
  const [nodes, setNodes] = useState<BpmnNode[]>(initial.nodes);
  const [edges, setEdges] = useState<BpmnEdge[]>(initial.edges);
  // Actions read the latest diagram here rather than closing over state, so their identity, and
  // every node's render, survives a drag tick.
  const latest = useRef<Diagram>(initial);
  useLayoutEffect(() => {
    latest.current = { nodes, edges };
  });
  const counter = useRef(0);
  const newId = useCallback((prefix: string) => `${prefix}_new_${++counter.current}`, []);

  const onNodesChange = useCallback(
    (changes: NodeChange<BpmnNode>[]) => setNodes((current) => applyNodeChanges(changes, current)),
    []
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange<BpmnEdge>[]) => setEdges((current) => applyEdgeChanges(changes, current)),
    []
  );

  const onConnect = useCallback(
    ({ source, target, sourceHandle, targetHandle }: Connection) => {
      // Loose mode lets a drag end on a source handle; BPMN stores the target-side id.
      const side = bpmnHandleSide(targetHandle) ?? Position.Left;
      const edge: BpmnEdge = {
        id: newId('Flow'),
        type: connectionType(latest.current.nodes, source, target),
        source,
        target,
        sourceHandle,
        targetHandle: bpmnHandleId(target, 'target', side),
        data: {},
      };
      setEdges((current) => [...current, edge]);
    },
    [newId]
  );

  const patch = useCallback(
    (id: string, change: (node: BpmnNode) => BpmnNode) =>
      setNodes((current) => current.map((node) => (node.id === id ? change(node) : node))),
    []
  );

  const actions = useMemo<BpmnActions>(() => {
    const select = (list: BpmnNode[], added: BpmnNode) => [
      ...list.map((node) => (node.selected ? { ...node, selected: false } : node)),
      { ...added, selected: true },
    ];

    return {
      addAfter: (nodeId, side) => {
        const id = newId('Activity');
        setNodes((current) => {
          const from = byId(current, nodeId);
          if (!from) return current;
          const parentId = containerOf(current, from);
          const base = originOf(current, nodeId);
          const container = originOf(current, parentId);
          const { width = 100, height = 80 } = from;
          const size = defaultSize('bpmn:Task');
          const centre = { x: base.x + width / 2, y: base.y + height / 2 };
          const reach = {
            [Position.Right]: { x: width / 2 + 60 + size.width / 2, y: 0 },
            [Position.Left]: { x: -(width / 2 + 60 + size.width / 2), y: 0 },
            [Position.Bottom]: { x: 0, y: height / 2 + 50 + size.height / 2 },
            [Position.Top]: { x: 0, y: -(height / 2 + 50 + size.height / 2) },
          }[side];
          return select(current, {
            id,
            type: 'bpmn:Task',
            position: {
              x: centre.x + reach.x - size.width / 2 - container.x,
              y: centre.y + reach.y - size.height / 2 - container.y,
            },
            data: { label: 'New task' },
            parentId,
            ...size,
          });
        });
        setEdges((current) => [
          ...current,
          {
            id: newId('Flow'),
            type: 'bpmn:SequenceFlow',
            source: nodeId,
            target: id,
            sourceHandle: bpmnHandleId(nodeId, 'source', side),
            targetHandle: bpmnHandleId(id, 'target', OPPOSITE[side]),
            data: {},
          },
        ]);
      },

      addBoundaryEvent: (nodeId) =>
        setNodes((current) => {
          const host = byId(current, nodeId);
          if (!host) return current;
          const taken = current.filter((node) => node.parentId === nodeId).length;
          return [
            ...current,
            {
              id: newId('Boundary'),
              type: 'bpmn:BoundaryEvent',
              position: { x: 8 + taken * 44, y: (host.height ?? 80) - 18 },
              data: { eventDefinition: 'timer' },
              parentId: nodeId,
              ...defaultSize('bpmn:BoundaryEvent'),
            },
          ];
        }),

      changeElement: (nodeId) =>
        patch(nodeId, (node) => {
          const type = node.type ?? '';
          if (BPMN_TASK_TYPES.includes(type)) return { ...node, type: next(BPMN_TASK_TYPES, type) };
          if (BPMN_GATEWAY_TYPES.includes(type))
            return { ...node, type: next(BPMN_GATEWAY_TYPES, type) };
          if (type.endsWith('Event')) {
            return {
              ...node,
              data: { ...node.data, eventDefinition: next(EVENT_CYCLE, node.data.eventDefinition) },
            };
          }
          return node;
        }),

      toggleLoop: (nodeId) =>
        patch(nodeId, (node) => ({
          ...node,
          data: {
            ...node.data,
            loopCharacteristics: next(LOOP_CYCLE, node.data.loopCharacteristics),
          },
        })),

      toggleBreakpoint: (nodeId) =>
        patch(nodeId, (node) => ({
          ...node,
          data: { ...node.data, breakpoint: !node.data.breakpoint },
        })),

      duplicate: (nodeId) =>
        setNodes((current) => {
          const original = byId(current, nodeId);
          if (!original) return current;
          return select(current, {
            ...original,
            id: newId('Copy'),
            position: { x: original.position.x + 24, y: original.position.y + 24 },
          });
        }),

      hoverToolbarAction: (nodeId, action, hovered) => {
        if (hovered) console.info('Hover toolbar action', action, nodeId);
      },

      deleteNode: (nodeId) => {
        const removed = new Set([nodeId]);
        // Parents precede children, so one pass collects every descendant.
        for (const node of latest.current.nodes)
          if (node.parentId && removed.has(node.parentId)) removed.add(node.id);
        setNodes((current) => current.filter((node) => !removed.has(node.id)));
        setEdges((current) =>
          current.filter((edge) => !removed.has(edge.source) && !removed.has(edge.target))
        );
      },

      view: (nodeId) => console.info('View', nodeId),
      rename: (nodeId, label) =>
        patch(nodeId, (node) => ({ ...node, data: { ...node.data, label } })),

      insertOnEdge: (edgeId, position) => {
        const { nodes, edges } = latest.current;
        const split = edges.find((edge) => edge.id === edgeId);
        const from = byId(nodes, split?.source);
        if (!split || !from) return;
        const id = newId('Activity');
        const parentId = containerOf(nodes, from);
        const container = originOf(nodes, parentId);
        const size = defaultSize('bpmn:Task');
        const enters = OPPOSITE[bpmnHandleSide(split.sourceHandle) ?? Position.Right];
        setNodes((current) =>
          select(current, {
            id,
            type: 'bpmn:Task',
            position: {
              x: position.x - size.width / 2 - container.x,
              y: position.y - size.height / 2 - container.y,
            },
            data: { label: 'New task' },
            parentId,
            ...size,
          })
        );
        setEdges((current) =>
          current.flatMap((edge) =>
            edge.id !== edgeId
              ? [edge]
              : [
                  // The incoming half keeps the id, label and condition, as a BPMN editor's split does.
                  {
                    ...edge,
                    target: id,
                    targetHandle: bpmnHandleId(id, 'target', enters),
                    data: { ...edge.data, waypoints: undefined },
                  },
                  {
                    id: newId('Flow'),
                    type: edge.type,
                    source: id,
                    target: edge.target,
                    sourceHandle: bpmnHandleId(id, 'source', OPPOSITE[enters]),
                    targetHandle: edge.targetHandle,
                    data: {},
                  },
                ]
          )
        );
      },

      // xyflow already reports the new size through onNodesChange.
      resize: () => {},

      deleteEdge: (edgeId) => setEdges((current) => current.filter((edge) => edge.id !== edgeId)),

      setWaypoints: (edgeId, waypoints) =>
        setEdges((current) =>
          current.map((edge) =>
            edge.id === edgeId ? { ...edge, data: { ...edge.data, waypoints } } : edge
          )
        ),

      renameEdge: (edgeId, label) =>
        setEdges((current) =>
          current.map((edge) =>
            edge.id === edgeId ? { ...edge, data: { ...edge.data, label } } : edge
          )
        ),

      moveEdgeLabel: (edgeId, labelPosition) =>
        setEdges((current) =>
          current.map((edge) =>
            edge.id === edgeId ? { ...edge, data: { ...edge.data, labelPosition } } : edge
          )
        ),
    };
  }, [patch, newId]);

  const controls = useMemo<BpmnControls>(
    () => ({
      buttonReveal,
      buttonShape,
      maxZoomScale: zoomScale ? 2.5 : undefined,
      selectedButtonOutline,
      buttonOutset,
    }),
    [buttonReveal, buttonShape, zoomScale, selectedButtonOutline, buttonOutset]
  );
  const stackedEdges = useMemo(
    () => (overlay ? edges.map((edge) => ({ ...edge, zIndex: STACKED_EDGE_Z_INDEX })) : edges),
    [edges, overlay]
  );

  return (
    <BpmnStringsProvider strings={STORY_STRINGS}>
      <BpmnOverlayProvider value={overlay ? OVERLAY : null}>
        <BpmnActionsProvider value={actions}>
          <BpmnControlsProvider value={controls}>
            <BaseCanvas
              nodes={nodes}
              edges={stackedEdges}
              nodeTypes={storyNodeTypes}
              edgeTypes={bpmnEdgeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              deleteKeyCode={DELETE_KEYS}
              mode="design"
              fitView
              fitViewOptions={FIT_VIEW}
            >
              <StoryInfoPanel
                title={title}
                description={description}
                collapsible
                defaultCollapsed
              />
            </BaseCanvas>
          </BpmnControlsProvider>
        </BpmnActionsProvider>
      </BpmnOverlayProvider>
    </BpmnStringsProvider>
  );
}

const Code = ({ children }: { children: string }) => (
  <code className="font-mono text-foreground">{children}</code>
);

// Only the anchor node shows a toolbar or "+" while a connection runs, so these controls
// would do next to nothing there.
const NO_BUTTON_CONTROLS: Story['argTypes'] = {
  buttonReveal: { table: { disable: true } },
  buttonShape: { table: { disable: true } },
  zoomScale: { table: { disable: true } },
  selectedButtonOutline: { table: { disable: true } },
  buttonOutset: { table: { disable: true } },
};

export const ExampleDiagram: Story = {
  name: 'Example diagram',
  render: (args) => (
    <BpmnCanvasStory
      {...args}
      title="BPMN example diagram"
      description={
        <>
          An order process across three pools, with lanes, sub-processes, a boundary event and
          sequence, message, data and association flows. The host keeps nodes and edges in its own
          state and handles every edit through <Code>BpmnActionsProvider</Code>.
        </>
      }
      initial={exampleDiagram}
    />
  ),
};

export const ElementCatalog: Story = {
  name: 'Element catalog',
  render: (args) => (
    <BpmnCanvasStory
      {...args}
      title="BPMN element catalog"
      description="Element kinds, event definitions, markers, states and flow variants, one per item. Each is set through node or edge data."
      initial={elementCatalog}
    />
  ),
};

export const ConnectionInProgress: Story = {
  name: 'Connection in progress',
  argTypes: NO_BUTTON_CONTROLS,
  render: (args) => (
    <BpmnCanvasStory
      {...args}
      title="BPMN connection states"
      description={
        <>
          A connection dragged out of "Review order" and held over "Approved?". The host sets{' '}
          <Code>connectionState</Code> in each node's data and <Code>dimmed</Code> in each edge's
          data. Nothing is computed by the family.
        </>
      }
      initial={connectionDiagram}
    />
  ),
};

export const DropTargets: Story = {
  name: 'Drop targets',
  render: (args) => (
    <BpmnCanvasStory
      {...args}
      title="BPMN drop states"
      description={
        <>
          Each state a dragged node can put on what it is over: valid, valid on the border, and
          invalid. The host sets <Code>dropState</Code> in node data. Nothing is computed by the
          family.
        </>
      }
      initial={dropDiagram}
    />
  ),
};
