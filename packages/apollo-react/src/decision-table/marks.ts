/** The grid's only vocabulary for painted state: plain data, id-addressed, one object per marked row. */

export type MarkTone = 'success' | 'error' | 'warning';

export interface Mark {
  /** Absent leaves the cell painted by its row, so a marked row's cells can still carry hover text. */
  tone?: MarkTone;
  title?: string;
  /** Whether this cell's own condition held, where a consumer distinguishes one. */
  matched?: boolean;
  /** Shows the tone's status icon — the cue a diagnostic carries beyond colour. */
  glyph?: true;
}

export interface RowMark {
  tone?: MarkTone;
  /** The row took no part in whatever produced these marks. */
  dim?: true;
  /** Gutter hover and aria text. */
  title?: string;
  /** Shows the tone's status icon in the gutter. */
  glyph?: true;
  /** By input or output id. A cell's own tone wins over its row's. */
  cells?: Readonly<Record<string, Mark>>;
}

export interface TableMarks {
  /** By row id. */
  rows: ReadonlyMap<string, RowMark>;
  /** By input or output id. */
  columns: ReadonlyMap<string, Mark>;
}

export const EMPTY_MARKS: TableMarks = { rows: new Map(), columns: new Map() };
