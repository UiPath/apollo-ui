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

const withDetectionScope = (validator: string): CentralizedGuardrailDefinition => ({
  validator,
  parameters: [{ id: 'detectionScope', type: 'enum' }],
});

const detectionScope = (value: string): Partial<CentralizedGuardrail> => ({
  parameters: [{ id: 'detectionScope', parameterType: 'enum', value }],
});

const summaries = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('[data-slot="centralized-guardrail-summary"]'));

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
    const provider = screen.getByText('Provider: Acme Security');
    // Italic with a title for the truncated text, as both products' legacy rows.
    expect(provider).toHaveClass('italic');
    expect(provider).toHaveAttribute('title', 'Provider: Acme Security');
    expect(screen.getByText('Acme runs its own detector.')).toHaveAttribute(
      'title',
      'Acme runs its own detector.'
    );
  });

  it('localizes the scope and the execution stage without a formatScope prop', () => {
    const { container } = render(
      <CentralizedGuardrailsSection guardrails={[guardrail()]} policyName="Acme policy" />
    );

    const [summary] = summaries(container);
    expect(summary).toHaveTextContent('Scope: Agent, LLM calls | Execution stage: Pre-execution');
    // The separator is decoration; the parts are named by their own labels.
    expect(summary?.querySelector('[aria-hidden="true"]')).toHaveTextContent('|');
  });

  it('lets a host replace the scope names', () => {
    const { container } = render(
      <CentralizedGuardrailsSection
        guardrails={[guardrail()]}
        policyName="Acme policy"
        formatScope={(scope) => scope.toUpperCase()}
      />
    );

    expect(summaries(container)[0]).toHaveTextContent(
      'Scope: AGENT, LLM | Execution stage: Pre-execution'
    );
  });

  it('says what a built-in reads while its definition offers the detection scope', () => {
    const { container } = render(
      <CentralizedGuardrailsSection
        guardrails={[
          guardrail({ scopes: ['Llm'], ...detectionScope('Files') }),
          guardrail({ validator: 'llm_as_judge', scopes: ['Llm'], ...detectionScope('Both') }),
          guardrail({ validator: 'harmful_content', scopes: ['Llm'] }),
        ]}
        definitions={[
          withDetectionScope('pii_detection'),
          withDetectionScope('llm_as_judge'),
          withDetectionScope('harmful_content'),
        ]}
        policyName="Acme policy"
      />
    );

    expect(summaries(container).map((summary) => summary.textContent)).toEqual([
      'Scope: LLM calls | Detection: Files | Execution stage: Pre-execution',
      'Scope: LLM calls | Detection: Text, Files | Execution stage: Pre-execution',
      // Saved without a scope: the gateway reads it as text.
      'Scope: LLM calls | Detection: Text | Execution stage: Pre-execution',
    ]);
  });

  it('leaves the detection scope out where the definitions do not offer it', () => {
    // Stripped by the host where file support is off, still loading, a BYO row, and a
    // validator with no such parameter.
    const files = detectionScope('Files');
    const { container, rerender } = render(
      <CentralizedGuardrailsSection
        guardrails={[guardrail(files)]}
        definitions={[{ validator: 'pii_detection', parameters: [] }]}
        policyName="Acme policy"
      />
    );
    expect(summaries(container)[0]).not.toHaveTextContent('Detection');

    rerender(
      <CentralizedGuardrailsSection guardrails={[guardrail(files)]} policyName="Acme policy" />
    );
    expect(summaries(container)[0]).not.toHaveTextContent('Detection');

    rerender(
      <CentralizedGuardrailsSection
        guardrails={[byoGuardrail(files), guardrail({ validator: 'sentiment', ...files })]}
        definitions={[
          { ...BYO_DEFINITION, parameters: [{ id: 'detectionScope', type: 'enum' }] },
          withDetectionScope('pii_detection'),
        ]}
        policyName="Acme policy"
      />
    );
    for (const summary of summaries(container)) expect(summary).not.toHaveTextContent('Detection');
  });

  it('says nothing about a missing configuration while the catalog is still loading', () => {
    render(<CentralizedGuardrailsSection guardrails={[byoGuardrail()]} policyName="Acme policy" />);

    expect(screen.queryByText('Unavailable')).not.toBeInTheDocument();
  });

  it('chips and explains a configuration the catalog no longer has', () => {
    render(
      <CentralizedGuardrailsSection
        guardrails={[byoGuardrail()]}
        definitions={[]}
        policyName="Acme policy"
      />
    );

    expect(screen.getByText('Unavailable')).toBeInTheDocument();
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

    expect(screen.getByText('Disabled')).toBeInTheDocument();
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
      <ApI18nProvider component="canvas" locale="ja">
        <CentralizedGuardrailsSection guardrails={[guardrail()]} policyName="Acme policy" />
      </ApI18nProvider>
    );

    // The row's summary line: the reused builder scope names and the section's translated stage.
    // Newer ids render English until `chore(l10n): sync from Localization` reaches them.
    expect(screen.getByText(/エージェント, LLM の呼び出し/)).toBeInTheDocument();
    expect(screen.getByText(/実行ステージ: 実行前/)).toBeInTheDocument();
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
