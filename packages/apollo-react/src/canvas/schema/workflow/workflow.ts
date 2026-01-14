import { z } from 'zod';
import { idSchema, versionSchema } from './base';
import { nodeSchema } from './node';
import { edgeSchema } from './edge';
import { metadataSchema } from './metadata';
import { nodeManifestSchema } from '../node-definition';

/**
 * Binding for output arguments - specifies which node output provides the value
 */
export const argumentBindingSchema = z.object({
  /** Source node ID */
  nodeId: z.string(),
  /** Output ID from the source node */
  outputId: z.string(),
});

export type ArgumentBinding = z.infer<typeof argumentBindingSchema>;

/**
 * Workflow global variable definition (process boundary variables)
 *
 * These are the inputs and outputs of the workflow as a whole:
 * - 'in': Data passed INTO the workflow when invoked (available to all nodes)
 * - 'out': Data passed OUT of the workflow when completed (may be bound to node outputs)
 */
export const workflowVariableSchema = z.object({
  /** Unique identifier used in expressions: ${id} */
  id: z.string().min(1),
  /** Display name */
  name: z.string().min(1),
  /** Direction: 'in' = external provides, 'out' = workflow provides */
  direction: z.enum(['in', 'out']),
  /** Data type (e.g., 'string', 'number', 'object', 'array') */
  type: z.string().default('string'),
  /** Sub-type for complex types (e.g., array item type) */
  subType: z.string().optional(),
  /** JSON schema for complex type validation */
  schema: z.record(z.string(), z.unknown()).optional(),
  /** Default value (for 'in' direction only) */
  defaultValue: z.unknown().optional(),
  /** Human-readable description */
  description: z.string().optional(),
  /** Optional binding to a node output (for 'out' direction) */
  binding: argumentBindingSchema.optional(),
});

export type WorkflowVariable = z.infer<typeof workflowVariableSchema>;

/**
 * Node variable definition
 *
 * These represent node outputs that are available to downstream nodes.
 * Each node variable is bound to a specific node's output.
 */
export const nodeVariableSchema = z.object({
  /** Unique identifier used in expressions: ${id} */
  id: z.string().min(1),
  /** Display name */
  name: z.string().min(1),
  /** Data type (e.g., 'string', 'number', 'object', 'array') */
  type: z.string().default('string'),
  /** Sub-type for complex types (e.g., array item type) */
  subType: z.string().optional(),
  /** JSON schema for complex type validation */
  schema: z.record(z.string(), z.unknown()).optional(),
  /** Human-readable description */
  description: z.string().optional(),
  /** Required binding to node output */
  binding: argumentBindingSchema,
});

export type NodeVariable = z.infer<typeof nodeVariableSchema>;

/**
 * Container for all workflow variables
 */
export const workflowVariablesSchema = z.object({
  /** Global workflow inputs and outputs */
  globals: z.array(workflowVariableSchema).optional(),
  /** Node output variables */
  nodes: z.array(nodeVariableSchema).optional(),
});

export type WorkflowVariables = z.infer<typeof workflowVariablesSchema>;

/**
 * Complete workflow specification
 */
export const workflowSchema = z.object({
  id: idSchema,
  version: versionSchema,

  name: z.string().min(1),
  description: z.string().optional(),

  /** All nodes in the workflow */
  nodes: z.array(nodeSchema),

  /** All connections between nodes */
  edges: z.array(edgeSchema),

  /** cached definitions for quick lookup */
  definitions: z.array(nodeManifestSchema),

  /** bindings for uipath artifacts */
  bindings: z.array(z.any()).optional(),

  /** Workflow-level variables */
  variables: workflowVariablesSchema.optional(),

  metadata: metadataSchema.optional(),
});

// Export inferred TypeScript type
export type Workflow = z.infer<typeof workflowSchema>;
