import { createContext, useContext, useMemo } from 'react';
import type { TaskManifest } from '../schema/task-definition';
import type { TaskTypeRegistry } from './TaskTypeRegistry';

interface TaskRegistryContextValue {
  registry: TaskTypeRegistry;
}

export const TaskRegistryContext = createContext<TaskRegistryContextValue | null>(null);

/**
 * Hook to access the task type registry.
 * @throws {Error} If used outside of TaskRegistryProvider
 * @returns TaskTypeRegistry instance
 */
export const useTaskTypeRegistry = (): TaskTypeRegistry => {
  const context = useContext(TaskRegistryContext);
  if (!context) {
    throw new Error('useTaskTypeRegistry must be used within a TaskRegistryProvider');
  }
  return context.registry;
};

/**
 * Hook to optionally access the task type registry.
 * @returns TaskTypeRegistry instance or null if not available
 */
export const useOptionalTaskTypeRegistry = (): TaskTypeRegistry | null => {
  const context = useContext(TaskRegistryContext);
  return context?.registry ?? null;
};

/**
 * Hook to get all registered task manifests.
 * @returns Array of all task manifests
 */
export const useTaskManifests = (): TaskManifest[] => {
  const registry = useTaskTypeRegistry();
  return useMemo(() => registry.getAllManifests(), [registry]);
};

/**
 * Hook to get a specific task manifest by type.
 * @param taskType - Task type identifier
 * @returns Task manifest or undefined if not found
 */
export const useTaskManifest = (taskType: string): TaskManifest | undefined => {
  const registry = useTaskTypeRegistry();
  return useMemo(() => registry.getManifest(taskType), [registry, taskType]);
};

/**
 * Hook to check if a task type is allowed in a specific stage.
 * @param taskType - Task type identifier
 * @param stageNodeType - Stage node type (e.g., "case-management:Stage")
 * @returns true if task is allowed in the stage
 */
export const useIsTaskAllowedInStage = (
  taskType: string,
  stageNodeType: string
): boolean => {
  const registry = useTaskTypeRegistry();
  return useMemo(
    () => registry.isTaskAllowedInStage(taskType, stageNodeType),
    [registry, taskType, stageNodeType]
  );
};
