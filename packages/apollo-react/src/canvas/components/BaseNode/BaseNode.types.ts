import type { HandleGroupManifest } from '../../schema/node-definition';
import type { NodeShape } from '../../schema';
import type { ExecutionState } from '../../types/execution';
import type { HandleActionEvent } from '../ButtonHandle/ButtonHandle';
import type { NodeToolbarConfig } from '../Toolbar';

export type FooterVariant = 'none' | 'button' | 'single' | 'double';

export interface BaseNodeData extends Record<string, unknown> {
  parameters: Record<string, unknown>; // Property bag for node-specific config

  display?: {
    label?: string;
    subLabel?: React.ReactNode;
    shape?: NodeShape;
    color?: string;
    background?: string;
    icon?: string;
    iconElement?: React.ReactNode;
    iconBackground?: string;
    iconColor?: string;
    labelTooltip?: string;
    labelBackgroundColor?: string;
    centerAdornmentComponent?: React.ReactNode;
    footerComponent?: React.ReactNode;
    footerVariant?: FooterVariant;
  };

  /**
   * When true, uses SmartHandle instead of ButtonHandle for dynamic handle positioning.
   * SmartHandle positions handles based on connected node locations.
   * @default false
   */
  useSmartHandles?: boolean;

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

  /**
   * Runtime callback for handle button actions.
   * Called when user clicks a handle button.
   * @param event Handle action event with details
   */
  onHandleAction?: (event: HandleActionEvent) => void;

  /**
   * Custom function to determine when add button should be shown.
   * If not provided, uses default logic (showAddButton && selected).
   * @param opts Object with showAddButton and selected flags
   * @returns true if add button should be shown
   */
  shouldShowAddButtonFn?: (opts: { showAddButton: boolean; selected: boolean }) => boolean;

  /**
   * Custom function to determine when button handle notches should be shown.
   * If not provided, uses default logic (showButton && selected).
   * @param opts Object with showButton and selected flags
   * @returns true if button handle should be shown
   */
  shouldShowButtonHandleNotchesFn?: (opts: {
    isConnecting: boolean;
    isSelected: boolean;
    isHovered: boolean;
  }) => boolean;

  /**
   * Runtime handle configurations that override manifest-defined handles.
   * Allows dynamic handle positioning and visibility based on runtime state.
   */
  handleConfigurations?: HandleGroupManifest[];

  /**
   * Runtime toolbar configuration that overrides manifest-defined toolbar.
   * Allows dynamic toolbar actions based on runtime state.
   */
  toolbarConfig?: NodeToolbarConfig;

  /**
   * Runtime adornments that override manifest-defined adornments.
   * Allows dynamic badges/icons in node corners based on runtime state.
   */
  adornments?: NodeAdornments;
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
