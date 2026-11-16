import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Button,
  cn,
  LiveRegion,
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
  Search,
} from '@uipath/apollo-wind';
import { CornerDownRight, ListTree } from 'lucide-react';
import type React from 'react';
import { useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  MINIMAP_CONTENT_CLASS,
  MINIMAP_FLOATING_CLASS,
  MINIMAP_ROW_CLASS,
  MINIMAP_TRIGGER_CLASS,
} from './decisionGraphStyles';
import { type MinimapItem, type MinimapRow, matchRange, minimapRows } from './minimapRows';

export const WINDOW_MINIMAP_FROM = 200;
const DECISION_ROW_PX = 24;
const ROW_PX = 22;
const FALLBACK_LIST_PX = 440;
const INDENT_PX = 14;

/** The minimap's own strings. */
export interface DecisionGraphMinimapLabels {
  /** The map's name, e.g. "Browse rules". */
  minimap: string;
  minimapSearch: string;
  minimapClearSearch: string;
  minimapNoMatch: (query: string) => string;
  minimapResults: (count: number) => string;
}

export interface DecisionGraphMinimapProps {
  /** The rows, read only while the map is open. */
  items: () => readonly MinimapItem[];
  triggerLabel: string;
  /** The row the reader is on, where the list opens. */
  currentId?: string | null;
  /** A row was picked; the map has closed. */
  onPick: (item: MinimapItem) => void;
  labels: DecisionGraphMinimapLabels;
  dataTestId: string;
}

const rowHeight = (row: MinimapRow | undefined): number =>
  row?.item.kind === 'decision' ? DECISION_ROW_PX : ROW_PX;

const Highlighted = ({ text, query }: { text: string; query: string }) => {
  const range = matchRange(text, query);
  if (!range) return <>{text}</>;
  return (
    <>
      {text.slice(0, range.start)}
      <mark className="rounded-sm bg-[var(--color-warning-background)] px-px text-inherit">
        {text.slice(range.start, range.end)}
      </mark>
      {text.slice(range.end)}
    </>
  );
};

const landingOf = (
  rows: readonly MinimapRow[],
  query: string,
  currentId: string | null | undefined
): string | null =>
  (query.trim()
    ? (rows.find((row) => row.match) ?? rows[0])
    : (rows.find((row) => row.item.id === currentId) ?? rows[0])
  )?.item.id ?? null;

/** A floating, searchable outline of the graph's decisions and rules, a WAI-ARIA listbox driven from its search field. */
export const DecisionGraphMinimap: React.FC<DecisionGraphMinimapProps> = ({
  items,
  triggerLabel,
  currentId,
  onPick,
  labels,
  dataTestId,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<string | null>(null);
  const picked = useRef(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const idBase = useId();
  const loaded = useMemo(() => (open ? items() : []), [open, items]);
  const rows = useMemo(() => minimapRows(loaded, query), [loaded, query]);
  const indexById = useMemo(() => new Map(rows.map((row, index) => [row.item.id, index])), [rows]);
  const activeIndex = active === null ? -1 : (indexById.get(active) ?? -1);
  const windowed = rows.length > WINDOW_MINIMAP_FROM;
  const virtualizer = useVirtualizer({
    count: windowed ? rows.length : 0,
    getScrollElement: () => listRef.current,
    estimateSize: (index) => rowHeight(rows[index]),
    initialRect: { width: 0, height: FALLBACK_LIST_PX },
    overscan: 10,
  });
  const optionId = (index: number) => `${idBase}-option-${index}`;
  const searching = query.trim() !== '';
  const matchCount = rows.filter((row) => row.match).length;

  useLayoutEffect(() => {
    if (!open || activeIndex < 0) return;
    if (windowed) {
      virtualizer.scrollToIndex(activeIndex, { align: 'auto' });
      return;
    }
    listRef.current
      ?.querySelector(`#${CSS.escape(optionId(activeIndex))}`)
      ?.scrollIntoView?.({ block: 'nearest' });
  });

  const changeOpen = (next: boolean) => {
    if (next) {
      picked.current = false;
      setQuery('');
      setActive(landingOf(minimapRows(items(), ''), '', currentId));
    }
    setOpen(next);
  };
  const changeQuery = (next: string) => {
    setQuery(next);
    setActive(landingOf(minimapRows(loaded, next), next, currentId));
  };
  const pick = (item: MinimapItem) => {
    picked.current = true;
    setOpen(false);
    onPick(item);
  };
  const onSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const moveTo = (index: number) => {
      event.preventDefault();
      const row = rows[Math.max(0, Math.min(index, rows.length - 1))];
      if (row) setActive(row.item.id);
    };
    const jump = event.ctrlKey || event.metaKey;
    if (event.key === 'ArrowDown') moveTo(activeIndex + 1);
    else if (event.key === 'ArrowUp') moveTo(Math.max(0, activeIndex - 1));
    else if (event.key === 'Home' && jump) moveTo(0);
    else if (event.key === 'End' && jump) moveTo(rows.length - 1);
    else if (event.key === 'Enter') {
      const row = rows[activeIndex];
      if (!row) return;
      event.preventDefault();
      pick(row.item);
    }
  };

  const renderRow = (row: MinimapRow, index: number, style?: React.CSSProperties) => {
    const { item, depth } = row;
    const selected = index === activeIndex;
    return (
      <div
        key={item.id}
        id={optionId(index)}
        role="option"
        tabIndex={-1}
        aria-selected={selected}
        aria-label={item.ariaLabel}
        aria-setsize={windowed ? rows.length : undefined}
        aria-posinset={windowed ? index + 1 : undefined}
        title={item.label}
        className={cn(
          MINIMAP_ROW_CLASS,
          item.kind === 'decision' ? 'h-6 font-semibold text-foreground' : 'h-[22px]',
          item.kind === 'reference' && 'italic',
          searching && !row.match && 'text-foreground-muted'
        )}
        style={{ ...style, paddingInlineStart: 6 + depth * INDENT_PX }}
        data-selected={selected || undefined}
        data-current={item.id === currentId || undefined}
        data-testid={`${dataTestId}-row-${item.id}`}
        onMouseDown={(event) => event.preventDefault()}
        onPointerMove={() => !selected && setActive(item.id)}
        onClick={() => pick(item)}
      >
        {item.kind === 'reference' && <CornerDownRight aria-hidden className="size-3 shrink-0" />}
        <span className="min-w-0 flex-1 truncate">
          <Highlighted text={item.label} query={query} />
        </span>
        {item.meta && (
          <span aria-hidden className="shrink-0 text-[11px] font-normal tabular-nums">
            {item.meta}
          </span>
        )}
      </div>
    );
  };

  const renderWindow = () => {
    const shown = virtualizer.getVirtualItems();
    const extra =
      activeIndex >= 0 && !shown.some((virtual) => virtual.index === activeIndex)
        ? [virtualizer.measurementsCache[activeIndex]]
        : [];
    return (
      <div className="relative min-w-0" style={{ height: virtualizer.getTotalSize() }}>
        {[...shown, ...extra].flatMap((virtual) => {
          const row = virtual && rows[virtual.index];
          return row && virtual
            ? [
                renderRow(row, virtual.index, {
                  position: 'absolute',
                  insetInline: 0,
                  top: virtual.start,
                }),
              ]
            : [];
        })}
      </div>
    );
  };

  return (
    <Popover open={open} onOpenChange={changeOpen}>
      <PopoverAnchor asChild>
        <div className={MINIMAP_FLOATING_CLASS}>
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
          if (!query) return;
          event.preventDefault();
          changeQuery('');
        }}
        data-testid={`${dataTestId}-content`}
      >
        <div className="shrink-0 border-b border-border-subtle p-2">
          <Search
            value={query}
            onValueChange={changeQuery}
            onKeyDown={onSearchKeyDown}
            placeholder={labels.minimapSearch}
            aria-label={labels.minimapSearch}
            strings={{ clear: labels.minimapClearSearch }}
            role="combobox"
            aria-expanded
            aria-autocomplete="list"
            aria-controls={`${idBase}-list`}
            aria-activedescendant={activeIndex >= 0 ? optionId(activeIndex) : undefined}
            autoComplete="off"
            data-testid={`${dataTestId}-search`}
          />
        </div>
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
        <div
          ref={listRef}
          id={`${idBase}-list`}
          role="listbox"
          aria-label={labels.minimap}
          className="min-h-0 flex-1 overflow-y-auto p-1.5"
          data-testid={`${dataTestId}-list`}
        >
          {rows.length === 0 ? (
            <p
              role="presentation"
              className="m-0 px-2 py-3 text-xs text-foreground-de-emp"
              data-testid={`${dataTestId}-no-match`}
            >
              {labels.minimapNoMatch(query.trim())}
            </p>
          ) : windowed ? (
            renderWindow()
          ) : (
            rows.map((row, index) => renderRow(row, index))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
