/**
 * Apollo-Wind Metadata Forms
 * Enterprise-grade metadata-driven form system
 */

// Core exports
export { MetadataForm } from './metadata-form';
export { FormFieldRenderer } from './field-renderer';
export { FormDesigner } from './form-designer';
export { RulesEngine, RuleBuilder, ExpressionBuilder } from './rules-engine';
export {
  DataFetcher,
  DataSourceBuilder,
  DataTransformers,
  FetchAdapter,
  type DataAdapter,
  type AdapterRequest,
  type AdapterResponse,
} from './data-fetcher';
export { FormStateViewer } from './form-state-viewer';

// Plugins
export {
  analyticsPlugin,
  autoSavePlugin,
  validationPlugin,
  workflowPlugin,
  auditPlugin,
  formattingPlugin,
} from './form-plugins';

// Types
export type {
  FormSchema,
  FormSection,
  FormStep,
  FieldMetadata,
  FieldType,
  FieldCondition,
  FieldRule,
  DataSource,
  FormContext,
  FormPlugin,
  FormAction,
  CustomFieldComponentProps,
  FieldOption,
} from './form-schema';

// Type guards
export {
  hasOptions,
  hasMinMaxStep,
  isFileField,
  isCustomField,
} from './form-schema';
