import { useMemo, useRef } from 'react';
import type { StageTaskItem } from '../StageNode.types';

/** One React key per group that outlives the group's membership: a group keeps the key most of its
 * tasks had last render, so adding, removing or reordering tasks leaves its rows mounted and the
 * focus on them. A task moved to another group still remounts, as its parent changes. */
export const useStageGroupKeys = (groups: StageTaskItem[][]) => {
  const keyOfTask = useRef(new Map<string, string>());
  const nextKey = useRef(0);

  return useMemo(() => {
    const used = new Set<string>();
    const keys = groups.map((group) => {
      const votes = new Map<string, number>();
      for (const task of group) {
        const key = keyOfTask.current.get(task.id);
        if (key !== undefined && !used.has(key)) {
          votes.set(key, (votes.get(key) ?? 0) + 1);
        }
      }
      let chosen: string | undefined;
      let best = 0;
      for (const [key, count] of votes) {
        if (count > best) {
          chosen = key;
          best = count;
        }
      }
      const key = chosen ?? `group-${nextKey.current++}`;
      used.add(key);
      return key;
    });
    keyOfTask.current.clear();
    groups.forEach((group, index) => {
      for (const task of group) {
        keyOfTask.current.set(task.id, keys[index] as string);
      }
    });
    return keys;
  }, [groups]);
};
