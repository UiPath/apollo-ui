import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { StageTaskItem } from '../StageNode.types';
import { EventDrivenTaskItem } from './EventDrivenTask';

const createTask = (id: string, label?: string): StageTaskItem => ({
  id,
  label: label ?? `Task ${id}`,
  taskGroupType: 'event-driven',
});

describe('EventDrivenTaskItem', () => {
  const defaultProps = {
    task: createTask('event-driven-1', 'Event Driven Task'),
    isSelected: false,
    onTaskClick: vi.fn(),
  };

  it('renders task with correct testid', () => {
    render(<EventDrivenTaskItem {...defaultProps} />);

    expect(screen.getByTestId('stage-task-card-event-driven-1')).toBeInTheDocument();
  });

  it('renders task label', () => {
    render(<EventDrivenTaskItem {...defaultProps} />);

    expect(screen.getByText('Event Driven Task')).toBeInTheDocument();
  });

  it('exposes exactly one element under the stage-task-card- prefix with every part rendered', () => {
    const { container } = render(
      <EventDrivenTaskItem
        {...defaultProps}
        taskExecution={{
          status: 'Completed',
          retryCount: 2,
          retryDuration: '5s',
          durationMs: 1234,
        }}
        getContextMenuItems={() => [{ id: 'remove-task', label: 'Delete task', onClick: vi.fn() }]}
        onToggleBreakpoint={vi.fn()}
      />
    );

    const matches = container.querySelectorAll('[data-testid^="stage-task-card-"]');

    expect(Array.from(matches, (match) => match.getAttribute('data-testid'))).toEqual([
      'stage-task-card-event-driven-1',
    ]);
  });
});
