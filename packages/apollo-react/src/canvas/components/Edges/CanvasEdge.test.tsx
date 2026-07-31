import { fireEvent, render, screen } from '@testing-library/react';
import { Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BaseCanvasModeProvider } from '../BaseCanvas/BaseCanvasModeProvider';
import { CanvasEdge } from './CanvasEdge';
import type { CanvasEdgeProps } from './shared/types';

const { addSelectedEdges, edgeLookup, getState, setState, unselectNodesAndEdges } = vi.hoisted(
  () => ({
    addSelectedEdges: vi.fn(),
    edgeLookup: new Map(),
    getState: vi.fn(),
    setState: vi.fn(),
    unselectNodesAndEdges: vi.fn(),
  })
);

vi.mock('@uipath/apollo-react/canvas/xyflow/react', async () => {
  const actual = await vi.importActual('@uipath/apollo-react/canvas/xyflow/react');
  return { ...actual, useStoreApi: () => ({ getState, setState }) };
});

vi.mock('./shared/hooks', () => ({
  useEdgeGeometry: () => ({
    arrow: { angle: 0, offset: 0 },
    edgePath: 'M 0 0 L 100 0',
    labelPoint: { x: 50, y: 0 },
    pathPoints: [],
    segments: [],
  }),
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
  EdgePath: () => null,
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
  edge: { selected?: boolean; selectable?: boolean } = {}
) {
  edgeLookup.set('e1', { id: 'e1', ...edge });
  getState.mockReturnValue({
    addSelectedEdges,
    edgeLookup,
    elementsSelectable: true,
    multiSelectionActive: false,
    unselectNodesAndEdges,
  });

  render(
    <BaseCanvasModeProvider mode={mode}>
      <svg>
        <CanvasEdge {...baseProps} selected={edge.selected ?? false} />
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
