import { describe, expect, it } from "vitest";
import { INDENTATION_WIDTH } from "./StageNode.styles";
import type { StageTaskItem } from "./StageNode.types";
import { buildTaskGroups, flattenTasks, getProjection, reorderTasks, type FlattenedTask } from "./StageNode.utils";

const createTask = (id: string, label?: string): StageTaskItem => ({
  id,
  label: label ?? `Task ${id}`,
});

describe("StageNode.utils", () => {
  describe("flattenTasks", () => {
    it("returns empty array for empty input", () => {
      const result = flattenTasks([]);
      expect(result).toEqual([]);
    });

    it("returns empty array for array with empty groups", () => {
      const result = flattenTasks([[], []]);
      expect(result).toEqual([]);
    });

    it("flattens single task with depth 0", () => {
      const tasks: StageTaskItem[][] = [[createTask("1")]];
      const result = flattenTasks(tasks);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: "1",
        task: createTask("1"),
        groupIndex: 0,
        taskIndex: 0,
        depth: 0,
      });
    });

    it("flattens multiple single-task groups with depth 0", () => {
      const tasks: StageTaskItem[][] = [[createTask("1")], [createTask("2")], [createTask("3")]];
      const result = flattenTasks(tasks);

      expect(result).toHaveLength(3);
      expect(result[0]?.depth).toBe(0);
      expect(result[1]?.depth).toBe(0);
      expect(result[2]?.depth).toBe(0);
      expect(result[0]?.groupIndex).toBe(0);
      expect(result[1]?.groupIndex).toBe(1);
      expect(result[2]?.groupIndex).toBe(2);
    });

    it("flattens parallel tasks (multi-task group) with depth 1", () => {
      const tasks: StageTaskItem[][] = [[createTask("1"), createTask("2")]];
      const result = flattenTasks(tasks);

      expect(result).toHaveLength(2);
      expect(result[0]?.depth).toBe(1);
      expect(result[1]?.depth).toBe(1);
      expect(result[0]?.groupIndex).toBe(0);
      expect(result[1]?.groupIndex).toBe(0);
      expect(result[0]?.taskIndex).toBe(0);
      expect(result[1]?.taskIndex).toBe(1);
    });

    it("handles mixed single and parallel groups", () => {
      const tasks: StageTaskItem[][] = [[createTask("1")], [createTask("2"), createTask("3")], [createTask("4")]];
      const result = flattenTasks(tasks);

      expect(result).toHaveLength(4);
      expect(result[0]?.depth).toBe(0);
      expect(result[1]?.depth).toBe(1);
      expect(result[2]?.depth).toBe(1);
      expect(result[3]?.depth).toBe(0);
    });

    it("preserves task references", () => {
      const task = createTask("1", "Original Task");
      const tasks: StageTaskItem[][] = [[task]];
      const result = flattenTasks(tasks);

      expect(result[0]?.task).toBe(task);
    });

    it("skips null/undefined groups and tasks", () => {
      const tasks: StageTaskItem[][] = [[createTask("1")], undefined as unknown as StageTaskItem[], [createTask("2")]];
      const result = flattenTasks(tasks);

      expect(result).toHaveLength(2);
    });
  });

  describe("buildTaskGroups", () => {
    it("returns empty array for empty input", () => {
      const result = buildTaskGroups([]);
      expect(result).toEqual([]);
    });

    it("builds single task group from depth 0 item", () => {
      const flattened: FlattenedTask[] = [{ id: "1", task: createTask("1"), groupIndex: 0, taskIndex: 0, depth: 0 }];
      const result = buildTaskGroups(flattened);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveLength(1);
      expect(result[0]?.[0]?.id).toBe("1");
    });

    it("builds separate groups for consecutive depth 0 items", () => {
      const flattened: FlattenedTask[] = [
        { id: "1", task: createTask("1"), groupIndex: 0, taskIndex: 0, depth: 0 },
        { id: "2", task: createTask("2"), groupIndex: 1, taskIndex: 0, depth: 0 },
      ];
      const result = buildTaskGroups(flattened);

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveLength(1);
      expect(result[1]).toHaveLength(1);
    });

    it("groups consecutive depth 1 items together", () => {
      const flattened: FlattenedTask[] = [
        { id: "1", task: createTask("1"), groupIndex: 0, taskIndex: 0, depth: 1 },
        { id: "2", task: createTask("2"), groupIndex: 0, taskIndex: 1, depth: 1 },
        { id: "3", task: createTask("3"), groupIndex: 0, taskIndex: 2, depth: 1 },
      ];
      const result = buildTaskGroups(flattened);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveLength(3);
    });

    it("splits groups when depth changes from 1 to 0", () => {
      const flattened: FlattenedTask[] = [
        { id: "1", task: createTask("1"), groupIndex: 0, taskIndex: 0, depth: 1 },
        { id: "2", task: createTask("2"), groupIndex: 0, taskIndex: 1, depth: 1 },
        { id: "3", task: createTask("3"), groupIndex: 1, taskIndex: 0, depth: 0 },
      ];
      const result = buildTaskGroups(flattened);

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveLength(2);
      expect(result[1]).toHaveLength(1);
    });

    it("splits groups when depth changes from 0 to 1", () => {
      const flattened: FlattenedTask[] = [
        { id: "1", task: createTask("1"), groupIndex: 0, taskIndex: 0, depth: 0 },
        { id: "2", task: createTask("2"), groupIndex: 1, taskIndex: 0, depth: 1 },
        { id: "3", task: createTask("3"), groupIndex: 1, taskIndex: 1, depth: 1 },
      ];
      const result = buildTaskGroups(flattened);

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveLength(1);
      expect(result[1]).toHaveLength(2);
    });

    it("handles complex mixed depth sequences", () => {
      const flattened: FlattenedTask[] = [
        { id: "1", task: createTask("1"), groupIndex: 0, taskIndex: 0, depth: 0 },
        { id: "2", task: createTask("2"), groupIndex: 1, taskIndex: 0, depth: 1 },
        { id: "3", task: createTask("3"), groupIndex: 1, taskIndex: 1, depth: 1 },
        { id: "4", task: createTask("4"), groupIndex: 2, taskIndex: 0, depth: 0 },
        { id: "5", task: createTask("5"), groupIndex: 3, taskIndex: 0, depth: 0 },
      ];
      const result = buildTaskGroups(flattened);

      expect(result).toHaveLength(4);
      expect(result[0]).toHaveLength(1);
      expect(result[1]).toHaveLength(2);
      expect(result[2]).toHaveLength(1);
      expect(result[3]).toHaveLength(1);
    });
  });

  describe("reorderTasks", () => {
    it("returns original tasks when activeId not found", () => {
      const tasks: StageTaskItem[][] = [[createTask("1")], [createTask("2")]];
      const result = reorderTasks(tasks, "nonexistent", "2", 0);

      expect(result).toEqual(tasks);
    });

    it("returns original tasks when overId not found", () => {
      const tasks: StageTaskItem[][] = [[createTask("1")], [createTask("2")]];
      const result = reorderTasks(tasks, "1", "nonexistent", 0);

      expect(result).toEqual(tasks);
    });

    it("reorders tasks within same position (no change)", () => {
      const tasks: StageTaskItem[][] = [[createTask("1")], [createTask("2")]];
      const result = reorderTasks(tasks, "1", "1", 0);

      expect(result).toHaveLength(2);
      expect(result[0]?.[0]?.id).toBe("1");
      expect(result[1]?.[0]?.id).toBe("2");
    });

    it("moves task down in the list", () => {
      const tasks: StageTaskItem[][] = [[createTask("1")], [createTask("2")], [createTask("3")]];
      const result = reorderTasks(tasks, "1", "3", 0);

      expect(result).toHaveLength(3);
      expect(result[0]?.[0]?.id).toBe("2");
      expect(result[1]?.[0]?.id).toBe("3");
      expect(result[2]?.[0]?.id).toBe("1");
    });

    it("moves task up in the list", () => {
      const tasks: StageTaskItem[][] = [[createTask("1")], [createTask("2")], [createTask("3")]];
      const result = reorderTasks(tasks, "3", "1", 0);

      expect(result).toHaveLength(3);
      expect(result[0]?.[0]?.id).toBe("3");
      expect(result[1]?.[0]?.id).toBe("1");
      expect(result[2]?.[0]?.id).toBe("2");
    });

    it("applies projectedDepth to moved task", () => {
      const tasks: StageTaskItem[][] = [[createTask("1")], [createTask("2")]];
      const result = reorderTasks(tasks, "1", "2", 1);

      expect(result).toHaveLength(2);
      expect(result[0]?.[0]?.id).toBe("2");
      expect(result[1]?.[0]?.id).toBe("1");
    });

    it("maintains separate groups when projectedDepth is 0", () => {
      const tasks: StageTaskItem[][] = [[createTask("1"), createTask("2")]];
      const result = reorderTasks(tasks, "1", "2", 0);

      expect(result).toHaveLength(2);
    });

    it("handles reordering within parallel group", () => {
      const tasks: StageTaskItem[][] = [[createTask("1"), createTask("2"), createTask("3")]];
      const result = reorderTasks(tasks, "1", "3", 1);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveLength(3);
      expect(result[0]?.[0]?.id).toBe("2");
      expect(result[0]?.[1]?.id).toBe("3");
      expect(result[0]?.[2]?.id).toBe("1");
    });
  });

  describe("getProjection", () => {
    it("returns null when activeId not found", () => {
      const tasks: StageTaskItem[][] = [[createTask("1")], [createTask("2")]];
      const result = getProjection(tasks, "nonexistent", "2", 0);

      expect(result).toBeNull();
    });

    it("returns null when overId not found", () => {
      const tasks: StageTaskItem[][] = [[createTask("1")], [createTask("2")]];
      const result = getProjection(tasks, "1", "nonexistent", 0);

      expect(result).toBeNull();
    });

    it("returns depth 0 for dragging in place on single task", () => {
      const tasks: StageTaskItem[][] = [[createTask("1")], [createTask("2")], [createTask("3")]];
      const result = getProjection(tasks, "2", "2", 0);

      expect(result).not.toBeNull();
      expect(result?.depth).toBe(0);
      expect(result?.maxDepth).toBe(1);
    });

    it("returns projected depth when dragging in place adjacent to parallel group", () => {
      const tasks: StageTaskItem[][] = [[createTask("1")], [createTask("2"), createTask("3")], [createTask("4")]];
      const result = getProjection(tasks, "1", "1", INDENTATION_WIDTH);

      expect(result).not.toBeNull();
      expect(result?.depth).toBe(1);
    });

    it("returns depth 0 for no offset when not adjacent to parallel", () => {
      const tasks: StageTaskItem[][] = [[createTask("1")], [createTask("2")], [createTask("3")]];
      const result = getProjection(tasks, "2", "2", 0);

      expect(result).not.toBeNull();
      expect(result?.depth).toBe(0);
    });

    it("clamps depth to maxDepth when dragging over parallel group", () => {
      const tasks: StageTaskItem[][] = [[createTask("1")], [createTask("2"), createTask("3")]];
      const result = getProjection(tasks, "1", "2", INDENTATION_WIDTH * 5);

      expect(result).not.toBeNull();
      expect(result?.depth).toBeLessThanOrEqual(result?.maxDepth ?? 0);
    });

    it("returns correct groupIndex and taskIndex", () => {
      const tasks: StageTaskItem[][] = [[createTask("1")], [createTask("2"), createTask("3")], [createTask("4")]];
      const result = getProjection(tasks, "1", "3", 0);

      expect(result).not.toBeNull();
      expect(result?.groupIndex).toBe(1);
      expect(result?.taskIndex).toBe(1);
    });

    it("handles dragging down into parallel group", () => {
      const tasks: StageTaskItem[][] = [[createTask("1")], [createTask("2"), createTask("3")]];
      const result = getProjection(tasks, "1", "2", 0);

      expect(result).not.toBeNull();
      expect(result?.depth).toBe(1);
    });

    it("handles dragging up into parallel group", () => {
      const tasks: StageTaskItem[][] = [[createTask("1"), createTask("2")], [createTask("3")]];
      const result = getProjection(tasks, "3", "2", 0);

      expect(result).not.toBeNull();
      expect(result?.depth).toBe(1);
    });

    it("allows depth control on edge of parallel group when dragging down", () => {
      const tasks: StageTaskItem[][] = [[createTask("1")], [createTask("2"), createTask("3")], [createTask("4")]];
      const result = getProjection(tasks, "1", "3", 0);

      expect(result).not.toBeNull();
      expect(result?.depth).toBe(0);
    });

    it("allows depth control on edge of parallel group when dragging up", () => {
      const tasks: StageTaskItem[][] = [[createTask("1")], [createTask("2"), createTask("3")], [createTask("4")]];
      const result = getProjection(tasks, "4", "2", 0);

      expect(result).not.toBeNull();
      expect(result?.depth).toBe(0);
    });

    it("handles dragging within parallel group - middle item stays at depth 1", () => {
      const tasks: StageTaskItem[][] = [[createTask("1"), createTask("2"), createTask("3")]];
      const result = getProjection(tasks, "1", "2", 0);

      expect(result).not.toBeNull();
      expect(result?.depth).toBe(1);
    });

    it("handles dragging from parallel last item to adjacent single task going down", () => {
      const tasks: StageTaskItem[][] = [[createTask("1"), createTask("2")], [createTask("3")]];
      const result = getProjection(tasks, "2", "3", INDENTATION_WIDTH);

      expect(result).not.toBeNull();
      expect(result?.depth).toBe(0);
    });

    it("handles dragging from parallel first item to adjacent single task going up", () => {
      const tasks: StageTaskItem[][] = [[createTask("1")], [createTask("2"), createTask("3")]];
      const result = getProjection(tasks, "2", "1", INDENTATION_WIDTH);

      expect(result).not.toBeNull();
      expect(result?.depth).toBe(0);
    });
  });

  describe("flattenTasks and buildTaskGroups roundtrip", () => {
    it("preserves structure for single tasks", () => {
      const original: StageTaskItem[][] = [[createTask("1")], [createTask("2")], [createTask("3")]];
      const flattened = flattenTasks(original);
      const rebuilt = buildTaskGroups(flattened);

      expect(rebuilt).toHaveLength(original.length);
      for (let i = 0; i < original.length; i++) {
        expect(rebuilt[i]).toHaveLength(original[i]?.length ?? 0);
        expect(rebuilt[i]?.[0]?.id).toBe(original[i]?.[0]?.id);
      }
    });

    it("preserves structure for parallel groups", () => {
      const original: StageTaskItem[][] = [[createTask("1"), createTask("2"), createTask("3")]];
      const flattened = flattenTasks(original);
      const rebuilt = buildTaskGroups(flattened);

      expect(rebuilt).toHaveLength(1);
      expect(rebuilt[0]).toHaveLength(3);
    });

    it("preserves structure for mixed groups", () => {
      const original: StageTaskItem[][] = [
        [createTask("1")],
        [createTask("2"), createTask("3")],
        [createTask("4")],
        [createTask("5"), createTask("6")],
      ];
      const flattened = flattenTasks(original);
      const rebuilt = buildTaskGroups(flattened);

      expect(rebuilt).toHaveLength(4);
      expect(rebuilt[0]).toHaveLength(1);
      expect(rebuilt[1]).toHaveLength(2);
      expect(rebuilt[2]).toHaveLength(1);
      expect(rebuilt[3]).toHaveLength(2);
    });
  });
});
