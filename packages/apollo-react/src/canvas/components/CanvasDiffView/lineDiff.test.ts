import { describe, expect, it } from 'vitest';
import { diffLines, type LineDiffOp, MAX_EDIT_DISTANCE } from './lineDiff';

/** Ops as "  text", "- text", "+ text" for readable expectations. */
function show(ops: LineDiffOp[] | undefined) {
  const marks = { equal: ' ', removed: '-', added: '+' };
  return ops?.map((op) => `${marks[op.type]} ${op.text}`);
}

/** Rebuilds one side from the ops, to check any diff is a valid edit script. */
function side(ops: LineDiffOp[], skip: LineDiffOp['type']) {
  return ops.filter((op) => op.type !== skip).map((op) => op.text);
}

const lines = (count: number, prefix: string) =>
  Array.from({ length: count }, (_, index) => `${prefix}${index}`);

describe('diffLines', () => {
  it('keeps identical texts as equal lines', () => {
    expect(show(diffLines(['a', 'b'], ['a', 'b']))).toEqual(['  a', '  b']);
  });

  it('returns no ops for two empty texts', () => {
    expect(diffLines([], [])).toEqual([]);
  });

  it('marks every line added when before is empty', () => {
    expect(show(diffLines([], ['a', 'b']))).toEqual(['+ a', '+ b']);
  });

  it('marks every line removed when after is empty', () => {
    expect(show(diffLines(['a', 'b'], []))).toEqual(['- a', '- b']);
  });

  it('finds a minimal diff for mixed edits', () => {
    const before = ['a', 'b', 'c', 'a', 'b', 'b', 'a'];
    const after = ['c', 'b', 'a', 'b', 'a', 'c'];
    const ops = diffLines(before, after) ?? [];

    expect(side(ops, 'added')).toEqual(before);
    expect(side(ops, 'removed')).toEqual(after);
    // The classic Myers example has an edit distance of 5.
    expect(ops.filter((op) => op.type !== 'equal')).toHaveLength(5);
  });

  it('keeps the shared prefix and suffix around a change', () => {
    expect(show(diffLines(['a', 'old', 'c'], ['a', 'new', 'c']))).toEqual([
      '  a',
      '- old',
      '+ new',
      '  c',
    ]);
  });

  it('gives up when more lines changed than the cap allows', () => {
    expect(diffLines(lines(3, 'a'), lines(3, 'b'), 5)).toBeUndefined();
    expect(diffLines(lines(3, 'a'), lines(3, 'b'), 6)).toHaveLength(6);
  });

  it('gives up quickly on a large rewrite past the default cap', () => {
    const before = lines(MAX_EDIT_DISTANCE, 'old');
    const after = lines(MAX_EDIT_DISTANCE, 'new');

    expect(diffLines(before, after)).toBeUndefined();
  });

  it('diffs a large text with a few edits', () => {
    const before = lines(50_000, 'line');
    const after = [...before];
    after.splice(25_000, 1, 'edited');
    after.push('appended');
    const ops = diffLines(before, after) ?? [];

    expect(side(ops, 'added')).toEqual(before);
    expect(side(ops, 'removed')).toEqual(after);
    expect(ops.filter((op) => op.type !== 'equal')).toHaveLength(3);
  });
});
