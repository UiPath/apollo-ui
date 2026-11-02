import type { PropsWithChildren } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '../../utils/testing';
import { NodeVariablesPanel } from './NodeVariablesPanel';

// The shared test setup renders no tooltip content; render it inline, after its trigger.
vi.mock('@uipath/apollo-wind/components/ui/tooltip', () => ({
  Tooltip: ({ children }: PropsWithChildren) => <div data-testid="tooltip-root">{children}</div>,
  TooltipContent: ({ children }: PropsWithChildren) => <div role="tooltip">{children}</div>,
  TooltipPortal: ({ children }: PropsWithChildren) => <>{children}</>,
  TooltipProvider: ({ children }: PropsWithChildren) => <>{children}</>,
  TooltipTrigger: ({ children }: PropsWithChildren) => <>{children}</>,
}));

describe('NodeVariablesPanel tooltips', () => {
  it("gives a disabled header + its reason as the button's tooltip", () => {
    render(
      <NodeVariablesPanel
        assets={{}}
        onAdd={vi.fn()}
        addState={{
          assets: { disabled: true, tooltip: 'Add the process to a solution to select assets' },
        }}
      />
    );

    const add = screen.getByRole('button', { name: 'Add asset' });
    const tooltip = screen.getByText('Add the process to a solution to select assets');
    expect(tooltip.closest('[role="tooltip"]')).not.toBeNull();
    expect(add.closest('[data-testid="tooltip-root"]')).toBe(
      tooltip.closest('[data-testid="tooltip-root"]')
    );
  });
});
