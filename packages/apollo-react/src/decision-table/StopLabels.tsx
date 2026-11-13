import type React from 'react';
import type { CellStop } from './TokenChip';

export interface StopLabelsProps {
  stops: readonly CellStop[];
}

/** The hidden names of a card's cell stops, which each stop's `aria-labelledby` reads. */
export const StopLabels: React.FC<StopLabelsProps> = ({ stops }) => (
  <span hidden>
    {stops.map((stop) => (
      <span key={stop.labelId} id={stop.labelId}>
        {stop.label}
      </span>
    ))}
  </span>
);
