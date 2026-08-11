import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { CanvasBottomPanel, CanvasBottomPanelActions } from './CanvasBottomPanel';
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

  it('renders a separator between adjacent tab groups', () => {
    renderPanel({
      tabs: [
        { id: 'debug', label: 'Debug', group: 'debug', content: null },
        { id: 'evaluate', label: 'Evaluate', group: 'evaluation', content: null },
      ],
    });

    expect(screen.getByTestId('canvas-bottom-panel-tab-separator')).toBeInTheDocument();
  });

  it('supports a docked treatment and a consumer-defined collapsed height', () => {
    renderPanel({ variant: 'docked', isCollapsed: true, collapsedHeight: 36 });

    const panel = screen.getByTestId('canvas-bottom-panel');
    const header = panel.querySelector('header');
    expect(panel).toHaveStyle({ height: '36px' });
    expect(header).toHaveStyle({ height: '36px' });
    expect(panel).not.toHaveClass('rounded-2xl');
    expect(panel).not.toHaveClass('shadow-lg');
  });

  it('supports an expand-only host callback', () => {
    const onExpand = vi.fn();
    renderPanel({ isCollapsed: true, onCollapsedChange: undefined, onExpand });

    fireEvent.click(screen.getByRole('tab', { name: 'Evaluate' }));

    expect(onExpand).toHaveBeenCalledOnce();
  });

  it('portals active tab actions into the header and hides inactive actions', () => {
    renderPanel({
      tabs: [
        {
          id: 'debug',
          label: 'Debug',
          content: (
            <CanvasBottomPanelActions>
              <button type="button">Clear debug results</button>
            </CanvasBottomPanelActions>
          ),
        },
        {
          id: 'evaluate',
          label: 'Evaluate',
          content: (
            <CanvasBottomPanelActions>
              <button type="button">Run evaluation</button>
            </CanvasBottomPanelActions>
          ),
        },
      ],
    });

    const slot = screen.getByTestId('canvas-bottom-panel-tab-actions');
    expect(slot).toContainElement(screen.getByRole('button', { name: 'Clear debug results' }));
    expect(screen.queryByRole('button', { name: 'Run evaluation' })).not.toBeInTheDocument();
  });

  it('mounts shared overlay content once across related tab switches', () => {
    const overlay = {
      tabIds: ['debug', 'evaluate'],
      content: <div data-testid="shared-evaluation-view">Shared view</div>,
    };
    const { rerender } = renderPanel({ overlay });
    const hostBefore = screen.getByTestId('canvas-bottom-panel-overlay');
    const contentBefore = screen.getByTestId('shared-evaluation-view');

    rerender(
      <CanvasBottomPanel
        tabs={tabs}
        activeTabId="evaluate"
        onTabChange={vi.fn()}
        overlay={overlay}
      />
    );

    const hostAfter = screen.getByTestId('canvas-bottom-panel-overlay');
    expect(hostAfter).toBe(hostBefore);
    expect(screen.getByTestId('shared-evaluation-view')).toBe(contentBefore);
    expect(hostAfter).toHaveAttribute('aria-labelledby', 'canvas-bottom-panel-tab-evaluate');
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
