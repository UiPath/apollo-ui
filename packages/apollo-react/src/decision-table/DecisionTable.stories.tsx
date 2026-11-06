import type { Meta, StoryObj } from '@storybook/react';
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@uipath/apollo-wind';
import { ChevronDown, Plus } from 'lucide-react';
import type React from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { EMPTY_VALUE_DASH, ROW_NUMBER_WIDTH } from './constants';
import { DecisionTable } from './DecisionTable';
import { DragIndicator } from './DragIndicator';
import { EdgeInsertButton } from './EdgeInsertButton';
import { GridCell } from './GridCell';
import { GridContextMenu, type GridMenuEntry } from './GridMenu';
import {
  BAND_LABEL_ROW_CLASS,
  BODY_CELL_CLASS,
  BREADCRUMB_POINT_STYLE,
  FOOTER_ACTION_CLASS,
  GROUP_TONE_CLASS,
  HEADER_CELL_CLASS,
  HEADER_LABEL_ROW_CLASS,
  OUTPUT_CELL_TINT_CLASS,
  ROW_GUTTER_MARK_CLASS,
  ROW_MARK_OVERLAY_CLASS,
  ROW_NUMBER_CELL_CLASS,
} from './gridStyles';
import type {
  DragStartEvent,
  GridColumn,
  GridColumnGroup,
  GridHandle,
  VisibleGridColumn,
} from './gridTypes';
import { MarkGlyph } from './MarkGlyph';
import type { Mark, RowMark } from './marks';
import { usePressDrag } from './useDragReorder';
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

/** The `<td>` standing in for unmounted columns (a spacer) or a band separator. */
const renderFillerCell = (visible: Exclude<VisibleGridColumn, { type: 'column' }>) =>
  visible.type === 'spacer' ? (
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

/** A column header's second line: the variable it binds. */
const VarsLine = ({ columnId }: { columnId: string }) => (
  <div className="mt-0.5 truncate font-mono text-[11px] font-normal text-foreground-de-emp">
    {`$vars.${columnId}`}
  </div>
);

/** The decision table as it comes, with only resizing, the band "+" and "Add row" turned on. */
const DemoGrid = ({
  resizable = true,
  readOnly = false,
  topLeftCorner,
  caption,
}: {
  resizable?: boolean;
  topLeftCorner?: React.ReactNode;
  /** Replaces the default caption, for a story that shows one thing. */
  caption?: string;
  /** Nothing that changes the table: no band "+" or "Add row". */
  readOnly?: boolean;
}) => {
  const [specs, setSpecs] = useState(INITIAL_COLUMNS);
  const [rows, setRows] = useState(INITIAL_ROWS);
  const nextId = useRef(1);

  /** Appends a column at the end of its own band. */
  const insertColumn = useCallback((kind: Kind) => {
    setSpecs((current) => {
      const id = `${kind}-${nextId.current++}`;
      const kindCount = current.filter((spec) => spec.kind === kind).length;
      const spec: ColumnSpec = { id, name: `${kind} ${kindCount + 1}`, kind };
      const index = kind === 'input' ? kindCount : current.length;
      return [...current.slice(0, index), spec, ...current.slice(index)];
    });
  }, []);

  const groups = useMemo(() => {
    const groupFor = (kind: Kind): GridColumnGroup => ({
      id: `${kind}s`,
      label: kind === 'input' ? 'Inputs' : 'Outputs',
      toneClassName: GROUP_TONE_CLASS[kind === 'input' ? 'inputs' : 'outputs'],
      // `run` holds only on the cell with the band's real first or last column, so the point that
      // joins the bands is drawn once, wherever the window starts.
      cellProps: (run) => ({
        ...(run.endsGroup && { className: 'border-r-0' }),
        ...(kind === 'output' && run.startsGroup && { style: BREADCRUMB_POINT_STYLE }),
      }),
      renderLabel: ({ isFirstRunOfGroup, label }) => (
        <span className={BAND_LABEL_ROW_CLASS}>
          <span className="min-w-0 truncate">{label}</span>
          {isFirstRunOfGroup && !readOnly && (
            <Button
              variant="ghost"
              size="4xs"
              icon
              className="shrink-0"
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
  }, [insertColumn, readOnly]);

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

  return (
    <div style={{ height: 360 }}>
      <DecisionTable
        labels={labels}
        columns={columns}
        rowCount={rows.length}
        leadingColumnWidth={ROW_NUMBER_WIDTH}
        pinnedColumnCount={0}
        initialColumnWidths={{}}
        columnsResizable={resizable}
        tableAriaLabel="Demo decision grid"
        dataTestId="demo-grid"
        topLeftCorner={topLeftCorner}
        renderHeaderCell={(column, { resizeHandle }) => (
          <th key={column.id} scope="col" className={HEADER_CELL_CLASS}>
            <div className={HEADER_LABEL_ROW_CLASS}>
              <span className="min-w-0 truncate">{column.name}</span>
            </div>
            {column.id !== ANNOTATION_COLUMN_ID && <VarsLine columnId={column.id} />}
            {resizeHandle}
          </th>
        )}
        renderRow={(rowIndex, visibleColumns) => (
          <tr
            key={rowIndex}
            className="group/row"
            aria-rowindex={rowIndex + 3}
            style={{ height: 'var(--grid-row-height)' }}
          >
            <td className={ROW_NUMBER_CELL_CLASS} data-row={rowIndex}>
              {rowIndex + 1}
            </td>
            {visibleColumns.map((visible) => {
              if (visible.type !== 'column') {
                return renderFillerCell(visible);
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
        renderFooterRow={
          readOnly
            ? undefined
            : (colSpan) => (
                <tr key="add-row">
                  <td
                    className="cursor-pointer p-0 hover:bg-surface-hover"
                    colSpan={colSpan}
                    onClick={() => setRows((current) => [...current, {}])}
                  >
                    <Button variant="text" size="xs" className={FOOTER_ACTION_CLASS}>
                      <Plus aria-hidden />
                      Add row
                    </Button>
                  </td>
                </tr>
              )
        }
      />
      <p className="mt-2 text-sm text-foreground-de-emp">
        {caption ??
          (readOnly
            ? 'Read-only: nothing changes the table. Columns still resize.'
            : 'The table as it comes. You can resize a column, add a column with the + on each band, and add a row with "Add row".')}
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

export const ReadOnly: Story = {
  render: () => <DemoGrid readOnly />,
};

export const Errors: Story = {
  render: () => <ErrorsGrid />,
};

export const FixedColumns: Story = {
  render: () => (
    <DemoGrid
      resizable={false}
      caption='Columns keep their widths: there is no resizing. You can add a column with the + on each band, and a row with "Add row".'
    />
  ),
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

const E2E_COLUMNS: RuleColumn[] = [
  { id: 'annotation', name: 'Rule name', kind: 'annotation' },
  { id: 'age', name: 'age', kind: 'input' },
  { id: 'income', name: 'income', kind: 'input' },
  { id: 'risk', name: 'risk', kind: 'output' },
];

/** A story column: the rule name, or an input or output. */
type RuleColumn = { id: string; name: string; kind: 'annotation' | Kind };

interface RuleRow {
  id: string;
  cells: Record<string, string>;
}

const E2E_ROWS: RuleRow[] = [
  {
    id: 'r1',
    cells: { annotation: 'Young applicant', age: '< 25', income: '<= 40000', risk: '"high"' },
  },
  { id: 'r2', cells: { age: '[25..60]', income: '> 40000', risk: '"standard"' } },
  { id: 'r3', cells: { age: '> 60', income: '-', risk: '"review"' } },
];

const ERRORS_COLUMNS: RuleColumn[] = [
  { id: 'annotation', name: 'Rule name', kind: 'annotation' },
  { id: 'age', name: 'age', kind: 'input' },
  { id: 'income', name: 'income', kind: 'input' },
  { id: 'region', name: 'region', kind: 'input' },
  { id: 'risk', name: 'risk', kind: 'output' },
  { id: 'limit', name: 'limit', kind: 'output' },
];

interface ErrorsRow extends RuleRow {
  mark?: RowMark;
}

/** One rule per mark state; each rule's name says which. */
const ERRORS_ROWS: ErrorsRow[] = [
  {
    id: 'e1',
    cells: {
      annotation: 'Cell error, with its icon',
      age: '< "25"',
      income: '<= 40000',
      region: '"north"',
      risk: '"high"',
      limit: '5000',
    },
    mark: {
      cells: {
        age: {
          tone: 'error',
          title: 'Type mismatch: age is a number, "25" is a string',
          glyph: true,
        },
      },
    },
  },
  {
    id: 'e2',
    cells: {
      annotation: 'Cell error, tint only',
      age: '[25..60]',
      income: '> 40000 and',
      region: '-',
      risk: '"standard"',
      limit: '10000',
    },
    mark: {
      cells: { income: { tone: 'error', title: 'Unparsable expression: nothing after "and"' } },
    },
  },
  {
    id: 'e3',
    cells: {
      annotation: 'Cell warning',
      age: '[60..25]',
      income: '-',
      region: '"south"',
      risk: '"review"',
      limit: '2500',
    },
    mark: {
      cells: {
        age: {
          tone: 'warning',
          title: 'Range end is below its start, so it never matches',
          glyph: true,
        },
      },
    },
  },
  {
    id: 'e4',
    cells: {
      annotation: 'Output cell error',
      age: '> 60',
      income: '-',
      region: '-',
      risk: '"urgent"',
      limit: '0',
    },
    mark: {
      cells: {
        risk: { tone: 'error', title: '"urgent" is not an allowed value of risk', glyph: true },
      },
    },
  },
  {
    id: 'e5',
    cells: {
      annotation: 'Several errors in one rule',
      age: '>=',
      income: '< 0',
      region: 'east',
      risk: '"low"',
      limit: '-1',
    },
    mark: {
      tone: 'error',
      glyph: true,
      title: '3 errors in this rule',
      cells: {
        age: { tone: 'error', title: 'Unparsable expression: ">=" needs a value', glyph: true },
        region: { tone: 'error', title: 'Unknown variable: east (missing quotes?)', glyph: true },
        limit: { tone: 'error', title: 'limit must be zero or more', glyph: true },
      },
    },
  },
  {
    id: 'e6',
    cells: {
      annotation: 'Rule error, on the whole rule',
      age: '< 25',
      income: '<= 40000',
      region: '"north"',
      risk: '"high"',
      limit: '5000',
    },
    mark: {
      tone: 'error',
      glyph: true,
      title: 'Duplicate of rule 1: it can never be the one that matches',
    },
  },
  {
    id: 'e7',
    cells: {
      annotation: 'Rule warning',
      age: '-',
      income: '-',
      region: '-',
      risk: '"standard"',
      limit: '1000',
    },
    mark: { tone: 'warning', glyph: true, title: 'Matches every input: rules below it never run' },
  },
  {
    id: 'e8',
    cells: {
      annotation: 'Rule warning with an error cell',
      age: '>= 18',
      income: '> "high"',
      region: '"west"',
      risk: '"review"',
      limit: '2000',
    },
    mark: {
      tone: 'warning',
      glyph: true,
      title: 'Overlaps rule 3',
      // A cell's own tone wins over its rule's.
      cells: {
        income: {
          tone: 'error',
          title: 'Type mismatch: income is a number, "high" is a string',
          glyph: true,
        },
      },
    },
  },
  {
    id: 'e9',
    cells: {
      annotation: 'No issues',
      age: '[18..25)',
      income: '> 20000',
      region: '"east"',
      risk: '"low"',
      limit: '7500',
    },
  },
];

/** Header marks, by column id: the whole column is at fault, not one rule. */
const ERRORS_COLUMN_MARKS: Record<string, Mark> = {
  region: {
    tone: 'warning',
    title: 'region has no allowed values, so any string passes',
    glyph: true,
  },
  limit: { tone: 'error', title: 'limit has no type', glyph: true },
};

/** Issues of the table as a whole, the worst setting the tone, as the table mark carries them. */
const ERRORS_TABLE_ISSUES = [
  'Hit policy Collect (sum) needs number outputs, but risk returns a string',
  'Input name "region " ends with a space',
];

/**
 * Every mark the table paints: an error or a warning on a cell (with or without its icon), on an
 * output cell, on a whole rule (row number and row tint), on a rule with errors of its own cells,
 * a cell's tone winning over its rule's, on a column header, and on the table as a whole (in the
 * corner). Hover a mark for its message.
 */
const ErrorsGrid = () => {
  const [rows, setRows] = useState(ERRORS_ROWS);
  const table = useSelectionStore();
  const rowIds = useMemo(() => rows.map((row) => row.id), [rows]);
  const colIds = useMemo(() => ERRORS_COLUMNS.map((column) => column.id), []);
  const nav = useGridNavigation({ table, rowIds, colIds });

  const groups = useMemo(
    () =>
      ({
        annotation: {
          id: 'annotations',
          label: 'Annotation',
          toneClassName: GROUP_TONE_CLASS.annotation,
        },
        input: {
          id: 'inputs',
          label: 'Inputs',
          toneClassName: GROUP_TONE_CLASS.inputs,
          cellProps: (run) => (run.endsGroup ? { className: 'border-r-0' } : {}),
        },
        output: {
          id: 'outputs',
          label: 'Outputs',
          toneClassName: GROUP_TONE_CLASS.outputs,
          cellProps: (run) => ({
            ...(run.endsGroup && { className: 'border-r-0' }),
            ...(run.startsGroup && { style: BREADCRUMB_POINT_STYLE }),
          }),
        },
      }) satisfies Record<'annotation' | Kind, GridColumnGroup>,
    []
  );

  const columns: GridColumn[] = useMemo(
    () =>
      ERRORS_COLUMNS.map((column) => ({
        id: column.id,
        name: column.name,
        defaultWidth: column.kind === 'annotation' ? 240 : 150,
        group: groups[column.kind],
      })),
    [groups]
  );

  const rect = nav.range ? normalizedRect(nav.range) : null;

  return (
    <div>
      <DecisionTable
        labels={labels}
        columns={columns}
        rowCount={rows.length}
        leadingColumnWidth={ROW_NUMBER_WIDTH}
        pinnedColumnCount={0}
        initialColumnWidths={{}}
        columnsResizable
        tableAriaLabel="Decision grid with errors"
        dataTestId="errors-grid"
        tableMark={{ tone: 'error', title: ERRORS_TABLE_ISSUES.join('\n') }}
        retainedRowIndex={nav.editing ? nav.focus?.row : null}
        containerProps={{
          onKeyDown: nav.onKeyDown,
          // The table only carries a mark's message (`data-mark-title`); showing it is the
          // consumer's job. A native tooltip is enough here.
          onPointerOver: (event) => {
            const marked = (event.target as Element).closest('[data-mark-title]');
            if (marked instanceof HTMLElement) {
              marked.title = marked.dataset.markTitle ?? '';
            }
          },
        }}
        renderHeaderCell={(column, { resizeHandle }) => {
          const mark = ERRORS_COLUMN_MARKS[column.id];
          return (
            <th
              key={column.id}
              scope="col"
              className={HEADER_CELL_CLASS}
              aria-label={[column.name, mark?.title].filter(Boolean).join('. ')}
              data-mark-title={mark?.title}
            >
              <div className={HEADER_LABEL_ROW_CLASS}>
                <span className="min-w-0 truncate">{column.name}</span>
                {mark?.glyph && <MarkGlyph tone={mark.tone} className="mr-auto size-3.5" />}
              </div>
              {column.id !== ANNOTATION_COLUMN_ID && <VarsLine columnId={column.id} />}
              {resizeHandle}
            </th>
          );
        }}
        renderRow={(rowIndex, visibleColumns) => {
          const row = rows[rowIndex];
          const mark = row?.mark;
          return (
            <tr
              key={row?.id ?? rowIndex}
              className="group/row"
              aria-rowindex={rowIndex + 3}
              data-tone={mark?.tone}
              style={{ height: 'var(--grid-row-height)' }}
            >
              <td
                className={cn(ROW_NUMBER_CELL_CLASS, ROW_GUTTER_MARK_CLASS, ROW_MARK_OVERLAY_CLASS)}
                data-row={rowIndex}
                aria-label={[`Rule ${rowIndex + 1}`, mark?.title].filter(Boolean).join('. ')}
                data-mark-title={mark?.title}
              >
                {rowIndex + 1}
                {mark?.glyph && <MarkGlyph tone={mark.tone} className="ml-1 inline align-middle" />}
              </td>
              {visibleColumns.map((visible) => {
                if (visible.type !== 'column') {
                  return renderFillerCell(visible);
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
                return (
                  <GridCell
                    key={columnId}
                    value={row?.cells[columnId] ?? ''}
                    mono={columnId !== ANNOTATION_COLUMN_ID}
                    row={rowIndex}
                    col={col}
                    selected={isFocus}
                    inRange={inRange && !isFocus}
                    editing={nav.editing && isFocus}
                    openedByTyping={nav.openedByTyping}
                    focusable
                    tabStop={isFocus || (rowIndex === 0 && col === 0 && !nav.focus)}
                    className={cn(visible.column.group?.id === 'outputs' && OUTPUT_CELL_TINT_CLASS)}
                    mark={mark?.cells?.[columnId]}
                    dataTestId={`errors-cell-${rowIndex}-${col}`}
                    ariaLabel={`${visible.column.name}, rule ${rowIndex + 1}`}
                    onSelect={(extend) =>
                      extend
                        ? nav.extendTo({ row: rowIndex, col })
                        : nav.select({ row: rowIndex, col })
                    }
                    onStartEdit={() => nav.startEditAt({ row: rowIndex, col })}
                    onCommit={(text, move) => {
                      setRows((current) =>
                        current.map((entry, index) =>
                          index === rowIndex
                            ? { ...entry, cells: { ...entry.cells, [columnId]: text } }
                            : entry
                        )
                      );
                      nav.commitEdit(move);
                    }}
                    onCancel={nav.cancelEdit}
                  />
                );
              })}
            </tr>
          );
        }}
      />
      <p className="mt-2 text-sm text-foreground-de-emp">
        Each rule's name says which state it shows. Hover a marked cell, row number or column header
        for its message. A cell being edited drops its mark until the edit ends. The mark in the
        corner is the table's own, for issues with no rule, cell or column to sit on.
      </p>
    </div>
  );
};

const HIT_POLICY_GROUPS = [
  {
    label: 'Single result',
    policies: [
      { code: 'U', label: 'Unique' },
      { code: 'F', label: 'First' },
      { code: 'P', label: 'Priority' },
      { code: 'A', label: 'Any' },
    ],
  },
  {
    label: 'Multiple results',
    policies: [
      { code: 'C', label: 'Collect' },
      { code: 'R', label: 'Rule order' },
      { code: 'O', label: 'Output order' },
    ],
  },
];

/**
 * A basic hit policy picker for the top-left corner: the policy's code as the trigger, and a menu
 * of the policies. The table renders the corner cell; this is only what goes inside it.
 */
const HitPolicyPicker = () => {
  const [code, setCode] = useState('U');
  const label = HIT_POLICY_GROUPS.flatMap((group) => group.policies).find(
    (policy) => policy.code === code
  )?.label;
  return (
    // Non-modal, like the table's context menu: a modal menu hides the rest of the page from
    // assistive tech and locks the page's scrolling.
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="3xs"
          className="w-11 gap-0.5 px-1 [&_svg]:size-3.5"
          title={`Hit policy: ${label}`}
          aria-label={`Hit policy: ${label}`}
          // Kept off the grid: a press here is not a cell drag-selection, and a key is not the
          // cell selection's Delete or arrow navigation.
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <span className="font-mono text-sm font-semibold text-foreground">{code}</span>
          <ChevronDown aria-hidden className="text-foreground-de-emp" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-56"
        onClick={(event) => event.stopPropagation()}
        // Portalled in the DOM but still a React child of the grid, whose key handler would
        // otherwise read these keys as the cell selection's.
        onKeyDown={(event) => event.stopPropagation()}
      >
        <DropdownMenuRadioGroup value={code} onValueChange={setCode}>
          {HIT_POLICY_GROUPS.map((group, index) => (
            <div key={group.label}>
              {index > 0 && <DropdownMenuSeparator />}
              <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
              {group.policies.map((policy) => (
                <DropdownMenuRadioItem key={policy.code} value={policy.code}>
                  <span className="w-4 font-mono font-semibold">{policy.code}</span>
                  {policy.label}
                </DropdownMenuRadioItem>
              ))}
            </div>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const LARGE_ROW_COUNT = 300;
const LARGE_INPUT_COUNT = 294;

/** Deterministic, so every reload draws the same table. */
const seededRandom = (seed: number) => {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
};

const LARGE_COLUMNS: RuleColumn[] = [
  { id: 'annotation', name: 'Rule name', kind: 'annotation' },
  ...Array.from({ length: LARGE_INPUT_COUNT }, (_, index) => ({
    id: `in${index + 1}`,
    name: `input${index + 1}`,
    kind: 'input' as const,
  })),
  ...['decision', 'score', 'tier', 'reason', 'reviewer'].map((name) => ({
    id: `out-${name}`,
    name,
    kind: 'output' as const,
  })),
];

const INPUT_VALUE_SHAPES = [
  (n: number) => `< ${n}`,
  (n: number) => `>= ${n}`,
  (n: number) => `[${n}..${n + 25}]`,
  (n: number) => `"${['north', 'south', 'east', 'west'][n % 4]}"`,
  (n: number) => (n % 2 === 0 ? 'true' : 'false'),
  () => '-',
];
const OUTPUT_VALUES: Record<string, (n: number) => string> = {
  'out-decision': (n) => `"${['approve', 'decline', 'refer'][n % 3]}"`,
  'out-score': (n) => `${n}`,
  'out-tier': (n) => `"${['gold', 'silver', 'bronze'][n % 3]}"`,
  'out-reason': (n) => `"rule ${n % 40} matched"`,
  'out-reviewer': (n) => `"${['ops', 'risk', 'legal', 'none'][n % 4]}"`,
};

/** Built on first use, so the other stories in this file don't pay for 90,000 strings. */
let largeRows: RuleRow[] | undefined;
const buildLargeRows = (): RuleRow[] => {
  const random = seededRandom(17);
  return Array.from({ length: LARGE_ROW_COUNT }, (_, rowIndex) => {
    const cells: Record<string, string> = {};
    if (rowIndex % 7 === 0) {
      cells.annotation = `Segment ${rowIndex / 7 + 1}`;
    }
    for (const column of LARGE_COLUMNS) {
      const n = Math.floor(random() * 100);
      if (column.kind === 'input') {
        cells[column.id] = INPUT_VALUE_SHAPES[n % INPUT_VALUE_SHAPES.length]!(n);
      } else if (column.kind === 'output') {
        cells[column.id] = OUTPUT_VALUES[column.id]!(n);
      }
    }
    return { id: `large-${rowIndex + 1}`, cells };
  });
};
const getLargeRows = () => {
  largeRows ??= buildLargeRows();
  return largeRows;
};

/**
 * A mock of the row-number cell a consumer builds from the table's pieces: the cell takes the
 * press, which drags the row once it travels, and carries the drag indicator and the "+" above it.
 */
const MockRowNumberCell = ({
  index,
  dataTestId,
  onStartDrag,
  onInsertAt,
}: {
  index: number;
  dataTestId: string;
  onStartDrag: (index: number, event: DragStartEvent) => boolean;
  onInsertAt: (atIndex: number) => void;
}) => {
  const pressDrag = usePressDrag([index]);
  return (
    <td
      // `touch-none`: a touch that pans would cancel the press before it drags.
      className={cn(ROW_NUMBER_CELL_CLASS, 'touch-none')}
      data-row={index}
      onPointerDown={(event) =>
        pressDrag.press(event, event.button > 0 ? null : (move) => onStartDrag(index, move))
      }
    >
      <DragIndicator axis="row" testId={`${dataTestId}-row-drag-${index}`} />
      {index + 1}
      <EdgeInsertButton
        axis="row"
        testId={`${dataTestId}-insert-row-${index}`}
        onInsert={() => onInsertAt(index)}
      />
    </td>
  );
};

interface EditingGridProps {
  initialColumns: RuleColumn[];
  initialRows: RuleRow[];
  dataTestId: string;
  tableAriaLabel: string;
  /** Bounds the frame, so a large table windows; a small one leaves it out and fits its rows. */
  height?: number | string;
  /** What this story's data shows, ahead of the shared how-to. */
  caption: string;
}

/**
 * The full editing stack, composed the way the DMN editor composes it, shared by the End To End and
 * Large Table stories: a selection store (`useSelectionStore`),
 * useGridNavigation, GridCell for every cell, the grid-owned clipboard, row and column drag, the
 * edge "+" inserts, the band "+", the column menu and "Add row". The stories differ only in data.
 */
const EditingGrid = ({
  initialColumns,
  initialRows,
  dataTestId,
  tableAriaLabel,
  height,
  caption,
}: EditingGridProps) => {
  const [rows, setRows] = useState(initialRows);
  const [specs, setSpecs] = useState(initialColumns);
  const [menu, setMenu] = useState<{ anchor: { x: number; y: number }; columnId: string } | null>(
    null
  );
  const gridRef = useRef<GridHandle>(null);
  const nextId = useRef(1);
  const table = useSelectionStore();
  const rowIds = useMemo(() => rows.map((row) => row.id), [rows]);
  const colIds = useMemo(() => specs.map((column) => column.id), [specs]);
  const nav = useGridNavigation({ table, rowIds, colIds });
  const headerPressDrag = usePressDrag([specs]);
  const inputCount = specs.filter((spec) => spec.kind === 'input').length;
  const outputCount = specs.filter((spec) => spec.kind === 'output').length;

  const newRow = (): RuleRow => ({ id: `${dataTestId}-row-${nextId.current++}`, cells: {} });

  /** Inserts a column of `kind` at `atIndex` in `specs`, or at the end of its band. */
  const insertColumn = useCallback((kind: Kind, atIndex?: number) => {
    setSpecs((current) => {
      const id = `${kind}-${nextId.current++}`;
      const index =
        atIndex ??
        (kind === 'input' ? 1 + current.filter((s) => s.kind === 'input').length : current.length);
      return [...current.slice(0, index), { id, name: id, kind }, ...current.slice(index)];
    });
  }, []);

  const deleteColumn = (id: string) => {
    setSpecs((current) => current.filter((spec) => spec.id !== id));
    setRows((current) =>
      current.map(({ cells: { [id]: _removed, ...cells }, ...row }) => ({ ...row, cells }))
    );
  };

  const groups = useMemo(() => {
    const groupFor = (kind: Kind): GridColumnGroup => ({
      id: `${kind}s`,
      label: kind === 'input' ? 'Inputs' : 'Outputs',
      toneClassName: GROUP_TONE_CLASS[kind === 'input' ? 'inputs' : 'outputs'],
      // The band's end drops its border, so it never cuts the point.
      cellProps: (run) => ({
        ...(run.endsGroup && { className: 'border-r-0' }),
        ...(kind === 'output' && run.startsGroup && { style: BREADCRUMB_POINT_STYLE }),
      }),
      renderLabel: ({ isFirstRunOfGroup, label }) => (
        <span className={BAND_LABEL_ROW_CLASS}>
          <span className="min-w-0 truncate">{label}</span>
          {isFirstRunOfGroup && (
            <Button
              variant="ghost"
              size="4xs"
              icon
              className="shrink-0"
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
    () =>
      specs.map((column) => ({
        id: column.id,
        name: column.name,
        defaultWidth: column.kind === 'annotation' ? 180 : 150,
        group: groups[column.kind],
      })),
    [specs, groups]
  );

  const menuEntries = (): GridMenuEntry[] => {
    const index = specs.findIndex((spec) => spec.id === menu?.columnId);
    const spec = specs[index];
    if (!spec || spec.kind === 'annotation') {
      return [];
    }
    const kind = spec.kind;
    const lastOfKind = specs.filter((s) => s.kind === kind).length === 1;
    return [
      { label: 'Insert column left', onClick: () => insertColumn(kind, index) },
      { label: 'Insert column right', onClick: () => insertColumn(kind, index + 1) },
      { divider: true },
      { label: 'Delete column', disabled: lastOfKind, onClick: () => deleteColumn(spec.id) },
    ];
  };

  const writeCell = (row: number, col: number, text: string) => {
    setRows((current) =>
      current.map((entry, index) =>
        index === row ? { ...entry, cells: { ...entry.cells, [colIds[col]!]: text } } : entry
      )
    );
  };

  const rect = nav.range ? normalizedRect(nav.range) : null;

  return (
    // A flex column, so the table pane (`flex-1 min-h-0`) is bounded and both axes window.
    <div style={{ height, display: 'flex', flexDirection: 'column' }}>
      <DecisionTable
        ref={gridRef}
        labels={labels}
        columns={columns}
        rowCount={rows.length}
        leadingColumnWidth={ROW_NUMBER_WIDTH}
        // Unpinned: a pinned rule name would paint over half the first input's "+".
        pinnedColumnCount={0}
        initialColumnWidths={{}}
        columnsResizable
        tableAriaLabel={tableAriaLabel}
        dataTestId={dataTestId}
        headerEdgeInserts
        // The rule name is a band of its own, so its column never moves.
        columnGroupSizes={[1, inputCount, outputCount]}
        onRowMove={(from, to) => {
          if (to !== from) {
            setRows((current) => moveItem(current, from, to));
          }
        }}
        onColumnMove={(groupIndex, from, to) => {
          if (groupIndex !== 0 && to !== from) {
            const base = groupIndex === 1 ? 1 : 1 + inputCount;
            setSpecs((current) => moveItem(current, base + from, base + to));
          }
        }}
        retainedRowIndex={nav.editing ? nav.focus?.row : null}
        clipboard={{
          range: nav.range,
          editing: nav.editing,
          textAt: (row, col) => rows[row]?.cells[colIds[col]!] ?? '',
          onWrite: (writes, appendRows) => {
            setRows((current) => {
              const grown = [...current, ...Array.from({ length: appendRows }, newRow)];
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
            // A focused button (the band "+", "Add row") keeps its keys: Enter and Space click it,
            // and Tab moves focus rather than the selection.
            if (event.target instanceof Element && event.target.closest('button')) {
              return;
            }
            if ((event.key === 'Delete' || event.key === 'Backspace') && !nav.editing) {
              if (gridRef.current?.clipboard.clear()) {
                event.preventDefault();
                return;
              }
            }
            nav.onKeyDown(event);
          },
        }}
        renderHeaderCell={(column, { resizeHandle }) => {
          const index = specs.findIndex((spec) => spec.id === column.id);
          const kind = specs[index]?.kind;
          const draggable = kind === 'input' || kind === 'output';
          return (
            <th
              key={column.id}
              scope="col"
              className={cn(HEADER_CELL_CLASS, draggable && 'group/header touch-none')}
              onContextMenu={(event) => {
                event.preventDefault();
                if (draggable) {
                  setMenu({ anchor: { x: event.clientX, y: event.clientY }, columnId: column.id });
                }
              }}
              onPointerDown={(event) =>
                headerPressDrag.press(
                  event,
                  // The resize handle keeps its own presses.
                  !draggable ||
                    event.button > 0 ||
                    (event.target as Element).closest("[role='separator']")
                    ? null
                    : (move) =>
                        gridRef.current?.startColumnDrag(
                          kind === 'input' ? 1 : 2,
                          kind === 'input' ? index - 1 : index - 1 - inputCount,
                          move
                        ) ?? false
                )
              }
            >
              <div className={HEADER_LABEL_ROW_CLASS}>
                <span className="min-w-0 truncate">{column.name}</span>
              </div>
              {draggable && <VarsLine columnId={column.id} />}
              {resizeHandle}
              {draggable && <DragIndicator axis="column" />}
              {draggable && (
                <EdgeInsertButton
                  axis="column"
                  testId={`${dataTestId}-insert-column-${column.id}`}
                  onInsert={() => insertColumn(kind, index)}
                />
              )}
            </th>
          );
        }}
        renderRow={(rowIndex, visibleColumns) => (
          <tr
            key={rows[rowIndex]?.id ?? rowIndex}
            className="group/row"
            aria-rowindex={rowIndex + 3}
            style={{ height: 'var(--grid-row-height)' }}
          >
            <MockRowNumberCell
              index={rowIndex}
              dataTestId={dataTestId}
              onStartDrag={(index, event) => gridRef.current?.startRowDrag(index, event) ?? false}
              onInsertAt={(atIndex) =>
                setRows((current) => [
                  ...current.slice(0, atIndex),
                  newRow(),
                  ...current.slice(atIndex),
                ])
              }
            />
            {visibleColumns.map((visible) => {
              if (visible.type !== 'column') {
                return renderFillerCell(visible);
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
              return (
                <GridCell
                  key={columnId}
                  value={rows[rowIndex]?.cells[columnId] ?? ''}
                  placeholder={columnId === ANNOTATION_COLUMN_ID ? 'Name this rule…' : undefined}
                  mono={columnId !== ANNOTATION_COLUMN_ID}
                  row={rowIndex}
                  col={col}
                  selected={isFocus}
                  inRange={inRange && !isFocus}
                  editing={nav.editing && isFocus}
                  openedByTyping={nav.openedByTyping}
                  focusable
                  tabStop={isFocus || (rowIndex === 0 && col === 0 && !nav.focus)}
                  className={cn(visible.column.group?.id === 'outputs' && OUTPUT_CELL_TINT_CLASS)}
                  dataTestId={`${dataTestId}-cell-${rowIndex}-${col}`}
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
        renderFooterRow={(colSpan) => (
          <tr key="add-row">
            <td
              className="cursor-pointer p-0 hover:bg-surface-hover"
              colSpan={colSpan}
              onClick={() => setRows((current) => [...current, newRow()])}
            >
              <Button variant="text" size="xs" className={FOOTER_ACTION_CLASS}>
                <Plus aria-hidden />
                Add row
              </Button>
            </td>
          </tr>
        )}
      />
      <GridContextMenu
        label="Column menu"
        dataTestId={dataTestId}
        state={menu}
        entries={menuEntries}
        onClose={() => setMenu(null)}
      />
      <p className="mt-2 text-sm text-foreground-de-emp">
        {caption} Click to select, double-click or just type to edit; Enter/Tab commit and move,
        Escape cancels; Shift+arrows extend the range; Ctrl/Cmd+C/X/V round-trip TSV; Delete clears
        the selection. Drag a row number or a header to reorder; the + on a row number's top edge or
        a header's left edge inserts there, and the + on each band appends a column. Right-click a
        header for insert/delete. "Add row" sits after the last rule.
      </p>
    </div>
  );
};

export const TopLeftCorner: Story = {
  name: 'Top Left Corner (Policy Picker)',
  render: () => (
    <DemoGrid
      topLeftCorner={<HitPolicyPicker />}
      caption="The top-left corner holds a hit policy picker passed as topLeftCorner: the table draws the cell, the consumer only its content."
    />
  ),
};

export const EndToEnd: Story = {
  render: () => (
    <EditingGrid
      initialColumns={E2E_COLUMNS}
      initialRows={E2E_ROWS}
      dataTestId="e2e-grid"
      tableAriaLabel="End-to-end decision grid"
      caption="A small table on the full editing stack."
    />
  ),
};

export const LargeTable: Story = {
  render: () => (
    <EditingGrid
      initialColumns={LARGE_COLUMNS}
      initialRows={getLargeRows()}
      dataTestId="large-grid"
      tableAriaLabel="Large decision grid"
      height="70vh"
      caption={`${LARGE_ROW_COUNT} rules over ${LARGE_INPUT_COUNT} inputs and ${LARGE_COLUMNS.length - 1 - LARGE_INPUT_COUNT} outputs of mock values, on the same editing stack.`}
    />
  ),
};
