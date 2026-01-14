/**
 * Workflow Manifest Schemas
 *
 * Complete manifest containing categories and node definitions.
 */

import { z } from 'zod';
import { categoryManifestSchema } from './category-manifest';
import { nodeManifestSchema } from './node-manifest';

/**
 * Complete workflow manifest from server
 */
export const workflowManifestSchema = z.object({
  /** Manifest version */
  version: z.string().min(1),

  /** Available categories */
  categories: z.array(categoryManifestSchema),

  /** Available node types */
  nodes: z.array(nodeManifestSchema),
});

/**
 * API response wrapper
 */
export const manifestResponseSchema = z.object({
  /** Whether the request was successful */
  success: z.boolean(),

  /** Manifest data (if successful) */
  data: workflowManifestSchema.optional(),

  /** Error message (if failed) */
  error: z.string().optional(),

  /** Timestamp of the response */
  timestamp: z.string().optional(),
});

// Export inferred types
export type WorkflowManifest = z.infer<typeof workflowManifestSchema>;
export type ManifestResponse = z.infer<typeof manifestResponseSchema>;
