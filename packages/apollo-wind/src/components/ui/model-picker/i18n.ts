/**
 * Centralized message descriptors for the ModelPicker.
 *
 * Every translatable string is declared once here as a descriptor,
 * then resolved at render via `i18n._(descriptor)` against whatever
 * translator the host supplies (`defaultTranslator` when it supplies
 * none). Keeping the ids identical to the apollo-react `ap-model-picker`
 * catalog means a host already translating that component can reuse its
 * existing `modelPicker.*` keys verbatim.
 *
 * This file is reserved for:
 *   - tag chip labels + tooltips (`deriveModelTags` builds DTOs)
 *   - group labels + hints (`groupModels` builds DTOs)
 *   - row + folder switcher defaults that need to be passable to
 *     non-React utility callers
 */

/**
 * One translatable string. Mirrors the shape of a Lingui
 * `MessageDescriptor` so the descriptor table below stays a verbatim
 * copy of the apollo-react original, but carries no Lingui dependency —
 * apollo-wind ships no i18n library, every string is the host's to
 * translate.
 */
export interface PickerMessage {
  id: string;
  /**
   * English source text. Optional so the shape stays structurally
   * compatible with Lingui's `MessageDescriptor`; a descriptor without
   * one falls back to its `id`.
   */
  message?: string;
  values?: Record<string, unknown>;
}

/**
 * Identity helper. Exists only so the descriptor declarations below read
 * identically to the apollo-react original and can be diffed against it.
 */
const msg = (descriptor: PickerMessage): PickerMessage => descriptor;

/**
 * Minimal translator contract the picker threads through its utils.
 * Structurally satisfied by a real Lingui `I18n` instance, by a
 * react-i18next-backed shim, and by `defaultTranslator`, so the picker
 * renders English defaults in a host with no i18n at all.
 */
export interface PickerTranslator {
  _: (descriptor: PickerMessage) => string;
}

/** `{name}`-style interpolation over a descriptor's own `values`. */
function interpolate(message: string, values: Record<string, unknown> | undefined): string {
  if (!values) return message;
  return message.replace(/\{(\w+)\}/g, (match, key) =>
    key in values ? String(values[key]) : match
  );
}

/** English-only translator, used when the host supplies none. */
export const defaultTranslator: PickerTranslator = {
  _: (descriptor) => interpolate(descriptor.message ?? descriptor.id, descriptor.values),
};

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
  // Opens the AI Trust Layer LLM-configurations edit page.
  editConfiguration: msg({
    id: 'modelPicker.row.editConfiguration',
    message: 'Edit configuration',
  }),
  // Optional delete action, surfaced only when the host passes `onDeleteModel`.
  deleteConfiguration: msg({
    id: 'modelPicker.row.deleteConfiguration',
    message: 'Delete configuration',
  }),
} as const;

/* ──────────────────────────────────────────────────────────────────────
 * Delete confirmation
 * ─────────────────────────────────────────────────────────────────── */

export const DELETE_CONFIRM = {
  title: msg({
    id: 'modelPicker.deleteConfirm.title',
    message: 'Delete custom model',
  }),
  message: msg({
    id: 'modelPicker.deleteConfirm.message',
    message:
      'This permanently deletes the "{name}" configuration for everyone in this tenant. This action cannot be undone.',
  }),
  cancel: msg({
    id: 'modelPicker.deleteConfirm.cancel',
    message: 'Cancel',
  }),
  confirm: msg({
    id: 'modelPicker.deleteConfirm.confirm',
    message: 'Delete',
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
export function tr(i18n: PickerTranslator, descriptor: PickerMessage): string {
  return i18n._(descriptor);
}
