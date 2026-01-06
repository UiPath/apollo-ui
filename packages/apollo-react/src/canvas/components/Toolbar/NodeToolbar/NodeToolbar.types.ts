import type { ToolbarAction } from '../shared/toolbar.types';

export interface NodeToolbarConfig {
  actions: ToolbarAction[];
  overflowActions?: ToolbarAction[]; // Actions shown in overflow menu (e.g., more options)
  overflowLabel?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end'; // start = left/top, center = middle, end = right/bottom
}

export interface NodeToolbarProps {
  nodeId: string;
  config: NodeToolbarConfig;
  expanded: boolean;
  /** When true, forcefully hides all toolbar actions including pinned items */
  hidden?: boolean;
}
