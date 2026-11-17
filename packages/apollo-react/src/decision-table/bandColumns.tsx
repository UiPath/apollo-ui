import type { SentenceBand, SentenceBandColumn } from './sentenceTypes';

/** The band captions, e.g. "Inputs" and "Outputs". */
export interface BandLabels {
  inputs: string;
  outputs: string;
}

const bandOf = (
  id: string,
  label: string,
  columns: readonly SentenceBandColumn[]
): SentenceBand => ({
  id,
  label,
  columns,
});

/** The inputs' and outputs' bands, each column with its glyph; an empty one is left out. */
export const bandsOf = (
  inputs: readonly SentenceBandColumn[],
  outputs: readonly SentenceBandColumn[],
  labels: BandLabels
): SentenceBand[] =>
  [bandOf('inputs', labels.inputs, inputs), bandOf('outputs', labels.outputs, outputs)].filter(
    (band) => band.columns.length > 0
  );
