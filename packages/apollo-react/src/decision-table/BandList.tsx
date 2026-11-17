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
  mode: BandMode;
}

/** Plain pills; a diff's, with each column's change by id; or buttons that open the column whose popover is open, or null, under `editorId`. */
export type BandMode =
  | { kind: 'read' }
  | { kind: 'diff'; changes: ReadonlyMap<string, NonNullable<BandColumnProps['change']>> }
  | {
      kind: 'edit';
      onToggle: (columnId: string) => void;
      openColumnId: string | null;
      editorId: string;
    };

/** A band's columns on one line, a tab stop while they overflow it and are no buttons, so the keyboard can scroll it. */
export const BandList: React.FC<BandListProps> = ({ band, marks, badgeIdPrefix, labels, mode }) => {
  const { ref, overflows } = useHorizontalOverflow<HTMLUListElement>();
  return (
    <ul
      ref={ref}
      className={BAND_COLUMNS_CLASS}
      aria-label={band.label}
      tabIndex={overflows && mode.kind !== 'edit' ? 0 : undefined}
    >
      {band.columns.map((column, columnIndex) => (
        <BandColumn
          key={column.id}
          column={column}
          mark={marks.get(column.id)}
          badgeId={`${badgeIdPrefix}-${columnIndex}`}
          change={mode.kind === 'diff' ? mode.changes.get(column.id) : undefined}
          labels={labels}
          pill={
            mode.kind === 'edit'
              ? {
                  kind: 'button',
                  onToggle: mode.onToggle,
                  openEditorId: column.id === mode.openColumnId ? mode.editorId : null,
                }
              : { kind: 'plain' }
          }
        />
      ))}
    </ul>
  );
};
