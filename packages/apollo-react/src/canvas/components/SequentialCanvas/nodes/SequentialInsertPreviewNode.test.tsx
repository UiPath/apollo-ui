import { describe, expect, it } from 'vitest';
import { render, screen } from '../../../utils/testing';
import { SequentialInsertPreviewNode } from './SequentialInsertPreviewNode';

// xyflow is globally mocked in test/canvas-mocks.ts, where <Handle> renders as an
// inert `handle-${type}-${id}` marker. That keeps the handle ids assertable
// without a store: the Add Node preview edges are built against those exact ids.

function renderPreview(width?: number, height?: number) {
  // biome-ignore lint/suspicious/noExplicitAny: minimal NodeProps stub for a focused render test.
  return render(<SequentialInsertPreviewNode {...({ id: 'preview', width, height } as any)} />);
}

describe('SequentialInsertPreviewNode', () => {
  it('renders the ghost bar with the "New step" label', () => {
    renderPreview(896, 56);

    expect(screen.getByTestId('sequential-insert-preview-bar')).toBeInTheDocument();
    expect(screen.getByText('New step')).toBeInTheDocument();
  });

  it('renders without dimensions, since the preview mounts before layout assigns a slot', () => {
    // The Add Node pipeline drops the preview node into the store before the
    // sequential layout has opened a gap for it, so the first render has no
    // width/height. It must still mount rather than throwing on undefined.
    renderPreview();

    expect(screen.getByTestId('sequential-insert-preview-bar')).toBeInTheDocument();
  });

  it('carries the handle ids the Add Node preview edges connect to', () => {
    // A rename here would leave the preview edges unrouted while everything
    // still rendered, so the ids are asserted rather than assumed.
    renderPreview(896, 56);

    expect(screen.getByTestId('handle-target-input')).toBeInTheDocument();
    expect(screen.getByTestId('handle-source-output')).toBeInTheDocument();
  });
});
