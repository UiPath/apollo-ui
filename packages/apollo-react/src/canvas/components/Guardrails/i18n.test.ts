import { describe, expect, it } from 'vitest';
import {
  findCatalogDrift,
  findCatalogGaps,
  findCatalogOrphans,
} from './__fixtures__/catalog-coverage';
import {
  GUARDRAIL_BUILDER_EN_LABELS,
  GUARDRAIL_CENTRALIZED_EN_LABELS,
  GUARDRAIL_CENTRALIZED_EN_MESSAGES,
  GUARDRAIL_FORM_EN_LABELS,
  resolveCentralizedGuardrailsLabels,
  resolveGuardrailBuilderLabels,
  resolveGuardrailFormLabels,
} from './i18n';

/**
 * Ids the centralized section resolves from another component's message block rather than
 * declaring its own twin. They name the same thing with the same English, so a second id
 * would reach translators twice and let the two drift apart.
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

/**
 * Ids no product ships translated. Agents has the same English for "Configuration" but has
 * not localized a single centralized-guardrail string yet, so adopting its id would buy no
 * translations; the two status chips are this component's own addition. All three fall back
 * to English per id at runtime.
 */
const ENGLISH_ONLY_IDS = [
  'guardrails.centralized.configuration',
  'guardrails.centralized.status-missing-config',
  'guardrails.centralized.status-disabled-config',
];

describe('resolveCentralizedGuardrailsLabels', () => {
  it('returns the English defaults when there is nothing to merge', () => {
    expect(resolveCentralizedGuardrailsLabels()).toEqual(GUARDRAIL_CENTRALIZED_EN_LABELS);
  });

  it('layers the catalog over the defaults and the overrides over both', () => {
    const labels = resolveCentralizedGuardrailsLabels(
      { title: 'Zentralisierte Leitplanken', provider: 'Anbieter' },
      { provider: 'Provider (host)' }
    );

    expect(labels.title).toBe('Zentralisierte Leitplanken');
    expect(labels.provider).toBe('Provider (host)');
    expect(labels.scopes).toBe(GUARDRAIL_CENTRALIZED_EN_LABELS.scopes);
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
    expect(GUARDRAIL_CENTRALIZED_EN_LABELS.policyCaption).toContain('{{policyName}}');
    expect(GUARDRAIL_CENTRALIZED_EN_LABELS.viewDetails).toContain('{{name}}');
    // The catalogs store the ICU source instead, which is what translators receive.
    expect(GUARDRAIL_CENTRALIZED_EN_MESSAGES['guardrails.centralized.policy-caption']).toContain(
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
  // The scans live in `__fixtures__/catalog-coverage`, shared with every other component's
  // i18n test: the catalog is hand-authored and harvested from the two products, so each id
  // prefix needs the same three checks and there is no pipeline to run them.
  const own = Object.fromEntries(
    Object.entries(GUARDRAIL_CENTRALIZED_EN_MESSAGES).filter(([id]) => !REUSED_IDS.includes(id))
  );

  it('carries every centralized message with the same English', () => {
    expect(findCatalogDrift(GUARDRAIL_CENTRALIZED_EN_MESSAGES)).toEqual({
      missing: [],
      drifted: [],
    });
  });

  it('carries no centralized message the source no longer declares', () => {
    expect(findCatalogOrphans(own, 'guardrails.centralized.')).toEqual([]);
  });

  it('translates every harvested centralized message in all twelve locales', () => {
    const harvested = Object.fromEntries(
      Object.entries(own).filter(([id]) => !ENGLISH_ONLY_IDS.includes(id))
    );

    expect(findCatalogGaps(harvested)).toEqual([]);
  });

  it('leaves exactly the declared ids untranslated, so a new gap has to be argued for', () => {
    const englishOnly = Object.fromEntries(
      Object.entries(own).filter(([id]) => ENGLISH_ONLY_IDS.includes(id))
    );

    expect(Object.keys(englishOnly).sort()).toEqual([...ENGLISH_ONLY_IDS].sort());
    // Twelve locales each, and every one of them genuinely absent rather than half-done.
    expect(findCatalogGaps(englishOnly)).toHaveLength(ENGLISH_ONLY_IDS.length * 12);
  });

  it('resolves the reused ids from the block that owns them, with identical English', () => {
    const reused: Record<string, string> = {};
    for (const id of REUSED_IDS) {
      const message = GUARDRAIL_CENTRALIZED_EN_MESSAGES[id];
      expect(message).toBeDefined();
      reused[id] = message as string;
    }

    expect(findCatalogDrift(reused)).toEqual({ missing: [], drifted: [] });
  });
});
