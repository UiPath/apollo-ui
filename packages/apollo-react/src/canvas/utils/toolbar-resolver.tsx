/**
 * Toolbar Resolver
 *
 * Generic utilities for resolving toolbar configurations from mode defaults and manifest extensions
 */

import type {
  HandleGroupManifest,
  HandleManifest,
  NodeManifest,
  NodeStatusContext,
  NodeToolbarConfig,
} from '@uipath/apollo-react/canvas';
import { getToolbarActionStore } from '../hooks/ToolbarActionContext';
import type { ModeToolbarConfig, ToolbarActionSchema } from '../schema/toolbar';
import { getIcon } from './icon-registry';

interface ExtendedNodeContext extends NodeStatusContext {
  /** Optional permission set for the current user */
  permissions?: string[];
}

const DEFAULT_ACTIONS_FOR_ALL_MODES: ModeToolbarConfig['actions'] = [
  {
    id: 'collapse',
    icon: 'chevrons-down-up',
    label: 'Toggle collapse',
    condition: { handles: [{ handleType: 'artifact', type: 'source' }] },
  },
];

// Default toolbar actions for each mode (applies to all nodes)
const DEFAULT_MODE_TOOLBARS: Record<string, ModeToolbarConfig> = {
  design: {
    actions: [
      { id: 'delete', icon: 'trash', label: 'Delete' },
      { id: 'duplicate', icon: 'copy', label: 'Duplicate' },
      { id: 'breakpoint', icon: 'circle', label: 'Toggle breakpoint' },
      ...DEFAULT_ACTIONS_FOR_ALL_MODES,
    ],
  },
  debug: {
    actions: [
      { id: 'breakpoint', icon: 'circle', label: 'Toggle breakpoint' },
      ...DEFAULT_ACTIONS_FOR_ALL_MODES,
    ],
  },
  evaluation: {
    actions: [...DEFAULT_ACTIONS_FOR_ALL_MODES],
  },
};

// Stub toolbar registry - consumers can inject their own
const toolbarRegistry = {
  getModeDefaults: (mode: string): ModeToolbarConfig => {
    return DEFAULT_MODE_TOOLBARS[mode] ?? { actions: [] };
  },
};

/**
 * Evaluate if an action should be visible based on its condition
 */
function evaluateCondition(
  manifest: NodeManifest,
  action: ToolbarActionSchema,
  nodeType: string,
  context: ExtendedNodeContext
): boolean {
  if (!action.condition) return true;

  const { condition } = action;

  // Check permissions
  if (condition.requiresPermissions && context.permissions) {
    const hasPermissions = condition.requiresPermissions.every((perm) =>
      context.permissions!.includes(perm)
    );
    if (!hasPermissions) return false;
  }

  // Check execution state
  if (condition.hideOnExecution && context.executionState) {
    return false;
  }

  // Check node type
  if (condition.nodeTypes && !condition.nodeTypes.includes(nodeType)) {
    return false;
  }

  // Check if node has matching handles
  if (condition.handles?.length) {
    const manifestHandles = manifest.handleConfiguration.flatMap(
      (group: HandleGroupManifest) => group.handles
    );
    const hasMatchingHandle = condition.handles.some((requiredHandle) =>
      manifestHandles.some(
        (manifestHandle: HandleManifest) =>
          manifestHandle.handleType === requiredHandle.handleType &&
          (requiredHandle.type === undefined || manifestHandle.type === requiredHandle.type)
      )
    );
    if (!hasMatchingHandle) return false;
  }

  return true;
}

/**
 * Convert ToolbarAction to canvas toolbar action with React elements
 */
function convertToNodeAction(
  action: ToolbarActionSchema,
  mode: string,
  nodeData?: Record<string, unknown>
) {
  const IconComponent = getIcon(action.icon);

  return {
    id: action.id,
    icon: <IconComponent w={14} h={14} />,
    label: action.label,
    onAction: (nodeId: string) => {
      // Read handler from store at click time, not render time
      // This ensures we always get the latest handler even if store was empty during render
      // Note: mode is captured at render time to stay consistent with which actions were rendered
      const { onToolbarAction } = getToolbarActionStore();
      onToolbarAction?.({
        actionId: action.id,
        nodeId,
        mode,
        nodeData,
      });
    },
  };
}

/**
 * Merge toolbar configurations
 */
function mergeToolbarConfigs(
  base: ModeToolbarConfig | undefined,
  extension: ModeToolbarConfig | undefined
): ModeToolbarConfig {
  if (!base && !extension) return { actions: [] };
  if (!base) return extension!;
  if (!extension) return base;

  return {
    actions: [...base.actions, ...extension.actions],
    overflowActions: [...(base.overflowActions ?? []), ...(extension.overflowActions ?? [])],
  };
}

/**
 * Resolve final toolbar configuration
 * Combines: Mode defaults → Node type extensions → Conditional filtering
 */
export function resolveToolbar(
  manifest: NodeManifest,
  context: ExtendedNodeContext,
  nodeData?: Record<string, unknown>
): NodeToolbarConfig | undefined {
  const { nodeType, toolbarExtensions: manifestToolbarExtensions } = manifest;

  // Get mode from module-level store for filtering/defaults
  // (UIX doesn't pass custom properties through its context)
  const { mode } = getToolbarActionStore();

  // Step 1: Get mode defaults (applies to all nodes)
  const modeDefaults = toolbarRegistry.getModeDefaults(mode);

  // Step 2: Get node-type-specific extensions
  const nodeExtensions = manifestToolbarExtensions?.[mode];

  // Step 3: Merge configurations
  const merged = mergeToolbarConfigs(modeDefaults, nodeExtensions);

  // Step 4: Filter actions based on conditions and convert to node actions
  const filteredActions = merged.actions
    .filter((action) => evaluateCondition(manifest, action, nodeType, context))
    .map((action) => convertToNodeAction(action, mode, nodeData));

  const filteredOverflow = (merged.overflowActions ?? [])
    .filter((action) => evaluateCondition(manifest, action, nodeType, context))
    .map((action) => convertToNodeAction(action, mode, nodeData));

  // Return undefined if no actions
  if (filteredActions.length === 0 && filteredOverflow.length === 0) {
    return undefined;
  }

  return {
    actions: filteredActions,
    overflowLabel: 'More options', // TODO: Localize
    overflowActions: filteredOverflow.length > 0 ? filteredOverflow : undefined,
  };
}
