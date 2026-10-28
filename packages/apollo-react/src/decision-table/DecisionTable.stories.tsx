import type { Meta, StoryObj } from '@storybook/react';
import { Button, cn } from '@uipath/apollo-wind';
import { GripVertical, Plus } from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { EMPTY_VALUE_DASH, ROW_NUMBER_WIDTH } from './constants';
import { DecisionTable } from './DecisionTable';
import { GridCell } from './GridCell';
import { GridContextMenu, type GridMenuEntry } from './GridMenu';
import {
  BAND_ADD_COLUMN_CLASS,
  BAND_LABEL_ROW_CLASS,
  BODY_CELL_CLASS,
  COLUMN_DRAG_HANDLE_CLASS,
  GRID_LINE_H_CLASS,
  GROUP_TONE_CLASS,
  HEADER_CELL_CLASS,
  HEADER_LABEL_ROW_CLASS,
  INSERT_ROW_CLASS,
  OUTPUT_CELL_TINT_CLASS,
  ROW_DRAG_HANDLE_CLASS,
  ROW_NUMBER_CELL_CLASS,
} from './gridStyles';
import type { GridColumn, GridColumnGroup, GridHandle } from './gridTypes';
import { type GridSelectionSource, normalizedRect, useGridNavigation } from './useGridNavigation';

type Kind = 'input' | 'output';

interface ColumnSpec {
  id: string;
  name: string;
  kind: Kind;
}

const INITIAL_COLUMNS: ColumnSpec[] = [
  { id: 'age', name: 'age', kind: 'input' },
  { id: 'income', name: 'income', kind: 'input' },
  { id: 'risk', name: 'risk', kind: 'output' },
];

const INITIAL_ROWS: Record<string, string>[] = [
  { annotation: 'Young applicant', age: '< 25', income: '<= 40000', risk: '"high"' },
  { age: '[25..60]', income: '> 40000', risk: '"standard"' },
  { age: '> 60', income: '-', risk: '"review"' },
];

const ANNOTATION_COLUMN_ID = 'annotation';

const labels = {
  resizeColumn: (columnName: string) => `Resize column ${columnName}`,
  resetColumnWidth: 'Double-click to reset the column width',
};

const moveItem = <T,>(items: T[], from: number, to: number): T[] => {
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved as T);
  return next;
};

/**
 * A consumer in miniature, composed the way the decision table composes it: the header and cell
 * styles, the group bands with their "+" add buttons, the right-click column menu, resize handles,
 * the hover-revealed row/column drag grips and the insert-row affordance all come from the package.
 * The consumer supplies only the data and what each action means.
 */
const DemoGrid = ({ resizable = true }: { resizable?: boolean }) => {
  const [specs, setSpecs] = useState(INITIAL_COLUMNS);
  const [rows, setRows] = useState(INITIAL_ROWS);
  const [menu, setMenu] = useState<{ anchor: { x: number; y: number }; columnId: string } | null>(
    null
  );
  const gridRef = useRef<GridHandle>(null);
  const nextId = useRef(1);

  const inputCount = specs.filter((spec) => spec.kind === 'input').length;

  const insertColumn = useCallback((kind: Kind, atIndex?: number) => {
    setSpecs((current) => {
      const id = `${kind}-${nextId.current++}`;
      const kindCount = current.filter((spec) => spec.kind === kind).length;
      const spec: ColumnSpec = { id, name: `${kind} ${kindCount + 1}`, kind };
      // Append at the end of the column's own band when no position is given.
      const index =
        atIndex ??
        (kind === 'input' ? current.filter((s) => s.kind === 'input').length : current.length);
      return [...current.slice(0, index), spec, ...current.slice(index)];
    });
  }, []);

  const deleteColumn = useCallback((id: string) => {
    setSpecs((current) => current.filter((spec) => spec.id !== id));
    setRows((current) => current.map(({ [id]: _removed, ...rest }) => rest));
  }, []);

  const groups = useMemo(() => {
    const groupFor = (kind: Kind): GridColumnGroup => ({
      id: `${kind}s`,
      label: kind === 'input' ? 'Inputs' : 'Outputs',
      toneClassName: GROUP_TONE_CLASS[kind === 'input' ? 'inputs' : 'outputs'],
      renderLabel: ({ isFirstRunOfGroup, label }) => (
        <span className={BAND_LABEL_ROW_CLASS}>
          {label}
          {isFirstRunOfGroup && (
            <Button
              variant="ghost"
              size="4xs"
              icon
              className={BAND_ADD_COLUMN_CLASS}
              title={`Add ${kind} column`}
              aria-label={`Add ${kind} column`}
              onClick={(event) => {
                event.stopPropagation();
                insertColumn(kind);
              }}
            >
              <Plus aria-hidden />
            </Button>
          )}
        </span>
      ),
    });
    return {
      annotation: {
        id: 'annotations',
        label: 'Annotation',
        toneClassName: GROUP_TONE_CLASS.annotation,
      } satisfies GridColumnGroup,
      input: groupFor('input'),
      output: groupFor('output'),
    };
  }, [insertColumn]);

  const columns: GridColumn[] = useMemo(
    () => [
      { id: ANNOTATION_COLUMN_ID, name: 'Rule name', defaultWidth: 180, group: groups.annotation },
      ...specs.map((spec) => ({
        id: spec.id,
        name: spec.name,
        defaultWidth: 160,
        group: groups[spec.kind],
      })),
    ],
    [specs, groups]
  );

  const menuEntries = useCallback((): GridMenuEntry[] => {
    if (!menu) {
      return [];
    }
    const index = specs.findIndex((spec) => spec.id === menu.columnId);
    const spec = specs[index];
    if (!spec) {
      return [];
    }
    const lastOfKind = specs.filter((s) => s.kind === spec.kind).length === 1;
    return [
      { label: 'Insert column left', onClick: () => insertColumn(spec.kind, index) },
      { label: 'Insert column right', onClick: () => insertColumn(spec.kind, index + 1) },
      { divider: true },
      {
        label: 'Delete column',
        disabled: lastOfKind,
        onClick: () => deleteColumn(spec.id),
      },
    ];
  }, [menu, specs, insertColumn, deleteColumn]);

  return (
    <div style={{ height: 360 }}>
      <DecisionTable
        ref={gridRef}
        labels={labels}
        columns={columns}
        rowCount={rows.length}
        leadingColumnWidth={ROW_NUMBER_WIDTH}
        pinnedColumnCount={0}
        initialColumnWidths={{}}
        columnsResizable={resizable}
        tableAriaLabel="Demo decision grid"
        dataTestId="demo-grid"
        columnGroupSizes={[1, inputCount, specs.length - inputCount]}
        onRowMove={(from, to) => {
          if (to !== from) {
            setRows((current) => moveItem(current, from, to));
          }
        }}
        onColumnMove={(groupIndex, from, to) => {
          // Group 0 is the lone annotation column — nothing to reorder there.
          if (groupIndex !== 0 && to !== from) {
            const base = groupIndex === 1 ? 0 : inputCount;
            setSpecs((current) => moveItem(current, base + from, base + to));
          }
        }}
        renderHeaderCell={(column, { resizeHandle, pinnedLeftPx }) => {
          if (column.id === ANNOTATION_COLUMN_ID) {
            return (
              <th key={column.id} scope="col" className={HEADER_CELL_CLASS}>
                <div className={HEADER_LABEL_ROW_CLASS}>
                  <span className="min-w-0 truncate">{column.name}</span>
                </div>
                {resizeHandle}
              </th>
            );
          }
          const index = specs.findIndex((spec) => spec.id === column.id);
          const spec = specs[index];
          const groupIndex = spec?.kind === 'input' ? 1 : 2;
          const indexInGroup = groupIndex === 1 ? index : index - inputCount;
          return (
            <th
              key={column.id}
              scope="col"
              className={cn(HEADER_CELL_CLASS, 'group/header', pinnedLeftPx !== undefined && 'z-3')}
              style={pinnedLeftPx !== undefined ? { left: pinnedLeftPx } : undefined}
              onContextMenu={(event) => {
                event.preventDefault();
                setMenu({ anchor: { x: event.clientX, y: event.clientY }, columnId: column.id });
              }}
            >
              <div className={HEADER_LABEL_ROW_CLASS}>
                <span className="min-w-0 truncate">{column.name}</span>
                <span
                  className={COLUMN_DRAG_HANDLE_CLASS}
                  title="Drag to reorder within the band"
                  onPointerDown={(event) => {
                    // A drag, never also a header click — the grip sits inside the header.
                    event.stopPropagation();
                    gridRef.current?.startColumnDrag(groupIndex, indexInGroup, event);
                  }}
                >
                  <GripVertical aria-hidden className="size-3" />
                </span>
              </div>
              <div className="mt-0.5 truncate font-mono text-[11px] font-normal text-foreground-de-emp">
                {`$vars.${column.id}`}
              </div>
              {resizeHandle}
            </th>
          );
        }}
        renderRow={(rowIndex, visibleColumns) => (
          <tr key={rowIndex} style={{ height: 'var(--grid-row-height)' }}>
            <td className={ROW_NUMBER_CELL_CLASS}>
              <Button
                variant="ghost"
                size="4xs"
                icon
                className={INSERT_ROW_CLASS}
                title="Insert row here"
                aria-label={`Insert row above row ${rowIndex + 1}`}
                onClick={(event) => {
                  event.stopPropagation();
                  setRows((current) => [
                    ...current.slice(0, rowIndex),
                    {},
                    ...current.slice(rowIndex),
                  ]);
                }}
              >
                <Plus aria-hidden />
              </Button>
              {rowIndex + 1}
              <span
                className={ROW_DRAG_HANDLE_CLASS}
                title="Drag to reorder rows"
                onPointerDown={(event) => {
                  // A drag, never also a row selection — the handle sits inside the gutter.
                  event.stopPropagation();
                  gridRef.current?.startRowDrag(rowIndex, event);
                }}
              >
                <GripVertical aria-hidden className="size-3" />
              </span>
            </td>
            {visibleColumns.map((visible) => {
              if (visible.type === 'spacer') {
                return (
                  <td
                    key={`spacer-${visible.coveredIds[0]}`}
                    aria-hidden="true"
                    style={{ padding: 0, border: 'none', width: visible.widthPx }}
                  />
                );
              }
              if (visible.type === 'separator') {
                return (
                  <td
                    key={`separator-${visible.beforeColumnId}`}
                    aria-hidden="true"
                    style={{ padding: 0, width: visible.widthPx }}
                  />
                );
              }
              if (visible.column.id === ANNOTATION_COLUMN_ID) {
                const name = rows[rowIndex]?.[ANNOTATION_COLUMN_ID];
                return (
                  <td key={visible.column.id} className={cn(BODY_CELL_CLASS, 'px-2 py-1')}>
                    {name ?? <span className="text-foreground-de-emp italic">Name this rule…</span>}
                  </td>
                );
              }
              return (
                <td
                  key={visible.column.id}
                  className={cn(
                    BODY_CELL_CLASS,
                    visible.column.group?.id === 'outputs' && OUTPUT_CELL_TINT_CLASS,
                    'px-2 py-1'
                  )}
                >
                  {rows[rowIndex]?.[visible.column.id] ?? EMPTY_VALUE_DASH}
                </td>
              );
            })}
          </tr>
        )}
        renderFooterRow={(colSpan) => (
          <tr key="add-row">
            <td
              className={cn('cursor-pointer p-0 hover:bg-surface-hover', GRID_LINE_H_CLASS)}
              colSpan={colSpan}
              onClick={() => setRows((current) => [...current, {}])}
            >
              <span className="inline-flex items-center gap-1 px-2 py-1.5 text-xs text-primary">
                <Plus aria-hidden className="size-3.5" />
                Add row
              </span>
            </td>
          </tr>
        )}
      />
      <GridContextMenu
        label="Column menu"
        state={menu}
        entries={menuEntries}
        onClose={() => setMenu(null)}
      />
      <p className="mt-2 text-sm text-foreground-de-emp">
        Right-click a column header for insert/delete. Hover a header or the row-number gutter for
        the drag grips; the + on each band appends a column, the + on a row's top edge inserts a
        row.
      </p>
    </div>
  );
};

const meta: Meta<typeof DecisionTable> = {
  title: 'Decision Table',
  component: DecisionTable,
  parameters: { layout: 'padded' },
};
export default meta;

type Story = StoryObj<typeof DecisionTable>;

export const Default: Story = {
  render: () => <DemoGrid />,
};

export const FixedColumns: Story = {
  render: () => <DemoGrid resizable={false} />,
};

type SelectionTable = GridSelectionSource['table'];
type SelectionState = NonNullable<SelectionTable['state']['cellSelection']>;

/**
 * The hook's selection source is structural — in the product it is a tanstack v9 table with the
 * cell-selection feature; ten lines of useState satisfy the same contract, which is the point.
 */
const useSelectionStore = (): SelectionTable => {
  const [cellSelection, setCellSelection] = useState<SelectionState>([]);
  return useMemo(
    () => ({
      state: { cellSelection },
      setCellSelection: (updater) =>
        setCellSelection((previous) =>
          typeof updater === 'function' ? updater(previous) : updater
        ),
    }),
    [cellSelection]
  );
};

const E2E_COLUMNS: { id: string; name: string; kind: 'annotation' | Kind }[] = [
  { id: 'annotation', name: 'Rule name', kind: 'annotation' },
  { id: 'age', name: 'age', kind: 'input' },
  { id: 'income', name: 'income', kind: 'input' },
  { id: 'risk', name: 'risk', kind: 'output' },
];

interface E2eRow {
  id: string;
  cells: Record<string, string>;
}

const E2E_ROWS: E2eRow[] = [
  {
    id: 'r1',
    cells: { annotation: 'Young applicant', age: '< 25', income: '<= 40000', risk: '"high"' },
  },
  { id: 'r2', cells: { age: '[25..60]', income: '> 40000', risk: '"standard"' } },
  { id: 'r3', cells: { age: '> 60', income: '-', risk: '"review"' } },
];

/**
 * The full editing stack, composed exactly the way the DMN editor composes it: a tanstack v9
 * cell-selection table as the selection store, useGridNavigation for the keyboard/selection
 * model, GridCell for every cell (click to select, double-click or type to edit, Enter/Tab
 * commit and move, Escape cancels), the grid-owned clipboard (Ctrl/Cmd+C/X/V over TSV, Delete
 * clears) and a validation mark. The consumer owns only the model the writes land in.
 */
const EndToEndGrid = () => {
  const [rows, setRows] = useState(E2E_ROWS);
  const gridRef = useRef<GridHandle>(null);
  const table = useSelectionStore();
  const rowIds = useMemo(() => rows.map((row) => row.id), [rows]);
  const colIds = useMemo(() => E2E_COLUMNS.map((column) => column.id), []);
  const nav = useGridNavigation({ table, rowIds, colIds });

  const groups = useMemo(() => {
    const groupFor = (kind: 'annotation' | Kind): GridColumnGroup => ({
      id: `${kind}s`,
      label: kind === 'annotation' ? 'Annotation' : kind === 'input' ? 'Inputs' : 'Outputs',
      toneClassName:
        GROUP_TONE_CLASS[
          kind === 'annotation' ? 'annotation' : kind === 'input' ? 'inputs' : 'outputs'
        ],
    });
    return {
      annotation: groupFor('annotation'),
      input: groupFor('input'),
      output: groupFor('output'),
    };
  }, []);

  const columns: GridColumn[] = useMemo(
    () =>
      E2E_COLUMNS.map((column) => ({
        id: column.id,
        name: column.name,
        defaultWidth: column.id === 'annotation' ? 180 : 160,
        group: groups[column.kind],
      })),
    [groups]
  );

  const writeCell = (row: number, col: number, text: string) => {
    setRows((current) =>
      current.map((entry, index) =>
        index === row ? { ...entry, cells: { ...entry.cells, [colIds[col]!]: text } } : entry
      )
    );
  };

  const rect = nav.range ? normalizedRect(nav.range) : null;

  return (
    <div style={{ height: 380 }}>
      <DecisionTable
        ref={gridRef}
        labels={labels}
        columns={columns}
        rowCount={rows.length}
        leadingColumnWidth={ROW_NUMBER_WIDTH}
        pinnedColumnCount={0}
        initialColumnWidths={{}}
        columnsResizable
        tableAriaLabel="End-to-end decision grid"
        dataTestId="e2e-grid"
        retainedRowIndex={nav.editing ? nav.focus?.row : null}
        clipboard={{
          range: nav.range,
          editing: nav.editing,
          textAt: (row, col) => rows[row]?.cells[colIds[col]!] ?? '',
          onWrite: (writes, appendRows) => {
            setRows((current) => {
              const grown = [
                ...current,
                ...Array.from(
                  { length: appendRows },
                  (_, index): E2eRow => ({
                    id: `r${current.length + index + 1}-${Math.trunc(performance.now())}`,
                    cells: {},
                  })
                ),
              ];
              return grown.map((entry, index) => {
                const own = writes.filter((write) => write.row === index);
                if (own.length === 0) {
                  return entry;
                }
                const cells: Record<string, string> = { ...entry.cells };
                for (const write of own) {
                  cells[colIds[write.col]!] = write.text;
                }
                return { ...entry, cells };
              });
            });
          },
        }}
        containerProps={{
          onKeyDown: (event) => {
            if ((event.key === 'Delete' || event.key === 'Backspace') && !nav.editing) {
              if (gridRef.current?.clipboard.clear()) {
                event.preventDefault();
                return;
              }
            }
            nav.onKeyDown(event);
          },
        }}
        renderHeaderCell={(column, { resizeHandle }) => (
          <th key={column.id} scope="col" className={HEADER_CELL_CLASS}>
            <div className={HEADER_LABEL_ROW_CLASS}>
              <span className="min-w-0 truncate">{column.name}</span>
            </div>
            {resizeHandle}
          </th>
        )}
        renderRow={(rowIndex, visibleColumns) => (
          <tr key={rows[rowIndex]?.id ?? rowIndex} style={{ height: 'var(--grid-row-height)' }}>
            <td className={ROW_NUMBER_CELL_CLASS}>{rowIndex + 1}</td>
            {visibleColumns.map((visible) => {
              if (visible.type !== 'column') {
                return visible.type === 'spacer' ? (
                  <td
                    key={`spacer-${visible.coveredIds[0]}`}
                    aria-hidden="true"
                    style={{ padding: 0, border: 'none', width: visible.widthPx }}
                  />
                ) : (
                  <td
                    key={`separator-${visible.beforeColumnId}`}
                    aria-hidden="true"
                    style={{ padding: 0, width: visible.widthPx }}
                  />
                );
              }
              const col = visible.flexIndex;
              const isFocus = nav.focus?.row === rowIndex && nav.focus?.col === col;
              const inRange =
                !!rect &&
                rowIndex >= rect.top &&
                rowIndex <= rect.bottom &&
                col >= rect.left &&
                col <= rect.right;
              const columnId = visible.column.id;
              const value = rows[rowIndex]?.cells[columnId] ?? '';
              return (
                <GridCell
                  key={columnId}
                  value={value}
                  placeholder={columnId === 'annotation' ? 'Name this rule…' : undefined}
                  mono={columnId !== 'annotation'}
                  row={rowIndex}
                  col={col}
                  selected={isFocus}
                  inRange={inRange && !isFocus}
                  editing={nav.editing && isFocus}
                  openedByTyping={nav.openedByTyping}
                  focusable
                  tabStop={isFocus || (rowIndex === 0 && col === 0 && !nav.focus)}
                  className={cn(visible.column.group?.id === 'outputs' && OUTPUT_CELL_TINT_CLASS)}
                  mark={
                    rows[rowIndex]?.id === 'r3' && columnId === 'income'
                      ? { tone: 'error', title: 'Demo diagnostic: "-" never matches', glyph: true }
                      : undefined
                  }
                  dataTestId={`e2e-cell-${rowIndex}-${col}`}
                  ariaLabel={`${visible.column.name}, rule ${rowIndex + 1}`}
                  onSelect={(extend) =>
                    extend
                      ? nav.extendTo({ row: rowIndex, col })
                      : nav.select({ row: rowIndex, col })
                  }
                  onStartEdit={() => nav.startEditAt({ row: rowIndex, col })}
                  onCommit={(text, move) => {
                    writeCell(rowIndex, col, text);
                    nav.commitEdit(move);
                  }}
                  onCancel={nav.cancelEdit}
                />
              );
            })}
          </tr>
        )}
      />
      <p className="mt-2 text-sm text-foreground-de-emp">
        Click to select, double-click or just type to edit; Enter/Tab commit and move, Escape
        cancels; Shift+arrows extend the range; Ctrl/Cmd+C/X/V round-trip TSV; Delete clears the
        selection. The marked cell carries a demo diagnostic.
      </p>
    </div>
  );
};

export const EndToEnd: Story = {
  render: () => <EndToEndGrid />,
};
