/**
 * Connection Constraints
 *
 * Defines semantic rules for valid connections between nodes and handles.
 * Focus on workflow composition semantics, not just data types.
 */

import { z } from 'zod';

/**
 * Specific node and handle targeting
 * Used for precise semantic constraints like "Agent Model can only connect to Agent node's 'model' handle"
 */
export const handleTargetSchema = z.object({
  /**
   * Specific node type this can connect to
   * Example: "uipath.agent" (exact match, no wildcards)
   */
  nodeType: z.string(),

  /**
   * Specific handle ID on the target node
   * Example: "model", "input", "configuration"
   */
  handleId: z.string().optional(),
});

/**
 * Connection constraint configuration for a handle
 */
export const connectionConstraintSchema = z.object({
  /**
   * Maximum number of connections allowed
   * - 1: Single connection only
   * - undefined: Unlimited connections
   */
  maxConnections: z.number().int().positive().optional(),

  /**
   * Minimum number of connections required (for validation)
   * Example: Trigger output must connect to at least 1 node
   */
  minConnections: z.number().int().nonnegative().optional(),

  /**
   * WHITELIST: Allowed target nodes/handles (for source handles)
   * If specified, this handle can ONLY connect to these specific targets
   *
   * Example: Agent Model output can only connect to Agent node's "model" handle
   * ```
   * allowedTargets: [
   *   { nodeType: "uipath.agent", handleId: "model" }
   * ]
   * ```
   */
  allowedTargets: z.array(handleTargetSchema).optional(),

  /**
   * BLACKLIST: Forbidden target nodes/handles (for source handles)
   * If specified, this handle CANNOT connect to these targets
   *
   * Example: Control flow cannot connect to triggers
   * ```
   * forbiddenTargets: [
   *   { nodeType: "uipath.trigger.*" }
   * ]
   * ```
   */
  forbiddenTargets: z.array(handleTargetSchema).optional(),

  /**
   * WHITELIST: Allowed source nodes/handles (for target handles)
   * If specified, this handle can ONLY accept connections from these sources
   *
   * Example: Agent's "model" handle can only accept Agent Model nodes
   * ```
   * allowedSources: [
   *   { nodeType: "uipath.ai.agent-model" }
   * ]
   * ```
   */
  allowedSources: z.array(handleTargetSchema).optional(),

  /**
   * BLACKLIST: Forbidden source nodes/handles (for target handles)
   * If specified, this handle CANNOT accept connections from these sources
   */
  forbiddenSources: z.array(handleTargetSchema).optional(),

  /**
   * Required target categories
   * If specified, can only connect to nodes in these categories
   * Example: ["agent", "data-and-tools"]
   */
  allowedTargetCategories: z.array(z.string()).optional(),

  /**
   * Forbidden target categories
   * If specified, cannot connect to nodes in these categories
   * Example: ["control-flow", "trigger"]
   */
  forbiddenTargetCategories: z.array(z.string()).optional(),

  /**
   * Required source categories (for target handles)
   */
  allowedSourceCategories: z.array(z.string()).optional(),

  /**
   * Forbidden source categories (for target handles)
   */
  forbiddenSourceCategories: z.array(z.string()).optional(),

  /**
   * Custom validation expression
   * Template expression that must evaluate to true for connection to be valid
   * Context: sourceNode, targetNode, sourceHandle, targetHandle
   * Example: "{sourceNode.model.agentType === targetNode.model.agentType}"
   */
  customValidation: z.string().optional(),

  /**
   * Error message to show when connection is invalid
   * Supports template expressions
   * Example: "Agent Model can only connect to Agent node's model handle"
   */
  validationMessage: z.string().optional(),
});

// Export inferred types
export type HandleTarget = z.infer<typeof handleTargetSchema>;
export type ConnectionConstraint = z.infer<typeof connectionConstraintSchema>;
