import { cn } from '@uipath/apollo-wind';
import type React from 'react';
import { Fragment } from 'react';
import type { LineLeadLabels } from './LineLead';
import type { RowMark } from './marks';
import { boundedParts, partsText, SENTENCE_LINE_VALUE_LIMIT } from './sentenceParts';
import {
  CLAMPED_LINE_CLASS,
  HEADING_TEXT_CLASS,
  LINE_TEXT_CLASS,
  MORE_VALUES_CLASS,
  MUTED_TEXT_CLASS,
  SELECTED_CHIP_CLASS,
} from './sentenceStyles';
import type { SentencePart, SentenceToken } from './sentenceTypes';
import { type CellStop, TokenChip } from './TokenChip';

/** The column a clamped run's values belong to. */
const runColumnId = (hidden: readonly SentencePart[]): string | undefined => {
  const [first] = hidden;
  return typeof first === 'string' ? undefined : first?.columnId;
};

/** The first values of the hidden run, an ellipsis if any remain, then the parts after the run. */
const hiddenTitle = (hidden: readonly SentencePart[], after: readonly SentencePart[]): string => {
  const { shown, clamped } = boundedParts(hidden, SENTENCE_LINE_VALUE_LIMIT);
  return `${partsText(shown)}${clamped.length > 0 ? '…' : ''}${partsText(after)}`;
};

/** A line that tests an input mutes its connecting words, as the condition's operator. */
const testsInput = (parts: readonly SentencePart[]): boolean =>
  parts.some((part) => typeof part !== 'string' && part.kind === 'input');

export interface LineTextLabels extends LineLeadLabels {
  /** The count a clamped run of values shows in place of the rest, e.g. "+9,980 more". */
  moreValues: (count: number) => string;
}

export interface LineTextProps {
  heading?: boolean;
  /** Reads out each worded condition's run verdict before its input, for a line without a lead of its own. */
  verdicts?: boolean;
  parts: readonly SentencePart[];
  cells: RowMark['cells'];
  selectedColumnId: string | null | undefined;
  stopOf: (token: SentenceToken) => CellStop | undefined;
  labels: LineTextLabels;
}

/** One line, each column's run of values cut to its first ones and followed by a count of the rest. */
export const LineText: React.FC<LineTextProps> = ({
  heading = false,
  verdicts = false,
  parts,
  cells,
  selectedColumnId,
  stopOf,
  labels,
}) => {
  const { shown, clamped } = boundedParts(parts, SENTENCE_LINE_VALUE_LIMIT);
  const textClass = cn(heading ? HEADING_TEXT_CLASS : LINE_TEXT_CLASS, 'flex-1');
  const wordClass = testsInput(parts) ? MUTED_TEXT_CLASS : undefined;
  const verdictOf = (token: SentenceToken) => {
    const matched =
      verdicts && token.kind === 'input' ? cells?.[token.columnId]?.matched : undefined;
    return matched === undefined ? null : (
      <span className="sr-only">{labels.conditionVerdict(matched)}</span>
    );
  };
  const text = (from: number, to = shown.length) =>
    shown.slice(from, to).map((part, offset) =>
      typeof part === 'string' ? (
        <span key={from + offset} className={wordClass}>
          {part}
        </span>
      ) : (
        <Fragment key={from + offset}>
          {verdictOf(part)}
          <TokenChip
            token={part}
            mark={part.kind === 'value' ? cells?.[part.columnId] : undefined}
            output={heading}
            selected={part.kind === 'value' && part.columnId === selectedColumnId}
            stop={stopOf(part)}
          />
        </Fragment>
      )
    );
  if (clamped.length === 0) {
    return <span className={textClass}>{text(0)}</span>;
  }
  const cuts = clamped.map(({ after }) => shown.length - after.length);
  const tail = cuts.at(-1) ?? shown.length;
  return (
    <span className={cn(textClass, CLAMPED_LINE_CLASS)}>
      {clamped.map(({ hidden, after, hiddenValues }, index) => (
        <Fragment key={index}>
          <span className={LINE_TEXT_CLASS}>{text(cuts[index - 1] ?? 0, cuts[index])}</span>
          <span
            className={cn(MORE_VALUES_CLASS, SELECTED_CHIP_CLASS)}
            data-selected={runColumnId(hidden) === selectedColumnId || undefined}
            data-more-values={hiddenValues}
            data-column-id={runColumnId(hidden)}
            title={hiddenTitle(hidden, after)}
          >
            {labels.moreValues(hiddenValues)}
          </span>
        </Fragment>
      ))}
      {tail < shown.length && <span className={LINE_TEXT_CLASS}>{text(tail)}</span>}
    </span>
  );
};
