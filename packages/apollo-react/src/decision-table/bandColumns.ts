import type { BandColumnView, SentenceBand, SentenceBandColumn } from './sentenceTypes';

/** The band captions, e.g. "Inputs" and "Outputs". */
export interface BandLabels {
  inputs: string;
  outputs: string;
}

/** The inputs' and outputs' bands, each column with its type's glyph; an empty one is left out unless `keepEmpty`. */
export const bandsOf = <Type>(
  inputs: readonly SentenceBandColumn<Type>[],
  outputs: readonly SentenceBandColumn<Type>[],
  iconOf: (type: Type) => BandColumnView['icon'],
  labels: BandLabels,
  keepEmpty: boolean
): SentenceBand[] =>
  [
    { id: 'inputs', label: labels.inputs, columns: inputs },
    { id: 'outputs', label: labels.outputs, columns: outputs },
  ]
    .filter((band) => keepEmpty || band.columns.length > 0)
    .map(({ id, label, columns }) => ({
      id,
      label,
      columns: columns.map(({ id: columnId, name, type }) => ({
        id: columnId,
        name,
        icon: iconOf(type),
      })),
    }));
