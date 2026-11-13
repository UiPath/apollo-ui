import { cn } from '@uipath/apollo-wind';
import type React from 'react';
import type { Mark } from './marks';
import type { MarkFields } from './sentenceMarks';
import { tokenText } from './sentenceParts';
import {
  DECISION_LINK_CLASS,
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

/** A cell's keyboard stop: its first value token, or its input without one, named by the hidden label `labelId`. */
export interface CellStop {
  token: SentenceToken;
  labelId: string;
  label: string;
  /** Whether Enter and Space start editing it, so it is a button; else it is a named group. */
  editable: boolean;
}

/** An input's link to the decision that produces it; the section resolves its click. */
export interface DecisionLink {
  decisionId: string;
  label: string | undefined;
  /** False when the input's cell stop opens it with Alt+Enter instead. */
  tabbable: boolean;
}

const linkTabIndex = (link: DecisionLink, stop: CellStop | undefined, selected: boolean) => {
  if (stop) return selected ? 0 : -1;
  return link.tabbable ? undefined : -1;
};

export interface TokenChipProps {
  token: SentenceToken;
  mark: Mark | undefined;
  output: boolean;
  selected: boolean;
  stop: CellStop | undefined;
  link: DecisionLink | undefined;
}

/** One token of a line, painted by its cell's mark. */
export const TokenChip: React.FC<TokenChipProps> = ({
  token,
  mark,
  output,
  selected,
  stop,
  link,
}) => {
  const isValue = token.kind === 'value';
  const { tone, title, matched } = chipMark(mark);
  if (link) {
    return (
      <button
        type="button"
        tabIndex={linkTabIndex(link, stop, selected)}
        aria-label={link.label}
        aria-describedby={stop?.labelId}
        className={cn(tokenClass(token, output), DECISION_LINK_CLASS, stop && SELECTED_CHIP_CLASS)}
        data-selected={selected || undefined}
        data-rule-action="decision"
        data-decision-id={link.decisionId}
        data-kind={token.kind}
        data-column-id={token.columnId}
      >
        {tokenText(token)}
      </button>
    );
  }
  return (
    // biome-ignore lint/a11y/useAriaPropsSupportedByRole: a stop's span is a button or a group whenever it has a label
    <span
      className={cn(
        tokenClass(token, output),
        isValue && MARKED_CHIP_CLASS,
        (isValue || stop) && SELECTED_CHIP_CLASS
      )}
      role={stop && (stop.editable ? 'button' : 'group')}
      tabIndex={stop && (selected ? 0 : -1)}
      aria-labelledby={stop?.labelId}
      data-selected={selected || undefined}
      data-stop={stop && ''}
      data-kind={token.kind}
      data-column-id={token.columnId}
      data-value-index={token.kind === 'value' ? token.index : undefined}
      data-tone={tone}
      data-mark-title={title}
      data-mark-matched={matched}
    >
      {tokenText(token)}
    </span>
  );
};
