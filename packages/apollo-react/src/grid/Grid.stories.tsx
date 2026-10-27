import type { Meta, StoryObj } from '@storybook/react';
import { Grid } from './Grid';
import type { GridColumn, GridColumnGroup } from './gridTypes';

const inputs: GridColumnGroup = {
  id: 'inputs',
  label: 'Inputs',
  toneClassName: 'bg-info-background',
};
const outputs: GridColumnGroup = {
  id: 'outputs',
  label: 'Outputs',
  toneClassName: 'bg-success-background',
};

const columns: GridColumn[] = [
  { id: 'age', name: 'age', defaultWidth: 160, group: inputs },
  { id: 'income', name: 'income', defaultWidth: 160, group: inputs },
  { id: 'risk', name: 'risk', defaultWidth: 180, group: outputs },
];

const rows = [
  ['< 25', '<= 40000', '"high"'],
  ['[25..60]', '> 40000', '"standard"'],
  ['> 60', '-', '"review"'],
];

const CELL = 'border border-border-de-emp px-2 py-1 text-sm';

const labels = {
  resizeColumn: (columnName: string) => `Resize column ${columnName}`,
  resetColumnWidth: 'Double-click to reset the column width',
};

const DemoGrid = ({ resizable = true }: { resizable?: boolean }) => (
  <div style={{ height: 320 }}>
    <Grid
      labels={labels}
      columns={columns}
      rowCount={rows.length}
      leadingColumnWidth={40}
      pinnedColumnCount={0}
      initialColumnWidths={{}}
      columnsResizable={resizable}
      tableAriaLabel="Demo decision grid"
      renderHeaderCell={(column) => (
        <th
          key={column.id}
          scope="col"
          className={`${CELL} bg-surface-raised text-left font-semibold`}
        >
          {column.name}
        </th>
      )}
      renderRow={(rowIndex, visibleColumns) => (
        <tr key={rowIndex}>
          <td className={`${CELL} bg-surface-raised text-center text-foreground-de-emp`}>
            {rowIndex + 1}
          </td>
          {visibleColumns.map((visible) =>
            visible.type === 'column' ? (
              <td key={visible.column.id} className={CELL}>
                {rows[rowIndex]?.[visible.flexIndex]}
              </td>
            ) : null
          )}
        </tr>
      )}
    />
  </div>
);

const meta: Meta<typeof DemoGrid> = {
  title: 'Grid',
  component: DemoGrid,
};
export default meta;

type Story = StoryObj<typeof DemoGrid>;

/** The virtualized spreadsheet grid underneath the decision table: banded groups, resizable columns. */
export const Default: Story = {};

export const FixedColumns: Story = { args: { resizable: false } };
