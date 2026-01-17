import type { Connection, Edge } from '@uipath/apollo-react/canvas/xyflow/react';
import {
  addEdge,
  ConnectionMode,
  Panel,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
} from '@uipath/apollo-react/canvas/xyflow/react';
import type { DragEndEvent } from '@dnd-kit/core';
import { useCallback, useMemo } from 'react';
import { DefaultCanvasTranslations } from '../../types';
import { BaseCanvas } from '../BaseCanvas';
import { CanvasDndContext } from '../CanvasDndContext';
import { CanvasPositionControls } from '../CanvasPositionControls';
import { StageConnectionEdge } from './StageConnectionEdge';
import { StageEdge } from './StageEdge';
import { StageNode } from './StageNode';
import type { StageTaskItem } from './StageNode.types';

// Example task data for demonstration
const createTaskIcon = (type: 'verify' | 'document' | 'process') => {
  if (type === 'verify') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 11L12 14L20 6" />
        <path d="M20 12V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V6C4 4.89543 4.89543 4 6 4H13" />
      </svg>
    );
  }
  if (type === 'document') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" />
        <path d="M14 2V8H20" />
        <path d="M8 12H16" />
        <path d="M8 16H16" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
};

const initialStage1Tasks: StageTaskItem[][] = [
  [{ id: 'stage1-task1', label: 'KYC Verification', icon: createTaskIcon('verify') }],
  [{ id: 'stage1-task2', label: 'Document Review', icon: createTaskIcon('document') }],
];

const initialStage2Tasks: StageTaskItem[][] = [
  [{ id: 'stage2-task1', label: 'Credit Check', icon: createTaskIcon('verify') }],
  [{ id: 'stage2-task2', label: 'Risk Assessment', icon: createTaskIcon('process') }],
];

const initialStage3Tasks: StageTaskItem[][] = [
  [{ id: 'stage3-task1', label: 'Final Approval', icon: createTaskIcon('process') }],
];

/**
 * Helper function to find which stage contains a specific task
 */
const findStageWithTask = (nodes: any[], taskId: string): string | null => {
  for (const node of nodes) {
    if (node.type === 'stage') {
      const tasks = node.data?.stageDetails?.tasks || [];
      const hasTask = tasks.flat().some((task: StageTaskItem) => task.id === taskId);
      if (hasTask) {
        return node.id;
      }
    }
  }
  return null;
};

/**
 * Helper function to remove a task from a stage's task list
 */
const removeTaskFromStage = (
  tasks: StageTaskItem[][],
  taskId: string
): { updatedTasks: StageTaskItem[][]; removedTask: StageTaskItem | null } => {
  let removedTask: StageTaskItem | null = null;

  const updatedTasks = tasks
    .map((group) => {
      const task = group.find((t) => t.id === taskId);
      if (task) {
        removedTask = task;
      }
      return group.filter((t) => t.id !== taskId);
    })
    .filter((group) => group.length > 0);

  return { updatedTasks, removedTask };
};

/**
 * Helper function to add a task to a stage at a specific position
 */
const addTaskToStage = (
  tasks: StageTaskItem[][],
  task: StageTaskItem,
  targetTaskId: string
): StageTaskItem[][] => {
  // Find the position of the target task
  let targetGroupIndex = -1;

  for (let i = 0; i < tasks.length; i++) {
    const group = tasks[i];
    if (!group) continue;
    const taskIndex = group.findIndex((t) => t.id === targetTaskId);
    if (taskIndex !== -1) {
      targetGroupIndex = i;
      break;
    }
  }

  if (targetGroupIndex === -1) {
    // Target not found, add at the end
    return [...tasks, [task]];
  }

  // Insert the task as a new group after the target task's group
  const newTasks = [...tasks];
  newTasks.splice(targetGroupIndex + 1, 0, [task]);
  return newTasks;
};

export const CrossStageDraggingStory = () => {
  const StageNodeWrapper = useMemo(
    () =>
      function StageNodeWrapperComponent(props: any) {
        return <StageNode {...props} {...props.data} />;
      },
    []
  );

  const nodeTypes = useMemo(() => ({ stage: StageNodeWrapper }), [StageNodeWrapper]);
  const edgeTypes = useMemo(() => ({ stage: StageEdge }), []);

  const [nodes, setNodes, onNodesChange] = useNodesState([
    {
      id: 'stage-1',
      type: 'stage',
      position: { x: 50, y: 100 },
      data: {
        stageDetails: {
          label: 'Application',
          tasks: initialStage1Tasks,
        },
      },
    },
    {
      id: 'stage-2',
      type: 'stage',
      position: { x: 400, y: 100 },
      data: {
        stageDetails: {
          label: 'Processing',
          tasks: initialStage2Tasks,
        },
      },
    },
    {
      id: 'stage-3',
      type: 'stage',
      position: { x: 750, y: 100 },
      data: {
        stageDetails: {
          label: 'Approval',
          tasks: initialStage3Tasks,
        },
      },
    },
  ]);

  const [edges, setEdges, onEdgesChange] = useEdgesState([
    {
      id: 'e1-2',
      type: 'stage',
      source: 'stage-1',
      sourceHandle: 'stage-1____source____right',
      target: 'stage-2',
      targetHandle: 'stage-2____target____left',
    },
    {
      id: 'e2-3',
      type: 'stage',
      source: 'stage-2',
      sourceHandle: 'stage-2____source____right',
      target: 'stage-3',
      targetHandle: 'stage-3____target____left',
    },
  ] as Edge[]);

  /**
   * Handle within-stage task reordering
   * This is called by individual StageNode components
   */
  const handleTaskReorder = useCallback(
    (stageId: string, reorderedTasks: StageTaskItem[][]) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === stageId
            ? {
                ...node,
                data: {
                  ...node.data,
                  stageDetails: {
                    ...node.data.stageDetails,
                    tasks: reorderedTasks,
                  },
                },
              }
            : node
        )
      );
    },
    [setNodes]
  );

  /**
   * Global drag end handler for cross-stage movements
   * This runs at the CanvasDndContext level
   */
  const handleGlobalDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over) {
        return;
      }

      const activeId = active.id as string;
      const overId = over.id as string;

      setNodes((currentNodes) => {
        // Check if dropping onto an empty stage (ID format: "stage-X-empty-stage")
        let targetStageId: string | null = null;
        let isEmptyStage = false;

        if (overId.endsWith('-empty-stage')) {
          // Extract the stage ID from the empty stage droppable ID
          targetStageId = overId.replace('-empty-stage', '');
          isEmptyStage = true;
        } else {
          // Find which stage contains the drop target task
          targetStageId = findStageWithTask(currentNodes, overId);
        }

        // Find which stage contains the dragged task
        const sourceStageId = findStageWithTask(currentNodes, activeId);

        if (!sourceStageId || !targetStageId) {
          return currentNodes;
        }

        // If same stage, the StageNode's own handler will handle it
        if (sourceStageId === targetStageId) {
          return currentNodes;
        }

        // Cross-stage movement detected!

        const sourceNode = currentNodes.find((n) => n.id === sourceStageId);
        const targetNode = currentNodes.find((n) => n.id === targetStageId);

        if (!sourceNode || !targetNode) return currentNodes;

        const sourceTasks = sourceNode.data?.stageDetails?.tasks || [];
        const targetTasks = targetNode.data?.stageDetails?.tasks || [];

        // Remove task from source stage
        const { updatedTasks: newSourceTasks, removedTask } = removeTaskFromStage(
          sourceTasks,
          activeId
        );

        if (!removedTask) return currentNodes;

        // Add task to target stage
        let newTargetTasks: StageTaskItem[][];
        if (isEmptyStage || targetTasks.length === 0) {
          // If dropping onto an empty stage, just add as the first task
          newTargetTasks = [[removedTask]];
        } else {
          // Otherwise, add it relative to the drop target task
          newTargetTasks = addTaskToStage(targetTasks, removedTask, overId);
        }

        // Update both nodes
        return currentNodes.map((node) => {
          if (node.id === sourceStageId) {
            return {
              ...node,
              data: {
                ...node.data,
                stageDetails: {
                  ...node.data.stageDetails,
                  tasks: newSourceTasks,
                },
              },
            };
          }
          if (node.id === targetStageId) {
            return {
              ...node,
              data: {
                ...node.data,
                stageDetails: {
                  ...node.data.stageDetails,
                  tasks: newTargetTasks,
                },
              },
            };
          }
          return node;
        });
      });
    },
    [setNodes]
  );

  // Attach onTaskReorder handlers to each node
  const nodesWithHandlers = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onTaskReorder: (reorderedTasks: StageTaskItem[][]) =>
            handleTaskReorder(node.id, reorderedTasks),
        },
      })),
    [nodes, handleTaskReorder]
  );

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          zIndex: 1000,
          background: 'white',
          padding: '12px 16px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          maxWidth: '400px',
        }}
      >
        <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600 }}>
          Cross-Stage Dragging Demo
        </h3>
        <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
          Try dragging tasks between different stages! Tasks can be moved between stages and
          reordered within each stage.
        </p>
      </div>
      <ReactFlowProvider>
        <CanvasDndContext onDragEnd={handleGlobalDragEnd}>
          <BaseCanvas
            nodes={nodesWithHandlers}
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
            defaultViewport={{ x: 0, y: 0, zoom: 1.2 }}
          >
            <Panel position="bottom-right">
              <CanvasPositionControls translations={DefaultCanvasTranslations} />
            </Panel>
          </BaseCanvas>
        </CanvasDndContext>
      </ReactFlowProvider>
    </div>
  );
};
