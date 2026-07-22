import { i18n } from '@lingui/core';
import { beforeAll, describe, expect, it } from 'vitest';

import type { DiscoveryModel } from './types';
import {
  defaultCostTier,
  deriveModelTags,
  filterModels,
  getSubstitutionTarget,
  groupModels,
} from './utils';

// Helper: minimal Discovery model. Tests override fields as needed.
function model(overrides: Partial<DiscoveryModel>): DiscoveryModel {
  return {
    modelId: 'm-1',
    modelName: 'm-1',
    vendor: 'OpenAi',
    modelSubscriptionType: 'UiPathOwned',
    ...overrides,
  };
}

describe('groupModels (Category view ordering)', () => {
  it('places BYO first, then Recommended → Preview → More → Deprecating', () => {
    const models = [
      model({ modelId: 'rec', modelSubscriptionType: 'UiPathOwned' }),
      model({
        modelId: 'preview',
        modelSubscriptionType: 'UiPathOwned',
        isPreview: true,
      }),
      model({
        modelId: 'more',
        modelSubscriptionType: 'UiPathOwned',
      }),
      model({
        modelId: 'depr',
        modelSubscriptionType: 'UiPathOwned',
        deprecationDetails: { usageEndDate: '2026-09-01' },
      }),
      model({ modelId: 'byo', modelSubscriptionType: 'BYOMAdded' }),
    ];
    // Override recommended/preview explicitly so the test doesn't depend on
    // the DTO heuristic (which would put `rec` and `more` in the same bucket).
    const groups = groupModels(models, 'subscription', {
      recommendedModelIds: ['rec'],
      previewModelIds: ['preview'],
    });
    expect(groups.map((g) => g.key)).toEqual([
      'byo',
      'recommended',
      'preview',
      'more',
      'deprecating',
    ]);
  });

  it('drops empty groups without leaving empty headers', () => {
    const groups = groupModels([model({ modelId: 'a' })], 'subscription', {
      recommendedModelIds: ['a'],
    });
    expect(groups).toHaveLength(1);
    expect(groups[0]?.key).toBe('recommended');
  });

  it('Deprecating wins over Recommended and Preview for the section bucket', () => {
    const models = [
      model({
        modelId: 'rec-depr',
        modelSubscriptionType: 'UiPathOwned',
        isRecommended: true,
        deprecationDetails: { usageEndDate: '2026-09-01' },
      }),
      model({
        modelId: 'prev-depr',
        modelSubscriptionType: 'UiPathOwned',
        isPreview: true,
        deprecationDetails: { usageEndDate: '2026-09-01' },
      }),
    ];
    const groups = groupModels(models, 'subscription');
    expect(groups.map((g) => g.key)).toEqual(['deprecating']);
    expect(groups[0]?.models.map((m) => m.modelId)).toEqual(['rec-depr', 'prev-depr']);
  });

  it('Provider view places BYO first (before all vendor groups)', () => {
    const models = [
      model({ modelId: 'openai', vendor: 'OpenAi' }),
      model({ modelId: 'anthropic', vendor: 'AnthropicClaude' }),
      model({
        modelId: 'byo',
        vendor: 'OpenAi',
        modelSubscriptionType: 'BYOMAdded',
      }),
    ];
    const groups = groupModels(models, 'vendor');
    expect(groups[0]?.key).toBe('byo');
  });

  it('Provider view orders each vendor section Recommended → Preview → More → Deprecating', () => {
    // Catalog order is deliberately scrambled; the vendor group must
    // re-rank by lifecycle while keeping catalog order within a band.
    const models = [
      model({
        modelId: 'depr',
        vendor: 'OpenAi',
        deprecationDetails: { usageEndDate: '2026-09-01' },
      }),
      model({ modelId: 'more-a', vendor: 'OpenAi' }),
      model({ modelId: 'preview', vendor: 'OpenAi', isPreview: true }),
      model({ modelId: 'rec', vendor: 'OpenAi' }),
      model({ modelId: 'more-b', vendor: 'OpenAi' }),
      // Second vendor to prove ranking is per-section.
      model({ modelId: 'claude-rec', vendor: 'AnthropicClaude' }),
      model({
        modelId: 'claude-depr',
        vendor: 'AnthropicClaude',
        deprecationDetails: { usageEndDate: '2026-09-01' },
      }),
    ];
    const groups = groupModels(models, 'vendor', {
      recommendedModelIds: ['rec', 'claude-rec'],
      previewModelIds: ['preview'],
    });
    const openai = groups.find((g) => g.key === 'OpenAi');
    expect(openai?.models.map((m) => m.modelId)).toEqual([
      'rec',
      'preview',
      'more-a',
      'more-b',
      'depr',
    ]);
    const anthropic = groups.find((g) => g.key === 'AnthropicClaude');
    expect(anthropic?.models.map((m) => m.modelId)).toEqual(['claude-rec', 'claude-depr']);
  });

  it('Model_hub recommendedModelIds overrides DTO heuristic', () => {
    const models = [
      // DTO heuristic would treat this as Recommended (UiPathOwned + !preview).
      model({ modelId: 'a', modelSubscriptionType: 'UiPathOwned' }),
      model({ modelId: 'b', modelSubscriptionType: 'UiPathOwned' }),
    ];
    // But Model_hub says only `b` is recommended.
    const groups = groupModels(models, 'subscription', {
      recommendedModelIds: ['b'],
    });
    const rec = groups.find((g) => g.key === 'recommended');
    expect(rec?.models.map((m) => m.modelId)).toEqual(['b']);
    // `a` falls through to More models.
    const more = groups.find((g) => g.key === 'more');
    expect(more?.models.map((m) => m.modelId)).toEqual(['a']);
  });
});

describe('deriveModelTags', () => {
  it('emits Recommended chip when Model_hub list includes the model', () => {
    const tags = deriveModelTags(model({ modelId: 'a' }), {
      recommendedModelIds: ['a'],
    });
    expect(tags.find((t) => t.kind === 'recommended')).toBeTruthy();
  });

  it('emits Preview chip for hosted preview models, never for BYO', () => {
    const hostedPreview = deriveModelTags(model({ modelId: 'a', isPreview: true }));
    expect(hostedPreview.find((t) => t.kind === 'preview')).toBeTruthy();

    const byoPreview = deriveModelTags(
      model({
        modelId: 'b',
        isPreview: true,
        modelSubscriptionType: 'BYOMAdded',
      })
    );
    expect(byoPreview.find((t) => t.kind === 'preview')).toBeFalsy();
  });

  it('suppresses the Preview chip for any model served through a BYO connection', () => {
    // BYO-ness can arrive as connection metadata rather than the
    // subscription type: a host-hydrated connection label, or the
    // DTO's byomDetails. Both mean the customer wired the model up
    // themselves, so Preview is noise.
    const labeled = deriveModelTags(
      model({ modelId: 'a', isPreview: true, byoConnectionLabel: 'AcmeAzure' })
    );
    expect(labeled.find((t) => t.kind === 'preview')).toBeFalsy();
    expect(labeled.find((t) => t.kind === 'custom')).toBeTruthy();

    const withByomDetails = deriveModelTags(
      model({
        modelId: 'b',
        isPreview: true,
        modelSubscriptionType: 'BYOMReplacedLikeForLike',
        byomDetails: { integrationServiceConnectionId: 'conn-guid' },
      })
    );
    expect(withByomDetails.find((t) => t.kind === 'preview')).toBeFalsy();
  });

  it('emits Out-of-region chip only when geography differs from homeRegion', () => {
    const usHostedForEuUser = deriveModelTags(model({ routingDetails: { geography: 'US' } }), {
      homeRegion: 'EU',
    });
    expect(usHostedForEuUser.find((t) => t.kind === 'out-of-region')).toBeTruthy();

    const euHostedForEuUser = deriveModelTags(model({ routingDetails: { geography: 'EU' } }), {
      homeRegion: 'EU',
    });
    expect(euHostedForEuUser.find((t) => t.kind === 'out-of-region')).toBeFalsy();

    // GLOBAL models never trigger the chip.
    const globalForEuUser = deriveModelTags(model({ routingDetails: { geography: 'GLOBAL' } }), {
      homeRegion: 'EU',
    });
    expect(globalForEuUser.find((t) => t.kind === 'out-of-region')).toBeFalsy();
  });

  it('emits Substituted chip (not Deprecating) when effectiveModel routes elsewhere', () => {
    const tags = deriveModelTags(
      model({
        modelName: 'gpt-5',
        effectiveModel: 'gpt-6',
        deprecationDetails: { usageEndDate: '2026-05-01' },
      })
    );
    // Substituted and Deprecating are mutually exclusive — substituted wins
    // because retirement already fired.
    expect(tags.find((t) => t.kind === 'substituted')).toBeTruthy();
    expect(tags.find((t) => t.kind === 'deprecating')).toBeFalsy();
  });

  it('appends custom tags after built-in chips', () => {
    const tags = deriveModelTags(model({ modelId: 'a' }), {
      recommendedModelIds: ['a'],
      customTagsFor: () => [
        { kind: 'multimodal', label: 'Multimodal' },
        { kind: 'onprem', label: 'On-prem' },
      ],
    });
    const customIdx = tags.findIndex((t) => t.kind === 'multimodal');
    const recIdx = tags.findIndex((t) => t.kind === 'recommended');
    expect(customIdx).toBeGreaterThan(recIdx);
  });

  it('stamps the cost-tier pool badge by default when the DTO carries cost data', () => {
    const tags = deriveModelTags(
      model({
        modelId: 'a',
        modelDetails: { costDetails: { inputTokenCost: 6 } },
      })
    );
    expect(tags.find((t) => t.kind === 'cost-premium')).toBeTruthy();
  });

  it('does not stamp cost badges without cost data, and badgesFor([]) suppresses them', () => {
    expect(
      deriveModelTags(model({ modelId: 'a' })).find((t) => t.kind.startsWith('cost-'))
    ).toBeFalsy();
    const suppressed = deriveModelTags(
      model({
        modelId: 'a',
        modelDetails: { costDetails: { inputTokenCost: 6 } },
      }),
      { badgesFor: () => [] }
    );
    expect(suppressed.find((t) => t.kind.startsWith('cost-'))).toBeFalsy();
  });

  it('supports the agents cost-badge pattern via customTagsFor + defaultCostTier', () => {
    const costBadges = (m: DiscoveryModel) => {
      const tier = defaultCostTier(m);
      return tier ? [{ kind: `cost-${tier}`, label: tier }] : [];
    };
    const tags = deriveModelTags(
      model({
        modelId: 'a',
        modelDetails: { costDetails: { inputTokenCost: 6 } },
      }),
      { customTagsFor: costBadges }
    );
    expect(tags.find((t) => t.kind === 'cost-premium')).toBeTruthy();
  });

  it('DTO isRecommended (Model_hub merged by Discovery) wins over the heuristic', () => {
    // isPreview=true would normally exclude the model from Recommended,
    // but the backend-merged isRecommended field is authoritative.
    const promoted = deriveModelTags(model({ modelId: 'a', isPreview: true, isRecommended: true }));
    expect(promoted.find((t) => t.kind === 'recommended')).toBeTruthy();

    // Conversely an explicit false suppresses the heuristic's yes.
    const demoted = deriveModelTags(
      model({
        modelId: 'b',
        modelSubscriptionType: 'UiPathOwned',
        isRecommended: false,
      })
    );
    expect(demoted.find((t) => t.kind === 'recommended')).toBeFalsy();
  });
});

describe('defaultCostTier', () => {
  it('returns null when no cost data', () => {
    expect(defaultCostTier(model({}))).toBeNull();
  });

  it('bins at < $1 / < $5 / >= $5 thresholds', () => {
    expect(defaultCostTier(model({ modelDetails: { costDetails: { inputTokenCost: 0.4 } } }))).toBe(
      'basic'
    );
    expect(defaultCostTier(model({ modelDetails: { costDetails: { inputTokenCost: 3 } } }))).toBe(
      'standard'
    );
    expect(defaultCostTier(model({ modelDetails: { costDetails: { inputTokenCost: 6 } } }))).toBe(
      'premium'
    );
  });
});

describe('getSubstitutionTarget', () => {
  it('prefers replacedBy over effectiveModel over routingDetails.model', () => {
    expect(
      getSubstitutionTarget(
        model({
          modelName: 'a',
          effectiveModel: 'b',
          deprecationDetails: { replacedBy: 'c' },
        })
      )
    ).toBe('c');

    expect(getSubstitutionTarget(model({ modelName: 'a', effectiveModel: 'b' }))).toBe('b');

    expect(getSubstitutionTarget(model({ modelName: 'a', routingDetails: { model: 'b' } }))).toBe(
      'b'
    );
  });

  it('returns null when there is no substitution', () => {
    expect(
      getSubstitutionTarget(model({ modelName: 'gpt-5', effectiveModel: 'gpt-5' }))
    ).toBeNull();
    expect(getSubstitutionTarget(model({ modelName: 'gpt-5' }))).toBeNull();
  });
});

describe('badge pool', () => {
  it('resolves badgesFor kinds through MODEL_BADGES (label + variant)', () => {
    const tags = deriveModelTags(model({ modelId: 'a' }), {
      badgesFor: () => ['cost-premium'],
    });
    const badge = tags.find((t) => t.kind === 'cost-premium');
    expect(badge?.label).toBe('Premium');
    expect(badge?.variant).toBe('mini');
    expect(badge?.tooltip).toBeTruthy();
  });

  it('ignores kinds that are not in the pool', () => {
    const tags = deriveModelTags(model({ modelId: 'a' }), {
      badgesFor: () => ['not-a-real-badge' as never],
    });
    expect(tags.find((t) => t.kind === 'not-a-real-badge')).toBeUndefined();
  });

  it('renders pool badges before customTagsFor extras', () => {
    const tags = deriveModelTags(model({ modelId: 'a' }), {
      badgesFor: () => ['cost-basic'],
      customTagsFor: () => [{ kind: 'onprem', label: 'On-prem' }],
    });
    const kinds = tags.map((t) => t.kind);
    expect(kinds.indexOf('cost-basic')).toBeLessThan(kinds.indexOf('onprem'));
  });
});

describe('filterModels', () => {
  it('matches the Discovery displayName', () => {
    const models = [
      model({
        modelId: 'a',
        modelName: 'anthropic.claude-sonnet-4-6',
        displayName: 'Claude Sonnet 4.6',
      }),
      model({ modelId: 'b', modelName: 'gpt-4o' }),
    ];
    expect(filterModels(models, 'sonnet 4.6').map((m) => m.modelId)).toEqual(['a']);
  });

  it('matches case-insensitively across name, id, vendor', () => {
    const models = [
      model({
        modelId: 'anthropic.claude',
        modelName: 'Claude',
        vendor: 'AnthropicClaude',
      }),
      model({ modelId: 'openai.gpt-4', modelName: 'GPT-4', vendor: 'OpenAi' }),
    ];
    expect(filterModels(models, 'claude')).toHaveLength(1);
    expect(filterModels(models, 'gpt-4')).toHaveLength(1);
    expect(filterModels(models, 'CLAUDE')).toHaveLength(1);
  });

  it('returns everything for empty query', () => {
    const models = [model({ modelId: 'a' }), model({ modelId: 'b' })];
    expect(filterModels(models, '')).toEqual(models);
    expect(filterModels(models, '   ')).toEqual(models);
  });
});

describe('i18n resolution', () => {
  beforeAll(() => {
    // No catalogs are loaded; lingui falls back to each descriptor's
    // English `message`. This confirms the descriptor system end-to-end.
    i18n.activate('en');
  });

  it('resolves tag labels through the i18n instance', () => {
    const tags = deriveModelTags(model({ modelId: 'a' }), {
      recommendedModelIds: ['a'],
      i18n,
    });
    expect(tags.find((t) => t.kind === 'recommended')?.label).toBe('Recommended');
  });

  it('falls back to source English when no i18n instance is supplied', () => {
    const tags = deriveModelTags(model({ modelId: 'a' }), {
      recommendedModelIds: ['a'],
    });
    expect(tags.find((t) => t.kind === 'recommended')?.label).toBe('Recommended');
  });
});
