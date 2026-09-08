import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import { GuardrailStatusChip } from './guardrail-status-chip';

describe('GuardrailStatusChip', () => {
  it('renders its label as static text, not as a control', () => {
    render(<GuardrailStatusChip>Disabled</GuardrailStatusChip>);

    expect(screen.getByText('Disabled')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it.each([
    ['neutral', 'bg-secondary'],
    ['accent', 'bg-info-background'],
    ['warning', 'bg-warning-background'],
    ['error', 'bg-error-background'],
  ] as const)('paints the %s tone', (tone, expectedClass) => {
    render(<GuardrailStatusChip tone={tone}>Status</GuardrailStatusChip>);
    expect(screen.getByText('Status')).toHaveClass(expectedClass);
  });

  it('defaults to the neutral tone', () => {
    render(<GuardrailStatusChip>Status</GuardrailStatusChip>);
    expect(screen.getByText('Status')).toHaveClass('bg-secondary');
  });

  it('keeps caller classes alongside the chip geometry', () => {
    render(<GuardrailStatusChip className="ml-4">Status</GuardrailStatusChip>);

    const chip = screen.getByText('Status');
    expect(chip).toHaveClass('ml-4');
    expect(chip).toHaveClass('h-6');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <>
        <GuardrailStatusChip>Preview</GuardrailStatusChip>
        <GuardrailStatusChip tone="warning">Not entitled</GuardrailStatusChip>
        <GuardrailStatusChip tone="error">Unavailable</GuardrailStatusChip>
      </>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
