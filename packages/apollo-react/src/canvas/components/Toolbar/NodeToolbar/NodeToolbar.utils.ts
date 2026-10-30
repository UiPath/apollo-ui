import type { ExtendedToolbarAction, ToolbarAction, ToolbarSeparator } from '../shared';
import type { NodeToolbarConfig } from './NodeToolbar.types';

export type ProcessedToolbarItem = ExtendedToolbarAction | ToolbarSeparator;

export function isSeparator(item: ToolbarAction): item is ToolbarSeparator {
  return item.id === 'separator';
}

/**
 * Returns the config with every mutating action disabled, separators and
 * actions marked `allowWhenLocked` untouched. Locks a read-only node's
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
    if (isSeparator(action) || action.allowWhenLocked) return action;
    return { ...action, disabled: true };
  });

/**
 * Returns the config without the actions whose ids are listed, from both the bar
 * and the overflow menu, or `undefined` when no action is left to show. Returns
 * the same config when nothing is listed, so memoized consumers stay stable.
 */
export function hideToolbarActions(
  config: NodeToolbarConfig | undefined,
  hiddenIds: readonly string[] | undefined
): NodeToolbarConfig | undefined {
  if (!config || !hiddenIds?.length) return config;

  const hidden = new Set(hiddenIds);
  const actions = withoutHidden(config.actions, hidden);
  const overflowActions = config.overflowActions && withoutHidden(config.overflowActions, hidden);
  if (!actions.length && !overflowActions?.length) return undefined;

  return {
    ...config,
    actions,
    overflowActions: overflowActions?.length ? overflowActions : undefined,
  };
}

// Also drops separators left at either end or next to another separator, so a list
// of separators alone comes out empty.
function withoutHidden(items: ToolbarAction[], hidden: ReadonlySet<string>): ToolbarAction[] {
  const kept: ToolbarAction[] = [];
  const atGroupStart = () => {
    const last = kept.at(-1);
    return !last || isSeparator(last);
  };
  for (const item of items) {
    if (isSeparator(item) ? !atGroupStart() : !hidden.has(item.id)) kept.push(item);
  }
  if (kept.length && atGroupStart()) kept.pop();
  return kept;
}
