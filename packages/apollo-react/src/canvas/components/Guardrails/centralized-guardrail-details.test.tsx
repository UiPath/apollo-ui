import { render, screen, within } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import { ApI18nProvider } from '../../../i18n';
import { CentralizedGuardrailDetails } from './centralized-guardrail-details';
import type { CentralizedGuardrail, CentralizedGuardrailDefinition } from './centralized-types';

const guardrail = (overrides: Partial<CentralizedGuardrail> = {}): CentralizedGuardrail => ({
  validator: 'pii_detection',
  executionStage: 'Both',
  appliesToAutonomousAgents: true,
  appliesToConversationalAgents: true,
  scopes: ['Agent', 'Tool'],
  action: 'escalate',
  ...overrides,
});

const PII_DEFINITION: CentralizedGuardrailDefinition = {
  validator: 'pii_detection',
  parameters: [
    {
      id: 'entities',
      type: 'enum-list',
      label: 'Entities to detect',
      optionLabels: { Email: 'Email address', USSocialSecurityNumber: 'US SSN' },
    },
    {
      id: 'entityThresholds',
      type: 'map-enum',
      label: 'Detection thresholds',
      keySource: 'entities',
    },
  ],
};

const BYO_DEFINITION: CentralizedGuardrailDefinition = {
  validator: 'pii_detection',
  byoValidatorName: 'Acme PII',
  byoConnectorName: 'Acme Security',
  description: 'Acme runs its own detector.',
  parameters: [
    { id: 'mode', type: 'enum', label: 'Detection mode', optionLabels: { fast: 'Fast' } },
    { id: 'strict', type: 'boolean', label: 'Strict matching' },
  ],
};

/** The value rendered under a `<dt>`, as a screen reader would pair them. */
const valueFor = (label: string) =>
  screen.getByText(label).parentElement?.querySelector('dd')?.textContent;

describe('CentralizedGuardrailDetails', () => {
  it('explains that the configuration is not editable here', () => {
    render(<CentralizedGuardrailDetails guardrail={guardrail()} policyName="Acme policy" />);

    expect(
      screen.getByText(/governance policy manages this configuration\. You cannot edit it here\./)
    ).toBeInTheDocument();
  });

  it('states the guardrail, the policy enforcing it, and what it does', () => {
    render(<CentralizedGuardrailDetails guardrail={guardrail()} policyName="Acme policy" />);

    expect(valueFor('Guardrail type')).toContain('PII detection');
    expect(valueFor('AI Trust Layer policy')).toBe('Acme policy');
    expect(valueFor('Execution stage')).toBe('Pre & post-execution');
    expect(valueFor('Scopes')).toBe('Agent, Tools');
    expect(valueFor('Action')).toBe('Escalate');
  });

  it('offers a line of its own when nothing describes the guardrail', () => {
    render(
      <CentralizedGuardrailDetails
        guardrail={guardrail({ validator: 'acme_unknown' })}
        policyName="Acme policy"
      />
    );

    expect(valueFor('Guardrail description')).toBe('No description available.');
  });

  it('shows the connector and its description for a BYO guardrail', () => {
    render(
      <CentralizedGuardrailDetails
        guardrail={guardrail({ isByo: true, name: 'Acme PII' })}
        definitions={[BYO_DEFINITION]}
        policyName="Acme policy"
      />
    );

    expect(valueFor('Guardrail type')).toContain('Acme PII');
    expect(screen.getByText('BYO')).toBeInTheDocument();
    expect(valueFor('Provider')).toBe('Acme Security');
    expect(valueFor('Guardrail description')).toBe('Acme runs its own detector.');
  });

  it('banners a missing configuration and a disabled one', () => {
    const { rerender } = render(
      <CentralizedGuardrailDetails
        guardrail={guardrail({ isByo: true, name: 'Acme PII' })}
        definitions={[]}
        policyName="Acme policy"
      />
    );
    expect(screen.getByText(/could not be found/)).toBeInTheDocument();

    rerender(
      <CentralizedGuardrailDetails
        guardrail={guardrail({ isByo: true, name: 'Acme PII' })}
        definitions={[{ ...BYO_DEFINITION, status: 'Disabled' }]}
        policyName="Acme policy"
      />
    );
    expect(screen.getByText(/has been disabled/)).toBeInTheDocument();
  });

  it('names the entities the way the guardrail editor names them', () => {
    render(
      <CentralizedGuardrailDetails
        guardrail={guardrail({
          entities: ['Email', 'USSocialSecurityNumber'],
          entityThresholds: { Email: 0.8 },
        })}
        definitions={[PII_DEFINITION]}
        policyName="Acme policy"
      />
    );

    const thresholds = screen.getByText('Detection thresholds').parentElement as HTMLElement;
    const rows = within(thresholds).getAllByRole('listitem');
    expect(rows.map((row) => row.textContent)).toEqual(['Email address0.8', 'US SSN—']);
  });

  it('renders a BYO connector configuration in the order the connector declares', () => {
    render(
      <CentralizedGuardrailDetails
        guardrail={guardrail({
          isByo: true,
          name: 'Acme PII',
          parameters: [
            { id: 'strict', parameterType: 'boolean', value: true },
            { id: 'mode', parameterType: 'enum', value: 'fast' },
          ],
        })}
        definitions={[BYO_DEFINITION]}
        policyName="Acme policy"
      />
    );

    const configuration = screen.getByText('Configuration').parentElement as HTMLElement;
    const terms = within(configuration).getAllByRole('term');
    expect(terms.map((term) => term.textContent)).toEqual(['Detection mode', 'Strict matching']);
    expect(valueFor('Detection mode')).toBe('Fast');
    expect(valueFor('Strict matching')).toBe('Enabled');
  });

  it('drops the configuration block for a guardrail the policy left unconfigured', () => {
    render(
      <CentralizedGuardrailDetails
        guardrail={guardrail()}
        definitions={[PII_DEFINITION]}
        policyName="Acme policy"
      />
    );

    expect(screen.queryByText('Configuration')).not.toBeInTheDocument();
  });

  it('lets a host replace the scope and action names', () => {
    render(
      <CentralizedGuardrailDetails
        guardrail={guardrail()}
        policyName="Acme policy"
        formatScope={(scope) => `<${scope}>`}
        formatAction={(action) => action.toUpperCase()}
      />
    );

    expect(valueFor('Scopes')).toBe('<Agent>, <Tool>');
    expect(valueFor('Action')).toBe('ESCALATE');
  });

  it('translates through the ambient catalog', () => {
    render(
      <ApI18nProvider component="canvas" locale="ja">
        <CentralizedGuardrailDetails guardrail={guardrail()} policyName="Acme policy" />
      </ApI18nProvider>
    );

    // The type, description and scope labels reuse the builder's ids, so they are translated
    // already; this view's own ids render English until the l10n sync reaches them.
    expect(screen.getByText('ガードレールの種類')).toBeInTheDocument();
    expect(screen.getByText('スコープ')).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <CentralizedGuardrailDetails
        guardrail={guardrail({
          entities: ['Email'],
          entityThresholds: { Email: 0.8 },
        })}
        definitions={[PII_DEFINITION]}
        policyName="Acme policy"
      />
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
