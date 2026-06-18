import { Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it } from 'vitest';
import { ARROW_OFFSETS, EDGE_CONSTANTS } from './constants';
import {
  buildPathVertices,
  consolidateWaypoints,
  createRoundedPath,
  extractSegments,
  getPathArcMidpoint,
  getSegmentOrientation,
  isSegmentPerpendicular,
  routeAnchorToPoint,
  snapPointToGrid,
} from './geometry';
import type { PathVertex, Point, Waypoint } from './types';

const wp = (id: string, x: number, y: number): Waypoint => ({ id, x, y });
const vertex = (x: number, y: number, waypointIndex = -1): PathVertex => ({ x, y, waypointIndex });

/** Every consecutive pair of points is axis-aligned (horizontal or vertical). */
function isOrthogonal(points: Point[]): boolean {
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]!;
    const b = points[i + 1]!;
    if (Math.abs(a.x - b.x) >= 1 && Math.abs(a.y - b.y) >= 1) return false;
  }
  return true;
}

describe('routeAnchorToPoint', () => {
  it('returns no elbow when the point is already aligned with the exit axis', () => {
    // Right face, point straight ahead on the same row.
    expect(routeAnchorToPoint({ x: 0, y: 0 }, Position.Right, { x: 100, y: 0 })).toEqual([]);
  });

  it('returns a single elbow when the point is ahead of the face but off-axis', () => {
    // Right face: travel along x to the point, then turn — elbow shares anchor y.
    expect(routeAnchorToPoint({ x: 0, y: 0 }, Position.Right, { x: 100, y: 50 })).toEqual([
      { x: 100, y: 0 },
    ]);
  });

  it('hooks around with two elbows when the point is behind the face', () => {
    // Right face, point to the left (behind): leave by STUB_OFFSET, then cross over.
    const stub = EDGE_CONSTANTS.STUB_OFFSET;
    expect(routeAnchorToPoint({ x: 0, y: 0 }, Position.Right, { x: -100, y: 50 })).toEqual([
      { x: stub, y: 0 },
      { x: stub, y: 50 },
    ]);
  });

  it('handles a vertical (bottom) face the same way on the other axis', () => {
    // Bottom face, point ahead (below) and off-axis → single elbow sharing anchor x.
    expect(routeAnchorToPoint({ x: 0, y: 0 }, Position.Bottom, { x: 50, y: 100 })).toEqual([
      { x: 0, y: 100 },
    ]);
  });

  it('hooks for a vertical face when the point is behind', () => {
    const stub = EDGE_CONSTANTS.STUB_OFFSET;
    // Bottom face (exits downward), point above (behind).
    expect(routeAnchorToPoint({ x: 0, y: 0 }, Position.Bottom, { x: 50, y: -100 })).toEqual([
      { x: 0, y: stub },
      { x: 50, y: stub },
    ]);
  });
});

describe('consolidateWaypoints', () => {
  it('removes a midpoint collinear with its neighbours, keeping the corners', () => {
    // {50,0} lies on the straight run between {0,0} and {100,0}. Endpoints are
    // offset perpendicularly so the leading/trailing trims do not fire.
    const result = consolidateWaypoints(
      [
        { x: 0, y: 0 },
        { x: 50, y: 0 },
        { x: 100, y: 0 },
      ],
      { x: 0, y: -50 },
      { x: 100, y: -50 }
    );
    expect(result).toEqual([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ]);
  });

  it('collapses a fully-straight run to nothing', () => {
    const result = consolidateWaypoints(
      [
        { x: 0, y: 0 },
        { x: 50, y: 0 },
        { x: 100, y: 0 },
      ],
      { x: -50, y: 0 },
      { x: 150, y: 0 }
    );
    expect(result).toEqual([]);
  });

  it('dedupes coincident points', () => {
    const result = consolidateWaypoints(
      [
        { x: 50, y: 50 },
        { x: 50, y: 50 },
      ],
      { x: 0, y: 50 },
      { x: 50, y: 100 }
    );
    expect(result).toHaveLength(1);
  });

  it('never drops a protected point, even when collinear', () => {
    const protectedPoint = { x: 50, y: 0 };
    const result = consolidateWaypoints(
      [{ x: 0, y: 0 }, protectedPoint, { x: 100, y: 0 }],
      { x: -50, y: 0 },
      { x: 150, y: 0 },
      (p) => p === protectedPoint
    );
    expect(result).toEqual([protectedPoint]);
  });

  it('preserves object identity of surviving points', () => {
    const keep = { x: 50, y: 50 };
    const result = consolidateWaypoints([keep], { x: 0, y: 0 }, { x: 100, y: 100 });
    expect(result[0]).toBe(keep);
  });
});

describe('buildPathVertices', () => {
  it('auto-routes with no manual waypoints and tags every vertex as derived', () => {
    const result = buildPathVertices(0, 0, Position.Right, 200, 0, Position.Left, []);
    expect(result.length).toBeGreaterThanOrEqual(2);
    expect(result.every((v) => v.waypointIndex === -1)).toBe(true);
    expect(isOrthogonal(result)).toBe(true);
  });

  it('always draws through a single off-line waypoint (regression)', () => {
    const result = buildPathVertices(0, 0, Position.Right, 200, 0, Position.Left, [
      wp('a', 100, 50),
    ]);
    const drawn = result.find((v) => v.waypointIndex === 0);
    expect(drawn).toBeDefined();
    expect(drawn).toMatchObject({ x: 100, y: 50 });
  });

  it('keeps the source and target anchors as the path endpoints (regression)', () => {
    // Two vertically-aligned waypoints between A (top-left) and B (bottom-right).
    // The path must remain anchored to both nodes — consolidation must not trim
    // the anchors.
    const result = buildPathVertices(0, 0, Position.Right, 200, 200, Position.Left, [
      wp('wp-1', 100, 50),
      wp('wp-2', 100, 150),
    ]);

    const src = ARROW_OFFSETS[Position.Right];
    const tgt = ARROW_OFFSETS[Position.Left];
    expect(result[0]).toMatchObject({ x: src.x, y: src.y, waypointIndex: -1 });
    expect(result.at(-1)).toMatchObject({ x: 200 + tgt.x, y: 200 + tgt.y, waypointIndex: -1 });

    // Both waypoints are drawn through, and the whole path stays orthogonal.
    expect(
      result
        .map((v) => v.waypointIndex)
        .filter((i) => i >= 0)
        .sort()
    ).toEqual([0, 1]);
    expect(isOrthogonal(result)).toBe(true);
  });

  it('keeps the whole path orthogonal between two non-aligned waypoints (no diagonals)', () => {
    const result = buildPathVertices(0, 0, Position.Right, 300, 0, Position.Left, [
      wp('a', 80, 40),
      wp('b', 200, 120),
    ]);
    expect(isOrthogonal(result)).toBe(true);
  });

  it('tags each user waypoint with its stored index exactly once', () => {
    const result = buildPathVertices(0, 0, Position.Right, 300, 100, Position.Left, [
      wp('a', 80, 40),
      wp('b', 200, 120),
    ]);
    const indices = result.map((v) => v.waypointIndex).filter((i) => i >= 0);
    expect(indices.sort()).toEqual([0, 1]);
  });

  it('shifts an auto-routed first waypoint sitting against the source face out to STUB_OFFSET (regression)', () => {
    // Auto-routed bend hard against the Right face → pushed out to STUB_OFFSET.
    const result = buildPathVertices(
      0,
      0,
      Position.Right,
      200,
      100,
      Position.Left,
      [wp('a', 5, 50)],
      true
    );
    const drawn = result.find((v) => v.waypointIndex === 0);
    const src = ARROW_OFFSETS[Position.Right];
    expect(drawn).toMatchObject({ x: src.x + EDGE_CONSTANTS.STUB_OFFSET, y: 50 });
    expect(isOrthogonal(result)).toBe(true);
  });

  it('renders a MANUAL close waypoint exactly where placed (no face-clearance)', () => {
    // Same close bend, user-placed (autoRouted = false) → rendered as-is.
    const result = buildPathVertices(
      0,
      0,
      Position.Right,
      200,
      100,
      Position.Left,
      [wp('a', 5, 50)],
      false
    );
    expect(result.find((v) => v.waypointIndex === 0)).toMatchObject({ x: 5, y: 50 });
  });

  it('leaves an auto-routed first waypoint that already clears the source face untouched', () => {
    const result = buildPathVertices(
      0,
      0,
      Position.Right,
      200,
      100,
      Position.Left,
      [wp('a', 100, 50)],
      true
    );
    expect(result.find((v) => v.waypointIndex === 0)).toMatchObject({ x: 100, y: 50 });
  });

  it('shifts an auto-routed last waypoint sitting against the target face out to STUB_OFFSET', () => {
    // Target (Left face) is cleared symmetrically — riser pushed away from it.
    const result = buildPathVertices(
      0,
      0,
      Position.Right,
      200,
      100,
      Position.Left,
      [wp('a', 100, 50), wp('b', 198, 50)],
      true
    );
    const drawn = result.find((v) => v.waypointIndex === 1);
    const endX = 200 + ARROW_OFFSETS[Position.Left].x;
    expect(drawn).toMatchObject({ x: endX - EDGE_CONSTANTS.STUB_OFFSET, y: 50 });
    expect(isOrthogonal(result)).toBe(true);
  });

  it('clears a vertical (Bottom) source face on the y axis', () => {
    // Bottom-face exit: the shift runs on y, not x.
    const result = buildPathVertices(
      0,
      0,
      Position.Bottom,
      100,
      200,
      Position.Top,
      [wp('a', 50, 5)],
      true
    );
    const drawn = result.find((v) => v.waypointIndex === 0);
    const src = ARROW_OFFSETS[Position.Bottom];
    expect(drawn).toMatchObject({ x: 50, y: src.y + EDGE_CONSTANTS.STUB_OFFSET });
    expect(isOrthogonal(result)).toBe(true);
  });

  it('pulls a bend behind the source face forward to a clean STUB_OFFSET exit', () => {
    // Behind the face (gap < 0), e.g. router port behind the handle: the riser is
    // pulled forward to exactly STUB_OFFSET in front, never left hugging the node.
    const src = ARROW_OFFSETS[Position.Right];
    const result = buildPathVertices(
      0,
      0,
      Position.Right,
      200,
      100,
      Position.Left,
      [wp('a', src.x - 20, 50)],
      true
    );
    expect(result.find((v) => v.waypointIndex === 0)).toMatchObject({
      x: src.x + EDGE_CONSTANTS.STUB_OFFSET,
      y: 50,
    });
    expect(isOrthogonal(result)).toBe(true);
  });
});

describe('extractSegments', () => {
  it('maps segment indices against the interior vertices even when stubs are present', () => {
    // start, stub, waypoint(0), stub, end — one user waypoint flanked by stubs.
    const vertices: PathVertex[] = [
      vertex(0, 0), // start anchor
      vertex(50, 0), // derived stub
      vertex(50, 50, 0), // user waypoint 0
      vertex(50, 100), // derived stub
      vertex(0, 100), // end anchor
    ];
    const segments = extractSegments(vertices);
    expect(segments).toHaveLength(4);
    // First segment starts at the source anchor.
    expect(segments[0]!.waypointIndexBefore).toBe(-1);
    // Last segment ends at the target anchor — index === interior count (3).
    expect(segments.at(-1)!.waypointIndexAfter).toBe(3);
    // Indices are contiguous against the interior list, not the stored waypoints.
    expect(segments.map((s) => s.waypointIndexBefore)).toEqual([-1, 0, 1, 2]);
  });
});

describe('segment helpers', () => {
  it('classifies orientation by dominant axis', () => {
    expect(getSegmentOrientation({ x: 0, y: 0 }, { x: 100, y: 10 })).toBe('horizontal');
    expect(getSegmentOrientation({ x: 0, y: 0 }, { x: 10, y: 100 })).toBe('vertical');
  });

  it('treats only axis-aligned segments as perpendicular', () => {
    expect(isSegmentPerpendicular({ start: { x: 0, y: 0 }, end: { x: 100, y: 0 } })).toBe(true);
    expect(isSegmentPerpendicular({ start: { x: 0, y: 0 }, end: { x: 100, y: 100 } })).toBe(false);
  });
});

describe('getPathArcMidpoint', () => {
  it('returns the point at half the total arc length', () => {
    // L-shape: 100 across then 100 down → midpoint is the corner.
    const mid = getPathArcMidpoint([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
    ]);
    expect(mid).toEqual({ x: 100, y: 0 });
  });

  it('is safe for degenerate input', () => {
    expect(getPathArcMidpoint([])).toEqual({ x: 0, y: 0 });
    expect(getPathArcMidpoint([{ x: 5, y: 7 }])).toEqual({ x: 5, y: 7 });
  });
});

describe('createRoundedPath', () => {
  it('emits a straight line for two points', () => {
    expect(
      createRoundedPath([
        { x: 0, y: 0 },
        { x: 100, y: 0 },
      ])
    ).toBe('M 0 0 L 100 0');
  });

  it('rounds interior corners with a quadratic curve', () => {
    const d = createRoundedPath([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
    ]);
    expect(d.startsWith('M 0 0')).toBe(true);
    expect(d).toContain('Q');
  });
});

describe('snapPointToGrid', () => {
  it('snaps both axes to the grid', () => {
    // GRID_SPACING = 16 → nearest multiple of 16.
    expect(snapPointToGrid({ x: 17, y: 7 })).toEqual({ x: 16, y: 0 });
  });
});
