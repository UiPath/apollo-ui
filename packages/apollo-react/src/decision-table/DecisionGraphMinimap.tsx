import {
  Button,
  LiveRegion,
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from '@uipath/apollo-wind';
import { ListTree } from 'lucide-react';
import type React from 'react';
import { useId, useMemo, useRef, useState } from 'react';
import { MINIMAP_CONTENT_CLASS, MINIMAP_TRIGGER_CLASS } from './decisionGraphStyles';
import { isComposing } from './gridEvents';
import { listIdOf, MinimapList, type MinimapListLabels, optionIdOf } from './MinimapList';
import { MinimapSearch, type MinimapSearchLabels } from './MinimapSearch';
import { isCurrent, type MinimapItem, type MinimapRow, minimapRows } from './minimapRows';
import { useMinimapNavigation } from './useMinimapNavigation';

/** The minimap's own strings. */
export interface DecisionGraphMinimapLabels extends MinimapListLabels, MinimapSearchLabels {
  minimapResults: (count: number) => string;
}

export interface DecisionGraphMinimapProps {
  /** The rows, read only while the map is open. */
  items: () => readonly MinimapItem[];
  triggerLabel: string;
  /** The decision the reader is on, where the list opens; null when none. */
  currentDecisionId: string | null;
  /** A row was picked; the map has closed. */
  onPick: (item: MinimapItem) => void;
  labels: DecisionGraphMinimapLabels;
  dataTestId: string;
}

const landingOf = (
  rows: readonly MinimapRow[],
  query: string,
  currentDecisionId: string | null
): number | null =>
  (query.trim()
    ? (rows.find((row) => row.match) ?? rows[0])
    : (rows.find((row) => isCurrent(row.item, currentDecisionId)) ?? rows[0])
  )?.key ?? null;

/** A searchable outline of the graph's decisions and rules, a WAI-ARIA listbox driven from its search field. */
export const DecisionGraphMinimap: React.FC<DecisionGraphMinimapProps> = ({
  items,
  triggerLabel,
  currentDecisionId,
  onPick,
  labels,
  dataTestId,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const picked = useRef(false);
  const idBase = useId();
  const loaded = useMemo(() => (open ? items() : []), [open, items]);
  const rows = useMemo(() => minimapRows(loaded, query), [loaded, query]);
  const pick = (item: MinimapItem) => {
    picked.current = true;
    setOpen(false);
    onPick(item);
  };
  const navigation = useMinimapNavigation(rows, pick);
  const searching = query.trim() !== '';
  const matchCount = rows.filter((row) => row.match).length;

  const changeOpen = (next: boolean) => {
    if (next) {
      picked.current = false;
      setQuery('');
      navigation.land(landingOf(minimapRows(items(), ''), '', currentDecisionId));
    }
    setOpen(next);
  };
  const changeQuery = (next: string) => {
    setQuery(next);
    navigation.land(landingOf(minimapRows(loaded, next), next, currentDecisionId));
  };

  return (
    <Popover open={open} onOpenChange={changeOpen}>
      <PopoverAnchor asChild>
        <div>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              className={MINIMAP_TRIGGER_CLASS}
              title={labels.minimap}
              data-testid={`${dataTestId}-trigger`}
            >
              <ListTree aria-hidden />
              {triggerLabel}
            </Button>
          </PopoverTrigger>
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        sideOffset={6}
        aria-label={labels.minimap}
        className={MINIMAP_CONTENT_CLASS}
        onCloseAutoFocus={(event) => {
          if (picked.current) event.preventDefault();
        }}
        onEscapeKeyDown={(event) => {
          if (isComposing(event)) {
            event.preventDefault();
            return;
          }
          if (!query) return;
          event.preventDefault();
          changeQuery('');
        }}
        data-testid={`${dataTestId}-content`}
      >
        <MinimapSearch
          query={query}
          onQueryChange={changeQuery}
          onKeyDown={navigation.onKeyDown}
          listId={listIdOf(idBase)}
          activeOptionId={
            navigation.activeIndex >= 0 ? optionIdOf(idBase, navigation.activeIndex) : null
          }
          labels={labels}
          dataTestId={dataTestId}
        />
        <LiveRegion
          message={
            searching
              ? rows.length === 0
                ? labels.minimapNoMatch(query.trim())
                : labels.minimapResults(matchCount)
              : ''
          }
          debounce={300}
        />
        <MinimapList
          rows={rows}
          query={query}
          activeIndex={navigation.activeIndex}
          revealTick={navigation.revealTick}
          currentDecisionId={currentDecisionId}
          idBase={idBase}
          onHover={navigation.hover}
          onPick={pick}
          labels={labels}
          dataTestId={dataTestId}
        />
      </PopoverContent>
    </Popover>
  );
};
