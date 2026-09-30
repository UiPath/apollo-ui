/**
 * Apollo-Wind Metadata Forms
 * Enterprise-grade metadata-driven form system
 */

export {
  type AdapterRequest,
  type AdapterResponse,
  type DataAdapter,
  DataFetcher,
  DataSourceBuilder,
  DataTransformers,
  FetchAdapter,
} from './data-fetcher';
export {
  type AiAssistActionOptions,
  type ClearActionOptions,
  createAiAssistAction,
  createClearAction,
  createInsertVariableAction,
  type FieldActionContext,
  type FieldActionGenerate,
  type FieldActionRegistry,
  type FieldActionsPluginConfig,
  type FieldHeaderAction,
  type FieldMenuAction,
  type InsertVariableActionOptions,
  resolveVariables,
  type ValueModeVariable,
} from './field-actions';
export {
  FIELD_CONTROL_GEOMETRY,
  FieldControl,
  type FieldControlFormField,
  type FieldControlGeometry,
  type FieldControlLabelTarget,
  type FieldControlProps,
} from './field-control';
export { FormFieldRenderer } from './field-renderer';
export { FormDesigner } from './form-designer';
// Plugins
export {
  analyticsPlugin,
  auditPlugin,
  autoSavePlugin,
  formattingPlugin,
  validationPlugin,
  workflowPlugin,
} from './form-plugins';
// Types
export type {
  CustomComponents,
  CustomFieldComponentProps,
  CustomValueType,
  DataSource,
  FieldCondition,
  FieldMetadata,
  FieldOption,
  FieldRule,
  FieldType,
  FormAction,
  FormContext,
  FormPlugin,
  FormSchema,
  FormSection,
  FormStep,
  FormVariables,
  StringListFieldMetadata,
  ValueModeControlRef,
  ValueModeId,
  ValueModesConfig,
} from './form-schema';
// Type guards
export {
  hasMinMaxStep,
  hasOptions,
  isCustomField,
  isFileField,
} from './form-schema';
export { FormStateViewer } from './form-state-viewer';
export {
  type ClearActionStrings,
  DEFAULT_METADATA_FORM_STRINGS,
  type FormValidationStrings,
  type MetadataFormStringOverrides,
  type MetadataFormStrings,
} from './form-strings';
// Core exports
export { MetadataForm, type MetadataFormProps, useWatch } from './metadata-form';
export {
  ModeAwareField,
  type ModeAwareFieldProps,
} from './mode-aware-field';
export { ExpressionBuilder, RuleBuilder, RulesEngine } from './rules-engine';
export { formatTemplate, StringListField, type StringListFieldProps } from './string-list-field';
export {
  type CodecContext,
  type ConvertResult,
  type DecodedValue,
  envelopeCodec,
  type FieldControlRegistration,
  isEmptyModeValue,
  isValueModeEnvelope,
  literalValues,
  VALUE_MODE_OPAQUE,
  type ValueModeCodec,
  type ValueModeControlHandle,
  type ValueModeControlProps,
  type ValueModeControlRegistration,
  type ValueModeDefinition,
  type ValueModeEnvelope,
  type ValueModeRegistry,
  type ValueModesPluginConfig,
} from './value-modes';
