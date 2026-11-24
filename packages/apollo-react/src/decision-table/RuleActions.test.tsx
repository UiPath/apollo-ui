import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RemoveConditionButton } from './RemoveConditionButton';
import { RuleActions } from './RuleActions';

vi.unmock('@uipath/apollo-wind/components/ui/tooltip');

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const labels = {
  addCondition: (position: number) => `Add condition to rule ${position}`,
  ruleActions: (position: number) => `Rule ${position} actions`,
  deleteRule: (position: number) => `Delete rule ${position}`,
};

const hoverShowsTooltip = (name: string) => {
  fireEvent.pointerMove(screen.getByRole('button', { name }), { pointerType: 'mouse' });
  act(() => {
    vi.advanceTimersByTime(1000);
  });
  expect(screen.getByRole('tooltip')).toHaveTextContent(name);
};

describe('rule action tooltips', () => {
  it.each([
    'Add condition to rule 2',
    'Rule 2 actions',
    'Delete rule 2',
  ])('names %s on hover', (name) => {
    render(<RuleActions position={2} selected labels={labels} openMenu={undefined} />);
    hoverShowsTooltip(name);
  });

  it('names the remove condition action on hover', () => {
    render(<RemoveConditionButton columnId="age" label="Remove age from rule 2" />);
    hoverShowsTooltip('Remove age from rule 2');
  });
});
