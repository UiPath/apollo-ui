import type React from 'react';
import { BandList, type BandListProps } from './BandList';
import type { SentenceListStyle } from './sentenceRuleHeights';
import { BAND_CAPTION_CLASS, DECISION_TEXT_BANDS_CLASS } from './sentenceStyles';
import type { SentenceBand } from './sentenceTypes';

export interface SentenceBandsProps extends Pick<BandListProps, 'marks' | 'labels'> {
  bands: readonly SentenceBand[];
  style: SentenceListStyle;
  idPrefix: string;
  dataTestId: string;
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
        <BandList
          band={band}
          marks={marks}
          badgeIdPrefix={`${idPrefix}-band-${bandIndex}`}
          labels={labels}
        />
      </div>
    ))}
  </div>
);
