/**
 * Node Manifest Schemas
 *
 * Zod schemas for server-provided node manifests.
 */

import type { FormSchema } from '@uipath/apollo-wind';
import { z } from 'zod';
import { toolbarConfigurationSchema } from '../toolbar';
import { handleGroupManifestSchema } from './handle';

/**
 * Node shape for display
 */
export const nodeShapeSchema = z.enum(['circle', 'square', 'rectangle', 'container']);

/**
 * Debug configuration for a node
 */
export const nodeDebugManifestSchema = z.object({
  /** Debug configuration runtime */
  runtime: z.string().min(1),
});

/**
 * Display configuration for a node
 */
export const nodeDisplayManifestSchema = z.object({
  /** Human-readable display name */
  label: z.string().min(1),

  /** Short label rendered on the node when it appears on the canvas. Falls back to `label` when omitted. */
  canvasLabel: z.string().min(1).optional(),

  /** Description of what the node does */
  description: z.string().optional(),

  /** Icon identifier (e.g. "timer", "uipath.decision") or absolute URL. Omit (don't pass `''`) to fall back to an initials badge derived from `label`. */
  icon: z.string().min(1).optional(),

  /** Shape of the node */
  shape: nodeShapeSchema.optional(),

  /** Text/foreground color */
  color: z.string().optional(),

  /** Background gradient/color */
  background: z.string().optional(),

  /** Icon background color */
  iconBackground: z.string().optional(),

  /** Icon background color for dark mode (optional - if not provided, iconBackground will be used for both modes) */
  iconBackgroundDark: z.string().optional(),

  /** Icon color */
  iconColor: z.string().optional(),

  /**
   * Whether to render the node's elevation shadow (rest, hover, and drag states).
   * Defaults to `true`. Set to `false` for flat nodes that should sit visually
   * flush with the canvas (e.g. trigger entry points).
   */
  shadow: z.boolean().optional(),

  /**
   * Container/loop nodes only: whether to render the Sequential / Parallel
   * iteration-mode pill in the header. Defaults to `true`. Set to `false` for
   * container flavors where iteration mode is meaningless (e.g. case stages).
   */
  showModePill: z.boolean().optional(),
});

/**
 * Runtime constraints for the node.
 *
 * - `{ include: [...] }` — available exclusively in the listed runtimes
 * - `{ exclude: [...] }` — available in all runtimes except the listed ones
 */
export const nodeRuntimeConstraintsManifestSchema = z.union([
  z.object({ include: z.array(z.string()) }),
  z.object({ exclude: z.array(z.string()) }),
]);

/**
 * Complete node manifest from server
 */
export const nodeManifestSchema = z.object({
  // Core identification
  /** Unique node type identifier (e.g., "uipath.control-flow.decision") */
  nodeType: z.string().min(1),

  /** Version of the node definition */
  version: z.string().min(1),

  /** Human-readable description (optional) */
  description: z.string().optional(),

  // Categorization
  /** Category ID this node belongs to (optional - nodes can exist at root level) */
  category: z.string().min(1).optional(),

  /** Tags for search and filtering */
  tags: z.array(z.string()),

  /** Sort order within category */
  sortOrder: z.number().int().nonnegative(),

  // Visual configuration (required)
  /** Display configuration including label, icon, colors, etc. */
  display: nodeDisplayManifestSchema,

  // Node structure
  /** Handle configurations (simple array of groups) */
  handleConfiguration: z.array(handleGroupManifestSchema),

  /** Toolbar extensions per mode (adds to global defaults) */
  toolbarExtensions: toolbarConfigurationSchema.optional(),

  /**
   * Default toolbar action IDs to suppress per mode (removes from global defaults).
   * Keyed by mode; each value is the list of `id`s to hide.
   * Example: `{ design: ['breakpoint'], debug: ['breakpoint'] }` hides the breakpoint
   * button on this node in both modes.
   */
  suppressDefaultToolbarActions: z.record(z.string(), z.array(z.string())).optional(),

  /** Input defaults for the node */
  inputDefaults: z.record(z.string(), z.unknown()).optional(),

  /** Input definition for the node, record of string to any */
  inputDefinition: z.record(z.string(), z.any()).optional(),

  /** Output definition for the node, record of string to any */
  outputDefinition: z.record(z.string(), z.any()).optional(),

  /** Whether this node type supports drill-in (has a child canvas) */
  drillable: z.boolean().optional(),

  /** Debug configuration for the node */
  debug: nodeDebugManifestSchema.optional(),

  /** Model definition for the node, open for consumers to implement */
  model: z.any().optional(),

  /** Default property values when creating a new node */
  defaultProperties: z.record(z.string(), z.unknown()).optional(),

  /** Form schema for the properties panel (uses MetadataForm from @uipath/apollo-wind) */
  form: z.custom<FormSchema>().optional(),

  // Optional metadata
  /** Whether the node is deprecated */
  deprecated: z.boolean().optional(),

  /**
   * Runtime constraints for the node. If omitted, the node is available in all runtimes.
   */
  runtimeConstraints: nodeRuntimeConstraintsManifestSchema.optional(),
});

// Export inferred types
export type NodeShape = z.infer<typeof nodeShapeSchema>;
export type NodeDisplayManifest = z.infer<typeof nodeDisplayManifestSchema>;
export type NodeManifest = z.infer<typeof nodeManifestSchema>;
export type RuntimeConstraints = z.infer<typeof nodeRuntimeConstraintsManifestSchema>;
