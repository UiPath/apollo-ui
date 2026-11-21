import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Search,
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipTrigger,
} from '@uipath/apollo-wind';
import { Plus } from 'lucide-react';
import type React from 'react';
import { useCallback, useRef, useState } from 'react';
import { BandColumn, type BandColumnProps } from './BandColumn';
import type { LineTextLabels } from './LineText';
import { MarkTooltip } from './MarkTooltip';
import type { TableMarks } from './marks';
import {
  BAND_ADD_BUTTON_CLASS,
  BAND_COLUMNS_CLASS,
  BAND_MORE_DOT_CLASS,
  BAND_MORE_LINK_CLASS,
  BAND_MORE_LIST_CLASS,
} from './sentenceStyles';
import type { BandColumnView, SentenceBand, SentenceNameToken } from './sentenceTypes';

/** How many of a band's columns show before the rest fold into "+N more". */
export const BAND_VISIBLE_COLUMNS = 3;

export interface BandOverflowLabels extends Pick<LineTextLabels, 'moreValues'> {
  searchInputs: (count: number) => string;
  searchOutputs: (count: number) => string;
  clearBandSearch: string;
  moreWithErrors: (count: number) => string;
  noMatchingInputs: string;
  noMatchingOutputs: string;
}

export interface BandAddLabels {
  bandAddInput: string;
  bandAddOutput: string;
}

export interface BandListProps {
  band: SentenceBand;
  marks: TableMarks['columns'];
  /** Prefix of its columns' badge ids, each followed by the column's index. */
  badgeIdPrefix: string;
  labels: BandColumnProps['labels'] & BandOverflowLabels & BandAddLabels;
  mode: BandMode;
  /** Adds a column to the band; no button when null. */
  onAddColumn: ((kind: SentenceNameToken['kind']) => void) | null;
}

/** Plain pills; a diff's, with each column's change by id; or buttons that open the column whose popover is open, or null, under `editorId`. */
export type BandMode =
  | { kind: 'read' }
  | { kind: 'diff'; changes: ReadonlyMap<string, NonNullable<BandColumnProps['change']>> }
  | {
      kind: 'edit';
      onToggle: Extract<BandColumnProps['pill'], { kind: 'button' }>['onToggle'];
      openColumnId: string | null;
      editorId: string;
    };

/** A band's first columns, then a "+N more" link opening a searchable list of all of them; a diff shows every column. */
export const BandList: React.FC<BandListProps> = ({
  band,
  marks,
  badgeIdPrefix,
  labels,
  mode,
  onAddColumn,
}) => {
  const [query, setQuery] = useState('');
  const moreRef = useRef<HTMLDivElement>(null);
  const moreContainer = useCallback(() => moreRef.current, []);
  const visible = mode.kind === 'diff' ? band.columns.length : BAND_VISIBLE_COLUMNS;
  const openId = mode.kind === 'edit' ? mode.openColumnId : null;
  const shown = band.columns.filter((column, index) => index < visible || column.id === openId);
  const hidden = band.columns.filter((column) => !shown.includes(column));
  const hiddenError = hidden.some((column) => marks.get(column.id)?.tone === 'error');
  const needle = query.trim().toLocaleLowerCase();
  const found = band.columns.flatMap((column, index) =>
    column.name.toLocaleLowerCase().includes(needle) ? [{ column, index }] : []
  );
  const isOutputs = band.id === 'outputs';
  const search = isOutputs ? labels.searchOutputs : labels.searchInputs;
  const addLabel = isOutputs ? labels.bandAddOutput : labels.bandAddInput;
  const chip = (column: BandColumnView, badgeId: string) => (
    <BandColumn
      key={column.id}
      column={column}
      mark={marks.get(column.id)}
      badgeId={badgeId}
      change={mode.kind === 'diff' ? mode.changes.get(column.id) : undefined}
      labels={labels}
      pill={
        mode.kind === 'edit'
          ? {
              kind: 'button',
              onToggle: mode.onToggle,
              openEditorId: column.id === mode.openColumnId ? mode.editorId : null,
            }
          : { kind: 'plain' }
      }
    />
  );
  return (
    <ul className={BAND_COLUMNS_CLASS} aria-label={band.label}>
      {shown.map((column, columnIndex) => chip(column, `${badgeIdPrefix}-${columnIndex}`))}
      {hidden.length > 0 && (
        <li className="flex">
          <Popover
            onOpenChange={(open) => {
              if (!open) setQuery('');
            }}
          >
            <PopoverTrigger asChild>
              <button
                type="button"
                className={BAND_MORE_LINK_CLASS}
                data-band-more
                data-error={hiddenError}
                aria-label={hiddenError ? labels.moreWithErrors(hidden.length) : undefined}
              >
                {hiddenError && <span aria-hidden className={BAND_MORE_DOT_CLASS} />}
                {labels.moreValues(hidden.length)}
              </button>
            </PopoverTrigger>
            <PopoverContent
              ref={moreRef}
              align="start"
              className="flex max-h-[var(--radix-popover-content-available-height)] w-72 flex-col p-0"
              aria-label={band.label}
            >
              <div className="border-b border-border-subtle p-2">
                <Search
                  value={query}
                  onValueChange={setQuery}
                  placeholder={search(band.columns.length)}
                  aria-label={search(band.columns.length)}
                  strings={{ clear: labels.clearBandSearch }}
                />
              </div>
              {found.length > 0 ? (
                <ul className={BAND_MORE_LIST_CLASS} aria-label={band.label}>
                  {found.map(({ column, index }) => chip(column, `${badgeIdPrefix}-more-${index}`))}
                </ul>
              ) : (
                <output className="block p-3 text-xs text-foreground-de-emp">
                  {isOutputs ? labels.noMatchingOutputs : labels.noMatchingInputs}
                </output>
              )}
              <MarkTooltip container={moreContainer} dataTestId={`${badgeIdPrefix}-more`} />
            </PopoverContent>
          </Popover>
        </li>
      )}
      {onAddColumn && (
        <li className="flex">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className={BAND_ADD_BUTTON_CLASS}
                  aria-label={addLabel}
                  onClick={() => onAddColumn(isOutputs ? 'output' : 'input')}
                >
                  <Plus aria-hidden className="size-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipPortal>
                <TooltipContent>{addLabel}</TooltipContent>
              </TooltipPortal>
            </Tooltip>
          </TooltipProvider>
        </li>
      )}
    </ul>
  );
};
