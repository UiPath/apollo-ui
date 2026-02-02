/**
 * Task Manifest Schemas
 *
 * Zod schemas for task type definitions within stage nodes.
 * Tasks are items that can be added to stages and represent
 * individual work items or automation steps.
 */

import { z } from 'zod';

/**
 * Existing task types used with "uipath.case-management." prefix:
 * - process
 * - agent
 * - external-agent
 * - rpa
 * - action
 * - api-workflow
 * - wait-for-timer
 * - wait-for-connector
 * - run-human-action
 * - execute-connector-activity
 */

/**
 * Display configuration for a task
 */
export const taskDisplayManifestSchema = z.object({
  /** Human-readable display name */
  label: z.string().min(1),

  /** Description of what the task does */
  description: z.string().optional(),

  /** Icon identifier (e.g., "human-action", "robot") */
  icon: z.string().min(1),
});

/**
 * Complete task manifest for registration
 */
export const taskManifestSchema = z.object({
  // Core identification
  /** Unique task type identifier (e.g., "uipath.case-management.run-human-action") */
  taskType: z.string().min(1),

  /** Version of the task definition */
  version: z.string().min(1),

  // Categorization
  /** Category ID this task belongs to (for toolbox grouping) */
  category: z.string().optional(),

  /** Tags for search and filtering */
  tags: z.array(z.string()),

  /** Sort order within category */
  sortOrder: z.number().int().nonnegative(),

  // Visual configuration
  /** Display configuration including label, icon, description */
  display: taskDisplayManifestSchema,

  // Stage constraints
  /**
   * Stage node types where this task can be added.
   * If omitted or empty, task can be added to any stage.
   * Example: ["case-management:Stage"] - only stages, not triggers
   */
  allowedStageTypes: z.array(z.string()).optional(),

  // Default values
  /** Default property values when creating a new task */
  defaultProperties: z.record(z.string(), z.unknown()).optional(),

  // Optional metadata
  /** Whether the task type is deprecated */
  deprecated: z.boolean().optional(),
});

/**
 * Collection of task manifests (for bulk registration)
 */
export const taskManifestCollectionSchema = z.array(taskManifestSchema);

// Export inferred types
export type TaskDisplayManifest = z.infer<typeof taskDisplayManifestSchema>;
export type TaskManifest = z.infer<typeof taskManifestSchema>;
export type TaskManifestCollection = z.infer<typeof taskManifestCollectionSchema>;

/**
 * Validate a task manifest
 */
export function validateTaskManifest(manifest: unknown): TaskManifest {
  return taskManifestSchema.parse(manifest);
}

/**
 * Validate a collection of task manifests
 */
export function validateTaskManifestCollection(manifests: unknown): TaskManifestCollection {
  return taskManifestCollectionSchema.parse(manifests);
}

/**
 * Check if a task type is allowed in a specific stage type
 */
export function isTaskAllowedInStage(
  manifest: TaskManifest,
  stageNodeType: string
): boolean {
  // If no restrictions, task is allowed everywhere
  if (!manifest.allowedStageTypes || manifest.allowedStageTypes.length === 0) {
    return true;
  }
  return manifest.allowedStageTypes.includes(stageNodeType);
}
