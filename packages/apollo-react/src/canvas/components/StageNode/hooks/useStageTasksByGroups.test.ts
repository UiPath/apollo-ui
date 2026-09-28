import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { StageTaskItem } from '../StageNode.types';
import { useStageTasksByGroups } from './useStageTasksByGroups';

const seq = (id: string): StageTaskItem => ({ id, label: id, taskGroupType: 'sequential' });
const evt = (id: string): StageTaskItem => ({ id, label: id, taskGroupType: 'event-driven' });
const adhoc = (id: string): StageTaskItem => ({ id, label: id, taskGroupType: 'adhoc' });

const ids = (groups: StageTaskItem[][]) => groups.map((group) => group.map((t) => t.id));
const split = (tasks: StageTaskItem[][]) => renderHook(() => useStageTasksByGroups(tasks)).result;

describe('useStageTasksByGroups', () => {
  it('keeps sequential parallel groups intact', () => {
    const { current } = split([[seq('a')], [seq('b'), seq('c')]]);

    expect(ids(current.sequentialTaskGroups)).toEqual([['a'], ['b', 'c']]);
  });

  it('recovers an event-triggered task nested inside a sequential group', () => {
    const { current } = split([[seq('a'), evt('e')]]);

    expect(ids(current.sequentialTaskGroups)).toEqual([['a']]);
    expect(ids(current.eventDrivenTaskGroups)).toEqual([['e']]);
  });

  it('recovers a mixed ad hoc + event-triggered group, which used to be dropped entirely', () => {
    const { current } = split([[adhoc('a1'), evt('e1')]]);

    expect(ids(current.adhocTaskGroups)).toEqual([['a1']]);
    expect(ids(current.eventDrivenTaskGroups)).toEqual([['e1']]);
    expect(current.sequentialTaskGroups).toEqual([]);
  });

  it('gives each flat-section task its own group', () => {
    const { current } = split([
      [evt('e1'), evt('e2')],
      [adhoc('a1'), adhoc('a2')],
    ]);

    expect(ids(current.eventDrivenTaskGroups)).toEqual([['e1'], ['e2']]);
    expect(ids(current.adhocTaskGroups)).toEqual([['a1'], ['a2']]);
  });

  it('treats a legacy isAdhoc task without taskGroupType as ad hoc', () => {
    const legacyAdhoc = { id: 'l1', label: 'l1', isAdhoc: true } as StageTaskItem;
    const legacyPlain = { id: 'l2', label: 'l2' } as StageTaskItem;

    const { current } = split([[legacyAdhoc, legacyPlain]]);

    expect(ids(current.adhocTaskGroups)).toEqual([['l1']]);
    expect(ids(current.sequentialTaskGroups)).toEqual([['l2']]);
  });

  it('drops no task, whatever the nesting', () => {
    const tasks = [[seq('a'), evt('e1')], [adhoc('a1'), evt('e2')], [seq('b')]];
    const { current } = split(tasks);

    const out = [
      ...current.sequentialTaskGroups,
      ...current.eventDrivenTaskGroups,
      ...current.adhocTaskGroups,
    ].flat();
    expect(out.map((t) => t.id).sort()).toEqual(['a', 'a1', 'b', 'e1', 'e2']);
  });
});
