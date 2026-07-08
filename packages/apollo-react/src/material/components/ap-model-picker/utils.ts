import { MODEL_BADGES, type ModelBadgeKind } from './badges';
import type { PickerTranslator } from './i18n';

import { GROUP_LABELS, TAG_LABELS, tr } from './i18n';
import type { CostTier, DiscoveryModel, ModelGroup, ModelTag } from './types';

const RECOMMENDED_SUBSCRIPTION = 'UiPathOwned';

/**
 * Context passed to `deriveModelTags`. Carries the i18n instance,
 * region info, test-only Recommended/Preview overrides, and the
 * product's custom badge hook.
 */
export interface DeriveModelTagsContext {
  /**
   * Lingui i18n instance. When provided, the built-in tag labels +
   * tooltips render in the active locale. When omitted, labels fall
   * back to the message descriptors' English source strings — useful
   * for tests and standalone primitive composition.
   */
  i18n?: PickerTranslator;
  /** User's home region — used to flag out-of-region models. */
  homeRegion?: string;
  /**
   * Test/storybook override for the `recommended` signal. In
   * production the signal arrives ON the DTO (`model.isRecommended`),
   * merged into the Discovery response from Model_hub configs in
   * `gitops-centralized-cluster` — products should not set this.
   * When provided (even as an empty array), only listed ids get the
   * chip.
   */
  recommendedModelIds?: readonly string[];
  /**
   * Test/storybook override for the `preview` signal. Production
   * sources it from the DTO's `isPreview`.
   */
  previewModelIds?: readonly string[];
  /**
   * Stamp badges from the Apollo badge pool (see `MODEL_BADGES` in
   * badges.ts). Products return pool kinds per model; the pool owns the
   * label, tooltip, variant, and localization, so the same badge reads
   * identically in every product. Pool badges render after the built-in
   * derived chips (Recommended → Preview → Substituted → Deprecating →
   * Custom → Out-of-region) and before any `customTagsFor` extras.
   * Unknown kinds are ignored.
   */
  badgesFor?: (model: DiscoveryModel) => readonly ModelBadgeKind[];
  /**
   * Escape hatch: free-form product chips, appended last. Prefer
   * `badgesFor` — anything worth shipping belongs in the shared badge
   * pool so labels and colors stay consistent across products. Use this
   * only for experiments or one-offs pending a pool addition, and
   * register colors for new kinds via `customTagVariants`.
   */
  customTagsFor?: (model: DiscoveryModel) => readonly ModelTag[];
}

export function deriveModelTags(
  model: DiscoveryModel,
  context: DeriveModelTagsContext = {}
): ModelTag[] {
  const tags: ModelTag[] = [];
  // Resolve a message descriptor against the (optional) i18n instance.
  // When no instance is supplied (tests, primitive composition) we
  // fall back to the descriptor's source English message so the chip
  // still renders something legible.
  const localize = (desc: { id: string; message?: string }): string => {
    if (context.i18n) return tr(context.i18n, desc);
    return desc.message ?? desc.id;
  };

  // `preview` and `out-of-region` apply only to UiPath-hosted models:
  //   - Preview: UiPath controls the GA lifecycle for hosted models. For BYO,
  //     the customer configured the connection themselves and already knows
  //     what they hooked up — restating it as a chip is noise.
  //   - Out-of-region: gateway controls routing for hosted models. BYO models
  //     route to the customer's own endpoint, which they configured; the
  //     gateway doesn't know or control its region.
  const isByo =
    model.modelSubscriptionType === 'BYOMAdded' ||
    model.modelSubscriptionType === 'BYOMReplacedAlternative' ||
    model.modelSubscriptionType === 'BYOMReplacedLikeForLike';

  // `recommended` is governance authored in Model_hub configs
  // (gitops-centralized-cluster) and merged into the Discovery
  // response server-side — the DTO's `isRecommended` is the production
  // source of truth. Resolution: test override list → DTO field →
  // legacy heuristic (for backends that haven't rolled the field out).
  const isRecommended =
    context.recommendedModelIds !== undefined
      ? context.recommendedModelIds.includes(model.modelId)
      : (model.isRecommended ??
        (model.modelSubscriptionType === RECOMMENDED_SUBSCRIPTION &&
          !model.isPreview &&
          !model.deprecationDetails?.usageEndDate));
  if (isRecommended) {
    tags.push({
      kind: 'recommended',
      label: localize(TAG_LABELS.recommended),
      tooltip: localize(TAG_LABELS.recommendedTooltip),
    });
  }

  // Same story for `preview` — Model_hub-driven when the host supplies a
  // list, DTO `isPreview` otherwise.
  const isPreview =
    context.previewModelIds !== undefined
      ? context.previewModelIds.includes(model.modelId)
      : !!model.isPreview;
  if (!isByo && isPreview) {
    tags.push({ kind: 'preview', label: localize(TAG_LABELS.preview) });
  }

  // A "substitution" is when the gateway is actively routing traffic to a
  // different upstream model than the one the user picked. This happens
  // when a model has been retired and a routing rule maps it to a
  // replacement, but the user's stored selection still references the
  // original. Detected when `effectiveModel` exists and differs from the
  // model's primary identifier.
  //
  // `substituted` and `deprecating` are mutually exclusive:
  //   - `deprecating` = retirement is scheduled; you should migrate.
  //   - `substituted` = retirement already fired; your traffic is being
  //     transparently routed somewhere else.
  const substitutionTarget = getSubstitutionTarget(model);
  if (substitutionTarget) {
    // Dynamic strings need the i18n.t API so values interpolate into
    // the translation. The descriptor's English source is used as the
    // fallback when no i18n instance is supplied.
    tags.push({
      kind: 'substituted',
      label: context.i18n
        ? context.i18n._({
            id: 'modelPicker.tag.substituted.label',
            message: 'Routes to {target}',
            values: { target: substitutionTarget },
          })
        : `Routes to ${substitutionTarget}`,
      tooltip: context.i18n
        ? context.i18n._({
            id: 'modelPicker.tag.substituted.tooltip',
            message:
              'This model is retired. Your traffic is currently being routed to {target}. Update your configuration to make this explicit.',
            values: { target: substitutionTarget },
          })
        : `This model is retired. Your traffic is currently being routed to ${substitutionTarget}. Update your configuration to make this explicit.`,
    });
  } else if (model.deprecationDetails?.usageEndDate) {
    const date = formatDate(model.deprecationDetails.usageEndDate);
    tags.push({
      kind: 'deprecating',
      label: context.i18n
        ? context.i18n._({
            id: 'modelPicker.tag.deprecating.label',
            message: 'Deprecating {date}',
            values: { date },
          })
        : `Deprecating ${date}`,
      tooltip: model.deprecationDetails.replacedBy
        ? context.i18n
          ? context.i18n._({
              id: 'modelPicker.tag.deprecating.tooltip',
              message: 'Will be replaced by {replacement}',
              values: { replacement: model.deprecationDetails.replacedBy },
            })
          : `Will be replaced by ${model.deprecationDetails.replacedBy}`
        : undefined,
    });
  }

  if (isByo) {
    tags.push({ kind: 'custom', label: localize(TAG_LABELS.custom) });
  }

  if (!isByo) {
    const geo = model.routingDetails?.geography;
    if (geo && context.homeRegion && geo !== 'GLOBAL' && geo !== context.homeRegion) {
      tags.push({
        kind: 'out-of-region',
        label: context.i18n
          ? context.i18n._({
              id: 'modelPicker.tag.outOfRegion.label',
              message: 'Out of region ({geography})',
              values: { geography: geo },
            })
          : `Out of region (${geo})`,
        tooltip: context.i18n
          ? context.i18n._({
              id: 'modelPicker.tag.outOfRegion.tooltip',
              message: 'Routes traffic outside {homeRegion}',
              values: { homeRegion: context.homeRegion },
            })
          : `Routes traffic outside ${context.homeRegion}`,
      });
    }
  }

  // Product chips come last — the picker's canonical signals
  // (Recommended / Preview / lifecycle) should always read first so
  // users see the design-system semantics before any tenant noise.
  // Pool badges first (sanctioned, centrally defined), then any
  // free-form `customTagsFor` extras (escape hatch).
  if (context.badgesFor) {
    for (const kind of context.badgesFor(model) ?? []) {
      const def = MODEL_BADGES[kind];
      if (!def) continue;
      tags.push({
        kind,
        label: localize(def.label),
        tooltip: def.tooltip ? localize(def.tooltip) : undefined,
        variant: def.variant,
      });
    }
  }
  if (context.customTagsFor) {
    const extra = context.customTagsFor(model);
    if (extra?.length) tags.push(...extra);
  }

  return tags;
}

/**
 * EXAMPLE cost-tier classifier — the picker does NOT stamp cost chips
 * itself. Products that want cost badges (agents does) map a model to
 * one of the pool's cost kinds via `badgesFor`:
 *
 *   badgesFor={(m) => {
 *     const tier = defaultCostTier(m);
 *     return tier ? [`cost-${tier}` as const] : [];
 *   }}
 *
 * Bins Discovery's `inputTokenCost` (USD per million input tokens) at
 * $1 / $5. Copy it and change the thresholds, or classify on something
 * else entirely — the pool badge kinds are the shared contract, the
 * classifier is yours.
 */
const DEFAULT_BASIC_THRESHOLD = 1.0;
const DEFAULT_PREMIUM_THRESHOLD = 5.0;
export function defaultCostTier(model: DiscoveryModel): CostTier | null {
  const inputCost = model.modelDetails?.costDetails?.inputTokenCost;
  if (inputCost == null) return null;
  if (inputCost < DEFAULT_BASIC_THRESHOLD) return 'basic';
  if (inputCost < DEFAULT_PREMIUM_THRESHOLD) return 'standard';
  return 'premium';
}

/**
 * Returns the model identifier the gateway is *actually* routing to,
 * if it differs from the user's stored selection. Used to surface
 * silent substitutions (e.g., a retired model whose traffic is being
 * routed to a replacement via a gateway rule) so the user understands
 * what their workflow is really running against.
 *
 * Falls back through three sources, in order of trust:
 *   1. `deprecationDetails.replacedBy` — the explicit replacement name.
 *      Prefer this because it's the friendly identifier the migration
 *      rule was authored with.
 *   2. `effectiveModel` from the Discovery DTO — the actual upstream
 *      model name being invoked.
 *   3. `routingDetails.model` — the routed model when no other signal
 *      is set.
 *
 * Returns null when there's no substitution.
 */
export function getSubstitutionTarget(model: DiscoveryModel): string | null {
  // Discovery returns effectiveModel populated only when routing diverges
  // from the model's nominal identity. If it matches the modelName, the
  // user's selection IS what's running — no substitution.
  const effective = model.effectiveModel;
  if (effective && effective !== model.modelName && effective !== model.modelId) {
    return model.deprecationDetails?.replacedBy ?? effective;
  }
  const routed = model.routingDetails?.model;
  if (routed && routed !== model.modelName && routed !== model.modelId) {
    return model.deprecationDetails?.replacedBy ?? routed;
  }
  return null;
}

/**
 * Maps the raw Discovery `vendor` enum (UpperCamel, occasionally jarring
 * like `AnthropicClaude`) to a label that reads naturally in the
 * by-provider grouping header. Unknown vendors fall through unchanged.
 */
const VENDOR_LABELS: Record<string, string> = {
  AnthropicClaude: 'Anthropic',
  OpenAi: 'OpenAI',
  AzureOpenAi: 'Azure OpenAI',
  VertexAi: 'Google Vertex',
  AwsBedrock: 'AWS Bedrock',
};
function vendorLabel(vendor: string): string {
  return VENDOR_LABELS[vendor] ?? vendor;
}

function formatDate(iso: string): string {
  // `new Date()` never throws — bad input yields an Invalid Date that
  // would stringify into the UI ("Deprecating Invalid Date"). Fall back
  // to the raw value instead.
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, {
    month: 'short',
    year: 'numeric',
  });
}

export type GroupStrategy = 'subscription' | 'vendor' | 'flat';

/**
 * Optional context for `groupModels` — lets the host override the
 * Recommended/Preview heuristic with Model_hub-sourced lists so that
 * grouping and chip rendering agree, and inject the active Lingui
 * `i18n` instance so group labels render in the host's locale.
 */
export interface GroupModelsContext {
  recommendedModelIds?: readonly string[];
  previewModelIds?: readonly string[];
  /**
   * Lingui i18n instance. When provided, group labels + hints render
   * in the active locale; otherwise they fall back to English source
   * strings.
   */
  i18n?: PickerTranslator;
}

const isByoModel = (m: DiscoveryModel) =>
  m.modelSubscriptionType === 'BYOMAdded' ||
  m.modelSubscriptionType === 'BYOMReplacedAlternative' ||
  m.modelSubscriptionType === 'BYOMReplacedLikeForLike';

function buildSubscriptionMatchers(ctx: GroupModelsContext): Array<{
  key: string;
  label: string;
  hint?: string;
  match: (m: DiscoveryModel) => boolean;
}> {
  // Same resolution order as `deriveModelTags` so grouping and chip
  // rendering never disagree: test override → DTO `isRecommended`
  // (Model_hub merged into Discovery server-side) → legacy heuristic.
  const isRecommended = (m: DiscoveryModel): boolean =>
    ctx.recommendedModelIds !== undefined
      ? ctx.recommendedModelIds.includes(m.modelId)
      : (m.isRecommended ??
        (m.modelSubscriptionType === RECOMMENDED_SUBSCRIPTION &&
          !m.isPreview &&
          !m.deprecationDetails?.usageEndDate));
  const isPreview = (m: DiscoveryModel): boolean =>
    ctx.previewModelIds !== undefined ? ctx.previewModelIds.includes(m.modelId) : !!m.isPreview;
  const localize = (desc: { id: string; message?: string }): string => {
    if (ctx.i18n) return tr(ctx.i18n, desc);
    return desc.message ?? desc.id;
  };
  // Category view ordering: BYO first, then UiPath-hosted lifecycle.
  // Customers who bring their own connections expect them up front, not
  // buried below the hosted catalog. The matchers below are also the
  // render order — first match wins per model.
  return [
    {
      key: 'byo',
      label: localize(GROUP_LABELS.byo),
      hint: localize(GROUP_LABELS.byoHint),
      match: (m) => isByoModel(m),
    },
    {
      key: 'recommended',
      label: localize(GROUP_LABELS.recommended),
      hint: localize(GROUP_LABELS.recommendedHint),
      match: (m) => isRecommended(m),
    },
    {
      key: 'preview',
      label: localize(GROUP_LABELS.preview),
      hint: localize(GROUP_LABELS.previewHint),
      // Preview only applies to UiPath-hosted models. BYO already
      // matched above, so this branch will not see BYO models.
      match: (m) => isPreview(m) && !isByoModel(m),
    },
    {
      key: 'more',
      label: localize(GROUP_LABELS.more),
      hint: localize(GROUP_LABELS.moreHint),
      match: (m) => !isByoModel(m) && !m.deprecationDetails?.usageEndDate,
    },
    {
      key: 'deprecating',
      label: localize(GROUP_LABELS.deprecating),
      hint: localize(GROUP_LABELS.deprecatingHint),
      match: (m) => !!m.deprecationDetails?.usageEndDate,
    },
    {
      key: 'shared',
      label: localize(GROUP_LABELS.other),
      match: () => true,
    },
  ];
}

export function groupModels(
  models: DiscoveryModel[],
  strategy: GroupStrategy = 'subscription',
  context: GroupModelsContext = {}
): ModelGroup[] {
  const localize = (desc: { id: string; message?: string }): string => {
    if (context.i18n) return tr(context.i18n, desc);
    return desc.message ?? desc.id;
  };

  if (strategy === 'flat') {
    return [{ key: 'all', label: localize(GROUP_LABELS.allModels), models }];
  }

  if (strategy === 'vendor') {
    // BYO models share vendor enums with hosted models (a BYO `gpt-4o`
    // is still `OpenAi`) but conceptually belong to a different
    // catalog. Pull BYO out as a single group placed FIRST, then
    // per-vendor groups follow — matches Category view's BYO-first
    // ordering.
    const byVendor = new Map<string, DiscoveryModel[]>();
    const byo: DiscoveryModel[] = [];
    for (const m of models) {
      if (isByoModel(m)) {
        byo.push(m);
        continue;
      }
      const k = m.vendor || 'Other';
      if (!byVendor.has(k)) byVendor.set(k, []);
      byVendor.get(k)!.push(m);
    }
    const groups: ModelGroup[] = [];
    if (byo.length) {
      groups.push({
        key: 'byo',
        label: localize(GROUP_LABELS.byo),
        models: byo,
      });
    }
    // Within each provider section, order by lifecycle — Recommended,
    // then Preview, then the rest, with Deprecating last. Reuses the
    // Category matchers (whose array order IS the lifecycle rank) so
    // the two views never disagree on what counts as Recommended or
    // Preview. Ties keep catalog order (`sort` is stable).
    const matchers = buildSubscriptionMatchers(context);
    const ranks = new Map<DiscoveryModel, number>();
    const lifecycleRank = (m: DiscoveryModel): number => {
      let r = ranks.get(m);
      if (r === undefined) {
        const i = matchers.findIndex((g) => g.match(m));
        r = i === -1 ? matchers.length : i;
        ranks.set(m, r);
      }
      return r;
    };
    for (const [key, list] of byVendor.entries()) {
      groups.push({
        key,
        label: vendorLabel(key),
        models: list.sort((a, b) => lifecycleRank(a) - lifecycleRank(b)),
      });
    }
    return groups;
  }

  const matchers = buildSubscriptionMatchers(context);
  const buckets: Record<string, DiscoveryModel[]> = {};
  for (const m of models) {
    const bucket = matchers.find((g) => g.match(m));
    if (!bucket) continue;
    const list = buckets[bucket.key] ?? (buckets[bucket.key] = []);
    list.push(m);
  }

  const out: ModelGroup[] = [];
  for (const g of matchers) {
    const list = buckets[g.key];
    if (!list?.length) continue;
    out.push({ key: g.key, label: g.label, hint: g.hint, models: list });
  }
  return out;
}

export function filterModels(models: DiscoveryModel[], query: string): DiscoveryModel[] {
  const q = query.trim().toLowerCase();
  if (!q) return models;
  return models.filter((m) => {
    const haystack = [
      m.modelName,
      m.displayName,
      m.modelId,
      m.vendor,
      m.modelFamily,
      m.effectiveModel,
      m.byoConnectionLabel,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}
