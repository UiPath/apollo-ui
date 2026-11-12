import type React from 'react';
import type { GridColumn, GridColumnGroup } from './gridTypes';
import type { GridNavigation } from './useGridNavigation';

/** A column's name inside a sentence; `columnId` is the input's or output's id. */
export interface SentenceNameToken {
  kind: 'input' | 'output';
  columnId: string;
  text: string;
  /** The decision whose output this input is; set only on an input. */
  decisionId?: string;
}

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
  rowId: string;
  /** The row's outputs, shown first. */
  heading: readonly SentencePart[];
  /** The sentence that introduces the conditions, e.g. "when …" or "in every case". */
  lead: readonly SentencePart[];
  /** One line per condition below the lead; empty when the lead words them all. */
  lines: readonly SentenceLine[];
}

interface SentenceBandColumn extends Pick<GridColumn, 'id' | 'name'> {
  /** The column's type glyph, before its name. */
  icon?: React.ReactNode;
}

/** A labelled run of columns shown above the rules. */
export interface SentenceBand extends Pick<GridColumnGroup, 'id' | 'label'> {
  columns: readonly SentenceBandColumn[];
}

/** A cell, addressed as the grid's marks address it. */
export type SentenceCellId = NonNullable<GridNavigation['selectedIds']>;

/** One value of a cell: the cell, and the value's `index` among the cell's values, 0 for an outcome. */
export interface SentenceValueId extends SentenceCellId {
  index: number;
}

/** A rule, or one of its cells when `columnId` is set. */
export type SentenceSelection = Pick<SentenceCellId, 'rowId'> &
  Partial<Pick<SentenceCellId, 'columnId'>>;
