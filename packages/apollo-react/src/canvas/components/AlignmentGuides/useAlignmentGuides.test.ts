import type { Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it } from 'vitest';
import type { NodeBounds } from './AlignmentGuides.types';
import {
  computeAlignmentResult,
  computeAlignmentSnapDelta,
  createAlignmentPositionUpdates,
  toBounds,
  toGroupBounds,
} from './useAlignmentGuides';

function bounds(id: string, x: number, y: number, width = 100, height = 60): NodeBounds {
  return {
    id,
    x1: x,
    y1: y,
    x2: x + width,
    y2: y + height,
    cx: x + width / 2,
    cy: y + height / 2,
  };
}

describe('computeAlignmentSnapDelta', () => {
  it('perfectly center-aligns a third node with an existing workflow column', () => {
    const existing = [bounds('first', 300, 100), bounds('second', 300, 300)];
    const dragged = bounds('third', 305, 500);

    expect(computeAlignmentSnapDelta(dragged, existing, 8)).toEqual({ dx: -5, dy: 0 });
  });

  it('uses the closest eligible alignment instead of node iteration order', () => {
    const existing = [bounds('farther', 300, 100), bounds('closer', 306, 300)];
    const dragged = bounds('dragged', 308, 500);

    expect(computeAlignmentSnapDelta(dragged, existing, 8).dx).toBe(-2);
  });

  it('does not pull a node edge toward another node center', () => {
    const existing = [bounds('existing', 300, 100)];
    const dragged = bounds('dragged', 345, 300);

    expect(computeAlignmentSnapDelta(dragged, existing, 8).dx).toBe(0);
  });

  it('preserves exact alignment when positions already share a grid line', () => {
    const existing = [bounds('existing', 304, 96)];
    const dragged = bounds('dragged', 304, 304);

    expect(computeAlignmentSnapDelta(dragged, existing, 8)).toEqual({ dx: 0, dy: 0 });
  });

  it('does not snap outside the zoom-adjusted threshold', () => {
    const existing = [bounds('existing', 300, 100)];
    const dragged = bounds('dragged', 309, 300);

    expect(computeAlignmentSnapDelta(dragged, existing, 8).dx).toBe(0);
  });

  it('uses the same winning target for the guide and snap delta', () => {
    const existing = [bounds('existing', 300, 100)];
    const dragged = bounds('dragged', 305, 300);

    const result = computeAlignmentResult(dragged, existing, 8);

    expect(result.delta.dx).toBe(-5);
    expect(
      result.guides.some(
        ({ orientation, position }) => orientation === 'vertical' && position === 350
      )
    ).toBe(true);
  });

  it('shows left, center, and right guides when equal-size nodes align', () => {
    const existing = [bounds('existing', 300, 100)];
    const dragged = bounds('dragged', 305, 300);

    const result = computeAlignmentResult(dragged, existing, 8);

    expect(result.delta.dx).toBe(-5);
    expect(
      result.guides
        .filter(({ orientation }) => orientation === 'vertical')
        .map(({ position }) => position)
    ).toEqual([300, 350, 400]);
  });

  it('uses unique guide IDs when zero-size bounds share every anchor', () => {
    const existing = [bounds('existing', 300, 100, 0, 0)];
    const dragged = bounds('dragged', 300, 100, 0, 0);

    const { guides } = computeAlignmentResult(dragged, existing, 8);

    expect(guides).toHaveLength(6);
    expect(new Set(guides.map(({ id }) => id)).size).toBe(guides.length);
  });

  it('applies one rigid delta to every node in a multi-selection', () => {
    const selected = [
      { id: 'first', position: { x: 100, y: 200 } },
      { id: 'second', position: { x: 260, y: 340 } },
    ] as Node[];

    expect(createAlignmentPositionUpdates(selected, { dx: -4, dy: 6 })).toEqual([
      { id: 'first', position: { x: 96, y: 206 } },
      { id: 'second', position: { x: 256, y: 346 } },
    ]);
  });
});

describe('alignment bounds', () => {
  it('uses xyflow absolute coordinates when they are available', () => {
    const node = {
      id: 'child',
      position: { x: 20, y: 30 },
      measured: { width: 100, height: 60 },
      internals: { positionAbsolute: { x: 220, y: 330 } },
    } as Node;

    expect(toBounds(node)).toMatchObject({ x1: 220, y1: 330, x2: 320, y2: 390 });
  });

  it('derives absolute coordinates for nested nodes when internals are unavailable', () => {
    const parent = { id: 'parent', position: { x: 200, y: 300 } } as Node;
    const child = {
      id: 'child',
      parentId: 'parent',
      position: { x: 20, y: 30 },
      measured: { width: 100, height: 60 },
    } as Node;
    const nodes = [parent, child];

    expect(toBounds(child, nodes)).toMatchObject({ x1: 220, y1: 330, x2: 320, y2: 390 });
    expect(toGroupBounds([child], nodes)).toMatchObject({ x1: 220, y1: 330, x2: 320, y2: 390 });
  });
});
