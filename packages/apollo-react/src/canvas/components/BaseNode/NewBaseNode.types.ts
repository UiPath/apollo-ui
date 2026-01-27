import type { Position } from '@uipath/apollo-react/canvas/xyflow/react';
import type { NodeShape } from '../../schema';
import type { ButtonHandleConfig, HandleActionEvent } from '../ButtonHandle/ButtonHandle';
import type { NodeToolbarConfig } from '../Toolbar';

export interface NewBaseNodeData extends Record<string, unknown> {
  parameters?: Record<string, unknown>;
}

export interface NewBaseNodeDisplayProps {
  disabled?: boolean;
  executionStatus?: string;
  suggestionType?: string;
  icon?: React.ReactNode;
  display?: NodeDisplay;
  adornments?: NodeAdornments;
  handleConfigurations?: HandleConfiguration[];
  toolbarConfig?: NodeToolbarConfig;
  onHandleAction?: (event: HandleActionEvent) => void;
  showHandles?: boolean;
  showAddButton?: boolean;
  shouldShowAddButtonFn?: ({
    showAddButton,
    selected,
  }: {
    showAddButton: boolean;
    selected: boolean;
  }) => boolean;
}

export interface NodeDisplay {
  label?: string;
  subLabel?: React.ReactNode;
  labelTooltip?: string;
  labelBackgroundColor?: string;
  shape?: NodeShape;
  background?: string;
  iconBackground?: string;
  iconColor?: string;
  centerAdornmentComponent?: React.ReactNode;
  footerComponent?: React.ReactNode;
}

export interface NodeAdornment {
  icon?: React.ReactNode;
  tooltip?: React.ReactNode;
}

export interface NodeAdornments {
  topLeft?: NodeAdornment;
  topRight?: NodeAdornment;
  bottomLeft?: NodeAdornment;
  bottomRight?: NodeAdornment;
}

export interface HandleConfiguration {
  position: Position;
  handles: ButtonHandleConfig[];
  visible?: boolean;
}
