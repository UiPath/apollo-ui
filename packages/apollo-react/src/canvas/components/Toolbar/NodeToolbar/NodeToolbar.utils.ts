import type { ExtendedToolbarAction, ToolbarAction, ToolbarSeparator } from '../shared';
import type { NodeToolbarConfig } from './NodeToolbar.types';

export type ProcessedToolbarItem = ExtendedToolbarAction | ToolbarSeparator;

export function isSeparator(item: ProcessedToolbarItem): item is ToolbarSeparator {
  return item.id === 'separator';
}

/**
 * Returns the config with every action disabled, separators untouched. Locks a
 * read-only node's toolbar instead of unmounting it: the greyed-out actions
 * (with their tooltips intact) say "read-only", where a missing toolbar just
 * reads as a node with nothing to offer. Disabling is also real enforcement,
 * since a consumer's `onAction` never reaches the canvas-level delete veto.
 */
export function lockToolbarConfig(config: NodeToolbarConfig): NodeToolbarConfig {
  return {
    ...config,
    actions: disableActions(config.actions),
    ...(config.overflowActions && { overflowActions: disableActions(config.overflowActions) }),
  };
}

const disableActions = (actions: ToolbarAction[]): ToolbarAction[] =>
  actions.map((action) => (action.id === 'separator' ? action : { ...action, disabled: true }));
