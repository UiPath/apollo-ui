import type { Meta, StoryObj } from '@storybook/react';
import { Button, cn } from '@uipath/apollo-wind';
import { Plus } from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { EMPTY_VALUE_DASH, ROW_NUMBER_WIDTH } from './constants';
import { Grid } from './Grid';
import { GridContextMenu, type GridMenuEntry } from './GridMenu';
import {
  BAND_ADD_COLUMN_CLASS,
  BAND_LABEL_ROW_CLASS,
  BODY_CELL_CLASS,
  GROUP_TONE_CLASS,
  HEADER_CELL_CLASS,
  OUTPUT_CELL_TINT_CLASS,
} from './gridStyles';
import type { GridColumn, GridColumnGroup } from './gridTypes';

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
  { age: '< 25', income: '<= 40000', risk: '"high"' },
  { age: '[25..60]', income: '> 40000', risk: '"standard"' },
  { age: '> 60', income: '-', risk: '"review"' },
];

const labels = {
  resizeColumn: (columnName: string) => `Resize column ${columnName}`,
  resetColumnWidth: 'Double-click to reset the column width',
};

/**
 * A consumer in miniature: everything visual and interactive comes from the package — the header
 * and cell styles, the group bands with their "+" add buttons, the right-click column menu, the
 * resize handles. The consumer supplies only the data and what the actions mean.
 */
const DemoGrid = ({ resizable = true }: { resizable?: boolean }) => {
  const [specs, setSpecs] = useState(INITIAL_COLUMNS);
  const [rows, setRows] = useState(INITIAL_ROWS);
  const [menu, setMenu] = useState<{ anchor: { x: number; y: number }; columnId: string } | null>(
    null
  );
  const nextId = useRef(1);

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
    return { input: groupFor('input'), output: groupFor('output') };
  }, [insertColumn]);

  const columns: GridColumn[] = useMemo(
    () =>
      specs.map((spec) => ({
        id: spec.id,
        name: spec.name,
        defaultWidth: 160,
        group: groups[spec.kind],
      })),
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
      <Grid
        labels={labels}
        columns={columns}
        rowCount={rows.length}
        leadingColumnWidth={ROW_NUMBER_WIDTH}
        pinnedColumnCount={0}
        initialColumnWidths={{}}
        columnsResizable={resizable}
        tableAriaLabel="Demo decision grid"
        renderHeaderCell={(column, { resizeHandle, pinnedLeftPx }) => (
          <th
            key={column.id}
            scope="col"
            className={cn(HEADER_CELL_CLASS, pinnedLeftPx !== undefined && 'z-3')}
            style={pinnedLeftPx !== undefined ? { left: pinnedLeftPx } : undefined}
            onContextMenu={(event) => {
              event.preventDefault();
              setMenu({ anchor: { x: event.clientX, y: event.clientY }, columnId: column.id });
            }}
          >
            {column.name}
            {resizeHandle}
          </th>
        )}
        renderRow={(rowIndex, visibleColumns) => (
          <tr key={rowIndex}>
            <td className={cn(BODY_CELL_CLASS, 'px-2 py-1 text-center text-foreground-de-emp')}>
              {rowIndex + 1}
            </td>
            {visibleColumns.map((visible) =>
              visible.type === 'column' ? (
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
              ) : null
            )}
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
        Right-click a column header for insert/delete; the + in each band appends a column.
      </p>
    </div>
  );
};

const meta: Meta<typeof Grid> = {
  title: 'Grid',
  component: Grid,
  parameters: { layout: 'padded' },
};
export default meta;

type Story = StoryObj<typeof Grid>;

export const Default: Story = {
  render: () => <DemoGrid />,
};

export const FixedColumns: Story = {
  render: () => <DemoGrid resizable={false} />,
};
