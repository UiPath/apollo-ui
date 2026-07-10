/**
 * Centralized message descriptors for the ModelPicker.
 *
 * Apollo's lingui setup expects every translatable string to be
 * statically extractable. For strings whose identity is known at
 * compile time we declare them with `msg()` here once, then resolve
 * them at render via `i18n._(descriptor)` — the same catalog pattern
 * ap-chat and ap-tool-call use in this package.
 *
 * This file is reserved for:
 *   - tag chip labels + tooltips (`deriveModelTags` builds DTOs)
 *   - group labels + hints (`groupModels` builds DTOs)
 *   - row + folder switcher defaults that need to be passable to
 *     non-React utility callers
 */

import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';

/**
 * Minimal translator contract the picker threads through its utils.
 * Structurally satisfied both by a real Lingui `I18n` instance and by
 * the `useSafeLingui()` fallback, so the picker renders English
 * defaults even when the host mounts no `I18nProvider`.
 */
export interface PickerTranslator {
  _: (descriptor: MessageDescriptor) => string;
}

/* ──────────────────────────────────────────────────────────────────────
 * Tag chips
 * ─────────────────────────────────────────────────────────────────── */

export const TAG_LABELS = {
  recommended: msg({
    id: 'modelPicker.tag.recommended.label',
    message: 'Recommended',
  }),
  recommendedTooltip: msg({
    id: 'modelPicker.tag.recommended.tooltip',
    message: 'Based on evaluation runs for this product',
  }),
  preview: msg({ id: 'modelPicker.tag.preview.label', message: 'Preview' }),
  custom: msg({ id: 'modelPicker.tag.custom.label', message: 'Custom' }),
} as const;

/* ──────────────────────────────────────────────────────────────────────
 * Badge pool (see badges.ts)
 * ─────────────────────────────────────────────────────────────────── */

export const BADGE_LABELS = {
  costBasic: msg({ id: 'modelPicker.badge.costBasic.label', message: 'Basic' }),
  costStandard: msg({
    id: 'modelPicker.badge.costStandard.label',
    message: 'Standard',
  }),
  costPremium: msg({
    id: 'modelPicker.badge.costPremium.label',
    message: 'Premium',
  }),
  costTooltip: msg({
    id: 'modelPicker.badge.cost.tooltip',
    message: 'Relative cost tier for this product',
  }),
} as const;

/* ──────────────────────────────────────────────────────────────────────
 * Groups
 * ─────────────────────────────────────────────────────────────────── */

export const GROUP_LABELS = {
  recommended: msg({
    id: 'modelPicker.group.recommended.label',
    message: 'Recommended',
  }),
  recommendedHint: msg({
    id: 'modelPicker.group.recommended.hint',
    message: 'Based on evaluation runs for this product',
  }),
  preview: msg({
    id: 'modelPicker.group.preview.label',
    message: 'Preview',
  }),
  previewHint: msg({
    id: 'modelPicker.group.preview.hint',
    message: 'Newer models in early access',
  }),
  more: msg({ id: 'modelPicker.group.more.label', message: 'More models' }),
  moreHint: msg({
    id: 'modelPicker.group.more.hint',
    message: 'Available, not currently promoted by this product',
  }),
  deprecating: msg({
    id: 'modelPicker.group.deprecating.label',
    message: 'Deprecating soon',
  }),
  deprecatingHint: msg({
    id: 'modelPicker.group.deprecating.hint',
    message: 'Migrate before the usage end date',
  }),
  byo: msg({
    id: 'modelPicker.group.byo.label',
    message: 'Custom Models (BYO)',
  }),
  byoHint: msg({
    id: 'modelPicker.group.byo.hint',
    message: 'Models you brought via your own connections',
  }),
  other: msg({ id: 'modelPicker.group.other.label', message: 'Other' }),
  allModels: msg({
    id: 'modelPicker.group.allModels.label',
    message: 'All models',
  }),
} as const;

/* ──────────────────────────────────────────────────────────────────────
 * Listbox / accessibility
 * ─────────────────────────────────────────────────────────────────── */

export const LISTBOX_LABEL = msg({
  id: 'modelPicker.listbox.label',
  message: 'Models',
});

export const SEARCH_PLACEHOLDER = msg({
  id: 'modelPicker.search.placeholder',
  message: 'Search models',
});

export const LOADING_LABEL = msg({
  id: 'modelPicker.loading.label',
  message: 'Loading models',
});

/* ──────────────────────────────────────────────────────────────────────
 * Folder switcher
 * ─────────────────────────────────────────────────────────────────── */

export const FOLDER_SWITCHER = {
  allFolders: msg({
    id: 'modelPicker.folderSwitcher.allFolders',
    message: 'All folders',
  }),
} as const;

/* ──────────────────────────────────────────────────────────────────────
 * Row actions (BYO)
 * ─────────────────────────────────────────────────────────────────── */

export const ROW_ACTIONS = {
  // Opens the AI Trust Layer LLM-configurations edit page; removal
  // lives there too, so there is no separate delete action.
  editConfiguration: msg({
    id: 'modelPicker.row.editConfiguration',
    message: 'Edit configuration',
  }),
} as const;

/* ──────────────────────────────────────────────────────────────────────
 * Footer CTA
 * ─────────────────────────────────────────────────────────────────── */

export const USE_CUSTOM_MODEL = {
  title: msg({
    id: 'modelPicker.useCustomModel.title',
    message: 'Use custom model',
  }),
  subtitle: msg({
    id: 'modelPicker.useCustomModel.subtitle',
    message: 'Bring a model from your own connection',
  }),
  disabledHint: msg({
    id: 'modelPicker.useCustomModel.disabledHint',
    message: 'Pass onUseCustomModel or a requestContext to the picker to wire this action.',
  }),
} as const;

/* ──────────────────────────────────────────────────────────────────────
 * Group-by toggle
 * ─────────────────────────────────────────────────────────────────── */

export const GROUP_BY = {
  groupAriaLabel: msg({
    id: 'modelPicker.groupBy.ariaLabel',
    message: 'Group models by',
  }),
  category: msg({ id: 'modelPicker.groupBy.category', message: 'Category' }),
  provider: msg({ id: 'modelPicker.groupBy.provider', message: 'Provider' }),
} as const;

/* ──────────────────────────────────────────────────────────────────────
 * Empty / placeholder
 * ─────────────────────────────────────────────────────────────────── */

export const PLACEHOLDER = msg({
  id: 'modelPicker.placeholder.selectAModel',
  message: 'Select a model',
});

export const LABEL_DEFAULT = msg({
  id: 'modelPicker.label.default',
  message: 'Model',
});

/* ──────────────────────────────────────────────────────────────────────
 * Helpers
 * ─────────────────────────────────────────────────────────────────── */

/**
 * Resolve a descriptor against a translator. Tiny helper to keep call
 * sites concise — `i18n._(descriptor)` is the canonical pattern but
 * verbose when used repeatedly.
 */
export function tr(i18n: PickerTranslator, descriptor: MessageDescriptor): string {
  return i18n._(descriptor);
}
