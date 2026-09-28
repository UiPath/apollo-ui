/**
 * Every user-visible string the picker renders.
 *
 * The component is presentation-only: it holds no i18n machinery and resolves
 * nothing itself. A host passes whatever its own catalog produced, and the
 * English below fills in the rest — so an unlocalized host still renders real
 * copy rather than raw keys.
 *
 * Strings that interpolate are functions rather than templates so a translator
 * controls word order, which a `{name}`-style placeholder cannot express in
 * every language.
 */
export interface ModelPickerLabels {
  /* Field chrome */
  fieldLabel: string;
  placeholder: string;
  searchPlaceholder: string;
  listboxLabel: string;
  loading: string;
  emptyNoModels: string;
  emptyNoMatch: (query: string) => string;
  resultCount: (count: number) => string;
  unknownValueTooltip: (value: string) => string;

  /* Lifecycle chips */
  recommendedTag: string;
  recommendedTagTooltip: string;
  previewTag: string;
  customTag: string;
  deprecatingTag: (date: string) => string;
  deprecatingTagTooltip: (replacement: string) => string;
  substitutedTag: (target: string) => string;
  substitutedTagTooltip: (target: string) => string;
  outOfRegionTag: (geography: string) => string;
  outOfRegionTagTooltip: (homeRegion: string) => string;

  /* Cost badge pool */
  costBasic: string;
  costStandard: string;
  costPremium: string;
  costTooltip: string;

  /* Sections */
  recommendedGroup: string;
  recommendedGroupHint: string;
  previewGroup: string;
  previewGroupHint: string;
  moreGroup: string;
  moreGroupHint: string;
  deprecatingGroup: string;
  deprecatingGroupHint: string;
  byoGroup: string;
  byoGroupHint: string;
  otherGroup: string;
  allModelsGroup: string;
  /** Right-aligned count on a section header. */
  modelCount: (count: number) => string;

  /* Toolbar */
  groupByAriaLabel: string;
  groupByCategory: string;
  groupByProvider: string;
  allFolders: string;

  /* BYO affordances */
  editConfiguration: string;
  deleteConfiguration: string;
  deleteConfirmTitle: string;
  deleteConfirmMessage: (name: string) => string;
  deleteConfirmCancel: string;
  deleteConfirmConfirm: string;
  useCustomModelTitle: string;
  useCustomModelSubtitle: string;
  useCustomModelDisabledHint: string;

  /* Row meta */
  /** The context-window column, e.g. "1M context". */
  contextWindow: (tokens: number) => string;
}

/**
 * The label keys whose value is a plain string — the ones a declarative
 * lookup (the badge pool) can name without knowing an argument to pass.
 */
export type StaticLabelKey = {
  [K in keyof ModelPickerLabels]: ModelPickerLabels[K] extends string ? K : never;
}[keyof ModelPickerLabels];

/**
 * Format a token count the way the column reads: "1M context", "128K context".
 * Exported so a host can reuse the rounding and only translate the suffix.
 */
export function formatContextWindow(tokens: number): string {
  if (tokens >= 1_000_000) {
    const m = tokens / 1_000_000;
    return `${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M context`;
  }
  if (tokens >= 1_000) return `${Math.round(tokens / 1_000)}K context`;
  return `${tokens} context`;
}

export const DEFAULT_MODEL_PICKER_LABELS: ModelPickerLabels = {
  fieldLabel: 'Model',
  placeholder: 'Select a model',
  searchPlaceholder: 'Search models',
  listboxLabel: 'Models',
  loading: 'Loading models',
  emptyNoModels: 'No models available.',
  emptyNoMatch: (query) => `No models match "${query}".`,
  resultCount: (count) => `${count} ${count === 1 ? 'model' : 'models'}`,
  unknownValueTooltip: (value) =>
    `"${value}" is no longer available in this catalog. Pick a replacement to ensure your workflow continues to run.`,

  recommendedTag: 'Recommended',
  recommendedTagTooltip: 'Based on evaluation runs for this product',
  previewTag: 'Preview',
  customTag: 'Custom',
  deprecatingTag: (date) => `Deprecating ${date}`,
  deprecatingTagTooltip: (replacement) => `Will be replaced by ${replacement}`,
  substitutedTag: (target) => `Routes to ${target}`,
  substitutedTagTooltip: (target) =>
    `This model is retired. Your traffic is currently being routed to ${target}. Update your configuration to make this explicit.`,
  outOfRegionTag: (geography) => `Out of region (${geography})`,
  outOfRegionTagTooltip: (homeRegion) => `Routes traffic outside ${homeRegion}`,

  costBasic: 'Basic',
  costStandard: 'Standard',
  costPremium: 'Premium',
  costTooltip: 'Relative cost tier for this product',

  recommendedGroup: 'Recommended',
  recommendedGroupHint: 'Based on evaluation runs for this product',
  previewGroup: 'Preview',
  previewGroupHint: 'Newer models in early access',
  moreGroup: 'More models',
  moreGroupHint: 'Available, not currently promoted by this product',
  deprecatingGroup: 'Deprecating soon',
  deprecatingGroupHint: 'Migrate before the usage end date',
  byoGroup: 'Custom Models (BYO)',
  byoGroupHint: 'Models you brought via your own connections',
  otherGroup: 'Other',
  allModelsGroup: 'All models',
  modelCount: (count) => `${count} ${count === 1 ? 'model' : 'models'}`,

  groupByAriaLabel: 'Group models by',
  groupByCategory: 'Category',
  groupByProvider: 'Provider',
  allFolders: 'All folders',

  editConfiguration: 'Edit configuration',
  deleteConfiguration: 'Delete configuration',
  deleteConfirmTitle: 'Delete custom model',
  deleteConfirmMessage: (name) =>
    `This permanently deletes the "${name}" configuration for everyone in this tenant. This action cannot be undone.`,
  deleteConfirmCancel: 'Cancel',
  deleteConfirmConfirm: 'Delete',
  useCustomModelTitle: 'Use custom model',
  useCustomModelSubtitle: 'Bring a model from your own connection',
  useCustomModelDisabledHint: 'Pass onUseCustomModel to wire this action.',

  contextWindow: formatContextWindow,
};

/** Fill the gaps in a host's partial override. */
export function resolveLabels(labels?: Partial<ModelPickerLabels>): ModelPickerLabels {
  return labels ? { ...DEFAULT_MODEL_PICKER_LABELS, ...labels } : DEFAULT_MODEL_PICKER_LABELS;
}
