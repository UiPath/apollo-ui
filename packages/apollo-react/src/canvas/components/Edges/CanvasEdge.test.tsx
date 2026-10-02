import { fireEvent, render, screen } from '@testing-library/react';
import { Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BaseCanvasModeProvider } from '../BaseCanvas/BaseCanvasModeProvider';
import { CanvasEdge } from './CanvasEdge';
import type { CanvasEdgeProps } from './shared/types';

const {
  addSelectedEdges,
  capturedEdgePathProps,
  edgeLookup,
  getState,
  setState,
  unselectNodesAndEdges,
  useEdgeGeometry,
} = vi.hoisted(() => ({
  addSelectedEdges: vi.fn(),
  capturedEdgePathProps: {
    current: undefined as { color?: string; strokeStyle?: string } | undefined,
  },
  edgeLookup: new Map(),
  getState: vi.fn(),
  setState: vi.fn(),
  unselectNodesAndEdges: vi.fn(),
  useEdgeGeometry: vi.fn((_args: { autoRouted: boolean }) => ({
    arrow: { angle: 0, offset: 0 },
    edgePath: 'M 0 0 L 100 0',
    labelPoint: { x: 50, y: 0 },
    pathPoints: [],
    segments: [],
  })),
}));

vi.mock('@uipath/apollo-react/canvas/xyflow/react', async () => {
  const actual = await vi.importActual('@uipath/apollo-react/canvas/xyflow/react');
  return { ...actual, useStoreApi: () => ({ getState, setState }) };
});

vi.mock('./shared/hooks', () => ({
  useEdgeGeometry,
  useExecutionEdge: () => ({ animation: null, statusColor: undefined }),
  useNodeDragRebalance: ({ waypoints }: { waypoints: unknown[] }) => waypoints,
  useWaypointEditor: () => ({
    isDragging: false,
    segmentHandlers: {},
    waypointHandlers: {},
  }),
}));

vi.mock('../Toolbar', () => ({
  EdgeToolbar: () => null,
  useEdgeToolbarState: () => ({ showToolbar: false }),
}));

vi.mock('./shared/primitives', () => ({
  EdgeArrow: () => null,
  EdgeLabel: ({ text, onClick }: { text: string; onClick?: () => void }) => (
    <button type="button" onClick={onClick}>
      {text}
    </button>
  ),
  EdgePath: (props: { color?: string; strokeStyle?: string }) => {
    capturedEdgePathProps.current = props;
    return null;
  },
  SegmentDragHandle: () => null,
  WaypointHandle: () => null,
}));

const baseProps = {
  id: 'e1',
  source: 'a',
  target: 'b',
  sourcePosition: Position.Right,
  targetPosition: Position.Left,
  sourceX: 0,
  sourceY: 0,
  targetX: 100,
  targetY: 0,
  data: { label: 'Alpha' },
} as unknown as CanvasEdgeProps;

function renderEdge(
  mode: 'design' | 'readonly' = 'design',
  edge: { selected?: boolean; selectable?: boolean } = {},
  data: CanvasEdgeProps['data'] = baseProps.data
) {
  edgeLookup.set('e1', { id: 'e1', ...edge });
  getState.mockReturnValue({
    addSelectedEdges,
    edgeLookup,
    elementsSelectable: true,
    multiSelectionActive: false,
    unselectNodesAndEdges,
  });

  return render(
    <BaseCanvasModeProvider mode={mode}>
      <svg>
        <CanvasEdge {...baseProps} data={data} selected={edge.selected ?? false} />
      </svg>
    </BaseCanvasModeProvider>
  );
}

describe('CanvasEdge label selection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    edgeLookup.clear();
  });

  it('uses the xyflow selection action and closes an active node selection', () => {
    renderEdge();

    fireEvent.click(screen.getByRole('button', { name: 'Alpha' }));

    expect(setState).toHaveBeenCalledWith({ nodesSelectionActive: false });
    expect(addSelectedEdges).toHaveBeenCalledWith(['e1']);
  });

  it('toggles an already-selected edge when multi-selection is active', () => {
    renderEdge('design', { selected: true });

    getState.mockReturnValue({
      addSelectedEdges,
      edgeLookup,
      elementsSelectable: true,
      multiSelectionActive: true,
      unselectNodesAndEdges,
    });
    fireEvent.click(screen.getByRole('button', { name: 'Alpha' }));

    expect(unselectNodesAndEdges).toHaveBeenCalledWith({
      nodes: [],
      edges: [expect.objectContaining({ id: 'e1' })],
    });
  });

  it('does not select a label when the edge is not selectable', () => {
    renderEdge('design', { selectable: false });

    fireEvent.click(screen.getByRole('button', { name: 'Alpha' }));

    expect(addSelectedEdges).not.toHaveBeenCalled();
    expect(setState).not.toHaveBeenCalled();
  });

  it('does not attach label selection in read-only mode', () => {
    renderEdge('readonly');

    fireEvent.click(screen.getByRole('button', { name: 'Alpha' }));

    expect(addSelectedEdges).not.toHaveBeenCalled();
    expect(setState).not.toHaveBeenCalled();
  });
});

/**
 * `autoRouted` is what applies node-face clearance, so a host that persists both
 * route fields needs it to be a declared input rather than something inferred
 * from which key the route happened to land in.
 */
describe('CanvasEdge autoRouted', () => {
  const lastAutoRouted = () => useEdgeGeometry.mock.lastCall?.[0].autoRouted;

  beforeEach(() => {
    vi.clearAllMocks();
    edgeLookup.clear();
  });

  it('treats a route arriving in routedWaypoints as auto-routed', () => {
    renderEdge('design', {}, { routedWaypoints: [{ id: 'r0', x: 50, y: 20 }] });

    expect(lastAutoRouted()).toBe(true);
  });

  it('treats manual waypoints as not auto-routed', () => {
    renderEdge('design', {}, { waypoints: [{ id: 'w1', x: 50, y: 20 }] });

    expect(lastAutoRouted()).toBe(false);
  });

  it('honours an explicit flag over the field the route arrived in', () => {
    renderEdge('design', {}, { waypoints: [{ id: 'w1', x: 50, y: 20 }], autoRouted: true });

    expect(lastAutoRouted()).toBe(true);
  });

  it('honours an explicit false for a route stored in routedWaypoints', () => {
    renderEdge('design', {}, { routedWaypoints: [{ id: 'r0', x: 50, y: 20 }], autoRouted: false });

    expect(lastAutoRouted()).toBe(false);
  });
});

describe('CanvasEdge suggestionType', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    edgeLookup.clear();
    capturedEdgePathProps.current = undefined;
  });

  it('stamps data-suggestion-type on the edge group', () => {
    const { container } = renderEdge('design', {}, { suggestionType: 'update' });

    expect(container.querySelector('g[data-suggestion-type="update"]')).not.toBeNull();
  });

  it('omits data-suggestion-type when unset', () => {
    const { container } = renderEdge('design', {}, {});

    expect(container.querySelector('g[data-suggestion-type]')).toBeNull();
  });

  it('dashes the path for a delete suggestion', () => {
    renderEdge('design', {}, { suggestionType: 'delete' });

    expect(capturedEdgePathProps.current?.strokeStyle).toBe('dashed');
  });

  it('does not dash add/update suggestions', () => {
    renderEdge('design', {}, { suggestionType: 'add' });
    expect(capturedEdgePathProps.current?.strokeStyle).toBe('solid');

    renderEdge('design', {}, { suggestionType: 'update' });
    expect(capturedEdgePathProps.current?.strokeStyle).toBe('solid');
  });

  it('suggestionType overrides a stale legacy isDiffRemoved flag for dashing', () => {
    renderEdge('design', {}, { suggestionType: 'add', isDiffRemoved: true });

    expect(capturedEdgePathProps.current?.strokeStyle).toBe('solid');
  });

  it('falls back to the legacy isDiffRemoved flag when suggestionType is absent', () => {
    renderEdge('design', {}, { isDiffRemoved: true });

    expect(capturedEdgePathProps.current?.strokeStyle).toBe('dashed');
  });
});
