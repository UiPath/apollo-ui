import { cn } from '@uipath/apollo-wind';
import type React from 'react';
import { useCallback, useId, useMemo, useState } from 'react';
import { AddRuleFooter } from './AddRuleFooter';
import { bandsOf } from './bandColumns';
import { ColumnEditorOverlay } from './ColumnEditorOverlay';
import { type ColumnTypeOption, glyphOf } from './columnTypes';
import { DecisionTextHeader, type DecisionTextHeaderProps } from './DecisionTextHeader';
import { type DecisionTextDiff, diffColumnsOf, diffRowsOf } from './decisionTextDiff';
import type { DecisionTextEdit } from './decisionTextTypes';
import { EmptyRules } from './EmptyRules';
import { GridContextMenu } from './GridMenu';
import {
  type HitPolicyCatalog,
  type HitPolicyLabels,
  type HitPolicyPick,
  policyHeaderOf,
  policyMenuOf,
} from './hitPolicyMenu';
import { MarkTooltip } from './MarkTooltip';
import { EMPTY_MARKS, type TableMarks } from './marks';
import { RuleList } from './RuleList';
import { SentenceBands } from './SentenceBands';
import { tableMarks } from './sentenceMarks';
import { SENTENCE_LIST_STYLE, type SentenceListStyle } from './sentenceRuleHeights';
import {
  DECISION_TEXT_FRAME_CLASS,
  DECISION_TEXT_INLINE_FRAME_CLASS,
  NUMBER_MARGIN_CLASS,
  TEXT_COLUMN_CLASS,
} from './sentenceStyles';
import type {
  DecisionTextCitations,
  DecisionTextTable,
  SentenceBand,
  SentenceNameToken,
  SentenceSelection,
} from './sentenceTypes';
import { useAddRule } from './useAddRule';
import { useCellHover } from './useCellHover';
import { useColumnEditing } from './useColumnEditing';
import {
  type CitedRow,
  type ContainerHandlersParams,
  type DecisionTextContainerProps,
  type TextHistory,
  useContainerHandlers,
} from './useContainerHandlers';
import { useDecisionGraphLabels } from './useDecisionGraphStrings';
import {
  type DecisionTextDecisionActions,
  useDecisionTextHeaderActions,
} from './useDecisionTextHeaderActions';
import { useDecisionTextEditLabels, useDecisionTextLabels } from './useDecisionTextStrings';
import { useHostValueEdit } from './useHostValueEdit';
import { usePendingCondition } from './usePendingCondition';
import { useRuleMenus } from './useRuleMenus';
import { type DecisionTextScroll, useRuleWindow } from './useRuleWindow';
import { type SentenceNavigationSource, useSentenceNavigation } from './useSentenceNavigation';
import { useTextAnnouncements } from './useTextAnnouncements';
import { useValueEditing } from './useValueEditing';
import { ValueEditorOverlay } from './ValueEditorOverlay';

/** A click or key asks for this selection, or null on Escape. */
type SelectHandler = NonNullable<SentenceNavigationSource['onSelect']>;

const NO_CITATIONS: DecisionTextCitations = { kind: 'none' };

/** The host's own value for an attribute, with the view's hint after it. */
const withHint = (host: string | undefined, hint: string | false): string | undefined =>
  [host, hint].filter(Boolean).join(' ') || undefined;

/** The hit policy chip's content for a table in a mode: the picker while editing, its change in a diff, else its label; `fallback` stands in for a pick the catalog lacks. */
export const policyTitleOf = <Op, Policy, Total, Type, Refusal>(
  hitPolicies: HitPolicyCatalog<Policy, Total>,
  pick: HitPolicyPick<Policy, Total>,
  mode: DecisionTextMode<Op, Policy, Total, Type, Refusal>,
  labels: HitPolicyLabels,
  fallback: string
): DecisionTextHeaderProps['title'] => {
  const shown = (picked: HitPolicyPick<Policy, Total>) => {
    const { code, label } = policyHeaderOf(hitPolicies, picked);
    return { code, label: label || fallback };
  };
  if (mode.kind === 'edit') {
    const policy = policyMenuOf(hitPolicies, pick, mode.onPolicyChange, labels);
    return policy.value === ''
      ? {
          kind: 'picker',
          policy: { ...policy, value: fallback, label: labels.policyName(fallback) },
        }
      : { kind: 'picker', policy };
  }
  if (mode.kind === 'diff' && mode.diff.hitPolicy) {
    return {
      kind: 'change',
      before: shown(mode.diff.hitPolicy.before),
      after: shown(mode.diff.hitPolicy.after),
    };
  }
  return { kind: 'label', ...shown(pick) };
};

/** How the view is used: read, select rules and cells the host keeps, edit them in the host's operators, hit policies, column types and refusals, or read what changed. */
export type DecisionTextMode<Op, Policy, Total, Type, Refusal> =
  | { kind: 'read'; selected: SentenceSelection | null }
  | { kind: 'select'; selected: SentenceSelection | null; onSelect: SelectHandler }
  | (TextHistory & {
      kind: 'edit';
      selected: SentenceSelection | null;
      onSelect: SelectHandler;
      edit: DecisionTextEdit<Op, Type, Refusal>;
      onPolicyChange: (picked: HitPolicyPick<Policy, Total>) => void;
      onAddRule: () => void;
      /** Adds an input or output column; no add button on the bands when omitted. */
      onAddColumn?: (kind: SentenceNameToken['kind']) => void;
      /** The header menu's Rename and Delete, each offered only when given, and the words of their refusals; neither when omitted. */
      decisionActions?: DecisionTextDecisionActions<Refusal>;
    })
  | {
      kind: 'diff';
      /** What changed, painted on the table's after-state rules; a new diff closes every fold, so memoize it. */
      diff: DecisionTextDiff<Policy, Total, Type>;
    };

export interface DecisionTextProps<Op, Policy, Total, Type, Refusal> {
  table: DecisionTextTable<Policy, Total, Type>;
  mode: DecisionTextMode<Op, Policy, Total, Type, Refusal>;
  /** The host's hit policies, grouped and worded, which the header and its picker show. */
  hitPolicies: HitPolicyCatalog<Policy, Total>;
  /** The host's column types, worded and each told apart by `===`, which the band glyphs and the column popover's select show. */
  columnTypes: readonly ColumnTypeOption<Type>[];
  /** Where the decision and its rules were read from, each opened by the host; none when omitted. */
  citations?: DecisionTextCitations;
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
  /** The decision's name, before the hit policy. */
  name: string;
  /** Accessible name of the scroll region. */
  ariaLabel: string;
  /** Spread onto the scroll container: its handlers run after the view's and its className is added to the view's; a `data-testid` here overrides `dataTestId`. */
  containerProps?: DecisionTextContainerProps;
  /** Container testid; derived ids: `-header`, `-toggle`, `-name`, `-bands`, `-empty`, `-live`, `-row-{rowId}`, `-row-spacer`, `-value-editor`, `-mark-tooltip`, `-editor` (and its `-operator`, `-low`, `-high`, `-add`, `-expression`, `-clear`, `-cancel`, `-apply`), `-column-editor`, `-column` (and its `-label`, `-binding`, `-type`, `-allowed-values`, `-more`, `-cancel`, `-apply`), `-context-menu`. */
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

/** The view with its own header line, or without it inside a graph card that shows the policy. */
export const DecisionTextView = <Op, Policy, Total, Type, Refusal>({
  table,
  mode,
  hitPolicies,
  columnTypes,
  citations = NO_CITATIONS,
  numbered = false,
  marks = EMPTY_MARKS,
  onCellHover,
  headerMark,
  onOpenDecision,
  scroll = 'self',
  header,
  ariaLabel,
  containerProps,
  dataTestId,
  children,
}: Omit<DecisionTextProps<Op, Policy, Total, Type, Refusal>, 'name'> & {
  header: { kind: 'own'; name: string } | { kind: 'card' };
}): React.JSX.Element => {
  const { rules, inputs, outputs } = table;
  const selected = mode.kind === 'diff' ? null : mode.selected;
  const onSelect = mode.kind === 'select' || mode.kind === 'edit' ? mode.onSelect : undefined;
  const diff = mode.kind === 'diff' ? mode.diff : undefined;
  const idPrefix = useId();
  const bodyId = useId();
  const [open, setOpen] = useState(true);
  const labels = useDecisionTextLabels();
  const graphLabels = useDecisionGraphLabels();
  const announcements = useTextAnnouncements(labels, dataTestId);
  const { edit, refusal } = useHostValueEdit(
    mode.kind === 'edit' ? mode.edit : undefined,
    [...inputs, ...outputs],
    useDecisionTextEditLabels(),
    announcements
  );
  const addRule =
    mode.kind === 'edit' ? { label: labels.addRule, onAdd: mode.onAddRule } : undefined;
  const policyHeader = policyHeaderOf(hitPolicies, table.hitPolicy);
  const title = policyTitleOf(hitPolicies, table.hitPolicy, mode, labels, '');
  const addColumn = mode.kind === 'edit' ? mode.onAddColumn : undefined;
  const addsColumns = addColumn !== undefined;
  const headerActions = useDecisionTextHeaderActions({
    name: header.kind === 'own' ? header.name : '',
    host: {
      onAddColumn: addColumn,
      decision: mode.kind === 'edit' ? (mode.decisionActions ?? null) : null,
    },
    announce: announcements.announce,
    labels,
    graphLabels,
    toggle: () =>
      ruleWindow.headerRef.current?.querySelector<HTMLElement>('[data-text-toggle]') ?? null,
    dataTestId,
  });
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
        labels,
        addsColumns
      ),
    [columns, inputs, outputs, columnTypes, labels, addsColumns]
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
  const [focusedRowId, setFocusedRowId] = useState<string | undefined>(undefined);
  const [draggedRowId, setDraggedRowId] = useState<string | undefined>(undefined);
  const retainedRowId = edit?.editing?.rowId ?? selected?.rowId;
  const retainedRowIds = useMemo(
    () => [retainedRowId, focusedRowId, draggedRowId],
    [retainedRowId, focusedRowId, draggedRowId]
  );
  const ruleWindow = useRuleWindow(listed, selected?.rowId, retainedRowIds, scroll);
  const citedRows = useMemo(
    (): CitedRow[] =>
      citations.kind === 'cited'
        ? listed.flatMap((rule, index) => {
            const count = citations.rules.get(rule.rowId)?.length ?? 0;
            return count > 0 ? [{ rowId: rule.rowId, index, count }] : [];
          })
        : [],
    [citations, listed]
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
    focusRow: setFocusedRowId,
    history: mode.kind === 'edit' ? { onUndo: mode.onUndo, onRedo: mode.onRedo } : null,
    citationKeys: !selectable,
    citedRows,
    revealRow: ruleWindow.scrollRowIntoView,
    revealStop: ruleWindow.scrollStopIntoView,
  });
  const citationKeysHinted = !selectable && citedRows.length > 0;
  const columnEditing = useColumnEditing({
    column: mode.kind === 'edit' ? mode.edit.column : undefined,
    bands,
    container: ruleWindow.container,
  });
  const columnEditorId = `${idPrefix}-column-editor`;
  const onExpandFold = useCallback(
    (firstRowId: string) =>
      setFolds((current) => ({
        diff,
        expanded: new Set(current.diff === diff ? current.expanded : NO_FOLDS).add(firstRowId),
      })),
    [diff]
  );

  const digits: SentenceListStyle = { '--sentence-number-digits': String(rules.length).length };
  const frameStyle = numbered ? { ...sectionProps.style, ...digits } : sectionProps.style;

  return (
    <section
      ref={ruleWindow.attachSection}
      data-testid={dataTestId}
      {...sectionProps}
      style={frameStyle}
      aria-label={ariaLabel}
      aria-keyshortcuts={withHint(sectionProps['aria-keyshortcuts'], citationKeysHinted && 'Enter')}
      aria-description={withHint(
        sectionProps['aria-description'],
        citationKeysHinted && labels.pressEnterForSources
      )}
      className={cn(
        scroll === 'self' ? DECISION_TEXT_FRAME_CLASS : DECISION_TEXT_INLINE_FRAME_CLASS,
        header.kind === 'own' && NUMBER_MARGIN_CLASS,
        sectionProps.className
      )}
    >
      <div
        className={cn(
          TEXT_COLUMN_CLASS,
          header.kind === 'own'
            ? 'my-4 rounded-[10px] border border-border-de-emp bg-background'
            : '[--sentence-gutter:0px]',
          header.kind === 'own' && headerMark?.tone === 'error' && 'border-error-icon'
        )}
        data-testid={`${dataTestId}-column`}
      >
        {header.kind === 'own' && (
          <DecisionTextHeader
            ref={ruleWindow.headerRef}
            name={header.name}
            fold={{ open, bodyId, onToggle: () => setOpen((was) => !was) }}
            title={title}
            hint={policyHeader.hint}
            mark={headerMark}
            citations={
              citations.kind === 'cited' && citations.decision.length > 0
                ? { citations: citations.decision, onOpen: citations.onOpenCitation }
                : null
            }
            ruleCount={graphLabels.ruleCount(rules.length)}
            actions={headerActions.actions}
            labels={labels}
            sticky={scroll === 'self'}
            dataTestId={dataTestId}
          />
        )}
        {open && (
          <div id={bodyId} className="contents">
            {bands.length > 0 && (
              <SentenceBands
                bands={bands}
                marks={bandMarks}
                style={SENTENCE_LIST_STYLE}
                idPrefix={idPrefix}
                dataTestId={dataTestId}
                labels={labels}
                onAddColumn={mode.kind === 'edit' ? (mode.onAddColumn ?? null) : null}
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
              <EmptyRules
                title={labels.emptyRules}
                addRule={addRuleAction}
                dataTestId={dataTestId}
              />
            ) : (
              <RuleList
                ref={ruleWindow.attachList}
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
                          onMoveRule: edit.onMoveRule ?? null,
                          onDragRow: setDraggedRowId,
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
                citations={citations}
                style={SENTENCE_LIST_STYLE}
                idPrefix={idPrefix}
                dataTestId={dataTestId}
                labels={labels}
              />
            )}
            {addRuleAction && rules.length > 0 && (
              <AddRuleFooter addRule={addRuleAction} style={SENTENCE_LIST_STYLE} />
            )}
          </div>
        )}
      </div>
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
      {columnEditing.kind === 'edit' && columnEditing.editor && edit && (
        <ColumnEditorOverlay
          key={columnEditing.editor.column.id}
          editor={columnEditing.editor}
          types={columnTypes}
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
      {headerActions.dialog}
      {announcements.region}
      {children}
    </section>
  );
};

/** A decision table read as sentences: one rule card per rule, windowed, painted by the grid's marks, in the host's operators, hit policies, column types and refusals. */
export const DecisionText = <Op, Policy, Total, Type, Refusal>({
  name,
  ...props
}: DecisionTextProps<Op, Policy, Total, Type, Refusal>): React.ReactElement => (
  <DecisionTextView {...props} header={{ kind: 'own', name }} />
);
