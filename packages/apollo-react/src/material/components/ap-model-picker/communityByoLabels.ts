import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import type { ByoModelDialogLabels } from '@uipath/apollo-wind';

import type { PickerTranslator } from './i18n';

const M = {
  title: msg({ id: 'modelPicker.community.title', message: 'Use your own model' }),
  description: msg({
    id: 'modelPicker.community.description',
    message: 'UiPath calls your provider with your own credentials.',
  }),
  editTitle: msg({ id: 'modelPicker.community.editTitle', message: 'Edit your model' }),
  editDescription: msg({
    id: 'modelPicker.community.editDescription',
    message: 'Change the model, its name or the connection it uses.',
  }),
  loadingContext: msg({
    id: 'modelPicker.community.loadingContext',
    message: 'Loading your connections',
  }),
  loadingModel: msg({ id: 'modelPicker.community.loadingModel', message: 'Loading your model' }),
  providerStep: msg({ id: 'modelPicker.community.providerStep', message: 'Provider' }),
  providerPlaceholder: msg({
    id: 'modelPicker.community.providerPlaceholder',
    message: 'Select a provider',
  }),
  connectionStep: msg({ id: 'modelPicker.community.connectionStep', message: 'Connection' }),
  connectionNeedsProvider: msg({
    id: 'modelPicker.community.connectionNeedsProvider',
    message: 'Select a provider first',
  }),
  savedConnection: msg({
    id: 'modelPicker.community.savedConnection',
    message: 'Saved connection: {name} · {folder}',
  }),
  newConnection: msg({ id: 'modelPicker.community.newConnection', message: 'New connection…' }),
  connectedIn: msg({
    id: 'modelPicker.community.connectedIn',
    message: 'Connected. New connection created in {folder}.',
  }),
  credentialsTitle: msg({
    id: 'modelPicker.community.credentialsTitle',
    message: '{provider} credentials',
  }),
  credentialsCaption: msg({
    id: 'modelPicker.community.credentialsCaption',
    message: 'Sent only to {provider}.',
  }),
  loadingForm: msg({
    id: 'modelPicker.community.loadingForm',
    message: 'Loading the {provider} form…',
  }),
  authType: msg({ id: 'modelPicker.community.authType', message: 'Authentication' }),
  moreSettings: msg({
    id: 'modelPicker.community.moreSettings',
    message: 'More {provider} settings',
  }),
  optional: msg({ id: 'modelPicker.community.optional', message: 'optional' }),
  inUiPathTitle: msg({ id: 'modelPicker.community.inUiPathTitle', message: 'In UiPath' }),
  inUiPathCaption: msg({
    id: 'modelPicker.community.inUiPathCaption',
    message: 'Your connection to {provider} will be saved in this folder.',
  }),
  connectionName: msg({ id: 'modelPicker.community.connectionName', message: 'Connection name' }),
  folder: msg({ id: 'modelPicker.community.folder', message: 'Folder' }),
  folderHint: msg({
    id: 'modelPicker.community.folderHint',
    message: 'Teammates with access to this folder can reuse the connection.',
  }),
  connectionNameTaken: msg({
    id: 'modelPicker.community.connectionNameTaken',
    message: 'You already have a connection with this name.',
  }),
  connect: msg({ id: 'modelPicker.community.connect', message: 'Connect' }),
  connecting: msg({ id: 'modelPicker.community.connecting', message: 'Connecting…' }),
  editConnection: msg({ id: 'modelPicker.community.editConnection', message: 'Edit connection' }),
  secretKeepHint: msg({
    id: 'modelPicker.community.secretKeepHint',
    message: 'Leave blank to keep the current value.',
  }),
  loadingConnection: msg({
    id: 'modelPicker.community.loadingConnection',
    message: 'Loading the connection settings…',
  }),
  saveConnection: msg({ id: 'modelPicker.community.saveConnection', message: 'Save connection' }),
  savingConnection: msg({ id: 'modelPicker.community.savingConnection', message: 'Saving…' }),
  cancelConnectionEdit: msg({
    id: 'modelPicker.community.cancelConnectionEdit',
    message: 'Cancel',
  }),
  connectionUpdated: msg({
    id: 'modelPicker.community.connectionUpdated',
    message: 'Connection updated.',
  }),
  checkingConnection: msg({
    id: 'modelPicker.community.checkingConnection',
    message: 'Checking the connection…',
  }),
  applyChange: msg({ id: 'modelPicker.community.applyChange', message: 'Switch connection' }),
  applyingChange: msg({ id: 'modelPicker.community.applyingChange', message: 'Switching…' }),
  separateConnection: msg({
    id: 'modelPicker.community.separateConnection',
    message: 'Create a separate connection instead',
  }),
  modelStep: msg({ id: 'modelPicker.community.modelStep', message: 'Your model' }),
  modelNeedsConnection: msg({
    id: 'modelPicker.community.modelNeedsConnection',
    message: 'Connect to list your {provider} models',
  }),
  modelsLoading: msg({
    id: 'modelPicker.community.modelsLoading',
    message: 'Loading your {provider} models…',
  }),
  modelsFailed: msg({
    id: 'modelPicker.community.modelsFailed',
    message: 'Could not list your {provider} models',
  }),
  modelSelect: msg({
    id: 'modelPicker.community.modelSelect',
    message: 'Select one of {count} models',
  }),
  modelSearch: msg({ id: 'modelPicker.community.modelSearch', message: 'Search {count} models…' }),
  modelNoMatch: msg({
    id: 'modelPicker.community.modelNoMatch',
    message: 'No models match "{query}".',
  }),
  compatibleGroup: msg({
    id: 'modelPicker.community.compatibleGroup',
    message: 'Can be used · {count}',
  }),
  incompatibleGroup: msg({
    id: 'modelPicker.community.incompatibleGroup',
    message: 'Not supported · {count}',
  }),
  modelIdPlaceholder: msg({
    id: 'modelPicker.community.modelIdPlaceholder',
    message: 'Model or deployment name',
  }),
  modelIdLabel: msg({ id: 'modelPicker.community.modelIdLabel', message: 'Model id' }),
  nameStep: msg({ id: 'modelPicker.community.nameStep', message: 'Model alias' }),
  nameHint: msg({
    id: 'modelPicker.community.nameHint',
    message: 'Shown in the model picker.',
  }),
  nameTaken: msg({
    id: 'modelPicker.community.nameTaken',
    message: '"{name}" is already in your model list. Pick another name.',
  }),
  nameReserved: msg({
    id: 'modelPicker.community.nameReserved',
    message: '"{name}" is the name of a UiPath model. Pick another name.',
  }),
  useOwnName: msg({
    id: 'modelPicker.community.useOwnName',
    message: 'Custom',
  }),
  aliasSearch: msg({ id: 'modelPicker.community.aliasSearch', message: 'Search UiPath models…' }),
  aliasNoMatch: msg({
    id: 'modelPicker.community.aliasNoMatch',
    message: 'No UiPath model matches "{query}".',
  }),
  addCustomAlias: msg({ id: 'modelPicker.community.addCustomAlias', message: 'Add custom alias' }),
  editCustomAlias: msg({
    id: 'modelPicker.community.editCustomAlias',
    message: 'Edit custom alias',
  }),
  customAliasPlaceholder: msg({
    id: 'modelPicker.community.customAliasPlaceholder',
    message: 'Enter a custom alias',
  }),
  addAlias: msg({ id: 'modelPicker.community.addAlias', message: 'Add' }),
  saveAlias: msg({ id: 'modelPicker.community.saveAlias', message: 'Save' }),
  useReplacement: msg({
    id: 'modelPicker.community.useReplacement',
    message: 'Replace a UiPath model',
  }),
  replacementPlaceholder: msg({
    id: 'modelPicker.community.replacementPlaceholder',
    message: 'Select a UiPath model',
  }),
  replacementHint: msg({
    id: 'modelPicker.community.replacementHint',
    message: 'Calls to this UiPath model go to your model instead.',
  }),
  deprecated: msg({
    id: 'modelPicker.community.deprecated',
    message: 'Deprecated',
  }),
  retiresOn: msg({
    id: 'modelPicker.community.retiresOn',
    message: 'To be retired on {date}',
  }),
  showResponse: msg({ id: 'modelPicker.community.showResponse', message: 'Show LLM response' }),
  hideResponse: msg({ id: 'modelPicker.community.hideResponse', message: 'Hide LLM response' }),
  close: msg({ id: 'modelPicker.community.close', message: 'Close' }),
  dismiss: msg({ id: 'modelPicker.community.dismiss', message: 'Dismiss' }),
  tryAgain: msg({ id: 'modelPicker.community.tryAgain', message: 'Try again' }),
  cancel: msg({ id: 'modelPicker.community.cancel', message: 'Cancel' }),
  testAndAdd: msg({ id: 'modelPicker.community.testAndAdd', message: 'Test and add' }),
  testAndSave: msg({ id: 'modelPicker.community.testAndSave', message: 'Test and save' }),
  testing: msg({ id: 'modelPicker.community.testing', message: 'Testing…' }),
  testAndAddHint: msg({
    id: 'modelPicker.community.testAndAddHint',
    message: 'Sends one short test message to {provider}, then adds the model to your model list.',
  }),
  testAndSaveHint: msg({
    id: 'modelPicker.community.testAndSaveHint',
    message: 'Sends one short test message to {provider}, then saves your changes.',
  }),
} satisfies Record<keyof ByoModelDialogLabels, MessageDescriptor>;

const SAVED = {
  added: msg({ id: 'modelPicker.community.savedAdded', message: '{name} added to your models' }),
  edited: msg({ id: 'modelPicker.community.savedEdited', message: 'Changes to {name} saved' }),
};

/** The message the picker hands its host's `notify` once the dialog saved a model. */
export function communitySavedMessage(
  { _ }: PickerTranslator,
  name: string,
  edited: boolean
): string {
  return _({ ...(edited ? SAVED.edited : SAVED.added), values: { name } });
}

/** A `YYYY-MM-DD` day in the reader's own date format; any other text as given. */
function formatDay(day: string): string {
  const date = new Date(`${day}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return day;
  return date.toLocaleDateString(undefined, { timeZone: 'UTC', dateStyle: 'medium' });
}

/** The Community dialog's strings, resolved through the picker's translator. */
export function communityDialogLabels({ _ }: PickerTranslator): ByoModelDialogLabels {
  const t = (d: MessageDescriptor, values?: Record<string, string | number>) => _({ ...d, values });
  return {
    title: t(M.title),
    description: t(M.description),
    editTitle: t(M.editTitle),
    editDescription: t(M.editDescription),
    loadingContext: t(M.loadingContext),
    loadingModel: t(M.loadingModel),
    providerStep: t(M.providerStep),
    providerPlaceholder: t(M.providerPlaceholder),
    connectionStep: t(M.connectionStep),
    connectionNeedsProvider: t(M.connectionNeedsProvider),
    savedConnection: (name, folder) => t(M.savedConnection, { name, folder }),
    newConnection: t(M.newConnection),
    connectedIn: (folder) => t(M.connectedIn, { folder }),
    credentialsTitle: (provider) => t(M.credentialsTitle, { provider }),
    credentialsCaption: (provider) => t(M.credentialsCaption, { provider }),
    loadingForm: (provider) => t(M.loadingForm, { provider }),
    authType: t(M.authType),
    moreSettings: (provider) => t(M.moreSettings, { provider }),
    optional: t(M.optional),
    inUiPathTitle: t(M.inUiPathTitle),
    inUiPathCaption: (provider) => t(M.inUiPathCaption, { provider }),
    connectionName: t(M.connectionName),
    folder: t(M.folder),
    folderHint: t(M.folderHint),
    connectionNameTaken: t(M.connectionNameTaken),
    connect: t(M.connect),
    connecting: t(M.connecting),
    editConnection: t(M.editConnection),
    secretKeepHint: t(M.secretKeepHint),
    loadingConnection: t(M.loadingConnection),
    saveConnection: t(M.saveConnection),
    savingConnection: t(M.savingConnection),
    cancelConnectionEdit: t(M.cancelConnectionEdit),
    connectionUpdated: t(M.connectionUpdated),
    checkingConnection: t(M.checkingConnection),
    applyChange: t(M.applyChange),
    applyingChange: t(M.applyingChange),
    separateConnection: t(M.separateConnection),
    modelStep: t(M.modelStep),
    modelNeedsConnection: (provider) => t(M.modelNeedsConnection, { provider }),
    modelsLoading: (provider) => t(M.modelsLoading, { provider }),
    modelsFailed: (provider) => t(M.modelsFailed, { provider }),
    modelSelect: (count) => t(M.modelSelect, { count }),
    modelSearch: (count) => t(M.modelSearch, { count }),
    modelNoMatch: (query) => t(M.modelNoMatch, { query }),
    compatibleGroup: (count) => t(M.compatibleGroup, { count }),
    incompatibleGroup: (count) => t(M.incompatibleGroup, { count }),
    modelIdPlaceholder: t(M.modelIdPlaceholder),
    modelIdLabel: t(M.modelIdLabel),
    nameStep: t(M.nameStep),
    nameHint: t(M.nameHint),
    nameTaken: (name) => t(M.nameTaken, { name }),
    nameReserved: (name) => t(M.nameReserved, { name }),
    useOwnName: t(M.useOwnName),
    aliasSearch: t(M.aliasSearch),
    aliasNoMatch: (query) => t(M.aliasNoMatch, { query }),
    addCustomAlias: t(M.addCustomAlias),
    editCustomAlias: t(M.editCustomAlias),
    customAliasPlaceholder: t(M.customAliasPlaceholder),
    addAlias: t(M.addAlias),
    saveAlias: t(M.saveAlias),
    useReplacement: t(M.useReplacement),
    replacementPlaceholder: t(M.replacementPlaceholder),
    replacementHint: t(M.replacementHint),
    deprecated: t(M.deprecated),
    retiresOn: (date) => t(M.retiresOn, { date: formatDay(date) }),
    showResponse: t(M.showResponse),
    hideResponse: t(M.hideResponse),
    close: t(M.close),
    dismiss: t(M.dismiss),
    tryAgain: t(M.tryAgain),
    cancel: t(M.cancel),
    testAndAdd: t(M.testAndAdd),
    testAndSave: t(M.testAndSave),
    testing: t(M.testing),
    testAndAddHint: (provider) => t(M.testAndAddHint, { provider }),
    testAndSaveHint: (provider) => t(M.testAndSaveHint, { provider }),
  };
}
