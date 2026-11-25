import { z } from 'zod';
import {
  nodeHeightSchema,
  nodeIconSizeSchema,
  nodeLabelLinesSchema,
  nodeShadowTypeSchema,
  nodeShapeSchema,
} from '../node-definition/shape';

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
    /**
     * Canvas-side label override. Independent of `label`, which serves the panel /
     * properties view. When set, takes precedence over `manifest.canvasLabel`,
     * `instance.label`, and `manifest.label` for the canvas chip.
     */
    canvasLabel: z.string().optional(),
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
    shadow: z.boolean().optional(),
    /** Per-node override of the manifest's `display.shadowType`. */
    shadowType: nodeShadowTypeSchema.optional(),
    /** Per-node override of the manifest's `display.height`. */
    height: nodeHeightSchema.optional(),
    /** Per-node override of the manifest's `display.iconSize`. */
    iconSize: nodeIconSizeSchema.optional(),
    /** Per-node override of the manifest's `display.labelLines`. */
    labelLines: nodeLabelLinesSchema.optional(),
    /** Per-node override of the manifest's `display.singleLineSubLabel`. */
    singleLineSubLabel: z.boolean().optional(),
  })
  .catchall(z.unknown()); // Allow additional properties

// Export inferred TypeScript types
export type InstanceId = z.infer<typeof idSchema>;
export type InstanceVersion = z.infer<typeof versionSchema>;
export type InstanceTypeVersionKey = z.infer<typeof typeVersionKeySchema>;
export type InstanceDisplayConfig = z.infer<typeof displayConfigSchema>;
