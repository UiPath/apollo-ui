import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import { TooltipProvider } from '@/components/ui/tooltip';
import { InfoTooltip } from './info-tooltip';

describe('InfoTooltip', () => {
  it('renders a keyboard-focusable button trigger with the aria-label', () => {
    render(
      <TooltipProvider>
        <InfoTooltip content="Helpful explanation." aria-label="More information" />
      </TooltipProvider>
    );

    const trigger = screen.getByRole('button', { name: 'More information' });
    expect(trigger.tagName).toBe('BUTTON');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <TooltipProvider>
        <InfoTooltip content="Helpful explanation." aria-label="More information" />
      </TooltipProvider>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
