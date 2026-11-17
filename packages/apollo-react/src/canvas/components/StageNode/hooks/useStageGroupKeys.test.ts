import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { StageTaskItem } from '../StageNode.types';
import { useStageGroupKeys } from './useStageGroupKeys';

const task = (id: string): StageTaskItem => ({ id, label: id });
const groups = (...ids: string[][]) => ids.map((group) => group.map(task));

describe('useStageGroupKeys', () => {
  it('keeps a group key when tasks are added, removed or reordered', () => {
    const { result, rerender } = renderHook(({ value }) => useStageGroupKeys(value), {
      initialProps: { value: groups(['a', 'b'], ['c']) },
    });
    const [first, second] = result.current;

    rerender({ value: groups(['b', 'a', 'x'], ['c']) });
    expect(result.current).toEqual([first, second]);

    rerender({ value: groups(['a'], ['c']) });
    expect(result.current).toEqual([first, second]);
  });

  it('keeps the key of the group a task left and gives a moved task the key of its new group', () => {
    const { result, rerender } = renderHook(({ value }) => useStageGroupKeys(value), {
      initialProps: { value: groups(['a', 'b', 'c'], ['d', 'e']) },
    });
    const [first, second] = result.current;

    rerender({ value: groups(['b', 'c'], ['a', 'd', 'e']) });

    expect(result.current).toEqual([first, second]);
  });

  it('gives a new group a key no other group uses', () => {
    const { result, rerender } = renderHook(({ value }) => useStageGroupKeys(value), {
      initialProps: { value: groups(['a', 'b']) },
    });

    rerender({ value: groups(['a'], ['b']) });

    expect(new Set(result.current).size).toBe(2);
  });
});
