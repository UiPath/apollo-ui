import { z } from 'zod';
import { nodeShapeSchema } from '../node-definition/node-manifest';

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
    subLabel: z.any().optional(), // Can be string or React.ReactNode
    shape: nodeShapeSchema.optional(),
    background: z.string().optional(),
    iconBackground: z.string().optional(),
    iconBackgroundDark: z.string().optional(),
    iconColor: z.string().optional(),
    icon: z.string().optional(),
    iconElement: z.any().optional(), // React.ReactNode for custom icons
    color: z.string().optional(),
    labelTooltip: z.string().optional(),
    labelBackgroundColor: z.string().optional(),
    centerAdornmentComponent: z.any().optional(), // React.ReactNode
    footerComponent: z.any().optional(), // React.ReactNode
    footerVariant: z.string().optional(), // FooterVariant enum
  })
  .catchall(z.unknown()); // Allow additional properties

// Export inferred TypeScript types
export type ID = z.infer<typeof idSchema>;
export type Version = z.infer<typeof versionSchema>;
export type TypeVersionKey = z.infer<typeof typeVersionKeySchema>;
export type DisplayConfig = z.infer<typeof displayConfigSchema>;
