import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '../../../utils/testing';
import { StageEntryConditionIcon } from './StageEntryConditionIcon';

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

describe('StageEntryConditionIcon', () => {
  it('renders under the default test id when none is supplied', () => {
    render(<StageEntryConditionIcon />);

    expect(screen.getByTestId('entry-condition-icon')).toBeInTheDocument();
  });

  it('uses a caller-supplied test id instead of the default', () => {
    render(<StageEntryConditionIcon dataTestId="task-entry-condition-icon-task-1" />);

    expect(screen.getByTestId('task-entry-condition-icon-task-1')).toBeInTheDocument();
    expect(screen.queryByTestId('entry-condition-icon')).not.toBeInTheDocument();
  });

  it('wraps the glyph in an "Entry condition" tooltip', () => {
    render(<StageEntryConditionIcon />);

    expect(screen.getByTestId('canvas-tooltip')).toHaveAttribute(
      'data-tooltip-content',
      'Entry condition'
    );
  });

  it('renders a 20px diamond at the default size', () => {
    const { container } = render(<StageEntryConditionIcon />);

    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '20');
    expect(svg).toHaveAttribute('height', '20');
  });

  it('renders a 16px diamond when small', () => {
    const { container } = render(<StageEntryConditionIcon small />);

    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '16');
    expect(svg).toHaveAttribute('height', '16');
  });
});
