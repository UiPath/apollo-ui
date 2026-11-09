import { Button, EmptyState } from '@uipath/apollo-wind';
import { Plus } from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useId, useMemo, useRef } from 'react';
import { FALLBACK_ROW_VIEWPORT_PX } from './constants';
import { MarkBadge, markIds } from './MarkBadge';
import { EMPTY_MARKS, type Mark, type TableMarks } from './marks';
import { RuleCard } from './RuleCard';
import { isLineMark, type MarkFields } from './sentenceMarks';
import {
  SENTENCE_LINE_HEIGHT_PX,
  SENTENCE_LINES_GAP_PX,
  SENTENCE_MIN_RULE_HEIGHT_PX,
  SENTENCE_RULE_BORDER_PX,
  SENTENCE_RULE_GAP_PX,
  SENTENCE_RULE_PADDING_PX,
  sentenceRuleOffsets,
} from './sentenceRuleHeights';
import {
  BAND_CAPTION_CLASS,
  BAND_COLUMN_CLASS,
  BAND_COLUMNS_CLASS,
  DECISION_TEXT_BANDS_CLASS,
  DECISION_TEXT_FRAME_CLASS,
  DECISION_TEXT_HEADER_CLASS,
  DECISION_TEXT_LIST_CLASS,
  EMPTY_STATE_CLASS,
  EMPTY_STATE_FRAME_CLASS,
  HEADER_LABEL_CLASS,
} from './sentenceStyles';
import type {
  DecisionTextLabels,
  SentenceBand,
  SentenceCellId,
  SentenceHeader,
  SentenceRule,
} from './sentenceTypes';
import { useVirtualizedAxis } from './useVirtualizedAxis';

const SENTENCE_RULE_OVERSCAN = 10;

type SentenceListStyle = React.CSSProperties & Record<`--sentence-${string}`, string | number>;

const LIST_GEOMETRY: SentenceListStyle = {
  '--sentence-line': `${SENTENCE_LINE_HEIGHT_PX}px`,
  '--sentence-row-border': `${SENTENCE_RULE_BORDER_PX}px`,
  '--sentence-row-padding': `${SENTENCE_RULE_PADDING_PX}px`,
  '--sentence-lines-gap': `${SENTENCE_LINES_GAP_PX}px`,
  '--sentence-row-gap': `${SENTENCE_RULE_GAP_PX}px`,
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

/** The `Mark` fields a band column paints; a field added to `Mark` fails to compile here until the column decides on it. */
const columnMark = (mark: Mark | undefined) =>
  ({
    tone: mark?.tone,
    title: mark?.title,
    glyph: mark?.glyph,
    matched: undefined,
  }) satisfies MarkFields<Mark>;

/** The `TableMarks` maps the view reads; a map added to `TableMarks` fails to compile here until the view decides on it. */
const tableMarks = ({ rows, columns }: TableMarks) =>
  ({ rows, columns }) satisfies MarkFields<TableMarks>;

export interface DecisionTextAddRule {
  label: string;
  onAdd: () => void;
}

export interface DecisionTextProps {
  rules: readonly SentenceRule[];
  bands: readonly SentenceBand[];
  header: SentenceHeader;
  /** Shows each rule's 1-based position before its heading. */
  numbered?: boolean;
  /** The grid's own marks object: rows by row id, cells and columns by column id. */
  marks?: TableMarks;
  /** The empty state's add action and its label. */
  addRule?: DecisionTextAddRule;
  /** The cell whose value chip is under the pointer, or null once it is left or gone. */
  onCellHover?: (cell: SentenceCellId | null) => void;
  /** The view's own strings; mounted rules re-render when it changes, so memoize it. */
  labels: DecisionTextLabels;
  /** Accessible name of the scroll region. */
  ariaLabel: string;
  /** Merged onto the scroll container; a `data-testid` here overrides `dataTestId`. */
  containerProps?: React.HTMLAttributes<HTMLElement> & Record<`data-${string}`, string | undefined>;
  /** Container testid; derived ids: `-header`, `-bands`, `-empty`, `-row-{rowId}`, `-row-spacer`. */
  dataTestId: string;
}

/** A decision table read as sentences: one rule card per rule, windowed, painted by the grid's marks. */
export const DecisionText: React.FC<DecisionTextProps> = ({
  rules,
  bands,
  header,
  numbered = false,
  marks = EMPTY_MARKS,
  addRule,
  onCellHover,
  labels,
  ariaLabel,
  containerProps,
  dataTestId,
}) => {
  const idPrefix = useId();
  const { rows: rowMarks, columns: bandMarks } = tableMarks(marks);
  const listRef = useRef<HTMLUListElement | null>(null);

  const onCellHoverRef = useRef(onCellHover);
  onCellHoverRef.current = onCellHover;
  const hoveredRef = useRef<HoveredToken | null>(null);
  const hoverTo = useCallback((next: HoveredToken | null) => {
    const current = hoveredRef.current;
    hoveredRef.current = next;
    if (
      current?.cell.rowId !== next?.cell.rowId ||
      current?.cell.columnId !== next?.cell.columnId
    ) {
      onCellHoverRef.current?.(next?.cell ?? null);
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
  const offsetsPx = useMemo(() => sentenceRuleOffsets(rules), [rules]);
  const { segments, measureRef } = useVirtualizedAxis(
    rules.length,
    SENTENCE_MIN_RULE_HEIGHT_PX,
    null,
    {
      axis: 'vertical',
      overscanItems: SENTENCE_RULE_OVERSCAN,
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
    ? { ...LIST_GEOMETRY, '--sentence-number-digits': String(rules.length).length }
    : LIST_GEOMETRY;
  let nextRuleIndex = 0;

  return (
    <section
      ref={measureRef}
      aria-label={ariaLabel}
      // biome-ignore lint/a11y/noNoninteractiveTabindex: a scrollable region must be reachable by keyboard
      tabIndex={0}
      className={DECISION_TEXT_FRAME_CLASS}
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
      <div className={DECISION_TEXT_HEADER_CLASS} data-testid={`${dataTestId}-header`}>
        <span className={HEADER_LABEL_CLASS}>{header.label}</span>
        <span>{header.hint}</span>
      </div>
      {bands.length > 0 && (
        <div
          className={DECISION_TEXT_BANDS_CLASS}
          style={listStyle}
          data-testid={`${dataTestId}-bands`}
        >
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
                  const mark = bandMarks.get(column.id);
                  const { tone, title } = columnMark(mark);
                  const columnMarks = isLineMark(mark) ? [mark] : [];
                  const badgeId = `${idPrefix}-band-${bandIndex}-${columnIndex}`;
                  return (
                    <li
                      key={column.id}
                      className={BAND_COLUMN_CLASS}
                      aria-describedby={
                        columnMarks.length > 0 ? markIds(badgeId, columnMarks).join(' ') : undefined
                      }
                      data-column-id={column.id}
                      data-tone={tone}
                      data-mark-title={title}
                    >
                      {column.name}
                      {columnMarks.length > 0 && (
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
      {rules.length === 0 ? (
        <div className={EMPTY_STATE_FRAME_CLASS}>
          <EmptyState
            size="compact"
            title={labels.emptyRules}
            className={EMPTY_STATE_CLASS}
            data-testid={`${dataTestId}-empty`}
          >
            {addRule && (
              <Button variant="outline" size="sm" onClick={addRule.onAdd}>
                <Plus aria-hidden />
                {addRule.label}
              </Button>
            )}
          </EmptyState>
        </div>
      ) : (
        <ul ref={listRef} className={DECISION_TEXT_LIST_CLASS} style={listStyle}>
          {segments.flatMap((segment) => {
            if (segment.type === 'spacer') {
              return (
                <li
                  key={`spacer-${nextRuleIndex}`}
                  aria-hidden
                  data-testid={`${dataTestId}-row-spacer`}
                  style={{ height: segment.sizePx }}
                />
              );
            }
            nextRuleIndex = segment.to;
            return rules
              .slice(segment.from, segment.to)
              .map((rule, offset) => (
                <RuleCard
                  key={rule.rowId}
                  rule={rule}
                  position={segment.from + offset + 1}
                  setSize={rules.length}
                  numbered={numbered}
                  mark={rowMarks.get(rule.rowId)}
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
