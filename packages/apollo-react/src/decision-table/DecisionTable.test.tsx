import { act, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { vi } from 'vitest';
import { BODY_ROW_HEIGHT_PX } from './constants';
import {
  DecisionTable,
  type DecisionTableProps,
  groupBoundsOf,
  groupColumnRuns,
  type HeaderCellContext,
} from './DecisionTable';
import type { GridColumn, GridColumnGroup, GridHandle, VisibleGridColumn } from './gridTypes';

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
  groupColumnRuns(groupBoundsOf(columns), visible, pinnedLeftPxOf).flatMap((run) =>
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

  it('lifts the corner over the scrolled header cells', () => {
    renderTable();
    expect(corners()[0]).toHaveClass('z-5');
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

  it('hands a pinned header its offset and its layer class, and a scrolling header neither', () => {
    const contexts = new Map<string, HeaderCellContext>();
    renderTable({
      pinnedColumnCount: 1,
      renderHeaderCell: (column, context) => {
        contexts.set(column.id, context);
        return <th key={column.id}>{column.name}</th>;
      },
    });
    expect(contexts.get('a0')).toMatchObject({ pinnedLeftPx: 52, pinnedClassName: 'z-5' });
    expect(contexts.get('a1')).toMatchObject({
      pinnedLeftPx: undefined,
      pinnedClassName: undefined,
    });
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

// happy-dom has no `rows` on a table section, which the drag code reads; browsers all have it.
if (!('rows' in HTMLTableSectionElement.prototype)) {
  Object.defineProperty(HTMLTableSectionElement.prototype, 'rows', {
    get(this: HTMLTableSectionElement) {
      return Array.from(this.children).filter((child) => child instanceof HTMLTableRowElement);
    },
  });
}

// Rows as the `renderRow` contract asks: `aria-rowindex` past the two header rows, and a `data-row` cell.
const renderContractTable = (props: Partial<DecisionTableProps> = {}) => {
  const ref = createRef<GridHandle>();
  const onRowMove = vi.fn();
  const onColumnMove = vi.fn();
  render(
    <DecisionTable
      ref={ref}
      columns={columns}
      rowCount={3}
      leadingColumnWidth={52}
      columnGroupSizes={[3, 1]}
      onRowMove={onRowMove}
      onColumnMove={onColumnMove}
      renderHeaderCell={(column) => <th key={column.id}>{column.name}</th>}
      renderRow={(rowIndex, visibleColumns) => (
        <tr key={rowIndex} aria-rowindex={rowIndex + 3}>
          <td data-row={rowIndex} data-testid={`row-${rowIndex}`} />
          {visibleColumns.map((visible) =>
            visible.type === 'column' ? (
              <td key={visible.column.id}>{`${visible.column.id}-${rowIndex}`}</td>
            ) : (
              <td key={visible.type} />
            )
          )}
        </tr>
      )}
      dataTestId="table"
      labels={{ resizeColumn: (name) => `Resize ${name}`, resetColumnWidth: 'Reset width' }}
      {...props}
    />
  );
  return { handle: () => ref.current!, onRowMove, onColumnMove };
};

const press = (clientX: number, clientY: number) => ({
  clientX,
  clientY,
  preventDefault: () => undefined,
});
const pointer = (type: string, clientX = 0, clientY = 0) =>
  act(() => {
    document.dispatchEvent(new MouseEvent(type, { bubbles: true, clientX, clientY, buttons: 1 }));
  });
const rowAt = (index: number) => screen.getByTestId(`row-${index}`).parentElement!;
const preview = () => screen.getByTestId('table-drag-preview');
const overlay = () => screen.getByTestId('table-row-hover');
// Below the middle of row `index`, which happy-dom draws under a header of no height.
const yInRow = (index: number) => index * BODY_ROW_HEIGHT_PX + BODY_ROW_HEIGHT_PX * 0.6;

describe('DecisionTable row drag', () => {
  it('drops the row where the pointer leaves it', () => {
    const { handle, onRowMove } = renderContractTable();

    act(() => {
      expect(handle().startRowDrag(0, press(0, yInRow(0)))).toBe(true);
    });
    pointer('pointermove', 0, yInRow(1));
    expect(screen.getByTestId('table-drop-indicator')).toBeInTheDocument();
    pointer('pointerup');

    expect(onRowMove).toHaveBeenCalledWith(0, 1);
    expect(screen.queryByTestId('table-drop-indicator')).toBeNull();
  });

  it('floats a copy of the row, blanks the source and parts the rows it passes, all until the drop', () => {
    const { handle } = renderContractTable();

    act(() => {
      handle().startRowDrag(0, press(0, yInRow(0)));
    });
    pointer('pointermove', 0, yInRow(1));

    expect(preview().querySelector('tr')).not.toBeNull();
    expect(rowAt(0)).toHaveAttribute('data-drag-source');
    expect(rowAt(1).style.transform).toBe(`translateY(${-BODY_ROW_HEIGHT_PX}px)`);

    pointer('pointerup');

    expect(preview().childElementCount).toBe(0);
    expect(rowAt(0)).not.toHaveAttribute('data-drag-source');
    expect(rowAt(1).style.transform).toBe('');
  });

  it.each([
    ['Escape', () => act(() => void fireEvent.keyDown(document, { key: 'Escape' }))],
    ['a cancelled pointer', () => pointer('pointercancel')],
  ])('puts everything back on %s, without moving the row', (_name, cancel) => {
    const { handle, onRowMove } = renderContractTable();
    act(() => {
      handle().startRowDrag(0, press(0, yInRow(0)));
    });
    pointer('pointermove', 0, yInRow(2));

    cancel();

    expect(onRowMove).not.toHaveBeenCalled();
    expect(preview().childElementCount).toBe(0);
    expect(rowAt(0)).not.toHaveAttribute('data-drag-source');
    expect(rowAt(1).style.transform).toBe('');
    expect(rowAt(2).style.transform).toBe('');
  });

  it('still drops a row whose rows carry no aria-rowindex, with no copy to float', () => {
    const { handle, onRowMove } = renderContractTable({
      renderRow: (rowIndex) => (
        <tr key={rowIndex}>
          <td data-row={rowIndex} />
        </tr>
      ),
    });

    act(() => {
      handle().startRowDrag(0, press(0, yInRow(0)));
    });
    pointer('pointermove', 0, yInRow(1));
    expect(preview().childElementCount).toBe(0);
    pointer('pointerup');

    expect(onRowMove).toHaveBeenCalledWith(0, 1);
  });
});

describe('DecisionTable column drag', () => {
  it('puts the rows back when a column drag replaces a row drag in flight', () => {
    const { handle } = renderContractTable();
    act(() => {
      handle().startRowDrag(0, press(0, yInRow(0)));
    });
    pointer('pointermove', 0, yInRow(2));
    expect(rowAt(1).style.transform).not.toBe('');

    act(() => {
      handle().startColumnDrag(0, 0, press(60, 10));
    });
    pointer('pointerup');

    expect([0, 1, 2].map((index) => rowAt(index).style.transform)).toEqual(['', '', '']);
  });

  it('parts and floats the dragged header in a flat table, whose label row has the corner', () => {
    const { handle } = renderContractTable({
      columns: columns.map(({ group: _group, ...column }) => column),
      renderRow: (rowIndex, visibleColumns) => (
        <tr key={rowIndex} aria-rowindex={rowIndex + 2}>
          <td data-row={rowIndex} />
          {visibleColumns.map((visible) =>
            visible.type === 'column' ? <td key={visible.column.id} /> : <td key={visible.type} />
          )}
        </tr>
      ),
    });
    const header = (name: string) => screen.getByRole('columnheader', { name });

    act(() => {
      handle().startColumnDrag(0, 0, press(60, 10));
    });
    pointer('pointermove', 5000, 10);

    expect(preview().querySelector('thead')).toHaveTextContent('a0');
    expect(header('a0').style.transform).toMatch(/^translateX\(\d/);
    expect(header('a1').style.transform).toMatch(/^translateX\(-/);
    pointer('pointerup');
  });

  it('refuses a column drag when the table declares no groups', () => {
    const { handle } = renderContractTable({ columnGroupSizes: undefined });

    let began = true;
    act(() => {
      began = handle().startColumnDrag(0, 0, press(60, 10));
    });

    expect(began).toBe(false);
    expect(screen.queryByTestId('table-drop-indicator')).toBeNull();
  });

  it('floats the dragged column under its own header in a grouped table', () => {
    const { handle } = renderContractTable();

    act(() => {
      handle().startColumnDrag(0, 1, press(160, 10));
    });
    pointer('pointermove', 170, 10);

    expect(preview().querySelector('thead')).toHaveTextContent('a1');
    expect(preview().querySelector('tbody')).toHaveTextContent('a1-0');
    pointer('pointerup');
  });

  it('keeps the copy and its lines off the band row, wherever the table is scrolled', () => {
    const { handle } = renderContractTable();
    const container = screen.getByTestId('table');
    const labelRow = container.querySelector('thead')!.rows[1]!;
    Object.defineProperty(labelRow, 'offsetTop', { configurable: true, value: 33 });

    act(() => {
      handle().startColumnDrag(0, 1, press(160, 10));
    });
    pointer('pointermove', 170, 10);
    expect(preview().style.clipPath).toBe('inset(33px -32px -32px)');
    expect(screen.getByTestId('table-drop-indicator').style.clipPath).toBe(
      'inset(33px -32px -32px)'
    );

    container.scrollTop = 200;
    fireEvent.scroll(container);
    expect(preview().style.clipPath).toBe('inset(233px -32px -32px)');
    expect(screen.getByTestId('table-drop-indicator').style.clipPath).toBe(
      'inset(233px -32px -32px)'
    );

    pointer('pointerup');
    expect(preview().style.clipPath).toBe('');
  });

  it('keeps a column inside its own band, however far it is carried', () => {
    const { handle, onColumnMove } = renderContractTable();

    act(() => {
      handle().startColumnDrag(0, 0, press(60, 10));
    });
    pointer('pointermove', 5000, 10);
    pointer('pointerup');

    expect(onColumnMove).toHaveBeenCalledWith(0, 0, 2);
  });
});

describe('DecisionTable row hover', () => {
  it('follows the hovered data row', () => {
    renderContractTable();

    fireEvent.pointerOver(screen.getByTestId('row-1'), { pointerType: 'mouse' });

    expect(overlay().style.display).toBe('');
    expect(overlay().style.transform).toBe(`translateY(${BODY_ROW_HEIGHT_PX}px)`);
  });

  it('stays hidden during a drag, whose rows are out of their places', () => {
    const { handle } = renderContractTable();
    act(() => {
      handle().startRowDrag(0, press(0, yInRow(0)));
    });

    fireEvent.pointerOver(screen.getByTestId('row-1'), { pointerType: 'mouse' });

    expect(overlay().style.display).toBe('none');
    pointer('pointerup');
  });
});

describe('DecisionTable header edge inserts', () => {
  const renderResizable = (headerEdgeInserts: boolean) =>
    renderContractTable({
      columnsResizable: true,
      headerEdgeInserts,
      renderHeaderCell: (column, context) => (
        <th key={column.id}>
          {column.name}
          {context.resizeHandle}
        </th>
      ),
    });

  it('starts the resize handles below the "+" only when the headers carry one', () => {
    renderResizable(true);
    expect(screen.getByTestId('table-resize-a0')).toHaveClass('top-6');
  });

  it('keeps the resize handles full height otherwise', () => {
    renderResizable(false);
    expect(screen.getByTestId('table-resize-a0')).not.toHaveClass('top-6');
  });
});

describe('DecisionTable table mark', () => {
  const tableMark = () => screen.queryByTestId('table-table-mark');

  it('draws no mark in the corner without one', () => {
    renderTable();
    expect(tableMark()).toBeNull();
  });

  it("draws the table's mark in the corner, under the corner content, carrying its message", () => {
    renderTable({
      topLeftCorner: <span data-testid="policy">U</span>,
      tableMark: { tone: 'error', title: 'The decision has no rules' },
    });

    const mark = tableMark()!;
    expect(corners()[0]).toContainElement(mark);
    expect(
      screen.getByTestId('policy').compareDocumentPosition(mark) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(mark).toHaveAttribute('data-mark-title', 'The decision has no rules');
    expect(mark).toHaveAttribute('aria-label', 'The decision has no rules');
    expect(mark.querySelector('[data-glyph="error"]')).not.toBeNull();
  });

  it("shows a warning's own glyph", () => {
    renderTable({ tableMark: { tone: 'warning', title: 'Unchecked output values' } });
    expect(tableMark()!.querySelector('[data-glyph="warning"]')).not.toBeNull();
  });

  it.each([
    ['a success, which has no glyph', { tone: 'success' as const, title: 'All rules pass' }],
    ['a mark with no message', { tone: 'error' as const }],
  ])('draws nothing for %s', (_case, mark) => {
    renderTable({ tableMark: mark });
    expect(tableMark()).toBeNull();
  });

  it('draws nothing for a mark with no tone', () => {
    renderTable({ tableMark: { title: 'Nothing to flag' } });
    expect(tableMark()).toBeNull();
  });
});
