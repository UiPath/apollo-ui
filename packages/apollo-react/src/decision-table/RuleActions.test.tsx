import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RuleActions } from './RuleActions';

vi.unmock('@uipath/apollo-wind/components/ui/tooltip');

afterEach(cleanup);

const labels = {
  addCondition: (position: number) => `Add condition to rule ${position}`,
  ruleActions: (position: number) => `Rule ${position} actions`,
};

describe('RuleActions', () => {
  it('offers only add condition and the rule menu', () => {
    render(<RuleActions position={2} selected labels={labels} openMenu={undefined} />);
    expect(
      screen.getAllByRole('button').map((button) => button.getAttribute('aria-label'))
    ).toEqual(['Add condition to rule 2', 'Rule 2 actions']);
  });

  it.each([
    'Add condition to rule 2',
    'Rule 2 actions',
  ])('names %s in a tooltip on hover', async (name) => {
    render(<RuleActions position={2} selected labels={labels} openMenu={undefined} />);
    await userEvent.hover(screen.getByRole('button', { name }));
    expect(await screen.findByRole('tooltip')).toHaveTextContent(name);
  });
});
