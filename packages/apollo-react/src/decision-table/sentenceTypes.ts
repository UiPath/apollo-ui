import type { GridColumn, GridColumnGroup } from './gridTypes';
import type { MarkTone } from './marks';

/** A column name or a cell value inside a sentence; `columnId` is the input's or output's id. */
export interface SentenceToken {
  columnId: string;
  kind: 'input' | 'output' | 'value';
  text: string;
}

/** A translated sentence: text runs and tokens in reading order. */
export type SentencePart = string | SentenceToken;

/** One condition line of a row. */
export interface SentenceLine {
  columnId: string;
  parts: readonly SentencePart[];
}

/** One row of the table, worded. */
export interface SentenceRow {
  rowId: string;
  /** The row's outputs, shown first. */
  heading: readonly SentencePart[];
  /** The sentence that introduces the conditions, e.g. "when …" or "in every case". */
  lead: readonly SentencePart[];
  /** One line per condition below the lead; empty when the lead words them all. */
  lines: readonly SentenceLine[];
}

/** A labelled run of columns shown above the rows. */
export interface SentenceBand extends Pick<GridColumnGroup, 'id' | 'label'> {
  columns: readonly Pick<GridColumn, 'id' | 'name'>[];
}

/** The sticky line above the rows: a label and its hint. */
export interface SentenceHeader {
  label: string;
  hint: string;
}

/** A cell, addressed as the grid's marks address it. */
export interface SentenceCellId {
  rowId: string;
  columnId: string;
}

/** The view's own strings; the consumer passes localized values. */
export interface SentenceLabels {
  emptyRows: string;
  /** One mark as read aloud, e.g. "Warning: Overlaps row 1"; `message` is absent when the mark has none. */
  markStatus: (tone: Exclude<MarkTone, 'success'>, message: string | undefined) => string;
  /** The count a line shows in place of the values past its limit, e.g. "+9,980 more". */
  moreValues: (count: number) => string;
}
