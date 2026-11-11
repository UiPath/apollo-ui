import type React from 'react';
import { useId, useLayoutEffect, useRef } from 'react';
import type { AddRuleButtonProps } from './AddRuleButton';
import { AddRuleFooter } from './AddRuleFooter';
import { DecisionTextHeader, type SentenceHeader } from './DecisionTextHeader';
import { EmptyRules } from './EmptyRules';
import { EMPTY_MARKS, type TableMarks } from './marks';
import type { RuleCardLabels } from './RuleCard';
import { RuleList } from './RuleList';
import { SentenceBands } from './SentenceBands';
import { tableMarks } from './sentenceMarks';
import { sentenceListStyle } from './sentenceRuleHeights';
import { DECISION_TEXT_FRAME_CLASS } from './sentenceStyles';
import type {
  SentenceBand,
  SentenceCellId,
  SentenceRule,
  SentenceSelection,
} from './sentenceTypes';
import { useCellHover } from './useCellHover';
import { type ContainerProps, useContainerHandlers } from './useContainerHandlers';
import { useRuleWindow } from './useRuleWindow';
import { useSentenceNavigation } from './useSentenceNavigation';

/** The view's own strings; the consumer passes localized values. */
export interface DecisionTextLabels extends RuleCardLabels {
  emptyRules: string;
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
  addRule?: AddRuleButtonProps;
  /** The cell whose value chip is under the pointer, or null once it is left or gone. */
  onCellHover?: (cell: SentenceCellId | null) => void;
  /** The selected rule or cell, as the grid's `selected` is controlled; one whose row is gone shows nothing selected. */
  selected?: SentenceSelection | null;
  /** A click or key asks for this selection, or null on Escape; without it the view claims no key. */
  onSelect?: (selection: SentenceSelection | null) => void;
  /** The view's own strings; mounted rules re-render when it changes, so memoize it. */
  labels: DecisionTextLabels;
  /** Accessible name of the scroll region. */
  ariaLabel: string;
  /** Merged onto the scroll container; a `data-testid` here overrides `dataTestId`. */
  containerProps?: ContainerProps;
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
  selected,
  onSelect,
  labels,
  ariaLabel,
  containerProps,
  dataTestId,
}) => {
  const idPrefix = useId();
  const { rows: rowMarks, columns: bandMarks } = tableMarks(marks);
  const hoverTo = useCellHover(onCellHover);
  const ruleWindow = useRuleWindow(rules, selected?.rowId);
  const selectable = onSelect !== undefined;
  const addedFromEmptyRef = useRef(false);
  useLayoutEffect(() => {
    if (!addedFromEmptyRef.current || rules.length === 0) return;
    addedFromEmptyRef.current = false;
    ruleWindow
      .container()
      ?.querySelector<HTMLElement>('[data-add-rule] button')
      ?.focus({ preventScroll: true });
  });
  const emptyAddRule = addRule && {
    ...addRule,
    onAdd: () => {
      addedFromEmptyRef.current = true;
      addRule.onAdd();
    },
  };
  const navigation = useSentenceNavigation({ ...ruleWindow, rules, selected, onSelect });
  const sectionProps = useContainerHandlers({
    containerProps,
    hoverTo,
    navigation,
    container: ruleWindow.container,
  });
  const listStyle = sentenceListStyle(numbered, rules.length);

  return (
    <section
      ref={ruleWindow.attachSection}
      aria-label={ariaLabel}
      // biome-ignore lint/a11y/noNoninteractiveTabindex: a scrollable region must be reachable by keyboard
      tabIndex={0}
      className={DECISION_TEXT_FRAME_CLASS}
      data-testid={dataTestId}
      {...sectionProps}
    >
      <DecisionTextHeader ref={ruleWindow.headerRef} header={header} dataTestId={dataTestId} />
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
        <EmptyRules title={labels.emptyRules} addRule={emptyAddRule} dataTestId={dataTestId} />
      ) : (
        <RuleList
          ref={ruleWindow.listRef}
          rules={rules}
          segments={ruleWindow.segments}
          numbered={numbered}
          marks={rowMarks}
          selectedRow={ruleWindow.selectedRow}
          selectedColumnId={navigation.selectedColumnId}
          selectable={selectable}
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
