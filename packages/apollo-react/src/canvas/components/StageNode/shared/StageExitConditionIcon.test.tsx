import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '../../../utils/testing';
import { StageExitConditionIcon } from './StageExitConditionIcon';

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

describe('StageExitConditionIcon', () => {
  it('renders under the default test id when none is supplied', () => {
    render(<StageExitConditionIcon />);

    expect(screen.getByTestId('exit-condition-icon')).toBeInTheDocument();
  });

  it('uses a caller-supplied test id instead of the default', () => {
    render(<StageExitConditionIcon dataTestId="exit-icon-stage-1" />);

    expect(screen.getByTestId('exit-icon-stage-1')).toBeInTheDocument();
    expect(screen.queryByTestId('exit-condition-icon')).not.toBeInTheDocument();
  });

  it('wraps the glyph in an "Exit condition" tooltip', () => {
    render(<StageExitConditionIcon />);

    expect(screen.getByTestId('canvas-tooltip')).toHaveAttribute(
      'data-tooltip-content',
      'Exit condition'
    );
  });

  it('renders a 20px diamond at the default size', () => {
    const { container } = render(<StageExitConditionIcon />);

    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '20');
    expect(svg).toHaveAttribute('height', '20');
  });

  it('renders a 16px diamond when small', () => {
    const { container } = render(<StageExitConditionIcon small />);

    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '16');
    expect(svg).toHaveAttribute('height', '16');
  });
});
