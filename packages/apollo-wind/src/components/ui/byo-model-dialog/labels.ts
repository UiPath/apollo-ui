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

  modelStep: string;
  modelNeedsConnection: (provider: string) => string;
  modelsLoading: (provider: string) => string;
  modelsFailed: (provider: string) => string;
  modelSelect: (compatible: number) => string;
  modelSearch: (total: number) => string;
  modelNoMatch: (query: string) => string;
  compatibleGroup: (count: number) => string;
  incompatibleGroup: (count: number) => string;
  modelIdPlaceholder: string;
  modelIdLabel: string;

  nameStep: string;
  nameHint: string;
  nameTaken: (name: string) => string;

  showResponse: string;
  hideResponse: string;

  close: string;
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
  folderHint: 'Personal workspace keeps it to you; a shared folder lets teammates reuse it.',
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

  modelStep: 'Model',
  modelNeedsConnection: (provider) => `Connect to list your ${provider} models`,
  modelsLoading: (provider) => `Loading your ${provider} models…`,
  modelsFailed: (provider) => `Could not list your ${provider} models`,
  modelSelect: (compatible) => `Select a model · ${compatible} can be used`,
  modelSearch: (total) => `Search ${total} models…`,
  modelNoMatch: (query) => `No models match "${query}".`,
  compatibleGroup: (count) => `Can be used · ${count}`,
  incompatibleGroup: (count) => `Not supported · ${count}`,
  modelIdPlaceholder: 'Model or deployment name',
  modelIdLabel: 'Model id',

  nameStep: 'Name in your model list',
  nameHint: 'Shown in the model picker. Defaults to the model id.',
  nameTaken: (name) => `"${name}" is already in your model list. Pick another name.`,

  showResponse: 'Show LLM response',
  hideResponse: 'Hide LLM response',

  close: 'Close',
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
