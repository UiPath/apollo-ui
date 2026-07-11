import type { NodeShape } from '../../schema';
import type { ExecutionState } from '../../types/execution';
import type { ValidationState } from '../../types/validation';

export type FooterVariant = 'none' | 'button' | 'single' | 'double';

export interface BaseNodeData extends Record<string, unknown> {
  display?: {
    label?: string;
    /**
     * Canvas-side label override. Independent of `label`, which serves the panel /
     * properties view. When set, takes precedence over `manifest.canvasLabel`,
     * `instance.label`, and `manifest.label` for the canvas chip.
     */
    canvasLabel?: string;
    subLabel?: string;
    /**
     * Longer descriptive text for the node. Container/loop nodes render it as a
     * muted secondary line under the header title; other nodes may surface it in
     * tooltips or panels.
     */
    description?: string;
    shape?: NodeShape;
    color?: string;
    background?: string;
    icon?: string;
    iconBackground?: string;
    iconBackgroundDark?: string;
    iconColor?: string;
  };

  /**
   * When true, uses SmartHandle instead of ButtonHandle for dynamic handle positioning.
   * SmartHandle positions handles based on connected node locations.
   * @default false
   */
  useSmartHandles?: boolean;

  /**
   * Whether the node is collapsed.
   * @default false
   */
  isCollapsed?: boolean;

  /**
   * When true, the icon area displays a skeleton shimmer placeholder.
   * Other node elements (labels, handles, adornments) render normally.
   * @default false
   */
  loading?: boolean;
}

export interface NodeAdornments {
  topLeft?: React.ReactNode;
  topRight?: React.ReactNode;
  bottomLeft?: React.ReactNode;
  bottomRight?: React.ReactNode;
}

export interface NodeStatusContext {
  nodeId: string;
  executionState?: ExecutionState;
  validationState?: ValidationState;
  isHovered?: boolean;
  isConnecting?: boolean;
  isSelected?: boolean;
  isDragging?: boolean;
}
