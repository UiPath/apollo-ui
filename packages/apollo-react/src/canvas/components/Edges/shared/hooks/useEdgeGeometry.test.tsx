import { renderHook } from '@testing-library/react';
import { Position, ReactFlowProvider } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it, vi } from 'vitest';
import { ARROW_ANGLE_MAP } from '../constants';
import { useEdgeGeometry } from './useEdgeGeometry';

vi.unmock('@uipath/apollo-react/canvas/xyflow/react');

const geometry = (verbatimWaypoints: boolean) =>
  renderHook(
    () =>
      useEdgeGeometry({
        routing: 'waypoint',
        edgeId: 'edge',
        sourceNodeId: 'a',
        targetNodeId: 'b',
        sourceHandleId: null,
        targetHandleId: null,
        sourceX: 0,
        sourceY: 0,
        sourcePosition: Position.Right,
        // Ends on a diagonal into the target's left side.
        targetX: 100,
        targetY: 100,
        targetPosition: Position.Left,
        waypoints: [{ id: 'w', x: 50, y: 50 }],
        verbatimWaypoints,
      }),
    { wrapper: ReactFlowProvider }
  ).result.current;

describe('useEdgeGeometry arrow angle', () => {
  it('follows the target side for a routed path', () => {
    expect(geometry(false).arrow.angle).toBe(ARROW_ANGLE_MAP[Position.Left]);
  });

  it('follows the last segment of a verbatim route', () => {
    const { arrow, pathPoints } = geometry(true);
    const end = pathPoints[pathPoints.length - 1]!;
    const before = pathPoints[pathPoints.length - 2]!;

    expect(arrow.angle).toBeCloseTo(Math.atan2(end.y - before.y, end.x - before.x));
    expect(arrow.angle).not.toBe(ARROW_ANGLE_MAP[Position.Left]);
  });
});
