import type React from 'react';
import { BandColumn, type BandColumnProps } from './BandColumn';
import type { TableMarks } from './marks';
import { BAND_COLUMNS_CLASS } from './sentenceStyles';
import type { SentenceBand } from './sentenceTypes';
import { useHorizontalOverflow } from './useHorizontalOverflow';

export interface BandListProps {
  band: SentenceBand;
  marks: TableMarks['columns'];
  /** Prefix of its columns' badge ids, each followed by the column's index. */
  badgeIdPrefix: string;
  labels: BandColumnProps['labels'];
}

/** A band's columns on one line, a tab stop while they overflow it so the keyboard can scroll it. */
export const BandList: React.FC<BandListProps> = ({ band, marks, badgeIdPrefix, labels }) => {
  const { ref, overflows } = useHorizontalOverflow<HTMLUListElement>();
  return (
    <ul
      ref={ref}
      className={BAND_COLUMNS_CLASS}
      aria-label={band.label}
      tabIndex={overflows ? 0 : undefined}
    >
      {band.columns.map((column, columnIndex) => (
        <BandColumn
          key={column.id}
          column={column}
          mark={marks.get(column.id)}
          badgeId={`${badgeIdPrefix}-${columnIndex}`}
          labels={labels}
        />
      ))}
    </ul>
  );
};
