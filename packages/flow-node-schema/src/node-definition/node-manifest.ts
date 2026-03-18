/**
 * Node Manifest Schemas
 *
 * Zod schemas for server-provided node manifests.
 */

import { z } from 'zod';
import { toolbarConfigurationSchema } from '../toolbar';
import { handleGroupManifestSchema } from './handle';

/**
 * Generic form schema type.
 *
 * In apollo-react this is typed as `FormSchema` from `@uipath/apollo-wind`,
 * but we keep the schema package dependency-free beyond zod.
 * Consumers that need the full FormSchema type can cast after parsing.
 */
export type FormSchemaLike = Record<string, unknown>;

/**
 * Node shape for display
 */
export const nodeShapeSchema = z.enum(['circle', 'square', 'rectangle']);

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

  /** Description of what the node does */
  description: z.string().optional(),

  /** Icon identifier (e.g., "timer", "uipath.decision") */
  icon: z.string().min(1),

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
});

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

  /** Form schema for the properties panel */
  form: z.custom<FormSchemaLike>().optional(),

  // Optional metadata
  /** Whether the node is deprecated */
  deprecated: z.boolean().optional(),
});

// Export inferred types
export type NodeShape = z.infer<typeof nodeShapeSchema>;
export type NodeDisplayManifest = z.infer<typeof nodeDisplayManifestSchema>;
export type NodeManifest = z.infer<typeof nodeManifestSchema>;
