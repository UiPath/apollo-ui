import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { GuardrailStatusChip } from './guardrail-status-chip';

// The label lives in an inner span so it can truncate, so `getByText` returns that span rather
// than the chip. Everything asserted here is on the chip itself.
const chip = () => document.querySelector('[data-slot="guardrail-status-chip"]');

describe('GuardrailStatusChip', () => {
  it('renders a label, not a control', () => {
    render(<GuardrailStatusChip>Governance managed</GuardrailStatusChip>);

    expect(screen.getByText('Governance managed')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('carries the chip family geometry', () => {
    render(<GuardrailStatusChip>Disabled</GuardrailStatusChip>);

    expect(chip()).toHaveClass('rounded-full');
  });

  it('renders a span carrying the badge classes, not a div', () => {
    // wind's `Badge` renders a `<div>`, and the palette entry puts these chips inside its
    // `<button>`, where flow content is invalid. Composing from the exported `badgeVariants`
    // keeps the badge look in an element that may live there.
    const ref = createRef<HTMLSpanElement>();
    render(<GuardrailStatusChip ref={ref}>Unauthorized</GuardrailStatusChip>);

    expect(chip()?.tagName).toBe('SPAN');
    expect(chip()).toHaveClass('inline-flex', 'border-transparent');
    expect(ref.current).toBe(chip());
  });

  it.each([
    ['neutral', 'bg-secondary'],
    ['info', 'bg-info-background'],
    ['success', 'bg-success-background'],
    ['warning', 'bg-warning-background'],
    ['error', 'bg-error-background'],
  ] as const)('maps the %s tone onto the badge variant', (tone, expected) => {
    render(<GuardrailStatusChip tone={tone}>Status</GuardrailStatusChip>);

    expect(chip()).toHaveClass(expected);
  });

  it('truncates a long label and keeps the full text reachable on hover', () => {
    // A governance label or a connector name is host text of any length, and the pill is a
    // fixed 20px: without this it wrapped to two lines and spilled out of its own background.
    render(<GuardrailStatusChip>Governance managed by the platform team</GuardrailStatusChip>);

    expect(screen.getByText('Governance managed by the platform team')).toHaveClass('truncate');
    expect(chip()).toHaveAttribute('title', 'Governance managed by the platform team');
  });

  it('lets a caller title the chip itself, and adds none for non-text content', () => {
    const { rerender } = render(
      <GuardrailStatusChip title="Why this cannot run">Disabled</GuardrailStatusChip>
    );
    expect(chip()).toHaveAttribute('title', 'Why this cannot run');

    rerender(
      <GuardrailStatusChip>
        <strong>Disabled</strong>
      </GuardrailStatusChip>
    );
    expect(chip()).not.toHaveAttribute('title');
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
