import type { GridCellWrite, GridClipboardProps, GridSelectionRange } from './gridTypes';

/** Copy / paste / clear planning in grid coordinates; the consumer maps the writes to its own model. */

/** The range as an inclusive rectangle, whatever direction it was dragged in. */
const rectOf = (
  range: GridSelectionRange
): { top: number; bottom: number; left: number; right: number } => ({
  top: Math.min(range.anchor.row, range.focus.row),
  bottom: Math.max(range.anchor.row, range.focus.row),
  left: Math.min(range.anchor.col, range.focus.col),
  right: Math.max(range.anchor.col, range.focus.col),
});

/** What the grid reads and writes, taken from the clipboard props plus the grid's own extent. */
type CellSource = Pick<
  GridClipboardProps,
  'textAt' | 'canWriteAt' | 'blankTextAt' | 'maxAppendRows'
> & {
  rowCount: number;
  columnCount: number;
};

interface GridPastePlan {
  writes: GridCellWrite[];
  appendRows: number;
  clampedRows: number;
  clampedColumns: number;
  skippedCells: number;
}

/** The selected block as a matrix, reading every column whether writable or not. */
export const copyRangeMatrix = (source: CellSource, range: GridSelectionRange): string[][] => {
  const rect = rectOf(range);
  const matrix: string[][] = [];
  for (let row = rect.top; row <= rect.bottom; row++) {
    const cells: string[] = [];
    for (let col = rect.left; col <= rect.right; col++) {
      cells.push(source.textAt(row, col));
    }
    matrix.push(cells);
  }
  return matrix;
};

/** A single copied cell pasted over a wider selection fills it. */
const expandSingleCell = (matrix: string[][], rect: ReturnType<typeof rectOf>): string[][] => {
  if (matrix.length !== 1 || matrix[0]!.length !== 1) {
    return matrix;
  }
  const rows = rect.bottom - rect.top + 1;
  const cols = rect.right - rect.left + 1;
  if (rows === 1 && cols === 1) {
    return matrix;
  }
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => matrix[0]![0]!));
};

/** Where a pasted matrix lands: anchored top-left, clamped (or grown), skipping unwritable positions. */
export const planRangePaste = (
  source: CellSource,
  range: GridSelectionRange,
  matrix: string[][],
  options: { grow?: boolean } = {}
): GridPastePlan => {
  const writes: GridCellWrite[] = [];
  // Reduced, not `Math.max(...row)`: a spreadsheet column carries ~1M cells and would blow the
  // argument limit here, inside a handler no error boundary covers.
  const widest = matrix.reduce((max, row) => Math.max(max, row.length), 0);
  // Guarded on the widest row, not `matrix[0]`: a leading empty row would drop the whole paste.
  if (matrix.length === 0 || widest === 0) {
    return { writes, appendRows: 0, clampedRows: 0, clampedColumns: 0, skippedCells: 0 };
  }

  const rect = rectOf(range);
  const block = expandSingleCell(matrix, rect);
  const blockWidest = block.reduce((max, row) => Math.max(max, row.length), 0);

  const rowsWanted = block.length;
  const rowsAvailable = source.rowCount - rect.top;
  // Capped and the excess reported: an unbounded grow would allocate, snapshot and serialize every
  // row of a ~1M-row paste synchronously before the tab could paint.
  const appendRows = options.grow
    ? Math.min(Math.max(0, rowsWanted - rowsAvailable), source.maxAppendRows ?? 0)
    : 0;
  const rowsWritable = Math.min(rowsWanted, Math.max(0, rowsAvailable + appendRows));
  const colsWritable = Math.min(blockWidest, Math.max(0, source.columnCount - rect.left));
  let skippedCells = 0;

  for (let rowOffset = 0; rowOffset < rowsWritable; rowOffset++) {
    const sourceRow = block[rowOffset]!;
    for (let colOffset = 0; colOffset < colsWritable; colOffset++) {
      const text = sourceRow[colOffset];
      // A ragged block's hole. Counted, not written: leaving the cell alone is the
      // non-destructive choice, but an unreported hole reads as a paste that fully landed.
      if (text === undefined) {
        skippedCells += 1;
        continue;
      }
      const row = rect.top + rowOffset;
      const col = rect.left + colOffset;
      if (source.canWriteAt?.(row, col, text) === false) {
        skippedCells += 1;
        continue;
      }
      writes.push({ row, col, text });
    }
  }
  return {
    writes,
    appendRows,
    clampedRows: Math.max(0, rowsWanted - rowsWritable),
    clampedColumns: Math.max(0, blockWidest - colsWritable),
    skippedCells,
  };
};

/** Clears the range to each column's blank, skipping exactly what a paste would skip. */
export const planRangeClear = (source: CellSource, range: GridSelectionRange): GridCellWrite[] => {
  const rect = rectOf(range);
  const writes: GridCellWrite[] = [];
  for (let row = rect.top; row <= Math.min(rect.bottom, source.rowCount - 1); row++) {
    for (let col = rect.left; col <= Math.min(rect.right, source.columnCount - 1); col++) {
      const text = source.blankTextAt?.(col) ?? '';
      if (source.canWriteAt?.(row, col, text) !== false) {
        writes.push({ row, col, text });
      }
    }
  }
  return writes;
};
