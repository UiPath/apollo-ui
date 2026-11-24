import { closestCenter, DndContext, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { forwardRef, useMemo } from 'react';
import { DiffFoldRow, type DiffFoldRowProps } from './DiffFoldRow';
import type { DiffRow, RuleDiff } from './decisionTextDiff';
import type { TableMarks } from './marks';
import { RuleCard, type RuleCardMode, type RuleCardProps } from './RuleCard';
import type { SentenceListStyle } from './sentenceRuleHeights';
import { GUTTER_CLASS } from './sentenceStyles';
import type { RuleMenuKind } from './sentenceTargets';
import type { SentenceRule, SentenceValueId } from './sentenceTypes';
import type { AxisSegment } from './useVirtualizedAxis';
import { useRuleSensors } from './useRuleSensors';

/** Which card menu is open, and for which rule. */
export interface OpenRuleMenu {
  menu: RuleMenuKind;
  rowId: string;
}

export interface RuleListProps {
  rules: readonly SentenceRule[];
  segments: readonly AxisSegment[];
  numbered: boolean;
  marks: TableMarks['rows'];
  selectedRow: number | null;
  /** The selected row's cell, or null for its rule. */
  selectedColumnId: string | null;
  selectable: boolean;
  decisionLinks: boolean;
  citations: RuleCardProps['citations'];
  /** Read cards; editable ones with the open menu and the condition the open editor adds; or a diff's, with each shown row's change or fold. */
  mode:
    | { kind: 'read' }
    | {
        kind: 'edit';
        editLabels: Extract<RuleCardMode, { kind: 'edit' }>['editLabels'];
        openMenu: OpenRuleMenu | null;
        pending: SentenceValueId | null;
        /** Moves the rule at `from` to `to`, or null when rules cannot be dragged. */
        onMoveRule: ((from: number, to: number) => void) | null;
      }
    | {
        kind: 'diff';
        diffRows: ReadonlyMap<string, DiffRow>;
        onExpandFold: DiffFoldRowProps['onExpand'];
      };
  style: SentenceListStyle;
  idPrefix: string;
  dataTestId: string;
  labels: RuleCardProps['labels'] & DiffFoldRowProps['labels'];
}

type EditCardMode = Extract<RuleCardMode, { kind: 'edit' }>;

/** A card that can be dragged among its list's rules. Mounted only inside the list's DndContext. */
const SortableRuleCard: React.FC<
  Omit<RuleCardProps, keyof EditCardMode> & Omit<EditCardMode, 'sortable'>
> = (props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.rule.rowId });
  return (
    <RuleCard
      {...props}
      sortable={{
        attributes,
        listeners,
        setNodeRef,
        setActivatorNodeRef,
        transform,
        transition,
        isDragging,
      }}
    />
  );
};

/** The windowed rules: a rule card for each mounted rule, a spacer for each run left out. */
export const RuleList = forwardRef<HTMLUListElement, RuleListProps>(
  (
    {
      rules,
      segments,
      numbered,
      marks,
      selectedRow,
      selectedColumnId,
      selectable,
      decisionLinks,
      citations,
      mode,
      style,
      idPrefix,
      dataTestId,
      labels,
    },
    ref
  ) => {
    let nextRuleIndex = 0;
    const sensors = useRuleSensors();
    const onMoveRule = mode.kind === 'edit' ? mode.onMoveRule : null;
    const rowIds = useMemo(() => rules.map((rule) => rule.rowId), [rules]);
    const cardModeOf = (rowId: string, ruleDiff: RuleDiff | undefined): RuleCardMode => {
      if (ruleDiff) return { kind: 'diff', diff: ruleDiff };
      if (mode.kind !== 'edit') return { kind: 'read' };
      return {
        kind: 'edit',
        editLabels: mode.editLabels,
        openMenu: mode.openMenu?.rowId === rowId ? mode.openMenu.menu : undefined,
        pendingColumnId: mode.pending?.rowId === rowId ? mode.pending.columnId : undefined,
        sortable: null,
      };
    };
    const onDragEnd = ({ active, over }: DragEndEvent) => {
      const from = rowIds.indexOf(String(active.id));
      const to = over ? rowIds.indexOf(String(over.id)) : -1;
      if (onMoveRule && from >= 0 && to >= 0 && from !== to) onMoveRule(from, to);
    };
    const list = (
      <ul ref={ref} className={GUTTER_CLASS} style={style}>
        {segments.flatMap((segment) => {
          if (segment.type === 'spacer') {
            return (
              <li
                key={`spacer-${nextRuleIndex}`}
                aria-hidden
                data-testid={`${dataTestId}-row-spacer`}
                style={{ height: segment.sizePx }}
              />
            );
          }
          nextRuleIndex = segment.to;
          return rules.slice(segment.from, segment.to).map((rule, offset) => {
            const row = mode.kind === 'diff' ? mode.diffRows.get(rule.rowId) : undefined;
            if (mode.kind === 'diff' && row?.kind === 'fold') {
              return (
                <DiffFoldRow
                  key={rule.rowId}
                  rowId={rule.rowId}
                  fold={row.fold}
                  position={segment.from + offset + 1}
                  setSize={rules.length}
                  onExpand={mode.onExpandFold}
                  dataTestId={dataTestId}
                  labels={labels}
                />
              );
            }
            const cardMode = cardModeOf(rule.rowId, row?.kind === 'rule' ? row.diff : undefined);
            const card = {
              rule,
              position: segment.from + offset + 1,
              setSize: rules.length,
              numbered,
              mark: marks.get(rule.rowId),
              selectedColumnId:
                segment.from + offset === selectedRow ? selectedColumnId : undefined,
              selectable,
              decisionLinks,
              citations,
              idPrefix,
              dataTestId,
              labels,
            };
            return onMoveRule && cardMode.kind === 'edit' ? (
              <SortableRuleCard key={rule.rowId} {...card} {...cardMode} />
            ) : (
              <RuleCard key={rule.rowId} {...card} {...cardMode} />
            );
          });
        })}
      </ul>
    );
    return onMoveRule ? (
      <DndContext collisionDetection={closestCenter} sensors={sensors} onDragEnd={onDragEnd}>
        <SortableContext items={rowIds} strategy={verticalListSortingStrategy}>
          {list}
        </SortableContext>
      </DndContext>
    ) : (
      list
    );
  }
);

RuleList.displayName = 'RuleList';
