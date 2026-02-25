/**
 * useCrossStageTaskDrag - Hook for handling task drag between stages using React Flow
 *
 * This hook enables dragging tasks between different stage nodes.
 * Uses the dragged node's position to determine target stage and drop position.
 *
 * Key features:
 * - Uses node position (not mouse) to determine target stage
 * - Simplified bucket-based drop position calculation
 * - Shows placeholder node at drop location
 * - Supports copy mode with modifier key (Alt/Cmd)
 */

import { type Node, useReactFlow } from '@xyflow/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  insertTaskAtPosition,
  removeTaskFromTaskIds,
} from '../components/TaskNode/taskReorderUtils';
import {
  calculateTaskPositions,
  DEFAULT_TASK_POSITION_CONFIG,
} from '../components/TaskNode/useTaskPositions';
import { calculateDropPosition, convertToGroupPosition } from './calculateTaskDropPosition';

/**
 * Type for React Flow node drag handler
 */
type OnNodeDrag = (event: React.MouseEvent, node: Node, nodes: Node[]) => void;

/**
 * Information about the current drag operation
 */
export interface CrossStageDragState {
  /** Whether a cross-stage drag is in progress */
  isDragging: boolean;
  /** The task ID being dragged */
  taskId: string | null;
  /** The source stage ID */
  sourceStageId: string | null;
  /** The target stage ID (may be same as source during drag) */
  targetStageId: string | null;
  /** Whether copy mode is active (Alt/Cmd key held) */
  isCopyMode: boolean;
  /** Calculated drop position in target stage */
  dropPosition: DropPosition | null;
}

/**
 * Position where a task would be dropped
 */
export interface DropPosition {
  /** Group index (outer array) */
  groupIndex: number;
  /** Task index within group */
  taskIndex: number;
  /** Whether dropping into a parallel group */
  isParallel: boolean;
}

/**
 * Parameters for task move/copy operations
 */
export interface TaskMoveParams {
  /** Task ID being moved */
  taskId: string;
  /** Source stage ID */
  sourceStageId: string;
  /** Target stage ID */
  targetStageId: string;
  /** Position in target stage */
  position: DropPosition;
}

export interface TaskCopyParams extends TaskMoveParams {
  /** New ID for the copied task */
  newTaskId: string;
}

/**
 * Parameters for same-stage reorder operation
 */
export interface TaskReorderParams {
  /** Task ID being reordered */
  taskId: string;
  /** Stage ID */
  stageId: string;
  /** New position in stage */
  position: DropPosition;
}

/**
 * Callbacks for cross-stage task operations
 */
export interface CrossStageTaskCallbacks {
  /** Called when a task is moved between stages */
  onTaskMove?: (params: TaskMoveParams) => void;
  /** Called when a task is copied between stages */
  onTaskCopy?: (params: TaskCopyParams) => void;
  /** Called when a task is reordered within the same stage */
  onTaskReorder?: (params: TaskReorderParams) => void;
}

/**
 * Check if a point is within a stage's bounds
 */
function isPointInStage(
  x: number,
  y: number,
  stageX: number,
  stageY: number,
  stageWidth: number,
  stageHeight: number
): boolean {
  return x >= stageX && x <= stageX + stageWidth && y >= stageY && y <= stageY + stageHeight;
}

/**
 * Hook for handling cross-stage task dragging
 * Uses node position for stage detection and simplified bucket-based drop calculation
 */
export function useCrossStageTaskDrag(callbacks: CrossStageTaskCallbacks = {}) {
  const { setNodes, getNodes } = useReactFlow();
  const { onTaskMove, onTaskCopy, onTaskReorder } = callbacks;

  const [dragState, setDragState] = useState<CrossStageDragState>({
    isDragging: false,
    taskId: null,
    sourceStageId: null,
    targetStageId: null,
    isCopyMode: false,
    dropPosition: null,
  });

  // Track modifier key state
  const isCopyModeRef = useRef(false);

  // Track drag state synchronously using refs (React state updates are async)
  // This ensures onNodeDragStop can access accurate drag info even if state hasn't updated yet
  const isDraggingRef = useRef(false);
  const draggedTaskIdRef = useRef<string | null>(null);
  const sourceStageIdRef = useRef<string | null>(null);

  // Track the current drop position synchronously (updated in onNodeDrag, read in onNodeDragStop)
  // This avoids stale closure issues where dragState might not be updated yet
  const currentDropPositionRef = useRef<{
    groupIndex: number;
    taskIndex: number;
    isParallel: boolean;
  } | null>(null);
  const currentTargetStageRef = useRef<string | null>(null);

  // Track the last calculated drop position to avoid unnecessary updates in useEffect
  const lastDropPositionRef = useRef<{
    groupIndex: number;
    taskIndex: number;
    isParallel: boolean;
    targetStageId: string;
  } | null>(null);

  // Update placeholder and task positions when drag state changes
  useEffect(() => {
    if (
      !dragState.isDragging ||
      !dragState.dropPosition ||
      !dragState.taskId ||
      !dragState.targetStageId
    ) {
      lastDropPositionRef.current = null;
      return;
    }

    const { groupIndex, taskIndex, isParallel } = dragState.dropPosition;

    // Skip if position hasn't changed (including isParallel for width updates)
    const lastPos = lastDropPositionRef.current;
    if (
      lastPos &&
      lastPos.groupIndex === groupIndex &&
      lastPos.taskIndex === taskIndex &&
      lastPos.isParallel === isParallel &&
      lastPos.targetStageId === dragState.targetStageId
    ) {
      return;
    }

    lastDropPositionRef.current = {
      groupIndex,
      taskIndex,
      isParallel,
      targetStageId: dragState.targetStageId,
    };

    // Get target stage node
    const allNodes = getNodes();
    const targetStage = allNodes.find((n) => n.id === dragState.targetStageId);
    if (!targetStage) return;

    // Get taskIds from target stage
    const targetStageData = targetStage.data as Record<string, unknown>;
    const stageDetails = targetStageData?.stageDetails as Record<string, unknown> | undefined;
    const taskIds = (stageDetails?.taskIds as string[][]) || [];

    // Remove dragged task to get filtered structure (same as drop logic)
    const filteredTaskIds = removeTaskFromTaskIds(taskIds, dragState.taskId);

    // Insert placeholder at calculated position using the SAME utility as drop
    // This ensures placeholder and drop behavior are always identical
    const placeholderId = '__placeholder__';
    const taskIdsWithPlaceholder = insertTaskAtPosition(filteredTaskIds, placeholderId, {
      groupIndex,
      taskIndex,
      isParallel,
    });

    // Get stage width
    const stageWidth = (targetStage.style?.width as number) || 304;

    // Recalculate positions for all tasks and add placeholder node
    setNodes((currentNodes) => {
      const positions = calculateTaskPositions(taskIdsWithPlaceholder, stageWidth, currentNodes);

      // Helper function to get original positions for a stage (without placeholder)
      const getOriginalPositions = (stageId: string) => {
        const stage = currentNodes.find((s) => s.id === stageId);
        if (!stage) return null;
        const stageData = stage.data as Record<string, unknown>;
        const details = stageData?.stageDetails as Record<string, unknown> | undefined;
        const stageTaskIds = (details?.taskIds as string[][]) || [];
        // Filter out dragged task if it's from this stage
        const filteredIds = dragState.taskId
          ? removeTaskFromTaskIds(stageTaskIds, dragState.taskId)
          : stageTaskIds;
        const width = (stage.style?.width as number) || 304;
        return calculateTaskPositions(filteredIds, width, currentNodes);
      };

      // Update existing task positions (except the dragged task)
      let updatedNodes = currentNodes.map((n) => {
        // Update tasks in target stage (except dragged task)
        if (
          n.type === 'task' &&
          n.id !== dragState.taskId &&
          n.parentId === dragState.targetStageId
        ) {
          const pos = positions.get(n.id);
          if (pos) {
            return {
              ...n,
              position: { x: pos.x, y: pos.y },
            };
          }
        }
        // Also update tasks in source stage if different from target
        if (
          n.type === 'task' &&
          n.id !== dragState.taskId &&
          dragState.sourceStageId &&
          dragState.sourceStageId !== dragState.targetStageId &&
          n.parentId === dragState.sourceStageId
        ) {
          const sourcePositions = getOriginalPositions(dragState.sourceStageId);
          if (sourcePositions) {
            const pos = sourcePositions.get(n.id);
            if (pos) {
              return {
                ...n,
                position: { x: pos.x, y: pos.y },
              };
            }
          }
        }
        // Reset tasks in any other stage (not target, not source) to their original positions
        // This handles the case where we drag into a stage and then out of it
        if (
          n.type === 'task' &&
          n.id !== dragState.taskId &&
          n.parentId !== dragState.targetStageId &&
          n.parentId !== dragState.sourceStageId
        ) {
          const otherPositions = getOriginalPositions(n.parentId!);
          if (otherPositions) {
            const pos = otherPositions.get(n.id);
            if (pos) {
              return {
                ...n,
                position: { x: pos.x, y: pos.y },
              };
            }
          }
        }
        return n;
      });

      // Remove any existing placeholder
      updatedNodes = updatedNodes.filter((n) => n.id !== '__placeholder__');

      // Add placeholder node at drop position
      const placeholderPos = positions.get(placeholderId);
      if (placeholderPos && dragState.targetStageId) {
        updatedNodes.push({
          id: '__placeholder__',
          type: 'placeholder' as any,
          parentId: dragState.targetStageId,
          extent: 'parent' as any,
          position: { x: placeholderPos.x, y: placeholderPos.y },
          width: placeholderPos.width,
          data: { isParallel },
          draggable: false,
          selectable: false,
          focusable: false,
        });
      }

      return updatedNodes;
    });
  }, [dragState, setNodes, getNodes]);

  // Handle modifier key changes during drag
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.altKey || e.metaKey) {
      isCopyModeRef.current = true;
      setDragState((prev) => ({ ...prev, isCopyMode: true }));
    }
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (!e.altKey && !e.metaKey) {
      isCopyModeRef.current = false;
      setDragState((prev) => ({ ...prev, isCopyMode: false }));
    }
  }, []);

  /**
   * Handler for when a node drag starts
   */
  const onNodeDragStart: OnNodeDrag = useCallback(
    (_event, node, _nodes) => {
      // Only handle task nodes
      if (node.type !== 'task') return;

      // Get the parent stage ID
      const sourceStageId = node.parentId;
      if (!sourceStageId) return;

      // Set refs synchronously for immediate access in onNodeDragStop
      isDraggingRef.current = true;
      draggedTaskIdRef.current = node.id;
      sourceStageIdRef.current = sourceStageId;
      currentTargetStageRef.current = sourceStageId;

      setDragState({
        isDragging: true,
        taskId: node.id,
        sourceStageId,
        targetStageId: sourceStageId,
        isCopyMode: isCopyModeRef.current,
        dropPosition: null,
      });

      // Add keyboard listeners for copy mode
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
    },
    [handleKeyDown, handleKeyUp]
  );

  /**
   * Handler for during node drag
   * Uses node position to determine target stage and drop position
   */
  const onNodeDrag: OnNodeDrag = useCallback(
    (_event, node, _nodes) => {
      if (node.type !== 'task' || !dragState.isDragging) return;

      const allNodes = getNodes();

      // Get node dimensions
      const nodeWidth = (node.width as number) || DEFAULT_TASK_POSITION_CONFIG.taskHeight;
      const nodeHeight =
        (node.measured?.height as number) || DEFAULT_TASK_POSITION_CONFIG.taskHeight;

      // Calculate node center point in flow coordinates
      // Node position is relative to parent, so we need absolute position
      const parentStage = allNodes.find((n) => n.id === node.parentId);
      const absoluteX = (parentStage?.position.x || 0) + node.position.x;
      const absoluteY = (parentStage?.position.y || 0) + node.position.y;
      const nodeCenterX = absoluteX + nodeWidth / 2;
      const nodeCenterY = absoluteY + nodeHeight / 2;

      // Find which stage contains the node center
      const stageNodes = allNodes.filter((n) => {
        const nodeType = (n.data as Record<string, unknown>)?.nodeType;
        return (
          n.type === 'stage' ||
          n.type === 'stageV2' ||
          (typeof nodeType === 'string' && nodeType.includes('Stage'))
        );
      });

      let targetStage: Node | undefined;
      for (const stage of stageNodes) {
        const stageWidth = (stage.style?.width as number) || (stage.width as number) || 304;
        const stageHeight =
          (stage.style?.height as number) || (stage.measured?.height as number) || 200;

        if (
          isPointInStage(
            nodeCenterX,
            nodeCenterY,
            stage.position.x,
            stage.position.y,
            stageWidth,
            stageHeight
          )
        ) {
          targetStage = stage;
          break;
        }
      }

      if (targetStage) {
        const targetStageData = targetStage.data as Record<string, unknown>;
        const stageDetails = targetStageData?.stageDetails as Record<string, unknown> | undefined;
        const taskIds = (stageDetails?.taskIds as string[][]) || [];
        const stageWidth = (targetStage.style?.width as number) || 304;

        // Calculate node position relative to target stage
        const relativeX = absoluteX - targetStage.position.x;
        const relativeY = absoluteY - targetStage.position.y;

        // Calculate drop position using simplified bucket approach
        const dropPos = calculateDropPosition(
          relativeY,
          nodeHeight,
          relativeX,
          nodeWidth,
          stageWidth,
          taskIds,
          node.id
        );

        // Convert flat index to group/task indices
        const filteredTaskIds = taskIds
          .map((g) => g.filter((id) => id !== node.id))
          .filter((g) => g.length > 0);
        const { groupIndex, taskIndex } = convertToGroupPosition(
          dropPos.index,
          dropPos.isParallel,
          filteredTaskIds,
          dropPos.draggedYCenter,
          taskIds // Pass original taskIds to detect originally-parallel groups
        );

        // Update refs synchronously for use in onNodeDragStop
        // This avoids stale closure issues with React state
        currentDropPositionRef.current = {
          groupIndex,
          taskIndex,
          isParallel: dropPos.isParallel,
        };
        currentTargetStageRef.current = targetStage!.id;

        setDragState((prev) => ({
          ...prev,
          targetStageId: targetStage!.id,
          dropPosition: {
            groupIndex,
            taskIndex,
            isParallel: dropPos.isParallel,
          },
        }));
      }
      // When no stage is found, keep the previous valid position
      // This keeps the placeholder visible at its last valid location
    },
    [dragState.isDragging, getNodes]
  );

  /**
   * Handler for when node drag ends
   * Replaces placeholder with the dragged node
   */
  const onNodeDragStop: OnNodeDrag = useCallback(
    (_event, node, _nodes) => {
      // Use refs for drag state since React state updates are async
      // This ensures we handle the drag stop even if state hasn't updated yet
      if (node.type !== 'task' || !isDraggingRef.current) return;

      // Remove keyboard listeners
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);

      // Use refs for all drag info (they're set synchronously in onNodeDragStart)
      const taskId = draggedTaskIdRef.current;
      const sourceStageId = sourceStageIdRef.current;
      const isCopyMode = isCopyModeRef.current;
      const dropPosition = currentDropPositionRef.current;
      const targetStageId = currentTargetStageRef.current;

      if (taskId && sourceStageId && targetStageId && dropPosition) {
        const isCrossStage = sourceStageId !== targetStageId;

        if (isCrossStage) {
          if (isCopyMode) {
            // Copy operation
            const newTaskId = `task-${crypto.randomUUID()}`;
            onTaskCopy?.({
              taskId,
              newTaskId,
              sourceStageId,
              targetStageId,
              position: dropPosition,
            });
          } else {
            // Move operation
            onTaskMove?.({
              taskId,
              sourceStageId,
              targetStageId,
              position: dropPosition,
            });
          }
        } else {
          // Same-stage reorder
          onTaskReorder?.({
            taskId,
            stageId: sourceStageId,
            position: dropPosition,
          });
        }
      }

      // Clear all refs
      isDraggingRef.current = false;
      draggedTaskIdRef.current = null;
      sourceStageIdRef.current = null;
      currentDropPositionRef.current = null;
      currentTargetStageRef.current = null;

      // Remove placeholder node and reset dragged node position
      // React Flow directly modifies node position during drag, so we need to reset it
      setNodes((nodes) => {
        const filteredNodes = nodes.filter((n) => n.id !== '__placeholder__');

        // Find the dragged node and its parent stage to recalculate position
        const draggedNode = filteredNodes.find((n) => n.id === taskId);
        if (!draggedNode || !draggedNode.parentId) return filteredNodes;

        const parentStage = filteredNodes.find((n) => n.id === draggedNode.parentId);
        if (!parentStage) return filteredNodes;

        // Get taskIds from stage to recalculate positions
        const stageData = parentStage.data as Record<string, unknown>;
        const stageDetails = stageData?.stageDetails as Record<string, unknown> | undefined;
        const stageTaskIds = (stageDetails?.taskIds as string[][]) || [];
        const stageWidth = (parentStage.style?.width as number) || 304;

        // Recalculate positions for all tasks in the stage
        const positions = calculateTaskPositions(stageTaskIds, stageWidth, filteredNodes);

        return filteredNodes.map((n) => {
          if (n.type === 'task' && n.parentId === draggedNode.parentId) {
            const pos = positions.get(n.id);
            if (pos) {
              return {
                ...n,
                position: { x: pos.x, y: pos.y },
              };
            }
          }
          return n;
        });
      });

      // Reset drag state
      setDragState({
        isDragging: false,
        taskId: null,
        sourceStageId: null,
        targetStageId: null,
        isCopyMode: false,
        dropPosition: null,
      });
    },
    [handleKeyDown, handleKeyUp, onTaskCopy, onTaskMove, onTaskReorder, setNodes]
  );

  return {
    dragState,
    handlers: {
      onNodeDragStart,
      onNodeDrag,
      onNodeDragStop,
    },
  };
}
