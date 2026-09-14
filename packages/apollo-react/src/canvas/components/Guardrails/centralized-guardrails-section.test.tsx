import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { ApI18nProvider } from '../../../i18n';
import { CentralizedGuardrailsSection } from './centralized-guardrails-section';
import type { CentralizedGuardrail, CentralizedGuardrailDefinition } from './centralized-types';

const guardrail = (overrides: Partial<CentralizedGuardrail> = {}): CentralizedGuardrail => ({
  validator: 'pii_detection',
  executionStage: 'Pre',
  appliesToAutonomousAgents: true,
  appliesToConversationalAgents: false,
  scopes: ['Agent', 'Llm'],
  action: 'block',
  ...overrides,
});

const byoGuardrail = (overrides: Partial<CentralizedGuardrail> = {}): CentralizedGuardrail =>
  guardrail({ isByo: true, name: 'Acme PII', validator: 'pii_detection', ...overrides });

const BYO_DEFINITION: CentralizedGuardrailDefinition = {
  validator: 'pii_detection',
  byoValidatorName: 'Acme PII',
  byoConnectorName: 'Acme Security',
  description: 'Acme runs its own detector.',
};

describe('CentralizedGuardrailsSection', () => {
  it('renders nothing at all when the policy enforces none, as both products do', () => {
    const { container } = render(
      <CentralizedGuardrailsSection guardrails={[]} policyName="Default policy" />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders an explicit empty state, including one the host deliberately set to null', () => {
    const { container, rerender } = render(
      <CentralizedGuardrailsSection
        guardrails={[]}
        policyName="Default policy"
        emptyState={<p>Nothing enforced</p>}
      />
    );
    expect(screen.getByText('Nothing enforced')).toBeInTheDocument();

    rerender(
      <CentralizedGuardrailsSection guardrails={[]} policyName="Default policy" emptyState={null} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('names the policy in the caption, emphasized', () => {
    render(<CentralizedGuardrailsSection guardrails={[guardrail()]} policyName="Acme policy" />);

    const emphasis = screen.getByText('Acme policy');
    expect(emphasis.tagName).toBe('EM');
    expect(emphasis.parentElement).toHaveTextContent(
      'Enforced by AI Trust Layer policy: Acme policy'
    );
  });

  it('names a built-in validator from the canonical copy table', () => {
    render(<CentralizedGuardrailsSection guardrails={[guardrail()]} policyName="Acme policy" />);

    expect(screen.getByText('PII detection')).toBeInTheDocument();
    expect(screen.getByText('UiPath managed')).toBeInTheDocument();
  });

  it('names a BYO guardrail from the policy and its connector from the definition', () => {
    render(
      <CentralizedGuardrailsSection
        guardrails={[byoGuardrail()]}
        definitions={[BYO_DEFINITION]}
        policyName="Acme policy"
      />
    );

    expect(screen.getByText('Acme PII')).toBeInTheDocument();
    expect(screen.getByText('BYO')).toBeInTheDocument();
    expect(screen.getByText('Provider: Acme Security')).toBeInTheDocument();
    expect(screen.getByText('Acme runs its own detector.')).toBeInTheDocument();
  });

  it('localizes the scopes and the execution stage without a formatScope prop', () => {
    render(<CentralizedGuardrailsSection guardrails={[guardrail()]} policyName="Acme policy" />);

    expect(
      screen.getByText('Scopes: Agent, LLM calls · Execution stage: Pre-execution')
    ).toBeInTheDocument();
  });

  it('lets a host replace the scope names', () => {
    render(
      <CentralizedGuardrailsSection
        guardrails={[guardrail()]}
        policyName="Acme policy"
        formatScope={(scope) => scope.toUpperCase()}
      />
    );

    expect(
      screen.getByText('Scopes: AGENT, LLM · Execution stage: Pre-execution')
    ).toBeInTheDocument();
  });

  it('says nothing about a missing configuration while the catalog is still loading', () => {
    render(<CentralizedGuardrailsSection guardrails={[byoGuardrail()]} policyName="Acme policy" />);

    expect(screen.queryByText('Configuration missing')).not.toBeInTheDocument();
  });

  it('chips and explains a configuration the catalog no longer has', () => {
    render(
      <CentralizedGuardrailsSection
        guardrails={[byoGuardrail()]}
        definitions={[]}
        policyName="Acme policy"
      />
    );

    expect(screen.getByText('Configuration missing')).toBeInTheDocument();
    expect(
      screen.getByText(/could not be found .* Contact your administrator/)
    ).toBeInTheDocument();
  });

  it('chips and explains a disabled configuration', () => {
    render(
      <CentralizedGuardrailsSection
        guardrails={[byoGuardrail()]}
        definitions={[{ ...BYO_DEFINITION, status: 'Disabled' }]}
        policyName="Acme policy"
      />
    );

    expect(screen.getByText('Configuration disabled')).toBeInTheDocument();
    expect(
      screen.getByText(/configuration has been disabled\. Contact your administrator/)
    ).toBeInTheDocument();
  });

  it('reports the selected guardrail, and opening the details stays the host’s job', async () => {
    const onSelect = vi.fn();
    const one = guardrail();
    render(
      <CentralizedGuardrailsSection
        guardrails={[one]}
        policyName="Acme policy"
        onSelect={onSelect}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /View details for PII detection/ }));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(one);
  });

  it('keeps the whole row in the accessible name, not just the "view details" phrase', () => {
    render(
      <CentralizedGuardrailsSection
        guardrails={[byoGuardrail()]}
        definitions={[]}
        policyName="Acme policy"
        onSelect={vi.fn()}
      />
    );

    // The remediation message is the reason this matters: an `aria-label` would hide it.
    expect(
      screen.getByRole('button', { name: /Contact your administrator to fix the AI Trust Layer/ })
    ).toBeInTheDocument();
  });

  it('is not a control at all when there is nothing to open', () => {
    render(<CentralizedGuardrailsSection guardrails={[guardrail()]} policyName="Acme policy" />);

    expect(screen.queryByRole('button', { name: /View details/ })).not.toBeInTheDocument();
    expect(screen.getByText('PII detection')).toBeInTheDocument();
  });

  it('renders the documentation link inside the info popover, only when the host supplies one', async () => {
    // The popover opens on focus as well as hover, which is what makes the link reachable
    // from the keyboard at all.
    const { rerender } = render(
      <CentralizedGuardrailsSection guardrails={[guardrail()]} policyName="Acme policy" />
    );
    await userEvent.tab();
    expect(
      screen.queryByRole('link', { name: 'View centralized guardrails documentation' })
    ).not.toBeInTheDocument();

    rerender(
      <CentralizedGuardrailsSection
        guardrails={[guardrail()]}
        policyName="Acme policy"
        docsHref="https://docs.example.com/guardrails"
      />
    );
    expect(
      await screen.findByRole('link', { name: 'View centralized guardrails documentation' })
    ).toHaveAttribute('href', 'https://docs.example.com/guardrails');
  });

  it('drops its own chrome for a host that brings its own section header', () => {
    render(
      <CentralizedGuardrailsSection
        guardrails={[guardrail()]}
        policyName="Acme policy"
        hideHeader
        unstyled
      />
    );

    expect(screen.queryByText('Centralized guardrails')).not.toBeInTheDocument();
    expect(screen.getByText('PII detection')).toBeInTheDocument();
  });

  it('keeps one row per guardrail when a policy enforces a validator at two stages', () => {
    render(
      <CentralizedGuardrailsSection
        guardrails={[guardrail({ executionStage: 'Pre' }), guardrail({ executionStage: 'Post' })]}
        policyName="Acme policy"
        onSelect={vi.fn()}
      />
    );

    expect(screen.getAllByRole('button', { name: /View details for PII detection/ })).toHaveLength(
      2
    );
  });

  it('translates through the ambient catalog', () => {
    render(
      <ApI18nProvider component="canvas" locale="de">
        <CentralizedGuardrailsSection guardrails={[guardrail()]} policyName="Acme policy" />
      </ApI18nProvider>
    );

    expect(screen.getByText('Zentralisierte Leitplanken')).toBeInTheDocument();
    expect(screen.getByText(/Vor der Ausführung/)).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <CentralizedGuardrailsSection
        guardrails={[guardrail(), byoGuardrail()]}
        definitions={[{ ...BYO_DEFINITION, status: 'Disabled' }]}
        policyName="Acme policy"
        docsHref="https://docs.example.com/guardrails"
        onSelect={vi.fn()}
      />
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
