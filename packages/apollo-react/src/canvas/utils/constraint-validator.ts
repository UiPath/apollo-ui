/**
 * Connection Constraint Validator
 *
 * Validates connections between nodes based on semantic composition rules.
 * Focuses on workflow semantics rather than generic data types.
 */

import type { ConnectionConstraint, HandleTarget } from '../schema/node-definition/constraints';

/**
 * Context for connection validation
 */
export interface ConnectionValidationContext {
  sourceNode: {
    type: string;
    category?: string;
    data?: unknown;
  };
  sourceHandle: {
    id: string;
    handleType: string;
    constraints?: ConnectionConstraint;
  };
  targetNode: {
    type: string;
    category?: string;
    data?: unknown;
  };
  targetHandle: {
    id: string;
    handleType: string;
    constraints?: ConnectionConstraint;
  };
}

/**
 * Result of connection validation
 */
export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Check if a node type matches a pattern
 * Supports wildcards: "uipath.control-flow.*" matches "uipath.control-flow.decision"
 */
function matchesTypePattern(nodeType: string, pattern: string): boolean {
  if (pattern === '*') return true;

  // Convert wildcard pattern to regex
  const regexPattern = pattern
    .replace(/\./g, '\\.') // Escape dots
    .replace(/\*/g, '.*'); // Convert * to .*

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(nodeType);
}

/**
 * Check if a target matches a HandleTarget specification
 * Matches both node type and optional handle ID
 */
function matchesHandleTarget(target: HandleTarget, nodeType: string, handleId: string): boolean {
  // Check node type match (supports wildcards)
  const nodeTypeMatches = matchesTypePattern(nodeType, target.nodeType);
  if (!nodeTypeMatches) return false;

  // If handle ID is specified in target, it must match exactly
  if (target.handleId !== undefined && target.handleId !== handleId) {
    return false;
  }

  return true;
}

/**
 * Check if connection is allowed by HandleTarget constraints
 */
function checkHandleTargetConstraint(
  nodeType: string,
  handleId: string,
  allowed?: HandleTarget[],
  forbidden?: HandleTarget[]
): boolean {
  // Check forbidden list first (blacklist)
  if (forbidden) {
    const isForbidden = forbidden.some((target) => matchesHandleTarget(target, nodeType, handleId));
    if (isForbidden) return false;
  }

  // Check allowed list (whitelist)
  if (allowed) {
    const isAllowed = allowed.some((target) => matchesHandleTarget(target, nodeType, handleId));
    return isAllowed;
  }

  // No constraints or passed forbidden check
  return true;
}

/**
 * Check if categories match constraint requirements
 */
export function checkCategoryConstraint(
  category: string | undefined,
  allowed?: string[],
  forbidden?: string[]
): boolean {
  // If no category defined, cannot validate category constraints
  if (!category) {
    // If there are category constraints but no category, reject
    return !allowed && !forbidden;
  }

  // Check forbidden categories (blacklist)
  if (forbidden?.includes(category)) {
    return false;
  }

  // Check allowed categories (whitelist)
  if (allowed && !allowed.includes(category)) {
    return false;
  }

  return true;
}

/**
 * Validate a connection between two nodes
 */
export function validateConnection(context: ConnectionValidationContext): ValidationResult {
  const { sourceNode, sourceHandle, targetNode, targetHandle } = context;

  const sourceConstraints = sourceHandle.constraints;
  const targetConstraints = targetHandle.constraints;

  // Validate handle type compatibility (outputs can only connect to inputs)
  if (
    sourceHandle.handleType === targetHandle.handleType &&
    sourceHandle.handleType !== 'artifact'
  ) {
    return {
      valid: false,
      reason: `Cannot connect ${sourceHandle.handleType} to ${targetHandle.handleType}. Outputs must connect to inputs.`,
    };
  }

  // Check source handle constraints (what it can connect TO)
  if (sourceConstraints) {
    // Check specific target node/handle constraints
    const allowedTarget = checkHandleTargetConstraint(
      targetNode.type,
      targetHandle.id,
      sourceConstraints.allowedTargets,
      sourceConstraints.forbiddenTargets
    );

    if (!allowedTarget) {
      const message = `${sourceNode.type} cannot connect to ${targetNode.type}`;

      return { valid: false, reason: message };
    }

    // Check target category constraints
    const allowedCategory = checkCategoryConstraint(
      targetNode.category,
      sourceConstraints.allowedTargetCategories,
      sourceConstraints.forbiddenTargetCategories
    );

    if (!allowedCategory) {
      return {
        valid: false,
        reason: `Cannot connect to nodes in category: ${targetNode.category}`,
      };
    }

    // Check custom validation expression
    if (sourceConstraints.customValidation) {
      // TODO: Custom validation expression evaluation
    }
  }

  // Check target handle constraints (what can connect TO it)
  if (targetConstraints) {
    // Check specific source node/handle constraints
    const allowedSource = checkHandleTargetConstraint(
      sourceNode.type,
      sourceHandle.id,
      targetConstraints.allowedSources,
      targetConstraints.forbiddenSources
    );

    if (!allowedSource) {
      const message = `${targetNode.type} cannot accept connections from ${sourceNode.type}`;

      return { valid: false, reason: message };
    }

    // Check source category constraints
    const allowedCategory = checkCategoryConstraint(
      sourceNode.category,
      targetConstraints.allowedSourceCategories,
      targetConstraints.forbiddenSourceCategories
    );

    if (!allowedCategory) {
      return {
        valid: false,
        reason: `Cannot accept connections from nodes in category: ${sourceNode.category}`,
      };
    }

    // Check custom validation expression
    if (targetConstraints.customValidation) {
      // TODO: Custom validation expression evaluation
    }
  }

  // All checks passed
  return { valid: true };
}

/**
 * Check if a handle has reached its maximum connections
 */
export function canAcceptMoreConnections(
  handle: { constraints?: ConnectionConstraint },
  currentConnectionCount: number
): boolean {
  if (!handle.constraints?.maxConnections) {
    return true; // Unlimited
  }

  return currentConnectionCount < handle.constraints.maxConnections;
}

/**
 * Check if a handle meets its minimum connection requirement
 */
export function meetsMinimumConnections(
  handle: { constraints?: ConnectionConstraint },
  currentConnectionCount: number
): boolean {
  const minRequired = handle.constraints?.minConnections ?? 0;
  return currentConnectionCount >= minRequired;
}
