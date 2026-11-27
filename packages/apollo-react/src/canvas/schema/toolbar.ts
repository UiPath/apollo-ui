/**
 * Toolbar Configuration Types
 *
 * Defines toolbar actions and mode-specific configurations
 */

import { z } from 'zod';
import { nodeShapeSchema } from './node-definition/shape';

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

  /**
   * Acts on the selection rather than on the node alone: on every selected node when this one is
   * selected, otherwise on this node, which becomes the only selection first. The event's
   * `nodeIds` lists the nodes it acts on.
   */
  appliesToSelection: z.boolean().optional(),

  /** Optional condition for visibility */
  condition: z
    .object({
      /** Required permissions */
      requiresPermissions: z.array(z.string()).optional(),

      /** Hide when execution state exists */
      hideOnExecution: z.boolean().optional(),

      /** Show only for specific node types */
      nodeTypes: z.array(z.string()).optional(),

      /** Show only for manifests drawn in one of these shapes */
      shapes: z.array(nodeShapeSchema).optional(),

      /** Show only where the manifest's `drillable` flag has this value */
      drillable: z.boolean().optional(),

      /** Show only if node has handles defined in its manifest */
      handles: z
        .array(
          z.object({
            handleType: z.enum(['output', 'input', 'artifact']),
            type: z.enum(['source', 'target']).optional(),
          })
        )
        .optional(),
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
export type ToolbarActionSchema = z.infer<typeof toolbarActionSchema>;
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
  /**
   * For an action with `appliesToSelection`: the nodes it acts on, which the canvas has selected.
   * Every selected node when `nodeId` was selected, otherwise `nodeId` alone.
   */
  nodeIds?: string[];
}

/**
 * Callback signature for toolbar action handler
 */
export type ToolbarActionHandler = (event: ToolbarActionEvent) => void;

/**
 * Opens a drillable node into the canvas it stands for. Shown only on manifests with `drillable`.
 * Opt in by listing it in a manifest's `toolbarExtensions`; the handler receives `drill-into`.
 */
export const DRILL_INTO_TOOLBAR_ACTION: ToolbarActionSchema = {
  id: 'drill-into',
  icon: 'arrow-down-to-dot',
  label: 'Drill into',
  condition: { drillable: true },
};

/**
 * Copy, Cut, Paste and Delete, for a manifest's `overflowActions`. Copy, Cut and Delete act on the
 * selection the node is part of; Paste acts on the canvas.
 */
export const CLIPBOARD_TOOLBAR_ACTIONS: readonly ToolbarActionSchema[] = [
  { id: 'copy', icon: 'copy', label: 'Copy', appliesToSelection: true },
  { id: 'cut', icon: 'scissors', label: 'Cut', appliesToSelection: true },
  { id: 'paste', icon: 'clipboard-paste', label: 'Paste' },
  { id: 'delete', icon: 'trash-2', label: 'Delete', appliesToSelection: true },
];
