/**
 * The Apollo badge pool.
 *
 * Products do not invent their own badge kinds: they stamp badges from
 * this shared pool (via the `badgesFor` prop), and grow the pool here
 * when a new badge is needed. That keeps labels, colors, and semantics
 * consistent across every product surface, and every pool label is
 * localized once, centrally.
 *
 * Adding a badge is a design-system PR: one entry below plus its
 * entry in `labels.ts`. The pool starts with the cost tiers
 * (Basic / Standard / Premium).
 *
 * `customTagsFor` remains as an escape hatch for experiments, but the
 * expectation is that anything worth shipping graduates into the pool.
 */

import type { StaticLabelKey } from './labels';

/** Kinds available in the pool. Grows by design-system PR. */
export type ModelBadgeKind = 'cost-basic' | 'cost-standard' | 'cost-premium';

export interface ModelBadgeDefinition {
  /**
   * Which label the chip renders. A key rather than a string, so the pool
   * stays declarative and the host's `labels` supply the wording.
   */
  label: StaticLabelKey;
  /** Optional tooltip, same indirection. */
  tooltip?: StaticLabelKey;
  /**
   * Semantic chip variant (`mini | info-mini | success-mini |
   * warning-mini | error-mini`). These are the same tokens the
   * apollo-react picker uses, so the prop surface matches; `ModelTagChip`
   * maps them onto wind `Badge` variants.
   */
  variant: string;
}

/**
 * Cost tiers render as neutral gray mini chips deliberately: the
 * semantic warning/error palette would imply that high-cost models are
 * risky, which they are not.
 */
export const MODEL_BADGES: Record<ModelBadgeKind, ModelBadgeDefinition> = {
  'cost-basic': {
    label: 'costBasic',
    tooltip: 'costTooltip',
    variant: 'mini',
  },
  'cost-standard': {
    label: 'costStandard',
    tooltip: 'costTooltip',
    variant: 'mini',
  },
  'cost-premium': {
    label: 'costPremium',
    tooltip: 'costTooltip',
    variant: 'mini',
  },
};
