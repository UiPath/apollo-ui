import { forwardRef } from 'react';
import type { TableMarks } from './marks';
import { RuleCard, type RuleCardProps } from './RuleCard';
import type { SentenceListStyle } from './sentenceRuleHeights';
import { GUTTER_CLASS } from './sentenceStyles';
import type { SentenceRule } from './sentenceTypes';
import type { AxisSegment } from './useVirtualizedAxis';

export interface RuleListProps {
  rules: readonly SentenceRule[];
  segments: readonly AxisSegment[];
  numbered: boolean;
  marks: TableMarks['rows'];
  selectedRow: number | null;
  /** The selected row's cell, or null for its rule. */
  selectedColumnId: string | null;
  selectable: boolean;
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
