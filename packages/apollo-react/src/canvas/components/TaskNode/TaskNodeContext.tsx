import { createContext, useContext, type ReactNode } from 'react';

/**
 * Context value for task nodes within a stage
 */
export interface TaskNodeContextValue {
  /** Stage ID that contains this task */
  stageId: string;
  /** Stage node type (e.g., "case-management:Stage") */
  stageNodeType: string;
  /** 2D array of task IDs - used to determine parallel grouping */
  taskIds: string[][];
  /** Whether the stage is read-only */
  isReadOnly?: boolean;
  /** Callback when a task is clicked */
  onTaskClick?: (taskId: string) => void;
  /** Callback when a task is selected */
  onTaskSelect?: (taskId: string) => void;
}

const TaskNodeContext = createContext<TaskNodeContextValue | null>(null);

/**
 * Provider for task node context
 */
export interface TaskNodeProviderProps {
  children: ReactNode;
  value: TaskNodeContextValue;
}

export function TaskNodeProvider({ children, value }: TaskNodeProviderProps) {
  return (
    <TaskNodeContext.Provider value={value}>
      {children}
    </TaskNodeContext.Provider>
  );
}

/**
 * Hook to access task node context
 * @throws Error if used outside of TaskNodeProvider
 */
export function useTaskNodeContext(): TaskNodeContextValue {
  const context = useContext(TaskNodeContext);
  if (!context) {
    throw new Error('useTaskNodeContext must be used within a TaskNodeProvider');
  }
  return context;
}

/**
 * Hook to check if a task is in a parallel group
 * @param taskId - The task ID to check
 * @returns Whether the task is in a parallel group (group has more than 1 task)
 */
export function useIsTaskParallel(taskId: string): boolean {
  const context = useContext(TaskNodeContext);
  if (!context) return false;

  for (const group of context.taskIds) {
    if (group.includes(taskId)) {
      return group.length > 1;
    }
  }
  return false;
}

/**
 * Hook to get group information for a task
 * @param taskId - The task ID to look up
 * @returns Group information or null if not found
 */
export function useTaskGroupInfo(taskId: string): {
  groupIndex: number;
  taskIndex: number;
  isParallel: boolean;
  groupSize: number;
} | null {
  const context = useContext(TaskNodeContext);
  if (!context) return null;

  for (let groupIndex = 0; groupIndex < context.taskIds.length; groupIndex++) {
    const group = context.taskIds[groupIndex];
    if (!group) continue;
    const taskIndex = group.indexOf(taskId);
    if (taskIndex !== -1) {
      return {
        groupIndex,
        taskIndex,
        isParallel: group.length > 1,
        groupSize: group.length,
      };
    }
  }
  return null;
}

/**
 * Hook to safely access task node context (returns null if not in provider)
 */
export function useOptionalTaskNodeContext(): TaskNodeContextValue | null {
  return useContext(TaskNodeContext);
}
