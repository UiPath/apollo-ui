import type { ExtendedToolbarAction, ToolbarAction, ToolbarSeparator } from '../shared';
import type { NodeToolbarConfig } from './NodeToolbar.types';

export type ProcessedToolbarItem = ExtendedToolbarAction | ToolbarSeparator;

export function isSeparator(item: ProcessedToolbarItem | ToolbarAction): item is ToolbarSeparator {
  return item.id === 'separator';
}

/**
 * Returns the config with every mutating action disabled, separators and
 * actions marked `allowWhenReadOnly` untouched. Locks a read-only node's
 * toolbar instead of unmounting it: the greyed-out actions (with their tooltips
 * intact) say "read-only", where a missing toolbar just reads as a node with
 * nothing to offer. Disabling is also real enforcement, since a consumer's
 * `onAction` never reaches the canvas-level delete veto.
 *
 * Opting out is per action rather than per node because a single toolbar mixes
 * both kinds: Copy and Drill into are safe on a locked node, Cut and Delete are
 * not. An action that says nothing is disabled, so the safe default survives
 * new actions.
 */
export function lockToolbarConfig(config: NodeToolbarConfig): NodeToolbarConfig {
  return {
    ...config,
    actions: disableActions(config.actions),
    ...(config.overflowActions && { overflowActions: disableActions(config.overflowActions) }),
  };
}

const disableActions = (actions: ToolbarAction[]): ToolbarAction[] =>
  actions.map((action) => {
    if (isSeparator(action) || action.allowWhenReadOnly) return action;
    return { ...action, disabled: true };
  });
