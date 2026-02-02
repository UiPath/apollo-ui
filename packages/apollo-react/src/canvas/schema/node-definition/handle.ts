/**
 * Handle Configuration Schemas
 *
 * Zod schemas for node handle (input/output port) configurations.
 */

import { z } from 'zod';
import { connectionConstraintSchema } from './constraints';

/**
 * Position enum for handle placement
 * Uses XYFlow Position enum values
 */
export const handlePositionSchema = z.enum(['left', 'top', 'right', 'bottom']);

/**
 * Handle type (source or target)
 */
export const handleTypeSchema = z.enum(['source', 'target']);

/**
 * Handle display type (artifact, input, or output)
 */
export const handleTypeDisplaySchema = z.enum(['artifact', 'input', 'output']);

export const handleConfigurationSpecificPositionSchema = z.object({
  /** The height of the area where the handles will be located in the node. Has no effect if no top or bottom is set. */
  height: z.number().optional(),

  /** The width of the area where the handles will be located in the node. Has no effect if no left or right is set. */
  width: z.number().optional(),

  /** The top offset of where the node handles should be placed */
  top: z.number().optional(),

  /** The bottom offset of where the node handles should be placed */
  bottom: z.number().optional(),

  /** The left offset of where the node handles should be placed */
  left: z.number().optional(),

  /** The right offset of where the node handles should be placed */
  right: z.number().optional(),
});

/**
 * Individual handle configuration
 */
export const handleManifestSchema = z.object({
  /** Unique identifier for this handle */
  id: z.string().min(1),

  /** Type of handle */
  type: handleTypeSchema,

  /** Category of handle */
  handleType: handleTypeDisplaySchema,

  /**
   * Label template (supports expressions)
   * Examples:
   * - Literal: "True"
   * - Dynamic: "{parameters.trueLabel || 'True'}"
   * - Concatenation: "Case {index + 1}: {name}"
   */
  label: z.string().optional(),

  /**
   * Visibility expression (supports expressions)
   * Examples:
   * - Literal: true
   * - Dynamic: "{inputs.hasDefault}"
   * Defaults to true if not specified
   */
  visible: z.union([z.boolean(), z.string()]).optional(),

  /**
   * Repeat expression - generates multiple handles from an array
   * The expression should evaluate to an array in the node data.
   * Each array item generates one handle instance.
   * Examples:
   * - "inputs.cases" - iterates over the cases array
   *
   * Within id/label templates, use:
   * - {index} - current array index (0-based)
   * - {item} - current array item
   * - {item.propertyName} - access item properties
   */
  repeat: z.string().optional(),

  /**
   * Custom variable name for the current item in repeat expressions
   * Defaults to "item" if not specified
   */
  itemVar: z.string().optional(),

  /**
   * Custom variable name for the current index in repeat expressions
   * Defaults to "index" if not specified
   */
  indexVar: z.string().optional(),

  /** Whether to show action button */
  showButton: z.boolean().optional(),

  /** Connection constraints for this handle */
  constraints: connectionConstraintSchema.optional(),

  /** Whether this handle is the default for its type. Helps determine how to connect when node is newly added. */
  isDefaultForType: z.boolean().optional(),
});

/**
 * Group of handles at a specific position
 */
export const handleGroupManifestSchema = z.object({
  /** Position on the node */
  position: handlePositionSchema,

  customPositionAndOffsets: handleConfigurationSpecificPositionSchema.optional(),

  /** Array of handles at this position */
  handles: z.array(handleManifestSchema),

  /** Whether the handle group is visible */
  visible: z.boolean().optional(),
});

/**
 * Instance-level handle group replacement
 * Allows individual nodes to completely replace a handle group
 */
export const handleGroupOverrideSchema = z.object({
  /** Position identifier (matches manifest group) */
  position: handlePositionSchema,

  /** Replacement handles for this position */
  handles: z.array(handleManifestSchema),

  /** Whether the handle group is visible */
  visible: z.boolean().optional(),
});

// Export inferred types
export type HandlePosition = z.infer<typeof handlePositionSchema>;
export type HandleType = z.infer<typeof handleTypeSchema>;
export type HandleCategory = z.infer<typeof handleTypeDisplaySchema>;
export type HandleManifest = z.infer<typeof handleManifestSchema>;
export type HandleGroupManifest = z.infer<typeof handleGroupManifestSchema>;
export type HandleGroupOverride = z.infer<typeof handleGroupOverrideSchema>;
export type HandleConfigurationSpecificPosition = z.infer<
  typeof handleConfigurationSpecificPositionSchema
>;
