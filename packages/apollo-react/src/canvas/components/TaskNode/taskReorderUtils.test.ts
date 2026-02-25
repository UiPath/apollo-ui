import { describe, it, expect } from 'vitest';
import { reorderTaskIds, flattenTaskIds, moveTaskWithinStage } from './taskReorderUtils';

describe('taskReorderUtils', () => {
  describe('reorderTaskIds', () => {
    it('moves sequential task to end as sequential', () => {
      // Original: [['task-1'], ['task-2', 'task-3'], ['task-4']]
      // Move task-1 to end (after filtering: [['task-2', 'task-3'], ['task-4']])
      // Target: groupIndex=2, taskIndex=0, depth=0 (sequential)
      const taskIds = [['task-1'], ['task-2', 'task-3'], ['task-4']];
      const result = reorderTaskIds(taskIds, 'task-1', 2, 0, 0);

      // Expected: [['task-2', 'task-3'], ['task-4'], ['task-1']]
      expect(result).toEqual([['task-2', 'task-3'], ['task-4'], ['task-1']]);
    });

    it('moves sequential task to N-1 position (before last task)', () => {
      // Original: [['task-1'], ['task-2', 'task-3'], ['task-4']]
      // Move task-1 to position before task-4
      // Filtered: [['task-2', 'task-3'], ['task-4']]
      // Target: groupIndex=1, taskIndex=0, depth=0 (sequential, before the sequential task-4)
      const taskIds = [['task-1'], ['task-2', 'task-3'], ['task-4']];
      const result = reorderTaskIds(taskIds, 'task-1', 1, 0, 0);

      // Expected: [['task-2', 'task-3'], ['task-1'], ['task-4']]
      expect(result).toEqual([['task-2', 'task-3'], ['task-1'], ['task-4']]);
    });

    it('moves task to join parallel group at end', () => {
      // Original: [['task-1'], ['task-2', 'task-3']]
      // Move task-1 to join the parallel group
      // Filtered: [['task-2', 'task-3']]
      // Target: groupIndex=0, taskIndex=2, depth=1 (parallel, at end of group)
      const taskIds = [['task-1'], ['task-2', 'task-3']];
      const result = reorderTaskIds(taskIds, 'task-1', 1, 0, 1);

      // Expected: [['task-2', 'task-3', 'task-1']] - joined the parallel group
      expect(result).toEqual([['task-2', 'task-3', 'task-1']]);
    });

    it('keeps task in parallel group when reordering within it', () => {
      // Original: [['task-1', 'task-2', 'task-3']]
      // Move task-1 to end of group
      // Filtered: [['task-2', 'task-3']]
      // Target: groupIndex=0, taskIndex=2, depth=1
      const taskIds = [['task-1', 'task-2', 'task-3']];
      const result = reorderTaskIds(taskIds, 'task-1', 0, 2, 1);

      // Expected: [['task-2', 'task-3', 'task-1']]
      expect(result).toEqual([['task-2', 'task-3', 'task-1']]);
    });

    it('allows task to break out of parallel group to sequential', () => {
      // Original: [['task-1', 'task-2']]
      // Move task-1 to be sequential after task-2
      // Filtered: [['task-2']]
      // Target: groupIndex=1, taskIndex=0, depth=0
      const taskIds = [['task-1', 'task-2']];
      const result = reorderTaskIds(taskIds, 'task-1', 1, 0, 0);

      // Expected: [['task-2'], ['task-1']]
      expect(result).toEqual([['task-2'], ['task-1']]);
    });

    it('preserves parallel groups when moving between them', () => {
      // Original: [['task-1', 'task-2'], ['task-3'], ['task-4', 'task-5']]
      // Move task-1 to before task-3 (sequential)
      // Filtered: [['task-2'], ['task-3'], ['task-4', 'task-5']]
      // Target: groupIndex=1, taskIndex=0, depth=0
      const taskIds = [['task-1', 'task-2'], ['task-3'], ['task-4', 'task-5']];
      const result = reorderTaskIds(taskIds, 'task-1', 1, 0, 0);

      // Expected: [['task-2'], ['task-1'], ['task-3'], ['task-4', 'task-5']]
      expect(result).toEqual([['task-2'], ['task-1'], ['task-3'], ['task-4', 'task-5']]);
    });
  });

  describe('flattenTaskIds', () => {
    it('flattens sequential tasks', () => {
      const taskIds = [['task-1'], ['task-2'], ['task-3']];
      const flattened = flattenTaskIds(taskIds);

      expect(flattened).toEqual([
        { id: 'task-1', groupIndex: 0, taskIndex: 0, depth: 0 },
        { id: 'task-2', groupIndex: 1, taskIndex: 0, depth: 0 },
        { id: 'task-3', groupIndex: 2, taskIndex: 0, depth: 0 },
      ]);
    });

    it('flattens parallel groups with depth 1', () => {
      const taskIds = [['task-1', 'task-2'], ['task-3']];
      const flattened = flattenTaskIds(taskIds);

      expect(flattened).toEqual([
        { id: 'task-1', groupIndex: 0, taskIndex: 0, depth: 1 },
        { id: 'task-2', groupIndex: 0, taskIndex: 1, depth: 1 },
        { id: 'task-3', groupIndex: 1, taskIndex: 0, depth: 0 },
      ]);
    });
  });

  describe('moveTaskWithinStage', () => {
    it('moves bottom task up in parallel group without affecting sequential task above', () => {
      // Original: [['task-1'], ['task-2', 'task-3']] - sequential then parallel
      // Drag task-3 (bottom of parallel group) up
      // Position calculated by convertToGroupPosition: groupIndex=1, taskIndex=0, isParallel=true
      const taskIds = [['task-1'], ['task-2', 'task-3']];
      const result = moveTaskWithinStage(taskIds, 'task-3', {
        groupIndex: 1,
        taskIndex: 0,
        isParallel: true,
      });

      // task-1 should remain separate, task-3 should join task-2's group at position 0
      expect(result).toEqual([['task-1'], ['task-3', 'task-2']]);
    });

    it('moves bottom task up in parallel group without joining parallel group above', () => {
      // Original: [['task-1', 'task-2'], ['task-3', 'task-4']] - two parallel groups
      // Drag task-4 (bottom of second group) up
      // Position: groupIndex=1, taskIndex=0, isParallel=true
      const taskIds = [['task-1', 'task-2'], ['task-3', 'task-4']];
      const result = moveTaskWithinStage(taskIds, 'task-4', {
        groupIndex: 1,
        taskIndex: 0,
        isParallel: true,
      });

      // First parallel group should remain unchanged, task-4 joins task-3's group
      expect(result).toEqual([['task-1', 'task-2'], ['task-4', 'task-3']]);
    });

    it('correctly reorders within the same parallel group', () => {
      // Original: [['task-1', 'task-2', 'task-3']]
      // Move task-1 to end of group
      const taskIds = [['task-1', 'task-2', 'task-3']];
      const result = moveTaskWithinStage(taskIds, 'task-1', {
        groupIndex: 0,
        taskIndex: 2,
        isParallel: true,
      });

      expect(result).toEqual([['task-2', 'task-3', 'task-1']]);
    });

    it('breaks out of parallel group to sequential', () => {
      // Original: [['task-1', 'task-2']]
      // Move task-1 to be sequential after task-2
      const taskIds = [['task-1', 'task-2']];
      const result = moveTaskWithinStage(taskIds, 'task-1', {
        groupIndex: 1,
        taskIndex: 0,
        isParallel: false,
      });

      expect(result).toEqual([['task-2'], ['task-1']]);
    });
  });
});
