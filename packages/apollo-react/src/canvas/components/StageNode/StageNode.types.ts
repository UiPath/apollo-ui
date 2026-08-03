import type { NodeProps } from '@uipath/apollo-react/canvas/xyflow/react';
import type { GroupModificationType } from '../../utils/GroupModificationUtils';
import type { NodeMenuItem } from '../NodeContextMenu';
import type { ListItem, ToolboxSearchHandler } from '../Toolbox';

enum ElementStatusValues {
  Cancelled = 'Cancelled',
  Completed = 'Completed',
  UserCancelled = 'UserCancelled',
  Failed = 'Failed',
  InProgress = 'InProgress',
  NotExecuted = 'NotExecuted',
  Paused = 'Paused',
  Terminated = 'Terminated',
  Warning = 'Warning',
}

export type StageStatus = `${ElementStatusValues}`;
export type StageTaskStatus = `${ElementStatusValues}`;

export type StageSlaIcon = 'warning' | 'error';

export interface StageTaskItem {
  id: string;
  label: string;
  icon?: React.ReactElement;
  isRequired?: boolean;
  isAdhoc?: boolean;
  isPlaceholder?: boolean;
  taskGroupType?: 'sequential' | 'event-driven' | 'adhoc';
  hasEntryCondition?: boolean;
}

export interface StageTaskContextMenuArgs {
  task: StageTaskItem;
  taskGroupType: 'sequential' | 'event-driven' | 'adhoc';
  isParallel: boolean;
}

export enum StageHeaderChipType {
  Entry = 'entry',
  Exit = 'exit',
  Completion = 'completion',
  ReturnToOrigin = 'returnToOrigin',
  Optional = 'optional',
  EndsCase = 'endsCase',
}

export interface StageHeaderChip {
  type: StageHeaderChipType;
  count?: number;
  label?: string;
  tooltip?: React.ReactNode;
  onClick?: () => void;
}

export interface StageNodeBaseProps {
  pendingReplaceTask?: boolean;
  stageDetails: {
    label: string;
    defaultContent?: string;
    icon?: React.ReactElement;
    sla?: string;
    slaBreached?: boolean;
    escalation?: string;
    escalationsTriggered?: boolean;
    isException?: boolean;
    isReadOnly?: boolean;
    tasks: StageTaskItem[][];
    selectedTaskId?: string;
    headerChips?: StageHeaderChip[];
    sectionStates?: {
      tasks?: SectionState;
      entryRules?: SectionState;
      exitRules?: SectionState;
      completionRules?: SectionState;
    };
    entryRules?: StageRule[];
    exitRules?: StageRule[];
    completionRules?: StageRule[];
  };
  taskOptions?: ListItem[];
  execution?: {
    stageStatus: {
      status?: StageStatus;
      label?: string;
      /**
       * How long the stage has run, pre-formatted by the consumer and rendered verbatim (e.g.
       * `"Duration: 1h, 2m"`). Formatting stays with the consumer: the wording, unit style and any
       * surrounding label are app copy that has to come from the app's own translations.
       */
      duration?: string;
      slaText?: string;
      slaIcon?: StageSlaIcon;
    };
    taskStatus: Record<string, StageTaskExecution>;
  };
  menuItems?: NodeMenuItem[];
  onStageClick?: () => void;
  onStatusClick?: () => void;
  onTaskAdd?: () => void;
  onAddTaskFromToolbox?: (taskItem: ListItem) => void;
  onTaskToolboxSearch?: ToolboxSearchHandler;
  onTaskClick?: (taskElementId: string) => void;
  onTaskGroupModification?: (
    groupModificationType: GroupModificationType,
    groupIndex: number,
    taskIndex: number
  ) => void;
  onStageTitleChange?: (newTitle: string) => void;
  onTaskReorder?: (reorderedTasks: StageTaskItem[][]) => void;
  onReplaceTaskFromToolbox?: (newTask: ListItem, groupIndex: number, taskIndex: number) => void;
  onTaskPlay?: (taskId: string) => Promise<void>;
  /**
   * Adds or removes a task's breakpoint from the gutter marker. Only wired up when the stage is
   * read-only (the Debug view): a set breakpoint clicks to remove, and hovering a task without
   * one ghosts in a dot to click. At design time breakpoints stay in the right-click menu, so
   * this is ignored there. Reflect the result back through `execution.taskStatus[id].breakpoint`.
   */
  onTaskBreakpointToggle?: (taskId: string) => void;
  getTaskContextMenuItems?: (args: StageTaskContextMenuArgs) => NodeMenuItem[] | undefined;
  hideParallelOptions?: boolean;
  loadingTaskIds?: ReadonlySet<string>;
}

export interface SectionState {
  isCollapsed: boolean;
  onCollapsedToggle: () => void;
}

export type StageRuleType = 'entry' | 'exit' | 'completion';

export interface StageRule {
  id: string;
  label: string;
  onClick?: () => void;
}

export interface StageNodeCanvasProps extends NodeProps, StageNodeBaseProps {}
export type StageNodeProps = StageNodeBaseProps &
  Pick<NodeProps, 'id' | 'selected' | 'dragging' | 'width'>;

export interface StageTaskExecution {
  status?: StageTaskStatus;
  message?: string;
  label?: string;
  /**
   * How long the task has run, pre-formatted by the consumer and rendered verbatim (e.g. `"13s"`).
   * Formatting stays with the consumer — see `stageStatus.duration`.
   */
  duration?: string;
  /** Tooltip text shown on hover over the duration text (e.g. a wait-for-timer countdown). */
  durationTooltip?: string;
  /**
   * Total time spent re-working/re-running this task (e.g. `"25m"`). When set, a "rework" icon-chip
   * (↺) is shown; the value is surfaced as `Reworked (+{retryDuration})` in the chip's tooltip.
   */
  retryDuration?: string;
  /**
   * @deprecated No longer rendered. Execution now shows dedicated "runs" and "rework" icon-chips
   * derived from `retryCount` and `retryDuration`; consumer-supplied badge text is ignored.
   */
  badge?: string;
  /**
   * @deprecated No longer rendered. See `badge`.
   */
  badgeStatus?: 'warning' | 'info' | 'error';
  /**
   * Number of re-runs (retries) of this task — i.e. total runs minus one. When `> 0`, a "runs"
   * icon-chip (↱) is shown displaying the total run count (`retryCount + 1`), with a localized
   * "Ran N times" tooltip (or "Running again" when `status` is `'InProgress'`).
   */
  retryCount?: number;
  /**
   * When `true`, the task shows a breakpoint marker (a red gutter dot) indicating the
   * debugger will pause on this task. Breakpoints attach to individual tasks, not to the
   * stage container.
   */
  breakpoint?: boolean;
}

export interface StageTaskDragOverlayProps {
  activeTask: StageTaskItem | undefined;
  isActiveTaskParallel: boolean;
  taskWidthStyle: React.CSSProperties | undefined;
}

export interface TaskStateReference {
  isParallel: boolean;
  groupIndex: number;
  taskIndex: number;
}

export interface StageTaskGroup {
  task: StageTaskItem;
  groupIndex: number;
  taskIndex: number;
}
