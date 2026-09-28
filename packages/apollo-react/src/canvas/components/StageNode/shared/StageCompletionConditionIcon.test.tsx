import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '../../../utils/testing';
import { StageCompletionConditionIcon } from './StageCompletionConditionIcon';

// Surface CanvasTooltip content into the DOM so the tooltip copy can be
// asserted without relying on Radix's hover-driven open/close (unreliable in
// happy-dom). Mirrors the pattern used in tasks/TaskContent.test.tsx.
vi.mock('../../CanvasTooltip', () => ({
  CanvasTooltip: ({ content, children }: { content: ReactNode; children: ReactNode }) => (
    <span
      data-testid="canvas-tooltip"
      data-tooltip-content={typeof content === 'string' ? content : ''}
    >
      {children}
    </span>
  ),
}));

describe('StageCompletionConditionIcon', () => {
  it('renders under the default test id when none is supplied', () => {
    render(<StageCompletionConditionIcon />);

    expect(screen.getByTestId('completion-condition-icon')).toBeInTheDocument();
  });

  it('uses a caller-supplied test id instead of the default', () => {
    render(<StageCompletionConditionIcon dataTestId="completion-icon-stage-1" />);

    expect(screen.getByTestId('completion-icon-stage-1')).toBeInTheDocument();
    expect(screen.queryByTestId('completion-condition-icon')).not.toBeInTheDocument();
  });

  it('wraps the glyph in a "Completion condition" tooltip', () => {
    render(<StageCompletionConditionIcon />);

    expect(screen.getByTestId('canvas-tooltip')).toHaveAttribute(
      'data-tooltip-content',
      'Completion condition'
    );
  });

  it('renders a 20px checklist at the default size', () => {
    const { container } = render(<StageCompletionConditionIcon />);

    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '20');
    expect(svg).toHaveAttribute('height', '20');
  });

  it('renders a 16px checklist when small', () => {
    const { container } = render(<StageCompletionConditionIcon small />);

    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '16');
    expect(svg).toHaveAttribute('height', '16');
  });
});
