import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import { GuardrailStatusBanner } from './guardrail-status-banner';

describe('GuardrailStatusBanner', () => {
  it('renders an error banner with role="alert"', () => {
    render(<GuardrailStatusBanner tone="error" message="This configuration has been disabled." />);

    const banner = screen.getByRole('alert');
    expect(banner).toHaveTextContent('This configuration has been disabled.');
  });

  it('renders a warning banner without the alert role', () => {
    render(
      <GuardrailStatusBanner tone="warning" message="You are not entitled to use guardrails." />
    );

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText('You are not entitled to use guardrails.')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<GuardrailStatusBanner tone="error" message="Disabled." />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
