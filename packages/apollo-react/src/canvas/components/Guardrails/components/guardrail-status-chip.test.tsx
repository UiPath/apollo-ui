import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
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
