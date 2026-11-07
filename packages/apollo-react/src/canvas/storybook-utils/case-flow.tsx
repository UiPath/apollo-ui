/**
 * Shared helpers for the CaseFlow stories: manifest-shaped trigger and stage nodes, and the
 * StageNode mapping a consumer canvas uses to render them.
 */
import {
  type Edge,
  type EdgeTypes,
  type Node,
  type NodeProps,
  useReactFlow,
} from '@uipath/apollo-react/canvas/xyflow/react';
import { createContext, memo, useCallback, useContext, useRef, useState } from 'react';
import {
  caseManagementStageManifest,
  caseManagementTriggerManifest,
} from '../components/CaseFlow/case-flow.manifest';
import { StageEdge } from '../components/StageNode/StageEdge';
import { StageNode } from '../components/StageNode/StageNode';
import type {
  StageNodeBaseProps,
  StageTaskContextMenuArgs,
  StageTaskExecution,
  StageTaskItem,
} from '../components/StageNode/StageNode.types';
import { TaskIcon, type TaskItemTypeValues } from '../components/TaskIcon';
import type { ListItem } from '../components/Toolbox';
import {
  createGroupModificationHandlers,
  type GroupModificationType,
  getHandlerForModificationType,
} from '../utils/GroupModificationUtils';
import { areNodePropsEqualIgnoringPosition } from '../utils/nodePropsEqual';
import { createNode } from './mocks/nodes';

export const TRIGGER_NODE_TYPE = caseManagementTriggerManifest.nodeType;
export const STAGE_NODE_TYPE = caseManagementStageManifest.nodeType;

// Stage width used by the Maestro (PO.Frontend) case-management canvas.
export const STAGE_WIDTH = 336;

/**
 * A stage node as a consumer stores it: the manifest-declared fields (`display.label`,
 * `inputs.stageType`) plus the content the consumer renders (tasks, rules, SLA, run state).
 */
export interface CaseStageData {
  display?: { label?: string };
  inputs?: { stageType?: 'primary' | 'secondary' };
  details?: Omit<StageNodeBaseProps['stageDetails'], 'label' | 'isException' | 'sectionStates'>;
  execution?: StageNodeBaseProps['execution'];
  /** Sections that get a collapse toggle, each mapped to whether it starts collapsed. */
  collapsibleSections?: Partial<Record<StageSection, boolean>>;
  /**
   * Wires every design-time interaction to local state: the stage and task menus, drag-and-drop,
   * adding and replacing tasks from the toolbox, task selection, renaming and header chip clicks.
   */
  editable?: boolean;
  /** Wires the Debug view interactions: running a task, toggling breakpoints and the status chip. */
  debuggable?: boolean;
  /** Toolbox items offered when adding or replacing a task. */
  taskOptions?: ListItem<{ type: TaskItemTypeValues }>[];
  hideParallelOptions?: boolean;
  /** `host` hands the add button to the consumer (`onTaskAdd`) instead of the built-in toolbox. */
  addTaskMode?: 'toolbox' | 'host';
  /**
   * Adds a "Change task type" item to the task menu that opens the replace toolbox from the host
   * (`pendingReplaceTask`), titled with this text.
   */
  replaceTaskToolboxTitle?: string;
}

const StageActionLogContext = createContext<(action: string) => void>(() => {});

/** Receives a description of each stage interaction, for the story to show. */
export const StageActionLogProvider = StageActionLogContext.Provider;

type StageSection = keyof NonNullable<StageNodeBaseProps['stageDetails']['sectionStates']>;

const useSectionStates = (initial: CaseStageData['collapsibleSections']) => {
  const [collapsed, setCollapsed] = useState(initial);
  if (!collapsed) return undefined;
  return Object.fromEntries(
    Object.entries(collapsed).map(([section, isCollapsed]) => [
      section,
      {
        isCollapsed: !!isCollapsed,
        onCollapsedToggle: () =>
          setCollapsed((prev) => ({ ...prev, [section]: !prev?.[section as StageSection] })),
      },
    ])
  ) as StageNodeBaseProps['stageDetails']['sectionStates'];
};

const groupModificationHandlers = createGroupModificationHandlers<StageTaskItem>();

const TASK_RUN_MS = 1500;

const taskFromOption = (option: ListItem, id: string): StageTaskItem => ({
  id,
  label: option.name,
  icon: <TaskIcon type={option.data?.type} size="sm" />,
});

const findTaskLabel = (tasks: StageTaskItem[][], taskId: string) =>
  tasks.flat().find((t) => t.id === taskId)?.label ?? taskId;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const useLoadingTasks = () => {
  const [loadingTaskIds, setLoadingTaskIds] = useState<ReadonlySet<string>>(new Set());
  const whileLoading = useCallback(async (taskId: string) => {
    setLoadingTaskIds((prev) => new Set(prev).add(taskId));
    await sleep(TASK_RUN_MS);
    setLoadingTaskIds((prev) => {
      const next = new Set(prev);
      next.delete(taskId);
      return next;
    });
  }, []);
  return { loadingTaskIds, whileLoading };
};

const useBreakpoints = (data: CaseStageData) => {
  const log = useContext(StageActionLogContext);
  const [breakpoints, setBreakpoints] = useState<Record<string, boolean>>({});
  const isSet = (taskId: string) =>
    breakpoints[taskId] ?? !!data.execution?.taskStatus[taskId]?.breakpoint;
  const toggle = (taskId: string, taskLabel: string) => {
    const next = !isSet(taskId);
    setBreakpoints((prev) => ({ ...prev, [taskId]: next }));
    log(`Breakpoint ${next ? 'set' : 'removed'}: ${taskLabel}`);
  };
  const taskStatus: Record<string, StageTaskExecution> = { ...data.execution?.taskStatus };
  for (const [taskId, breakpoint] of Object.entries(breakpoints)) {
    taskStatus[taskId] = { ...taskStatus[taskId], breakpoint };
  }
  return { isSet, toggle, taskStatus };
};

type StageBreakpoints = ReturnType<typeof useBreakpoints>;
type StageLoadingTasks = ReturnType<typeof useLoadingTasks>;

const useEditableStage = (
  id: string,
  data: CaseStageData,
  loading: StageLoadingTasks,
  breakpoints: StageBreakpoints
) => {
  const log = useContext(StageActionLogContext);
  const { deleteElements } = useReactFlow();
  const [tasks, setTasks] = useState(data.details?.tasks ?? []);
  const [label, setLabel] = useState(
    data.display?.label ?? caseManagementStageManifest.display.label
  );
  const [selectedTaskId, setSelectedTaskId] = useState(data.details?.selectedTaskId);
  const [pendingReplaceTask, setPendingReplaceTask] = useState(false);
  const nextTaskId = useRef(0);
  const newTaskId = () => `${id}-new-${nextTaskId.current++}`;
  const options = data.taskOptions ?? [];

  const onTaskGroupModification = useCallback(
    (type: GroupModificationType, groupIndex: number, taskIndex: number) => {
      setTasks((prev) =>
        getHandlerForModificationType(groupModificationHandlers, type)(prev, groupIndex, taskIndex)
      );
      log(`Task menu: ${type.replaceAll('_', ' ')}`);
    },
    [log]
  );

  if (!data.editable) return { tasks: data.details?.tasks ?? [], label };

  const addTask = (task: StageTaskItem) => {
    setTasks((prev) => [...prev, [task]]);
    loading.whileLoading(task.id);
  };
  const addHandlers =
    data.addTaskMode === 'host'
      ? {
          onTaskAdd: () => {
            addTask({ id: newTaskId(), label: 'New task', isPlaceholder: true });
            log('Host add: placeholder task added');
          },
        }
      : {
          taskOptions: options,
          // Searches the branch the toolbox has drilled into, as the built-in search does.
          onTaskToolboxSearch: async (
            query: string,
            _isTopLevelSearch: boolean,
            { currentItems }: { currentItems?: ListItem[] }
          ) =>
            (currentItems ?? options).filter((o) =>
              o.name.toLowerCase().includes(query.toLowerCase())
            ),
          onAddTaskFromToolbox: (option: ListItem) => {
            addTask(taskFromOption(option, newTaskId()));
            log(`Task added: ${option.name}`);
          },
        };

  return {
    tasks,
    label,
    selectedTaskId,
    headerChips: data.details?.headerChips?.map((chip) => ({
      ...chip,
      onClick: () => log(`Header chip clicked: ${chip.label ?? chip.type}`),
    })),
    stageProps: {
      menuItems: [
        {
          id: 'open-stage',
          label: 'Open stage properties',
          onClick: () => log('Stage menu: Open'),
        },
        { type: 'divider' as const },
        {
          id: 'delete-stage',
          label: 'Delete stage',
          onClick: () => deleteElements({ nodes: [{ id }] }),
        },
      ],
      onStageClick: () => log(`Stage clicked: ${label}`),
      onStageTitleChange: (title: string) => {
        setLabel(title);
        log(`Stage renamed: ${title}`);
      },
      onTaskClick: (taskId: string) => {
        setSelectedTaskId(taskId);
        log(`Task selected: ${findTaskLabel(tasks, taskId)}`);
      },
      ...addHandlers,
      // The replace toolbox reads `taskOptions`, so host-add stages still offer them there.
      ...(data.addTaskMode === 'host' && { taskOptions: options }),
      pendingReplaceTask,
      replaceTaskToolboxTitle: data.replaceTaskToolboxTitle,
      onReplaceTaskFromToolbox: (option: ListItem, groupIndex: number, taskIndex: number) => {
        setTasks((prev) =>
          prev.map((group, gi) =>
            gi === groupIndex
              ? group.map((t, ti) => (ti === taskIndex ? taskFromOption(option, newTaskId()) : t))
              : group
          )
        );
        setPendingReplaceTask(false);
        log(`Task replaced with: ${option.name}`);
      },
      onTaskReorder: (reordered: StageTaskItem[][]) => {
        setTasks(reordered);
        log('Tasks reordered');
      },
      onTaskGroupModification,
      getTaskContextMenuItems: ({ task }: StageTaskContextMenuArgs) =>
        // Placeholders aren't real tasks yet, so they get no host items.
        task.isPlaceholder
          ? undefined
          : [
              {
                id: `open-${task.id}`,
                label: 'Open task',
                onClick: () => log(`Task menu: Open ${task.label}`),
              },
              {
                id: `breakpoint-${task.id}`,
                label: breakpoints.isSet(task.id) ? 'Remove breakpoint' : 'Add breakpoint',
                onClick: () => breakpoints.toggle(task.id, task.label),
              },
              ...(data.replaceTaskToolboxTitle
                ? [
                    {
                      id: `change-type-${task.id}`,
                      label: 'Change task type',
                      onClick: () => {
                        setSelectedTaskId(task.id);
                        setPendingReplaceTask(true);
                        // StageNode opens the toolbox when this turns true, so reset it for the next request.
                        requestAnimationFrame(() => setPendingReplaceTask(false));
                        log(`Host opened replace for: ${task.label}`);
                      },
                    },
                  ]
                : []),
            ],
      hideParallelOptions: data.hideParallelOptions,
    },
  };
};

const useDebuggableStage = (
  data: CaseStageData,
  tasks: StageTaskItem[][],
  loading: StageLoadingTasks,
  breakpoints: StageBreakpoints
) => {
  const log = useContext(StageActionLogContext);
  if (!data.debuggable) return {};
  return {
    onStatusClick: () => log('Status chip clicked'),
    onTaskBreakpointToggle: (taskId: string) =>
      breakpoints.toggle(taskId, findTaskLabel(tasks, taskId)),
    onTaskPlay: async (taskId: string) => {
      log(`Running task: ${findTaskLabel(tasks, taskId)}`);
      await loading.whileLoading(taskId);
    },
  };
};

// Maps a manifest-shaped stage onto StageNode, as a consumer canvas does.
const CaseStageNode = memo(({ id, selected, dragging, width, data }: NodeProps) => {
  const stage = data as CaseStageData;
  const sectionStates = useSectionStates(stage.collapsibleSections);
  const loading = useLoadingTasks();
  const breakpoints = useBreakpoints(stage);
  const isInteractive = stage.editable || stage.debuggable;
  const editing = useEditableStage(id, stage, loading, breakpoints);
  const debugging = useDebuggableStage(stage, editing.tasks, loading, breakpoints);
  return (
    <StageNode
      id={id}
      selected={selected}
      dragging={dragging}
      width={width}
      execution={
        isInteractive
          ? { stageStatus: stage.execution?.stageStatus ?? {}, taskStatus: breakpoints.taskStatus }
          : stage.execution
      }
      {...(isInteractive && { loadingTaskIds: loading.loadingTaskIds })}
      {...editing.stageProps}
      {...debugging}
      stageDetails={{
        ...stage.details,
        tasks: editing.tasks,
        selectedTaskId: editing.selectedTaskId ?? stage.details?.selectedTaskId,
        headerChips: editing.headerChips ?? stage.details?.headerChips,
        label: editing.label,
        isException: stage.inputs?.stageType === 'secondary',
        sectionStates,
      }}
    />
  );
}, areNodePropsEqualIgnoringPosition);

export const caseStageNodeTypes = { [STAGE_NODE_TYPE]: CaseStageNode };

export const caseStageEdgeTypes: EdgeTypes = { stage: StageEdge };

export const taskOption = (
  id: string,
  name: string,
  type: TaskItemTypeValues
): ListItem<{ type: TaskItemTypeValues }> => ({
  id,
  name,
  data: { type },
  icon: { Component: () => <TaskIcon type={type} size="sm" /> },
});

export const task = (
  id: string,
  label: string,
  type: TaskItemTypeValues,
  extra: Partial<StageTaskItem> = {}
): StageTaskItem => ({
  id,
  label,
  icon: <TaskIcon type={type} size="sm" />,
  ...extra,
});

export const triggerNode = (x: number, y: number, label = 'Trigger', id = 'trigger') =>
  createNode({
    id,
    type: TRIGGER_NODE_TYPE,
    position: { x, y },
    data: {
      nodeType: TRIGGER_NODE_TYPE,
      version: caseManagementTriggerManifest.version,
      display: { label },
    },
  });

export const stageNode = (
  id: string,
  label: string,
  x: number,
  y: number,
  data: Omit<CaseStageData, 'display'> = {}
): Node => ({
  ...createNode({
    id,
    type: STAGE_NODE_TYPE,
    position: { x, y },
    data: {
      nodeType: STAGE_NODE_TYPE,
      version: caseManagementStageManifest.version,
      display: { label },
      inputs: { stageType: 'primary' },
      ...data,
    },
  }),
  width: STAGE_WIDTH,
});

export const stageEdge = (source: string, target: string): Edge => ({
  id: `${source}-${target}`,
  type: 'stage',
  source,
  sourceHandle: `${source}____source____right`,
  target,
  targetHandle: `${target}____target____left`,
});

export const triggerEdge = (target: string, source = 'trigger'): Edge => ({
  id: `${source}-${target}`,
  source,
  sourceHandle: 'output',
  target,
  targetHandle: `${target}____target____left`,
});
