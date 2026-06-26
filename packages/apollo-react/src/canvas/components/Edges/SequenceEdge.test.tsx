import { render } from '@testing-library/react';
import { Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it, vi } from 'vitest';
import { SequenceEdge } from './SequenceEdge';
import type { CanvasEdgeData, CanvasEdgeProps } from './shared/types';

// Capture what the preset passes down instead of rendering the full edge —
// the wrapper's only job is flag translation.
const { capturedProps } = vi.hoisted(() => ({
  capturedProps: { current: undefined as CanvasEdgeProps | undefined },
}));

vi.mock('./CanvasEdge', () => ({
  CanvasEdge: (props: CanvasEdgeProps) => {
    capturedProps.current = props;
    return null;
  },
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
} as unknown as CanvasEdgeProps;

function renderPreset(data?: Record<string, unknown>): CanvasEdgeData {
  capturedProps.current = undefined;
  render(<SequenceEdge {...baseProps} data={data as CanvasEdgeData} />);
  expect(capturedProps.current).toBeDefined();
  return capturedProps.current?.data as CanvasEdgeData;
}

describe('SequenceEdge preset translation', () => {
  it('defaults to handle routing with execution and toolbar enabled', () => {
    const data = renderPreset();
    expect(data.routing).toBe('handle');
    expect(data.enableExecution).toBe(true);
    expect(data.enableToolbar).toBe(true);
  });

  it('translates the legacy hideToolbar flag to enableToolbar: false and strips it', () => {
    const data = renderPreset({ hideToolbar: true });
    expect(data.enableToolbar).toBe(false);
    expect('hideToolbar' in data).toBe(false);
  });

  it('keeps the toolbar enabled when hideToolbar is absent or false', () => {
    expect(renderPreset({ hideToolbar: false }).enableToolbar).toBe(true);
    expect(renderPreset({}).enableToolbar).toBe(true);
  });

  it('lets consumer data override the preset defaults', () => {
    const data = renderPreset({ enableExecution: false, label: 'Run' });
    expect(data.enableExecution).toBe(false);
    expect(data.label).toBe('Run');
    expect(data.routing).toBe('handle');
  });

  it('passes the remaining edge props through untouched', () => {
    const data = renderPreset({ isDiffRemoved: true, hideArrowHead: true });
    expect(data.isDiffRemoved).toBe(true);
    expect(data.hideArrowHead).toBe(true);
    expect(capturedProps.current?.id).toBe('e1');
    expect(capturedProps.current?.source).toBe('a');
  });
});
