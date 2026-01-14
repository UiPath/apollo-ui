/**
 * Toolbar Configuration Types
 *
 * Defines toolbar actions and mode-specific configurations
 */

import { z } from 'zod';

/**
 * Toolbar action definition
 */
export const toolbarActionSchema = z.object({
  /** Unique action identifier */
  id: z.string(),

  /** Lucide icon name */
  icon: z.string(),

  /** Display label */
  label: z.string(),

  /** Optional keyboard shortcut hint */
  shortcut: z.string().optional(),

  /** Optional condition for visibility */
  condition: z
    .object({
      /** Required permissions */
      requiresPermissions: z.array(z.string()).optional(),

      /** Hide when execution state exists */
      hideOnExecution: z.boolean().optional(),

      /** Show only for specific node types */
      nodeTypes: z.array(z.string()).optional(),
    })
    .optional(),
});

/**
 * Mode-specific toolbar configuration
 */
export const modeToolbarConfigSchema = z.object({
  /** Primary visible actions */
  actions: z.array(toolbarActionSchema),

  /** Overflow menu actions */
  overflowActions: z.array(toolbarActionSchema).optional(),
});

/**
 * Default toolbar configuration modes
 */
export const toolbarConfigurationSchema = z.record(z.string(), modeToolbarConfigSchema);

// Export inferred types
export type ToolbarAction = z.infer<typeof toolbarActionSchema>;
export type ModeToolbarConfig = z.infer<typeof modeToolbarConfigSchema>;
export type ToolbarConfiguration = z.infer<typeof toolbarConfigurationSchema>;

/**
 * Toolbar action event payload
 */
export interface ToolbarActionEvent {
  /** The action identifier (e.g., 'delete', 'duplicate', 'breakpoint') */
  actionId: string;
  /** The node ID the action was triggered on */
  nodeId: string;
  /** Current canvas mode when action was triggered */
  mode: string;
  /** Optional node data for context */
  nodeData?: Record<string, unknown>;
}

/**
 * Callback signature for toolbar action handler
 */
export type ToolbarActionHandler = (event: ToolbarActionEvent) => void;
