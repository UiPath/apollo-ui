/**
 * TaskTypeRegistry - Registry for task type manifests
 *
 * Manages task type definitions for use within stage nodes.
 * Provides validation, lookup, and toolbox integration.
 */

import type { ListItem } from '../components';
import type { TaskManifest } from '../schema/task-definition';

/**
 * Icon resolver function type
 */
export type TaskIconResolver = (iconId: string) => React.ReactElement | undefined;

/**
 * Registry for task type manifests.
 * Manages task type definitions using JSON manifests.
 */
export class TaskTypeRegistry {
  private taskByType = new Map<string, TaskManifest>();
  private tasksByCategory = new Map<string | undefined, TaskManifest[]>();

  /**
   * Register task manifests.
   *
   * @param tasks - Array of task manifests to register
   */
  registerTaskManifests(tasks: TaskManifest[]): void {
    // Clear existing registrations
    this.taskByType.clear();
    this.tasksByCategory.clear();

    // Build lookup maps
    for (const task of tasks) {
      this.taskByType.set(task.taskType, task);

      // Group by category for toolbox
      const categoryKey = task.category;
      const categoryTasks = this.tasksByCategory.get(categoryKey) ?? [];
      categoryTasks.push(task);
      this.tasksByCategory.set(categoryKey, categoryTasks);
    }

    // Sort tasks within each category by sortOrder
    for (const [key, categoryTasks] of this.tasksByCategory.entries()) {
      categoryTasks.sort((a, b) => a.sortOrder - b.sortOrder);
      this.tasksByCategory.set(key, categoryTasks);
    }
  }

  /**
   * Get a task manifest by type.
   *
   * @param taskType - Task type identifier
   * @returns Task manifest or undefined if not found
   */
  getManifest(taskType: string): TaskManifest | undefined {
    return this.taskByType.get(taskType);
  }

  /**
   * Get all registered task manifests.
   *
   * @returns Array of all task manifests
   */
  getAllManifests(): TaskManifest[] {
    return Array.from(this.taskByType.values());
  }

  /**
   * Get all registered task types.
   *
   * @returns Array of task type identifiers
   */
  getAllTaskTypes(): string[] {
    return Array.from(this.taskByType.keys());
  }

  /**
   * Check if a task type can be added to a stage with given node type.
   *
   * @param taskType - The task type to check
   * @param stageNodeType - The stage's nodeType (e.g., "case-management:Stage")
   * @returns true if task can be added to the stage
   */
  isTaskAllowedInStage(taskType: string, stageNodeType: string): boolean {
    const manifest = this.getManifest(taskType);
    if (!manifest) return false;

    // If no allowedStageTypes specified, task is allowed everywhere
    if (!manifest.allowedStageTypes || manifest.allowedStageTypes.length === 0) {
      return true;
    }

    return manifest.allowedStageTypes.includes(stageNodeType);
  }

  /**
   * Get task options for a stage's toolbox, filtered by allowed stage types.
   *
   * @param stageNodeType - The stage's nodeType for filtering
   * @param iconResolver - Optional function to resolve icon identifiers to React elements
   * @returns Array of ListItems for toolbox display
   */
  getTaskOptionsForStage(
    stageNodeType: string,
    iconResolver?: TaskIconResolver
  ): ListItem[] {
    const options: ListItem[] = [];

    for (const manifest of this.taskByType.values()) {
      if (!this.isTaskAllowedInStage(manifest.taskType, stageNodeType)) {
        continue;
      }

      options.push({
        id: manifest.taskType,
        name: manifest.display.label,
        description: manifest.display.description,
        icon: iconResolver
          ? { Component: () => iconResolver(manifest.display.icon) ?? null }
          : undefined,
        section: manifest.category,
        data: {
          taskType: manifest.taskType,
          defaultProperties: manifest.defaultProperties,
        },
      });
    }

    // Sort by section (category), then by sortOrder
    return options.sort((a, b) => {
      const catA = a.section ?? '';
      const catB = b.section ?? '';
      if (catA !== catB) return catA.localeCompare(catB);

      const manifestA = this.taskByType.get(a.id);
      const manifestB = this.taskByType.get(b.id);
      return (manifestA?.sortOrder ?? 0) - (manifestB?.sortOrder ?? 0);
    });
  }

  /**
   * Get tasks grouped by category.
   *
   * @param stageNodeType - Optional stage node type for filtering
   * @returns Map of category to task manifests
   */
  getTasksByCategory(stageNodeType?: string): Map<string | undefined, TaskManifest[]> {
    if (!stageNodeType) {
      return this.tasksByCategory;
    }

    // Filter by stage type
    const filtered = new Map<string | undefined, TaskManifest[]>();
    for (const [category, tasks] of this.tasksByCategory.entries()) {
      const allowedTasks = tasks.filter((t) =>
        this.isTaskAllowedInStage(t.taskType, stageNodeType)
      );
      if (allowedTasks.length > 0) {
        filtered.set(category, allowedTasks);
      }
    }
    return filtered;
  }

  /**
   * Search tasks by label or tags.
   *
   * @param query - Search query
   * @param stageNodeType - Optional stage node type for filtering
   * @returns Array of matching task manifests
   */
  searchTasks(query: string, stageNodeType?: string): TaskManifest[] {
    const lowerQuery = query.toLowerCase();
    const results: TaskManifest[] = [];

    for (const manifest of this.taskByType.values()) {
      // Apply stage type filter if provided
      if (stageNodeType && !this.isTaskAllowedInStage(manifest.taskType, stageNodeType)) {
        continue;
      }

      // Check label
      if (manifest.display.label.toLowerCase().includes(lowerQuery)) {
        results.push(manifest);
        continue;
      }

      // Check description
      if (manifest.display.description?.toLowerCase().includes(lowerQuery)) {
        results.push(manifest);
        continue;
      }

      // Check tags
      if (manifest.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))) {
        results.push(manifest);
      }
    }

    return results.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  /**
   * Create default task data from a manifest.
   *
   * @param taskType - Task type identifier
   * @returns Default task data or undefined if manifest not found
   */
  createDefaultTaskData(taskType: string): Record<string, unknown> | undefined {
    const manifest = this.getManifest(taskType);
    if (!manifest) return undefined;

    return {
      taskType: manifest.taskType,
      label: manifest.display.label,
      icon: manifest.display.icon,
      ...(manifest.defaultProperties ?? {}),
    };
  }

  /**
   * Clear all registrations.
   */
  clear(): void {
    this.taskByType.clear();
    this.tasksByCategory.clear();
  }
}
