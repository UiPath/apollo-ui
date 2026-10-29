import type { GridColumn } from './gridTypes';
import { separatorFlexIndexes } from './useGridLayout';

const group = (id: string, separatorBefore?: boolean) => ({ id, label: id, separatorBefore });

const columns = (
  ...groups: { id: string; label: string; separatorBefore?: boolean }[]
): GridColumn[] =>
  groups.map((g, index) => ({ id: `c${index}`, name: `c${index}`, defaultWidth: 100, group: g }));

describe('separatorFlexIndexes', () => {
  it('marks the column that opens a separated group', () => {
    const marked = separatorFlexIndexes(
      columns(group('inputs'), group('inputs'), group('outputs', true))
    );
    expect([...marked]).toEqual([2]);
  });

  it('never marks index 0 — a band at the very start has no boundary to draw', () => {
    const marked = separatorFlexIndexes(columns(group('inputs', true), group('outputs', true)));
    expect([...marked]).toEqual([1]);
  });

  /**
   * The width total and the rendered `<col>`s read this set, but only the windowed loops emit a
   * separator element — a pinned one counted here would make the table wider than its columns.
   */
  it('skips separators strictly inside the pinned region, keeping width and columns in step', () => {
    const model = columns(group('annotation'), group('inputs', true), group('outputs', true));
    expect([...separatorFlexIndexes(model, 2)]).toEqual([2]);
    expect([...separatorFlexIndexes(model, 0)]).toEqual([1, 2]);
  });

  it('keeps the first windowed column, which does render its separator', () => {
    const model = columns(group('annotation'), group('inputs', true));
    expect([...separatorFlexIndexes(model, 1)]).toEqual([1]);
  });
});
