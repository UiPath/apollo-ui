import { act, render, screen } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JsonTreeTooltip, JsonTreeTooltipProvider } from './JsonTreeTooltip';
import { JsonTreeViewProvider } from './strings';

// The Radix primitives are replaced with inert stand-ins that surface the props
// the wrapper passes, so each test reads the wrapper's decisions directly.
let requestOpen: ((open: boolean) => void) | undefined;

vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({
    children,
    open,
    onOpenChange,
    delayDuration,
  }: PropsWithChildren<{
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    delayDuration?: number;
  }>) => {
    requestOpen = onOpenChange;
    return (
      <div data-testid="tooltip" data-open={String(!!open)} data-delay={delayDuration}>
        {children}
      </div>
    );
  },
  TooltipTrigger: ({ children }: PropsWithChildren) => <>{children}</>,
  TooltipPortal: ({ children }: PropsWithChildren) => <>{children}</>,
  TooltipContent: ({ children, className }: PropsWithChildren<{ className?: string }>) => (
    <div data-testid="tooltip-content" className={className}>
      {children}
    </div>
  ),
  TooltipProvider: ({ children }: PropsWithChildren) => (
    <div data-testid="tooltip-provider">{children}</div>
  ),
}));

const trigger = <button type="button">Trigger</button>;

function hoverOpen() {
  act(() => requestOpen?.(true));
}

describe('JsonTreeTooltip', () => {
  beforeEach(() => {
    requestOpen = undefined;
  });

  it('opens when Radix asks it to', () => {
    render(<JsonTreeTooltip content="Number">{trigger}</JsonTreeTooltip>);
    expect(screen.getByTestId('tooltip')).toHaveAttribute('data-open', 'false');
    hoverOpen();
    expect(screen.getByTestId('tooltip')).toHaveAttribute('data-open', 'true');
  });

  it.each([
    ['null', null],
    ['false', false],
    ['an empty string', ''],
    ['whitespace', '  '],
  ])('stays closed when content is %s', (_, content) => {
    render(<JsonTreeTooltip content={content}>{trigger}</JsonTreeTooltip>);
    hoverOpen();
    expect(screen.getByTestId('tooltip')).toHaveAttribute('data-open', 'false');
    expect(screen.getByRole('button', { name: 'Trigger' })).toBeInTheDocument();
  });

  it('stays closed while hidden', () => {
    render(
      <JsonTreeTooltip content="More actions" hide>
        {trigger}
      </JsonTreeTooltip>
    );
    hoverOpen();
    expect(screen.getByTestId('tooltip')).toHaveAttribute('data-open', 'false');
  });

  it('uses the short delay by default and the long one when asked', () => {
    const { rerender } = render(<JsonTreeTooltip content="Copy">{trigger}</JsonTreeTooltip>);
    expect(screen.getByTestId('tooltip')).toHaveAttribute('data-delay', '200');
    rerender(
      <JsonTreeTooltip content="Copy" delay>
        {trigger}
      </JsonTreeTooltip>
    );
    expect(screen.getByTestId('tooltip')).toHaveAttribute('data-delay', '700');
  });

  it('mounts its own provider when rendered on its own', () => {
    render(<JsonTreeTooltip content="Copy">{trigger}</JsonTreeTooltip>);
    expect(screen.getAllByTestId('tooltip-provider')).toHaveLength(1);
  });

  it('shares the tree provider instead of mounting one per tooltip', () => {
    render(
      <JsonTreeTooltipProvider>
        <JsonTreeTooltip content="One">{trigger}</JsonTreeTooltip>
        <JsonTreeTooltip content="Two">{trigger}</JsonTreeTooltip>
      </JsonTreeTooltipProvider>
    );
    expect(screen.getAllByTestId('tooltip-provider')).toHaveLength(1);
    expect(screen.getAllByTestId('tooltip')).toHaveLength(2);
  });

  it('applies tooltip classes from the provider, including outer ones', () => {
    render(
      <JsonTreeViewProvider tooltipContentClassName="z-1200!">
        <JsonTreeViewProvider tooltipContentClassName="max-w-64">
          <JsonTreeTooltip content="Copy">{trigger}</JsonTreeTooltip>
        </JsonTreeViewProvider>
      </JsonTreeViewProvider>
    );
    const content = screen.getByTestId('tooltip-content');
    expect(content).toHaveClass('z-1200!');
    expect(content).toHaveClass('max-w-64');
  });
});
