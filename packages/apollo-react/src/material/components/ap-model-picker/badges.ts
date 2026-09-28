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
 * `msg()` descriptor in `i18n.ts`. The pool starts with the cost tiers
 * (Basic / Standard / Premium).
 *
 * `customTagsFor` remains as an escape hatch for experiments, but the
 * expectation is that anything worth shipping graduates into the pool.
 */

import type { MessageDescriptor } from '@lingui/core';

import { BADGE_LABELS } from './i18n';

/** Kinds available in the pool. Grows by design-system PR. */
export type ModelBadgeKind = 'cost-basic' | 'cost-standard' | 'cost-premium';

export interface ModelBadgeDefinition {
  /** Localized chip label. */
  label: MessageDescriptor;
  /** Optional localized tooltip. */
  tooltip?: MessageDescriptor;
  /**
   * Apollo mini-chip variant the badge renders with
   * (`mini | info-mini | success-mini | warning-mini | error-mini`).
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
    label: BADGE_LABELS.costBasic,
    tooltip: BADGE_LABELS.costTooltip,
    variant: 'mini',
  },
  'cost-standard': {
    label: BADGE_LABELS.costStandard,
    tooltip: BADGE_LABELS.costTooltip,
    variant: 'mini',
  },
  'cost-premium': {
    label: BADGE_LABELS.costPremium,
    tooltip: BADGE_LABELS.costTooltip,
    variant: 'mini',
  },
};
