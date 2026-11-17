import type React from 'react';

/** A column's name inside a sentence; `columnId` is the input's or output's id, and an input another decision produces names that decision. */
export type SentenceNameToken =
  | { kind: 'input'; columnId: string; text: string; producedBy?: string }
  | { kind: 'output'; columnId: string; text: string };

/** A cell's value inside a sentence, and its `index` among the cell's values, 0 for an outcome. */
export interface SentenceValueToken {
  kind: 'value';
  columnId: string;
  index: number;
  text: string;
}

/** A column name or a cell value inside a sentence. */
export type SentenceToken = SentenceNameToken | SentenceValueToken;

/** A translated sentence: text runs and tokens in reading order. */
export type SentencePart = string | SentenceToken;

/** One condition line of a row. */
export interface SentenceLine {
  columnId: string;
  parts: readonly SentencePart[];
}

/** One row of the table, worded. */
export interface SentenceRule {
  /** Unique among the rules, and the key of its row in `TableMarks.rows`. */
  rowId: string;
  /** The row's outputs, shown first. */
  heading: readonly SentencePart[];
  /** The sentence that introduces the conditions, e.g. "when …" or "in every case". */
  lead: readonly SentencePart[];
  /** One line per condition below the lead; empty when the lead words them all. */
  lines: readonly SentenceLine[];
}

/** A kind of value a column holds, which picks its default type glyph. */
export type SentenceValueType =
  | 'text'
  | 'number'
  | 'boolean'
  | 'date'
  | 'time'
  | 'dateTime'
  | 'dayTimeDuration'
  | 'yearMonthDuration'
  | 'list'
  | 'any';

/** An input or output of a band, by its column's id and name. */
export interface SentenceBandColumn {
  id: string;
  name: string;
  /** The column's kind of value; without `icon`, its glyph. */
  type?: SentenceValueType;
  /** The column's type glyph, before its name, in place of its type's. */
  icon?: React.ReactNode;
}

/** A labelled run of columns shown above the rules. */
export interface SentenceBand {
  id: string;
  label: string;
  columns: readonly SentenceBandColumn[];
}

/** The sticky line above the rules: a label and its hint. */
export interface SentenceHeader {
  label: string;
  hint: string;
}

/** A cell, addressed as the grid's marks address it. */
export interface SentenceCellId {
  rowId: string;
  columnId: string;
}

/** One value of a cell: the cell, and the value's `index` among the cell's values, 0 for an outcome. */
export interface SentenceValueId extends SentenceCellId {
  index: number;
}

/** A rule, or one of its cells. */
export type SentenceSelection =
  | { kind: 'rule'; rowId: string }
  | ({ kind: 'cell' } & SentenceCellId);
