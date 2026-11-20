import type { ColumnMark, Mark, RowMark, TableMarks } from './marks';

/**
 * Type-level checks, run by the typecheck: the `@ts-expect-error` lines fail it if they start to
 * compile. Code written before reviews keeps compiling, and each review rejects what the table
 * cannot draw.
 */

describe('the mark types', () => {
  it('still take column marks typed as cell marks, as they did before reviews', () => {
    const columns = new Map<string, Mark>([['age', { tone: 'error', title: 'Unknown type' }]]);
    const marks: TableMarks = { rows: new Map(), columns };
    const read: Mark | undefined = marks.columns.get('age');
    const header: ColumnMark = { columnReview: { change: 'update', previous: { label: 'old' } } };
    const asCell: Mark = header;
    expect([read?.tone, asCell.title]).toEqual(['error', undefined]);
  });

  it('take every review a table draws', () => {
    const rows: RowMark[] = [
      { review: { change: 'delete', number: '3' } },
      { review: { change: 'delete', number: '4', link: 'moved' } },
      { review: { change: 'add', number: '8', link: 'moved' } },
      { review: { change: 'delete', number: '5', pair: 'old' } },
      { review: { change: 'add', number: '4', pair: 'new' } },
      { review: { number: '6' } },
      { review: { change: 'update' } },
    ];
    const cells: Mark[] = [
      { review: { change: 'add' } },
      { review: { change: 'update', previous: '30' }, tone: 'error', glyph: true },
      { review: { note: 'Moved up 3' } },
    ];
    expect(rows.length + cells.length).toBe(10);
  });

  it('reject reviews a table cannot draw', () => {
    const invalid = [
      // @ts-expect-error: an added rule is never the old half of a replaced pair.
      { review: { change: 'add', pair: 'old' } } satisfies RowMark,
      // @ts-expect-error: an updated rule is not half of a pair.
      { review: { change: 'update', pair: 'new' } } satisfies RowMark,
      // @ts-expect-error: an updated cell says what it held.
      { review: { change: 'update' } } satisfies Mark,
      // @ts-expect-error: one second line, the old value or a note.
      { review: { change: 'update', previous: '30', note: 'Moved' } } satisfies Mark,
      // @ts-expect-error: a note sits on a cell with no change of its own.
      { review: { change: 'add', note: 'Moved' } } satisfies Mark,
      // @ts-expect-error: a header takes a column's review, not a cell's.
      { review: { change: 'add' } } satisfies ColumnMark,
    ];
    expect(invalid).toHaveLength(6);
  });
});
