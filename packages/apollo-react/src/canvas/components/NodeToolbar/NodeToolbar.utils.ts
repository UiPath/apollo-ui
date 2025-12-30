import type { ToolbarSeparator } from './NodeToolbar.types';
import type { ExtendedToolbarAction } from './ToolbarButton';

export type ProcessedToolbarItem = ExtendedToolbarAction | ToolbarSeparator;

export function isSeparator(item: ProcessedToolbarItem): item is ToolbarSeparator {
  return item.id === 'separator';
}
