import { composeStories } from '@storybook/react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import * as stories from './DecisionGraphText.stories';

const { Default } = composeStories(stories);
afterEach(cleanup);

describe('DecisionGraphText theme', () => {
  it('paints the graph and its portalled minimap in the given theme', async () => {
    render(<Default theme="future-dark" />);
    expect(screen.getByTestId('graph')).toHaveClass('future-dark');
    await userEvent.click(screen.getByTestId('graph-minimap-trigger'));
    const minimap = await screen.findByTestId('graph-minimap-content');
    expect(minimap.closest('[data-slot="decision-theme-overlays"]')).toHaveClass('future-dark');
  });

  it("leaves the graph and its minimap to the host's theme when none is given", async () => {
    render(<Default theme="host" />);
    const { classList } = screen.getByTestId('graph');
    expect(
      ['future-light', 'future-dark', 'cartographer'].filter((theme) => classList.contains(theme))
    ).toEqual([]);
    await userEvent.click(screen.getByTestId('graph-minimap-trigger'));
    await screen.findByTestId('graph-minimap-content');
    expect(document.querySelector('[data-slot="decision-theme-overlays"]')).not.toHaveAttribute(
      'class'
    );
  });
});
