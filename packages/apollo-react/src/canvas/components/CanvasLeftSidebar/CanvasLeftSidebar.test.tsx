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

  it('omits the content header when requested', () => {
    render(
      <CanvasLeftSidebar
        title="Variables"
        isExpanded
        onExpandedChange={vi.fn()}
        showContentHeader={false}
        headerActions={<button type="button">Header action</button>}
      >
        Sidebar content
      </CanvasLeftSidebar>
    );

    expect(screen.queryByRole('heading', { name: 'Variables' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Header action' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Collapse sidebar' })).not.toBeInTheDocument();
    expect(screen.getByText('Sidebar content')).toBeInTheDocument();
  });

  it('uses a consumer-defined expanded content width', () => {
    const expandedContentWidth = 420;
    render(
      <CanvasLeftSidebar
        title="Variables"
        isExpanded
        onExpandedChange={vi.fn()}
        expandedContentWidth={expandedContentWidth}
      />
    );

    expect(screen.getByTestId('canvas-left-sidebar')).toHaveStyle({
      width: `${CANVAS_LEFT_SIDEBAR_RAIL_WIDTH + expandedContentWidth}px`,
    });
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

    expect(screen.queryByRole('button', { name: 'Home' })).not.toBeInTheDocument();
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

  it('makes the logo actionable only when a click handler is provided', async () => {
    const onLogoClick = vi.fn();
    render(
      <CanvasLeftSidebar
        title="Variables"
        isExpanded={false}
        onExpandedChange={vi.fn()}
        onLogoClick={onLogoClick}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Home' }));
    expect(onLogoClick).toHaveBeenCalledOnce();
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
