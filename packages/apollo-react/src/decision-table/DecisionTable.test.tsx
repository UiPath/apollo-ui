import { fireEvent, render, screen } from '@testing-library/react';
import { DecisionTable, type DecisionTableProps, groupColumnRuns } from './DecisionTable';
import type { GridColumn, GridColumnGroup, VisibleGridColumn } from './gridTypes';

const inputs: GridColumnGroup = { id: 'inputs', label: 'Inputs' };
const outputs: GridColumnGroup = { id: 'outputs', label: 'Outputs' };
const columns: GridColumn[] = [
  { id: 'a0', name: 'a0', defaultWidth: 100, group: inputs },
  { id: 'a1', name: 'a1', defaultWidth: 100, group: inputs },
  { id: 'a2', name: 'a2', defaultWidth: 100, group: inputs },
  { id: 'b0', name: 'b0', defaultWidth: 100, group: outputs },
];

const mounted = (flexIndex: number): VisibleGridColumn => ({
  type: 'column',
  column: columns[flexIndex]!,
  flexIndex,
  windowIndex: flexIndex,
  omitBorders: [],
});
const spacer = (...coveredIds: string[]): VisibleGridColumn => ({
  type: 'spacer',
  widthPx: 100 * coveredIds.length,
  coveredIds,
  separatorPx: 0,
});

const groupRuns = (
  visible: VisibleGridColumn[],
  pinnedLeftPxOf: (flexIndex: number) => number | undefined = () => undefined
) =>
  groupColumnRuns(columns, visible, pinnedLeftPxOf).flatMap((run) =>
    run.type === 'group'
      ? [
          {
            group: run.group.id,
            first: run.first.id,
            isFirstRunOfGroup: run.isFirstRunOfGroup,
            startsGroup: run.startsGroup,
            endsGroup: run.endsGroup,
          },
        ]
      : []
  );

describe('groupColumnRuns', () => {
  it('gives a band split by a spacer its start on the first run and its end on the last', () => {
    expect(groupRuns([mounted(0), spacer('a1'), mounted(2), mounted(3)])).toEqual([
      {
        group: 'inputs',
        first: 'a0',
        isFirstRunOfGroup: true,
        startsGroup: true,
        endsGroup: false,
      },
      {
        group: 'inputs',
        first: 'a2',
        isFirstRunOfGroup: false,
        startsGroup: false,
        endsGroup: true,
      },
      {
        group: 'outputs',
        first: 'b0',
        isFirstRunOfGroup: true,
        startsGroup: true,
        endsGroup: true,
      },
    ]);
  });

  it('gives a band split by the pinned boundary its start and end on either side of it', () => {
    const pinnedFirst = (flexIndex: number) => (flexIndex === 0 ? 0 : undefined);
    expect(groupRuns([mounted(0), mounted(1), mounted(2), mounted(3)], pinnedFirst)).toEqual([
      {
        group: 'inputs',
        first: 'a0',
        isFirstRunOfGroup: true,
        startsGroup: true,
        endsGroup: false,
      },
      {
        group: 'inputs',
        first: 'a1',
        isFirstRunOfGroup: false,
        startsGroup: false,
        endsGroup: true,
      },
      {
        group: 'outputs',
        first: 'b0',
        isFirstRunOfGroup: true,
        startsGroup: true,
        endsGroup: true,
      },
    ]);
  });

  it('does not start a band scrolled past its first column, though its run is the first mounted', () => {
    expect(groupRuns([spacer('a0'), mounted(1), mounted(2), mounted(3)])).toEqual([
      {
        group: 'inputs',
        first: 'a1',
        isFirstRunOfGroup: true,
        startsGroup: false,
        endsGroup: true,
      },
      {
        group: 'outputs',
        first: 'b0',
        isFirstRunOfGroup: true,
        startsGroup: true,
        endsGroup: true,
      },
    ]);
  });
});

const renderTable = (props: Partial<DecisionTableProps> = {}) =>
  render(
    <DecisionTable
      columns={columns}
      rowCount={2}
      leadingColumnWidth={52}
      renderHeaderCell={(column) => <th key={column.id}>{column.name}</th>}
      renderRow={(rowIndex) => <tr key={rowIndex} />}
      dataTestId="table"
      labels={{ resizeColumn: (name) => `Resize ${name}`, resetColumnWidth: 'Reset width' }}
      {...props}
    />
  );

const corners = () => screen.queryAllByTestId('table-top-left-corner');

describe('DecisionTable', () => {
  it('draws one "#" corner spanning both header rows of a grouped table', () => {
    renderTable();
    expect(corners()).toHaveLength(1);
    expect(corners()[0]).toHaveTextContent('#');
    expect(corners()[0]).toHaveAttribute('rowspan', '2');
  });

  it('draws one corner spanning the single header row of a flat table', () => {
    renderTable({ columns: columns.map(({ group: _group, ...column }) => column) });
    expect(corners()).toHaveLength(1);
    expect(corners()[0]).toHaveAttribute('rowspan', '1');
  });

  it('puts the consumer content in the corner', () => {
    renderTable({ topLeftCorner: <button type="button">Hit policy</button> });
    expect(corners()[0]).toContainElement(screen.getByRole('button', { name: 'Hit policy' }));
    expect(corners()[0]).not.toHaveTextContent('#');
  });

  it('draws no corner without a leading column', () => {
    renderTable({ leadingColumnWidth: 0 });
    expect(corners()).toHaveLength(0);
  });

  it('marks the container scrolled only while rows sit under the header', () => {
    renderTable();
    const container = screen.getByTestId('table');
    expect(container).toHaveAttribute('data-scrolled', 'false');

    container.scrollTop = 40;
    fireEvent.scroll(container);
    expect(container).toHaveAttribute('data-scrolled', 'true');

    container.scrollTop = 0;
    fireEvent.scroll(container);
    expect(container).toHaveAttribute('data-scrolled', 'false');
  });

  it("merges a band cell's style, with the pinned offset winning over the consumer's left", () => {
    const pinnedInputs: GridColumnGroup = {
      ...inputs,
      cellProps: () => ({ 'data-testid': 'band-inputs', style: { left: 999, color: 'red' } }),
    };
    renderTable({
      pinnedColumnCount: 1,
      columns: columns.map((column) =>
        column.group === inputs ? { ...column, group: pinnedInputs } : column
      ),
    });
    const [pinnedRun] = screen.getAllByTestId('band-inputs');
    expect(pinnedRun).toHaveStyle({ left: '52px', color: 'red' });
  });
});
