import type { XYPosition } from '@uipath/apollo-react/canvas/xyflow/system';
import type { ToolbarActionItem } from '../shared/toolbar.types';

/**
 * Edge toolbar action extends the shared ToolbarActionItem but with a different callback signature.
 * The onAction callback receives the edgeId and the position along the edge where the action occurred.
 */
export interface EdgeToolbarActionItem extends Omit<ToolbarActionItem, 'onAction'> {
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
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}
