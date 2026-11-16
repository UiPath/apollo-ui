import {
  Braces,
  Brackets,
  Calendar,
  CalendarClock,
  CalendarRange,
  Clock,
  Hash,
  type LucideIcon,
  Timer,
  ToggleRight,
  Type,
} from 'lucide-react';
import type React from 'react';
import type { SentenceBand, SentenceBandColumn, SentenceValueType } from './sentenceTypes';

const VALUE_TYPE_ICONS: ReadonlyMap<string, LucideIcon> = new Map(
  Object.entries({
    text: Type,
    number: Hash,
    boolean: ToggleRight,
    date: Calendar,
    time: Clock,
    dateTime: CalendarClock,
    dayTimeDuration: Timer,
    yearMonthDuration: CalendarRange,
    list: Brackets,
    any: Braces,
  } satisfies Record<SentenceValueType, LucideIcon>)
);

/** A kind of value's glyph; none for a kind the view lacks. */
export const valueTypeIcon = (type: SentenceValueType | undefined): React.ReactNode => {
  const Icon = type === undefined ? undefined : VALUE_TYPE_ICONS.get(type);
  return Icon && <Icon />;
};

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
  columns: columns.map((column) => ({
    ...column,
    icon: column.icon ?? valueTypeIcon(column.type),
  })),
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
