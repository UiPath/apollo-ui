import type { Node, NodeProps } from '@xyflow/react';
import type { NodeMenuItem } from '../NodeContextMenu';
import type { StageTaskExecution } from '../StageNode/StageNode.types';

/**
 * Existing task types from the codebase
 * Use with "uipath.case-management." prefix
 */
export type TaskType =
  | 'process'
  | 'agent'
  | 'external-agent'
  | 'rpa'
  | 'action'
  | 'api-workflow'
  | 'wait-for-timer'
  | 'wait-for-connector'
  | 'run-human-action'
  | 'execute-connector-activity';

/**
 * Data stored on a TaskNode
 * Includes index signature for React Flow compatibility
 */
export interface TaskNodeData extends Record<string, unknown> {
  /** Task type identifier (e.g., "uipath.case-management.run-human-action") */
  taskType: string;
  /** Display label for the task */
  label: string;
  /** Icon identifier string (resolved via iconResolver) */
  icon?: string;
  /** React element for the icon (alternative to icon string) */
  iconElement?: React.ReactElement;
  /** Group index within the stage (for parallel grouping) */
  groupIndex: number;
  /** Task index within the group */
  taskIndex: number;
  /** Execution state for the task */
  execution?: StageTaskExecution;
  /** Click handler - passed through data since context doesn't work across React Flow layers */
  onTaskClick?: (taskId: string) => void;
  /** Select handler - passed through data since context doesn't work across React Flow layers */
  onTaskSelect?: (taskId: string) => void;
  /** Explicit width for proper sizing (CSS variables don't cascade to React Flow nodes) */
  width?: number;
  /** Context menu items for the task menu */
  contextMenuItems?: NodeMenuItem[];
  /** Callback when menu open state changes */
  onMenuOpenChange?: (isOpen: boolean) => void;
}

/**
 * A TaskNode in the React Flow graph
 */
export type TaskNode = Node<TaskNodeData, 'task'>;

/**
 * Props passed to the TaskNode component by React Flow
 */
export interface TaskNodeProps extends NodeProps<TaskNode> {
  /** Whether the node is currently being dragged */
  dragging: boolean;
  /** Whether the node is selected */
  selected: boolean;
}

/**
 * Position information for a task within a stage
 */
export interface TaskPosition {
  x: number;
  y: number;
  width: number;
}

/**
 * Configuration for task positioning
 */
export interface TaskPositionConfig {
  /** Thickness of the stage border */
  stageBorderThickness: number;
  /** Task height in pixels */
  taskHeight: number;
  /** Gap between tasks */
  taskGap: number;
  /** Indentation for parallel tasks */
  parallelIndent: number;
  /** Padding at the top of content area */
  contentPaddingTop: number;
  /** Padding at the bottom of content area */
  contentPaddingBottom: number;
  /** Horizontal padding in content area */
  contentPaddingX: number;
  /** Height of the stage header */
  headerHeight: number;
  /** Height of the execution description */
  headerExecutionDescriptionHeight: number;
}
