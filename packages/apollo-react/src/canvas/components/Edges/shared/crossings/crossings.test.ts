import { describe, expect, it } from 'vitest';
import type { Point } from '../types';
import { computeLineJumps, type EdgePolyline, jumpsEqual } from './crossings';

const line = (edgeId: string, ...points: Point[]): EdgePolyline => ({ edgeId, points });

/** A horizontal line at y=50 and a vertical line at x=50 forming a plain X. */
const horizontal = line('h', { x: 0, y: 50 }, { x: 100, y: 50 });
const vertical = line('v', { x: 50, y: 0 }, { x: 50, y: 100 });

describe('computeLineJumps', () => {
  it('puts a jump on the horizontal edge where it crosses a vertical one', () => {
    const jumps = computeLineJumps([horizontal, vertical]);

    expect(jumps.get('h')).toEqual([{ segmentIndex: 0, point: { x: 50, y: 50 } }]);
    // The vertical line is drawn straight through.
    expect(jumps.has('v')).toBe(false);
  });

  it('is independent of the order the edges are registered in', () => {
    expect(computeLineJumps([vertical, horizontal])).toEqual(
      computeLineJumps([horizontal, vertical])
    );
  });

  it('reports the index of the segment the crossing sits on', () => {
    // Two elbows: segment 0 is horizontal, 1 is vertical, 2 is horizontal again.
    const elbowed = line(
      'h',
      { x: 0, y: 0 },
      { x: 200, y: 0 },
      { x: 200, y: 100 },
      { x: 400, y: 100 }
    );
    const crossing = line('v', { x: 300, y: 50 }, { x: 300, y: 150 });

    expect(computeLineJumps([elbowed, crossing]).get('h')).toEqual([
      { segmentIndex: 2, point: { x: 300, y: 100 } },
    ]);
  });

  it('ignores a T-junction where one line ends on the other', () => {
    // The vertical stops exactly on the horizontal rather than passing through.
    const tee = line('v', { x: 50, y: 0 }, { x: 50, y: 50 });

    expect(computeLineJumps([horizontal, tee]).size).toBe(0);
  });

  it('ignores lines that meet at a shared endpoint', () => {
    const fanOut = line('v', { x: 0, y: 50 }, { x: 0, y: 200 });

    expect(computeLineJumps([horizontal, fanOut]).size).toBe(0);
  });

  it('ignores collinear overlap between two edges sharing a lane', () => {
    const overlapping = line('h2', { x: 20, y: 50 }, { x: 80, y: 50 });

    expect(computeLineJumps([horizontal, overlapping]).size).toBe(0);
  });

  it('ignores an edge crossing itself', () => {
    const selfCrossing = line(
      'h',
      { x: 0, y: 50 },
      { x: 100, y: 50 },
      { x: 100, y: 0 },
      { x: 50, y: 0 },
      { x: 50, y: 100 }
    );

    expect(computeLineJumps([selfCrossing]).size).toBe(0);
  });

  it('returns several crossings on one segment ordered by x', () => {
    const first = line('v1', { x: 30, y: 0 }, { x: 30, y: 100 });
    const second = line('v2', { x: 70, y: 0 }, { x: 70, y: 100 });

    expect(computeLineJumps([horizontal, second, first]).get('h')).toEqual([
      { segmentIndex: 0, point: { x: 30, y: 50 } },
      { segmentIndex: 0, point: { x: 70, y: 50 } },
    ]);
  });

  it('collapses two verticals stacked on the same x into a single jump', () => {
    const first = line('v1', { x: 50, y: 0 }, { x: 50, y: 100 });
    const second = line('v2', { x: 50, y: 10 }, { x: 50, y: 90 });

    expect(computeLineJumps([horizontal, first, second]).get('h')).toHaveLength(1);
  });

  it('returns nothing when the graph has no vertical segments to cross', () => {
    const other = line('h2', { x: 0, y: 80 }, { x: 100, y: 80 });

    expect(computeLineJumps([horizontal, other]).size).toBe(0);
  });
});

describe('jumpsEqual', () => {
  it('treats positionally identical lists as equal', () => {
    expect(
      jumpsEqual(
        [{ segmentIndex: 1, point: { x: 10, y: 20 } }],
        [{ segmentIndex: 1, point: { x: 10, y: 20 } }]
      )
    ).toBe(true);
  });

  it('separates lists that differ in segment, position, or length', () => {
    const base = [{ segmentIndex: 1, point: { x: 10, y: 20 } }];

    expect(jumpsEqual(base, [{ segmentIndex: 2, point: { x: 10, y: 20 } }])).toBe(false);
    expect(jumpsEqual(base, [{ segmentIndex: 1, point: { x: 40, y: 20 } }])).toBe(false);
    expect(jumpsEqual(base, [])).toBe(false);
  });
});
