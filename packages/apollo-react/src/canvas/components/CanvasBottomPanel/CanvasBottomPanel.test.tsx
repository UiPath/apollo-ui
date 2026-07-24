import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { CanvasBottomPanel } from './CanvasBottomPanel';
import type { CanvasBottomPanelTab } from './CanvasBottomPanel.types';

const tabs: CanvasBottomPanelTab[] = [
  { id: 'debug', label: 'Debug', content: <div data-testid="debug-content">Debug view</div> },
  {
    id: 'evaluate',
    label: 'Evaluate',
    content: <div data-testid="evaluate-content">Evaluate view</div>,
  },
];

function renderPanel(overrides: Partial<ComponentProps<typeof CanvasBottomPanel>> = {}) {
  const props: ComponentProps<typeof CanvasBottomPanel> = {
    tabs,
    activeTabId: 'debug',
    onTabChange: vi.fn(),
    isCollapsed: false,
    onCollapsedChange: vi.fn(),
    ...overrides,
  };
  return { ...render(<CanvasBottomPanel {...props} />), props };
}

describe('CanvasBottomPanel', () => {
  it('renders consumer-provided tabs and only displays the active content', () => {
    renderPanel();

    expect(screen.getByRole('tab', { name: 'Debug' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Evaluate' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByTestId('debug-content').parentElement).toHaveStyle({ display: 'block' });
    expect(screen.getByTestId('evaluate-content').parentElement).toHaveStyle({
      display: 'none',
    });
  });

  it('reports tab changes without owning active state', () => {
    const onTabChange = vi.fn();
    renderPanel({ onTabChange });

    fireEvent.click(screen.getByRole('tab', { name: 'Evaluate' }));

    expect(onTabChange).toHaveBeenCalledWith('evaluate');
    expect(screen.getByRole('tab', { name: 'Debug' })).toHaveAttribute('aria-selected', 'true');
  });

  it('keeps tab content mounted when inactive or collapsed', () => {
    renderPanel({ isCollapsed: true });

    expect(screen.getByTestId('canvas-bottom-panel-content')).toHaveStyle({ display: 'none' });
    expect(screen.getByTestId('debug-content')).toBeInTheDocument();
    expect(screen.getByTestId('evaluate-content')).toBeInTheDocument();
  });

  it('expands when a tab is selected while collapsed', () => {
    const onCollapsedChange = vi.fn();
    renderPanel({ isCollapsed: true, onCollapsedChange });

    fireEvent.click(screen.getByRole('tab', { name: 'Evaluate' }));

    expect(onCollapsedChange).toHaveBeenCalledWith(false);
  });

  it('renders optional consumer-owned header actions', () => {
    renderPanel({ headerActions: <button type="button">Collapse panel</button> });

    expect(screen.getByRole('button', { name: 'Collapse panel' })).toBeInTheDocument();
  });

  it('associates each tab with its panel and applies roving tab index', () => {
    renderPanel();

    const debugTab = screen.getByRole('tab', { name: 'Debug' });
    const evaluateTab = screen.getByRole('tab', { name: 'Evaluate' });
    const debugPanel = document.getElementById(debugTab.getAttribute('aria-controls') ?? '');

    expect(debugTab).toHaveAttribute('tabindex', '0');
    expect(evaluateTab).toHaveAttribute('tabindex', '-1');
    expect(debugPanel).toHaveAttribute('aria-labelledby', debugTab.id);
  });

  it.each([
    ['ArrowRight', 'evaluate'],
    ['ArrowLeft', 'evaluate'],
    ['End', 'evaluate'],
    ['Home', 'debug'],
  ])('supports %s keyboard navigation', (key, expectedTab) => {
    const onTabChange = vi.fn();
    renderPanel({ onTabChange });

    fireEvent.keyDown(screen.getByRole('tab', { name: 'Debug' }), { key });

    expect(onTabChange).toHaveBeenLastCalledWith(expectedTab);
  });
});
