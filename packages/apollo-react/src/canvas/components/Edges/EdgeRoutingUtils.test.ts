import { describe, expect, it } from 'vitest';

import {
  arrowFromLastSegment,
  buildOrthogonalPath,
  calculatePathMidpoint,
  toOrthogonalPoints,
} from './EdgeRoutingUtils';

describe('toOrthogonalPoints', () => {
  it('returns empty/single points unchanged', () => {
    expect(toOrthogonalPoints([])).toEqual([]);
    expect(toOrthogonalPoints([{ x: 1, y: 2 }])).toEqual([{ x: 1, y: 2 }]);
  });

  it('passes through already-orthogonal points', () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
    ];
    const result = toOrthogonalPoints(pts);
    expect(result).toEqual(pts);
  });

  it('snaps first bend to be axis-aligned with source', () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 50, y: 2 }, // nearly horizontal — snap y to source.y
      { x: 50, y: 100 },
    ];
    const result = toOrthogonalPoints(pts);
    expect(result[1]!.y).toBe(0); // snapped to source y
    expect(result[1]!.x).toBe(50); // x unchanged
  });

  it('snaps last bend to be axis-aligned with target', () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 50, y: 0 },
      { x: 50, y: 98 }, // nearly vertical to target at y=100
      { x: 100, y: 100 },
    ];
    const result = toOrthogonalPoints(pts);
    expect(result[result.length - 2]!.y).toBe(100); // snapped to target y
  });

  it('inserts step midpoints for diagonal middle segments', () => {
    // Two points with both dx > 1 and dy > 1 after snapping
    const pts = [
      { x: 0, y: 0 },
      { x: 100, y: 100 },
    ];
    const result = toOrthogonalPoints(pts);
    // Should insert a step: (0,0) → (50,0) → (50,100) → (100,100)
    expect(result.length).toBe(4);
    expect(result[1]).toEqual({ x: 50, y: 0 });
    expect(result[2]).toEqual({ x: 50, y: 100 });
  });

  it('snaps sub-threshold differences to zero', () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 100, y: 0.5 }, // dy < 1, within threshold — should snap to 0
      { x: 100, y: 100 },
    ];
    const result = toOrthogonalPoints(pts);
    expect(result[1]!.y).toBe(0); // snapped to source y
    expect(result[1]!.x).toBe(100); // x unchanged
  });
});

describe('buildOrthogonalPath', () => {
  it('returns empty path for fewer than 2 points', () => {
    expect(buildOrthogonalPath([]).path).toBe('');
    expect(buildOrthogonalPath([{ x: 0, y: 0 }]).path).toBe('');
  });

  it('returns a straight line for 2 points', () => {
    const { path } = buildOrthogonalPath([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ]);
    expect(path).toBe('M 0 0 L 100 0');
  });

  it('returns orthoPoints alongside the path', () => {
    const { path, orthoPoints } = buildOrthogonalPath([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
    ]);
    expect(path).toBeTruthy();
    expect(orthoPoints.length).toBeGreaterThanOrEqual(3);
  });

  it('creates rounded corners for 3+ orthogonal points', () => {
    const { path } = buildOrthogonalPath(
      [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
      ],
      16,
    );
    // Should contain M, L, Q, L commands
    expect(path).toMatch(/^M /);
    expect(path).toContain('Q');
    expect(path).toMatch(/L 100 100$/);
  });

  it('clamps border radius to half the shorter segment', () => {
    // Short segment of 10px — radius should be clamped to 5
    const { path } = buildOrthogonalPath(
      [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 100 },
      ],
      16,
    );
    // The Q control point should use r=5, not r=16
    // L before Q should be at x=5 (10 - 5)
    expect(path).toContain('L 5 0');
  });

  it('falls back to L for very short segments (r < 1)', () => {
    const { path } = buildOrthogonalPath([
      { x: 0, y: 0 },
      { x: 0.5, y: 0 }, // segment length 0.5, r = 0.25 < 1
      { x: 0.5, y: 100 },
    ]);
    // Should contain L 0.5 0 (no Q curve)
    expect(path).not.toContain('Q');
  });

  it('orthogonalizes non-axis-aligned input internally', () => {
    // Diagonal input — buildOrthogonalPath should snap it internally
    const { path, orthoPoints } = buildOrthogonalPath([
      { x: 0, y: 0 },
      { x: 100, y: 100 },
    ]);
    // toOrthogonalPoints inserts step midpoints for diagonal segments
    expect(orthoPoints.length).toBe(4);
    expect(path).toBeTruthy();
  });
});

describe('arrowFromLastSegment', () => {
  it('returns zero values for fewer than 2 points', () => {
    expect(arrowFromLastSegment([])).toEqual({ angle: 0, offsetX: 0, offsetY: 0 });
    expect(arrowFromLastSegment([{ x: 0, y: 0 }])).toEqual({ angle: 0, offsetX: 0, offsetY: 0 });
  });

  it('detects rightward arrow (angle 0)', () => {
    const result = arrowFromLastSegment([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ]);
    expect(result.angle).toBe(0);
    expect(result.offsetX).toBeGreaterThan(0);
    expect(result.offsetY).toBe(0);
  });

  it('detects leftward arrow (angle PI)', () => {
    const result = arrowFromLastSegment([
      { x: 100, y: 0 },
      { x: 0, y: 0 },
    ]);
    expect(result.angle).toBe(Math.PI);
    expect(result.offsetX).toBeLessThan(0);
    expect(result.offsetY).toBe(0);
  });

  it('detects downward arrow (angle PI/2)', () => {
    const result = arrowFromLastSegment([
      { x: 0, y: 0 },
      { x: 0, y: 100 },
    ]);
    expect(result.angle).toBe(Math.PI / 2);
    expect(result.offsetX).toBe(0);
    expect(result.offsetY).toBeGreaterThan(0);
  });

  it('detects upward arrow (angle -PI/2)', () => {
    const result = arrowFromLastSegment([
      { x: 0, y: 100 },
      { x: 0, y: 0 },
    ]);
    expect(result.angle).toBe(-Math.PI / 2);
    expect(result.offsetX).toBe(0);
    expect(result.offsetY).toBeLessThan(0);
  });

  it('uses the last two points only', () => {
    const result = arrowFromLastSegment([
      { x: 0, y: 0 },
      { x: 0, y: 50 }, // vertical
      { x: 100, y: 50 }, // last segment is rightward
    ]);
    expect(result.angle).toBe(0);
  });

  it('skips trailing zero-length segments', () => {
    const result = arrowFromLastSegment([
      { x: 0, y: 0 },
      { x: 100, y: 0 }, // rightward
      { x: 100, y: 0 }, // duplicate
    ]);
    expect(result.angle).toBe(0);
    expect(result.offsetX).toBeGreaterThan(0);
  });

  it('returns neutral fallback when all points are identical', () => {
    const result = arrowFromLastSegment([
      { x: 50, y: 50 },
      { x: 50, y: 50 },
      { x: 50, y: 50 },
    ]);
    expect(result).toEqual({ angle: 0, offsetX: 0, offsetY: 0 });
  });
});

describe('calculatePathMidpoint', () => {
  it('returns origin for empty array', () => {
    expect(calculatePathMidpoint([])).toEqual({ x: 0, y: 0 });
  });

  it('returns the point for single-element array', () => {
    expect(calculatePathMidpoint([{ x: 42, y: 99 }])).toEqual({ x: 42, y: 99 });
  });

  it('returns midpoint for a straight 2-point segment', () => {
    const result = calculatePathMidpoint([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ]);
    expect(result.x).toBeCloseTo(50);
    expect(result.y).toBeCloseTo(0);
  });

  it('finds midpoint along a multi-segment L-shaped path', () => {
    // Total length: 100 (horizontal) + 100 (vertical) = 200
    // Midpoint at length 100 = end of first segment = (100, 0)
    const result = calculatePathMidpoint([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
    ]);
    expect(result.x).toBeCloseTo(100);
    expect(result.y).toBeCloseTo(0);
  });

  it('handles midpoint falling in the middle of a segment', () => {
    // Total: 50 + 200 + 50 = 300, midpoint at 150 → 100 into the second segment (200 long)
    // Second segment: (50,0) → (50,200), t = 100/200 = 0.5, y = 100
    const result = calculatePathMidpoint([
      { x: 0, y: 0 },
      { x: 50, y: 0 },
      { x: 50, y: 200 },
      { x: 100, y: 200 },
    ]);
    expect(result.x).toBeCloseTo(50);
    expect(result.y).toBeCloseTo(100);
  });

  it('handles zero-length segments without errors', () => {
    const result = calculatePathMidpoint([
      { x: 0, y: 0 },
      { x: 0, y: 0 }, // zero-length
      { x: 100, y: 0 },
    ]);
    expect(result.x).toBeCloseTo(50);
    expect(result.y).toBeCloseTo(0);
  });
});
