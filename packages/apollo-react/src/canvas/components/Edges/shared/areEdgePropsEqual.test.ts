import type { EdgeProps } from '@uipath/apollo-react/canvas/xyflow/react';
import { Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it } from 'vitest';
import { areEdgePropsEqual } from './areEdgePropsEqual';

const baseProps = {
  id: 'e1',
  selected: false,
  animated: false,
  source: 'a',
  target: 'b',
  sourceHandleId: 'out',
  targetHandleId: 'in',
  sourcePosition: Position.Right,
  targetPosition: Position.Left,
  sourceX: 100,
  sourceY: 100,
  targetX: 400,
  targetY: 100,
  data: { enableExecution: true },
  style: { strokeWidth: 2 },
} as unknown as EdgeProps;

function withChanges(changes: Partial<Record<keyof EdgeProps, unknown>>): EdgeProps {
  return { ...baseProps, ...changes } as EdgeProps;
}

describe('areEdgePropsEqual', () => {
  it('treats identical props as equal', () => {
    expect(areEdgePropsEqual(baseProps, withChanges({}))).toBe(true);
  });

  it('suppresses sub-pixel coordinate jitter (≤ 0.5px)', () => {
    expect(
      areEdgePropsEqual(
        baseProps,
        withChanges({ sourceX: 100.4, sourceY: 99.6, targetX: 400.3, targetY: 100.2 })
      )
    ).toBe(true);
  });

  it('re-renders when a coordinate moves more than the threshold', () => {
    expect(areEdgePropsEqual(baseProps, withChanges({ targetX: 401 }))).toBe(false);
  });

  it.each([
    ['selected', true],
    ['animated', true],
    ['source', 'other'],
    ['target', 'other'],
    ['sourceHandleId', 'other'],
    ['targetHandleId', 'other'],
    ['sourcePosition', Position.Bottom],
    ['targetPosition', Position.Top],
    ['data', { enableExecution: true }], // new identity, same shape
    ['style', { strokeWidth: 2 }], // new identity, same shape
  ] as const)('re-renders when %s changes', (key, value) => {
    expect(areEdgePropsEqual(baseProps, withChanges({ [key]: value }))).toBe(false);
  });
});
