import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { GuardrailStatusChip } from './guardrail-status-chip';

describe('GuardrailStatusChip', () => {
  it('renders a label, not a control', () => {
    render(<GuardrailStatusChip>Governance managed</GuardrailStatusChip>);

    expect(screen.getByText('Governance managed')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('carries the chip family geometry', () => {
    render(<GuardrailStatusChip>Disabled</GuardrailStatusChip>);

    expect(screen.getByText('Disabled')).toHaveClass('rounded-full');
  });

  it('renders a span carrying the badge classes, not a div', () => {
    // wind's `Badge` renders a `<div>`, and the palette entry puts these chips inside its
    // `<button>`, where flow content is invalid. Composing from the exported `badgeVariants`
    // keeps the badge look in an element that may live there.
    const ref = createRef<HTMLSpanElement>();
    render(<GuardrailStatusChip ref={ref}>Unauthorized</GuardrailStatusChip>);

    const chip = screen.getByText('Unauthorized');
    expect(chip.tagName).toBe('SPAN');
    expect(chip).toHaveClass('inline-flex', 'border-transparent');
    expect(ref.current).toBe(chip);
  });

  it.each([
    ['neutral', 'bg-secondary'],
    ['warning', 'bg-warning-background'],
    ['error', 'bg-error-background'],
  ] as const)('maps the %s tone onto the badge variant', (tone, expected) => {
    render(<GuardrailStatusChip tone={tone}>Status</GuardrailStatusChip>);

    expect(screen.getByText('Status')).toHaveClass(expected);
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <>
        <GuardrailStatusChip tone="warning">Feature disabled</GuardrailStatusChip>
        <GuardrailStatusChip tone="error">Unavailable</GuardrailStatusChip>
      </>
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
