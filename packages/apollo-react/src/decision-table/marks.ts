/** The grid's only vocabulary for painted state: plain data, id-addressed, one object per marked row. */

export type MarkTone = 'success' | 'error' | 'warning';

/** A change under review, painted green, amber or red. Independent of `tone`. */
export type MarkChange = 'add' | 'update' | 'delete';

export interface Mark {
  /** Absent leaves the cell painted by its row, so a marked row's cells can still carry hover text. */
  tone?: MarkTone;
  title?: string;
  /** Whether this cell's own condition held, where a consumer distinguishes one. */
  matched?: boolean;
  /** Shows the tone's status icon — the cue a diagnostic carries beyond colour. */
  glyph?: true;
  change?: MarkChange;
  /** What the cell held before the change, shown struck through above what it holds now. */
  previous?: string;
  /** A short note on a second line under the cell's text, such as how far a moved row went. */
  badge?: string;
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
  change?: MarkChange;
  /** What the gutter numbers the row, where that is not its position: a review shows deleted rows between the rest. */
  number?: string;
  /** A row with no number of its own any more (`number` empty): the number it had, shown struck through. */
  wasNumber?: string;
  /** The id shared by a moved row and the row for the place it left, so hovering either outlines both. */
  link?: string;
  /** One half of a row replaced whole, the old row above and the new one under it, drawn as one block. */
  pair?: 'old' | 'new';
  /** Stands in for this many unchanged rows a review folds away. */
  fold?: number;
  /** The first and last numbers of the rows a fold stands in for. */
  foldRange?: { from: string; to: string };
}

export interface TableMarks {
  /** By row id. */
  rows: ReadonlyMap<string, RowMark>;
  /** By input or output id. */
  columns: ReadonlyMap<string, Mark>;
}

export const EMPTY_MARKS: TableMarks = { rows: new Map(), columns: new Map() };
