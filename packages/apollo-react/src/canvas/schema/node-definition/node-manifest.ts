/**
 * Node Manifest Schemas
 *
 * Zod schemas for server-provided node manifests.
 */

import type { FormSchema } from '@uipath/apollo-wind';
import { z } from 'zod';
import { toolbarConfigurationSchema } from '../toolbar';
import { handleGroupManifestSchema } from './handle';
import {
  nodeHeightSchema,
  nodeIconSizeSchema,
  nodeLabelLinesSchema,
  nodeShadowTypeSchema,
  nodeShapeSchema,
} from './shape';

/**
 * Debug configuration for a node
 */
export const nodeDebugManifestSchema = z.object({
  /** Debug configuration runtime */
  runtime: z.string().min(1),
});

/**
 * Container presentation for `shape: 'container'` nodes. Every field is optional;
 * props passed to `ContainerNode` win over these, and these win over the preset
 * defaults (for example the loop look used when `container` is omitted).
 */
export const nodeContainerDisplayManifestSchema = z.object({
  /** Container kind, set as `data-container-kind` on the root. `'loop'` keeps the loop preset. */
  kind: z.string().min(1).optional(),

  /** Badge next to the title. `false` hides it; a string renders a neutral pill. */
  badge: z.union([z.literal(false), z.string().min(1)]).optional(),

  /** Second line under the title. */
  subtitle: z.string().min(1).optional(),

  /** Tooltip and accessible name of the add-first-step button. */
  emptyStateLabel: z.string().min(1).optional(),

  /** Outer frame border style. `dashed` is the BPMN event sub-process look. */
  borderStyle: z.enum(['solid', 'dashed']).optional(),

  /** Outer frame accent color, drawn from the semantic status tokens. */
  accent: z.enum(['default', 'info', 'warning', 'error', 'success']).optional(),

  /** Outer frame corner radius. */
  radius: z.enum(['default', 'lg', 'xl']).optional(),

  /** Inner body frame style. */
  bodyFrame: z.enum(['dashed', 'solid', 'none']).optional(),

  /** Lets users rename the title and subtitle inline, like BaseNode. Defaults to `false`. */
  labelEditable: z.boolean().optional(),
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
   * Which elevation a node with a shadow uses at rest and on hover: `'default'`, or `'dense'` for
   * graphs with many nodes. `'dense'` is much lighter than the default in light themes, and wider
   * and a little stronger in dark ones so it stays visible. Dragging keeps the lifted shadow.
   * Ignored when `shadow` is `false`.
   */
  shadowType: nodeShadowTypeSchema.optional(),

  /**
   * Node height in px, replacing the 96px default: 64 to 160 in 32px steps, which keep a single
   * side handle on the centre line. A footer's fixed height replaces it, side handles can still
   * make the node taller, and only wide shapes (rectangle, pill, clipped, document) use it.
   */
  height: nodeHeightSchema.optional(),

  /**
   * Icon tile size. `'default'` (the default) fills 80/96 of the node with an icon half the tile;
   * `'compact'` makes the tile about two-thirds of the node and the icon 60% of the tile, which
   * leaves more room around the tile on short nodes (44px tile, 26px icon on a 64px node).
   */
  iconSize: nodeIconSizeSchema.optional(),

  /**
   * Lines a wide node's name may take before it's cut off with "…" (default 1). The full name
   * shows in a tooltip when it's cut off. With two or more, the description takes one line
   * instead of two. Pick a `display.height` that fits the lines: each is 18px, so a 64px node
   * fits three in all (two for the name, one for the description). Other shapes always wrap
   * their name below the node.
   */
  labelLines: nodeLabelLinesSchema.optional(),

  /**
   * Keeps a wide node's description to one line before it's cut off with "…" (default false).
   * Otherwise it takes two lines, or one when the name takes two or more (`labelLines`). Set it
   * to keep a 64px node to two lines of text: a one-line name over a one-line description.
   * To also let a name with no description wrap onto the second line, set `labelLines` per node:
   * 2 on a node without a description, 1 on a node with one.
   */
  singleLineSubLabel: z.boolean().optional(),

  /** Container presentation. Only read when `shape` is `'container'`. */
  container: nodeContainerDisplayManifestSchema.optional(),
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
export type NodeContainerDisplayManifest = z.infer<typeof nodeContainerDisplayManifestSchema>;
export type NodeDisplayManifest = z.infer<typeof nodeDisplayManifestSchema>;
export type NodeManifest = z.infer<typeof nodeManifestSchema>;
export type RuntimeConstraints = z.infer<typeof nodeRuntimeConstraintsManifestSchema>;
