import { Button } from '@uipath/apollo-wind';
import type React from 'react';
import { useCallback, useEffect, useId, useMemo, useRef } from 'react';
import { FALLBACK_ROW_VIEWPORT_PX } from './constants';
import { EMPTY_MARKS, type TableMarks } from './marks';
import { MarkBadge, markIds, SentenceRowCard } from './SentenceRowCard';
import { isLineMark, type LineMarks } from './sentenceMarks';
import {
  SENTENCE_LINE_HEIGHT_PX,
  SENTENCE_MIN_ROW_HEIGHT_PX,
  SENTENCE_ROW_GAP_PX,
  SENTENCE_ROW_PADDING_PX,
  sentenceRowOffsets,
} from './sentenceRowHeights';
import {
  BAND_CAPTION_CLASS,
  BAND_COLUMN_CLASS,
  BAND_COLUMNS_CLASS,
  EMPTY_STATE_CLASS,
  HEADER_LABEL_CLASS,
  SENTENCES_BANDS_CLASS,
  SENTENCES_FRAME_CLASS,
  SENTENCES_HEADER_CLASS,
  SENTENCES_LIST_CLASS,
} from './sentenceStyles';
import type {
  SentenceBand,
  SentenceCellId,
  SentenceHeader,
  SentenceLabels,
  SentenceRow,
} from './sentenceTypes';
import { useVirtualizedAxis } from './useVirtualizedAxis';

const SENTENCE_ROW_OVERSCAN = 10;

type SentenceListStyle = React.CSSProperties & Record<`--sentence-${string}`, string | number>;

const LIST_GEOMETRY: SentenceListStyle = {
  '--sentence-line': `${SENTENCE_LINE_HEIGHT_PX}px`,
  '--sentence-row-padding': `${SENTENCE_ROW_PADDING_PX}px`,
  '--sentence-row-gap': `${SENTENCE_ROW_GAP_PX}px`,
};

interface HoveredToken {
  chip: Element;
  cell: SentenceCellId;
}

/** The value token at `target`, as the cell it stands for. */
const valueTokenAt = (target: EventTarget | null): HoveredToken | null => {
  const chip =
    target instanceof Element ? target.closest<HTMLElement>('[data-kind="value"]') : null;
  const rowId = chip?.closest<HTMLElement>('[data-row-id]')?.dataset.rowId;
  const columnId = chip?.dataset.columnId;
  return chip && rowId && columnId ? { chip, cell: { rowId, columnId } } : null;
};

export interface DecisionTableSentencesProps {
  rows: readonly SentenceRow[];
  bands: readonly SentenceBand[];
  header: SentenceHeader;
  /** Shows each row's 1-based position before its heading. */
  numbered?: boolean;
  /** The grid's own marks object: rows by row id, cells and columns by column id. */
  marks?: TableMarks;
  /** The empty state's add action and its label. */
  addRow?: { label: string; onAdd: () => void };
  /** The value chip under the pointer, by the cell it stands for, or null once it is left or gone. */
  onTokenHover?: (cell: SentenceCellId | null) => void;
  /** The view's own strings; mounted rows re-render when it changes, so memoize it. */
  labels: SentenceLabels;
  /** Accessible name of the scroll region. */
  ariaLabel: string;
  /** Merged onto the scroll container; a `data-testid` here overrides `dataTestId`. */
  containerProps?: React.HTMLAttributes<HTMLElement> & Record<`data-${string}`, string | undefined>;
  /** Container testid; derived ids: `-header`, `-bands`, `-empty`, `-row-{rowId}`, `-row-spacer`. */
  dataTestId: string;
}

/** A decision table read as sentences: one card per row, windowed, painted by the grid's marks. */
export const DecisionTableSentences: React.FC<DecisionTableSentencesProps> = ({
  rows,
  bands,
  header,
  numbered = false,
  marks = EMPTY_MARKS,
  addRow,
  onTokenHover,
  labels,
  ariaLabel,
  containerProps,
  dataTestId,
}) => {
  const idPrefix = useId();
  const listRef = useRef<HTMLUListElement | null>(null);

  const onTokenHoverRef = useRef(onTokenHover);
  onTokenHoverRef.current = onTokenHover;
  const hoveredRef = useRef<HoveredToken | null>(null);
  const hoverTo = useCallback((next: HoveredToken | null) => {
    const current = hoveredRef.current;
    hoveredRef.current = next;
    if (
      current?.cell.rowId !== next?.cell.rowId ||
      current?.cell.columnId !== next?.cell.columnId
    ) {
      onTokenHoverRef.current?.(next?.cell ?? null);
    }
  }, []);
  useEffect(() => {
    const chip = hoveredRef.current?.chip;
    if (chip) {
      hoverTo(chip.isConnected ? valueTokenAt(chip) : null);
    }
  });
  useEffect(() => () => hoverTo(null), [hoverTo]);

  const listStart = useCallback(() => listRef.current?.offsetTop ?? 0, []);
  const offsetsPx = useMemo(() => sentenceRowOffsets(rows), [rows]);
  const { segments, measureRef } = useVirtualizedAxis(
    rows.length,
    SENTENCE_MIN_ROW_HEIGHT_PX,
    null,
    {
      axis: 'vertical',
      overscanItems: SENTENCE_ROW_OVERSCAN,
      fallbackViewportPx: FALLBACK_ROW_VIEWPORT_PX,
      leadingFixedPx: listStart,
      itemOffsetsPx: offsetsPx,
    }
  );

  const {
    onPointerOver: consumerPointerOver,
    onPointerOut: consumerPointerOut,
    ...restContainerProps
  } = containerProps ?? {};
  const listStyle: SentenceListStyle = numbered
    ? { ...LIST_GEOMETRY, '--sentence-number-digits': String(rows.length).length }
    : LIST_GEOMETRY;
  let nextRowIndex = 0;

  return (
    <section
      ref={measureRef}
      aria-label={ariaLabel}
      // biome-ignore lint/a11y/noNoninteractiveTabindex: a scrollable region must be reachable by keyboard
      tabIndex={0}
      className={SENTENCES_FRAME_CLASS}
      data-testid={dataTestId}
      onPointerOver={(event) => {
        hoverTo(valueTokenAt(event.target));
        consumerPointerOver?.(event);
      }}
      onPointerOut={(event) => {
        const to = event.relatedTarget instanceof Node ? event.relatedTarget : null;
        if (!event.currentTarget.contains(to)) {
          hoverTo(null);
        }
        consumerPointerOut?.(event);
      }}
      {...restContainerProps}
    >
      <div className={SENTENCES_HEADER_CLASS} data-testid={`${dataTestId}-header`}>
        <span className={HEADER_LABEL_CLASS}>{header.label}</span>
        <span>{header.hint}</span>
      </div>
      {bands.length > 0 && (
        <div className={SENTENCES_BANDS_CLASS} data-testid={`${dataTestId}-bands`}>
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
                {band.columns.map((column, columnIndex) => {
                  const mark = marks.columns.get(column.id);
                  const columnMarks: LineMarks | null = isLineMark(mark) ? [mark] : null;
                  const badgeId = `${idPrefix}-band-${bandIndex}-${columnIndex}`;
                  return (
                    <li
                      key={column.id}
                      className={BAND_COLUMN_CLASS}
                      aria-describedby={
                        columnMarks ? markIds(badgeId, columnMarks).join(' ') : undefined
                      }
                      data-column-id={column.id}
                      data-tone={mark?.tone}
                      data-mark-title={mark?.title}
                    >
                      {column.name}
                      {columnMarks && (
                        <MarkBadge id={badgeId} marks={columnMarks} labels={labels} />
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
      {rows.length === 0 ? (
        <div className={EMPTY_STATE_CLASS} data-testid={`${dataTestId}-empty`}>
          <p>{labels.emptyRows}</p>
          {addRow && (
            <Button variant="outline" size="xs" onClick={addRow.onAdd}>
              {addRow.label}
            </Button>
          )}
        </div>
      ) : (
        <ul ref={listRef} className={SENTENCES_LIST_CLASS} style={listStyle}>
          {segments.flatMap((segment) => {
            if (segment.type === 'spacer') {
              return (
                <li
                  key={`spacer-${nextRowIndex}`}
                  aria-hidden
                  data-testid={`${dataTestId}-row-spacer`}
                  style={{ height: segment.sizePx }}
                />
              );
            }
            nextRowIndex = segment.to;
            return rows
              .slice(segment.from, segment.to)
              .map((row, offset) => (
                <SentenceRowCard
                  key={row.rowId}
                  row={row}
                  position={segment.from + offset + 1}
                  setSize={rows.length}
                  numbered={numbered}
                  mark={marks.rows.get(row.rowId)}
                  idPrefix={idPrefix}
                  dataTestId={dataTestId}
                  labels={labels}
                />
              ));
          })}
        </ul>
      )}
    </section>
  );
};
