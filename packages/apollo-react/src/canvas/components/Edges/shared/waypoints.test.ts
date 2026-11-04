import { Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it } from 'vitest';
import { buildPathVertices } from './geometry';
import type { PathVertex, Point, Segment, Waypoint } from './types';
import {
  insertWaypoint,
  isCornerWaypoint,
  materializePathWaypoints,
  moveCornerWaypoint,
  moveSegmentByDelta,
  moveWaypoint,
  moveWaypointConstrained,
  normalizeWaypoints,
  type PathBuilder,
  type RebalanceEndpoint,
  rebalanceWaypoints,
  removeWaypoint,
  waypointsEqual,
  waypointsPositionallyEqual,
} from './waypoints';

const wp = (id: string, x: number, y: number): Waypoint => ({ id, x, y });
const vertex = (x: number, y: number, waypointIndex = -1): PathVertex => ({ x, y, waypointIndex });

// start, stub, user waypoint(0), stub, end — one waypoint flanked by derived stubs.
const VERTICES_WITH_STUBS: PathVertex[] = [
  vertex(0, 0),
  vertex(50, 0),
  vertex(50, 50, 0),
  vertex(50, 100),
  vertex(0, 100),
];

describe('materializePathWaypoints', () => {
  it('promotes every interior vertex to a waypoint, minting ids for derived points', () => {
    const result = materializePathWaypoints(VERTICES_WITH_STUBS, [wp('kept', 50, 50)]);
    // 3 interior vertices (two stubs + the waypoint) become 3 waypoints.
    expect(result).toHaveLength(3);
    expect(result.map((p) => ({ x: p.x, y: p.y }))).toEqual([
      { x: 50, y: 0 },
      { x: 50, y: 50 },
      { x: 50, y: 100 },
    ]);
  });

  it('preserves the id (and object) of real waypoints', () => {
    const stored = wp('kept', 50, 50);
    const result = materializePathWaypoints(VERTICES_WITH_STUBS, [stored]);
    expect(result[1]).toBe(stored);
    // Derived points get fresh generated ids.
    expect(result[0]!.id).not.toBe('kept');
    expect(result[0]!.id).toMatch(/^wp-/);
  });
});

describe('insertWaypoint', () => {
  it('materializes the path and splices the new waypoint into the segment', () => {
    const result = insertWaypoint(VERTICES_WITH_STUBS, [wp('kept', 50, 50)], 1, { x: 60, y: 60 });
    // 3 materialized + 1 inserted.
    expect(result).toHaveLength(4);
    // New waypoint lands at segment index 1, grid-snapped (GRID_SPACING = 16).
    expect(result[1]).toMatchObject({ x: 64, y: 64 });
    expect(result[1]!.id).toMatch(/^wp-/);
  });
});

describe('moveWaypoint', () => {
  it('moves only the targeted waypoint and snaps it to the grid', () => {
    const result = moveWaypoint([wp('a', 0, 0), wp('b', 100, 100)], 1, { x: 137, y: 7 });
    expect(result[0]).toEqual(wp('a', 0, 0));
    expect(result[1]).toMatchObject({ id: 'b', x: 144, y: 0 });
  });
});

// Source exits right, runs down to W0, left to W1, then up and into a target
// facing left: W0 and W1 are the two bottom corners of a U-shaped route.
const builder =
  (source: Point, sourcePosition: Position, target: Point, targetPosition: Position): PathBuilder =>
  (waypoints) =>
    buildPathVertices(
      source.x,
      source.y,
      sourcePosition,
      target.x,
      target.y,
      targetPosition,
      waypoints
    );
const uRoute = builder({ x: 288, y: 144 }, Position.Right, { x: 688, y: 336 }, Position.Left);
const corners = [wp('w0', 496, 704), wp('w1', 144, 704)];
// Source exits right, target faces up: a lone waypoint between two derived stubs.
const lShapeTop = builder({ x: 0, y: 0 }, Position.Right, { x: 400, y: 400 }, Position.Top);
// Source exits right, target faces left: a waypoint level with the source handle.
const offSource = builder({ x: 0, y: 0 }, Position.Right, { x: 400, y: 400 }, Position.Left);
const positions = (waypoints: Waypoint[]) => waypoints.map(({ x, y }) => ({ x, y }));

describe('moveWaypointConstrained', () => {
  it('does not slide a corner along the run its re-derived elbow keeps straight', () => {
    const result = moveWaypointConstrained(corners, 1, { x: 144, y: 544 }, uRoute);
    expect(result[1]).toMatchObject({ id: 'w1', x: 144, y: 704 });
  });

  it('keeps only the axis that changes the route on a diagonal drag', () => {
    const result = moveWaypointConstrained(corners, 1, { x: 96, y: 544 }, uRoute);
    expect(result[1]).toMatchObject({ x: 96, y: 704 });
  });

  it('does not push a corner past the run into a spike that doubles back', () => {
    const result = moveWaypointConstrained(corners, 1, { x: 144, y: 800 }, uRoute);
    expect(result[1]).toMatchObject({ x: 144, y: 704 });
  });

  it('moves freely on both axes when both change the route', () => {
    // Lone corner between two derived stubs: x moves the riser, y the run.
    const result = moveWaypointConstrained([wp('c', 208, 208)], 0, { x: 240, y: 240 }, lShapeTop);
    expect(result[0]).toMatchObject({ id: 'c', x: 240, y: 240 });
  });

  it('leaves the other waypoints untouched', () => {
    const result = moveWaypointConstrained(corners, 1, { x: 96, y: 544 }, uRoute);
    expect(result[0]).toBe(corners[0]);
  });
});

describe('isCornerWaypoint', () => {
  it('is true for a waypoint whose two runs are perpendicular', () => {
    const path = uRoute(corners);
    expect(isCornerWaypoint(path, 0)).toBe(true);
    expect(isCornerWaypoint(path, 1)).toBe(true);
  });

  it('is false for a waypoint stranded on a straight run', () => {
    expect(isCornerWaypoint(uRoute([corners[0]!, wp('w1', 144, 544)]), 1)).toBe(false);
  });

  it('is false for a waypoint that doubles back past the end of its run', () => {
    expect(isCornerWaypoint(uRoute([corners[0]!, wp('w1', 144, 800)]), 1)).toBe(false);
  });
});

describe('moveCornerWaypoint', () => {
  it('drags the stored corner at the far end of a run along with it', () => {
    // Bottom-left corner up: the bottom run rises, so W0 follows on y.
    const result = moveCornerWaypoint(corners, 1, { x: 144, y: 544 }, uRoute(corners));
    expect(result).toEqual([wp('w0', 496, 544), wp('w1', 144, 544)]);
    expect(isCornerWaypoint(uRoute(result), 1)).toBe(true);
  });

  it('follows the cursor on both axes', () => {
    const result = moveCornerWaypoint(corners, 1, { x: 96, y: 544 }, uRoute(corners));
    expect(result).toEqual([wp('w0', 496, 544), wp('w1', 96, 544)]);
  });

  it('lets derived elbows re-derive instead of storing them', () => {
    const lone = [wp('c', 208, 208)];
    expect(moveCornerWaypoint(lone, 0, { x: 240, y: 240 }, lShapeTop(lone))).toEqual([
      wp('c', 240, 240),
    ]);
  });

  it('inserts a stub next to a node anchor so the attached run can shift', () => {
    // The corner's incoming run comes straight off the source handle.
    const lone = [wp('c', 208, 0)];
    const result = moveCornerWaypoint(lone, 0, { x: 240, y: 96 }, offSource(lone));
    expect(positions(result)).toEqual([
      { x: 32, y: 0 },
      { x: 32, y: 96 },
      { x: 240, y: 96 },
    ]);
    expect(result[2]!.id).toBe('c');
    expect(isCornerWaypoint(offSource(result), 2)).toBe(true);
  });

  it('adds no stub when the anchored run keeps its coordinate', () => {
    const lone = [wp('c', 208, 0)];
    expect(moveCornerWaypoint(lone, 0, { x: 240, y: 0 }, offSource(lone))).toEqual([
      wp('c', 240, 0),
    ]);
  });
});

describe('normalizeWaypoints', () => {
  const shapeOf = (waypoints: Waypoint[]) => positions(uRoute(waypoints));

  it('moves a waypoint stranded on a run onto the nearer end of it', () => {
    const stranded = [corners[0]!, wp('w1', 144, 544)];
    const result = normalizeWaypoints(stranded, uRoute);
    expect(result).toEqual([wp('w0', 496, 704), wp('w1', 144, 704)]);
  });

  it('pulls a waypoint that doubles back onto the end of its run', () => {
    const spiked = [corners[0]!, wp('w1', 144, 800)];
    expect(normalizeWaypoints(spiked, uRoute)).toEqual(corners);
  });

  it('removes a waypoint the route does not need', () => {
    // Midway along the bottom run, between two stored corners.
    const extra = [corners[0]!, wp('mid', 320, 704), corners[1]!];
    const result = normalizeWaypoints(extra, uRoute);
    expect(result).toEqual(corners);
    expect(shapeOf(result)).toEqual(shapeOf(corners));
  });

  it('leaves corners alone', () => {
    expect(normalizeWaypoints(corners, uRoute)).toBe(corners);
  });
});

describe('removeWaypoint', () => {
  it('drops the waypoint at the given index', () => {
    const result = removeWaypoint([wp('a', 0, 0), wp('b', 1, 1), wp('c', 2, 2)], 1);
    expect(result.map((w) => w.id)).toEqual(['a', 'c']);
  });
});

describe('waypointsEqual / waypointsPositionallyEqual', () => {
  it('id-aware equality distinguishes different ids at the same position', () => {
    expect(waypointsEqual([wp('a', 0, 0)], [wp('a', 0, 0)])).toBe(true);
    expect(waypointsEqual([wp('a', 0, 0)], [wp('b', 0, 0)])).toBe(false);
  });

  it('position-only equality ignores ids', () => {
    expect(waypointsPositionallyEqual([wp('a', 0, 0)], [wp('b', 0, 0)])).toBe(true);
    expect(waypointsPositionallyEqual([wp('a', 0, 0)], [wp('a', 0, 1)])).toBe(false);
  });
});

describe('rebalanceWaypoints', () => {
  const fixedSource = (p: Point): RebalanceEndpoint => ({
    position: Position.Right,
    from: p,
    to: p,
  });
  const fixedTarget = (p: Point): RebalanceEndpoint => ({
    position: Position.Left,
    from: p,
    to: p,
  });

  it('moves only the adjacent waypoint, on the cross-axis, when the target moves (B2-above-A2)', () => {
    const result = rebalanceWaypoints(
      [wp('wp-1', 300, 328), wp('wp-2', 300, 428)],
      fixedSource({ x: 196, y: 328 }),
      // target (Left face → cross-axis is y) dragged up from y=428 to y=148.
      { position: Position.Left, from: { x: 500, y: 428 }, to: { x: 500, y: 148 } }
    );
    // wp-1 (adjacent to the still source) untouched; wp-2 tracks target on y,
    // x fixed.
    expect(result).toEqual([
      { id: 'wp-1', x: 300, y: 328 },
      { id: 'wp-2', x: 300, y: 148 },
    ]);
  });

  it('leaves interior waypoints untouched', () => {
    const result = rebalanceWaypoints(
      [wp('a', 300, 328), wp('b', 300, 428), wp('c', 400, 428)],
      // source (Right face) dragged up 78px; target unchanged.
      { position: Position.Right, from: { x: 196, y: 328 }, to: { x: 196, y: 250 } },
      fixedTarget({ x: 500, y: 428 })
    );
    // Only the first waypoint shifts on y; b and c are byte-identical.
    expect(result[0]).toEqual({ id: 'a', x: 300, y: 250 });
    expect(result[1]).toEqual({ id: 'b', x: 300, y: 428 });
    expect(result[2]).toEqual({ id: 'c', x: 400, y: 428 });
  });

  it('shifts on x for a vertical (top/bottom) face', () => {
    const result = rebalanceWaypoints(
      [wp('a', 100, 300)],
      // source bottom face → cross-axis is x; moved +60 on x.
      { position: Position.Bottom, from: { x: 100, y: 100 }, to: { x: 160, y: 100 } },
      fixedTarget({ x: 100, y: 600 })
    );
    expect(result[0]).toEqual({ id: 'a', x: 160, y: 300 });
  });

  it('is a no-op when neither node moves', () => {
    const result = rebalanceWaypoints(
      [wp('a', 300, 250)],
      fixedSource({ x: 100, y: 100 }),
      fixedTarget({ x: 500, y: 400 })
    );
    expect(result).toEqual([{ id: 'a', x: 300, y: 250 }]);
  });

  it('translates the whole route when both endpoints move by the same delta (group move)', () => {
    const result = rebalanceWaypoints(
      [wp('a', 300, 328), wp('b', 350, 428)],
      { position: Position.Right, from: { x: 196, y: 328 }, to: { x: 256, y: 378 } },
      { position: Position.Left, from: { x: 500, y: 428 }, to: { x: 560, y: 478 } }
    );
    // Same (+60,+50) delta on both ends → every waypoint translates, interior
    // bends included, preserving the shape exactly.
    expect(result).toEqual([
      { id: 'a', x: 360, y: 378 },
      { id: 'b', x: 410, y: 478 },
    ]);
  });

  it('translates a lone waypoint once on a group move (no double-apply)', () => {
    const result = rebalanceWaypoints(
      [wp('a', 300, 250)],
      { position: Position.Right, from: { x: 100, y: 100 }, to: { x: 140, y: 140 } },
      { position: Position.Left, from: { x: 500, y: 400 }, to: { x: 540, y: 440 } }
    );
    // +40 on each axis applied once — not 2x on y.
    expect(result).toEqual([{ id: 'a', x: 340, y: 290 }]);
  });

  it('leaves a lone waypoint fixed when both endpoints move differently (conflict)', () => {
    const result = rebalanceWaypoints(
      [wp('a', 300, 250)],
      { position: Position.Right, from: { x: 100, y: 100 }, to: { x: 100, y: 150 } },
      { position: Position.Left, from: { x: 500, y: 400 }, to: { x: 500, y: 370 } }
    );
    // Conflicting cross-axis deltas (+50 vs -30) → keep central intent, don't
    // double-shift; derived terminal elbows absorb the difference.
    expect(result).toEqual([{ id: 'a', x: 300, y: 250 }]);
  });
});

describe('moveSegmentByDelta', () => {
  it('translates a middle segment by moving both its endpoint waypoints', () => {
    // Path: source → w0 → w1 → w2 → target, all materialized.
    const waypoints = [wp('w0', 50, 0), wp('w1', 50, 100), wp('w2', 150, 100)];
    // Segment between w0 and w1 (vertical) — indices into the interior list.
    const segment: Segment = {
      id: 'seg-2',
      start: { x: 50, y: 0 },
      end: { x: 50, y: 100 },
      orientation: 'vertical',
      waypointIndexBefore: 0,
      waypointIndexAfter: 1,
    };
    const pathPoints = [{ x: 0, y: 0 }, ...waypoints, { x: 200, y: 100 }];
    const result = moveSegmentByDelta(waypoints, segment, { x: 16, y: 0 }, pathPoints);

    // A vertical segment moves along x; both endpoints shift to the snapped x
    // (50 + 16 = 66 → snapped to the nearest grid line, 64).
    const w0 = result.find((w) => w.id === 'w0');
    const w1 = result.find((w) => w.id === 'w1');
    expect(w0?.x).toBe(64);
    expect(w1?.x).toBe(64);
  });
});
