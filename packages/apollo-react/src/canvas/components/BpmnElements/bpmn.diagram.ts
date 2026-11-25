import { Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { ValidationErrorSeverity } from '../../types/validation';
import { BPMN_GATEWAY_TYPES, BPMN_TASK_TYPES } from './BpmnNodes';
import {
  type BpmnConnectionState,
  type BpmnDropState,
  type BpmnEdge,
  type BpmnEdgeData,
  type BpmnEventDefinition,
  type BpmnNode,
  type BpmnNodeData,
  bpmnHandleId,
} from './bpmn.model';

const { Left, Right, Top, Bottom } = Position;

export type Diagram = { nodes: BpmnNode[]; edges: BpmnEdge[] };

/** Default sizes, as a BPMN host's type registry declares them. */
export function defaultSize(type: string) {
  if (type.endsWith('Event')) return { width: 36, height: 36 };
  // 48, not BPMN's usual 50: a multiple of the 16px grid, so centres line up with tasks after snapping.
  if (type.endsWith('Gateway')) return { width: 48, height: 48 };
  if (type === 'bpmn:DataStoreReference') return { width: 48, height: 48 };
  if (type.startsWith('bpmn:Data')) return { width: 36, height: 50 };
  if (type === 'bpmn:TextAnnotation') return { width: 140, height: 40 };
  return { width: 100, height: 80 };
}

function node(
  id: string,
  type: string,
  x: number,
  y: number,
  data: BpmnNodeData = {},
  extra: Partial<BpmnNode> = {}
): BpmnNode {
  return { id, type, position: { x, y }, data, ...defaultSize(type), ...extra };
}

const inside = (parentId: string): Partial<BpmnNode> => ({ parentId, extent: 'parent' });

function edge(
  id: string,
  type: string,
  [source, sourceSide]: [string, Position],
  [target, targetSide]: [string, Position],
  data: BpmnEdgeData = {}
): BpmnEdge {
  return {
    id,
    type,
    source,
    target,
    sourceHandle: bpmnHandleId(source, 'source', sourceSide),
    targetHandle: bpmnHandleId(target, 'target', targetSide),
    data,
  };
}

const SALES = 'Lane_sales';
const FULFIL = 'Lane_fulfilment';
const SHIP = 'SubProcess_ship';

// Layout: flow nodes sit at least 100px apart so handles, "+" buttons, edge toolbars and labels
// have room, and long connections run through empty corridors rather than behind nodes.
const POOL_WIDTH = 1438;
const LANE_WIDTH = POOL_WIDTH - 28;

/** A small collaboration: three pools, two lanes, a boundary event, sub-processes. */
const processNodes: BpmnNode[] = [
  node(
    'Participant_customer',
    'bpmn:Participant',
    0,
    0,
    { label: 'Customer' },
    { width: POOL_WIDTH, height: 100 }
  ),
  node(
    'Participant_orders',
    'bpmn:Participant',
    0,
    200,
    { label: 'Order handling' },
    { width: POOL_WIDTH, height: 610 }
  ),
  node(
    'Participant_finance',
    'bpmn:Participant',
    0,
    910,
    { label: 'Finance' },
    { width: POOL_WIDTH, height: 80 }
  ),
  node(
    SALES,
    'bpmn:Lane',
    28,
    0,
    { label: 'Sales' },
    {
      parentId: 'Participant_orders',
      width: LANE_WIDTH,
      height: 350,
      draggable: false,
    }
  ),
  node(
    FULFIL,
    'bpmn:Lane',
    28,
    350,
    { label: 'Fulfilment', laneIndex: 1 },
    {
      parentId: 'Participant_orders',
      width: LANE_WIDTH,
      height: 260,
      draggable: false,
    }
  ),

  node(
    'Start_order',
    'bpmn:StartEvent',
    80,
    72,
    { label: 'Order received', eventDefinition: 'message' },
    inside(SALES)
  ),
  node('Task_review', 'bpmn:UserTask', 220, 50, { label: 'Review order' }, inside(SALES)),
  node(
    'Boundary_timer',
    'bpmn:BoundaryEvent',
    32,
    62,
    { eventDefinition: 'timer', nonInterrupting: true },
    {
      parentId: 'Task_review',
    }
  ),
  node('Task_remind', 'bpmn:SendTask', 220, 200, { label: 'Send reminder' }, inside(SALES)),
  node('Gateway_approved', 'bpmn:ExclusiveGateway', 440, 66, { label: 'Approved?' }, inside(SALES)),
  node(
    'Task_reserve',
    'bpmn:ServiceTask',
    620,
    50,
    { label: 'Reserve stock', connected: true },
    inside(SALES)
  ),
  node(
    'End_rejected',
    'bpmn:EndEvent',
    446,
    212,
    { label: 'Rejected', eventDefinition: 'error' },
    inside(SALES)
  ),
  node('Data_orders', 'bpmn:DataStoreReference', 840, 66, { label: 'Orders' }, inside(SALES)),
  node(
    'Annotation_hold',
    'bpmn:TextAnnotation',
    990,
    70,
    { label: 'Stock is held for 24 hours' },
    inside(SALES)
  ),

  node('Gateway_split', 'bpmn:ParallelGateway', 110, 106, {}, inside(FULFIL)),
  node(
    'Task_pick',
    'bpmn:ScriptTask',
    250,
    20,
    { label: 'Pick items', loopCharacteristics: 'parallel' },
    inside(FULFIL)
  ),
  node(
    'Task_pack',
    'bpmn:ManualTask',
    250,
    160,
    { label: 'Pack order', loopCharacteristics: 'loop' },
    inside(FULFIL)
  ),
  node('Gateway_join', 'bpmn:ParallelGateway', 450, 106, {}, inside(FULFIL)),
  node(
    SHIP,
    'bpmn:SubProcess',
    570,
    30,
    { label: 'Ship', isExpanded: true },
    {
      ...inside(FULFIL),
      width: 400,
      height: 200,
    }
  ),
  node('Ship_start', 'bpmn:StartEvent', 30, 82, {}, inside(SHIP)),
  node('Ship_label', 'bpmn:Task', 150, 60, { label: 'Print label' }, inside(SHIP)),
  node('Ship_end', 'bpmn:EndEvent', 334, 82, {}, inside(SHIP)),
  node('SubProcess_invoice', 'bpmn:SubProcess', 1080, 90, { label: 'Invoice' }, inside(FULFIL)),
  node(
    'End_done',
    'bpmn:EndEvent',
    1290,
    112,
    { label: 'Order closed', eventDefinition: 'terminate' },
    inside(FULFIL)
  ),
];

const SEQUENCE = 'bpmn:SequenceFlow';

const processEdges: BpmnEdge[] = [
  edge('Flow_1', SEQUENCE, ['Start_order', Right], ['Task_review', Left]),
  edge('Flow_2', SEQUENCE, ['Task_review', Right], ['Gateway_approved', Left]),
  edge('Flow_3', SEQUENCE, ['Gateway_approved', Right], ['Task_reserve', Left], {
    label: 'Yes',
    conditionExpression: 'approved',
  }),
  edge('Flow_4', SEQUENCE, ['Gateway_approved', Bottom], ['End_rejected', Top], {
    defaultFlow: true,
  }),
  edge('Flow_5', SEQUENCE, ['Boundary_timer', Bottom], ['Task_remind', Top]),
  // Runs along the empty strip at the bottom of the Sales lane, clear of its nodes.
  edge('Flow_6', SEQUENCE, ['Task_reserve', Bottom], ['Gateway_split', Left], {
    waypoints: [
      { x: 698, y: 330 },
      { x: 698, y: 515 },
      { x: 100, y: 515 },
      { x: 100, y: 680 },
      { x: 138, y: 680 },
    ],
  }),
  edge('Flow_7', SEQUENCE, ['Gateway_split', Top], ['Task_pick', Left]),
  edge('Flow_8', SEQUENCE, ['Gateway_split', Bottom], ['Task_pack', Left]),
  edge('Flow_9', SEQUENCE, ['Task_pick', Right], ['Gateway_join', Top]),
  edge('Flow_10', SEQUENCE, ['Task_pack', Right], ['Gateway_join', Bottom]),
  edge('Flow_11', SEQUENCE, ['Gateway_join', Right], [SHIP, Left]),
  edge('Flow_12', SEQUENCE, ['Ship_start', Right], ['Ship_label', Left]),
  edge('Flow_13', SEQUENCE, ['Ship_label', Right], ['Ship_end', Left]),
  edge('Flow_14', SEQUENCE, [SHIP, Right], ['SubProcess_invoice', Left]),
  edge('Flow_15', SEQUENCE, ['SubProcess_invoice', Right], ['End_done', Left]),
  edge('Message_1', 'bpmn:MessageFlow', ['Participant_customer', Bottom], ['Start_order', Top], {
    label: 'Order',
  }),
  // Runs through the gap between the pools.
  edge(
    'Message_2',
    'bpmn:MessageFlow',
    ['SubProcess_invoice', Bottom],
    ['Participant_finance', Top],
    {
      label: 'Invoice',
      waypoints: [
        { x: 1158, y: 720 },
        { x: 1158, y: 860 },
        { x: 719, y: 860 },
        { x: 719, y: 910 },
      ],
    }
  ),
  edge('DataOut_1', 'bpmn:DataOutputAssociation', ['Task_reserve', Right], ['Data_orders', Left]),
  edge('Association_1', 'bpmn:Association', ['Annotation_hold', Left], ['Data_orders', Right]),
];

// Clears the story's info panel in the top-left corner.
const GALLERY_TOP = 100;
const ROW_GAP = 140;
const FIRST_COLUMN = 210;

type Item = [type: string, data?: BpmnNodeData, extra?: Partial<BpmnNode>];

/** One labelled row of standalone elements; returns the nodes laid out left to right. */
function row(index: number, title: string, items: Item[], gap = 90): BpmnNode[] {
  const y = GALLERY_TOP + index * ROW_GAP;
  let x = FIRST_COLUMN;
  const nodes = [
    node(`Heading_${index}`, 'story:heading', 0, y + 10, { label: title }, { selectable: false }),
  ];
  items.forEach(([type, data, extra], i) => {
    const item = node(`Gallery_${index}_${i}`, type, x, y, data, extra);
    nodes.push(item);
    x += (item.width ?? 100) + gap;
  });
  return nodes;
}

const events = (
  type: string,
  definitions: (BpmnEventDefinition | undefined)[],
  data: BpmnNodeData = {}
): Item[] =>
  definitions.map((eventDefinition) => {
    const name = eventDefinition ?? 'none';
    return [
      type,
      {
        ...data,
        eventDefinition,
        label: data.nonInterrupting ? `${name}, non-interrupting` : name,
      },
    ];
  });

/** Read off the type so labels cannot drift: `bpmn:BusinessRuleTask` reads "Business rule". */
function shortName(type: string, suffix: string) {
  const bare = type.replace(/^bpmn:/, '');
  const words = (bare.endsWith(suffix) ? bare.slice(0, -suffix.length) : bare)
    .replace(/\B([A-Z])/g, ' $1')
    .toLowerCase();
  // Plain `bpmn:Task` has nothing left after the suffix.
  if (!words) return suffix;
  // BPMN writes this one hyphenated.
  const name = words === 'event based' ? 'event-based' : words;
  return name.charAt(0).toUpperCase() + name.slice(1);
}

const BOUNDARY_HOST = 'Gallery_boundary_host';

const galleryNodes: BpmnNode[] = [
  ...row(0, 'Start events', [
    ...events('bpmn:StartEvent', [undefined, 'message', 'timer', 'conditional', 'signal']),
    ...events('bpmn:StartEvent', ['message', 'timer'], { nonInterrupting: true }),
  ]),
  ...row(1, 'Intermediate events', [
    ...events('bpmn:IntermediateCatchEvent', ['message', 'timer', 'signal', 'link', 'conditional']),
    ...events('bpmn:IntermediateThrowEvent', [
      undefined,
      'message',
      'signal',
      'link',
      'escalation',
      'compensation',
    ]),
  ]),
  ...row(
    2,
    'End events',
    events('bpmn:EndEvent', [
      undefined,
      'message',
      'error',
      'escalation',
      'signal',
      'compensation',
      'terminate',
    ])
  ),
  ...row(
    3,
    'Gateways',
    BPMN_GATEWAY_TYPES.map((type): Item => [type, { label: shortName(type, 'Gateway') }])
  ),
  ...row(
    4,
    'Tasks',
    [
      ...BPMN_TASK_TYPES.map((type): Item => [type, { label: shortName(type, 'Task') }]),
      ['bpmn:CallActivity', { label: 'Call activity' }],
    ],
    40
  ),
  ...row(
    5,
    'Markers and sub-processes',
    [
      ['bpmn:Task', { label: 'Loop', loopCharacteristics: 'loop' }],
      ['bpmn:Task', { label: 'Parallel', loopCharacteristics: 'parallel' }],
      ['bpmn:Task', { label: 'Sequential', loopCharacteristics: 'sequential' }],
      ['bpmn:SubProcess', { label: 'Collapsed' }],
      ['bpmn:SubProcess', { label: 'Collapsed loop', loopCharacteristics: 'loop' }],
      ['bpmn:UserTask', { label: 'Boundary events' }, { id: BOUNDARY_HOST }],
      [
        'bpmn:SubProcess',
        { label: 'Event sub-process', isExpanded: true, triggeredByEvent: true },
        { width: 200, height: 100 },
      ],
    ],
    40
  ),
  ...row(
    6,
    'Data and artifacts',
    [
      ['bpmn:DataObjectReference', { label: 'Object' }],
      ['bpmn:DataInput', { label: 'Input' }],
      ['bpmn:DataOutput', { label: 'Output' }],
      ['bpmn:DataStoreReference', { label: 'Store' }],
      ['bpmn:TextAnnotation', { label: 'Text annotation' }],
      ['bpmn:Group', { label: 'Group' }, { width: 180, height: 90 }],
    ],
    60
  ),
  ...row(
    7,
    'States and adornments',
    [
      ['bpmn:ServiceTask', { label: 'Completed', executionStatus: 'Completed' }],
      ['bpmn:ServiceTask', { label: 'In progress', executionStatus: 'InProgress' }],
      ['bpmn:ServiceTask', { label: 'Failed', executionStatus: 'Failed' }],
      ['bpmn:UserTask', { label: 'Error', validationStatus: ValidationErrorSeverity.ERROR }],
      ['bpmn:UserTask', { label: 'Warning', validationStatus: ValidationErrorSeverity.WARNING }],
      ['bpmn:Task', { label: 'Added', modification: 'add' }],
      ['bpmn:Task', { label: 'Updated', modification: 'update' }],
      ['bpmn:Task', { label: 'Deleted', modification: 'delete' }],
      ['bpmn:Task', { label: 'Breakpoint', breakpoint: true }],
      ['bpmn:ServiceTask', { label: 'Mock, connector', mocked: true, connected: true }],
    ],
    40
  ),
];

/** An interrupting timer and a non-interrupting message on the gallery's "Boundary events" task. */
const galleryBoundaryEvents: BpmnNode[] = [
  node(
    'Gallery_boundary_timer',
    'bpmn:BoundaryEvent',
    12,
    62,
    { eventDefinition: 'timer' },
    { parentId: BOUNDARY_HOST }
  ),
  node(
    'Gallery_boundary_message',
    'bpmn:BoundaryEvent',
    56,
    62,
    { eventDefinition: 'message', nonInterrupting: true },
    { parentId: BOUNDARY_HOST }
  ),
];

type FlowVariant = {
  caption: string;
  type: string;
  ends: [source: string, target: string];
  data?: BpmnEdgeData;
};

const FLOW_SPAN = 100;
const FLOW_PITCH = 210;

/** One labelled row of connected pairs, one pair per edge variant. */
function flowRow(index: number, title: string, variants: FlowVariant[]) {
  const y = GALLERY_TOP + index * ROW_GAP;
  const nodes: BpmnNode[] = [
    node(`Heading_${index}`, 'story:heading', 0, y + 10, { label: title }, { selectable: false }),
  ];
  const edges: BpmnEdge[] = [];
  variants.forEach(({ caption, type, ends, data }, i) => {
    const x = FIRST_COLUMN + i * FLOW_PITCH;
    const [sourceSize, targetSize] = ends.map(defaultSize) as [
      ReturnType<typeof defaultSize>,
      ReturnType<typeof defaultSize>,
    ];
    const centre = y + 25;
    const source = `FlowRow_${index}_${i}_source`;
    const target = `FlowRow_${index}_${i}_target`;
    nodes.push(
      node(
        source,
        ends[0],
        x,
        centre - sourceSize.height / 2,
        // An empty annotation is only a bracket, which reads as detached from its association.
        ends[0] === 'bpmn:TextAnnotation' ? { label: 'Annotation' } : {}
      ),
      node(target, ends[1], x + sourceSize.width + FLOW_SPAN, centre - targetSize.height / 2),
      node(
        `FlowRow_${index}_${i}_caption`,
        'story:caption',
        x,
        y + 62,
        { label: caption },
        { selectable: false, width: sourceSize.width + FLOW_SPAN + targetSize.width }
      )
    );
    edges.push(edge(`FlowRow_${index}_${i}`, type, [source, Right], [target, Left], data));
  });
  return { nodes, edges };
}

const EVENTS: FlowVariant['ends'] = ['bpmn:StartEvent', 'bpmn:EndEvent'];

const sequenceFlows = flowRow(8, 'Sequence flows', [
  { caption: 'Sequence flow', type: SEQUENCE, ends: EVENTS },
  {
    caption: 'Conditional',
    type: SEQUENCE,
    ends: EVENTS,
    data: { conditionExpression: 'approved' },
  },
  { caption: 'Default', type: SEQUENCE, ends: EVENTS, data: { defaultFlow: true } },
  { caption: 'With label', type: SEQUENCE, ends: EVENTS, data: { label: 'Yes' } },
  {
    caption: 'Multi-line label',
    type: SEQUENCE,
    ends: EVENTS,
    data: { label: 'Approved\nby manager' },
  },
  { caption: 'Added', type: SEQUENCE, ends: EVENTS, data: { modification: 'add' } },
  { caption: 'Updated', type: SEQUENCE, ends: EVENTS, data: { modification: 'update' } },
  { caption: 'Deleted', type: SEQUENCE, ends: EVENTS, data: { modification: 'delete' } },
]);

const otherFlows = flowRow(9, 'Messages and associations', [
  { caption: 'Message flow', type: 'bpmn:MessageFlow', ends: EVENTS },
  {
    caption: 'Message flow with label',
    type: 'bpmn:MessageFlow',
    ends: EVENTS,
    data: { label: 'Order' },
  },
  {
    caption: 'Data input association',
    type: 'bpmn:DataInputAssociation',
    ends: ['bpmn:DataObjectReference', 'bpmn:EndEvent'],
  },
  {
    caption: 'Data output association',
    type: 'bpmn:DataOutputAssociation',
    ends: ['bpmn:StartEvent', 'bpmn:DataObjectReference'],
  },
  // Last: the annotation is wider than the other endpoints.
  {
    caption: 'Association',
    type: 'bpmn:Association',
    ends: ['bpmn:TextAnnotation', 'bpmn:EndEvent'],
  },
]);

/** A worked collaboration, wired with sequence, message, data output and association flows. */
export const exampleDiagram: Diagram = {
  nodes: processNodes,
  edges: processEdges,
};

/**
 * The element kinds, event definitions, markers, states and edge variants, one per item in
 * labelled rows. Vertical and black-box pools, multiplicity, `labelPlacement` and
 * `associationDirection` are not shown.
 */
export const elementCatalog: Diagram = {
  nodes: [...galleryNodes, ...galleryBoundaryEvents, ...sequenceFlows.nodes, ...otherFlows.nodes],
  edges: [...sequenceFlows.edges, ...otherFlows.edges],
};

const withData = (data: (node: BpmnNode) => BpmnNodeData): BpmnNode[] =>
  processNodes.map((item) => ({ ...item, data: { ...item.data, ...data(item) } }));

// A connection dragged out of "Review order", over "Approved?". The host decides each state.
const CONNECTION_STATES: Record<string, BpmnConnectionState> = {
  Task_review: 'anchor',
  Gateway_approved: 'target-picked',
  Start_order: 'target',
  Task_remind: 'target',
  Task_reserve: 'target',
  End_rejected: 'target',
  Gateway_split: 'target',
  SubProcess_invoice: 'target',
  Data_orders: 'target',
  Annotation_hold: 'target',
  Participant_customer: 'target',
};

/** The example diagram while a connection is in progress: valid ends tinted, the rest faded. */
export const connectionDiagram: Diagram = {
  nodes: withData(({ id }) => ({ connectionState: CONNECTION_STATES[id] ?? 'unavailable' })),
  edges: processEdges.map((item) => ({ ...item, data: { ...item.data, dimmed: true } })),
};

const DROP_STATES: Record<string, BpmnDropState> = {
  [FULFIL]: 'valid',
  [SHIP]: 'valid',
  SubProcess_invoice: 'valid-border',
  Task_reserve: 'invalid',
  Gateway_approved: 'invalid',
  End_rejected: 'invalid',
  Participant_finance: 'invalid',
};

/** The example diagram with each state a dragged node can put on what it is over. */
export const dropDiagram: Diagram = {
  nodes: withData(({ id }) => ({ dropState: DROP_STATES[id] })),
  edges: processEdges,
};
