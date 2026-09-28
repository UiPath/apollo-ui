import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, userEvent } from '../../../utils/testing';
import { CollapsibleStageHeader } from './CollapsibleStageHeader';

// Surface CanvasTooltip content into the DOM so the label copy can be asserted
// without relying on Radix's hover-driven open/close (unreliable in happy-dom).
vi.mock('../../CanvasTooltip', () => ({
  CanvasTooltip: ({ content, children }: { content: ReactNode; children: ReactNode }) => (
    <span
      data-testid="canvas-tooltip"
      data-tooltip-content={typeof content === 'string' ? content : ''}
    >
      {children}
    </span>
  ),
}));

const renderHeader = (
  overrides: Partial<React.ComponentProps<typeof CollapsibleStageHeader>> = {}
) =>
  render(
    <CollapsibleStageHeader
      isOpen={true}
      label="Entry rules"
      testId="entry-rules-header-stage-1"
      onToggle={vi.fn()}
      {...overrides}
    >
      <div data-testid="section-body">Body</div>
    </CollapsibleStageHeader>
  );

describe('CollapsibleStageHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the wrapper, accordion button and label with derived test ids', () => {
    renderHeader();

    expect(screen.getByTestId('entry-rules-header-stage-1')).toBeInTheDocument();
    expect(screen.getByTestId('entry-rules-header-stage-1-accordion-button')).toBeInTheDocument();
    expect(screen.getByTestId('entry-rules-header-stage-1-label')).toHaveTextContent('Entry rules');
  });

  it('renders the children while open', () => {
    renderHeader({ isOpen: true });

    expect(screen.getByTestId('section-body')).toBeInTheDocument();
  });

  it('does not render the children while collapsed', () => {
    renderHeader({ isOpen: false });

    expect(screen.queryByTestId('section-body')).not.toBeInTheDocument();
  });

  it('exposes an expanded accordion button with a "Collapse" label when open', () => {
    renderHeader({ isOpen: true });

    const button = screen.getByTestId('entry-rules-header-stage-1-accordion-button');
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(button).toHaveAttribute('aria-label', 'Collapse Entry rules');
  });

  it('exposes a collapsed accordion button with an "Expand" label when closed', () => {
    renderHeader({ isOpen: false });

    const button = screen.getByTestId('entry-rules-header-stage-1-accordion-button');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveAttribute('aria-label', 'Expand Entry rules');
  });

  it('invokes onToggle when the header is clicked', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    renderHeader({ onToggle });

    await user.click(screen.getByTestId('entry-rules-header-stage-1-accordion-button'));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('invokes onToggle when Enter is pressed on the focused header', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    renderHeader({ onToggle });

    screen.getByTestId('entry-rules-header-stage-1-accordion-button').focus();
    await user.keyboard('{Enter}');

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('invokes onToggle when Space is pressed on the focused header', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    renderHeader({ onToggle });

    screen.getByTestId('entry-rules-header-stage-1-accordion-button').focus();
    await user.keyboard('{ }');

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('does not toggle on unrelated keys', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    renderHeader({ onToggle });

    screen.getByTestId('entry-rules-header-stage-1-accordion-button').focus();
    await user.keyboard('{ArrowDown}');

    expect(onToggle).not.toHaveBeenCalled();
  });
});
