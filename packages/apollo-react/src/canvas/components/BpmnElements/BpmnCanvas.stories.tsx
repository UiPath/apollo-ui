/**
 * Every element of PO.Frontend's BPMN canvas, rendered from apollo canvas primitives.
 *
 * The node and edge model is BPMN's own (see `bpmn.model.tsx`) and lives in plain React
 * state here, standing in for PO.Frontend's Redux slice. No manifest, no `BaseNode`, no
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
  Panel,
  Position,
} from '@uipath/apollo-react/canvas/xyflow/react';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { StoryInfoPanel, withCanvasProviders } from '../../storybook-utils';
import { BaseCanvas } from '../BaseCanvas';
import type { Point } from '../Edges/shared/types';
import { bpmnEdgeTypes } from './BpmnEdge';
import { BPMN_GATEWAY_TYPES, BPMN_TASK_TYPES, bpmnNodeTypes } from './BpmnNodes';
import {
  connectionDiagram,
  defaultSize,
  dropDiagram,
  elementCatalog,
  exampleDiagram,
} from './bpmn.diagram';
import {
  type BpmnButtonReveal,
  BpmnButtonRevealProvider,
  type BpmnButtonShape,
  BpmnButtonShapeProvider,
  type BpmnControls,
  BpmnControlsProvider,
  BpmnOverlayProvider,
  BpmnStringsProvider,
  type BpmnEdge,
  type BpmnEventDefinition,
  type BpmnLoop,
  type BpmnNode,
  type BpmnActions,
  BpmnActionsProvider,
  handleId,
  handleSide,
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

/** A cut-down `getBPMNConnectionTypeForNodes`. The real rules stay in PO.Frontend. */
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
  initial: { nodes: BpmnNode[]; edges: BpmnEdge[] };
}

function BpmnCanvasStory({
  buttonReveal,
  buttonShape,
  overlay,
  zoomScale,
  selectedButtonOutline,
  buttonOutset,
  title,
  initial,
}: BpmnCanvasStoryProps) {
  const [nodes, setNodes] = useState<BpmnNode[]>(initial.nodes);
  const [edges, setEdges] = useState<BpmnEdge[]>(initial.edges);
  const [hoveredAction, setHoveredAction] = useState<{ nodeId: string; action: string } | null>(
    null
  );
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
      const side = handleSide(targetHandle) ?? Position.Left;
      const edge: BpmnEdge = {
        id: newId('Flow'),
        type: connectionType(nodes, source, target),
        source,
        target,
        sourceHandle,
        targetHandle: handleId(target, 'target', side),
        data: {},
      };
      setEdges((current) => [...current, edge]);
    },
    [nodes, newId]
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
            sourceHandle: handleId(nodeId, 'source', side),
            targetHandle: handleId(id, 'target', OPPOSITE[side]),
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

      hoverToolbarAction: (nodeId, action, hovered) =>
        setHoveredAction(hovered ? { nodeId, action } : null),

      deleteNode: (nodeId) =>
        setNodes((current) => {
          const removed = new Set([nodeId]);
          // Parents precede children, so one pass collects every descendant.
          for (const node of current)
            if (node.parentId && removed.has(node.parentId)) removed.add(node.id);
          setEdges((all) =>
            all.filter((edge) => !removed.has(edge.source) && !removed.has(edge.target))
          );
          return current.filter((node) => !removed.has(node.id));
        }),

      view: (nodeId) => console.info('View', nodeId),
      rename: (nodeId, label) =>
        patch(nodeId, (node) => ({ ...node, data: { ...node.data, label } })),

      insertOnEdge: (edgeId, position) => {
        const split = edges.find((edge) => edge.id === edgeId);
        const from = byId(nodes, split?.source);
        if (!split || !from) return;
        const id = newId('Activity');
        const parentId = containerOf(nodes, from);
        const container = originOf(nodes, parentId);
        const size = defaultSize('bpmn:Task');
        const enters = OPPOSITE[handleSide(split.sourceHandle) ?? Position.Right];
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
                  // The incoming half keeps the id, label and condition, as PO.Frontend's split does.
                  {
                    ...edge,
                    target: id,
                    targetHandle: handleId(id, 'target', enters),
                    data: { ...edge.data, waypoints: undefined },
                  },
                  {
                    id: newId('Flow'),
                    type: edge.type,
                    source: id,
                    target: edge.target,
                    sourceHandle: handleId(id, 'source', OPPOSITE[enters]),
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
  }, [edges, nodes, patch, newId]);

  const controls = useMemo<BpmnControls>(
    () => ({
      maxZoomScale: zoomScale ? 2.5 : undefined,
      selectedButtonOutline,
      buttonOutset,
    }),
    [zoomScale, selectedButtonOutline, buttonOutset]
  );
  const stackedEdges = useMemo(
    () => (overlay ? edges.map((edge) => ({ ...edge, zIndex: STACKED_EDGE_Z_INDEX })) : edges),
    [edges, overlay]
  );

  return (
    <BpmnStringsProvider strings={STORY_STRINGS}>
      <BpmnOverlayProvider value={overlay ? OVERLAY : null}>
        <BpmnActionsProvider value={actions}>
          <BpmnButtonRevealProvider value={buttonReveal}>
            <BpmnButtonShapeProvider value={buttonShape}>
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
                  <StoryInfoPanel title={title} collapsible defaultCollapsed>
                    <ul className="mt-2 max-w-80 list-disc space-y-1 pl-4 text-xs text-foreground-muted">
                      <li>Cards, hover, selection and status: BaseContainer</li>
                      <li>Diamond and data shapes: BaseNodeOutline with a host path</li>
                      <li>Handles and "+": ButtonHandle, shown by resolveNodeHandleAffordances</li>
                      <li>Actions: NodeToolbar and EdgeToolbar</li>
                      <li>Corner badges: BaseBadgeSlot; label editing: useInlineLabelEditing</li>
                      <li>
                        Edges: EdgePath, EdgeArrow, EdgeLabel, the waypoint editor and line jumps
                      </li>
                      <li>Pools, lanes, groups and annotations: apollo tokens only</li>
                    </ul>
                  </StoryInfoPanel>
                  {hoveredAction && (
                    <Panel position="top-center">
                      <div className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-foreground-muted">
                        Hovering "{hoveredAction.action}" on {hoveredAction.nodeId}
                      </div>
                    </Panel>
                  )}
                </BaseCanvas>
              </BpmnControlsProvider>
            </BpmnButtonShapeProvider>
          </BpmnButtonRevealProvider>
        </BpmnActionsProvider>
      </BpmnOverlayProvider>
    </BpmnStringsProvider>
  );
}

export const ExampleDiagram: Story = {
  name: 'Example diagram',
  render: (args) => (
    <BpmnCanvasStory {...args} title="BPMN example diagram" initial={exampleDiagram} />
  ),
};

export const ElementCatalog: Story = {
  name: 'Element catalog',
  render: (args) => (
    <BpmnCanvasStory {...args} title="BPMN element catalog" initial={elementCatalog} />
  ),
};

export const ConnectionInProgress: Story = {
  name: 'Connection in progress',
  render: (args) => (
    <BpmnCanvasStory {...args} title="BPMN connection states" initial={connectionDiagram} />
  ),
};

export const DropTargets: Story = {
  name: 'Drop targets',
  render: (args) => <BpmnCanvasStory {...args} title="BPMN drop states" initial={dropDiagram} />,
};
