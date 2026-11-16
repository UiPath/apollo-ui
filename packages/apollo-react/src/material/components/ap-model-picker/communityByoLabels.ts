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
  loadingContext: msg({
    id: 'modelPicker.community.loadingContext',
    message: 'Loading your connections',
  }),
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
  storedIn: msg({ id: 'modelPicker.community.storedIn', message: 'Stored in' }),
  folderHint: msg({
    id: 'modelPicker.community.folderHint',
    message: 'Personal workspace keeps it to you; a shared folder lets teammates reuse it.',
  }),
  connectionNameTaken: msg({
    id: 'modelPicker.community.connectionNameTaken',
    message: 'You already have a connection with this name.',
  }),
  connect: msg({ id: 'modelPicker.community.connect', message: 'Connect' }),
  connecting: msg({ id: 'modelPicker.community.connecting', message: 'Connecting…' }),
  modelStep: msg({ id: 'modelPicker.community.modelStep', message: 'Model' }),
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
    message: 'Select a model · {count} can be used',
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
  nameStep: msg({ id: 'modelPicker.community.nameStep', message: 'Name in your model list' }),
  nameHint: msg({
    id: 'modelPicker.community.nameHint',
    message: 'Shown in the model picker. Defaults to the model id.',
  }),
  nameTaken: msg({
    id: 'modelPicker.community.nameTaken',
    message: '"{name}" is already in your model list. Pick another name.',
  }),
  showResponse: msg({ id: 'modelPicker.community.showResponse', message: 'Show full response' }),
  hideResponse: msg({ id: 'modelPicker.community.hideResponse', message: 'Hide full response' }),
  testPassed: msg({
    id: 'modelPicker.community.testPassed',
    message: '{model} responded in {seconds}s.',
  }),
  close: msg({ id: 'modelPicker.community.close', message: 'Close' }),
  cancel: msg({ id: 'modelPicker.community.cancel', message: 'Cancel' }),
  testAndAdd: msg({ id: 'modelPicker.community.testAndAdd', message: 'Test and add' }),
  testing: msg({ id: 'modelPicker.community.testing', message: 'Testing…' }),
  testAndAddHint: msg({
    id: 'modelPicker.community.testAndAddHint',
    message: 'Sends one short test message to {provider}, then adds the model to your model list.',
  }),
} satisfies Record<keyof ByoModelDialogLabels, MessageDescriptor>;

/** The Community dialog's strings, resolved through the picker's translator. */
export function communityDialogLabels({ _ }: PickerTranslator): ByoModelDialogLabels {
  const t = (d: MessageDescriptor, values?: Record<string, string | number>) => _({ ...d, values });
  return {
    title: t(M.title),
    description: t(M.description),
    loadingContext: t(M.loadingContext),
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
    storedIn: t(M.storedIn),
    folderHint: t(M.folderHint),
    connectionNameTaken: t(M.connectionNameTaken),
    connect: t(M.connect),
    connecting: t(M.connecting),
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
    showResponse: t(M.showResponse),
    hideResponse: t(M.hideResponse),
    testPassed: (model, seconds) => t(M.testPassed, { model, seconds }),
    close: t(M.close),
    cancel: t(M.cancel),
    testAndAdd: t(M.testAndAdd),
    testing: t(M.testing),
    testAndAddHint: (provider) => t(M.testAndAddHint, { provider }),
  };
}
