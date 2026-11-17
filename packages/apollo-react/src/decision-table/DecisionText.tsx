import { cn } from '@uipath/apollo-wind';
import type React from 'react';
import { useCallback, useId, useMemo, useState } from 'react';
import { useSafeLingui } from '../i18n/useSafeLingui';
import { AddRuleFooter } from './AddRuleFooter';
import { bandsOf } from './bandColumns';
import { ColumnEditorOverlay } from './ColumnEditorOverlay';
import type { ColumnChange, ColumnEdit } from './ColumnPopover';
import {
  type ColumnTypeOption,
  columnTypeChoicesOf,
  columnTypeIndexOf,
  glyphOf,
} from './columnTypes';
import { DecisionTextHeader, type DecisionTextHeaderProps } from './DecisionTextHeader';
import { type DecisionTextDiff, diffColumnsOf, diffRowsOf } from './decisionTextDiff';
import type { DecisionTextEdit, WordedEdit } from './decisionTextTypes';
import { EmptyRules } from './EmptyRules';
import { GridContextMenu } from './GridMenu';
import {
  type HitPolicyCatalog,
  type HitPolicyPick,
  policyHeaderOf,
  policyMenuOf,
} from './hitPolicyMenu';
import { hostCommitOf, refusedValuesOf, viewFieldOf } from './hostValues';
import { MarkTooltip } from './MarkTooltip';
import { EMPTY_MARKS, type TableMarks } from './marks';
import { RuleList } from './RuleList';
import { SentenceBands } from './SentenceBands';
import { tableMarks } from './sentenceMarks';
import { sentenceListStyle } from './sentenceRuleHeights';
import { DECISION_TEXT_FRAME_CLASS, DECISION_TEXT_INLINE_FRAME_CLASS } from './sentenceStyles';
import type {
  DecisionTextTable,
  SentenceBand,
  SentenceNameToken,
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
import { useTextAnnouncements } from './useTextAnnouncements';
import { useValueEditing } from './useValueEditing';
import { ValueEditorOverlay } from './ValueEditorOverlay';

/** How the view is used: read, select rules and cells the host keeps, edit them in the host's operators, hit policies, column types and refusals, or read what changed. */
export type DecisionTextMode<Op, Policy, Total, Type, Refusal> =
  | { kind: 'read'; selected: SentenceSelection | null }
  | { kind: 'select'; selected: SentenceSelection | null; onSelect: SelectHandler }
  | {
      kind: 'edit';
      selected: SentenceSelection | null;
      onSelect: SelectHandler;
      edit: DecisionTextEdit<Op, Type, Refusal>;
      onPolicyChange: (picked: HitPolicyPick<Policy, Total>) => void;
      onAddRule: () => void;
    }
  | {
      kind: 'diff';
      /** What changed, painted on the table's after-state rules; a new diff closes every fold, so memoize it. */
      diff: DecisionTextDiff<Policy, Total, Type>;
    };

/** A click or key asks for this selection, or null on Escape. */
type SelectHandler = NonNullable<SentenceNavigationSource['onSelect']>;

export interface DecisionTextProps<Op, Policy, Total, Type, Refusal> {
  table: DecisionTextTable<Policy, Total, Type>;
  mode: DecisionTextMode<Op, Policy, Total, Type, Refusal>;
  /** The host's hit policies, grouped and worded, which the header and its picker show. */
  hitPolicies: HitPolicyCatalog<Policy, Total>;
  /** The host's column types, worded, which the band glyphs and the column popover's select show. */
  columnTypes: readonly ColumnTypeOption<Type>[];
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
  /** `{ container }` sizes the view to its rules and windows them against `container`, the page's scrolling element when it is null or omitted, whose `scroll-padding-top` covers what sticks over it; `self` by default. */
  scroll?: DecisionTextScroll;
  /** Accessible name of the scroll region. */
  ariaLabel: string;
  /** Spread onto the scroll container: its handlers run after the view's and its className is added to the view's; a `data-testid` here overrides `dataTestId`. */
  containerProps?: DecisionTextContainerProps;
  /** Container testid; derived ids: `-header`, `-bands`, `-empty`, `-live`, `-row-{rowId}`, `-row-spacer`, `-value-editor`, `-mark-tooltip`, `-editor` (and its `-operator`, `-low`, `-high`, `-add`, `-expression`, `-clear`, `-cancel`, `-apply`), `-column-editor`, `-column` (and its `-label`, `-binding`, `-type`, `-allowed-values`, `-more`, `-cancel`, `-apply`), `-context-menu`. */
  dataTestId: string;
  /** Overlays rendered inside the scroll container (menus, notes, dialogs). */
  children?: React.ReactNode;
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

/** The host's column edit with each type by its place among the host's. */
const placedColumnEdit = <Type,>(
  column: ColumnEdit<Type>,
  types: readonly ColumnTypeOption<Type>[]
): ColumnEdit<number> => {
  const typeAt = (place: number) => types.find((_type, index) => index === place)?.type;
  const hostChange = (change: ColumnChange<number>): ColumnChange<Type> => {
    const type = change.type === undefined ? undefined : typeAt(change.type);
    const { label, allowedValues } = change;
    const common = {
      ...(label === undefined ? {} : { label }),
      ...(type === undefined ? {} : { type }),
      ...(allowedValues === undefined ? {} : { allowedValues }),
    };
    if (change.kind === 'input') {
      const { expression } = change;
      return { kind: 'input', ...common, ...(expression === undefined ? {} : { expression }) };
    }
    const { name } = change;
    return { kind: 'output', ...common, ...(name === undefined ? {} : { name }) };
  };
  return {
    field: (columnId) => {
      const field = column.field(columnId);
      return field && { ...field, type: columnTypeIndexOf(types, field.type) };
    },
    onCommit: (columnId, change) => column.onCommit(columnId, hostChange(change)),
    onMoreProperties: column.onMoreProperties,
  };
};

/** The host's edit with each operator and column type by its place among the host's, and each refusal worded with its column's name. */
const wordedEditOf = <Op, Type, Refusal>(
  edit: DecisionTextEdit<Op, Type, Refusal>,
  types: readonly ColumnTypeOption<Type>[],
  columnNameOf: (columnId: string) => string
): WordedEdit => {
  const { onCommit, onClearCell, wordRefusal, valueField, column, ...rest } = edit;
  return {
    ...rest,
    valueField: (cell) => viewFieldOf(valueField(cell)),
    onCommit: (value, commit, move) => {
      const field = valueField(value);
      const hostCommit = hostCommitOf(commit, field.kind === 'condition' ? field.operators : []);
      if (!hostCommit) return undefined;
      const refusal = onCommit(value, hostCommit, move);
      return refusal === undefined
        ? undefined
        : wordRefusal(refusal, {
            column: columnNameOf(value.columnId),
            values: refusedValuesOf(hostCommit),
          });
    },
    onClearCell: (cell) => {
      const refusal = onClearCell(cell);
      return refusal === undefined
        ? undefined
        : wordRefusal(refusal, { column: columnNameOf(cell.columnId), values: '' });
    },
    column: column && placedColumnEdit(column, types),
  };
};

/** A decision table read as sentences: one rule card per rule, windowed, painted by the grid's marks, in the host's operators, hit policies, column types and refusals. */
export const DecisionText = <Op, Policy, Total, Type, Refusal>({
  table,
  mode,
  hitPolicies,
  columnTypes,
  numbered = false,
  marks = EMPTY_MARKS,
  onCellHover,
  headerMark,
  onOpenDecision,
  scroll = 'self',
  ariaLabel,
  containerProps,
  dataTestId,
  children,
}: DecisionTextProps<Op, Policy, Total, Type, Refusal>): React.JSX.Element => {
  const { rules, inputs, outputs } = table;
  const selected = mode.kind === 'diff' ? null : mode.selected;
  const onSelect = mode.kind === 'select' || mode.kind === 'edit' ? mode.onSelect : undefined;
  const diff = mode.kind === 'diff' ? mode.diff : undefined;
  const idPrefix = useId();
  const { _ } = useSafeLingui();
  const labels = useDecisionTextLabels();
  const announcements = useTextAnnouncements(_, dataTestId);
  const columnNameOf = (columnId: string): string =>
    [...inputs, ...outputs].find((column) => column.id === columnId)?.name ?? '';
  const { edit, refusal } = useEditState(
    mode.kind === 'edit' ? wordedEditOf(mode.edit, columnTypes, columnNameOf) : undefined,
    useDecisionTextEditLabels(),
    {
      inputIds: inputs.map((column) => column.id),
      announce: announcements.announce,
      announceMove: announcements.announceMove,
    }
  );
  const addRule =
    mode.kind === 'edit' ? { label: labels.addRule, onAdd: mode.onAddRule } : undefined;
  const policyHeader = policyHeaderOf(hitPolicies, table.hitPolicy);
  const title: DecisionTextHeaderProps['title'] =
    mode.kind === 'edit'
      ? {
          kind: 'picker',
          policy: policyMenuOf(hitPolicies, table.hitPolicy, mode.onPolicyChange, _),
        }
      : diff?.hitPolicy
        ? {
            kind: 'change',
            before: policyHeaderOf(hitPolicies, diff.hitPolicy.before).label,
            after: policyHeaderOf(hitPolicies, diff.hitPolicy.after).label,
          }
        : { kind: 'label', label: policyHeader.label };
  const columns = useMemo(
    () => diff && diffColumnsOf(inputs, outputs, diff),
    [inputs, outputs, diff]
  );
  const bands = useMemo(
    () =>
      bandsOf(
        columns?.inputs ?? inputs,
        columns?.outputs ?? outputs,
        (type) => glyphOf(columnTypes, type),
        labels
      ),
    [columns, inputs, outputs, columnTypes, labels]
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
  const typeChoices = useMemo(() => columnTypeChoicesOf(columnTypes, _), [columnTypes, _]);
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
        title={title}
        hint={policyHeader.hint}
        mark={headerMark}
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
              : columnEditing.pills
                ? {
                    kind: 'edit',
                    onToggle: columnEditing.pills.onToggle,
                    openColumnId: columnEditing.pills.openId,
                    editorId: columnEditorId,
                  }
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
      {columnEditing.editor && edit && (
        <ColumnEditorOverlay
          key={columnEditing.editor.column.id}
          editor={columnEditing.editor}
          types={typeChoices}
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
      {announcements.region}
      {children}
    </section>
  );
};
