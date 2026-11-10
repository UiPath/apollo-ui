import { cn } from '@uipath/apollo-wind';
import type React from 'react';
import { Fragment } from 'react';
import { showTitleIfClipped } from './clippedTitle';
import type { RowMark } from './marks';
import { boundedParts, partsText } from './sentenceParts';
import {
  CLAMPED_LINE_CLASS,
  HEADING_TEXT_CLASS,
  LINE_FILL_CLASS,
  LINE_TEXT_CLASS,
  MORE_VALUES_CLASS,
  WORD_CLASS,
} from './sentenceStyles';
import type { SentencePart } from './sentenceTypes';
import { TokenChip } from './TokenChip';

/** Most value tokens one line renders before the rest collapse into a count. */
const SENTENCE_LINE_VALUE_LIMIT = 20;

/** The first values of the hidden run, an ellipsis if any remain, then the parts after the run. */
const hiddenTitle = (hidden: readonly SentencePart[], after: readonly SentencePart[]): string => {
  const { shown, clamped } = boundedParts(hidden, SENTENCE_LINE_VALUE_LIMIT);
  return `${partsText(shown)}${clamped.length > 0 ? '…' : ''}${partsText(after)}`;
};

/** A line that tests an input mutes its connecting words, as the condition's operator. */
const testsInput = (parts: readonly SentencePart[]): boolean =>
  parts.some((part) => typeof part !== 'string' && part.kind === 'input');

/** A line's strings. */
export interface LineTextLabels {
  /** The count a line shows in place of the values past its limit, e.g. "+9,980 more". */
  moreValues: (count: number) => string;
}

export interface LineTextProps {
  id?: string;
  heading?: boolean;
  parts: readonly SentencePart[];
  cells: RowMark['cells'];
  labels: LineTextLabels;
}

/** One clamped line: its first values, then a count of the rest that the clamp never hides. */
export const LineText: React.FC<LineTextProps> = ({
  id,
  heading = false,
  parts,
  cells,
  labels,
}) => {
  const { shown, clamped } = boundedParts(parts, SENTENCE_LINE_VALUE_LIMIT);
  const textClass = cn(heading ? HEADING_TEXT_CLASS : LINE_TEXT_CLASS, LINE_FILL_CLASS);
  const wordClass = testsInput(parts) ? WORD_CLASS : undefined;
  const text = (from: number, to = shown.length) =>
    shown.slice(from, to).map((part, offset) =>
      typeof part === 'string' ? (
        <span key={from + offset} className={wordClass}>
          {part}
        </span>
      ) : (
        <TokenChip
          key={from + offset}
          token={part}
          mark={part.kind === 'value' ? cells?.[part.columnId] : undefined}
          output={heading}
        />
      )
    );
  if (clamped.length === 0) {
    return (
      <span id={id} className={textClass} onMouseEnter={showTitleIfClipped}>
        {text(0)}
      </span>
    );
  }
  const cuts = clamped.map(({ after }) => shown.length - after.length);
  const tail = cuts.at(-1) ?? shown.length;
  return (
    <span id={id} className={cn(textClass, CLAMPED_LINE_CLASS)}>
      {clamped.map(({ hidden, after, hiddenValues }, index) => (
        <Fragment key={index}>
          <span className={LINE_TEXT_CLASS} onMouseEnter={showTitleIfClipped}>
            {text(cuts[index - 1] ?? 0, cuts[index])}
          </span>
          <span
            className={MORE_VALUES_CLASS}
            data-more-values={hiddenValues}
            title={hiddenTitle(hidden, after)}
          >
            {labels.moreValues(hiddenValues)}
          </span>
        </Fragment>
      ))}
      {tail < shown.length && (
        <span className={LINE_TEXT_CLASS} onMouseEnter={showTitleIfClipped}>
          {text(tail)}
        </span>
      )}
    </span>
  );
};
