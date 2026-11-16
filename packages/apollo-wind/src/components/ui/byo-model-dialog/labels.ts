/**
 * Every user-visible string the dialog renders, with English defaults, as the
 * model picker's labels are: a host passes what its own catalog produced.
 * Field labels, hints and the provider's own error text come from the host's
 * API and are shown as given.
 */
export interface ByoModelDialogLabels {
  title: string;
  description: string;
  loadingContext: string;

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
  storedIn: string;
  folderHint: string;
  connectionNameTaken: string;
  connect: string;
  connecting: string;

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
  testPassed: (model: string, seconds: string) => string;

  close: string;
  cancel: string;
  testAndAdd: string;
  testing: string;
  testAndAddHint: (provider: string) => string;
}

export const DEFAULT_BYO_MODEL_DIALOG_LABELS: ByoModelDialogLabels = {
  title: 'Use your own model',
  description: 'UiPath calls your provider with your own credentials.',
  loadingContext: 'Loading your connections',

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
  storedIn: 'Stored in',
  folderHint: 'Personal workspace keeps it to you; a shared folder lets teammates reuse it.',
  connectionNameTaken: 'You already have a connection with this name.',
  connect: 'Connect',
  connecting: 'Connecting…',

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

  showResponse: 'Show full response',
  hideResponse: 'Hide full response',
  testPassed: (model, seconds) => `${model} responded in ${seconds}s.`,

  close: 'Close',
  cancel: 'Cancel',
  testAndAdd: 'Test and add',
  testing: 'Testing…',
  testAndAddHint: (provider) =>
    `Sends one short test message to ${provider}, then adds the model to your model list.`,
};

/** Fill the gaps in a host's partial override. */
export function resolveByoModelDialogLabels(
  labels?: Partial<ByoModelDialogLabels>
): ByoModelDialogLabels {
  return labels
    ? { ...DEFAULT_BYO_MODEL_DIALOG_LABELS, ...labels }
    : DEFAULT_BYO_MODEL_DIALOG_LABELS;
}
