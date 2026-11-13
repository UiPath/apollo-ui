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

/** An input or output of a band, by its column's id and name. */
export interface SentenceBandColumn {
  id: string;
  name: string;
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

/** A rule, or one of its cells when `columnId` is set. */
export interface SentenceSelection {
  rowId: string;
  columnId?: string;
}
