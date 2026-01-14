import { z } from 'zod';

/**
 * Unique identifier for nodes, types, and workflows
 */
export const idSchema = z.string().min(1);

/**
 * Semantic versioning string (e.g., "1.0.0")
 */
export const versionSchema = z
  .string()
  .regex(/^\d+\.\d+\.\d+$/, 'Version must be in semver format (e.g., "1.0.0")');

/**
 * Composite key for type lookup: "type:version"
 */
export const typeVersionKeySchema = z
  .string()
  .regex(
    /^.+:\d+\.\d+\.\d+$/,
    'TypeVersionKey must be in format "type:version" (e.g., "myType:1.0.0")'
  );

/**
 * Display configuration for UI rendering
 */
export const displayConfigSchema = z
  .object({
    label: z.string().optional(),
    subLabel: z.string().optional(),
    shape: z.string().optional(),
    background: z.string().optional(),
    iconBackground: z.string().optional(),
    icon: z.string().optional(),
    color: z.string().optional(),
  })
  .catchall(z.unknown()); // Allow additional properties

// Export inferred TypeScript types
export type ID = z.infer<typeof idSchema>;
export type Version = z.infer<typeof versionSchema>;
export type TypeVersionKey = z.infer<typeof typeVersionKeySchema>;
export type DisplayConfig = z.infer<typeof displayConfigSchema>;
