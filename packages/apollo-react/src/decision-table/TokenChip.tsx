import { cn } from '@uipath/apollo-wind';
import type React from 'react';
import type { Mark } from './marks';
import type { MarkFields } from './sentenceMarks';
import { tokenText } from './sentenceParts';
import {
  EMPTY_OUTPUT_VALUE_CLASS,
  MARKED_CHIP_CLASS,
  OUTPUT_VALUE_CLASS,
  SELECTED_CHIP_CLASS,
  TOKEN_KIND_CLASS,
} from './sentenceStyles';
import type { SentenceToken } from './sentenceTypes';

/** The `Mark` fields a value chip paints; a field added to `Mark` fails to compile here until the chip decides on it. */
const chipMark = (mark: Mark | undefined) =>
  ({
    tone: mark?.tone,
    title: mark?.title,
    matched: mark?.matched,
    glyph: undefined,
  }) satisfies MarkFields<Mark>;

/** A token's own look: an output's value is a pill, or muted when the cell is empty. */
const tokenClass = (token: SentenceToken, output: boolean): string => {
  if (token.kind !== 'value' || !output) return TOKEN_KIND_CLASS[token.kind];
  return token.text === '' ? EMPTY_OUTPUT_VALUE_CLASS : OUTPUT_VALUE_CLASS;
};

/** A cell's keyboard stop: its first value token, named by the hidden label `labelId`. */
export interface CellStop {
  token: SentenceToken;
  labelId: string;
  label: string;
}

export interface TokenChipProps {
  token: SentenceToken;
  mark: Mark | undefined;
  output: boolean;
  selected: boolean;
  stop: CellStop | undefined;
}

/** One token of a line, painted by its cell's mark. */
export const TokenChip: React.FC<TokenChipProps> = ({ token, mark, output, selected, stop }) => {
  const isValue = token.kind === 'value';
  const { tone, title, matched } = chipMark(mark);
  return (
    // biome-ignore lint/a11y/useAriaPropsSupportedByRole: a stop's span is a button whenever it has a label
    <span
      className={cn(
        tokenClass(token, output),
        isValue && MARKED_CHIP_CLASS,
        isValue && SELECTED_CHIP_CLASS
      )}
      role={stop && 'button'}
      tabIndex={stop && (selected ? 0 : -1)}
      aria-labelledby={stop?.labelId}
      data-selected={selected || undefined}
      data-kind={token.kind}
      data-column-id={token.columnId}
      data-tone={tone}
      data-mark-title={title}
      data-mark-matched={matched}
    >
      {tokenText(token)}
    </span>
  );
};
