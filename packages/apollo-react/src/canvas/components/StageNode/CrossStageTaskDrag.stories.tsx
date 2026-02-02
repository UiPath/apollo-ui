/**
 * Cross-Stage Task Drag Stories
 *
 * Demonstrates dragging tasks between stages using React Flow nodes.
 * - StageNode: Container-only stage nodes (no direct task rendering)
 * - TaskNode: Separate React Flow nodes with parentId pointing to stage
 * - useCrossStageTaskDrag: Hook for cross-stage drag detection and handling
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
import {
  type TaskCopyParams,
  type TaskMoveParams,
  useCrossStageTaskDrag,
} from '../../hooks/useCrossStageTaskDrag';
import { type TaskPasteParams, useTaskCopyPaste } from '../../hooks/useTaskCopyPaste';
import { DefaultCanvasTranslations } from '../../types';
import { BaseCanvas } from '../BaseCanvas';
import { CanvasPositionControls } from '../CanvasPositionControls';
import { TaskIcon, TaskItemTypeValues } from '../TaskIcon';
import { PlaceholderTaskNode, TaskNode as TaskNodeComponent } from '../TaskNode';
import type { TaskNode, TaskNodeData } from '../TaskNode/TaskNode.types';
import {
  insertTaskAtPosition,
  moveTaskBetweenStages,
  moveTaskWithinStage,
} from '../TaskNode/taskReorderUtils';
import { calculateTaskPositions } from '../TaskNode/useTaskPositions';
import { StageConnectionEdge } from './StageConnectionEdge';
import { StageEdge } from './StageEdge';
import { StageNode } from './StageNode';
import type { StageNodeProps } from './StageNode.types';

const meta: Meta = {
  title: 'Canvas/StageNode',
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
  return <TaskNodeComponent {...props} {...props.data} />;
};

// Initial task data for stages
interface StageTaskData {
  taskIds: string[][];
  tasks: Record<string, { label: string; taskType: string }>;
}

const initialStageData: Record<string, StageTaskData> = {
  'stage-1': {
    taskIds: [
      ['task-1'],
      ['task-2', 'task-6'], // First parallel group
      ['task-3', 'task-4'], // Second parallel group
      ['task-5'],
    ],
    tasks: {
      'task-1': { label: 'KYC Verification', taskType: 'uipath.case-management.run-human-action' },
      'task-2': { label: 'Document Review', taskType: 'uipath.case-management.process' },
      'task-6': { label: 'Credit Check', taskType: 'uipath.case-management.rpa' },
      'task-3': { label: 'Address Check', taskType: 'uipath.case-management.rpa' },
      'task-4': { label: 'Property Check', taskType: 'uipath.case-management.rpa' },
      'task-5': { label: 'Final Approval', taskType: 'uipath.case-management.agent' },
    },
  },
  'stage-2': {
    taskIds: [['task-7'], ['task-8']],
    tasks: {
      'task-7': { label: 'Report Generation', taskType: 'uipath.case-management.api-workflow' },
      'task-8': { label: 'Send Notification', taskType: 'uipath.case-management.action' },
    },
  },
  'stage-3': {
    taskIds: [],
    tasks: {},
  },
};

// Helper to get task icon based on type
function getTaskIcon(taskType: string): React.ReactElement {
  if (taskType.includes('human-action')) {
    return <TaskIcon type={TaskItemTypeValues.User} size="sm" />;
  }
  if (taskType.includes('rpa')) {
    return <TaskIcon type={TaskItemTypeValues.Automation} size="sm" />;
  }
  if (taskType.includes('agent')) {
    return <TaskIcon type={TaskItemTypeValues.Agent} size="sm" />;
  }
  if (taskType.includes('api-workflow')) {
    return <TaskIcon type={TaskItemTypeValues.ApiAutomation} size="sm" />;
  }
  return <TaskIcon type={TaskItemTypeValues.AgenticProcess} size="sm" />;
}

// Create task nodes from stage data
function createTaskNodes(
  stageId: string,
  stageData: StageTaskData,
  stageWidth: number
): TaskNode[] {
  const positions = calculateTaskPositions(stageData.taskIds, stageWidth);
  const nodes: TaskNode[] = [];

  stageData.taskIds.forEach((group, groupIndex) => {
    group.forEach((taskId, taskIndex) => {
      const taskInfo = stageData.tasks[taskId];
      if (!taskInfo) return;

      const position = positions.get(taskId);
      if (!position) return;

      nodes.push({
        id: taskId,
        type: 'task',
        parentId: stageId,
        // Note: extent:'parent' removed to allow cross-stage dragging
        position: { x: position.x, y: position.y },
        width: position.width, // Set explicit width on React Flow node
        data: {
          taskType: taskInfo.taskType,
          label: taskInfo.label,
          iconElement: getTaskIcon(taskInfo.taskType),
          groupIndex,
          taskIndex,
          width: position.width, // Also pass through data for component
        } as TaskNodeData,
      });
    });
  });

  return nodes;
}

// Main story component
const CrossStageTaskDragDemo = () => {
  const [stageData, setStageData] = useState(initialStageData);
  const [dragInfo, setDragInfo] = useState<string>('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);

  // Create stage nodes
  const stageNodes: Node[] = useMemo(
    () => [
      {
        id: 'stage-1',
        type: 'stageV2',
        position: { x: 48, y: 96 },
        style: { width: 304 },
        data: {
          nodeType: 'case-management:Stage',
          stageDetails: {
            label: 'Processing',
            taskIds: stageData['stage-1']?.taskIds ?? [],
          },
          onTaskClick: (taskId: string) => {
            setSelectedTaskId(taskId);
            setSelectedStageId('stage-1');
          },
        } as Partial<StageNodeProps>,
      },
      {
        id: 'stage-2',
        type: 'stageV2',
        position: { x: 400, y: 96 },
        style: { width: 304 },
        data: {
          nodeType: 'case-management:Stage',
          stageDetails: {
            label: 'Review',
            taskIds: stageData['stage-2']?.taskIds ?? [],
          },
          onTaskClick: (taskId: string) => {
            setSelectedTaskId(taskId);
            setSelectedStageId('stage-2');
          },
        } as Partial<StageNodeProps>,
      },
      {
        id: 'stage-3',
        type: 'stageV2',
        position: { x: 752, y: 96 },
        style: { width: 304 },
        data: {
          nodeType: 'case-management:Stage',
          stageDetails: {
            label: 'Closing (Drop Here)',
            taskIds: stageData['stage-3']?.taskIds ?? [],
            defaultContent: 'Drag a task here',
          },
          onTaskClick: (taskId: string) => {
            setSelectedTaskId(taskId);
            setSelectedStageId('stage-3');
          },
          onStageClick: () => setSelectedStageId('stage-3'),
        } as Partial<StageNodeProps>,
      },
    ],
    [stageData]
  );

  // Create task nodes for all stages
  const taskNodes: TaskNode[] = useMemo(() => {
    const nodes: TaskNode[] = [];
    for (const stageId of Object.keys(stageData)) {
      const data = stageData[stageId];
      if (data) {
        nodes.push(...createTaskNodes(stageId, data, 304));
      }
    }
    return nodes;
  }, [stageData]);

  // Combine stage and task nodes
  const allNodes = useMemo(() => [...stageNodes, ...taskNodes], [stageNodes, taskNodes]);

  const [nodes, setNodes, onNodesChange] = useNodesState(allNodes);
  const [edges, _setEdges, onEdgesChange] = useEdgesState([
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
  ]);

  // Update nodes when stageData changes
  useEffect(() => {
    setNodes(allNodes);
  }, [allNodes, setNodes]);

  // Handle task move
  const handleTaskMove = useCallback((params: TaskMoveParams) => {
    const { taskId, sourceStageId, targetStageId, position } = params;
    setDragInfo(
      `Moved ${taskId} from ${sourceStageId} to ${targetStageId} at group ${position.groupIndex}${position.isParallel ? ' (parallel)' : ''}`
    );

    setStageData((prev) => {
      const sourceStage = prev[sourceStageId];
      const targetStage = prev[targetStageId];
      if (!sourceStage?.tasks || !sourceStage?.taskIds || !targetStage) return prev;

      const taskInfo = sourceStage.tasks[taskId];
      if (!taskInfo) return prev;

      // Use utility functions for taskIds manipulation
      const { sourceTaskIds: newSourceTaskIds, targetTaskIds: newTargetTaskIds } =
        moveTaskBetweenStages(sourceStage.taskIds, targetStage.taskIds || [], taskId, position);

      // Update task metadata
      const newSourceTasks = { ...sourceStage.tasks };
      delete newSourceTasks[taskId];

      return {
        ...prev,
        [sourceStageId]: {
          ...sourceStage,
          taskIds: newSourceTaskIds,
          tasks: newSourceTasks,
        },
        [targetStageId]: {
          ...targetStage,
          taskIds: newTargetTaskIds,
          tasks: { ...(targetStage.tasks || {}), [taskId]: taskInfo },
        },
      };
    });
  }, []);

  // Handle task copy
  const handleTaskCopy = useCallback((params: TaskCopyParams) => {
    const { taskId, newTaskId, sourceStageId, targetStageId, position } = params;
    setDragInfo(
      `Copied ${taskId} to ${newTaskId} in ${targetStageId} at group ${position.groupIndex}${position.isParallel ? ' (parallel)' : ''}`
    );

    setStageData((prev) => {
      const sourceStage = prev[sourceStageId];
      const targetStage = prev[targetStageId];
      if (!sourceStage?.tasks || !targetStage) return prev;

      const taskInfo = sourceStage.tasks[taskId];
      if (!taskInfo) return prev;

      // Use utility function to insert copied task
      const newTargetTaskIds = insertTaskAtPosition(targetStage.taskIds || [], newTaskId, position);

      return {
        ...prev,
        [targetStageId]: {
          ...targetStage,
          taskIds: newTargetTaskIds,
          tasks: {
            ...(targetStage.tasks || {}),
            [newTaskId]: { ...taskInfo, label: `${taskInfo.label} (Copy)` },
          },
        },
      };
    });
  }, []);

  // Handle same-stage reorder
  const handleTaskReorder = useCallback((params: any) => {
    const { taskId, stageId, position } = params;
    setDragInfo(
      `Reordered ${taskId} in ${stageId} to group ${position.groupIndex}${position.isParallel ? ' (parallel)' : ''}`
    );

    setStageData((prev: any) => {
      const stage = prev[stageId];
      if (!stage) return prev;

      // Use utility function for reordering
      const newTaskIds = moveTaskWithinStage(stage.taskIds, taskId, position);

      return {
        ...prev,
        [stageId]: {
          ...stage,
          taskIds: newTaskIds,
        },
      };
    });
  }, []);

  // Handle task paste (from keyboard shortcut)
  const handleTaskPaste = useCallback((params: TaskPasteParams) => {
    const { newTaskId, originalData, targetStageId, position } = params;
    setDragInfo(`Pasted task ${newTaskId} to ${targetStageId} at group ${position.groupIndex}`);

    setStageData((prev) => {
      const newData = { ...prev };

      // Get target stage data
      const targetStage = newData[targetStageId];
      if (!targetStage) return prev;

      // Add pasted task to target at position
      const newTargetTaskIds = [...(targetStage.taskIds || [])];
      if (position.groupIndex >= newTargetTaskIds.length) {
        newTargetTaskIds.push([newTaskId]);
      } else {
        newTargetTaskIds.splice(position.groupIndex, 0, [newTaskId]);
      }

      newData[targetStageId] = {
        ...targetStage,
        taskIds: newTargetTaskIds,
        tasks: {
          ...(targetStage.tasks || {}),
          [newTaskId]: {
            label: `${originalData.label} (Pasted)`,
            taskType: originalData.taskType as string,
          },
        },
      };

      return newData;
    });
  }, []);

  // Get target task IDs for paste operation
  const targetTaskIds = useMemo(() => {
    if (!selectedStageId) return [];
    return stageData[selectedStageId]?.taskIds || [];
  }, [selectedStageId, stageData]);

  // Node and edge types
  const nodeTypes = useMemo(
    () => ({
      stageV2: StageNodeWrapper,
      task: TaskNodeWrapper,
      placeholder: (props: any) => <PlaceholderTaskNode {...props} />,
    }),
    []
  );
  const edgeTypes = useMemo(() => ({ stage: StageEdge }), []);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlowProvider>
        <CrossStageTaskDragCanvas
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onTaskMove={handleTaskMove}
          onTaskCopy={handleTaskCopy}
          onTaskPaste={handleTaskPaste}
          onTaskReorder={handleTaskReorder}
          selectedTaskId={selectedTaskId}
          selectedStageId={selectedStageId}
          targetTaskIds={targetTaskIds}
        />
        {dragInfo && (
          <Panel position="top-left">
            <div
              style={{
                background: 'var(--uix-palette-surface-paper)',
                padding: '8px 16px',
                borderRadius: '4px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
            >
              {dragInfo}
            </div>
          </Panel>
        )}
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
            <ul style={{ margin: '8px 0', paddingLeft: '16px' }}>
              <li>Click a task to select it</li>
              <li>Drag tasks between stages</li>
              <li>Hold Alt/Cmd while dragging to copy</li>
              <li>Ctrl/Cmd+C to copy selected task</li>
              <li>Ctrl/Cmd+V to paste (click stage first)</li>
            </ul>
          </div>
        </Panel>
      </ReactFlowProvider>
    </div>
  );
};

// Inner component that uses React Flow hooks
interface CrossStageTaskDragCanvasProps {
  nodes: Node[];
  edges: any[];
  onNodesChange: any;
  onEdgesChange: any;
  nodeTypes: any;
  edgeTypes: any;
  onTaskMove: (params: TaskMoveParams) => void;
  onTaskCopy: (params: TaskCopyParams) => void;
  onTaskPaste: (params: TaskPasteParams) => void;
  onTaskReorder: (params: any) => void;
  selectedTaskId: string | null;
  selectedStageId: string | null;
  targetTaskIds: string[][];
}

const CrossStageTaskDragCanvas = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  nodeTypes,
  edgeTypes,
  onTaskMove,
  onTaskCopy,
  onTaskPaste,
  onTaskReorder,
  selectedTaskId,
  selectedStageId,
  targetTaskIds,
}: CrossStageTaskDragCanvasProps) => {
  // Use the cross-stage drag hook
  const { dragState, handlers } = useCrossStageTaskDrag({
    onTaskMove,
    onTaskCopy,
    onTaskReorder,
  });

  // Use the copy/paste hook (task shifting now handled in useCrossStageTaskDrag)
  useTaskCopyPaste(
    { onTaskPaste },
    {
      selectedTaskId,
      targetStageId: selectedStageId,
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
      >
        <Panel position="bottom-right">
          <CanvasPositionControls translations={DefaultCanvasTranslations} />
        </Panel>
        {dragState.isDragging && (
          <Panel position="top-right">
            <div
              style={{
                background: dragState.isCopyMode
                  ? 'var(--uix-palette-info-light)'
                  : 'var(--uix-palette-warning-light)',
                padding: '8px 16px',
                borderRadius: '4px',
              }}
            >
              {dragState.isCopyMode ? 'Copy Mode (Alt/Cmd)' : 'Move Mode'}
              {dragState.targetStageId !== dragState.sourceStageId && (
                <div>Target: {dragState.targetStageId}</div>
              )}
            </div>
          </Panel>
        )}
      </BaseCanvas>
    </CrossStageDragProvider>
  );
};

export const DragAndDrop: Story = {
  name: 'Drag and Drop',
  render: () => <CrossStageTaskDragDemo />,
};
