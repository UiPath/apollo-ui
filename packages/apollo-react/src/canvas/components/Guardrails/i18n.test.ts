import { describe, expect, it } from 'vitest';
import { findCatalogDrift, findCatalogOrphans } from './__fixtures__/catalog-coverage';
import {
  CENTRALIZED_GUARDRAILS_EN_LABELS,
  CENTRALIZED_GUARDRAILS_EN_MESSAGES,
  GUARDRAIL_BUILDER_EN_LABELS,
  GUARDRAIL_FORM_EN_LABELS,
  resolveCentralizedGuardrailsLabels,
  resolveGuardrailBuilderLabels,
  resolveGuardrailFormLabels,
} from './i18n';

/**
 * Ids resolved from the builder's message block rather than twinned here. They name the same
 * thing with the same English, so a second id would reach translators twice and drift.
 */
const REUSED_IDS = [
  'guardrails.builder.type-label',
  'guardrails.builder.description-label',
  'guardrails.builder.scopes-label',
  'guardrails.builder.scope-agent-label',
  'guardrails.builder.scope-llm-label',
  'guardrails.builder.scope-tool-label',
  'guardrails.builder.action-block-label',
  'guardrails.builder.action-escalate-label',
  'guardrails.builder.action-filter-label',
  'guardrails.builder.action-log-label',
];

describe('resolveCentralizedGuardrailsLabels', () => {
  it('returns the English defaults when there is nothing to merge', () => {
    expect(resolveCentralizedGuardrailsLabels()).toEqual(CENTRALIZED_GUARDRAILS_EN_LABELS);
  });

  it('layers the catalog over the defaults and the overrides over both', () => {
    const labels = resolveCentralizedGuardrailsLabels(
      { title: 'Zentralisierte Leitplanken', provider: 'Anbieter' },
      { provider: 'Provider (host)' }
    );

    expect(labels.title).toBe('Zentralisierte Leitplanken');
    expect(labels.provider).toBe('Provider (host)');
    expect(labels.scopes).toBe(CENTRALIZED_GUARDRAILS_EN_LABELS.scopes);
  });

  it('never lets an absent string blank a default', () => {
    const labels = resolveCentralizedGuardrailsLabels(
      { title: undefined },
      { originUiPath: undefined }
    );

    expect(labels.title).toBe('Centralized guardrails');
    expect(labels.originUiPath).toBe('UiPath managed');
  });

  it('keeps the English templates in the `{{token}}` convention the component formats', () => {
    expect(CENTRALIZED_GUARDRAILS_EN_LABELS.policyCaption).toContain('{{policyName}}');
    expect(CENTRALIZED_GUARDRAILS_EN_LABELS.viewDetails).toContain('{{name}}');
    // The catalogs store the ICU source instead, which is what translators receive.
    expect(CENTRALIZED_GUARDRAILS_EN_MESSAGES['guardrails.centralized.policy-caption']).toContain(
      '{policyName}'
    );
  });
});

describe('the other label sets still layer the same way', () => {
  // All three resolvers share one `mergeLabels`, so one case per set is enough to catch a
  // wiring mistake in the shared helper.
  it('merges builder labels', () => {
    const labels = resolveGuardrailBuilderLabels({ save: 'Speichern' }, { cancel: undefined });

    expect(labels.save).toBe('Speichern');
    expect(labels.cancel).toBe(GUARDRAIL_BUILDER_EN_LABELS.cancel);
  });

  it('merges validator form labels', () => {
    const labels = resolveGuardrailFormLabels({ addItem: 'Hinzufügen' }, { addItem: 'Add row' });

    expect(labels.addItem).toBe('Add row');
    expect(labels.enumPlaceholder).toBe(GUARDRAIL_FORM_EN_LABELS.enumPlaceholder);
  });
});

describe('the shared canvas catalog', () => {
  // `src/canvas` uses no lingui macros, so nothing extracts these ids: the same two scans
  // every other component's i18n test runs. Translations are not this PR's to write.
  const own = Object.fromEntries(
    Object.entries(CENTRALIZED_GUARDRAILS_EN_MESSAGES).filter(([id]) => !REUSED_IDS.includes(id))
  );

  it('carries every centralized message with the same English', () => {
    expect(findCatalogDrift(CENTRALIZED_GUARDRAILS_EN_MESSAGES)).toEqual({
      missing: [],
      drifted: [],
    });
  });

  it('carries no centralized message the source no longer declares', () => {
    // All fourteen catalogs: once the sync fills them in, a renamed id would otherwise leave
    // thirteen dead translations nothing cleans up.
    expect(findCatalogOrphans(own, 'guardrails.centralized.')).toEqual([]);
  });

  it('resolves the reused ids from the block that owns them, with identical English', () => {
    const reused: Record<string, string> = {};
    for (const id of REUSED_IDS) {
      const message = CENTRALIZED_GUARDRAILS_EN_MESSAGES[id];
      expect(message).toBeDefined();
      reused[id] = message as string;
    }

    expect(findCatalogDrift(reused)).toEqual({ missing: [], drifted: [] });
  });
});
