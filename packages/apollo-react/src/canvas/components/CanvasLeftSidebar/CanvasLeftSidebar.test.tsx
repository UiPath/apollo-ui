import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  CANVAS_LEFT_SIDEBAR_COLLAPSED_WIDTH,
  CANVAS_LEFT_SIDEBAR_RAIL_WIDTH,
  CANVAS_LEFT_SIDEBAR_WIDTH,
  CanvasLeftSidebar,
} from './CanvasLeftSidebar';

describe('CanvasLeftSidebar', () => {
  it('renders its title and content when expanded', () => {
    render(
      <CanvasLeftSidebar title="Variables" isExpanded onExpandedChange={vi.fn()}>
        Sidebar content
      </CanvasLeftSidebar>
    );

    expect(screen.getByRole('heading', { name: 'Variables' })).toBeInTheDocument();
    expect(screen.getByText('Sidebar content')).toBeInTheDocument();
    expect(screen.getByTestId('canvas-left-sidebar')).toHaveStyle({
      width: `${CANVAS_LEFT_SIDEBAR_RAIL_WIDTH + CANVAS_LEFT_SIDEBAR_WIDTH}px`,
    });
  });

  it('requests collapse from the expanded state', async () => {
    const onExpandedChange = vi.fn();
    render(<CanvasLeftSidebar title="Variables" isExpanded onExpandedChange={onExpandedChange} />);

    await userEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }));
    expect(onExpandedChange).toHaveBeenCalledWith(false);
  });

  it('hides content and requests expansion from the collapsed state', async () => {
    const onExpandedChange = vi.fn();
    render(
      <CanvasLeftSidebar title="Variables" isExpanded={false} onExpandedChange={onExpandedChange}>
        Sidebar content
      </CanvasLeftSidebar>
    );

    const contentPanel = screen.getByText('Variables').closest('[aria-hidden]');
    expect(contentPanel).toHaveAttribute('aria-hidden', 'true');
    expect(contentPanel).toHaveAttribute('inert');
    expect(screen.getByTestId('canvas-left-sidebar')).toHaveStyle({
      width: `${CANVAS_LEFT_SIDEBAR_COLLAPSED_WIDTH}px`,
    });

    await userEvent.click(screen.getByRole('button', { name: 'Variables' }));
    expect(onExpandedChange).toHaveBeenCalledWith(true);
  });

  it('renders persistent primary and utility rail actions', () => {
    render(<CanvasLeftSidebar title="Variables" isExpanded={false} onExpandedChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Home' })).toBeInTheDocument();
    for (const label of [
      'Coding agent',
      'Files',
      'Variables',
      'Connections',
      'Run history',
      "What's new",
      'Account',
    ]) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }
  });

  it('supports consumer-defined navigation and exposes the active item', () => {
    render(
      <CanvasLeftSidebar
        title="Search"
        isExpanded
        onExpandedChange={vi.fn()}
        activeItemId="search"
        primaryItems={[{ id: 'search', label: 'Search', icon: <span>Icon</span> }]}
        bottomItems={[]}
      />
    );

    expect(screen.getByRole('button', { name: 'Search' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByRole('button', { name: "What's new" })).not.toBeInTheDocument();
  });
});
