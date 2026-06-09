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
  /**
   * Push the toolbar further from the node to clear a colliding handle affordance.
   * `'button'` clears a source add button (larger offset); `'label'` clears a
   * label-only handle (smaller offset). Omit/`false` for no offset.
   * `true` is accepted as a back-compat alias for `'button'`.
   */
  offsetToolbar?: boolean | 'button' | 'label';
  /** Render the toolbar in the node overlay layer instead of inside the node wrapper. */
  portalToNodeOverlay?: boolean;
}
