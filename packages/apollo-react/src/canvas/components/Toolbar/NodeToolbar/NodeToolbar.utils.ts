import type { ExtendedToolbarAction, ToolbarSeparator } from '../shared';

export type ProcessedToolbarItem = ExtendedToolbarAction | ToolbarSeparator;

export function isSeparator(item: ProcessedToolbarItem): item is ToolbarSeparator {
  return item.id === 'separator';
}
