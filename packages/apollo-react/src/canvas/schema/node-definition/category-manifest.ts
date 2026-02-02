/**
 * Category Manifest Schemas
 *
 * Zod schemas for category definitions.
 * Supports arbitrary nesting using parent references.
 * Nodes define their own category membership.
 */

import { z } from 'zod';

/**
 * Category manifest from server
 *
 * Categories form a hierarchy using parentId references:
 * - { id: 'control-flow', parentId: null } (root)
 * - { id: 'decision', parentId: 'control-flow' } (child)
 * - { id: 'advanced', parentId: 'decision' } (grandchild)
 *
 * Nodes define which categories they belong to via category property.
 * This allows:
 * - Stable category IDs (reorganization just changes parentId)
 * - Nodes control their own categorization
 */
export const categoryManifestSchema = z.object({
  /**
   * Unique category identifier
   *
   * Should be stable by version.
   * Examples: 'control-flow', 'decision', 'loops', 'advanced'
   */
  id: z.string().min(1),

  /** Human-readable category name */
  name: z.string().min(1),

  /**
   * Parent category ID for nesting
   *
   * - null or undefined: root category
   * - string: ID of parent category
   *
   * Categories can be reorganized by changing this field without
   * affecting node references or constraint definitions.
   */
  parentId: z.string().optional(),

  /**
   * Sort order for display within the same parent level
   * Categories at the same level are sorted by this value
   */
  sortOrder: z.number().int().nonnegative(),

  /** Light mode color/gradient */
  color: z.string().min(1),

  /** Dark mode color/gradient */
  colorDark: z.string().min(1),

  /** Icon identifier */
  icon: z.string().min(1),

  /** Tags for search and filtering */
  tags: z.array(z.string()),
});

// Export inferred type
export type CategoryManifest = z.infer<typeof categoryManifestSchema>;
