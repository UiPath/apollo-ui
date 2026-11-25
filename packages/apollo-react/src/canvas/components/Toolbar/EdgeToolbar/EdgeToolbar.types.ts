import type { XYPosition } from '@uipath/apollo-react/canvas/xyflow/system';
import type { ToolbarActionItem } from '../shared/toolbar.types';

/**
 * Edge toolbar action extends the shared ToolbarActionItem but with a different callback signature.
 * The onAction callback receives the edgeId and the position along the edge where the action occurred.
 *
 * `color`, `isToggled`, `testId` and `onHoverChange` are omitted because the edge toolbar renders `CanvasInlineButton`, which
 * does not expose those affordances — exposing them on the config type would mislead consumers into
 * thinking tinted / toggled edge actions are supported when they are not.
 */
export interface EdgeToolbarActionItem
  extends Omit<ToolbarActionItem, 'onAction' | 'color' | 'isToggled' | 'testId' | 'onHoverChange'> {
  onAction: (edgeId: string, position: { x: number; y: number }) => void;
}

/**
 * Configuration for the edge toolbar.
 */
export interface EdgeToolbarConfig {
  actions: EdgeToolbarActionItem[];
}

export interface EdgeToolbarPositionData {
  offsetPosition: XYPosition;
  pathPosition: XYPosition;
}

/**
 * Props for the EdgeToolbar component.
 */
export interface EdgeToolbarProps {
  edgeId: string;
  visible: boolean;
  positioning: EdgeToolbarPositionData;
  config: EdgeToolbarConfig;
  /**
   * `along-path` stacks the buttons vertically when the toolbar sits beside a vertical run, so a
   * multi-button toolbar does not cover the edge. Defaults to `row`.
   */
  layout?: 'row' | 'along-path';
  /**
   * For a canvas that stacks nodes and edges together: the toolbar leaves xyflow's label layer,
   * whose own z-index would cap it below a lifted flow or node, and takes this one.
   */
  zIndex?: number;
  /**
   * An invisible strip of this many px on the given side, part of the toolbar's hover area, so
   * the pointer can cross the gap to the toolbar from what it floats beside (a label, the path).
   */
  hoverBridge?: { side: 'top' | 'right' | 'bottom' | 'left'; size: number };
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}
