import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import * as stories from './DecisionGraphText.stories';

vi.unmock('@uipath/apollo-wind/components/ui/tooltip');

const { Errors } = composeStories(stories);

describe('DecisionGraphText stories', () => {
  it.each([
    'read',
    'select',
    'edit',
  ] as const)('opens Risk on its far rule from the warning in %s mode', async (mode) => {
    HTMLElement.prototype.scrollTo = () => {};
    render(<Errors mode={mode} />);
    await userEvent.click(screen.getByTestId('graph-mark-risk'));
    expect(document.activeElement).toBe(screen.getByTestId('text-risk-row-r20'));
  });
});
