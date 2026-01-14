/**
 * Category Manifest Schemas
 *
 * Zod schemas for category definitions.
 */

import { z } from 'zod';

/**
 * Category manifest from server
 */
export const categoryManifestSchema = z.object({
  /** Unique category identifier */
  id: z.string().min(1),

  /** Human-readable category name */
  name: z.string().min(1),

  /** Sort order for display */
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
