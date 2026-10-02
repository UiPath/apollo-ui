import type { Node, NodeProps } from '@uipath/apollo-react/canvas/xyflow/react';
import type { ReactNode } from 'react';
import type { SuggestionType } from '../../types';
import type { ElementStatusValues } from '../../types/execution';
import type { BaseNodeData } from '../BaseNode';
import type { NodeAdornments } from '../BaseNode/BaseNode.types';
import type { NodeToolbarConfig } from '../Toolbar';

export type ContainerNodeData = BaseNodeData;

export interface ContainerNodeResizeSize {
  width: number;
  height: number;
}

export type ContainerBorderStyle = 'solid' | 'dashed';
export type ContainerAccent = 'default' | 'info' | 'warning' | 'error' | 'success';
export type ContainerRadius = 'default' | 'lg' | 'xl';
export type ContainerBodyFrame = 'dashed' | 'solid' | 'none';

export interface ContainerNodeAppearance {
  /** Outer frame border style. `dashed` is the BPMN event sub-process look. */
  borderStyle?: ContainerBorderStyle;
  /** Outer frame accent, drawn from the semantic status tokens. */
  accent?: ContainerAccent;
  /** Outer frame corner radius. */
  radius?: ContainerRadius;
}

/** The default header pieces, passed to `renderHeader` so callers can recompose them. */
export interface ContainerHeaderParts {
  icon: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  badges?: ReactNode;
  end?: ReactNode;
}

export interface ContainerEmptyStateContext {
  onAddFirstChild?: () => void;
  isLoading: boolean;
}

/**
 * Lowest-precedence values, used by presets such as `LoopNode`. Props on
 * `ContainerNode` win over `display.container` in the manifest, which wins over these.
 */
export interface ContainerNodeDefaults {
  kind?: string;
  /** Title used when the manifest has no label. */
  title?: string;
  /** Icon used when the manifest has no icon. */
  icon?: string;
  headerBadges?: ReactNode | null;
  headerEnd?: ReactNode;
  subtitle?: ReactNode;
  emptyStateLabel?: string;
  bodyFrame?: ContainerBodyFrame;
  appearance?: ContainerNodeAppearance;
  labelEditable?: boolean;
}

export interface ContainerNodeConfig {
  toolbarConfig?: NodeToolbarConfig | null;
  adornments?: NodeAdornments;
  executionStatusOverride?: ElementStatusValues;
  suggestionType?: SuggestionType;

  /**
   * Replaces the header content. It receives the default parts so callers can
   * recompose them. The header shell (drag cursor, adornment spacing) is kept.
   */
  renderHeader?: (parts: ContainerHeaderParts) => ReactNode;
  /** Shown to the right of the title. `null` means no badge. */
  headerBadges?: ReactNode | null;
  /** Shown before the badges, for example an execution counter. */
  headerEnd?: ReactNode;
  /**
   * Second line under the title. Passing it overrides the node's own
   * `display.subLabel`, and the subtitle is then not editable inline.
   */
  subtitle?: ReactNode;
  /**
   * Lets users double-click the title or subtitle to rename it in design mode,
   * like BaseNode. Edits write `data.display.label` / `data.display.subLabel`.
   * Off by default.
   */
  labelEditable?: boolean;

  /** Tooltip and accessible name of the add-first-step button. */
  emptyStateLabel?: string;
  /** Replaces the add-first-step button shown while the container has no children. */
  renderEmptyState?: (ctx: ContainerEmptyStateContext) => ReactNode;
  /** Inner body frame style. */
  bodyFrame?: ContainerBodyFrame;

  /** Visual preset for the outer frame. Fields merge over `display.container`. */
  appearance?: ContainerNodeAppearance;
  /** Added to the root element. */
  className?: string;
  /** Set on the root as `data-container-kind`. */
  kind?: string;
  /** Preset defaults with the lowest precedence. */
  defaults?: ContainerNodeDefaults;
}

export interface ContainerNodeProps
  extends NodeProps<Node<ContainerNodeData>>,
    ContainerNodeConfig {
  onAddFirstChild?: () => void;
  onResize?: (size: ContainerNodeResizeSize) => void;
  onResizeStart?: () => void;
  onResizeEnd?: () => void;
}
