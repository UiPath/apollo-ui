import { render } from '@testing-library/react';
import type { EdgeProps } from '@uipath/apollo-react/canvas/xyflow/react';
import { Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it, vi } from 'vitest';
import { Edge } from './Edge';

// Mock StaticEdge
vi.mock('./StaticEdge', () => ({
  StaticEdge: (props: Record<string, unknown>) => {
    // Filter out EdgeProps that would cause React warnings
    const {
      sourceX: _sourceX,
      sourceY: _sourceY,
      targetX: _targetX,
      targetY: _targetY,
      sourcePosition: _sourcePosition,
      targetPosition: _targetPosition,
      source: _source,
      target: _target,
      id: _id,
      data: _data,
      selected: _selected,
      animated: _animated,
      style: _style,
      markerEnd: _markerEnd,
      markerStart: _markerStart,
      interactionWidth: _interactionWidth,
      label: _label,
      labelStyle: _labelStyle,
      labelShowBg: _labelShowBg,
      labelBgStyle: _labelBgStyle,
      labelBgPadding: _labelBgPadding,
      labelBgBorderRadius: _labelBgBorderRadius,
      deletable: _deletable,
      selectable: _selectable,
      ..._rest
    } = props;
    return <div data-testid="default-edge" />;
  },
}));

// Mock useAgentFlowStore
const mockNodes = [
  { id: 'agent', type: 'agent' },
  {
    id: 'resource',
    type: 'resource',
    selected: true,
    data: { hasError: false, hasSuccess: false, hasRunning: false },
  },
];
vi.mock('../store/agent-flow-store', () => ({
  useAgentFlowStore: () => ({
    nodes: mockNodes,
    props: { mode: 'view' }, // Add props with mode
  }),
}));

const baseEdgeProps: Omit<EdgeProps, 'id' | 'source' | 'target'> = {
  sourceX: 0,
  sourceY: 0,
  targetX: 0,
  targetY: 0,
  sourcePosition: Position.Right,
  targetPosition: Position.Left,
  data: {},
  selected: false,
  animated: false,
  style: {},
  markerEnd: undefined,
  markerStart: undefined,
  interactionWidth: 0,
  label: undefined,
  labelStyle: undefined,
  labelShowBg: undefined,
  labelBgStyle: undefined,
  labelBgPadding: undefined,
  labelBgBorderRadius: undefined,
  deletable: undefined,
  selectable: undefined,
};

describe('Edge', () => {
  it('renders StaticEdge', () => {
    // Neither agent nor resource is selected
    const props: EdgeProps = {
      ...baseEdgeProps,
      id: 'test-edge',
      source: 'agent',
      target: 'resource',
    };
    // Change selected to false
    (mockNodes[1] as NonNullable<(typeof mockNodes)[number]>).selected = false;
    const { getByTestId } = render(<Edge {...props} />);
    expect(getByTestId('default-edge')).toBeInTheDocument();
  });
});
