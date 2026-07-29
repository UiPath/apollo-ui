import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '../../../utils/testing';
import type { StageTaskItem } from '../StageNode.types';
import { StageTaskEntryConditionIcon } from './StageTaskEntryConditionIcon';

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

const createTask = (overrides: Partial<StageTaskItem> = {}): StageTaskItem => ({
  id: 'task-1',
  label: 'Task 1',
  ...overrides,
});

describe('StageTaskEntryConditionIcon', () => {
  it('renders nothing when the task has no entry condition', () => {
    render(<StageTaskEntryConditionIcon task={createTask()} />);

    expect(screen.queryByTestId('task-entry-condition-icon-task-1')).not.toBeInTheDocument();
  });

  it('renders a task-scoped entry-condition icon when the task has an entry condition', () => {
    render(<StageTaskEntryConditionIcon task={createTask({ hasEntryCondition: true })} />);

    expect(screen.getByTestId('task-entry-condition-icon-task-1')).toBeInTheDocument();
  });

  it('renders a 20px diamond by default', () => {
    const { container } = render(
      <StageTaskEntryConditionIcon task={createTask({ hasEntryCondition: true })} />
    );

    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '20');
    expect(svg).toHaveAttribute('height', '20');
  });

  it('renders a 16px diamond when small', () => {
    const { container } = render(
      <StageTaskEntryConditionIcon task={createTask({ hasEntryCondition: true })} small />
    );

    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '16');
    expect(svg).toHaveAttribute('height', '16');
  });
});
