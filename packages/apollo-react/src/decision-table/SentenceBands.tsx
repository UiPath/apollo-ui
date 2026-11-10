import type React from 'react';
import { BandColumn, type BandColumnProps } from './BandColumn';
import type { TableMarks } from './marks';
import type { SentenceListStyle } from './sentenceRuleHeights';
import {
  BAND_CAPTION_CLASS,
  BAND_COLUMNS_CLASS,
  DECISION_TEXT_BANDS_CLASS,
} from './sentenceStyles';
import type { SentenceBand } from './sentenceTypes';

export interface SentenceBandsProps {
  bands: readonly SentenceBand[];
  marks: TableMarks['columns'];
  style: SentenceListStyle;
  idPrefix: string;
  dataTestId: string;
  labels: BandColumnProps['labels'];
}

/** The inputs and outputs above the rules, one captioned band each. */
export const SentenceBands: React.FC<SentenceBandsProps> = ({
  bands,
  marks,
  style,
  idPrefix,
  dataTestId,
  labels,
}) => (
  <div className={DECISION_TEXT_BANDS_CLASS} style={style} data-testid={`${dataTestId}-bands`}>
    {bands.map((band, bandIndex) => (
      <div key={band.id} className="contents" data-band-id={band.id}>
        <span aria-hidden className={BAND_CAPTION_CLASS}>
          {band.label}
        </span>
        <ul
          className={BAND_COLUMNS_CLASS}
          aria-label={band.label}
          // biome-ignore lint/a11y/noNoninteractiveTabindex: a scrollable region must be reachable by keyboard
          tabIndex={0}
        >
          {band.columns.map((column, columnIndex) => (
            <BandColumn
              key={column.id}
              column={column}
              mark={marks.get(column.id)}
              badgeId={`${idPrefix}-band-${bandIndex}-${columnIndex}`}
              labels={labels}
            />
          ))}
        </ul>
      </div>
    ))}
  </div>
);
