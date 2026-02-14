import { z } from 'zod';
import { handleGroupOverrideSchema } from '../node-definition/handle';
import { displayConfigSchema, idSchema, versionSchema } from './base';

/**
 * UI configuration for node rendering (where/how big on canvas)
 */
export const uiSchema = z
  .object({
    /** Canvas position */
    position: z.object({
      x: z.number(),
      y: z.number(),
    }),
    size: z
      .object({
        width: z.number(),
        height: z.number(),
      })
      .optional(),
    collapsed: z.boolean().optional(),
  })
  .catchall(z.unknown()); // Allow additional UI properties

/**
 * A node instance in a workflow
 */
export const nodeSchema = z.object({
  id: idSchema,
  type: z.string().min(1),
  typeVersion: versionSchema,

  /** UI configuration (position, size, collapsed, etc.) */
  ui: uiSchema,

  /** Display overrides for the node instance */
  display: displayConfigSchema,

  /** Input port values/connections */
  inputs: z.record(z.string(), z.unknown()).optional(),

  /**
   * Output port values/connections
   * @deprecated Outputs are now tracked at workflow level as variables with direction='out'
   * This field is kept for backward compatibility but should not be written to
   */
  outputs: z.record(z.string(), z.unknown()).optional(),

  /** Handle customizations for this instance */
  handleCustomization: z
    .object({
      groups: z.array(handleGroupOverrideSchema),
    })
    .optional(),

  /** Model data */
  model: z.unknown().optional(),
});

// Export inferred TypeScript types
export type InstanceUiConfig = z.infer<typeof uiSchema>;

export type NodeInstance = z.infer<typeof nodeSchema>;
