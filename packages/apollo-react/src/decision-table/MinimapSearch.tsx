import { Search } from '@uipath/apollo-wind';
import type React from 'react';

export interface MinimapSearchLabels {
  minimapSearch: string;
  minimapClearSearch: string;
}

export interface MinimapSearchProps {
  query: string;
  onQueryChange: (query: string) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  listId: string;
  /** The active option's DOM id, null when no row is active. */
  activeOptionId: string | null;
  labels: MinimapSearchLabels;
  dataTestId: string;
}

/** The minimap's search field, a combobox driving its listbox. */
export const MinimapSearch: React.FC<MinimapSearchProps> = ({
  query,
  onQueryChange,
  onKeyDown,
  listId,
  activeOptionId,
  labels,
  dataTestId,
}) => (
  <div className="shrink-0 border-b border-border-subtle p-2">
    <Search
      value={query}
      onValueChange={onQueryChange}
      onKeyDown={onKeyDown}
      placeholder={labels.minimapSearch}
      aria-label={labels.minimapSearch}
      strings={{ clear: labels.minimapClearSearch }}
      role="combobox"
      aria-expanded
      aria-autocomplete="list"
      aria-controls={listId}
      aria-activedescendant={activeOptionId ?? undefined}
      autoComplete="off"
      data-testid={`${dataTestId}-search`}
    />
  </div>
);
