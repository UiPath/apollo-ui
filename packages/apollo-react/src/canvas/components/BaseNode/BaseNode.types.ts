import type { HandleGroupManifest } from '../../schema/node-definition';
import type { NodeShape } from '../../schema';
import type { ExecutionState } from '../../types/execution';
import type { HandleActionEvent } from '../ButtonHandle/ButtonHandle';
import type { NodeToolbarConfig } from '../Toolbar';
import type { Node, NodeProps } from '@xyflow/react';

export type FooterVariant = 'none' | 'button' | 'single' | 'double';

export interface BaseNodeData extends Record<string, unknown> {
  parameters: Record<string, unknown>; // Property bag for node-specific config

  display?: {
    label?: string;
    subLabel?: string;
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
  isHovered?: boolean;
  isConnecting?: boolean;
  isSelected?: boolean;
  isDragging?: boolean;
}

/**
 * Extended props interface for BaseNode component
 *
 * Separates concerns:
 * - node.data: Serializable business data (labels, configs, state)
 * - component props: Runtime behavior (callbacks, event handlers)
 *
 * This follows XYFlow's design pattern where:
 * - node.data = persistent state (can be saved/loaded from JSON)
 * - component props = ephemeral behavior (callbacks, functions)
 *
 * Example: `selected` and `dragging` are props, not data, because they're
 * runtime UI state, not business data to be persisted.
 *
 * @since Phase 1 - Props for runtime callbacks (moved from data)
 */

// TODO: Remove once Agent Builder moves off of AgentFlow component and uses Flow (limited to 1 agent)
export interface BaseNodeComponentProps extends NodeProps<Node<BaseNodeData>> {
  // ========================================
  // Callbacks (Runtime Behavior)
  // ========================================

  /**
   * Runtime callback for handle button actions.
   * Invoked when user clicks a handle button (e.g., add resource button).
   */
  onHandleAction?: (event: HandleActionEvent) => void;

  /**
   * Custom function to determine when add button should be shown.
   * If not provided, uses default logic (showAddButton && selected).
   */
  shouldShowAddButtonFn?: (opts: { showAddButton: boolean; selected: boolean }) => boolean;

  /**
   * Custom function to determine when button handle notches should be shown.
   * If not provided, uses default logic based on connection/selection/hover state.
   */
  shouldShowButtonHandleNotchesFn?: (opts: {
    isConnecting: boolean;
    isSelected: boolean;
    isHovered: boolean;
  }) => boolean;

  // ========================================
  // UI Configuration (Non-Serializable)
  // ========================================

  /**
   * Runtime toolbar configuration.
   * Contains non-serializable content (ReactNode icons, onAction callbacks).
   * - undefined: use manifest default toolbar
   * - null: explicitly disable toolbar (no toolbar shown)
   * - object: use provided toolbar configuration
   */
  toolbarConfig?: NodeToolbarConfig | null;

  /**
   * Runtime handle configurations that override manifest-defined handles.
   * Allows dynamic handle positioning and visibility based on runtime state.
   */
  handleConfigurations?: HandleGroupManifest[];

  /**
   * Legacy ReactNode adornments prop (kept for AgentFlow backward compatibility).
   *
   * This prop allows passing ReactNode adornments directly as a component prop.
   * Mainly used by AgentFlow for complex adornment rendering.
   */
  adornments?: NodeAdornments;

  // ========================================
  // Visual State (Runtime Props)
  // ========================================

  /**
   * Visual suggestion type for the node (add, update, delete).
   * Applies special styling with colored borders and animations.
   */
  suggestionType?: 'add' | 'update' | 'delete';

  /**
   * When true, node is disabled with reduced opacity and disabled cursor.
   * Prevents interactions when disabled.
   */
  disabled?: boolean;

  /**
   * Override execution status from external source (e.g., simulation mode).
   * Takes precedence over execution state from hook.
   */
  executionStatusOverride?: string;

  // ========================================
  // Display Customization (Runtime Props)
  // ========================================

  /**
   * Tooltip text shown on label hover.
   */
  labelTooltip?: string;

  /**
   * Background color for the label area.
   */
  labelBackgroundColor?: string;

  /**
   * Footer display variant (controls footer styling/layout).
   */
  footerVariant?: FooterVariant;

  /**
   * Custom footer content to render (overrides slot config).
   * Useful for complex footer components like instructions preview.
   */
  footerComponent?: React.ReactNode;

  /**
   * Custom subLabel content to render (overrides string subLabel from data).
   * Useful for composite sublabels with badges or icons.
   */
  subLabelComponent?: React.ReactNode;

  /**
   * Custom icon content to render (overrides icon from data and manifest).
   * Useful for dynamic icons that depend on node data (e.g., tool-specific icons).
   */
  iconComponent?: React.ReactNode;
}
