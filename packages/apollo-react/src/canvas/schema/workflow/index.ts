/**
 * Zod schemas for workflow validation
 *
 * Usage:
 * // Validate data
 * const result = workflowSchema.safeParse(data);
 * if (result.success) {
 *   const workflow: Workflow = result.data;
 * }
 * ```
 */

// Re-export types
export type { DisplayConfig, ID, TypeVersionKey, Version } from './base';
// Re-export schemas
export { displayConfigSchema, idSchema, typeVersionKeySchema, versionSchema } from './base';
export type { WorkflowEdge } from './edge';
export { edgeSchema } from './edge';
export type { Metadata } from './metadata';
export { metadataSchema } from './metadata';
export type { UIConfig, WorkflowNode } from './node';
export { nodeSchema, uiSchema } from './node';
export type {
  ArgumentBinding,
  NodeVariable,
  Workflow,
  WorkflowVariable,
  WorkflowVariables,
} from './workflow';
export {
  argumentBindingSchema,
  nodeVariableSchema,
  workflowSchema,
  workflowVariableSchema,
  workflowVariablesSchema,
} from './workflow';
