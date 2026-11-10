import type React from 'react';
import { useId } from 'react';
import { AddRuleFooter } from './AddRuleFooter';
import { DecisionTextHeader } from './DecisionTextHeader';
import { EmptyRules } from './EmptyRules';
import { EMPTY_MARKS, type TableMarks } from './marks';
import { RuleList } from './RuleList';
import { SentenceBands } from './SentenceBands';
import { tableMarks } from './sentenceMarks';
import { sentenceListStyle } from './sentenceRuleHeights';
import { DECISION_TEXT_FRAME_CLASS } from './sentenceStyles';
import type {
  DecisionTextLabels,
  SentenceBand,
  SentenceCellId,
  SentenceHeader,
  SentenceRule,
} from './sentenceTypes';
import { useCellHover } from './useCellHover';
import { useContainerHandlers } from './useContainerHandlers';
import { useRuleWindow } from './useRuleWindow';

export interface DecisionTextAddRule {
  label: string;
  onAdd: () => void;
}

export interface DecisionTextProps {
  rules: readonly SentenceRule[];
  bands: readonly SentenceBand[];
  header: SentenceHeader;
  /** Shows each rule's 1-based position before its heading. */
  numbered?: boolean;
  /** The grid's own marks object: rows by row id, cells and columns by column id. */
  marks?: TableMarks;
  /** The add-rule action and its label, after the rules and in the empty state. */
  addRule?: DecisionTextAddRule;
  /** The cell whose value chip is under the pointer, or null once it is left or gone. */
  onCellHover?: (cell: SentenceCellId | null) => void;
  /** The view's own strings; mounted rules re-render when it changes, so memoize it. */
  labels: DecisionTextLabels;
  /** Accessible name of the scroll region. */
  ariaLabel: string;
  /** Merged onto the scroll container; a `data-testid` here overrides `dataTestId`. */
  containerProps?: React.HTMLAttributes<HTMLElement> & Record<`data-${string}`, string | undefined>;
  /** Container testid; derived ids: `-header`, `-bands`, `-empty`, `-row-{rowId}`, `-row-spacer`. */
  dataTestId: string;
}

/** A decision table read as sentences: one rule card per rule, windowed, painted by the grid's marks. */
export const DecisionText: React.FC<DecisionTextProps> = ({
  rules,
  bands,
  header,
  numbered = false,
  marks = EMPTY_MARKS,
  addRule,
  onCellHover,
  labels,
  ariaLabel,
  containerProps,
  dataTestId,
}) => {
  const idPrefix = useId();
  const { rows: rowMarks, columns: bandMarks } = tableMarks(marks);
  const hoverTo = useCellHover(onCellHover);
  const { listRef, segments, measureRef } = useRuleWindow(rules);
  const sectionProps = useContainerHandlers({ containerProps, hoverTo });
  const listStyle = sentenceListStyle(numbered, rules.length);

  return (
    <section
      ref={measureRef}
      aria-label={ariaLabel}
      // biome-ignore lint/a11y/noNoninteractiveTabindex: a scrollable region must be reachable by keyboard
      tabIndex={0}
      className={DECISION_TEXT_FRAME_CLASS}
      data-testid={dataTestId}
      {...sectionProps}
    >
      <DecisionTextHeader header={header} dataTestId={dataTestId} />
      {bands.length > 0 && (
        <SentenceBands
          bands={bands}
          marks={bandMarks}
          style={listStyle}
          idPrefix={idPrefix}
          dataTestId={dataTestId}
          labels={labels}
        />
      )}
      {rules.length === 0 ? (
        <EmptyRules title={labels.emptyRules} addRule={addRule} dataTestId={dataTestId} />
      ) : (
        <RuleList
          ref={listRef}
          rules={rules}
          segments={segments}
          numbered={numbered}
          marks={rowMarks}
          style={listStyle}
          idPrefix={idPrefix}
          dataTestId={dataTestId}
          labels={labels}
        />
      )}
      {addRule && rules.length > 0 && <AddRuleFooter addRule={addRule} style={listStyle} />}
    </section>
  );
};
