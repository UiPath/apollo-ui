import { Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { ValidationErrorSeverity } from '../../types/validation';
import { BPMN_GATEWAY_TYPES, BPMN_TASK_TYPES } from './BpmnNodes';
import {
  type BpmnEdge,
  type BpmnEdgeData,
  type BpmnEventDefinition,
  type BpmnNode,
  type BpmnNodeData,
  handleId,
} from './bpmnSpike.model';

const { Left, Right, Top, Bottom } = Position;

/** Default sizes, as PO.Frontend's type registry declares them. */
export function defaultSize(type: string) {
  if (type.endsWith('Event')) return { width: 36, height: 36 };
  if (type.endsWith('Gateway')) return { width: 50, height: 50 };
  if (type === 'bpmn:DataStoreReference') return { width: 50, height: 50 };
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
    sourceHandle: handleId(source, 'source', sourceSide),
    targetHandle: handleId(target, 'target', targetSide),
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

/** A small collaboration: three pools, two lanes, every edge kind, a boundary event, sub-processes. */
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
    { label: 'Fulfilment' },
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
  node('Gateway_approved', 'bpmn:ExclusiveGateway', 440, 65, { label: 'Approved?' }, inside(SALES)),
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
    447,
    212,
    { label: 'Rejected', eventDefinition: 'error' },
    inside(SALES)
  ),
  node('Data_orders', 'bpmn:DataStoreReference', 840, 65, { label: 'Orders' }, inside(SALES)),
  node(
    'Annotation_hold',
    'bpmn:TextAnnotation',
    990,
    70,
    { label: 'Stock is held for 24 hours' },
    inside(SALES)
  ),

  node('Gateway_split', 'bpmn:ParallelGateway', 110, 105, {}, inside(FULFIL)),
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
  node('Gateway_join', 'bpmn:ParallelGateway', 450, 105, {}, inside(FULFIL)),
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
    node(`Heading_${index}`, 'spike:heading', 0, y + 10, { label: title }, { selectable: false }),
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
  definitions.map((eventDefinition) => [
    type,
    { ...data, eventDefinition, label: eventDefinition ?? 'none' },
  ]);

const TASK_NAMES = [
  'Task',
  'User',
  'Service',
  'Script',
  'Send',
  'Receive',
  'Manual',
  'Business rule',
];
const GATEWAY_NAMES = ['Exclusive', 'Parallel', 'Inclusive', 'Complex', 'Event-based'];

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
    BPMN_GATEWAY_TYPES.map((type, i): Item => [type, { label: GATEWAY_NAMES[i] }])
  ),
  ...row(
    4,
    'Tasks',
    [
      ...BPMN_TASK_TYPES.map((type, i): Item => [type, { label: TASK_NAMES[i] }]),
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
      ['bpmn:UserTask', { label: 'Boundary' }],
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

/** Two boundary events on the gallery's "Boundary events" task. */
const galleryBoundaryEvents: BpmnNode[] = [
  node(
    'Gallery_boundary_timer',
    'bpmn:BoundaryEvent',
    12,
    62,
    { eventDefinition: 'timer' },
    { parentId: 'Gallery_5_5' }
  ),
  node(
    'Gallery_boundary_error',
    'bpmn:BoundaryEvent',
    56,
    62,
    { eventDefinition: 'message', nonInterrupting: true },
    {
      parentId: 'Gallery_5_5',
    }
  ),
];

/** A worked collaboration, wired with every edge kind. */
export const exampleDiagram: { nodes: BpmnNode[]; edges: BpmnEdge[] } = {
  nodes: processNodes,
  edges: processEdges,
};

/** Every element and state on its own, in labelled rows. */
export const elementCatalog: { nodes: BpmnNode[]; edges: BpmnEdge[] } = {
  nodes: [...galleryNodes, ...galleryBoundaryEvents],
  edges: [],
};
