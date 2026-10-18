import { describe, expect, it } from 'vitest';
import { render, screen } from '../../../utils/testing';
import { SequentialInsertPreviewNode } from './SequentialInsertPreviewNode';

// xyflow is mocked globally (test/canvas-mocks.ts); <Handle> renders as a `handle-${type}-${id}` marker.

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
    // The preview enters the store before layout opens a gap for it, so the first render has no size.
    renderPreview();

    expect(screen.getByTestId('sequential-insert-preview-bar')).toBeInTheDocument();
  });

  it('carries the handle ids the Add Node preview edges connect to', () => {
    renderPreview(896, 56);

    expect(screen.getByTestId('handle-target-input')).toBeInTheDocument();
    expect(screen.getByTestId('handle-source-output')).toBeInTheDocument();
  });
});
