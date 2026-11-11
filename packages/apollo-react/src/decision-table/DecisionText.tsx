import type React from 'react';
import { useId, useLayoutEffect, useRef } from 'react';
import type { AddRuleButtonProps } from './AddRuleButton';
import { AddRuleFooter } from './AddRuleFooter';
import {
  DecisionTextHeader,
  type DecisionTextHeaderProps,
  type SentenceHeader,
} from './DecisionTextHeader';
import { EmptyRules } from './EmptyRules';
import { GridContextMenu, type GridMenuEntry } from './GridMenu';
import type { CellCommitMove } from './gridTypes';
import { EMPTY_MARKS, type TableMarks } from './marks';
import type { RuleCardEditLabels, RuleCardLabels } from './RuleCard';
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
  SentenceValueId,
} from './sentenceTypes';
import { useCellHover } from './useCellHover';
import { type ContainerProps, useContainerHandlers } from './useContainerHandlers';
import { useRuleMenus } from './useRuleMenus';
import { useRuleWindow } from './useRuleWindow';
import { useSentenceNavigation } from './useSentenceNavigation';
import { useValueEditing } from './useValueEditing';
import { ValueEditorOverlay, type ValueEditorOverlayProps } from './ValueEditorOverlay';

/** The view's own strings; the consumer passes localized values. */
export interface DecisionTextLabels extends RuleCardLabels {
  emptyRules: string;
}

/** The editing strings; the consumer passes localized values. */
export interface DecisionTextEditLabels extends RuleCardEditLabels {
  /** The editor of a condition the rule does not have yet, e.g. "New income condition, rule 3". */
  newCondition: (column: string, position: number) => string;
}

/** Editing on the cards, the grid's cell-editing contract addressed by value; omit it for a read-only view. */
export interface DecisionTextEdit {
  /** The value whose editor is open, or null: the grid's `editing`, addressed by ids as `selected` is. */
  editing: SentenceValueId | null;
  onStartEdit: (value: SentenceValueId) => void;
  /** Keep `editing` set to refuse the text; the editor stays open with the draft. */
  onCommit: (value: SentenceValueId, text: string, move: CellCommitMove) => void;
  onCancel: () => void;
  /** Swaps the plain input for the host's editor, as `GridCellProps.renderEditor`. */
  renderEditor?: ValueEditorOverlayProps['renderEditor'];
  /** A condition's remove action, or Delete on a selected value: the grid's clear, for one cell. */
  onClearCell: (cell: SentenceCellId) => void;
  /** The add-condition menu of a rule; called only while it is open. */
  conditionEntries: (rowId: string) => GridMenuEntry[];
  /** The rule's own menu, as the grid's row menu; called only while it is open. */
  ruleEntries: (rowId: string) => GridMenuEntry[];
  /** The rule card's delete action, as the grid row's delete button; the host selects what follows. */
  onDeleteRule: (rowId: string) => void;
  /** The editing strings; mounted rules re-render when it changes, so memoize it. */
  labels: DecisionTextEditLabels;
}

interface DecisionTextBaseProps {
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
  /** The header's picker, showing the picked option where the label is. */
  policy?: DecisionTextHeaderProps['policy'];
  /** The decision's own mark, on the header line. */
  headerMark?: DecisionTextHeaderProps['mark'];
  /** Opens the decision a linked input names, from a click on it or Alt+Enter on its cell; without it inputs stay plain. */
  onOpenDecision?: (decisionId: string) => void;
  /** The view's own strings; mounted rules re-render when it changes, so memoize it. */
  labels: DecisionTextLabels;
  /** Accessible name of the scroll region. */
  ariaLabel: string;
  /** Merged onto the scroll container; a `data-testid` here overrides `dataTestId`. */
  containerProps?: ContainerProps;
  /** Container testid; derived ids: `-header`, `-bands`, `-empty`, `-row-{rowId}`, `-row-spacer`, `-value-editor`, `-editor`, `-context-menu`. */
  dataTestId: string;
  /** Overlays rendered inside the scroll container (menus, notes, dialogs). */
  children?: React.ReactNode;
}

/** A read-only view, which may show a selection the host keeps. */
interface ReadOnlyDecisionText {
  /** The selected rule or cell, as the grid's `selected` is controlled; one whose row is gone shows nothing selected. */
  selected?: SentenceSelection | null;
  onSelect?: undefined;
  edit?: undefined;
}

/** A view whose selection the host controls, which selecting and editing require, as the grid's editable cells do. */
interface EditableDecisionText {
  selected: SentenceSelection | null;
  /** A click or key asks for this selection, or null on Escape. */
  onSelect: (selection: SentenceSelection | null) => void;
  /** Editing on the cards; omit it for a read-only view. */
  edit?: DecisionTextEdit;
}

export type DecisionTextProps = DecisionTextBaseProps &
  (ReadOnlyDecisionText | EditableDecisionText);

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
  edit,
  policy,
  headerMark,
  onOpenDecision,
  labels,
  ariaLabel,
  containerProps,
  dataTestId,
  children,
}) => {
  const idPrefix = useId();
  const { rows: rowMarks, columns: bandMarks } = tableMarks(marks);
  const hoverTo = useCellHover(onCellHover);
  const ruleWindow = useRuleWindow(rules, selected?.rowId, edit?.editing?.rowId ?? selected?.rowId);
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
  const ruleMenus = useRuleMenus({
    edit,
    rules,
    selectedRowId: selected?.rowId,
    refocus: navigation.refocus,
  });
  const valueEditing = useValueEditing({
    edit,
    rules,
    bands,
    selected,
    onSelect,
    navigation,
    labels,
    container: ruleWindow.container,
    openMenu: ruleMenus.openFor,
  });
  const sectionProps = useContainerHandlers({
    containerProps,
    hoverTo,
    navigation,
    valueEditing,
    ruleMenus,
    onOpenDecision,
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
      <DecisionTextHeader
        ref={ruleWindow.headerRef}
        header={header}
        policy={policy}
        mark={headerMark}
        labels={labels}
        dataTestId={dataTestId}
      />
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
          decisionLinks={onOpenDecision !== undefined}
          editLabels={edit?.labels}
          openMenu={ruleMenus.state}
          style={listStyle}
          idPrefix={idPrefix}
          dataTestId={dataTestId}
          labels={labels}
        />
      )}
      {addRule && rules.length > 0 && <AddRuleFooter addRule={addRule} style={listStyle} />}
      {valueEditing.editor && (
        <ValueEditorOverlay
          key={valueEditing.editorKey}
          editor={valueEditing.editor}
          renderEditor={edit?.renderEditor}
          container={ruleWindow.container}
          dataTestId={dataTestId}
        />
      )}
      <GridContextMenu
        label={ruleMenus.label}
        dataTestId={dataTestId}
        state={ruleMenus.state}
        entries={ruleMenus.entries}
        onClose={ruleMenus.onClose}
      />
      {children}
    </section>
  );
};
