/**
 * TaskNode Stories
 *
 * Demonstrates TaskNode component as React Flow nodes within StageNode containers.
 * All stories support drag to reorder and copy/paste functionality.
 */

import type { Meta, StoryObj } from '@storybook/react';
import type { Node } from '@uipath/apollo-react/canvas/xyflow/react';
import {
  ConnectionMode,
  Panel,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
} from '@uipath/apollo-react/canvas/xyflow/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CrossStageDragProvider } from '../../hooks/CrossStageDragContext';
import { type TaskReorderParams, useCrossStageTaskDrag } from '../../hooks/useCrossStageTaskDrag';
import { type TaskPasteParams, useTaskCopyPaste } from '../../hooks/useTaskCopyPaste';
import { DefaultCanvasTranslations } from '../../types';
import { BaseCanvas } from '../BaseCanvas';
import { CanvasPositionControls } from '../CanvasPositionControls';
import { StageConnectionEdge } from '../StageNode/StageConnectionEdge';
import { StageEdge } from '../StageNode/StageEdge';
import type { StageNodeProps } from '../StageNode/StageNode.types';
import { StageNode } from '../StageNode/StageNode';
import { TaskIcon, TaskItemTypeValues } from '../TaskIcon';
import { PlaceholderTaskNode } from './PlaceholderTaskNode';
import { TaskNode } from './TaskNode';
import type { TaskNodeData, TaskNode as TaskNodeType } from './TaskNode.types';
import { reorderTaskIds } from './taskReorderUtils';
import { calculateTaskPositions } from './useTaskPositions';

const meta: Meta = {
  title: 'Canvas/StageNode/TaskNode',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Wrapper for StageNode that spreads data props
const StageNodeWrapper = (props: any) => {
  return <StageNode {...props} {...props.data} />;
};

// Wrapper for TaskNode that spreads data props
const TaskNodeWrapper = (props: any) => {
  return <TaskNode {...props} />;
};

// Helper to create task nodes from task IDs
interface TaskInfo {
  label: string;
  taskType: string;
  icon: React.ReactElement;
  execution?: TaskNodeData['execution'];
}

function createTaskNodes(
  stageId: string,
  taskIds: string[][],
  tasks: Record<string, TaskInfo>,
  stageWidth: number,
  onTaskClick?: (taskId: string) => void,
  onTaskSelect?: (taskId: string) => void
): TaskNodeType[] {
  // Pass tasks directly - calculate functions will extract execution data
  const positions = calculateTaskPositions(taskIds, stageWidth, tasks as any);
  const nodes: TaskNodeType[] = [];

  taskIds.forEach((group, groupIndex) => {
    group.forEach((taskId, taskIndex) => {
      const taskInfo = tasks[taskId];
      if (!taskInfo) return;

      const position = positions.get(taskId);
      if (!position) return;

      nodes.push({
        id: taskId,
        type: 'task',
        parentId: stageId,
        extent: 'parent',
        position: { x: position.x, y: position.y },
        width: position.width, // Set explicit width on React Flow node
        data: {
          taskType: taskInfo.taskType,
          label: taskInfo.label,
          iconElement: taskInfo.icon,
          groupIndex,
          taskIndex,
          execution: taskInfo.execution,
          onTaskClick,
          onTaskSelect,
          width: position.width, // Also pass through data for component to use
        } as TaskNodeData,
      });
    });
  });

  return nodes;
}

// Shared component for interactive canvas with drag/copy/paste
interface InteractiveCanvasProps {
  initialTaskIds: string[][];
  tasks: Record<string, TaskInfo>;
  stageWidth: number;
  stageLabel: string;
  showInstructions?: boolean;
}

const InteractiveCanvas = ({
  initialTaskIds,
  tasks: initialTasks,
  stageWidth,
  stageLabel,
  showInstructions = true,
}: InteractiveCanvasProps) => {
  const [taskIds, setTaskIds] = useState(initialTaskIds);
  const [tasks, setTasks] = useState(initialTasks);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [actionLog, setActionLog] = useState<string>('');

  // Create nodes from current taskIds state
  // During drag, insert placeholder to make tasks shift
  const displayTaskIds = useMemo(() => {
    return taskIds; // Will be modified during drag in InteractiveCanvasInner
  }, [taskIds]);

  const stageNode: Node = useMemo(
    () => ({
      id: 'stage-1',
      type: 'stage',
      position: { x: 250, y: 100 },
      style: { width: stageWidth },
      data: {
        nodeType: 'case-management:Stage',
        stageDetails: {
          label: stageLabel,
          taskIds: displayTaskIds,
        },
        onTaskClick: (taskId: string) => {
          setSelectedTaskId(taskId);
          setActionLog(`Selected: ${taskId}`);
        },
      } as Partial<StageNodeProps>,
    }),
    [displayTaskIds, stageLabel, stageWidth]
  );

  // Callbacks to pass through data
  const handleTaskClick = useCallback((taskId: string) => {
    setSelectedTaskId(taskId);
    setActionLog(`Selected: ${taskId}`);
  }, []);

  const taskNodes = useMemo(
    () =>
      createTaskNodes(
        'stage-1',
        displayTaskIds,
        tasks,
        stageWidth,
        handleTaskClick,
        setSelectedTaskId
      ),
    [displayTaskIds, tasks, stageWidth, handleTaskClick]
  );

  const allNodes = useMemo(() => [stageNode, ...taskNodes], [stageNode, taskNodes]);

  const [nodes, setNodes, onNodesChange] = useNodesState(allNodes);
  const [edges, , onEdgesChange] = useEdgesState([]);

  // Update nodes when taskIds change
  useEffect(() => {
    setNodes(allNodes);
  }, [allNodes, setNodes]);

  const nodeTypes = useMemo(
    () => ({
      stage: StageNodeWrapper,
      task: TaskNodeWrapper,
      placeholder: (props: any) => <PlaceholderTaskNode {...props} />,
    }),
    []
  );
  const edgeTypes = useMemo(() => ({ stage: StageEdge }), []);

  // Handle task reordering within the same stage
  const handleTaskReorder = useCallback((params: TaskReorderParams) => {
    const { taskId, position } = params;
    const depthLabel = position.isParallel ? 'parallel' : 'sequential';
    setActionLog(`Reordered ${taskId} to group ${position.groupIndex} (${depthLabel})`);

    setTaskIds((prev) => {
      // Use the proper reorder logic that handles flatten/arrayMove/buildGroups
      const depth = position.isParallel ? 1 : 0;
      return reorderTaskIds(prev, taskId, position.groupIndex, position.taskIndex, depth);
    });
  }, []);

  // Handle task paste (from keyboard shortcut)
  const handleTaskPaste = useCallback((params: TaskPasteParams) => {
    const { newTaskId, originalData } = params;
    setActionLog(`Pasted as ${newTaskId}`);

    // Add task data to tasks object
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

    // Add to taskIds at the end
    setTaskIds((prev) => {
      return [...prev, [newTaskId]];
    });
  }, []);

  return (
    <ReactFlowProvider>
      <InteractiveCanvasInner
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onTaskReorder={handleTaskReorder}
        onTaskPaste={handleTaskPaste}
        selectedTaskId={selectedTaskId}
        targetTaskIds={taskIds}
        actionLog={actionLog}
        showInstructions={showInstructions}
      />
    </ReactFlowProvider>
  );
};

// Inner component that uses React Flow hooks
interface InteractiveCanvasInnerProps {
  nodes: Node[];
  edges: any[];
  onNodesChange: any;
  onEdgesChange: any;
  nodeTypes: any;
  edgeTypes: any;
  onTaskReorder: (params: TaskReorderParams) => void;
  onTaskPaste: (params: TaskPasteParams) => void;
  selectedTaskId: string | null;
  targetTaskIds: string[][];
  actionLog: string;
  showInstructions: boolean;
}

const InteractiveCanvasInner = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  nodeTypes,
  edgeTypes,
  onTaskReorder,
  onTaskPaste,
  selectedTaskId,
  targetTaskIds,
  actionLog,
  showInstructions,
}: InteractiveCanvasInnerProps) => {
  // Use drag hook for drag operations (now includes task shifting)
  const { dragState, handlers } = useCrossStageTaskDrag({
    onTaskReorder,
  });

  // Use copy/paste hook for keyboard shortcuts
  useTaskCopyPaste(
    { onTaskPaste },
    {
      selectedTaskId,
      targetStageId: 'stage-1',
      targetTaskIds,
      enabled: true,
    }
  );

  return (
    <CrossStageDragProvider value={{ dragState }}>
      <BaseCanvas
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
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
        {dragState.isDragging && (
          <Panel position="top-right">
            <div
              style={{
                background: 'var(--uix-palette-info-light)',
                padding: '8px 16px',
                borderRadius: '4px',
              }}
            >
              Dragging {dragState.taskId}
              {dragState.dropPosition && (
                <div style={{ fontSize: '12px' }}>
                  → Group {dragState.dropPosition.groupIndex}
                  {dragState.dropPosition.isParallel ? ' (Parallel)' : ' (Sequential)'}
                  <div style={{ fontSize: '10px', marginTop: '4px' }}>
                    Drag right to make parallel
                  </div>
                </div>
              )}
            </div>
          </Panel>
        )}
      </BaseCanvas>
    </CrossStageDragProvider>
  );
};

/**
 * Basic TaskNode example showing sequential tasks within a StageNode
 * Now with full drag and copy/paste support
 */
export const Basic: Story = {
  render: () => {
    const tasks: Record<string, TaskInfo> = {
      'task-1': {
        label: 'Process Document',
        taskType: 'uipath.case-management.process',
        icon: <TaskIcon type={TaskItemTypeValues.AgenticProcess} size="sm" />,
      },
      'task-2': {
        label: 'Run Human Action',
        taskType: 'uipath.case-management.run-human-action',
        icon: <TaskIcon type={TaskItemTypeValues.User} size="sm" />,
      },
      'task-3': {
        label: 'Execute RPA',
        taskType: 'uipath.case-management.rpa',
        icon: <TaskIcon type={TaskItemTypeValues.Automation} size="sm" />,
      },
    };

    return (
      <div style={{ width: '100vw', height: '100vh' }}>
        <InteractiveCanvas
          initialTaskIds={[['task-1'], ['task-2'], ['task-3']]}
          tasks={tasks}
          stageWidth={304}
          stageLabel="Processing Stage"
        />
      </div>
    );
  },
};

/**
 * TaskNodes with execution status and badges
 * Now with full drag and copy/paste support
 */
export const WithExecutionStatus: Story = {
  render: () => {
    const tasks: Record<string, TaskInfo> = {
      'task-1': {
        label: 'Completed Task',
        taskType: 'uipath.case-management.process',
        icon: <TaskIcon type={TaskItemTypeValues.AgenticProcess} size="sm" />,
        execution: {
          status: 'Completed',
          duration: '2m 30s',
        },
      },
      'task-2': {
        label: 'In Progress Task',
        taskType: 'uipath.case-management.run-human-action',
        icon: <TaskIcon type={TaskItemTypeValues.User} size="sm" />,
        execution: {
          status: 'InProgress',
          duration: '1m 15s',
        },
      },
      'task-3': {
        label: 'Failed Task with Retries',
        taskType: 'uipath.case-management.rpa',
        icon: <TaskIcon type={TaskItemTypeValues.Automation} size="sm" />,
        execution: {
          status: 'Failed',
          duration: '0m 45s',
          retryDuration: '0m 30s',
          message: 'Connection timeout',
          badge: 'Error',
          badgeStatus: 'error',
          retryCount: 2,
        },
      },
      'task-4': {
        label: 'Pending Task',
        taskType: 'uipath.case-management.action',
        icon: <TaskIcon type={TaskItemTypeValues.Agent} size="sm" />,
        execution: {
          status: 'NotExecuted',
        },
      },
    };

    return (
      <div style={{ width: '100vw', height: '100vh' }}>
        <InteractiveCanvas
          initialTaskIds={[['task-1'], ['task-2'], ['task-3'], ['task-4']]}
          tasks={tasks}
          stageWidth={304}
          stageLabel="Stage with Execution"
        />
      </div>
    );
  },
};

/**
 * Demonstrates parallel task grouping with proper positioning
 * Fully interactive with drag support
 */
export const ParallelTasks: Story = {
  render: () => {
    const tasks: Record<string, TaskInfo> = {
      'task-1': {
        label: 'Pre-check',
        taskType: 'uipath.case-management.action',
        icon: <TaskIcon type={TaskItemTypeValues.AgenticProcess} size="sm" />,
      },
      'task-2': {
        label: 'Address Verification',
        taskType: 'uipath.case-management.process',
        icon: <TaskIcon type={TaskItemTypeValues.User} size="sm" />,
      },
      'task-3': {
        label: 'Property Verification',
        taskType: 'uipath.case-management.process',
        icon: <TaskIcon type={TaskItemTypeValues.User} size="sm" />,
      },
      'task-4': {
        label: 'Background Check',
        taskType: 'uipath.case-management.process',
        icon: <TaskIcon type={TaskItemTypeValues.Automation} size="sm" />,
      },
      'task-5': {
        label: 'Final Review',
        taskType: 'uipath.case-management.agent',
        icon: <TaskIcon type={TaskItemTypeValues.Agent} size="sm" />,
      },
    };

    return (
      <div style={{ width: '100vw', height: '100vh' }}>
        <InteractiveCanvas
          initialTaskIds={[['task-1'], ['task-2', 'task-3', 'task-4'], ['task-5']]}
          tasks={tasks}
          stageWidth={304}
          stageLabel="Parallel Task Demo"
        />
      </div>
    );
  },
};
