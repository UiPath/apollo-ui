import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@uipath/apollo-wind';
import { CornerDownRight } from 'lucide-react';
import type React from 'react';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { MINIMAP_ROW_CLASS } from './decisionGraphStyles';
import { type MinimapItem, type MinimapRow, matchRange } from './minimapRows';

export const WINDOW_MINIMAP_FROM = 200;
const DECISION_ROW_PX = 24;
const ROW_PX = 22;
const FALLBACK_LIST_PX = 440;
const INDENT_PX = 14;

export interface MinimapListLabels {
  /** The map's name, e.g. "Browse rules". */
  minimap: string;
  minimapNoMatch: (query: string) => string;
}

export interface MinimapListProps {
  rows: readonly MinimapRow[];
  query: string;
  /** The active row's index in `rows`, -1 when none. */
  activeIndex: number;
  /** Scrolls the active row into view each time it changes. */
  revealTick: number;
  currentId: string | null;
  idBase: string;
  onHover: (id: string) => void;
  onPick: (item: MinimapItem) => void;
  labels: MinimapListLabels;
  dataTestId: string;
}

/** The DOM id of the option at `index`. */
export const optionIdOf = (idBase: string, index: number): string => `${idBase}-option-${index}`;

/** The listbox's DOM id. */
export const listIdOf = (idBase: string): string => `${idBase}-list`;

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

const ariaLabelOf = (item: MinimapItem): string | undefined =>
  item.kind === 'reference'
    ? item.ariaLabel
    : item.kind === 'decision'
      ? item.count?.ariaLabel
      : undefined;

/** The minimap's listbox, windowed once it holds more than `WINDOW_MINIMAP_FROM` rows. */
export const MinimapList: React.FC<MinimapListProps> = ({
  rows,
  query,
  activeIndex,
  revealTick,
  currentId,
  idBase,
  onHover,
  onPick,
  labels,
  dataTestId,
}) => {
  const [list, setList] = useState<HTMLDivElement | null>(null);
  const revealed = useRef(0);
  const windowed = rows.length > WINDOW_MINIMAP_FROM;
  const virtualizer = useVirtualizer({
    count: windowed ? rows.length : 0,
    getScrollElement: () => list,
    estimateSize: (index) => rowHeight(rows[index]),
    getItemKey: useCallback((index: number) => rows[index]?.item.id ?? index, [rows]),
    initialRect: { width: 0, height: FALLBACK_LIST_PX },
    overscan: 10,
  });
  const searching = query.trim() !== '';

  useLayoutEffect(() => {
    if (revealed.current === revealTick || !list) return;
    revealed.current = revealTick;
    if (activeIndex < 0) return;
    if (windowed) {
      virtualizer.scrollToIndex(activeIndex, { align: 'auto' });
      return;
    }
    list
      .querySelector(`#${CSS.escape(optionIdOf(idBase, activeIndex))}`)
      ?.scrollIntoView?.({ block: 'nearest' });
  });

  const renderRow = (row: MinimapRow, index: number, top: number | null) => {
    const { item, depth } = row;
    const selected = index === activeIndex;
    return (
      <div
        key={item.id}
        id={optionIdOf(idBase, index)}
        role="option"
        tabIndex={-1}
        aria-selected={selected}
        aria-label={ariaLabelOf(item)}
        aria-setsize={windowed ? rows.length : undefined}
        aria-posinset={windowed ? index + 1 : undefined}
        title={item.label}
        className={cn(
          MINIMAP_ROW_CLASS,
          item.kind === 'decision' ? 'h-6 font-semibold text-foreground' : 'h-[22px]',
          item.kind === 'reference' && 'italic',
          searching && !row.match && 'text-foreground-muted'
        )}
        style={{
          ...(top === null ? {} : { position: 'absolute', insetInline: 0, top }),
          paddingInlineStart: 6 + depth * INDENT_PX,
        }}
        data-selected={selected || undefined}
        data-current={item.id === currentId || undefined}
        data-testid={`${dataTestId}-row-${item.id}`}
        onMouseDown={(event) => event.preventDefault()}
        onPointerMove={() => !selected && onHover(item.id)}
        onClick={() => onPick(item)}
      >
        {item.kind === 'reference' && <CornerDownRight aria-hidden className="size-3 shrink-0" />}
        <span className="min-w-0 flex-1 truncate">
          <Highlighted text={item.label} query={query} />
        </span>
        {item.kind === 'decision' && item.count && (
          <span aria-hidden className="shrink-0 text-[11px] font-normal tabular-nums">
            {item.count.meta}
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
          return row && virtual ? [renderRow(row, virtual.index, virtual.start)] : [];
        })}
      </div>
    );
  };

  return (
    <div
      ref={setList}
      id={listIdOf(idBase)}
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
        rows.map((row, index) => renderRow(row, index, null))
      )}
    </div>
  );
};
