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
export const handleBoundarySchema = z.enum(['outer', 'inner']);

/**
 * Handle type (source or target)
 */
export const handleTypeSchema = z.enum(['source', 'target']);

/**
 * Handle display type (artifact, input, or output)
 */
export const handleTypeDisplaySchema = z.enum(['artifact', 'input', 'output']);

/**
 * When a handle's label is shown.
 * - `always` (default): label is always visible.
 * - `hover`: label is shown only while the node is hovered or selected; it
 *   fades in/out and does not shift position when the add button appears.
 */
export const handleLabelVisibilitySchema = z.enum(['always', 'hover']);

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

  /** When this handle's label is shown. Defaults to `always`. */
  labelVisibility: handleLabelVisibilitySchema.optional(),

  /** Connection constraints for this handle */
  constraints: connectionConstraintSchema.optional(),

  /** Whether this handle is the default for its type. Helps determine how to connect when node is newly added. */
  isDefaultForType: z.boolean().optional(),

  /**
   * Container nodes only: walls this handle's label pill may be dragged along
   * (grid-snapped, kept clear of corners). Omit to keep the handle fixed.
   * The drag writes per-node offsets into `data.handleOffsets`.
   */
  draggableWalls: z.array(handlePositionSchema).optional(),

  /**
   * Container nodes only: id of a sibling handle (typically the outer
   * counterpart of an inner lifecycle handle) that follows this handle's
   * dragged wall + offset so the pair stays glued together.
   */
  dragMirrors: z.string().optional(),
});

/**
 * Group of handles at a specific position
 */
export const handleGroupManifestSchema = z.object({
  /** Position on the node */
  position: handlePositionSchema,

  /**
   * Optional boundary for container-style nodes.
   * `outer` renders on the node shell; `inner` renders on an inner frame/wall.
   * Defaults to `outer` when omitted.
   */
  boundary: handleBoundarySchema.optional(),

  /**
   * When true, the group's handles (and their labels) render at all times
   * instead of only on hover / selection / while connecting. Used by
   * container-style nodes for permanently visible lifecycle handles (e.g. the
   * case stage's inner Enter / Complete / Exit). Connected handles are always
   * visible regardless of this flag.
   */
  alwaysVisible: z.boolean().optional(),

  /**
   * Lay the group out as if it had this many handle slots (must be >= the
   * actual handle count; ignored otherwise). Handles fill slots from the
   * first. Lets a group with fewer handles align with a sibling group on the
   * opposite wall: e.g. the case stage's single Enter handle uses slotCount 2
   * so it sits level with Complete, the first of the right wall's pair.
   */
  slotCount: z.number().int().positive().optional(),

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
export type HandleBoundary = z.infer<typeof handleBoundarySchema>;
export type HandleType = z.infer<typeof handleTypeSchema>;
export type HandleCategory = z.infer<typeof handleTypeDisplaySchema>;
export type HandleLabelVisibility = z.infer<typeof handleLabelVisibilitySchema>;
export type HandleManifest = z.infer<typeof handleManifestSchema>;
export type HandleGroupManifest = z.infer<typeof handleGroupManifestSchema>;
export type HandleGroupOverride = z.infer<typeof handleGroupOverrideSchema>;
export type HandleConfigurationSpecificPosition = z.infer<
  typeof handleConfigurationSpecificPositionSchema
>;
