import { cn } from '@uipath/apollo-wind';
import type React from 'react';
import { useCallback, useId, useMemo, useState } from 'react';
import { AddRuleFooter } from './AddRuleFooter';
import { bandsOf } from './bandColumns';
import { ColumnEditorOverlay } from './ColumnEditorOverlay';
import { DecisionTextHeader, type DecisionTextHeaderProps } from './DecisionTextHeader';
import { type DecisionTextDiff, diffColumnsOf, diffRowsOf } from './decisionTextDiff';
import type { DecisionTextEdit, DecisionTextLabels } from './decisionTextTypes';
import { EmptyRules } from './EmptyRules';
import { GridContextMenu } from './GridMenu';
import { MarkTooltip } from './MarkTooltip';
import { EMPTY_MARKS, type TableMarks } from './marks';
import { RuleList } from './RuleList';
import { SentenceBands } from './SentenceBands';
import { tableMarks } from './sentenceMarks';
import { sentenceListStyle } from './sentenceRuleHeights';
import { DECISION_TEXT_FRAME_CLASS, DECISION_TEXT_INLINE_FRAME_CLASS } from './sentenceStyles';
import type {
  SentenceBand,
  SentenceBandColumn,
  SentenceHeader,
  SentenceNameToken,
  SentenceRule,
  SentenceSelection,
} from './sentenceTypes';
import { useAddRule } from './useAddRule';
import { useCellHover } from './useCellHover';
import { useColumnEditing } from './useColumnEditing';
import {
  type ContainerHandlersParams,
  type DecisionTextContainerProps,
  useContainerHandlers,
} from './useContainerHandlers';
import { useDecisionTextEditLabels, useDecisionTextLabels } from './useDecisionTextStrings';
import { useEditState } from './useEditState';
import { usePendingCondition } from './usePendingCondition';
import { useRuleMenus } from './useRuleMenus';
import { type DecisionTextScroll, useRuleWindow } from './useRuleWindow';
import { type SentenceNavigationSource, useSentenceNavigation } from './useSentenceNavigation';
import { useValueEditing } from './useValueEditing';
import { ValueEditorOverlay } from './ValueEditorOverlay';

interface DecisionTextBaseProps {
  rules: readonly SentenceRule[];
  /** The input columns, shown in the inputs band. */
  inputs: readonly SentenceBandColumn[];
  /** The output columns, shown in the outputs band. */
  outputs: readonly SentenceBandColumn[];
  header: SentenceHeader;
  /** Shows each rule's 1-based position before its heading. */
  numbered?: boolean;
  /** The grid's own marks object: rows by row id, cells and columns by column id. */
  marks?: TableMarks;
  /** The cell whose value chip is under the pointer, or null once it is left or gone. */
  onCellHover?: Parameters<typeof useCellHover>[0];
  /** The decision's own mark, on the header line. */
  headerMark?: DecisionTextHeaderProps['mark'];
  /** Opens the decision a linked input names, from a click on it or Alt+Enter on its cell; without it inputs stay plain. */
  onOpenDecision?: ContainerHandlersParams['onOpenDecision'];
  /** Strings in place of the built-in ones, any subset; mounted rules re-render when it changes, so memoize it. */
  labels?: Partial<DecisionTextLabels>;
  /** `{ container }` sizes the view to its rules and windows them against `container`, the page's scrolling element when it is null or omitted, whose `scroll-padding-top` covers what sticks over it; `self` by default. */
  scroll?: DecisionTextScroll;
  /** Accessible name of the scroll region. */
  ariaLabel: string;
  /** Spread onto the scroll container: its handlers run after the view's and its className is added to the view's; a `data-testid` here overrides `dataTestId`. */
  containerProps?: DecisionTextContainerProps;
  /** Container testid; derived ids: `-header`, `-bands`, `-empty`, `-row-{rowId}`, `-row-spacer`, `-value-editor`, `-mark-tooltip`, `-editor` (and its `-operator`, `-low`, `-high`, `-add`, `-expression`, `-clear`, `-cancel`, `-apply`), `-column-editor`, `-column` (and its `-label`, `-binding`, `-type`, `-allowed-values`, `-more`, `-cancel`, `-apply`), `-context-menu`. */
  dataTestId: string;
  /** Overlays rendered inside the scroll container (menus, notes, dialogs). */
  children?: React.ReactNode;
}

/** A click or key asks for this selection, or null on Escape. */
type SelectHandler = NonNullable<SentenceNavigationSource['onSelect']>;

/** How the view is used: read, select rules and cells the host keeps, edit them, or read what changed. */
export type DecisionTextMode =
  | { kind: 'read'; selected: SentenceSelection | null }
  | { kind: 'select'; selected: SentenceSelection | null; onSelect: SelectHandler }
  | {
      kind: 'edit';
      selected: SentenceSelection | null;
      onSelect: SelectHandler;
      edit: DecisionTextEdit;
      onAddRule: () => void;
      /** The header's picker, showing the picked option where the label is. */
      policy?: NonNullable<DecisionTextHeaderProps['policy']>;
    }
  | {
      kind: 'diff';
      /** What changed, painted on the after-state `rules`; a new diff closes every fold, so memoize it. */
      diff: DecisionTextDiff;
    };

export interface DecisionTextProps extends DecisionTextBaseProps {
  mode: DecisionTextMode;
}

const NO_FOLDS: ReadonlySet<string> = new Set();

/** Each band column's name token by id, for a removed condition's line. */
const nameTokensOf = (bands: readonly SentenceBand[]) => {
  const names = new Map<string, SentenceNameToken>(
    bands.flatMap(({ id, columns }) =>
      columns.map((column): [string, SentenceNameToken] => [
        column.id,
        { kind: id === 'outputs' ? 'output' : 'input', columnId: column.id, text: column.name },
      ])
    )
  );
  return (columnId: string): SentenceNameToken =>
    names.get(columnId) ?? { kind: 'input', columnId, text: columnId };
};

/** A decision table read as sentences: one rule card per rule, windowed, painted by the grid's marks. */
export const DecisionText: React.FC<DecisionTextProps> = ({
  rules,
  inputs,
  outputs,
  header,
  numbered = false,
  marks = EMPTY_MARKS,
  onCellHover,
  mode,
  headerMark,
  onOpenDecision,
  labels: hostLabels,
  scroll = 'self',
  ariaLabel,
  containerProps,
  dataTestId,
  children,
}) => {
  const selected = mode.kind === 'diff' ? null : mode.selected;
  const onSelect = mode.kind === 'select' || mode.kind === 'edit' ? mode.onSelect : undefined;
  const diff = mode.kind === 'diff' ? mode.diff : undefined;
  const idPrefix = useId();
  const labels = useDecisionTextLabels(hostLabels);
  const hostEdit = mode.kind === 'edit' ? mode.edit : undefined;
  const { edit, refusal } = useEditState(hostEdit, useDecisionTextEditLabels(hostEdit?.labels));
  const addRule =
    mode.kind === 'edit' ? { label: labels.addRule, onAdd: mode.onAddRule } : undefined;
  const columns = useMemo(
    () => diff && diffColumnsOf(inputs, outputs, diff),
    [inputs, outputs, diff]
  );
  const bands = useMemo(
    () => bandsOf(columns?.inputs ?? inputs, columns?.outputs ?? outputs, labels),
    [columns, inputs, outputs, labels]
  );
  const [folds, setFolds] = useState({ diff, expanded: NO_FOLDS });
  const expanded = folds.diff === diff ? folds.expanded : NO_FOLDS;
  const diffRows = useMemo(
    () => diff && diffRowsOf(rules, diff, nameTokensOf(bands), expanded),
    [rules, diff, bands, expanded]
  );
  const { rows: rowMarks, columns: bandMarks } = tableMarks(marks);
  const hoverTo = useCellHover(onCellHover);
  const shown = usePendingCondition({ edit, rules, bands });
  const listed = diffRows?.rules ?? shown.rules;
  const ruleWindow = useRuleWindow(
    listed,
    selected?.rowId,
    edit?.editing?.rowId ?? selected?.rowId,
    scroll
  );
  const selectable = onSelect !== undefined;
  const addRuleAction = useAddRule({ ...ruleWindow, addRule, ruleCount: rules.length });
  const navigation = useSentenceNavigation({ ...ruleWindow, rules, selected, onSelect });
  const ruleMenus = useRuleMenus({
    edit,
    rules,
    bands,
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
  });
  const sectionProps = useContainerHandlers({
    containerProps,
    hoverTo,
    navigation,
    valueEditing,
    ruleMenus,
    onOpenDecision,
    container: ruleWindow.container,
    stopTabbable: selectable && ruleWindow.selectedRow !== null,
  });
  const columnEditing = useColumnEditing({
    column: edit?.column,
    bands,
    container: ruleWindow.container,
  });
  const columnEditorId = `${idPrefix}-column-editor`;
  const listStyle = sentenceListStyle(numbered, rules.length);
  const onExpandFold = useCallback(
    (firstRowId: string) =>
      setFolds((current) => ({
        diff,
        expanded: new Set(current.diff === diff ? current.expanded : NO_FOLDS).add(firstRowId),
      })),
    [diff]
  );

  return (
    <section
      ref={ruleWindow.attachSection}
      data-testid={dataTestId}
      {...sectionProps}
      aria-label={ariaLabel}
      className={cn(
        scroll === 'self' ? DECISION_TEXT_FRAME_CLASS : DECISION_TEXT_INLINE_FRAME_CLASS,
        sectionProps.className
      )}
    >
      <DecisionTextHeader
        ref={ruleWindow.headerRef}
        header={header}
        policy={mode.kind === 'edit' ? mode.policy : undefined}
        mark={headerMark}
        hitPolicy={diff?.hitPolicy}
        labels={labels}
        sticky={scroll === 'self'}
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
          mode={
            columns
              ? { kind: 'diff', changes: columns.changes }
              : columnEditing.kind === 'edit'
                ? { kind: 'edit', ...columnEditing.pills, editorId: columnEditorId }
                : { kind: 'read' }
          }
        />
      )}
      {listed.length === 0 ? (
        <EmptyRules title={labels.emptyRules} addRule={addRuleAction} dataTestId={dataTestId} />
      ) : (
        <RuleList
          ref={ruleWindow.listRef}
          rules={listed}
          mode={
            diffRows
              ? { kind: 'diff', diffRows: diffRows.rows, onExpandFold }
              : edit
                ? {
                    kind: 'edit',
                    editLabels: edit.labels,
                    openMenu: ruleMenus.state,
                    pending: shown.pending,
                  }
                : { kind: 'read' }
          }
          segments={ruleWindow.segments}
          numbered={numbered}
          marks={rowMarks}
          selectedRow={ruleWindow.selectedRow}
          selectedColumnId={navigation.selectedColumnId}
          selectable={selectable}
          decisionLinks={onOpenDecision !== undefined}
          style={listStyle}
          idPrefix={idPrefix}
          dataTestId={dataTestId}
          labels={labels}
        />
      )}
      {addRuleAction && rules.length > 0 && (
        <AddRuleFooter addRule={addRuleAction} style={listStyle} />
      )}
      {valueEditing.editor && edit && (
        <ValueEditorOverlay
          key={valueEditing.editorKey}
          editor={valueEditing.editor}
          renderEditor={edit.renderEditor}
          labels={edit.labels}
          refusal={refusal}
          onOperatorChange={shown.onOperatorChange}
          container={ruleWindow.container}
          dataTestId={dataTestId}
        />
      )}
      {columnEditing.kind === 'edit' && columnEditing.editor && edit?.column && (
        <ColumnEditorOverlay
          key={columnEditing.editor.column.id}
          editor={columnEditing.editor}
          edit={edit.column}
          labels={edit.labels}
          container={ruleWindow.container}
          id={columnEditorId}
          dataTestId={dataTestId}
        />
      )}
      <MarkTooltip container={ruleWindow.container} dataTestId={dataTestId} />
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
