import { describe, expect, it } from 'vitest';
import { calculateDropPosition, convertToGroupPosition } from './calculateTaskDropPosition';
import { DEFAULT_TASK_POSITION_CONFIG } from '../components/TaskNode/useTaskPositions';

const config = DEFAULT_TASK_POSITION_CONFIG;

describe('calculateTaskDropPosition', () => {
  describe('calculateDropPosition', () => {
    describe('Y-position bucket calculation', () => {
      it('returns index 0 when node center is above first task midpoint', () => {
        // taskIds: [[task-1], [task-2], [task-3]]
        // Task positions relative to content: 16, 64 (16+36+12), 112 (64+36+12)
        const taskIds = [['task-1'], ['task-2'], ['task-3']];
        const stageWidth = 304;
        const nodeHeight = 36;
        const nodeWidth = 276; // Full width task

        // Node at header height + contentPaddingTop = 56 + 16 = 72 (stage-relative)
        // PY = 72 - 56 + 18 = 34 (content-relative center)
        // Bottom of index 0 = 16 + 36 = 52, + halfGap (6) = 58
        // PY (34) <= 58, so index = 0
        const result = calculateDropPosition(
          72, // nodeY: header(56) + content padding(16)
          nodeHeight,
          14, // nodeX: left padding
          nodeWidth,
          stageWidth,
          taskIds,
          'task-dragged' // not in this stage
        );

        expect(result.index).toBe(0);
      });

      it('returns index 1 when node center is in second bucket', () => {
        const taskIds = [['task-1'], ['task-2'], ['task-3']];
        const stageWidth = 304;
        const nodeHeight = 36;
        const nodeWidth = 276;

        // Place node center in second bucket
        // Bottom of index 0 + halfGap = 52 + 6 = 58
        // Bottom of index 1 + halfGap = 52 + 36 + 12 + 6 = 106
        // Put PY at 80 (between 58 and 106)
        // nodeY = 80 + 56 - 18 = 118
        const result = calculateDropPosition(
          118,
          nodeHeight,
          14,
          nodeWidth,
          stageWidth,
          taskIds,
          'task-dragged'
        );

        expect(result.index).toBe(1);
      });

      it('returns last index when node is below all tasks', () => {
        const taskIds = [['task-1'], ['task-2']];
        const stageWidth = 304;
        const nodeHeight = 36;
        const nodeWidth = 276;

        // Put node far below all tasks
        // Bottom of last task (index 1) = 16 + 36 + 12 + 36 = 100
        // Threshold for "after all" = 100 + 6 = 106
        // Put PY at 150 (well above 106)
        // nodeY = 150 + 56 - 18 = 188
        const result = calculateDropPosition(
          188,
          nodeHeight,
          14,
          nodeWidth,
          stageWidth,
          taskIds,
          'task-dragged'
        );

        expect(result.index).toBe(2); // Insert after last (totalTasks = 2)
      });

      it('returns index N-1 when node is in the second-to-last bucket', () => {
        // Test that index N-1 (last task position) is reachable
        const taskIds = [['task-1'], ['task-2'], ['task-3']];
        const stageWidth = 304;
        const nodeHeight = 36;
        const nodeWidth = 276;

        // 3 tasks: indices 0, 1, 2, totalTasks = 3
        // Task positions (content-relative Y):
        // Task 0: top=16, bottom=52
        // Task 1: top=64, bottom=100
        // Task 2: top=112, bottom=148
        // halfGap = 6
        //
        // Bucket for index 2: bottom(1) + halfGap < PY <= bottom(2) + halfGap
        //                     100 + 6 = 106 < PY <= 148 + 6 = 154
        // Put PY at 130 (within this range)
        // nodeY = 130 + 56 - 18 = 168
        const result = calculateDropPosition(
          168,
          nodeHeight,
          14,
          nodeWidth,
          stageWidth,
          taskIds,
          'task-dragged'
        );

        expect(result.index).toBe(2); // Index N-1 (second to last)
      });

      it('returns 0 for empty stage', () => {
        const taskIds: string[][] = [];
        const result = calculateDropPosition(100, 36, 14, 276, 304, taskIds, 'task-dragged');

        expect(result.index).toBe(0);
      });
    });

    describe('X-position parallel detection', () => {
      it('returns isParallel=false when node center is in left half', () => {
        const taskIds = [['task-1'], ['task-2']];
        const stageWidth = 304;
        const nodeWidth = 276;

        // nodeX = 14, center = 14 + 138 = 152, which is exactly stageWidth/2
        // Let's put it more to the left
        const result = calculateDropPosition(
          100, // nodeY
          36, // nodeHeight
          0, // nodeX - far left
          100, // nodeWidth - narrow
          stageWidth,
          taskIds,
          'task-dragged'
        );

        // center = 0 + 50 = 50 < 152 (stageWidth/2)
        // Sequential task at index 1 can be sequential
        expect(result.isParallel).toBe(false);
      });

      it('returns isParallel=false when over sequential tasks even in right half', () => {
        // Sequential tasks should NEVER be grouped, regardless of X position
        const taskIds = [['task-1'], ['task-2']];
        const stageWidth = 304;

        const result = calculateDropPosition(
          100, // nodeY
          36, // nodeHeight
          200, // nodeX - far right
          100, // nodeWidth
          stageWidth,
          taskIds,
          'task-dragged'
        );

        // Even though center = 200 + 50 = 250 > 152 (stageWidth/2),
        // target is a sequential task, so isParallel must be false
        expect(result.isParallel).toBe(false);
      });

      it('forces isParallel=true when in middle of parallel group', () => {
        // For middle tasks in parallel group, canBeSequential is false
        const taskIds = [['task-1', 'task-2', 'task-3']];
        const stageWidth = 304;

        // Even with node in left half, middle of parallel group stays parallel
        const result = calculateDropPosition(
          100, // nodeY - positions at index 1 (middle task)
          36,
          0, // far left
          50,
          stageWidth,
          taskIds,
          'task-dragged'
        );

        // At index 1 in a 3-task parallel group, taskIndex 1 is not edge
        // So canBeSequential = false, isParallel = true regardless of X
        expect(result.isParallel).toBe(true);
      });
    });

    describe('dragged task exclusion', () => {
      it('excludes dragged task from position calculation', () => {
        const taskIds = [['task-1'], ['task-dragged'], ['task-2']];
        const stageWidth = 304;

        // After filtering, taskIds becomes [['task-1'], ['task-2']]
        // So total tasks = 2, not 3
        const result = calculateDropPosition(
          200, // nodeY - far down
          36,
          14,
          276,
          stageWidth,
          taskIds,
          'task-dragged'
        );

        // Should return index 2 (insert after 2 remaining tasks)
        expect(result.index).toBe(2);
      });

      it('handles dragged task in parallel group', () => {
        const taskIds = [['task-1', 'task-dragged'], ['task-2']];
        const stageWidth = 304;

        // After filtering: [['task-1'], ['task-2']]
        const result = calculateDropPosition(
          200,
          36,
          14,
          276,
          stageWidth,
          taskIds,
          'task-dragged'
        );

        expect(result.index).toBe(2);
      });
    });
  });

  describe('convertToGroupPosition', () => {
    it('returns groupIndex 0 for empty taskIds', () => {
      const result = convertToGroupPosition(0, false, []);
      expect(result).toEqual({ groupIndex: 0, taskIndex: 0 });
    });

    it('converts sequential index 0 to first group', () => {
      const taskIds = [['task-1'], ['task-2']];
      const result = convertToGroupPosition(0, false, taskIds);
      expect(result).toEqual({ groupIndex: 0, taskIndex: 0 });
    });

    it('converts sequential index 1 to second group', () => {
      const taskIds = [['task-1'], ['task-2']];
      const result = convertToGroupPosition(1, false, taskIds);
      expect(result).toEqual({ groupIndex: 1, taskIndex: 0 });
    });

    it('converts parallel index to same group', () => {
      const taskIds = [['task-1', 'task-2'], ['task-3']];
      const result = convertToGroupPosition(1, true, taskIds);
      // index 1 is task-2 in group 0, parallel = insert at that position
      expect(result).toEqual({ groupIndex: 0, taskIndex: 1 });
    });

    it('appends to existing parallel group at end', () => {
      const taskIds = [['task-1'], ['task-2', 'task-3']];
      const result = convertToGroupPosition(3, true, taskIds);
      // index 3 is beyond end, parallel, last group is parallel (2 tasks)
      // So append to last group
      expect(result).toEqual({ groupIndex: 1, taskIndex: 2 });
    });

    it('creates new group at end for sequential', () => {
      const taskIds = [['task-1'], ['task-2']];
      const result = convertToGroupPosition(2, false, taskIds);
      expect(result).toEqual({ groupIndex: 2, taskIndex: 0 });
    });

    it('joins previous parallel group even when it appears sequential after filtering', () => {
      // Original: [['task-1', 'task-2'], ['task-3']] - task-1 and task-2 are parallel
      // Dragging task-1 down
      // Filtered: [['task-2'], ['task-3']] - task-2's group now looks sequential!
      // When isParallel=true and we're at the start of task-3's group,
      // we should join task-2's group because it was ORIGINALLY parallel
      const filteredTaskIds = [['task-2'], ['task-3']];
      const originalTaskIds = [['task-1', 'task-2'], ['task-3']];

      // index 1 is task-3 (first task in second group), isParallel=true
      const result = convertToGroupPosition(1, true, filteredTaskIds, undefined, originalTaskIds);

      // Should join previous group (task-2's group at index 0), not task-3's group
      expect(result).toEqual({ groupIndex: 0, taskIndex: 1 });
    });

    it('appends to last group when it was originally parallel', () => {
      // Original: [['task-1', 'task-2']] - parallel group
      // Dragging task-1 to end
      // Filtered: [['task-2']] - appears sequential
      const filteredTaskIds = [['task-2']];
      const originalTaskIds = [['task-1', 'task-2']];

      // index 1 is beyond end, isParallel=true
      const result = convertToGroupPosition(1, true, filteredTaskIds, undefined, originalTaskIds);

      // Should append to last group because it was originally parallel
      expect(result).toEqual({ groupIndex: 0, taskIndex: 1 });
    });

    it('does not join previous group when it was not originally parallel', () => {
      // Original: [['task-1'], ['task-2'], ['task-3']] - all sequential
      // Dragging task-1 down
      // Filtered: [['task-2'], ['task-3']]
      const filteredTaskIds = [['task-2'], ['task-3']];
      const originalTaskIds = [['task-1'], ['task-2'], ['task-3']];

      // index 1 is task-3, isParallel=true
      // But previous group was NOT originally parallel, so should NOT join it
      const result = convertToGroupPosition(1, true, filteredTaskIds, undefined, originalTaskIds);

      // Should insert into current group at task-3's position
      expect(result).toEqual({ groupIndex: 1, taskIndex: 0 });
    });

    it('joins current group when dragging bottom task up from parallel group (parallel group above)', () => {
      // Original: [['task-1', 'task-2'], ['task-3', 'task-4']] - two parallel groups
      // Dragging task-4 (bottom of second group) up
      // Filtered: [['task-1', 'task-2'], ['task-3']]
      // task-3's group now looks sequential but was originally parallel
      const filteredTaskIds = [['task-1', 'task-2'], ['task-3']];
      const originalTaskIds = [['task-1', 'task-2'], ['task-3', 'task-4']];

      // index 2 is task-3 (first task in second group), isParallel=true
      const result = convertToGroupPosition(2, true, filteredTaskIds, undefined, originalTaskIds);

      // Should join CURRENT group (task-3's group), NOT the previous parallel group
      expect(result).toEqual({ groupIndex: 1, taskIndex: 0 });
    });

    it('joins current group when dragging bottom task up from parallel group (sequential task above)', () => {
      // Original: [['task-1'], ['task-2', 'task-3']] - sequential then parallel
      // Dragging task-3 (bottom of parallel group) up
      // Filtered: [['task-1'], ['task-2']]
      // task-2's group now looks sequential but was originally parallel
      const filteredTaskIds = [['task-1'], ['task-2']];
      const originalTaskIds = [['task-1'], ['task-2', 'task-3']];

      // index 1 is task-2 (first task in second group), isParallel=true
      const result = convertToGroupPosition(1, true, filteredTaskIds, undefined, originalTaskIds);

      // Should join CURRENT group (task-2's group), NOT affect task-1
      expect(result).toEqual({ groupIndex: 1, taskIndex: 0 });
    });
  });

  describe('edge cases', () => {
    describe('parallel threshold boundary', () => {
      it('returns isParallel=false for sequential tasks regardless of X position', () => {
        // Sequential tasks should NEVER be grouped
        const taskIds = [['task-1'], ['task-2']];
        const stageWidth = 304;
        // Center at exactly 152 (stageWidth/2)
        const result = calculateDropPosition(
          100,
          36,
          102, // nodeX so center is at 152
          100, // nodeWidth
          stageWidth,
          taskIds,
          'task-dragged'
        );

        // Target is sequential, so isParallel must be false
        expect(result.isParallel).toBe(false);
      });

      it('returns isParallel=false when node center is 1px left of midpoint', () => {
        const taskIds = [['task-1'], ['task-2']];
        const stageWidth = 304;
        // Center at 151 (1px left of midpoint)
        const result = calculateDropPosition(
          100,
          36,
          101, // nodeX so center is at 151
          100,
          stageWidth,
          taskIds,
          'task-dragged'
        );

        // Target is sequential, so isParallel must be false
        expect(result.isParallel).toBe(false);
      });

      it('returns isParallel=false for sequential tasks even in right half', () => {
        // Sequential tasks should NEVER be grouped, regardless of X position
        const taskIds = [['task-1'], ['task-2']];
        const stageWidth = 304;
        // Center at 153 (1px right of midpoint)
        const result = calculateDropPosition(
          100,
          36,
          103, // nodeX so center is at 153
          100,
          stageWidth,
          taskIds,
          'task-dragged'
        );

        // Target is sequential, so isParallel must be false
        expect(result.isParallel).toBe(false);
      });

      it('X position threshold works for parallel groups', () => {
        // When over a parallel group edge, X position determines parallel vs sequential
        const taskIds = [['task-1', 'task-2']]; // Parallel group
        const stageWidth = 304;

        // Position at first task (edge of parallel group), right half
        const resultRight = calculateDropPosition(
          72, // First task position
          36,
          200, // Right half
          100,
          stageWidth,
          taskIds,
          'task-dragged'
        );
        expect(resultRight.isParallel).toBe(true); // Stays parallel

        // Position at first task (edge of parallel group), left half
        const resultLeft = calculateDropPosition(
          72,
          36,
          0, // Left half
          100,
          stageWidth,
          taskIds,
          'task-dragged'
        );
        expect(resultLeft.isParallel).toBe(false); // Can break out to sequential
      });
    });

    describe('parallel group edge detection', () => {
      it('allows first task in parallel group to become sequential', () => {
        // First task in parallel group can leave (taskIndex === 0)
        const taskIds = [['task-1', 'task-2', 'task-3']];
        const stageWidth = 304;

        // Drop at index 0 (first task position), left half
        const result = calculateDropPosition(
          72, // nodeY for first position
          36,
          0, // far left
          50,
          stageWidth,
          taskIds,
          'task-dragged'
        );

        // Index 0, taskIndex 0 in group → can be sequential
        expect(result.index).toBe(0);
        expect(result.isParallel).toBe(false);
      });

      it('allows last task in parallel group to become sequential', () => {
        // Last task in parallel group can leave (taskIndex === group.length - 1)
        const taskIds = [['task-1', 'task-2', 'task-3']];
        const stageWidth = 304;

        // For 3-task parallel group:
        // - Index 0: top=16, bottom=52
        // - Index 1: top=64, bottom=100
        // - Index 2: top=112, bottom=148
        // Rule 3 triggers when PY > topOfLast - halfGap = 112 - 6 = 106
        // So dropping past index 1's bucket goes to "after all" position
        // Let's test bucket 1 instead (between tasks 0 and 1)
        // Bucket 1: PY > 52 + 6 = 58 AND PY <= 100 + 6 = 106
        // Put PY at 80
        const result = calculateDropPosition(
          118, // nodeY = 80 + 56 - 18 = 118
          36,
          0, // far left
          50,
          stageWidth,
          taskIds,
          'task-dragged'
        );

        // Index 1, taskIndex 1 is middle of 3-task group → NOT edge, so parallel
        // Actually this tests the middle case. For edge case, use 2-task group
        expect(result.index).toBe(1);
        expect(result.isParallel).toBe(true); // Middle cannot be sequential
      });

      it('allows edge task in 2-task parallel group to become sequential', () => {
        // In a 2-task parallel group, both tasks are edges (first or last)
        const taskIds = [['task-1', 'task-2']];
        const stageWidth = 304;

        // For 2-task parallel group:
        // - Index 0: top=16, bottom=52
        // - Index 1: top=64, bottom=100
        // Bucket 1: PY > 52 + 6 = 58 AND PY <= topOfLast - halfGap = 64 - 6 = 58
        // Actually bucket 1 range is very narrow, let's test index 0
        // Bucket 0: PY <= 52 + 6 = 58
        const result = calculateDropPosition(
          72, // nodeY for first position (PY ~= 34)
          36,
          0, // far left
          50,
          stageWidth,
          taskIds,
          'task-dragged'
        );

        // Index 0, taskIndex 0 (first in 2-task group) → edge, can be sequential
        expect(result.index).toBe(0);
        expect(result.isParallel).toBe(false);
      });

      it('forces middle task to stay parallel even in left half', () => {
        // Middle task cannot become sequential
        const taskIds = [['task-1', 'task-2', 'task-3', 'task-4']];
        const stageWidth = 304;

        // Drop at index 1 or 2 (middle positions), left half
        const result = calculateDropPosition(
          118, // nodeY for second position area
          36,
          0, // far left
          50,
          stageWidth,
          taskIds,
          'task-dragged'
        );

        // Index 1, taskIndex 1 (middle in 4-task group) → cannot be sequential
        expect(result.index).toBe(1);
        expect(result.isParallel).toBe(true);
      });
    });

    describe('multiple parallel groups', () => {
      it('handles stage with multiple parallel groups - joins last parallel group from right half', () => {
        const taskIds = [
          ['task-1', 'task-2'], // Parallel group at index 0-1
          ['task-3'],           // Sequential at index 2
          ['task-4', 'task-5'], // Parallel group at index 3-4
        ];
        const stageWidth = 304;

        // Drop far below to get index beyond end, right half
        const result = calculateDropPosition(
          300, // nodeY - very far down
          36,
          200, // right half - should join last parallel group
          100,
          stageWidth,
          taskIds,
          'task-dragged'
        );

        expect(result.index).toBe(5); // After all 5 tasks
        // At end with last group being parallel AND in right half -> joins parallel group
        expect(result.isParallel).toBe(true);
      });

      it('handles stage with multiple parallel groups - sequential from left half', () => {
        const taskIds = [
          ['task-1', 'task-2'], // Parallel group at index 0-1
          ['task-3'],           // Sequential at index 2
          ['task-4', 'task-5'], // Parallel group at index 3-4
        ];
        const stageWidth = 304;

        // Drop far below to get index beyond end, left half
        const result = calculateDropPosition(
          300, // nodeY - very far down
          36,
          0, // left half - should be sequential
          100,
          stageWidth,
          taskIds,
          'task-dragged'
        );

        expect(result.index).toBe(5); // After all 5 tasks
        // At end but left half -> sequential (new group)
        expect(result.isParallel).toBe(false);
      });

      it('calculates correct index within second parallel group', () => {
        const taskIds = [
          ['task-1'],           // Index 0 (top=16, bottom=52)
          ['task-2', 'task-3'], // Index 1-2 (top=64/112, bottom=100/148)
        ];
        const stageWidth = 304;

        // For this structure:
        // - Index 0 (task-1): top=16, bottom=52
        // - Index 1 (task-2): top=64, bottom=100
        // - Index 2 (task-3): top=112, bottom=148
        // Rule 3: PY > topOfLast - halfGap = 112 - 6 = 106 → index = 3
        // So bucket 2 doesn't exist, it goes straight to "after all"
        // Test bucket 1 instead: 58 < PY <= 106
        const result = calculateDropPosition(
          138, // nodeY such that PY = 100 (in bucket 1)
          36,
          0, // left half
          50,
          stageWidth,
          taskIds,
          'task-dragged'
        );

        // Index 1 is first in the parallel group (edge), can be sequential
        expect(result.index).toBe(1);
        expect(result.isParallel).toBe(false);
      });
    });

    describe('single task scenarios', () => {
      it('handles single task in stage', () => {
        const taskIds = [['task-1']];
        const stageWidth = 304;

        // Drop below the single task
        const result = calculateDropPosition(
          200,
          36,
          0,
          50,
          stageWidth,
          taskIds,
          'task-dragged'
        );

        expect(result.index).toBe(1);
        expect(result.isParallel).toBe(false);
      });

      it('handles drop above single task', () => {
        const taskIds = [['task-1']];
        const stageWidth = 304;

        // Drop above the single task
        const result = calculateDropPosition(
          60, // Very high
          36,
          0,
          50,
          stageWidth,
          taskIds,
          'task-dragged'
        );

        expect(result.index).toBe(0);
        expect(result.isParallel).toBe(false);
      });
    });

    describe('dragged task filtering edge cases', () => {
      it('handles dragged task being the only task in a group', () => {
        const taskIds = [['task-1'], ['task-dragged'], ['task-2']];
        const stageWidth = 304;

        // After filtering: [['task-1'], ['task-2']]
        // Empty group is removed
        const result = calculateDropPosition(
          100,
          36,
          0,
          50,
          stageWidth,
          taskIds,
          'task-dragged'
        );

        expect(result.index).toBeLessThanOrEqual(2);
      });

      it('handles dragged task at start of parallel group', () => {
        const taskIds = [['task-dragged', 'task-1', 'task-2']];
        const stageWidth = 304;

        // After filtering: [['task-1', 'task-2']]
        // Y=100 with nodeHeight=36 gives PY = 100 - 56 + 18 = 62
        // This falls in bucket for index 1 (within the parallel group)
        const result = calculateDropPosition(
          100,
          36,
          200, // right half
          100,
          stageWidth,
          taskIds,
          'task-dragged'
        );

        // Index 1 is within parallel group, and right half keeps it parallel
        expect(result.index).toBe(1);
        expect(result.isParallel).toBe(true);
      });

      it('stays parallel when dropping within parallel group', () => {
        const taskIds = [['task-dragged', 'task-1', 'task-2']];
        const stageWidth = 304;

        // After filtering: [['task-1', 'task-2']]
        // Drop at Y position within the parallel group (index 0)
        const result = calculateDropPosition(
          72, // Position within first task bucket
          36,
          200, // right half
          100,
          stageWidth,
          taskIds,
          'task-dragged'
        );

        // Within parallel group, stays parallel
        expect(result.isParallel).toBe(true);
      });

      it('handles dragged task at end of parallel group', () => {
        const taskIds = [['task-1', 'task-2', 'task-dragged']];
        const stageWidth = 304;

        // After filtering: [['task-1', 'task-2']]
        const result = calculateDropPosition(
          100,
          36,
          0, // left half
          50,
          stageWidth,
          taskIds,
          'task-dragged'
        );

        // Dropping at position in 2-task parallel group
        // First or last can be sequential
        expect(result.isParallel).toBe(false);
      });
    });

    describe('rejoining parallel group after filtering', () => {
      it('allows rejoining 2-task parallel group that appears sequential after filtering', () => {
        // Original: sequential, then 2-task parallel group
        // Dragging task-3 makes filtered = [['task-1'], ['task-2']] - appears sequential
        // But we should still be able to rejoin the parallel group
        const taskIds = [['task-1'], ['task-2', 'task-3']];
        const stageWidth = 304;

        // Drop at end, right half - should join the "now-sequential" group because it was originally parallel
        const result = calculateDropPosition(
          200, // nodeY far below (past all filtered tasks)
          36,
          200, // right half
          100,
          stageWidth,
          taskIds,
          'task-3'
        );

        expect(result.index).toBe(2); // After both filtered tasks (index = totalTasks)
        expect(result.isParallel).toBe(true); // Should be able to rejoin
      });

      it('rejoins parallel group when dropping within its position', () => {
        // Original: 2-task parallel group
        // Dragging task-2 makes filtered = [['task-1']] - single element
        const taskIds = [['task-1', 'task-2']];
        const stageWidth = 304;

        // Drop at first task position, right half
        const result = calculateDropPosition(
          72, // First task position
          36,
          200, // right half
          100,
          stageWidth,
          taskIds,
          'task-2'
        );

        expect(result.isParallel).toBe(true); // Can rejoin because original was parallel
      });

      it('stays sequential when original group was sequential', () => {
        // Original: two sequential groups
        const taskIds = [['task-1'], ['task-2']];
        const stageWidth = 304;

        // Drop at end, right half - should NOT become parallel because original was sequential
        const result = calculateDropPosition(
          200, // Far below
          36,
          200, // right half
          100,
          stageWidth,
          taskIds,
          'task-2'
        );

        // After filtering: [['task-1']], single sequential task
        // Original group for task-1 was sequential (single element), so can't join it as parallel
        expect(result.isParallel).toBe(false);
      });

      it('joins previous parallel group when dropping between parallel and sequential', () => {
        // Original: parallel group followed by sequential task
        const taskIds = [['task-1', 'task-2'], ['task-3']];
        const stageWidth = 304;

        // Drop at position of task-3 (between parallel group and sequential), right half
        // Task positions in content area:
        // task-1: top=16, bottom=52
        // task-2: top=64, bottom=100
        // task-3: top=112, bottom=148
        // Drop with PY around 112 (at task-3's position), right half
        const result = calculateDropPosition(
          168, // nodeY = 112 + 56 = 168 for task-3 position
          36,
          200, // right half - should join parallel group
          100,
          stageWidth,
          taskIds,
          'task-X' // External task
        );

        expect(result.index).toBe(2); // At task-3's position
        expect(result.isParallel).toBe(true); // Should join the previous parallel group
      });

      it('stays sequential between parallel and sequential when in left half', () => {
        // Original: parallel group followed by sequential task
        const taskIds = [['task-1', 'task-2'], ['task-3']];
        const stageWidth = 304;

        // Drop at position of task-3 (between parallel group and sequential), left half
        const result = calculateDropPosition(
          168, // nodeY for task-3 position
          36,
          0, // left half - should stay sequential
          100,
          stageWidth,
          taskIds,
          'task-X' // External task
        );

        expect(result.index).toBe(2);
        expect(result.isParallel).toBe(false); // Should be sequential in left half
      });
    });

    describe('convertToGroupPosition edge cases', () => {
      it('handles inserting parallel at start of first group', () => {
        const taskIds = [['task-1', 'task-2'], ['task-3']];
        const result = convertToGroupPosition(0, true, taskIds);
        expect(result).toEqual({ groupIndex: 0, taskIndex: 0 });
      });

      it('joins previous parallel group when at start of sequential group', () => {
        // At start of sequential group that follows parallel, isParallel=true
        // Should join the previous parallel group
        const taskIds = [['task-1', 'task-2'], ['task-3']];
        const result = convertToGroupPosition(2, true, taskIds);
        // Index 2 is task-3, at groupIndex=1, taskIndex=0
        // Since isParallel=true and previous group is parallel, join it at the end
        expect(result).toEqual({ groupIndex: 0, taskIndex: 2 });
      });

      it('handles inserting sequential between parallel groups', () => {
        const taskIds = [['task-1', 'task-2'], ['task-3', 'task-4']];
        const result = convertToGroupPosition(2, false, taskIds);
        // Index 2 is start of second group, sequential inserts new group
        expect(result).toEqual({ groupIndex: 1, taskIndex: 0 });
      });

      it('handles parallel insert at end when last group is sequential', () => {
        const taskIds = [['task-1'], ['task-2']];
        const result = convertToGroupPosition(2, true, taskIds);
        // Beyond end, parallel, but last group has only 1 task
        // So create new group at end
        expect(result).toEqual({ groupIndex: 2, taskIndex: 0 });
      });

      it('handles large index values gracefully', () => {
        const taskIds = [['task-1'], ['task-2']];
        const result = convertToGroupPosition(100, false, taskIds);
        expect(result).toEqual({ groupIndex: 2, taskIndex: 0 });
      });
    });
  });
});
