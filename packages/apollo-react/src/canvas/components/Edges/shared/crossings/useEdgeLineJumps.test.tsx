import { act, render, screen } from '@testing-library/react';
import { Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it } from 'vitest';
import { EDGE_CONSTANTS, EMPTY_WAYPOINTS } from '../constants';
import { useEdgeGeometry } from '../hooks';
import type { Waypoint } from '../types';
import { EdgeCrossingsProvider } from './EdgeCrossingsContext';

const r = EDGE_CONSTANTS.LINE_JUMP_RADIUS;

type ProbeProps = {
  edgeId: string;
  sourceX: number;
  sourceY: number;
  sourcePosition: Position;
  targetX: number;
  targetY: number;
  targetPosition: Position;
  enableLineJumps?: boolean;
  waypoints?: Waypoint[];
};

/** Renders one edge's computed path so a test can read it back. */
function EdgeProbe({
  edgeId,
  enableLineJumps = true,
  waypoints = EMPTY_WAYPOINTS,
  ...anchors
}: ProbeProps) {
  const geometry = useEdgeGeometry({
    routing: 'waypoint',
    edgeId,
    sourceNodeId: `${edgeId}-source`,
    targetNodeId: `${edgeId}-target`,
    waypoints,
    enableSegments: false,
    enableLineJumps,
    ...anchors,
  });

  return <div data-testid={edgeId} data-path={geometry.edgePath} />;
}

/** Straight horizontal line: anchors inset to (-8, 50) → (208, 50). */
const horizontal = {
  edgeId: 'horizontal',
  sourceX: 0,
  sourceY: 50,
  sourcePosition: Position.Right,
  targetX: 200,
  targetY: 50,
  targetPosition: Position.Left,
} as const;

/** Straight vertical line through x=100, crossing the horizontal at (100, 50). */
const vertical = {
  edgeId: 'vertical',
  sourceX: 100,
  sourceY: -100,
  sourcePosition: Position.Bottom,
  targetX: 100,
  targetY: 200,
  targetPosition: Position.Top,
} as const;

function pathOf(edgeId: string): string {
  return screen.getByTestId(edgeId).getAttribute('data-path') ?? '';
}

async function renderCrossing(props: { enableLineJumps?: boolean } = {}) {
  const result = render(
    <EdgeCrossingsProvider>
      <EdgeProbe {...horizontal} {...props} />
      <EdgeProbe {...vertical} {...props} />
    </EdgeCrossingsProvider>
  );
  // Let the store's coalescing microtask run and the notified edges re-render.
  await act(async () => {});
  return result;
}

describe('useEdgeLineJumps', () => {
  it('arcs the horizontal edge over the vertical one it crosses', async () => {
    await renderCrossing();

    expect(pathOf('horizontal')).toBe(
      `M -8 50 L ${100 - r} 50 A ${r} ${r} 0 0 1 ${100 + r} 50 L 208 50`
    );
    expect(pathOf('vertical')).toBe('M 100 -108 L 100 208');
  });

  it('draws both lines flat when the edges have not opted in', async () => {
    await renderCrossing({ enableLineJumps: false });

    expect(pathOf('horizontal')).toBe('M -8 50 L 208 50');
    expect(pathOf('vertical')).toBe('M 100 -108 L 100 208');
  });

  it('drops the notch when the crossing edge unmounts', async () => {
    const { rerender } = await renderCrossing();
    expect(pathOf('horizontal')).toContain('A ');

    rerender(
      <EdgeCrossingsProvider>
        <EdgeProbe {...horizontal} />
      </EdgeCrossingsProvider>
    );
    await act(async () => {});

    expect(pathOf('horizontal')).toBe('M -8 50 L 208 50');
  });

  it('keeps its notch when a re-render rebuilds the polyline in place', async () => {
    // A fresh waypoint array of unchanged positions on every render, which is
    // what `useNodeDragRebalance` hands over while a drag is active. The
    // polyline is republished with a new identity, so the registration must
    // survive without the edge being withdrawn in between.
    const bend = (): Waypoint[] => [{ id: 'w', x: 60, y: 50 }];
    const tree = (
      <EdgeCrossingsProvider>
        <EdgeProbe {...horizontal} waypoints={bend()} />
        <EdgeProbe {...vertical} />
      </EdgeCrossingsProvider>
    );

    const { rerender } = render(tree);
    await act(async () => {});
    const first = pathOf('horizontal');
    expect(first).toContain('A ');

    rerender(
      <EdgeCrossingsProvider>
        <EdgeProbe {...horizontal} waypoints={bend()} />
        <EdgeProbe {...vertical} />
      </EdgeCrossingsProvider>
    );
    await act(async () => {});

    expect(pathOf('horizontal')).toBe(first);
  });

  it('shares one registry when a provider is nested inside another', async () => {
    // A second provider inside the first must defer to it, or the two edges
    // land in separate registries and the crossing silently draws flat.
    render(
      <EdgeCrossingsProvider>
        <EdgeProbe {...horizontal} />
        <EdgeCrossingsProvider>
          <EdgeProbe {...vertical} />
        </EdgeCrossingsProvider>
      </EdgeCrossingsProvider>
    );
    await act(async () => {});

    expect(pathOf('horizontal')).toContain('A ');
  });

  it('draws no jumps without a provider in the tree', async () => {
    render(
      <>
        <EdgeProbe {...horizontal} />
        <EdgeProbe {...vertical} />
      </>
    );
    await act(async () => {});

    expect(pathOf('horizontal')).toBe('M -8 50 L 208 50');
  });
});
