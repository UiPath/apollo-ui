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

  it('renders a tight diamond when default', () => {
    const { container } = render(
      <StageTaskEntryConditionIcon task={createTask({ hasEntryCondition: true })} />
    );

    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '13');
    expect(svg).toHaveAttribute('height', '15');
  });
});
