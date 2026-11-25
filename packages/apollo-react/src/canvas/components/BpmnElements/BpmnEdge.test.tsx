import {
  type EdgeProps,
  Position,
  ReactFlowProvider,
  useStoreApi,
} from '@uipath/apollo-react/canvas/xyflow/react';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '../../utils/testing';
import {
  type BpmnActions,
  BpmnActionsProvider,
  BpmnAssociationEdge,
  type BpmnEdge,
  type BpmnEdgeData,
  BpmnMessageFlowEdge,
  BpmnSequenceFlowEdge,
  BpmnStringsProvider,
} from '.';

// The shared setup mocks XYFlow; the edge is checked against the real store.
vi.unmock('@uipath/apollo-react/canvas/xyflow/react');

// The label portals into a container that only a mounted ReactFlow provides.
// The size the mocked label reports, as the real one measures itself.
let labelSize: { width: number; height: number } | undefined;
vi.mock('./BpmnEdgeLabel', () => ({
  BpmnEdgeLabel: ({
    x,
    y,
    text,
    dimmed,
    onSizeChange,
    onRename,
    onMove,
  }: {
    x: number;
    y: number;
    text?: string;
    dimmed?: boolean;
    onSizeChange?: (size: { width: number; height: number }) => void;
    onRename?: unknown;
    onMove?: unknown;
  }) => (
    <text
      ref={() => labelSize && onSizeChange?.(labelSize)}
      data-testid="bpmn-edge-label"
      data-x={x}
      data-y={y}
      data-editable={!!onRename || !!onMove}
      data-dimmed={dimmed}
    >
      {text}
    </text>
  ),
}));
vi.mock('../Toolbar/EdgeToolbar', () => ({
  EdgeToolbar: ({
    config,
    positioning,
    hoverBridge,
  }: {
    config: { actions: { id: string; label: string }[] };
    positioning: { offsetPosition: { x: number; y: number } };
    hoverBridge?: { side: string; size: number };
  }) => (
    <g
      data-testid="edge-toolbar"
      data-x={positioning.offsetPosition.x}
      data-y={positioning.offsetPosition.y}
      data-bridge={hoverBridge && `${hoverBridge.side} ${hoverBridge.size}`}
    >
      {config.actions.map((action) => (
        <text key={action.id}>{action.label}</text>
      ))}
    </g>
  ),
}));

const setWaypoints = vi.fn();
const baseActions = {
  addAfter: vi.fn(),
  deleteNode: vi.fn(),
  rename: vi.fn(),
  deleteEdge: vi.fn(),
  setWaypoints,
} satisfies BpmnActions;

// A 100x80 task at the origin flowing right into another at x=220: the handle anchors are the
// centres of the facing sides.
const edgeProps = (data: BpmnEdgeData = {}, extra: Partial<EdgeProps<BpmnEdge>> = {}) =>
  ({
    id: 'flow',
    source: 'a',
    target: 'b',
    sourceX: 100,
    sourceY: 40,
    sourcePosition: Position.Right,
    targetX: 220,
    targetY: 40,
    targetPosition: Position.Left,
    data,
    ...extra,
  }) as EdgeProps<BpmnEdge>;

let store: ReturnType<typeof useStoreApi>;
function StoreProbe() {
  store = useStoreApi();
  return null;
}

const tree = (
  props: EdgeProps<BpmnEdge>,
  {
    actions = baseActions,
    strings,
    Flow = BpmnSequenceFlowEdge,
  }: {
    actions?: BpmnActions;
    strings?: React.ComponentProps<typeof BpmnStringsProvider>['strings'];
    Flow?: typeof BpmnSequenceFlowEdge;
  } = {}
) => (
  <ReactFlowProvider>
    <StoreProbe />
    <BpmnStringsProvider strings={strings}>
      <BpmnActionsProvider value={actions}>
        <svg>
          <Flow {...props} />
        </svg>
      </BpmnActionsProvider>
    </BpmnStringsProvider>
  </ReactFlowProvider>
);

/** Marks `node` as dragged or dropped, with `children` placed inside it. */
const drag = (node: string, dragging: boolean, children: string[] = []) =>
  act(() =>
    store.setState({
      nodeLookup: new Map<string, object>([
        ...children.map((id) => [id, { parentId: node, dragging: false }] as const),
        [node, { dragging }],
      ]) as never,
    })
  );

type Vertex = [number, number];
const path = () => document.querySelector('.react-flow__edge-path') as SVGPathElement;
const arrow = () => document.querySelector('[data-bpmn-arrow]') as SVGPathElement;
/** An arrowhead's vertices: one wing, the tip, the other wing. */
const vertices = (head: Element) =>
  [
    ...(head.getAttribute('d') ?? head.getAttribute('points')!).matchAll(/(-?[\d.]+),(-?[\d.]+)/g),
  ].map((match) => [Number(match[1]), Number(match[2])] as Vertex);
/** The direction from the tip back to the middle of the wings, i.e. back along the flow. */
const backAngle = (head: Element) => {
  const [wing, tip, other] = vertices(head) as [Vertex, Vertex, Vertex];
  return Math.atan2((wing[1] + other[1]) / 2 - tip[1], (wing[0] + other[0]) / 2 - tip[0]);
};
const reconnect = (end: 'source' | 'target') =>
  document.querySelector(`[data-bpmn-reconnect="${end}"]`) as SVGCircleElement;

// Docks a quarter of the way down the facing sides, not at their centres.
const OFF_CENTRE = [
  { x: 100, y: 20 },
  { x: 160, y: 20 },
  { x: 160, y: 60 },
  { x: 220, y: 60 },
];

beforeEach(() => {
  setWaypoints.mockReset();
});

it.each([
  ['a sequence flow', BpmnSequenceFlowEdge, {}, '[data-bpmn-arrow="filled"]', true],
  ['a message flow', BpmnMessageFlowEdge, {}, '[data-bpmn-arrow="hollow"]', false],
  [
    'an association',
    BpmnAssociationEdge,
    { associationDirection: 'one' },
    '[data-bpmn-open-arrow]',
    false,
  ],
] as const)('ends %s on an arrowhead 8 long and 12 wide, with round 2px corners', (_, Flow, data, selector, filled) => {
  render(tree(edgeProps(data), { Flow }));

  const head = document.querySelector(selector)!;
  expect(vertices(head)).toEqual([
    [212, 34],
    [220, 40],
    [212, 46],
  ]);
  expect(path().getAttribute('d')).toMatch(/220[ ,]40$/);
  expect(head).toHaveAttribute('stroke-width', '2');
  expect(head).toHaveAttribute('stroke-linejoin', 'round');
  expect(head).toHaveAttribute('stroke-linecap', 'round');
  expect(head.getAttribute('fill') === head.getAttribute('stroke')).toBe(filled);
});

describe('BPMN sequence flow', () => {
  it('sets its stroke width inline, so a host stylesheet rule on the path cannot thin it', () => {
    const { rerender } = render(tree(edgeProps()));
    expect(path().style.strokeWidth).toBe('2');

    rerender(tree(edgeProps({}, { selected: true })));
    expect(path().style.strokeWidth).toBe('4');
  });

  it('fades when dimmed, leaving the pointer and dropping its toolbar', () => {
    const { rerender } = render(tree(edgeProps({}, { selected: true })));
    expect(document.querySelector('[data-dimmed]')).toBeNull();
    expect(screen.getByTestId('edge-toolbar')).toBeInTheDocument();

    rerender(tree(edgeProps({ dimmed: true, label: 'Yes' }, { selected: true })));
    const group = document.querySelector('g[data-dimmed]')!;
    expect(group.getAttribute('class')).toContain('opacity-30');
    expect(group.getAttribute('class')).toContain('pointer-events-none');
    expect(screen.queryByTestId('edge-toolbar')).toBeNull();
    expect(screen.getByTestId('bpmn-edge-label')).toHaveAttribute('data-dimmed', 'true');
  });

  describe('label', () => {
    it('sits at the middle of the path by default', () => {
      render(tree(edgeProps({ label: 'Yes' })));

      expect(screen.getByTestId('bpmn-edge-label')).toHaveAttribute('data-x', '160');
      expect(screen.getByTestId('bpmn-edge-label')).toHaveAttribute('data-y', '40');
    });

    it('sits at data.labelPosition when given', () => {
      render(tree(edgeProps({ label: 'Yes', labelPosition: { x: 130, y: 12 } })));

      expect(screen.getByTestId('bpmn-edge-label')).toHaveAttribute('data-x', '130');
      expect(screen.getByTestId('bpmn-edge-label')).toHaveAttribute('data-y', '12');
    });
  });

  describe('host-edited label', () => {
    it('leaves the label read-only unless the host renames or moves labels', () => {
      render(tree(edgeProps({ label: 'Yes' }, { selected: true })));

      expect(screen.getByTestId('bpmn-edge-label')).toHaveAttribute('data-editable', 'false');
    });

    it.each([
      'renameEdge',
      'moveEdgeLabel',
    ] as const)('makes the label editable with %s', (name) => {
      render(
        tree(edgeProps({ label: 'Yes', labelPosition: { x: 130, y: 12 } }), {
          actions: { ...baseActions, [name]: vi.fn() },
        })
      );

      expect(screen.getByTestId('bpmn-edge-label')).toHaveAttribute('data-editable', 'true');
    });

    it('offers a placeholder on a selected flow with no label only when the host renames', () => {
      const renaming = { actions: { ...baseActions, renameEdge: vi.fn() } };
      const { rerender } = render(tree(edgeProps(), renaming));
      expect(screen.queryByTestId('bpmn-edge-label')).not.toBeInTheDocument();

      rerender(tree(edgeProps({}, { selected: true }), renaming));
      expect(screen.getByTestId('bpmn-edge-label')).toHaveAttribute('data-x', '160');

      rerender(
        tree(edgeProps({}, { selected: true }), {
          actions: { ...baseActions, moveEdgeLabel: vi.fn() },
        })
      );
      expect(screen.queryByTestId('bpmn-edge-label')).not.toBeInTheDocument();
    });
  });

  describe('stored route', () => {
    it('runs between the handle anchors when nothing is stored', () => {
      render(tree(edgeProps()));

      expect(path().getAttribute('d')).toBe('M 100 40 L 220 40');
      expect(vertices(arrow())[1]).toEqual([220, 40]);
    });

    it('passes through the stored vertices in order, off-centre docks included', () => {
      render(tree(edgeProps({ waypoints: OFF_CENTRE })));

      const d = path().getAttribute('d')!;
      expect(d).toMatch(/^M 100 20 L /);
      expect(d).toMatch(/ L 220 60$/);
      // Each bend is the control point of its rounded corner.
      expect(d).toContain('Q 160 20 ');
      expect(d).toContain('Q 160 60 ');
      expect(d.match(/Q /g)).toHaveLength(2);
      expect(vertices(arrow())[1]).toEqual([220, 60]);
    });

    it('keeps a stored route that is not orthogonal, and points the arrow along it', () => {
      const waypoints = [
        { x: 100, y: 20 },
        { x: 220, y: 60 },
      ];
      render(tree(edgeProps({ waypoints })));

      expect(path().getAttribute('d')).toBe('M 100 20 L 220 60');
      expect(vertices(arrow())[1]).toEqual([220, 60]);
      expect(backAngle(arrow())).toBeCloseTo(Math.atan2(20 - 60, 100 - 220));
    });

    it('starts the source marker along the first stored segment', () => {
      const waypoints = [
        { x: 60, y: 80 },
        { x: 60, y: 140 },
        { x: 220, y: 140 },
      ];
      render(tree(edgeProps({ waypoints, conditionExpression: 'x' })));

      // The conditional diamond leaves the dock downwards, not to the handle's right.
      const marker = document.querySelector('polygon')!.getAttribute('points')!;
      expect(marker.split(' ')[0]).toBe('60,80');
      expect(marker.split(' ')[2]).toBe('60,94');
    });

    it('moves a dock with its node until the host stores the next route', () => {
      const { rerender } = render(tree(edgeProps({ waypoints: OFF_CENTRE })));

      rerender(tree(edgeProps({ waypoints: OFF_CENTRE }, { sourceX: 110, sourceY: 45 })));

      expect(path().getAttribute('d')).toMatch(/^M 110 25 L /);
    });

    it('stores the whole polyline, docks included, when a bend is removed', () => {
      render(tree(edgeProps({ waypoints: OFF_CENTRE }, { selected: true })));

      // The first circle drawn is the first bend's handle.
      fireEvent.doubleClick(document.querySelector('circle')!);

      expect(setWaypoints).toHaveBeenCalledTimes(1);
      const [edgeId, stored] = setWaypoints.mock.calls[0]!;
      expect(edgeId).toBe('flow');
      expect(stored[0]).toEqual({ x: 100, y: 20 });
      expect(stored[stored.length - 1]).toEqual({ x: 220, y: 60 });
      expect(stored.length).toBeGreaterThan(2);
    });

    it('stores the route again once a connected node stops being dragged', () => {
      const { rerender } = render(tree(edgeProps({ waypoints: OFF_CENTRE })));

      drag('a', true);
      rerender(tree(edgeProps({ waypoints: OFF_CENTRE }, { sourceX: 100, sourceY: 70 })));
      expect(setWaypoints).not.toHaveBeenCalled();

      drag('a', false);
      expect(setWaypoints).toHaveBeenCalledTimes(1);
      const stored = setWaypoints.mock.calls[0]![1];
      expect(stored[0]).toEqual({ x: 100, y: 50 });
      expect(stored[stored.length - 1]).toEqual({ x: 220, y: 60 });
    });

    it('stores the route once a parent of an end stops being dragged', () => {
      const { rerender } = render(tree(edgeProps({ waypoints: OFF_CENTRE })));

      drag('pool', true, ['a']);
      rerender(tree(edgeProps({ waypoints: OFF_CENTRE }, { sourceX: 100, sourceY: 70 })));
      expect(setWaypoints).not.toHaveBeenCalled();

      drag('pool', false, ['a']);
      expect(setWaypoints).toHaveBeenCalledTimes(1);
      expect(setWaypoints.mock.calls[0]![1][0]).toEqual({ x: 100, y: 50 });
    });

    it('moves the whole route with a pool that holds both ends', () => {
      const { rerender } = render(tree(edgeProps({ waypoints: OFF_CENTRE })));

      drag('pool', true, ['a', 'b']);
      rerender(tree(edgeProps({ waypoints: OFF_CENTRE }, { sourceY: 70, targetY: 70 })));
      drag('pool', false, ['a', 'b']);

      expect(setWaypoints).toHaveBeenCalledTimes(1);
      expect(setWaypoints.mock.calls[0]![1]).toEqual(
        OFF_CENTRE.map(({ x, y }) => ({ x, y: y + 30 }))
      );
    });

    it('stores the route when an end moves without a drag, as a keyboard nudge does', () => {
      const { rerender } = render(tree(edgeProps({ waypoints: OFF_CENTRE })));

      rerender(tree(edgeProps({ waypoints: OFF_CENTRE }, { sourceX: 100, sourceY: 70 })));

      expect(setWaypoints).toHaveBeenCalledTimes(1);
      expect(setWaypoints.mock.calls[0]![1][0]).toEqual({ x: 100, y: 50 });
    });

    it('stores a moved route once, while the host has yet to apply it', () => {
      const { rerender } = render(tree(edgeProps({ waypoints: OFF_CENTRE })));
      const moved = edgeProps({ waypoints: OFF_CENTRE }, { sourceX: 100, sourceY: 70 });

      rerender(tree(moved));
      rerender(tree({ ...moved }));

      expect(setWaypoints).toHaveBeenCalledTimes(1);
    });

    it('stores a repeated move again once the host applied and undid the first', () => {
      const moved = { sourceX: 100, sourceY: 70 };
      const { rerender } = render(tree(edgeProps({ waypoints: OFF_CENTRE })));
      rerender(tree(edgeProps({ waypoints: OFF_CENTRE }, moved)));
      const applied = setWaypoints.mock.calls[0]![1];

      // The host applies the route, then undoes both the move and the route.
      rerender(tree(edgeProps({ waypoints: applied }, moved)));
      rerender(tree(edgeProps({ waypoints: OFF_CENTRE })));
      rerender(tree(edgeProps({ waypoints: OFF_CENTRE }, moved)));

      expect(setWaypoints).toHaveBeenCalledTimes(2);
    });

    it('draws a moved route through fresh docks, not the stale stored bends', () => {
      const { rerender } = render(tree(edgeProps({ waypoints: OFF_CENTRE })));

      rerender(tree(edgeProps({ waypoints: OFF_CENTRE }, { sourceX: 100, sourceY: 70 })));

      // Verbatim, it would run diagonally from the moved dock to the stored first bend.
      expect(path().getAttribute('d')).toMatch(/^M 100 50 L [\d.]+ 50 /);
    });

    describe('for a selected flow with bends', () => {
      const dragSource = (to: { sourceX: number; sourceY: number }) => {
        const route = { waypoints: OFF_CENTRE };
        const { rerender } = render(tree(edgeProps(route, { selected: true })));
        drag('a', true);
        rerender(tree(edgeProps(route, { selected: true, ...to })));
        drag('a', false);
      };

      it('stores the moved dock when the drag leaves the bends where they are', () => {
        // Along the right-hand dock's own axis, so the bends do not follow.
        dragSource({ sourceX: 130, sourceY: 40 });

        expect(setWaypoints).toHaveBeenCalledTimes(1);
        const stored = setWaypoints.mock.calls[0]![1];
        expect(stored[0]).toEqual({ x: 130, y: 20 });
        expect(stored).toContainEqual({ x: 160, y: 20 });
        expect(stored[stored.length - 1]).toEqual({ x: 220, y: 60 });
      });

      it('stores the bends that followed the node once, and nothing over them', () => {
        // Across the dock's axis, so the first bend follows the node down.
        dragSource({ sourceX: 100, sourceY: 70 });

        expect(setWaypoints).toHaveBeenCalledTimes(1);
        const stored = setWaypoints.mock.calls[0]![1];
        expect(stored[0]).toEqual({ x: 100, y: 50 });
        expect(stored).toContainEqual({ x: 160, y: 50 });
      });
    });
  });

  describe('reconnect handles', () => {
    it('are left out unless the host can reconnect and the flow is selected', () => {
      const { rerender } = render(tree(edgeProps({}, { selected: true })));
      expect(reconnect('source')).toBeNull();

      rerender(tree(edgeProps(), { actions: { ...baseActions, startReconnect: vi.fn() } }));
      expect(reconnect('source')).toBeNull();
    });

    it('sit on both ends and hand the press to the host', () => {
      const startReconnect = vi.fn();
      const onMouseDown = vi.fn();
      render(
        <div onMouseDown={onMouseDown}>
          {tree(edgeProps({ waypoints: OFF_CENTRE }, { selected: true }), {
            actions: { ...baseActions, startReconnect },
          })}
        </div>
      );

      expect(reconnect('source')).toHaveAttribute('cx', '100');
      expect(reconnect('source')).toHaveAttribute('cy', '20');
      expect(reconnect('target')).toHaveAttribute('cx', '220');
      expect(reconnect('target')).toHaveClass('nodrag', 'nopan');

      fireEvent.mouseDown(reconnect('target'));
      expect(startReconnect).toHaveBeenCalledWith('flow', 'target', expect.anything());
      expect(onMouseDown).not.toHaveBeenCalled();
    });
  });

  describe('toolbar placement', () => {
    const toolbar = () => screen.getByTestId('edge-toolbar');
    const at = () => [Number(toolbar().dataset.x), Number(toolbar().dataset.y)];
    afterEach(() => {
      labelSize = undefined;
    });

    it('sits above the path midpoint with no label, bridged down to the path', () => {
      render(tree(edgeProps({}, { selected: true })));

      expect(at()).toEqual([160, 16]);
      expect(toolbar().dataset.bridge).toBe('bottom 8');
    });

    it('moves just above a label that would sit under it', () => {
      labelSize = { width: 40, height: 20 };
      render(tree(edgeProps({ label: 'Yes' }, { selected: true })));

      // Label centre 40, top 30; 4px gap; half the 28px toolbar.
      expect(at()).toEqual([160, 12]);
      expect(toolbar().dataset.bridge).toBe('bottom 8');
    });

    it('rises with a label that runs to several lines', () => {
      labelSize = { width: 40, height: 52 };
      render(tree(edgeProps({ label: 'Approved\nby manager' }, { selected: true })));

      expect(at()).toEqual([160, -4]);
    });

    it('stays on the path when the label was moved out of its way', () => {
      labelSize = { width: 40, height: 20 };
      render(
        tree(edgeProps({ label: 'Yes', labelPosition: { x: 160, y: 120 } }, { selected: true }))
      );

      expect(at()).toEqual([160, 16]);
    });
  });

  describe('toolbar', () => {
    const inserting = { ...baseActions, insertOnEdge: vi.fn() };

    it('offers to add an element only when the host can insert on a flow', () => {
      const { rerender } = render(tree(edgeProps({}, { selected: true })));
      expect(screen.getByTestId('edge-toolbar')).toHaveTextContent(/^Delete$/);

      rerender(tree(edgeProps({}, { selected: true }), { actions: inserting }));
      expect(screen.getByTestId('edge-toolbar')).toHaveTextContent('Add elementDelete');
    });

    it("uses the host's strings", () => {
      render(
        tree(edgeProps({}, { selected: true }), {
          actions: inserting,
          strings: { delete: 'Löschen' },
        })
      );

      expect(screen.getByTestId('edge-toolbar')).toHaveTextContent('Add elementLöschen');
    });
  });
});

describe('BPMN association', () => {
  const chevrons = () => [...document.querySelectorAll('[data-bpmn-open-arrow]')];
  const tips = () => chevrons().map((chevron) => vertices(chevron)[1]);
  const association = (data: BpmnEdgeData) =>
    render(tree(edgeProps(data), { Flow: BpmnAssociationEdge }));

  it('has no arrowhead by default', () => {
    association({});
    expect(chevrons()).toEqual([]);
  });

  it('points an open chevron at the target for one direction', () => {
    association({ associationDirection: 'one' });
    expect(tips()).toEqual([[220, 40]]);
  });

  it('points one at each end for both directions', () => {
    association({ associationDirection: 'both' });
    expect(tips()).toEqual([
      [220, 40],
      [100, 40],
    ]);
  });

  it('aims each end of a bent association along the segment that meets it', () => {
    association({
      associationDirection: 'both',
      waypoints: [
        { x: 100, y: 40 },
        { x: 160, y: 0 },
        { x: 220, y: 40 },
      ],
    });

    // Target end: back towards the bend, up and left. Source end: towards the bend, up and right.
    const [target, source] = chevrons().map(backAngle);
    expect(target).toBeCloseTo(Math.atan2(-40, -60));
    expect(source).toBeCloseTo(Math.atan2(-40, 60));
  });

  it('draws an association through its stored docks and bends', () => {
    association({
      waypoints: [
        { x: 100, y: 30 },
        { x: 160, y: 10 },
        { x: 220, y: 50 },
      ],
    });

    expect(path().getAttribute('d')).toBe('M100,30 L160,10 L220,50');
  });
});
