import {
  type EdgeProps,
  Position,
  ReactFlowProvider,
  useStoreApi,
} from '@uipath/apollo-react/canvas/xyflow/react';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

// Both portal into containers that only a mounted ReactFlow provides.
vi.mock('../Edges/shared/primitives', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../Edges/shared/primitives')>()),
  EdgeLabel: ({ x, y, text }: { x: number; y: number; text: string }) => (
    <text data-testid="edge-label" data-x={x} data-y={y}>
      {text}
    </text>
  ),
}));
vi.mock('./BpmnEdgeLabel', () => ({
  BpmnEdgeLabel: ({ x, y, text }: { x: number; y: number; text?: string }) => (
    <text data-testid="bpmn-edge-label" data-x={x} data-y={y}>
      {text}
    </text>
  ),
}));
vi.mock('../Toolbar/EdgeToolbar', () => ({
  EdgeToolbar: ({ config }: { config: { actions: { id: string; label: string }[] } }) => (
    <g data-testid="edge-toolbar">
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
  actions: BpmnActions = baseActions,
  strings?: React.ComponentProps<typeof BpmnStringsProvider>['strings'],
  Flow: typeof BpmnSequenceFlowEdge = BpmnSequenceFlowEdge
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

const path = () => document.querySelector('.react-flow__edge-path') as SVGPathElement;
const arrow = () => document.querySelector('[data-bpmn-arrow]') as SVGPathElement;
/** The arrowhead's vertices: one wing, the tip, the other wing. */
const arrowVertices = () =>
  [
    ...arrow()
      .getAttribute('d')!
      .matchAll(/(-?[\d.]+),(-?[\d.]+)/g),
  ].map((match) => [Number(match[1]), Number(match[2])] as [number, number]);
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

describe('BPMN sequence flow', () => {
  describe('stroke width', () => {
    it('is set inline so a host stylesheet rule on the path cannot thin it', () => {
      const { rerender } = render(tree(edgeProps()));
      expect(path().style.strokeWidth).toBe('2');

      rerender(tree(edgeProps({}, { selected: true })));
      expect(path().style.strokeWidth).toBe('4');
    });
  });

  describe('arrowhead', () => {
    it('is a triangle 8 long and 12 wide with its tip on the end of the path', () => {
      render(tree(edgeProps()));

      expect(arrowVertices()).toEqual([
        [212, 34],
        [220, 40],
        [212, 46],
      ]);
      expect(path().getAttribute('d')).toMatch(/220[ ,]40$/);
    });

    it('rounds its corners with a 2px stroke in the flow colour', () => {
      render(tree(edgeProps()));

      expect(arrow().dataset.bpmnArrow).toBe('filled');
      expect(arrow().getAttribute('stroke-linejoin')).toBe('round');
      expect(arrow().getAttribute('stroke-width')).toBe('2');
      expect(arrow().getAttribute('fill')).toBe(arrow().getAttribute('stroke'));
    });

    it('keeps the size and the round joins on a message flow, unfilled', () => {
      render(tree(edgeProps(), baseActions, undefined, BpmnMessageFlowEdge));

      expect(arrow().dataset.bpmnArrow).toBe('hollow');
      expect(arrowVertices()).toEqual([
        [212, 34],
        [220, 40],
        [212, 46],
      ]);
      expect(arrow().getAttribute('stroke-linejoin')).toBe('round');
      expect(arrow().getAttribute('fill')).not.toBe(arrow().getAttribute('stroke'));
    });
  });

  describe('label', () => {
    it('sits at the middle of the path by default', () => {
      render(tree(edgeProps({ label: 'Yes' })));

      expect(screen.getByTestId('edge-label')).toHaveAttribute('data-x', '160');
      expect(screen.getByTestId('edge-label')).toHaveAttribute('data-y', '40');
    });

    it('sits at data.labelPosition when given', () => {
      render(tree(edgeProps({ label: 'Yes', labelPosition: { x: 130, y: 12 } })));

      expect(screen.getByTestId('edge-label')).toHaveAttribute('data-x', '130');
      expect(screen.getByTestId('edge-label')).toHaveAttribute('data-y', '12');
    });
  });

  describe('host-edited label', () => {
    it('keeps the plain label unless the host renames or moves labels', () => {
      render(tree(edgeProps({ label: 'Yes' }, { selected: true })));

      expect(screen.getByTestId('edge-label')).toBeInTheDocument();
      expect(screen.queryByTestId('bpmn-edge-label')).not.toBeInTheDocument();
    });

    it.each(['renameEdge', 'moveEdgeLabel'] as const)('uses the editable label with %s', (name) => {
      render(
        tree(edgeProps({ label: 'Yes', labelPosition: { x: 130, y: 12 } }), {
          ...baseActions,
          [name]: vi.fn(),
        })
      );

      expect(screen.queryByTestId('edge-label')).not.toBeInTheDocument();
      expect(screen.getByTestId('bpmn-edge-label')).toHaveAttribute('data-x', '130');
    });

    it('offers a placeholder on a selected flow with no label only when the host renames', () => {
      const renaming = { ...baseActions, renameEdge: vi.fn() };
      const { rerender } = render(tree(edgeProps(), renaming));
      expect(screen.queryByTestId('bpmn-edge-label')).not.toBeInTheDocument();

      rerender(tree(edgeProps({}, { selected: true }), renaming));
      expect(screen.getByTestId('bpmn-edge-label')).toHaveAttribute('data-x', '160');

      rerender(tree(edgeProps({}, { selected: true }), { ...baseActions, moveEdgeLabel: vi.fn() }));
      expect(screen.queryByTestId('bpmn-edge-label')).not.toBeInTheDocument();
    });
  });

  describe('stored route', () => {
    it('runs between the handle anchors when nothing is stored', () => {
      render(tree(edgeProps()));

      expect(path().getAttribute('d')).toBe('M 100 40 L 220 40');
      expect(arrowVertices()[1]).toEqual([220, 40]);
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
      expect(arrowVertices()[1]).toEqual([220, 60]);
    });

    it('keeps a stored route that is not orthogonal, and points the arrow along it', () => {
      const waypoints = [
        { x: 100, y: 20 },
        { x: 220, y: 60 },
      ];
      render(tree(edgeProps({ waypoints })));

      expect(path().getAttribute('d')).toBe('M 100 20 L 220 60');
      const [left, tip, right] = arrowVertices();
      expect(tip).toEqual([220, 60]);
      // The arrow's axis runs back along the last segment.
      const back = Math.atan2((left![1] + right![1]) / 2 - 60, (left![0] + right![0]) / 2 - 220);
      expect(back).toBeCloseTo(Math.atan2(20 - 60, 100 - 220));
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
      const drag = (dragging: boolean) =>
        act(() =>
          store.setState({
            nodeLookup: new Map([['a', { dragging }]]) as never,
          })
        );

      drag(true);
      rerender(tree(edgeProps({ waypoints: OFF_CENTRE }, { sourceX: 100, sourceY: 70 })));
      expect(setWaypoints).not.toHaveBeenCalled();

      drag(false);
      expect(setWaypoints).toHaveBeenCalledTimes(1);
      const stored = setWaypoints.mock.calls[0]![1];
      expect(stored[0]).toEqual({ x: 100, y: 50 });
      expect(stored[stored.length - 1]).toEqual({ x: 220, y: 60 });
    });
  });

  describe('reconnect handles', () => {
    it('are left out unless the host can reconnect and the flow is selected', () => {
      const { rerender } = render(tree(edgeProps({}, { selected: true })));
      expect(reconnect('source')).toBeNull();

      rerender(tree(edgeProps(), { ...baseActions, startReconnect: vi.fn() }));
      expect(reconnect('source')).toBeNull();
    });

    it('sit on both ends and hand the press to the host', () => {
      const startReconnect = vi.fn();
      const onMouseDown = vi.fn();
      render(
        <div onMouseDown={onMouseDown}>
          {tree(edgeProps({ waypoints: OFF_CENTRE }, { selected: true }), {
            ...baseActions,
            startReconnect,
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

  describe('toolbar', () => {
    it('offers to add an element only when the host can insert on a flow', () => {
      const { rerender } = render(tree(edgeProps({}, { selected: true })));
      expect(screen.getByTestId('edge-toolbar')).toHaveTextContent(/^Delete$/);

      rerender(tree(edgeProps({}, { selected: true }), { ...baseActions, insertOnEdge: vi.fn() }));
      expect(screen.getByTestId('edge-toolbar')).toHaveTextContent('Add elementDelete');
    });

    it("uses the host's strings", () => {
      render(
        tree(
          edgeProps({}, { selected: true }),
          { ...baseActions, insertOnEdge: vi.fn() },
          { delete: 'Löschen' }
        )
      );

      expect(screen.getByTestId('edge-toolbar')).toHaveTextContent('Add elementLöschen');
    });
  });
});

describe('BPMN association', () => {
  const chevrons = () =>
    [...document.querySelectorAll('[data-bpmn-open-arrow]')].map(
      (chevron) => chevron.getAttribute('points')?.split(' ')[1]
    );
  const association = (data: BpmnEdgeData) =>
    render(tree(edgeProps(data), baseActions, undefined, BpmnAssociationEdge));

  it('has no arrowhead by default', () => {
    association({});
    expect(chevrons()).toEqual([]);
  });

  it('points an open chevron at the target for one direction', () => {
    association({ associationDirection: 'one' });
    expect(chevrons()).toEqual(['220,40']);
  });

  it('draws the chevron at the arrowhead size with round caps and joins', () => {
    association({ associationDirection: 'one' });
    const chevron = document.querySelector('[data-bpmn-open-arrow]')!;
    expect(chevron.getAttribute('points')).toBe('212,34 220,40 212,46');
    expect(chevron.getAttribute('stroke-linecap')).toBe('round');
    expect(chevron.getAttribute('stroke-linejoin')).toBe('round');
  });

  it('points one at each end for both directions', () => {
    association({ associationDirection: 'both' });
    expect(chevrons()).toEqual(['220,40', '100,40']);
  });
});
