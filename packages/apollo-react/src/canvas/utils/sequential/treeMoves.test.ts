import { describe, expect, it } from 'vitest';
import type { SequenceStep } from './sequential.types';
import { treeMoveOptions } from './treeMoves';

const leaf = (id: string, locked = false): SequenceStep => ({
  id,
  type: 'uipath.script',
  label: id,
  locked,
});

/** Main: A, If (Then: T1, T2), B, Locked. */
function makeTree(): SequenceStep {
  return {
    id: 'main',
    type: 'uipath.sequence',
    label: 'Main',
    slots: [
      {
        name: 'Activities',
        steps: [
          leaf('a'),
          {
            id: 'if',
            type: 'uipath.control-flow.decision',
            label: 'If',
            slots: [
              { name: 'Then', steps: [leaf('t1'), leaf('t2')] },
              { name: 'Else', steps: [] },
            ],
          },
          leaf('b'),
          leaf('locked', true),
        ],
      },
    ],
  };
}

describe('treeMoveOptions', () => {
  it('moves up and down past a neighbour inside its slot', () => {
    const options = treeMoveOptions(makeTree(), 'b');

    expect(options.up?.ref).toEqual({ parentId: 'main', slot: 'Activities', after: 'a' });
    expect(options.down?.ref).toEqual({ parentId: 'main', slot: 'Activities', after: 'locked' });
    expect(treeMoveOptions(makeTree(), 'a').up).toBeUndefined();
    expect(treeMoveOptions(makeTree(), 't1').up).toBeUndefined();
    expect(treeMoveOptions(makeTree(), 't2').down).toBeUndefined();
  });

  it('goes to the very start when moving up past the first step', () => {
    expect(treeMoveOptions(makeTree(), 'if').up?.ref).toEqual({
      parentId: 'main',
      slot: 'Activities',
      after: null,
    });
  });

  it('indents into the end of the last slot of the step above, when it holds others', () => {
    expect(treeMoveOptions(makeTree(), 'b').indent?.ref).toEqual({
      parentId: 'if',
      slot: 'Else',
      after: null,
    });
    expect(treeMoveOptions(makeTree(), 'if').indent).toBeUndefined();
  });

  it('outdents to just after the step that holds it, and never out of the root list', () => {
    expect(treeMoveOptions(makeTree(), 't2').outdent?.ref).toEqual({
      parentId: 'main',
      slot: 'Activities',
      after: 'if',
    });
    expect(treeMoveOptions(makeTree(), 'a').outdent).toBeUndefined();
  });

  it('does not move the root, a locked step, or a step it does not know', () => {
    const none = { up: undefined, down: undefined, indent: undefined, outdent: undefined };
    expect(treeMoveOptions(makeTree(), 'main')).toEqual(none);
    expect(treeMoveOptions(makeTree(), 'locked')).toEqual(none);
    expect(treeMoveOptions(makeTree(), 'gone')).toEqual(none);
  });
});
