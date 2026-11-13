import { forwardRef } from 'react';
import type { TableMarks } from './marks';
import { RuleCard, type RuleCardProps } from './RuleCard';
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
  /** The editing strings, or undefined for read-only cards. */
  editLabels: RuleCardProps['editLabels'];
  /** The card menu that is open, or null. */
  openMenu: OpenRuleMenu | null;
  /** The condition the open editor adds to its rule, or null. */
  pending: SentenceValueId | null;
  style: SentenceListStyle;
  idPrefix: string;
  dataTestId: string;
  labels: RuleCardProps['labels'];
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
      editLabels,
      openMenu,
      pending,
      style,
      idPrefix,
      dataTestId,
      labels,
    },
    ref
  ) => {
    let nextRuleIndex = 0;
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
          return rules
            .slice(segment.from, segment.to)
            .map((rule, offset) => (
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
                editLabels={editLabels}
                openMenu={openMenu?.rowId === rule.rowId ? openMenu.menu : undefined}
                pendingColumnId={pending?.rowId === rule.rowId ? pending.columnId : undefined}
                idPrefix={idPrefix}
                dataTestId={dataTestId}
                labels={labels}
              />
            ));
        })}
      </ul>
    );
  }
);

RuleList.displayName = 'RuleList';
