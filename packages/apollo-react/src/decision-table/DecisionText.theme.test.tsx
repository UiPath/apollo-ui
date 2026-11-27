import { composeStories } from '@storybook/react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import * as stories from './DecisionText.stories';

const { Default } = composeStories(stories);
afterEach(cleanup);

describe('DecisionText theme', () => {
  it('paints the view and its portalled menu in the given theme', async () => {
    render(<Default theme="cartographer light" />);
    expect(screen.getByTestId('decision-text')).toHaveClass('cartographer');
    await userEvent.click(screen.getByTestId('decision-text-policy'));
    const menu = await screen.findByTestId('decision-text-policy-menu');
    expect(menu.closest('[data-slot="decision-theme-overlays"]')).toHaveClass('cartographer');
  });

  it("leaves the view and its menu to the host's theme when none is given", async () => {
    render(<Default theme="host" />);
    const { classList } = screen.getByTestId('decision-text');
    expect(
      ['future-light', 'future-dark', 'cartographer'].filter((theme) => classList.contains(theme))
    ).toEqual([]);
    await userEvent.click(screen.getByTestId('decision-text-policy'));
    await screen.findByTestId('decision-text-policy-menu');
    expect(document.querySelector('[data-slot="decision-theme-overlays"]')).not.toHaveAttribute(
      'class'
    );
  });

  it('keeps an edited draft open while the theme is set and cleared', () => {
    const { rerender } = render(<Default theme="host" />);
    const age = document.querySelector<HTMLElement>('[data-kind="value"][data-column-id="age"]');
    if (!age) throw new Error('no age value');
    fireEvent.click(age);
    const draft = within(screen.getByTestId('decision-text-value-editor')).getByRole('textbox');
    fireEvent.change(draft, { target: { value: '30' } });
    rerender(<Default theme="cartographer light" />);
    rerender(<Default theme="host" />);
    expect(draft.isConnected).toBe(true);
    expect(draft).toHaveValue('30');
  });
});
