import { describe, expect, it, vi } from 'vitest';
import type { ToolbarAction, ToolbarActionItem } from '../shared';
import type { NodeToolbarConfig } from './NodeToolbar.types';
import { lockToolbarConfig } from './NodeToolbar.utils';

const action = (id: string, extra: Partial<ToolbarActionItem> = {}): ToolbarActionItem => ({
  id,
  icon: 'edit',
  label: id,
  onAction: vi.fn(),
  ...extra,
});

const byId = (actions: ToolbarAction[] | undefined, id: string) =>
  actions?.find((item) => item.id === id) as ToolbarActionItem | undefined;

describe('lockToolbarConfig', () => {
  it('disables every action that does not opt out', () => {
    const config: NodeToolbarConfig = {
      actions: [action('edit'), action('delete')],
      overflowActions: [action('cut')],
    };

    const locked = lockToolbarConfig(config);

    expect(byId(locked.actions, 'edit')?.disabled).toBe(true);
    expect(byId(locked.actions, 'delete')?.disabled).toBe(true);
    expect(byId(locked.overflowActions, 'cut')?.disabled).toBe(true);
  });

  it('leaves an action marked allowWhenLocked enabled, in both the bar and the overflow', () => {
    const config: NodeToolbarConfig = {
      actions: [action('drill-into', { allowWhenLocked: true }), action('delete')],
      overflowActions: [action('copy', { allowWhenLocked: true }), action('cut')],
    };

    const locked = lockToolbarConfig(config);

    expect(byId(locked.actions, 'drill-into')?.disabled).toBeUndefined();
    expect(byId(locked.overflowActions, 'copy')?.disabled).toBeUndefined();
    expect(byId(locked.actions, 'delete')?.disabled).toBe(true);
    expect(byId(locked.overflowActions, 'cut')?.disabled).toBe(true);
  });

  it('keeps an action already disabled by the consumer disabled even when it opts out', () => {
    const config: NodeToolbarConfig = {
      actions: [action('paste', { allowWhenLocked: true, disabled: true })],
    };

    expect(byId(lockToolbarConfig(config).actions, 'paste')?.disabled).toBe(true);
  });

  it('leaves separators untouched', () => {
    const config: NodeToolbarConfig = { actions: [action('edit'), { id: 'separator' }] };

    expect(lockToolbarConfig(config).actions[1]).toEqual({ id: 'separator' });
  });

  it('omits overflowActions when the source config has none', () => {
    const locked = lockToolbarConfig({ actions: [action('edit')] });

    expect(locked).not.toHaveProperty('overflowActions');
  });

  it('does not mutate the config it is given', () => {
    const original = action('delete');
    const config: NodeToolbarConfig = { actions: [original] };

    lockToolbarConfig(config);

    expect(original.disabled).toBeUndefined();
  });
});
