/**
 * Every user-visible string the dialog renders, with English defaults, as the
 * model picker's labels are: a host passes what its own catalog produced.
 * Field labels, hints and the provider's own error text come from the host's
 * API and are shown as given.
 */
export interface ByoModelDialogLabels {
  title: string;
  description: string;
  editTitle: string;
  editDescription: string;
  loadingContext: string;
  loadingModel: string;

  providerStep: string;
  providerPlaceholder: string;

  connectionStep: string;
  connectionNeedsProvider: string;
  savedConnection: (name: string, folder: string) => string;
  newConnection: string;
  connectedIn: (folder: string) => string;
  credentialsTitle: (provider: string) => string;
  credentialsCaption: (provider: string) => string;
  loadingForm: (provider: string) => string;
  authType: string;
  moreSettings: (provider: string) => string;
  optional: string;
  inUiPathTitle: string;
  inUiPathCaption: (provider: string) => string;
  connectionName: string;
  folder: string;
  folderHint: string;
  connectionNameTaken: string;
  connect: string;
  connecting: string;
  editConnection: string;
  secretKeepHint: string;
  loadingConnection: string;
  saveConnection: string;
  savingConnection: string;
  cancelConnectionEdit: string;
  connectionUpdated: string;
  checkingConnection: string;
  applyChange: string;
  applyingChange: string;
  separateConnection: string;

  modelStep: string;
  modelNeedsConnection: (provider: string) => string;
  modelsLoading: (provider: string) => string;
  modelsFailed: (provider: string) => string;
  modelSelect: (count: number) => string;
  modelSearch: (total: number) => string;
  modelNoMatch: (query: string) => string;
  compatibleGroup: (count: number) => string;
  incompatibleGroup: (count: number) => string;
  modelIdPlaceholder: string;
  modelIdLabel: string;

  nameStep: string;
  nameHint: string;
  nameTaken: (name: string) => string;
  nameReserved: (name: string) => string;
  useOwnName: string;
  aliasSearch: string;
  aliasNoMatch: (query: string) => string;
  addCustomAlias: string;
  editCustomAlias: string;
  customAliasPlaceholder: string;
  addAlias: string;
  saveAlias: string;
  useReplacement: string;
  replacementPlaceholder: string;
  replacementHint: string;
  deprecated: string;
  retiresOn: (date: string) => string;

  showResponse: string;
  hideResponse: string;

  close: string;
  dismiss: string;
  tryAgain: string;
  /** What to do after Connect or Save connection failed; `button` is the one that failed. */
  retryConnect: (button: string) => string;
  /** What to do after Test and add or Test and save failed; `button` is the one that failed. */
  retryTest: (button: string) => string;
  retrySwitch: string;
  cancel: string;
  testAndAdd: string;
  testAndSave: string;
  testing: string;
  testAndAddHint: (provider: string) => string;
  testAndSaveHint: (provider: string) => string;
}

export const DEFAULT_BYO_MODEL_DIALOG_LABELS: ByoModelDialogLabels = {
  title: 'Use your own model',
  description: 'UiPath calls your provider with your own credentials.',
  editTitle: 'Edit your model',
  editDescription: 'Change the model, its name or the connection it uses.',
  loadingContext: 'Loading your connections',
  loadingModel: 'Loading your model',

  providerStep: 'Provider',
  providerPlaceholder: 'Select a provider',

  connectionStep: 'Connection',
  connectionNeedsProvider: 'Select a provider first',
  savedConnection: (name, folder) => `Saved connection: ${name} · ${folder}`,
  newConnection: 'New connection…',
  connectedIn: (folder) => `Connected. New connection created in ${folder}.`,
  credentialsTitle: (provider) => `${provider} credentials`,
  credentialsCaption: (provider) => `Sent only to ${provider}.`,
  loadingForm: (provider) => `Loading the ${provider} form…`,
  authType: 'Authentication',
  moreSettings: (provider) => `More ${provider} settings`,
  optional: 'optional',
  inUiPathTitle: 'In UiPath',
  inUiPathCaption: (provider) => `Your connection to ${provider} will be saved in this folder.`,
  connectionName: 'Connection name',
  folder: 'Folder',
  folderHint: 'Teammates with access to this folder can reuse the connection.',
  connectionNameTaken: 'You already have a connection with this name.',
  connect: 'Connect',
  connecting: 'Connecting…',
  editConnection: 'Edit connection',
  secretKeepHint: 'Leave blank to keep the current value.',
  loadingConnection: 'Loading the connection settings…',
  saveConnection: 'Save connection',
  savingConnection: 'Saving…',
  cancelConnectionEdit: 'Cancel',
  connectionUpdated: 'Connection updated.',
  checkingConnection: 'Checking the connection…',
  applyChange: 'Switch connection',
  applyingChange: 'Switching…',
  separateConnection: 'Create a separate connection instead',

  modelStep: 'Your model',
  modelNeedsConnection: (provider) => `Connect to list your ${provider} models`,
  modelsLoading: (provider) => `Loading your ${provider} models…`,
  modelsFailed: (provider) => `Could not list your ${provider} models`,
  modelSelect: (count) => `Select one of ${count} models`,
  modelSearch: (total) => `Search ${total} models…`,
  modelNoMatch: (query) => `No models match "${query}".`,
  compatibleGroup: (count) => `Can be used · ${count}`,
  incompatibleGroup: (count) => `Not supported · ${count}`,
  modelIdPlaceholder: 'Model or deployment name',
  modelIdLabel: 'Model id',

  nameStep: 'Model alias',
  nameHint: 'Shown in the model picker.',
  nameTaken: () => 'Custom alias overlaps with already configured BYO LLM for this product and feature',
  nameReserved: () => 'Custom alias overlaps with existing UiPath LLM',
  useOwnName: 'Custom',
  aliasSearch: 'Search UiPath models…',
  aliasNoMatch: (query) => `No UiPath model matches "${query}".`,
  addCustomAlias: 'Add custom alias',
  editCustomAlias: 'Edit custom alias',
  customAliasPlaceholder: 'Enter a custom alias',
  addAlias: 'Add',
  saveAlias: 'Save',
  useReplacement: 'Replace a UiPath model',
  replacementPlaceholder: 'Select a UiPath model',
  replacementHint: 'Calls to this UiPath model go to your model instead.',
  deprecated: 'Deprecated',
  retiresOn: (date) => `To be retired on ${date}`,

  showResponse: 'Show LLM response',
  hideResponse: 'Hide LLM response',

  close: 'Close',
  dismiss: 'Dismiss',
  tryAgain: 'Try again',
  retryConnect: (button) => `Check the details above, then ${button} again.`,
  retryTest: (button) => `Pick another model or fix its connection, then ${button} again.`,
  retrySwitch: 'Switch connection again, or create a separate connection instead.',
  cancel: 'Cancel',
  testAndAdd: 'Test and add',
  testAndSave: 'Test and save',
  testing: 'Testing…',
  testAndAddHint: (provider) =>
    `Sends one short test message to ${provider}, then adds the model to your model list.`,
  testAndSaveHint: (provider) =>
    `Sends one short test message to ${provider}, then saves your changes.`,
};

/** Fill the gaps in a host's partial override. */
export function resolveByoModelDialogLabels(
  labels?: Partial<ByoModelDialogLabels>
): ByoModelDialogLabels {
  return labels
    ? { ...DEFAULT_BYO_MODEL_DIALOG_LABELS, ...labels }
    : DEFAULT_BYO_MODEL_DIALOG_LABELS;
}
