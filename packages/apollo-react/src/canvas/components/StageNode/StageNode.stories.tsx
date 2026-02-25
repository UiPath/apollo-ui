/**
 * StageNode Stories
 *
 * Demonstrates the StageNode component with TaskNodes rendered as separate React Flow nodes.
 * The new StageNode uses taskIds: string[][] and requires tasks to be React Flow child nodes.
 */

import type { Meta, StoryObj } from '@storybook/react';
import type { Connection, Edge, Node, NodeChange } from '@uipath/apollo-react/canvas/xyflow/react';
import {
  addEdge,
  applyNodeChanges,
  ConnectionMode,
  Panel,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
} from '@uipath/apollo-react/canvas/xyflow/react';
import { ApButton, ApMenu } from '@uipath/apollo-react/material/components';
import type { IMenuItem } from '@uipath/apollo-react/material/components/ap-menu/ApMenu.types';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CrossStageDragProvider } from '../../hooks/CrossStageDragContext';
import {
  useCrossStageTaskDrag,
  type TaskReorderParams,
  type TaskMoveParams,
  type TaskCopyParams,
} from '../../hooks/useCrossStageTaskDrag';
import { useTaskCopyPaste, type TaskPasteParams } from '../../hooks/useTaskCopyPaste';
import { DefaultCanvasTranslations } from '../../types';
import {
  createGroupModificationHandlers,
  getHandlerForModificationType,
  GroupModificationType,
} from '../../utils/GroupModificationUtils';
import { BaseCanvas } from '../BaseCanvas';
import { CanvasPositionControls } from '../CanvasPositionControls';
import type { NodeMenuItem } from '../NodeContextMenu';
import { TaskIcon, TaskItemTypeValues } from '../TaskIcon';
import { PlaceholderTaskNode } from '../TaskNode/PlaceholderTaskNode';
import { TaskNode } from '../TaskNode/TaskNode';
import type { TaskNodeData, TaskNode as TaskNodeType } from '../TaskNode/TaskNode.types';
import {
  moveTaskWithinStage,
  moveTaskBetweenStages,
  insertTaskAtPosition,
} from '../TaskNode/taskReorderUtils';
import { calculateTaskPositions } from '../TaskNode/useTaskPositions';
import type { ListItem } from '../Toolbox';
import { StageConnectionEdge } from './StageConnectionEdge';
import { StageEdge } from './StageEdge';
import { StageNode } from './StageNode';
import type { StageNodeProps } from './StageNode.types';
import { getContextMenuItems } from './StageNodeTaskUtilities';

const meta: Meta<typeof StageNode> = {
  title: 'Canvas/StageNode',
  component: StageNode as any,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Wrapper components for React Flow
const StageNodeWrapper = (props: any) => {
  return <StageNode {...props} {...props.data} />;
};

const TaskNodeWrapper = (props: any) => {
  return <TaskNode {...props} />;
};

/**
 * Merge computed nodes into React Flow's internal state.
 * Preserves RF-managed properties (selected, dragging, measured dimensions)
 * while updating data, style, and position from our computed nodes.
 */
function mergeNodes(
  prevNodes: Node[],
  computedNodes: Node[]
): Node[] {
  const computedMap = new Map(computedNodes.map((n) => [n.id, n]));
  const prevIds = new Set(prevNodes.map((n) => n.id));
  const computedIds = new Set(computedNodes.map((n) => n.id));

  // Update existing nodes, preserving React Flow internal state
  const merged = prevNodes
    .filter((n) => computedIds.has(n.id))
    .map((n) => {
      const source = computedMap.get(n.id);
      if (!source) return n;
      return { ...n, data: source.data, style: source.style, position: source.position };
    });

  // Append new nodes that don't exist yet
  for (const node of computedNodes) {
    if (!prevIds.has(node.id)) {
      merged.push(node);
    }
  }

  return merged;
}

// Task info interface for story data
interface TaskInfo {
  label: string;
  taskType: string;
  icon: React.ReactElement;
  execution?: TaskNodeData['execution'];
  contextMenuItems?: NodeMenuItem[];
}

// Helper to create task nodes from task IDs
interface CreateTaskNodesOptions {
  stageId: string;
  taskIds: string[][];
  tasks: Record<string, TaskInfo>;
  stageWidth: number;
  onTaskClick?: (taskId: string) => void;
  onTaskSelect?: (taskId: string) => void;
  stageExecution?: { duration?: string };
  enableCrossStage?: boolean;
  onGroupModification?: (
    type: GroupModificationType,
    groupIndex: number,
    taskIndex: number
  ) => void;
  onRequestReplaceTask: (groupIndex: number, taskIndex: number) => void;
}

function createTaskNodes({
  stageId,
  taskIds,
  tasks,
  stageWidth,
  onTaskClick,
  onTaskSelect,
  stageExecution,
  enableCrossStage,
  onGroupModification,
  onRequestReplaceTask,
}: CreateTaskNodesOptions): TaskNodeType[] {
  const positions = calculateTaskPositions(taskIds, stageWidth, tasks as any, stageExecution);
  const nodes: TaskNodeType[] = [];

  taskIds.forEach((group, groupIndex) => {
    group.forEach((taskId, taskIndex) => {
      const taskInfo = tasks[taskId];
      if (!taskInfo) return;

      const position = positions.get(taskId);
      if (!position) return;

      // Generate context menu items dynamically based on task position
      const prevGroup = groupIndex > 0 ? taskIds[groupIndex - 1] : undefined;
      const nextGroup = groupIndex < taskIds.length - 1 ? taskIds[groupIndex + 1] : undefined;
      const contextMenuItems = onGroupModification
        ? getContextMenuItems(
            group.length > 1, // isParallelGroup
            groupIndex,
            taskIds.length,
            taskIndex,
            group.length,
            prevGroup !== undefined && prevGroup.length > 1, // isAboveParallel
            nextGroup !== undefined && nextGroup.length > 1, // isBelowParallel
            onGroupModification,
            onRequestReplaceTask
          )
        : taskInfo.contextMenuItems;

      const node: TaskNodeType = {
        id: taskId,
        type: 'task',
        parentId: stageId,
        position: { x: position.x, y: position.y },
        width: position.width,
        data: {
          taskType: taskInfo.taskType,
          label: taskInfo.label,
          iconElement: taskInfo.icon,
          groupIndex,
          taskIndex,
          execution: taskInfo.execution,
          onTaskClick,
          onTaskSelect,
          width: position.width,
          contextMenuItems,
        } as TaskNodeData,
      };

      // Only add extent: 'parent' if cross-stage drag is disabled
      if (!enableCrossStage) {
        node.extent = 'parent';
      }

      nodes.push(node);
    });
  });

  return nodes;
}

// Interactive canvas component with drag/copy/paste support
interface InteractiveStageCanvasProps {
  stages: {
    id: string;
    label: string;
    taskIds: string[][];
    position: { x: number; y: number };
    width?: number;
    isException?: boolean;
    isReadOnly?: boolean;
    execution?: StageNodeProps['execution'];
  }[];
  tasks: Record<string, TaskInfo>;
  edges?: Edge[];
  showInstructions?: boolean;
  onTaskAdd?: () => void;
  onAddTaskFromToolbox?: (taskItem: ListItem) => void;
  taskOptions?: ListItem[];
  enableTaskMenu?: boolean;
  enableReplaceTask?: boolean;
}

const InteractiveStageCanvas = ({
  stages: initialStages,
  tasks: initialTasks,
  edges: initialEdges = [],
  showInstructions = true,
  onTaskAdd,
  onAddTaskFromToolbox,
  taskOptions,
  enableTaskMenu = true,
  enableReplaceTask = true,
}: InteractiveStageCanvasProps) => {
  const [stageTaskIds, setStageTaskIds] = useState<Record<string, string[][]>>(
    Object.fromEntries(initialStages.map((s) => [s.id, s.taskIds]))
  );
  const [tasks, setTasks] = useState(initialTasks);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [actionLog, setActionLog] = useState<string>('');
  const [replaceTargets, setReplaceTargets] = useState<
    Record<string, { groupIndex: number; taskIndex: number } | null>
  >({});

  // Handle replace task
  const handleTaskReplace = useCallback(
    (stageId: string) => (newTask: ListItem, groupIndex: number, taskIndex: number) => {
      setActionLog(
        `Replace task at stage ${stageId}, group ${groupIndex}, task ${taskIndex} with "${newTask.name}"`
      );

      const newTaskId = `replaced-${Date.now()}`;
      const IconComp = newTask.icon?.Component;
      setTasks((prev) => ({
        ...prev,
        [newTaskId]: {
          label: newTask.name,
          taskType: newTask.data?.taskType || 'uipath.case-management.process',
          icon: IconComp ? (
            <IconComp />
          ) : (
            <TaskIcon type={TaskItemTypeValues.AgenticProcess} size="sm" />
          ),
        },
      }));

      setStageTaskIds((prev) => {
        const currentTaskIds = [...(prev[stageId] || [])].map((group) => [...group]);
        const targetGroup = currentTaskIds[groupIndex];
        if (targetGroup && targetGroup[taskIndex] !== undefined) {
          targetGroup[taskIndex] = newTaskId;
        }
        return { ...prev, [stageId]: currentTaskIds };
      });
    },
    []
  );

  // Create stage nodes
  const stageNodes: Node[] = useMemo(
    () =>
      initialStages.map((stage) => ({
        id: stage.id,
        type: 'stage',
        position: stage.position,
        style: { width: stage.width || 304 },
        data: {
          nodeType: 'case-management:Stage',
          stageDetails: {
            label: stage.label,
            taskIds: stageTaskIds[stage.id] || [],
            isException: stage.isException,
            isReadOnly: stage.isReadOnly,
          },
          execution: stage.execution,
          onTaskClick: (taskId: string) => {
            setSelectedTaskId(taskId);
            setActionLog(`Selected: ${taskId}`);
          },
          onTaskAdd,
          onAddTaskFromToolbox,
          taskOptions,
          ...(enableReplaceTask && !stage.isReadOnly
            ? {
                onReplaceTaskFromToolbox: handleTaskReplace(stage.id),
                replaceTaskTarget: replaceTargets[stage.id] ?? null,
                onReplaceTaskTargetChange: (
                  target: { groupIndex: number; taskIndex: number } | null
                ) => setReplaceTargets((prev) => ({ ...prev, [stage.id]: target })),
              }
            : {}),
        } as Partial<StageNodeProps>,
      })),
    [
      initialStages,
      stageTaskIds,
      onTaskAdd,
      onAddTaskFromToolbox,
      taskOptions,
      enableReplaceTask,
      handleTaskReplace,
      replaceTargets,
    ]
  );

  // Handle group modification from context menu
  const handleGroupModification = useCallback(
    (stageId: string) => (type: GroupModificationType, groupIndex: number, taskIndex: number) => {
      setActionLog(
        `Group modification: ${type} at stage ${stageId}, group ${groupIndex}, task ${taskIndex}`
      );

      setStageTaskIds((prev) => {
        const currentTaskIds = [...(prev[stageId] || [])].map((group) => [...group]);
        const currentGroup = currentTaskIds[groupIndex];
        if (!currentGroup) return prev;

        switch (type) {
          case GroupModificationType.TASK_GROUP_UP: {
            if (groupIndex > 0) {
              const taskId = currentGroup[taskIndex];
              if (!taskId) break;
              // Remove from current group
              currentGroup.splice(taskIndex, 1);
              if (currentGroup.length === 0) {
                currentTaskIds.splice(groupIndex, 1);
              }
              // Insert as new group before previous group
              currentTaskIds.splice(groupIndex - 1, 0, [taskId]);
            }
            break;
          }
          case GroupModificationType.TASK_GROUP_DOWN: {
            if (groupIndex < currentTaskIds.length - 1) {
              const taskId = currentGroup[taskIndex];
              if (!taskId) break;
              // Remove from current group
              currentGroup.splice(taskIndex, 1);
              if (currentGroup.length === 0) {
                currentTaskIds.splice(groupIndex, 1);
                // Insert after the (now shifted) next group
                currentTaskIds.splice(groupIndex + 1, 0, [taskId]);
              } else {
                // Insert after the next group
                currentTaskIds.splice(groupIndex + 2, 0, [taskId]);
              }
            }
            break;
          }
          case GroupModificationType.MERGE_GROUP_UP: {
            if (groupIndex > 0) {
              const taskId = currentGroup[taskIndex];
              if (!taskId) break;
              // Remove from current group
              currentGroup.splice(taskIndex, 1);
              if (currentGroup.length === 0) {
                currentTaskIds.splice(groupIndex, 1);
              }
              // Add to previous group
              currentTaskIds[groupIndex - 1]?.push(taskId);
            }
            break;
          }
          case GroupModificationType.MERGE_GROUP_DOWN: {
            if (groupIndex < currentTaskIds.length - 1) {
              const taskId = currentGroup[taskIndex];
              if (!taskId) break;
              // Remove from current group
              currentGroup.splice(taskIndex, 1);
              const wasEmpty = currentGroup.length === 0;
              if (wasEmpty) {
                currentTaskIds.splice(groupIndex, 1);
              }
              // Add to next group (adjust index if we removed current group)
              const nextGroupIndex = wasEmpty ? groupIndex : groupIndex + 1;
              currentTaskIds[nextGroupIndex]?.push(taskId);
            }
            break;
          }
          case GroupModificationType.UNGROUP_ALL_TASKS: {
            // Replace the group with individual groups
            currentTaskIds.splice(groupIndex, 1, ...currentGroup.map((id) => [id]));
            break;
          }
          case GroupModificationType.SPLIT_GROUP: {
            const taskId = currentGroup[taskIndex];
            if (!taskId) break;
            // Remove from current group
            currentGroup.splice(taskIndex, 1);
            // Insert as new group after current group
            currentTaskIds.splice(groupIndex + 1, 0, [taskId]);
            break;
          }
          case GroupModificationType.REMOVE_GROUP: {
            currentTaskIds.splice(groupIndex, 1);
            break;
          }
          case GroupModificationType.REMOVE_TASK: {
            currentGroup.splice(taskIndex, 1);
            if (currentGroup.length === 0) {
              currentTaskIds.splice(groupIndex, 1);
            }
            break;
          }
        }

        return { ...prev, [stageId]: currentTaskIds };
      });
    },
    []
  );

  // Create task nodes for all stages (cross-stage drag enabled by default)
  const taskNodes = useMemo(() => {
    const allTaskNodes: TaskNodeType[] = [];
    initialStages.forEach((stage) => {
      const stageTaskIdsArr = stageTaskIds[stage.id] || [];
      const nodes = createTaskNodes({
        stageId: stage.id,
        taskIds: stageTaskIdsArr,
        tasks,
        stageWidth: stage.width || 304,
        onTaskClick: (taskId) => {
          setSelectedTaskId(taskId);
          setActionLog(`Selected: ${taskId}`);
        },
        onTaskSelect: setSelectedTaskId,
        stageExecution: stage.execution?.stageStatus,
        enableCrossStage: true,
        onGroupModification:
          enableTaskMenu && !stage.isReadOnly ? handleGroupModification(stage.id) : undefined,
        onRequestReplaceTask:
          enableReplaceTask && !stage.isReadOnly
            ? (groupIndex, taskIndex) =>
                setReplaceTargets((prev) => ({ ...prev, [stage.id]: { groupIndex, taskIndex } }))
            : () => {},
      });
      allTaskNodes.push(...nodes);
    });
    return allTaskNodes;
  }, [
    initialStages,
    stageTaskIds,
    tasks,
    enableTaskMenu,
    enableReplaceTask,
    handleGroupModification,
  ]);

  const allNodes = useMemo(() => [...stageNodes, ...taskNodes], [stageNodes, taskNodes]);

  const [nodes, setNodes, onNodesChange] = useNodesState(allNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes((prev) => mergeNodes(prev, allNodes));
  }, [allNodes, setNodes]);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge({ ...connection, type: 'stage' }, eds));
    },
    [setEdges]
  );

  const nodeTypes = useMemo(
    () => ({
      stage: StageNodeWrapper,
      task: TaskNodeWrapper,
      placeholder: (props: any) => <PlaceholderTaskNode {...props} />,
    }),
    []
  );
  const edgeTypes = useMemo(() => ({ stage: StageEdge }), []);

  // Handle task reordering (within same stage)
  const handleTaskReorder = useCallback((params: TaskReorderParams) => {
    const { taskId, stageId, position } = params;
    const depthLabel = position.isParallel ? 'parallel' : 'sequential';
    setActionLog(`Reordered ${taskId} to group ${position.groupIndex} (${depthLabel})`);

    setStageTaskIds((prev) => {
      const currentTaskIds = prev[stageId || ''] || [];
      const newTaskIds = moveTaskWithinStage(currentTaskIds, taskId, position);
      return { ...prev, [stageId || '']: newTaskIds };
    });
  }, []);

  // Handle task move (cross-stage)
  const handleTaskMove = useCallback(
    (params: TaskMoveParams) => {
      const { taskId, sourceStageId, targetStageId, position } = params;
      setActionLog(
        `Moved ${taskId} from ${sourceStageId} to ${targetStageId} at group ${position.groupIndex}${position.isParallel ? ' (parallel)' : ''}`
      );

      const taskInfo = tasks[taskId];
      if (!taskInfo) return;

      setStageTaskIds((prev) => {
        const sourceTaskIds = prev[sourceStageId] || [];
        const targetTaskIds = prev[targetStageId] || [];

        const { sourceTaskIds: newSourceTaskIds, targetTaskIds: newTargetTaskIds } =
          moveTaskBetweenStages(sourceTaskIds, targetTaskIds, taskId, position);

        return {
          ...prev,
          [sourceStageId]: newSourceTaskIds,
          [targetStageId]: newTargetTaskIds,
        };
      });
    },
    [tasks]
  );

  // Handle task copy (cross-stage with Alt/Cmd)
  const handleTaskCopy = useCallback(
    (params: TaskCopyParams) => {
      const { taskId, newTaskId, targetStageId, position } = params;
      setActionLog(
        `Copied ${taskId} to ${newTaskId} in ${targetStageId} at group ${position.groupIndex}${position.isParallel ? ' (parallel)' : ''}`
      );

      const taskInfo = tasks[taskId];
      if (!taskInfo) return;

      // Add copied task to tasks
      setTasks((prev) => ({
        ...prev,
        [newTaskId]: {
          ...taskInfo,
          label: `${taskInfo.label} (Copy)`,
        },
      }));

      // Insert copied task at position
      setStageTaskIds((prev) => {
        const targetTaskIds = prev[targetStageId] || [];
        const newTargetTaskIds = insertTaskAtPosition(targetTaskIds, newTaskId, position);
        return { ...prev, [targetStageId]: newTargetTaskIds };
      });
    },
    [tasks]
  );

  // Handle task paste (keyboard shortcut)
  const handleTaskPaste = useCallback((params: TaskPasteParams) => {
    const { newTaskId, originalData, targetStageId } = params;
    setActionLog(`Pasted as ${newTaskId}`);

    setTasks((prev) => ({
      ...prev,
      [newTaskId]: {
        label: `${originalData.label} (Copy)`,
        taskType: originalData.taskType as string,
        icon: originalData.iconElement ?? (
          <TaskIcon type={TaskItemTypeValues.AgenticProcess} size="sm" />
        ),
        execution: originalData.execution,
      } as TaskInfo,
    }));

    setStageTaskIds((prev) => ({
      ...prev,
      [targetStageId]: [...(prev[targetStageId] || []), [newTaskId]],
    }));
  }, []);

  return (
    <ReactFlowProvider>
      <InteractiveCanvasInner
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onTaskReorder={handleTaskReorder}
        onTaskMove={handleTaskMove}
        onTaskCopy={handleTaskCopy}
        onTaskPaste={handleTaskPaste}
        selectedTaskId={selectedTaskId}
        stageTaskIds={stageTaskIds}
        actionLog={actionLog}
        showInstructions={showInstructions}
      />
    </ReactFlowProvider>
  );
};

// Inner component that uses React Flow hooks
interface InteractiveCanvasInnerProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: any;
  onEdgesChange: any;
  onConnect: (connection: Connection) => void;
  nodeTypes: any;
  edgeTypes: any;
  onTaskReorder: (params: TaskReorderParams) => void;
  onTaskMove?: (params: TaskMoveParams) => void;
  onTaskCopy?: (params: TaskCopyParams) => void;
  onTaskPaste: (params: TaskPasteParams) => void;
  selectedTaskId: string | null;
  stageTaskIds: Record<string, string[][]>;
  actionLog: string;
  showInstructions: boolean;
}

const InteractiveCanvasInner = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  nodeTypes,
  edgeTypes,
  onTaskReorder,
  onTaskMove,
  onTaskCopy,
  onTaskPaste,
  selectedTaskId,
  stageTaskIds,
  actionLog,
  showInstructions,
}: InteractiveCanvasInnerProps) => {
  const { dragState, handlers } = useCrossStageTaskDrag({
    onTaskReorder,
    onTaskMove,
    onTaskCopy,
  });

  // Find which stage the selected task is in
  const selectedTaskStageId = useMemo(() => {
    if (!selectedTaskId) return null;
    for (const [stageId, taskIds] of Object.entries(stageTaskIds)) {
      if (taskIds.flat().includes(selectedTaskId)) {
        return stageId;
      }
    }
    return null;
  }, [selectedTaskId, stageTaskIds]);

  useTaskCopyPaste(
    { onTaskPaste },
    {
      selectedTaskId,
      targetStageId: selectedTaskStageId || '',
      targetTaskIds: stageTaskIds[selectedTaskStageId || ''] || [],
      enabled: !!selectedTaskId,
    }
  );

  return (
    <CrossStageDragProvider value={{ dragState }}>
      <BaseCanvas
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        mode="design"
        connectionMode={ConnectionMode.Strict}
        defaultEdgeOptions={{ type: 'stage' }}
        connectionLineComponent={StageConnectionEdge}
        elevateEdgesOnSelect
        onNodeDragStart={handlers.onNodeDragStart}
        onNodeDrag={handlers.onNodeDrag}
        onNodeDragStop={handlers.onNodeDragStop}
        fitView
      >
        <Panel position="bottom-right">
          <CanvasPositionControls translations={DefaultCanvasTranslations} />
        </Panel>
        {showInstructions && (
          <Panel position="bottom-left">
            <div
              style={{
                background: 'var(--uix-palette-surface-paper)',
                padding: '8px 16px',
                borderRadius: '4px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                maxWidth: '300px',
              }}
            >
              <strong>Instructions:</strong>
              <ul style={{ margin: '8px 0', paddingLeft: '16px', fontSize: '12px' }}>
                <li>Click a task to select it</li>
                <li>Drag tasks to reorder</li>
                <li>Ctrl/Cmd+C to copy selected task</li>
                <li>Ctrl/Cmd+V to paste task</li>
              </ul>
            </div>
          </Panel>
        )}
        {actionLog && (
          <Panel position="top-left">
            <div
              style={{
                background: 'var(--uix-palette-surface-paper)',
                padding: '8px 16px',
                borderRadius: '4px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
            >
              {actionLog}
            </div>
          </Panel>
        )}
      </BaseCanvas>
    </CrossStageDragProvider>
  );
};

// ============================================================================
// Stories
// ============================================================================

/**
 * Default stage with no tasks - shows empty state
 */
export const Default: Story = {
  render: () => {
    const tasks: Record<string, TaskInfo> = {};

    return (
      <div style={{ width: '100vw', height: '100vh' }}>
        <InteractiveStageCanvas
          stages={[
            {
              id: 'stage-1',
              label: 'Application',
              taskIds: [],
              position: { x: 48, y: 96 },
              width: 304,
            },
            {
              id: 'stage-2',
              label: 'Processing with a really really really long label that might wrap',
              taskIds: [],
              position: { x: 400, y: 96 },
              width: 304,
            },
          ]}
          tasks={tasks}
          showInstructions={false}
          onTaskAdd={() => window.alert('Add task functionality')}
        />
      </div>
    );
  },
};

/**
 * Stage with task icons showing different task types
 */
export const WithTaskIcons: Story = {
  render: () => {
    const tasks: Record<string, TaskInfo> = {
      'agent-task': {
        label: 'Agent Task',
        taskType: 'uipath.case-management.agent',
        icon: <TaskIcon type={TaskItemTypeValues.Agent} size="sm" />,
      },
      'rpa-task': {
        label: 'RPA Automation',
        taskType: 'uipath.case-management.rpa',
        icon: <TaskIcon type={TaskItemTypeValues.Automation} size="sm" />,
      },
      'api-task': {
        label: 'API Automation',
        taskType: 'uipath.case-management.api-workflow',
        icon: <TaskIcon type={TaskItemTypeValues.ApiAutomation} size="sm" />,
      },
      'human-task': {
        label: 'Human in the Loop',
        taskType: 'uipath.case-management.run-human-action',
        icon: <TaskIcon type={TaskItemTypeValues.User} size="sm" />,
      },
      'process-task': {
        label: 'Agentic Process',
        taskType: 'uipath.case-management.process',
        icon: <TaskIcon type={TaskItemTypeValues.AgenticProcess} size="sm" />,
      },
    };

    return (
      <div style={{ width: '100vw', height: '100vh' }}>
        <InteractiveStageCanvas
          stages={[
            {
              id: 'stage-1',
              label: 'Task Icons Demo',
              taskIds: [
                ['agent-task'],
                ['rpa-task'],
                ['api-task'],
                ['human-task'],
                ['process-task'],
              ],
              position: { x: 48, y: 96 },
              width: 304,
            },
          ]}
          tasks={tasks}
        />
      </div>
    );
  },
};

/**
 * Stages showing execution status with completed, in-progress, and failed states
 */
export const ExecutionStatus: Story = {
  render: () => {
    const tasks: Record<string, TaskInfo> = {
      // Stage 1 tasks
      's1-task-1': {
        label: 'KYC and AML Checks',
        taskType: 'uipath.case-management.rpa',
        icon: <TaskIcon type={TaskItemTypeValues.Automation} size="sm" />,
        execution: { status: 'Completed', duration: '2h 15m' },
      },
      's1-task-2': {
        label: 'Document Verification is going to be very very really long',
        taskType: 'uipath.case-management.process',
        icon: <TaskIcon type={TaskItemTypeValues.AgenticProcess} size="sm" />,
        execution: { status: 'Completed', duration: '1h 45m' },
      },
      // Stage 2 tasks
      's2-task-1': {
        label: 'Liability Check',
        taskType: 'uipath.case-management.rpa',
        icon: <TaskIcon type={TaskItemTypeValues.Automation} size="sm" />,
        execution: {
          status: 'Completed',
          duration: '1h 30m',
          retryDuration: '25m',
          badge: 'Reworked',
          badgeStatus: 'error',
          retryCount: 2,
        },
      },
      's2-task-2': {
        label: 'Credit Review',
        taskType: 'uipath.case-management.process',
        icon: <TaskIcon type={TaskItemTypeValues.AgenticProcess} size="sm" />,
        execution: {
          status: 'Completed',
          duration: '1h 30m',
          retryDuration: '32m',
          badge: 'Reworked',
          retryCount: 1,
        },
      },
      's2-task-3': {
        label: 'Address Verification',
        taskType: 'uipath.case-management.rpa',
        icon: <TaskIcon type={TaskItemTypeValues.Automation} size="sm" />,
        execution: { status: 'Completed', duration: '30m' },
      },
      's2-task-4': {
        label: 'Property Verification',
        taskType: 'uipath.case-management.rpa',
        icon: <TaskIcon type={TaskItemTypeValues.Automation} size="sm" />,
        execution: {
          status: 'Completed',
          duration: '1h 30m',
          retryDuration: '1h 5m',
          badge: 'Reworked',
          retryCount: 3,
        },
      },
      's2-task-5': {
        label: 'Processing Review',
        taskType: 'uipath.case-management.agent',
        icon: <TaskIcon type={TaskItemTypeValues.Agent} size="sm" />,
        execution: { status: 'Completed', duration: '1h 15m' },
      },
      // Stage 3 tasks
      's3-task-1': {
        label: 'Report Ordering',
        taskType: 'uipath.case-management.process',
        icon: <TaskIcon type={TaskItemTypeValues.AgenticProcess} size="sm" />,
        execution: { status: 'Completed', duration: '2h 15m' },
      },
      's3-task-2': {
        label: 'Underwriting Verification',
        taskType: 'uipath.case-management.rpa',
        icon: <TaskIcon type={TaskItemTypeValues.Automation} size="sm" />,
        execution: { status: 'InProgress' },
      },
      // Stage 4 tasks
      's4-task-1': {
        label: 'Loan Packet Creation',
        taskType: 'uipath.case-management.process',
        icon: <TaskIcon type={TaskItemTypeValues.AgenticProcess} size="sm" />,
        execution: { status: 'NotExecuted' },
      },
      's4-task-2': {
        label: 'Customer Signing',
        taskType: 'uipath.case-management.run-human-action',
        icon: <TaskIcon type={TaskItemTypeValues.User} size="sm" />,
        execution: { status: 'NotExecuted' },
      },
      's4-task-3': {
        label: 'Generate Audit Report',
        taskType: 'uipath.case-management.process',
        icon: <TaskIcon type={TaskItemTypeValues.AgenticProcess} size="sm" />,
        execution: { status: 'NotExecuted' },
      },
      // Rejected stage tasks
      'rejected-task-1': {
        label: 'Customer Notification',
        taskType: 'uipath.case-management.agent',
        icon: <TaskIcon type={TaskItemTypeValues.Agent} size="sm" />,
        execution: { status: 'NotExecuted' },
      },
      'rejected-task-2': {
        label: 'Generate Audit Report',
        taskType: 'uipath.case-management.process',
        icon: <TaskIcon type={TaskItemTypeValues.AgenticProcess} size="sm" />,
        execution: { status: 'NotExecuted' },
      },
    };

    const edges: Edge[] = [
      {
        id: 'e1',
        type: 'stage',
        source: 'stage-1',
        sourceHandle: 'stage-1____source____right',
        target: 'stage-2',
        targetHandle: 'stage-2____target____left',
      },
      {
        id: 'e2',
        type: 'stage',
        source: 'stage-2',
        sourceHandle: 'stage-2____source____right',
        target: 'stage-3',
        targetHandle: 'stage-3____target____left',
      },
      {
        id: 'e3',
        type: 'stage',
        source: 'stage-3',
        sourceHandle: 'stage-3____source____right',
        target: 'stage-4',
        targetHandle: 'stage-4____target____left',
      },
    ];

    return (
      <div style={{ width: '100vw', height: '100vh' }}>
        <InteractiveStageCanvas
          stages={[
            {
              id: 'stage-1',
              label: 'Application',
              taskIds: [['s1-task-1'], ['s1-task-2']],
              position: { x: 48, y: 96 },
              width: 304,
              isReadOnly: true,
              execution: {
                stageStatus: { status: 'Completed', duration: 'SLA: 4h' },
                taskStatus: {},
              },
            },
            {
              id: 'stage-2',
              label: 'Processing',
              taskIds: [['s2-task-1'], ['s2-task-2'], ['s2-task-3', 's2-task-4'], ['s2-task-5']],
              position: { x: 400, y: 96 },
              width: 304,
              isReadOnly: true,
              execution: {
                stageStatus: { status: 'Completed', duration: 'SLA: 6h 15m' },
                taskStatus: {},
              },
            },
            {
              id: 'stage-3',
              label: 'Underwriting',
              taskIds: [['s3-task-1'], ['s3-task-2']],
              position: { x: 752, y: 96 },
              width: 304,
              isReadOnly: true,
              execution: {
                stageStatus: {
                  status: 'InProgress',
                  label: 'In progress',
                  duration: 'SLA: 2h 15m',
                },
                taskStatus: {},
              },
            },
            {
              id: 'stage-4',
              label: 'Closing',
              taskIds: [['s4-task-1'], ['s4-task-2'], ['s4-task-3']],
              position: { x: 1104, y: 96 },
              width: 304,
              isReadOnly: true,
              execution: {
                stageStatus: { status: 'NotExecuted', label: 'Not started' },
                taskStatus: {},
              },
            },
            {
              id: 'rejected',
              label: 'Rejected',
              taskIds: [['rejected-task-1'], ['rejected-task-2']],
              position: { x: 1104, y: 400 },
              width: 304,
              isException: true,
              isReadOnly: true,
              execution: {
                stageStatus: { status: 'NotExecuted', label: 'Not started' },
                taskStatus: {},
              },
            },
          ]}
          tasks={tasks}
          edges={edges}
          showInstructions={false}
        />
      </div>
    );
  },
};

/**
 * Interactive design mode with editable and read-only stages side by side
 */
export const InteractiveTaskManagement: Story = {
  render: () => {
    const tasks: Record<string, TaskInfo> = {
      // Editable stage tasks
      'task-1': {
        label: 'Initial Task',
        taskType: 'uipath.case-management.rpa',
        icon: <TaskIcon type={TaskItemTypeValues.Automation} size="sm" />,
      },
      'task-2': {
        label: 'Credit Review with a very long label that will be truncated and show tooltip',
        taskType: 'uipath.case-management.process',
        icon: <TaskIcon type={TaskItemTypeValues.AgenticProcess} size="sm" />,
      },
      'task-3': {
        label: 'Address Verification',
        taskType: 'uipath.case-management.rpa',
        icon: <TaskIcon type={TaskItemTypeValues.Automation} size="sm" />,
      },
      'task-4': {
        label: 'Property Verification with Long Name',
        taskType: 'uipath.case-management.rpa',
        icon: <TaskIcon type={TaskItemTypeValues.Automation} size="sm" />,
      },
      'task-5': {
        label: 'Background Check',
        taskType: 'uipath.case-management.agent',
        icon: <TaskIcon type={TaskItemTypeValues.Agent} size="sm" />,
      },
      'task-6': {
        label: 'Final Review Task with Extended Description',
        taskType: 'uipath.case-management.agent',
        icon: <TaskIcon type={TaskItemTypeValues.Agent} size="sm" />,
      },
      // Execution stage tasks
      'exec-task-1': {
        label: 'Task with execution status and very long name that will be truncated',
        taskType: 'uipath.case-management.rpa',
        icon: <TaskIcon type={TaskItemTypeValues.Automation} size="sm" />,
        execution: {
          status: 'Completed',
          duration: '30m',
          badge: 'Completed',
          badgeStatus: 'info',
        },
      },
      'exec-task-2': {
        label: 'Credit Review Processing',
        taskType: 'uipath.case-management.process',
        icon: <TaskIcon type={TaskItemTypeValues.AgenticProcess} size="sm" />,
        execution: {
          status: 'InProgress',
          duration: '1h 15m',
          retryDuration: '15m',
          badge: 'Retry',
          badgeStatus: 'warning',
          retryCount: 2,
        },
      },
      'exec-task-3': {
        label: 'Parallel Address Verification Task',
        taskType: 'uipath.case-management.rpa',
        icon: <TaskIcon type={TaskItemTypeValues.Automation} size="sm" />,
        execution: { status: 'Completed', duration: '45m' },
      },
      'exec-task-4': {
        label: 'Parallel Property Verification with Extended Name',
        taskType: 'uipath.case-management.rpa',
        icon: <TaskIcon type={TaskItemTypeValues.Automation} size="sm" />,
        execution: {
          status: 'Failed',
          duration: '20m',
          retryDuration: '10m',
          badge: 'Error',
          badgeStatus: 'error',
          retryCount: 1,
        },
      },
      'exec-task-5': {
        label: 'Final Review and Approval Process',
        taskType: 'uipath.case-management.agent',
        icon: <TaskIcon type={TaskItemTypeValues.Agent} size="sm" />,
        execution: { status: 'NotExecuted' },
      },
    };

    return (
      <div style={{ width: '100vw', height: '100vh' }}>
        <InteractiveStageCanvas
          stages={[
            {
              id: 'design-stage',
              label: 'Design Mode - Editable',
              taskIds: [['task-1'], ['task-2'], ['task-3', 'task-4', 'task-5'], ['task-6']],
              position: { x: 48, y: 96 },
              width: 352,
            },
            {
              id: 'execution-stage',
              label: 'Execution Mode - Read Only',
              taskIds: [
                ['exec-task-1'],
                ['exec-task-2'],
                ['exec-task-3', 'exec-task-4'],
                ['exec-task-5'],
              ],
              position: { x: 448, y: 96 },
              width: 352,
              isReadOnly: true,
              execution: {
                stageStatus: { status: 'InProgress', label: 'In progress', duration: '2h 15m' },
                taskStatus: {},
              },
            },
          ]}
          tasks={tasks}
        />
      </div>
    );
  },
};

/**
 * Complete loan processing workflow with connected stages
 */
export const LoanProcessingWorkflow: Story = {
  render: () => {
    const tasks: Record<string, TaskInfo> = {
      // Application stage
      'app-task-1': {
        label: 'KYC and AML Checks',
        taskType: 'uipath.case-management.rpa',
        icon: <TaskIcon type={TaskItemTypeValues.Automation} size="sm" />,
      },
      'app-task-2': {
        label: 'Document Verification',
        taskType: 'uipath.case-management.process',
        icon: <TaskIcon type={TaskItemTypeValues.AgenticProcess} size="sm" />,
      },
      // Processing stage
      'proc-task-1': {
        label: 'Liability Check',
        taskType: 'uipath.case-management.rpa',
        icon: <TaskIcon type={TaskItemTypeValues.Automation} size="sm" />,
      },
      'proc-task-2': {
        label: 'Credit Review',
        taskType: 'uipath.case-management.process',
        icon: <TaskIcon type={TaskItemTypeValues.AgenticProcess} size="sm" />,
      },
      'proc-task-3': {
        label: 'Address Verification',
        taskType: 'uipath.case-management.rpa',
        icon: <TaskIcon type={TaskItemTypeValues.Automation} size="sm" />,
      },
      'proc-task-4': {
        label: 'Property Verification',
        taskType: 'uipath.case-management.rpa',
        icon: <TaskIcon type={TaskItemTypeValues.Automation} size="sm" />,
      },
      'proc-task-5': {
        label: 'Processing Review',
        taskType: 'uipath.case-management.agent',
        icon: <TaskIcon type={TaskItemTypeValues.Agent} size="sm" />,
      },
      // Underwriting stage
      'uw-task-1': {
        label: 'Report Ordering',
        taskType: 'uipath.case-management.process',
        icon: <TaskIcon type={TaskItemTypeValues.AgenticProcess} size="sm" />,
      },
      'uw-task-2': {
        label: 'Underwriting Verification',
        taskType: 'uipath.case-management.rpa',
        icon: <TaskIcon type={TaskItemTypeValues.Automation} size="sm" />,
      },
      // Closing stage
      'close-task-1': {
        label: 'Loan Packet Creation',
        taskType: 'uipath.case-management.process',
        icon: <TaskIcon type={TaskItemTypeValues.AgenticProcess} size="sm" />,
      },
      'close-task-2': {
        label: 'Customer Signing',
        taskType: 'uipath.case-management.run-human-action',
        icon: <TaskIcon type={TaskItemTypeValues.User} size="sm" />,
      },
      'close-task-3': {
        label: 'Generate Audit Report',
        taskType: 'uipath.case-management.process',
        icon: <TaskIcon type={TaskItemTypeValues.AgenticProcess} size="sm" />,
      },
      // Funding stage
      'fund-task-1': {
        label: 'Disperse Loan',
        taskType: 'uipath.case-management.agent',
        icon: <TaskIcon type={TaskItemTypeValues.Agent} size="sm" />,
      },
      'fund-task-2': {
        label: 'Generate Audit Report',
        taskType: 'uipath.case-management.process',
        icon: <TaskIcon type={TaskItemTypeValues.AgenticProcess} size="sm" />,
      },
      // Exception stages
      'reject-task-1': {
        label: 'Customer Notification',
        taskType: 'uipath.case-management.agent',
        icon: <TaskIcon type={TaskItemTypeValues.Agent} size="sm" />,
      },
      'reject-task-2': {
        label: 'Generate Audit Report',
        taskType: 'uipath.case-management.process',
        icon: <TaskIcon type={TaskItemTypeValues.AgenticProcess} size="sm" />,
      },
      'withdraw-task-1': {
        label: 'Customer Notification',
        taskType: 'uipath.case-management.agent',
        icon: <TaskIcon type={TaskItemTypeValues.Agent} size="sm" />,
      },
      'withdraw-task-2': {
        label: 'Generate Audit Report',
        taskType: 'uipath.case-management.process',
        icon: <TaskIcon type={TaskItemTypeValues.AgenticProcess} size="sm" />,
      },
    };

    const edges: Edge[] = [
      {
        id: 'e1',
        type: 'stage',
        source: 'application',
        sourceHandle: 'application____source____right',
        target: 'processing',
        targetHandle: 'processing____target____left',
      },
      {
        id: 'e2',
        type: 'stage',
        source: 'processing',
        sourceHandle: 'processing____source____right',
        target: 'underwriting',
        targetHandle: 'underwriting____target____left',
      },
      {
        id: 'e3',
        type: 'stage',
        source: 'underwriting',
        sourceHandle: 'underwriting____source____right',
        target: 'closing',
        targetHandle: 'closing____target____left',
      },
      {
        id: 'e4',
        type: 'stage',
        source: 'closing',
        sourceHandle: 'closing____source____right',
        target: 'funding',
        targetHandle: 'funding____target____left',
      },
    ];

    return (
      <div style={{ width: '100vw', height: '100vh' }}>
        <InteractiveStageCanvas
          stages={[
            {
              id: 'application',
              label: 'Application',
              taskIds: [['app-task-1'], ['app-task-2']],
              position: { x: 48, y: 96 },
              width: 304,
            },
            {
              id: 'processing',
              label: 'Processing',
              taskIds: [
                ['proc-task-1'],
                ['proc-task-2'],
                ['proc-task-3', 'proc-task-4'],
                ['proc-task-5'],
              ],
              position: { x: 448, y: 96 },
              width: 304,
            },
            {
              id: 'underwriting',
              label: 'Underwriting',
              taskIds: [['uw-task-1'], ['uw-task-2']],
              position: { x: 848, y: 96 },
              width: 304,
            },
            {
              id: 'closing',
              label: 'Closing',
              taskIds: [['close-task-1'], ['close-task-2'], ['close-task-3']],
              position: { x: 1248, y: 96 },
              width: 304,
            },
            {
              id: 'funding',
              label: 'Funding',
              taskIds: [['fund-task-1'], ['fund-task-2']],
              position: { x: 1648, y: 96 },
              width: 304,
            },
            {
              id: 'rejected',
              label: 'Rejected',
              taskIds: [['reject-task-1'], ['reject-task-2']],
              position: { x: 1248, y: 400 },
              width: 304,
              isException: true,
            },
            {
              id: 'withdrawn',
              label: 'Withdrawn',
              taskIds: [['withdraw-task-1'], ['withdraw-task-2']],
              position: { x: 448, y: 608 },
              width: 304,
              isException: true,
            },
          ]}
          tasks={tasks}
          edges={edges}
        />
      </div>
    );
  },
};

/**
 * Tasks with context menu (TaskMenu) for grouping operations
 * Hover over a task to see the menu icon, click to open the menu
 */
export const WithTaskMenu: Story = {
  render: () => {
    const tasks: Record<string, TaskInfo> = {
      'task-1': {
        label: 'Initial Review',
        taskType: 'uipath.case-management.process',
        icon: <TaskIcon type={TaskItemTypeValues.AgenticProcess} size="sm" />,
      },
      'task-2': {
        label: 'Document Verification',
        taskType: 'uipath.case-management.rpa',
        icon: <TaskIcon type={TaskItemTypeValues.Automation} size="sm" />,
      },
      'task-3': {
        label: 'Address Check',
        taskType: 'uipath.case-management.rpa',
        icon: <TaskIcon type={TaskItemTypeValues.Automation} size="sm" />,
      },
      'task-4': {
        label: 'Background Check',
        taskType: 'uipath.case-management.agent',
        icon: <TaskIcon type={TaskItemTypeValues.Agent} size="sm" />,
      },
      'task-5': {
        label: 'Credit Check',
        taskType: 'uipath.case-management.rpa',
        icon: <TaskIcon type={TaskItemTypeValues.Automation} size="sm" />,
      },
      'task-6': {
        label: 'Final Approval',
        taskType: 'uipath.case-management.run-human-action',
        icon: <TaskIcon type={TaskItemTypeValues.User} size="sm" />,
      },
    };

    return (
      <div style={{ width: '100vw', height: '100vh' }}>
        <InteractiveStageCanvas
          stages={[
            {
              id: 'stage-1',
              label: 'Task Menu Demo',
              taskIds: [['task-1'], ['task-2'], ['task-3', 'task-4', 'task-5'], ['task-6']],
              position: { x: 48, y: 96 },
              width: 304,
            },
          ]}
          tasks={tasks}
        />
      </div>
    );
  },
};

/**
 * Stage with add, replace, and group task functionality.
 * - Click the "+" button in the header to add a new task from the toolbox.
 * - Hover a task and open the context menu to see "Replace task" option.
 * - Clicking "Replace task" opens the toolbox to pick a replacement.
 * - Use the "Replace Task" button in the top-right panel to trigger replacement
 *   from outside the canvas (simulating a properties panel).
 */
const addReplaceInitialTasks: Record<string, TaskInfo> = {
  'task-1': {
    label: 'Initial Review',
    taskType: 'uipath.case-management.process',
    icon: <TaskIcon type={TaskItemTypeValues.AgenticProcess} size="sm" />,
  },
  'task-2': {
    label: 'Document Verification',
    taskType: 'uipath.case-management.rpa',
    icon: <TaskIcon type={TaskItemTypeValues.Automation} size="sm" />,
  },
  'task-3': {
    label: 'Address Check',
    taskType: 'uipath.case-management.rpa',
    icon: <TaskIcon type={TaskItemTypeValues.Automation} size="sm" />,
  },
  'task-4': {
    label: 'Background Check',
    taskType: 'uipath.case-management.agent',
    icon: <TaskIcon type={TaskItemTypeValues.Agent} size="sm" />,
  },
  'task-5': {
    label: 'Final Approval',
    taskType: 'uipath.case-management.run-human-action',
    icon: <TaskIcon type={TaskItemTypeValues.User} size="sm" />,
  },
};

const addReplaceTaskOptions: ListItem[] = [
  {
    id: 'opt-agent',
    name: 'Agent Task',
    data: { taskType: 'uipath.case-management.agent' },
    icon: { Component: () => <TaskIcon type={TaskItemTypeValues.Agent} size="sm" /> },
  },
  {
    id: 'opt-automation',
    name: 'RPA Automation',
    data: { taskType: 'uipath.case-management.rpa' },
    icon: { Component: () => <TaskIcon type={TaskItemTypeValues.Automation} size="sm" /> },
  },
  {
    id: 'opt-api',
    name: 'API Automation',
    data: { taskType: 'uipath.case-management.api-workflow' },
    icon: { Component: () => <TaskIcon type={TaskItemTypeValues.ApiAutomation} size="sm" /> },
  },
  {
    id: 'opt-human',
    name: 'Human in the Loop',
    data: { taskType: 'uipath.case-management.run-human-action' },
    icon: { Component: () => <TaskIcon type={TaskItemTypeValues.User} size="sm" /> },
  },
  {
    id: 'opt-process',
    name: 'Agentic Process',
    data: { taskType: 'uipath.case-management.process' },
    icon: { Component: () => <TaskIcon type={TaskItemTypeValues.AgenticProcess} size="sm" /> },
  },
];

const AddAndReplaceTasksStory = () => {
  const stageId = 'stage-1';

  const [stageTaskIds, setStageTaskIds] = useState<Record<string, string[][]>>({
    [stageId]: [['task-1'], ['task-2'], ['task-3', 'task-4'], ['task-5']],
  });
  const [allTasks, setAllTasks] = useState(addReplaceInitialTasks);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [actionLog, setActionLog] = useState<string>('');
  const [pendingReplaceTask, setPendingReplaceTask] = useState<
    { groupIndex: number; taskIndex: number } | undefined
  >();
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);

  // Handle add task from toolbox
  const handleAddTaskFromToolbox = useCallback(
    (taskItem: ListItem) => {
      const newTaskId = `added-${Date.now()}`;
      const IconComp = taskItem.icon?.Component;

      setAllTasks((prev) => ({
        ...prev,
        [newTaskId]: {
          label: taskItem.name,
          taskType: taskItem.data?.taskType || 'uipath.case-management.process',
          icon: IconComp ? (
            <IconComp />
          ) : (
            <TaskIcon type={TaskItemTypeValues.AgenticProcess} size="sm" />
          ),
        },
      }));

      setStageTaskIds((prev) => ({
        ...prev,
        [stageId]: [...(prev[stageId] || []), [newTaskId]],
      }));

      setActionLog(`Added task: ${taskItem.name}`);
    },
    [stageId]
  );

  // Handle replace task from toolbox
  const handleReplaceTask = useCallback(
    (newTask: ListItem, groupIndex: number, taskIndex: number) => {
      const newTaskId = `replaced-${Date.now()}`;
      const IconComp = newTask.icon?.Component;

      setAllTasks((prev) => ({
        ...prev,
        [newTaskId]: {
          label: newTask.name,
          taskType: newTask.data?.taskType || 'uipath.case-management.process',
          icon: IconComp ? (
            <IconComp />
          ) : (
            <TaskIcon type={TaskItemTypeValues.AgenticProcess} size="sm" />
          ),
        },
      }));

      setStageTaskIds((prev) => {
        const currentTaskIds = [...(prev[stageId] || [])].map((group) => [...group]);
        const targetGroup = currentTaskIds[groupIndex];
        if (targetGroup && targetGroup[taskIndex] !== undefined) {
          targetGroup[taskIndex] = newTaskId;
        }
        return { ...prev, [stageId]: currentTaskIds };
      });

      setPendingReplaceTask(undefined);
      setActionLog(
        `Replaced task at group ${groupIndex}, task ${taskIndex} with "${newTask.name}"`
      );
    },
    [stageId]
  );

  // Handle group modification from context menu
  const handleGroupModification = useCallback(
    (type: GroupModificationType, groupIndex: number, taskIndex: number) => {
      setActionLog(`Group modification: ${type} at group ${groupIndex}, task ${taskIndex}`);

      setStageTaskIds((prev) => {
        const handler = getHandlerForModificationType(
          createGroupModificationHandlers<string>(),
          type
        );
        const currentTaskIds = (prev[stageId] || []).map((group) => [...group]);
        const updatedTaskIds = handler(currentTaskIds, groupIndex, taskIndex);
        return { ...prev, [stageId]: updatedTaskIds };
      });
    },
    [stageId]
  );

  // Create menu items for task selection (simulates properties panel)
  const currentTaskIds = stageTaskIds[stageId] || [];
  const taskMenuItems = useMemo<IMenuItem[]>(() => {
    return currentTaskIds.flatMap((group, groupIndex) =>
      group.map((taskId, taskIndex) => {
        const taskInfo = allTasks[taskId];
        return {
          title: taskInfo?.label || taskId,
          variant: 'item' as const,
          startIcon: taskInfo?.icon,
          onClick: () => {
            setSelectedTaskId(taskId);
            setPendingReplaceTask({ groupIndex, taskIndex });
            setMenuAnchorEl(null);
          },
        };
      })
    );
  }, [currentTaskIds, allTasks]);

  const replaceButtonLabel = useMemo(() => {
    if (pendingReplaceTask) {
      const taskId = currentTaskIds[pendingReplaceTask.groupIndex]?.[pendingReplaceTask.taskIndex];
      const taskInfo = taskId ? allTasks[taskId] : undefined;
      if (taskInfo) {
        return `Replacing: ${taskInfo.label}`;
      }
    }
    return 'Replace Task';
  }, [pendingReplaceTask, currentTaskIds, allTasks]);

  // Create stage nodes
  const stageNodes: Node[] = useMemo(
    () => [
      {
        id: stageId,
        type: 'stage',
        position: { x: 48, y: 96 },
        style: { width: 304 },
        data: {
          nodeType: 'case-management:Stage',
          stageDetails: {
            label: 'Add, Replace & Group Tasks',
            taskIds: stageTaskIds[stageId] || [],
            selectedTasks: selectedTaskId ? [selectedTaskId] : undefined,
          },
          pendingReplaceTask,
          taskOptions: addReplaceTaskOptions,
          onAddTaskFromToolbox: handleAddTaskFromToolbox,
          onReplaceTaskFromToolbox: handleReplaceTask,
          onTaskClick: (taskId: string) => {
            setSelectedTaskId(taskId);
            setActionLog(`Selected: ${taskId}`);
          },
        } as Partial<StageNodeProps>,
      },
    ],
    [
      stageTaskIds,
      selectedTaskId,
      pendingReplaceTask,
      handleAddTaskFromToolbox,
      handleReplaceTask,
    ]
  );

  // Create task nodes
  const taskNodes = useMemo(() => {
    return createTaskNodes({
      stageId,
      taskIds: stageTaskIds[stageId] || [],
      tasks: allTasks,
      stageWidth: 304,
      onTaskClick: (taskId) => {
        setSelectedTaskId(taskId);
        setActionLog(`Selected: ${taskId}`);
      },
      onTaskSelect: setSelectedTaskId,
      enableCrossStage: false,
      onGroupModification: handleGroupModification,
      onRequestReplaceTask: (groupIndex, taskIndex) => {
        setPendingReplaceTask({ groupIndex, taskIndex });
      },
    });
  }, [stageTaskIds, allTasks, handleGroupModification]);

  const allNodes = useMemo(() => [...stageNodes, ...taskNodes], [stageNodes, taskNodes]);
  const allNodesRef = useRef(allNodes);
  allNodesRef.current = allNodes;

  const [nodes, setNodes] = useState(allNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    setNodes((prev) => mergeNodes(prev, allNodes));
  }, [allNodes]);

  // Custom onNodesChange that applies RF changes then re-merges our computed data
  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => {
      const updated = applyNodeChanges(changes, nds);
      return mergeNodes(updated, allNodesRef.current);
    });
  }, []);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge({ ...connection, type: 'stage' }, eds)),
    [setEdges]
  );

  const nodeTypes = useMemo(
    () => ({
      stage: StageNodeWrapper,
      task: TaskNodeWrapper,
      placeholder: (props: any) => <PlaceholderTaskNode {...props} />,
    }),
    []
  );
  const edgeTypes = useMemo(() => ({ stage: StageEdge }), []);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlowProvider>
        <BaseCanvas
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          mode="design"
          connectionMode={ConnectionMode.Strict}
          defaultEdgeOptions={{ type: 'stage' }}
          connectionLineComponent={StageConnectionEdge}
          elevateEdgesOnSelect
          defaultViewport={{ x: 0, y: 0, zoom: 1.5 }}
        >
          <Panel position="top-right">
            <ApButton
              variant="primary"
              label={replaceButtonLabel}
              onClick={(e) => setMenuAnchorEl(e.currentTarget as HTMLElement)}
            />
            <ApMenu
              isOpen={Boolean(menuAnchorEl)}
              anchorEl={menuAnchorEl}
              menuItems={taskMenuItems}
              onClose={() => setMenuAnchorEl(null)}
              width={300}
            />
          </Panel>
          <Panel position="bottom-right">
            <CanvasPositionControls translations={DefaultCanvasTranslations} />
          </Panel>
          {actionLog && (
            <Panel position="top-left">
              <div
                style={{
                  background: 'var(--uix-palette-surface-paper)',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}
              >
                {actionLog}
              </div>
            </Panel>
          )}
        </BaseCanvas>
      </ReactFlowProvider>
    </div>
  );
};

export const AddAndReplaceTasks: Story = {
  name: 'Add, Replace, and Group Tasks',
  render: () => <AddAndReplaceTasksStory />,
};

// Module-level constants for AddTaskLoadingStory to prevent re-renders
const loadingStoryStages = [
  { id: 'empty-stage', label: 'Empty Stage (click +)', position: { x: 48, y: 96 }, width: 304 },
  { id: 'tasks-stage', label: 'With Tasks (click +)', position: { x: 400, y: 96 }, width: 304 },
] as const;

const loadingStoryInitialTaskIds: Record<string, string[][]> = {
  'empty-stage': [],
  'tasks-stage': [['task-1'], ['task-2']],
};

const loadingStoryInitialTasks: Record<string, TaskInfo> = {
  'task-1': {
    label: 'Existing Task',
    taskType: 'uipath.case-management.rpa',
    icon: <TaskIcon type={TaskItemTypeValues.Automation} size="sm" />,
  },
  'task-2': {
    label: 'Another Task',
    taskType: 'uipath.case-management.process',
    icon: <TaskIcon type={TaskItemTypeValues.AgenticProcess} size="sm" />,
  },
};

/**
 * Demonstrates the add task loading state.
 * - Click the "+" button to simulate adding a task with a 3-second API delay.
 * - The button shows a spinner and is disabled while loading.
 * - The empty stage "Add first task" link is also disabled while loading.
 */
const AddTaskLoadingStory = () => {
  const [loadingStages, setLoadingStages] = useState<Record<string, boolean>>({});
  const [stageTaskIds, setStageTaskIds] = useState<Record<string, string[][]>>(loadingStoryInitialTaskIds);
  const [allTasks, setAllTasks] = useState<Record<string, TaskInfo>>(loadingStoryInitialTasks);

  const handleTaskAdd = useCallback((stageIdToLoad: string) => {
    setLoadingStages((prev) => ({ ...prev, [stageIdToLoad]: true }));

    // Simulate 3-second API delay, then add a new task
    setTimeout(() => {
      const newTaskId = `new-task-${Date.now()}`;
      setAllTasks((prev) => ({
        ...prev,
        [newTaskId]: {
          label: 'New Task',
          taskType: 'uipath.case-management.agent',
          icon: <TaskIcon type={TaskItemTypeValues.Agent} size="sm" />,
        },
      }));

      setStageTaskIds((prev) => ({
        ...prev,
        [stageIdToLoad]: [...(prev[stageIdToLoad] || []), [newTaskId]],
      }));

      setLoadingStages((prev) => ({ ...prev, [stageIdToLoad]: false }));
    }, 3000);
  }, []);

  // Create stage nodes with addTaskLoading
  const stageNodes: Node[] = useMemo(
    () =>
      loadingStoryStages.map((stage) => ({
        id: stage.id,
        type: 'stage',
        position: stage.position,
        style: { width: stage.width },
        data: {
          nodeType: 'case-management:Stage',
          stageDetails: {
            label: stage.label,
            taskIds: stageTaskIds[stage.id] || [],
          },
          addTaskLoading: loadingStages[stage.id] || false,
          onTaskAdd: () => handleTaskAdd(stage.id),
        } as Partial<StageNodeProps>,
      })),
    [stageTaskIds, loadingStages, handleTaskAdd]
  );

  // Create task nodes for all stages
  const taskNodes = useMemo(() => {
    const allTaskNodes: Node[] = [];
    for (const stage of loadingStoryStages) {
      const ids = stageTaskIds[stage.id] || [];
      const nodes = createTaskNodes({
        stageId: stage.id,
        taskIds: ids,
        tasks: allTasks,
        stageWidth: stage.width,
        enableCrossStage: false,
        onRequestReplaceTask: () => {},
      });
      allTaskNodes.push(...nodes);
    }
    return allTaskNodes;
  }, [stageTaskIds, allTasks]);

  const allNodes = useMemo(() => [...stageNodes, ...taskNodes], [stageNodes, taskNodes]);
  const allNodesRef = useRef(allNodes);
  allNodesRef.current = allNodes;

  const [nodes, setNodes] = useState(allNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Sync computed data into nodes, preserving RF internal state (selected, etc.)
  useEffect(() => {
    setNodes((prev) => mergeNodes(prev, allNodes));
  }, [allNodes]);

  // Custom onNodesChange that applies RF changes then re-merges our computed data
  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => {
      const updated = applyNodeChanges(changes, nds);
      return mergeNodes(updated, allNodesRef.current);
    });
  }, []);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge({ ...connection, type: 'stage' }, eds)),
    [setEdges]
  );

  const nodeTypes = useMemo(
    () => ({
      stage: StageNodeWrapper,
      task: TaskNodeWrapper,
      placeholder: (props: any) => <PlaceholderTaskNode {...props} />,
    }),
    []
  );
  const edgeTypes = useMemo(() => ({ stage: StageEdge }), []);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlowProvider>
        <BaseCanvas
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          mode="design"
          connectionMode={ConnectionMode.Strict}
          defaultEdgeOptions={{ type: 'stage' }}
          connectionLineComponent={StageConnectionEdge}
          elevateEdgesOnSelect
          defaultViewport={{ x: 0, y: 0, zoom: 1.5 }}
        >
          <Panel position="bottom-right">
            <CanvasPositionControls translations={DefaultCanvasTranslations} />
          </Panel>
        </BaseCanvas>
      </ReactFlowProvider>
    </div>
  );
};

export const AddTaskLoading: Story = {
  name: 'Add Task Loading State',
  render: () => <AddTaskLoadingStory />,
};
