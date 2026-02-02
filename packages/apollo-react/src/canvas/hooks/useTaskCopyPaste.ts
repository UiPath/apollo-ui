/**
 * useTaskCopyPaste - Hook for task copy/paste functionality
 *
 * Provides clipboard-based copy and paste operations for tasks.
 * Uses a custom clipboard state (not system clipboard) to track copied tasks.
 *
 * Key features:
 * - Ctrl/Cmd+C to copy selected task
 * - Ctrl/Cmd+V to paste task into target stage
 * - Maintains task data for paste operations
 * - Generates new IDs for pasted tasks
 */

import { useReactFlow } from '@xyflow/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { TaskNodeData } from '../components/TaskNode/TaskNode.types';

/**
 * Data stored in clipboard for a copied task
 */
export interface ClipboardTask {
  /** Original task ID */
  originalId: string;
  /** Source stage ID */
  sourceStageId: string;
  /** Task data (without position-specific info) */
  data: Omit<TaskNodeData, 'groupIndex' | 'taskIndex'>;
}

/**
 * Parameters for paste operation
 */
export interface TaskPasteParams {
  /** New task ID */
  newTaskId: string;
  /** Original task data */
  originalData: Omit<TaskNodeData, 'groupIndex' | 'taskIndex'>;
  /** Source stage ID */
  sourceStageId: string;
  /** Target stage ID */
  targetStageId: string;
  /** Position in target stage (defaults to end) */
  position: {
    groupIndex: number;
    taskIndex: number;
  };
}

/**
 * Callbacks for copy/paste operations
 */
export interface TaskCopyPasteCallbacks {
  /** Called when a task is pasted */
  onTaskPaste?: (params: TaskPasteParams) => void;
  /** Called when a task is copied to clipboard */
  onTaskCopy?: (task: ClipboardTask) => void;
}

/**
 * Options for the useTaskCopyPaste hook
 */
export interface UseTaskCopyPasteOptions {
  /** Currently selected task ID */
  selectedTaskId?: string | null;
  /** Currently focused/target stage ID for paste */
  targetStageId?: string | null;
  /** Task IDs in target stage (for calculating paste position) */
  targetTaskIds?: string[][];
  /** Whether copy/paste is enabled */
  enabled?: boolean;
}

/**
 * Hook for task copy/paste functionality
 */
export function useTaskCopyPaste(
  callbacks: TaskCopyPasteCallbacks = {},
  options: UseTaskCopyPasteOptions = {}
) {
  const { getNode } = useReactFlow();
  const { onTaskPaste, onTaskCopy } = callbacks;
  const {
    selectedTaskId = null,
    targetStageId = null,
    targetTaskIds = [],
    enabled = true,
  } = options;

  // Clipboard state
  const [clipboard, setClipboard] = useState<ClipboardTask | null>(null);

  // Refs for callback dependencies
  const selectedTaskIdRef = useRef(selectedTaskId);
  const targetStageIdRef = useRef(targetStageId);
  const targetTaskIdsRef = useRef(targetTaskIds);

  // Update refs when props change
  useEffect(() => {
    selectedTaskIdRef.current = selectedTaskId;
    targetStageIdRef.current = targetStageId;
    targetTaskIdsRef.current = targetTaskIds;
  }, [selectedTaskId, targetStageId, targetTaskIds]);

  /**
   * Copy the currently selected task to clipboard
   */
  const copyTask = useCallback(() => {
    const taskId = selectedTaskIdRef.current;
    if (!taskId) return false;

    const taskNode = getNode(taskId);
    if (!taskNode || taskNode.type !== 'task') return false;

    const taskData = taskNode.data as TaskNodeData;
    const sourceStageId = taskNode.parentId;
    if (!sourceStageId) return false;

    const clipboardTask: ClipboardTask = {
      originalId: taskId,
      sourceStageId,
      data: {
        taskType: taskData.taskType,
        label: taskData.label,
        icon: taskData.icon,
        iconElement: taskData.iconElement,
        execution: taskData.execution,
      },
    };

    setClipboard(clipboardTask);
    onTaskCopy?.(clipboardTask);
    return true;
  }, [getNode, onTaskCopy]);

  /**
   * Paste the clipboard task into the target stage
   */
  const pasteTask = useCallback(() => {
    if (!clipboard) return false;

    const targetId = targetStageIdRef.current;
    if (!targetId) return false;

    // Verify target is a valid stage
    const targetNode = getNode(targetId);
    if (!targetNode) return false;

    const nodeType = targetNode.type;
    const nodeData = targetNode.data as Record<string, unknown>;
    const dataNodeType = nodeData?.nodeType as string | undefined;

    // Check if it's a stage node
    const isStage =
      nodeType === 'stage' ||
      nodeType === 'stageV2' ||
      (typeof dataNodeType === 'string' && dataNodeType.includes('Stage'));

    if (!isStage) return false;

    // Generate new task ID
    const newTaskId = `task-${crypto.randomUUID()}`;

    // Calculate paste position (at the end of target stage)
    const currentTaskIds = targetTaskIdsRef.current;
    const position = {
      groupIndex: currentTaskIds.length,
      taskIndex: 0,
    };

    // Call paste callback
    onTaskPaste?.({
      newTaskId,
      originalData: clipboard.data,
      sourceStageId: clipboard.sourceStageId,
      targetStageId: targetId,
      position,
    });

    return true;
  }, [clipboard, getNode, onTaskPaste]);

  /**
   * Check if clipboard has content
   */
  const hasClipboardContent = clipboard !== null;

  /**
   * Clear the clipboard
   */
  const clearClipboard = useCallback(() => {
    setClipboard(null);
  }, []);

  /**
   * Keyboard event handler
   */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      const isModifierPressed = event.ctrlKey || event.metaKey;
      if (!isModifierPressed) return;

      // Ignore if typing in an input
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case 'c':
          if (copyTask()) {
            event.preventDefault();
          }
          break;
        case 'v':
          if (pasteTask()) {
            event.preventDefault();
          }
          break;
      }
    },
    [enabled, copyTask, pasteTask]
  );

  // Set up keyboard listeners
  useEffect(() => {
    if (!enabled) return;

    // Use capture phase so the event fires before React Flow can stop propagation
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [enabled, handleKeyDown]);

  return {
    /** Current clipboard content */
    clipboard,
    /** Whether clipboard has content */
    hasClipboardContent,
    /** Copy the selected task to clipboard */
    copyTask,
    /** Paste clipboard content to target stage */
    pasteTask,
    /** Clear the clipboard */
    clearClipboard,
  };
}
