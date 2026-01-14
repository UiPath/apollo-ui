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
export const nodeShapeSchema = z.enum(['circle', 'square', 'rectangle']);

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
  /** Category ID this node belongs to */
  category: z.string().min(1),

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

  /** Input definition for the node, record of string to any */
  inputDefinition: z.record(z.string(), z.any()).optional(),

  /** Output definition for the node, record of string to any */
  outputDefinition: z.record(z.string(), z.any()).optional(),

  /** Model definition for the node, open for consumers to implement */
  model: z.any().optional(),

  /** Default property values when creating a new node */
  defaultProperties: z.record(z.string(), z.unknown()).optional(),

  /** Form schema for the properties panel (uses MetadataForm from @uipath/apollo-wind) */
  form: z.custom<FormSchema>().optional(),

  // Optional metadata
  /** Whether the node is deprecated */
  deprecated: z.boolean().optional(),
});

// Export inferred types
export type NodeShape = z.infer<typeof nodeShapeSchema>;
export type NodeDisplayManifest = z.infer<typeof nodeDisplayManifestSchema>;
export type NodeManifest = z.infer<typeof nodeManifestSchema>;
