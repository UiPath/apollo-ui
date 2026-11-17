import { forwardRef } from 'react';
import { DiffFoldRow, type DiffFoldRowProps } from './DiffFoldRow';
import type { DiffRow, RuleDiff } from './decisionTextDiff';
import type { TableMarks } from './marks';
import { RuleCard, type RuleCardMode, type RuleCardProps } from './RuleCard';
import type { SentenceListStyle } from './sentenceRuleHeights';
import { GUTTER_CLASS } from './sentenceStyles';
import type { RuleMenuKind } from './sentenceTargets';
import type { SentenceRule, SentenceValueId } from './sentenceTypes';
import type { AxisSegment } from './useVirtualizedAxis';

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
  /** Read cards; editable ones with the open menu and the condition the open editor adds; or a diff's, with each shown row's change or fold. */
  mode:
    | { kind: 'read' }
    | {
        kind: 'edit';
        editLabels: Extract<RuleCardProps, { kind: 'edit' }>['editLabels'];
        openMenu: OpenRuleMenu | null;
        pending: SentenceValueId | null;
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
      mode,
      style,
      idPrefix,
      dataTestId,
      labels,
    },
    ref
  ) => {
    let nextRuleIndex = 0;
    const diff = mode.kind === 'diff' ? mode : undefined;
    const cardModeOf = (rowId: string, diff: RuleDiff | undefined): RuleCardMode => {
      if (diff) return { kind: 'diff', diff };
      if (mode.kind !== 'edit') return { kind: 'read' };
      return {
        kind: 'edit',
        editLabels: mode.editLabels,
        openMenu: mode.openMenu?.rowId === rowId ? mode.openMenu.menu : undefined,
        pendingColumnId: mode.pending?.rowId === rowId ? mode.pending.columnId : undefined,
      };
    };
    return (
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
            const row = diff?.diffRows.get(rule.rowId);
            if (diff && row?.kind === 'fold') {
              return (
                <DiffFoldRow
                  key={rule.rowId}
                  rowId={rule.rowId}
                  fold={row.fold}
                  position={segment.from + offset + 1}
                  setSize={rules.length}
                  onExpand={diff.onExpandFold}
                  dataTestId={dataTestId}
                  labels={labels}
                />
              );
            }
            return (
              <RuleCard
                key={rule.rowId}
                rule={rule}
                position={segment.from + offset + 1}
                setSize={rules.length}
                numbered={numbered}
                mark={marks.get(rule.rowId)}
                selectedColumnId={
                  segment.from + offset === selectedRow ? selectedColumnId : undefined
                }
                selectable={selectable}
                decisionLinks={decisionLinks}
                {...cardModeOf(rule.rowId, row?.kind === 'rule' ? row.diff : undefined)}
                idPrefix={idPrefix}
                dataTestId={dataTestId}
                labels={labels}
              />
            );
          });
        })}
      </ul>
    );
  }
);

RuleList.displayName = 'RuleList';
