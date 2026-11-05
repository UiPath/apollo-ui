/** The grid's only vocabulary for painted state: plain data, id-addressed, one object per marked row. */

import type { DiffChange } from './decisionTextDiff';

export type MarkTone = 'success' | 'error' | 'warning';

/** A change under review, painted green, amber or red: the text view's `DiffChange`, so the two cannot drift. */
export type MarkChange = DiffChange;

/**
 * A cell's part in a change under review. Its row's change paints it unless it has one of its own, so
 * a consumer leaves this unset on a rule added or deleted whole. A review's wash replaces a tone's: a
 * cell or row with both shows the change, and the tone keeps only its glyph and title.
 *
 * The cell's `ariaLabel` replaces its text for screen readers, so the consumer words the old value or
 * the note into it. Either takes a second line, which fits the default 40px row: a row height under
 * 35px clips it.
 */
export type CellReview =
  /** A cell of a column added or deleted, in a rule that was neither. */
  | { change: 'add' | 'delete' }
  /** A cell an update rewrote: what it held, struck through above what it holds now. */
  | { change: 'update'; previous: string }
  /** A short note under the text of a cell with no change of its own, such as how far its rule moved. */
  | { change?: undefined; note: string };

/** A column's part in a change under review. The header is the consumer's, so it renders `previous`. */
export type ColumnReview =
  | { change: 'add' | 'delete' }
  /** A column an update rewrote, with its old name or subtitle where those changed. */
  | { change: 'update'; previous?: { label?: string; subtitle?: string } };

/**
 * A row's part in a change under review. The rows and gutter are the consumer's, so it sets the row's
 * `data-change`, `data-pair` and `data-link` from this, and numbers the gutter.
 */
export type RowReview = {
  /**
   * What the gutter numbers the row, where that is not its position: a review shows deleted rules
   * between the rest, each with the number it had, which `change: 'delete'` strikes through.
   */
  number?: string;
  /** The id shared by a moved rule and the row for the place it left, so hovering either outlines both. */
  link?: string;
} & (
  | { change?: 'update'; pair?: undefined }
  /** `pair: 'new'` is the lower half of a rule replaced whole, drawn as one block with the old. */
  | { change: 'add'; pair?: 'new' }
  /** `pair: 'old'` is the upper half of a rule replaced whole. */
  | { change: 'delete'; pair?: 'old' }
);

export interface Mark {
  /** Absent leaves the cell painted by its row, so a marked row's cells can still carry hover text. */
  tone?: MarkTone;
  title?: string;
  /** Whether this cell's own condition held, where a consumer distinguishes one. */
  matched?: boolean;
  /** Shows the tone's status icon — the cue a diagnostic carries beyond colour. */
  glyph?: true;
  review?: CellReview;
}

/**
 * A column header's mark: a cell's, with a column's review in place of a cell's. The review has a key
 * of its own, so a `Mark` still passes for a `ColumnMark` and back, as `TableMarks.columns` held
 * `Mark`s before reviews.
 */
export interface ColumnMark extends Omit<Mark, 'review'> {
  columnReview?: ColumnReview;
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
  review?: RowReview;
}

export interface TableMarks {
  /** By row id. */
  rows: ReadonlyMap<string, RowMark>;
  /** By input or output id. */
  columns: ReadonlyMap<string, ColumnMark>;
}

export const EMPTY_MARKS: TableMarks = { rows: new Map(), columns: new Map() };
