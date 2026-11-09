import { act, fireEvent, render, screen } from '@testing-library/react';
import { createRef, StrictMode } from 'react';
import { vi } from 'vitest';
import { BODY_ROW_HEIGHT_PX } from './constants';
import { DecisionTable, type DecisionTableProps } from './DecisionTable';
import type { GridColumn, GridColumnGroup, GridHandle } from './gridTypes';

// happy-dom has no `rows` on a table section, which the drag code reads; browsers all have it.
if (!('rows' in HTMLTableSectionElement.prototype)) {
  Object.defineProperty(HTMLTableSectionElement.prototype, 'rows', {
    get(this: HTMLTableSectionElement) {
      return Array.from(this.children).filter((child) => child instanceof HTMLTableRowElement);
    },
  });
}

const inputs: GridColumnGroup = { id: 'inputs', label: 'Inputs' };
const outputs: GridColumnGroup = { id: 'outputs', label: 'Outputs' };
const columns: GridColumn[] = [
  { id: 'a0', name: 'a0', defaultWidth: 100, group: inputs },
  { id: 'a1', name: 'a1', defaultWidth: 100, group: inputs },
  { id: 'a2', name: 'a2', defaultWidth: 100, group: inputs },
  { id: 'b0', name: 'b0', defaultWidth: 100, group: outputs },
];
const H = BODY_ROW_HEIGHT_PX;

const setup = (props: Partial<DecisionTableProps> = {}, strict = false) => {
  const ref = createRef<GridHandle>();
  const onRowMove = vi.fn();
  const onColumnMove = vi.fn();
  const onKeyDown = vi.fn();
  const element = (extra: Partial<DecisionTableProps> = {}) => {
    const table = (
      <DecisionTable
        ref={ref}
        columns={columns}
        rowCount={3}
        leadingColumnWidth={52}
        columnGroupSizes={[3, 1]}
        onRowMove={onRowMove}
        onColumnMove={onColumnMove}
        containerProps={{ onKeyDown }}
        renderHeaderCell={(column) => <th key={column.id}>{column.name}</th>}
        renderRow={(rowIndex, visibleColumns) => (
          <tr key={rowIndex} aria-rowindex={rowIndex + 3}>
            <td data-row={rowIndex} data-testid={`row-${rowIndex}`} />
            {visibleColumns.map((visible) =>
              visible.type === 'column' ? (
                <td key={visible.column.id} data-testid={`cell-${rowIndex}-${visible.column.id}`}>
                  {`${visible.column.id}-${rowIndex}`}
                </td>
              ) : (
                <td key={`${visible.type}`} />
              )
            )}
          </tr>
        )}
        dataTestId="table"
        labels={{ resizeColumn: (name) => `Resize ${name}`, resetColumnWidth: 'Reset width' }}
        {...props}
        {...extra}
      />
    );
    return strict ? <StrictMode>{table}</StrictMode> : table;
  };
  const utils = render(element());
  return {
    handle: () => ref.current!,
    onRowMove,
    onColumnMove,
    onKeyDown,
    rerender: (extra: Partial<DecisionTableProps>) => utils.rerender(element(extra)),
    unmount: utils.unmount,
  };
};

const press = (clientX: number, clientY: number) => ({
  clientX,
  clientY,
  preventDefault: () => undefined,
});
const pointer = (type: string, clientX = 0, clientY = 0, init: PointerEventInit = {}) =>
  act(() => {
    document.dispatchEvent(
      new PointerEvent(type, { bubbles: true, clientX, clientY, buttons: 1, ...init })
    );
  });
const container = () => screen.getByTestId('table');
const scrollTo = (top: number) =>
  act(() => {
    container().scrollTop = top;
    container().dispatchEvent(new Event('scroll'));
  });

describe('DecisionTable drag: the drop slot', () => {
  it('swaps a row lifted onto the row above, wherever it was grabbed', () => {
    const { handle, onRowMove } = setup();
    const grabY = 2 * H + H - 4; // row 2, 4px above its bottom
    act(() => {
      handle().startRowDrag(2, { ...press(0, grabY - H), press: { clientX: 0, clientY: grabY } });
    });
    pointer('pointermove', 0, grabY - H); // the copy now sits exactly on row 1's slot
    pointer('pointerup', 0, grabY - H);
    expect(onRowMove).toHaveBeenCalledWith(2, 1);
  });

  it('swaps a row moved onto the row below, wherever it was grabbed', () => {
    const { handle, onRowMove } = setup();
    const grabY = 4; // row 0, 4px below its top
    act(() => {
      handle().startRowDrag(0, { ...press(0, grabY + H), press: { clientX: 0, clientY: grabY } });
    });
    pointer('pointermove', 0, grabY + H);
    pointer('pointerup', 0, grabY + H);
    expect(onRowMove).toHaveBeenCalledWith(0, 1);
  });

  it('dispatches nothing for a drop back home', () => {
    const { handle, onRowMove } = setup();
    act(() => {
      handle().startRowDrag(1, press(0, H * 1.6));
    });
    pointer('pointermove', 0, H * 0.2);
    // Back where it was pressed: the copy sits on its own row again.
    pointer('pointermove', 0, H * 1.6);
    pointer('pointerup');
    expect(onRowMove).not.toHaveBeenCalled();
  });
});

describe('DecisionTable drag: what changes under it', () => {
  it('retargets the drop when the table scrolls under a still pointer', () => {
    const { handle, onRowMove } = setup({ rowCount: 50 });
    act(() => {
      handle().startRowDrag(0, press(0, H * 1.6));
    });
    pointer('pointermove', 0, H * 1.6); // slot 2 -> to 1
    scrollTo(10 * H); // the copy now sits over row 10
    pointer('pointerup', 0, H * 1.6);
    expect(onRowMove).toHaveBeenCalledWith(0, 10);
  });

  it('cancels the drag when rows are removed under it', () => {
    const { handle, onRowMove, rerender } = setup({ rowCount: 10 });
    act(() => {
      handle().startRowDrag(0, press(0, H * 0.6));
    });
    pointer('pointermove', 0, 10 * H); // bottom slot
    rerender({ rowCount: 3 });
    pointer('pointerup', 0, 10 * H);
    expect(onRowMove).not.toHaveBeenCalled();
  });

  it('cancels the drag when a row is inserted under it', () => {
    const { handle, onRowMove, rerender } = setup({ rowCount: 3 });
    act(() => {
      handle().startRowDrag(2, press(0, 2.6 * H));
    });
    pointer('pointermove', 0, 0.2 * H);
    rerender({ rowCount: 4 }); // consumer inserted a row at 0; the dragged row is now index 3
    pointer('pointerup', 0, 0.2 * H);
    expect(onRowMove).not.toHaveBeenCalled();
  });

  it('keeps the dragged row mounted and blanked through a far scroll', () => {
    const { handle } = setup({ rowCount: 500 });
    act(() => {
      handle().startRowDrag(0, press(0, H * 0.6));
    });
    pointer('pointermove', 0, H * 1.6);
    scrollTo(400 * H);
    scrollTo(0);
    expect(screen.getByTestId('row-0').parentElement).toHaveAttribute('data-drag-source');
    pointer('pointerup');
  });

  it("blanks the dragged column's cells in rows that mount mid-drag", () => {
    const { handle } = setup({ rowCount: 500 });
    act(() => {
      handle().startColumnDrag(0, 1, press(160, 10));
    });
    pointer('pointermove', 170, 10);
    scrollTo(400 * H);
    const late = screen.getByTestId('cell-400-a1');
    expect(late).toHaveAttribute('data-drag-source');
    pointer('pointerup');
  });

  it('copies the rows a scroll mounts into the floating column, without their drag marks', () => {
    const { handle } = setup({ rowCount: 500 });
    act(() => {
      handle().startColumnDrag(0, 1, press(160, 10));
    });
    pointer('pointermove', 170, 10);
    scrollTo(400 * H);
    const copy = screen.getByTestId('table-drag-preview');
    expect(copy).toHaveTextContent('a1-400');
    expect(copy.querySelector('[data-drag-source]')).toBeNull();
    expect(
      Array.from(copy.querySelectorAll<HTMLElement>('td, th')).some((cell) => cell.style.transform)
    ).toBe(false);
    pointer('pointerup');
  });
});

describe('DecisionTable drag: where it can start and land', () => {
  it.each([-1, 3, 1.5])('refuses a row drag from row %d, which the table does not have', (row) => {
    const { handle, onRowMove } = setup();
    let began = true;
    act(() => {
      began = handle().startRowDrag(row, press(0, H * 0.6));
    });
    pointer('pointermove', 0, H * 2.6);
    pointer('pointerup', 0, H * 2.6);
    expect(began).toBe(false);
    expect(onRowMove).not.toHaveBeenCalled();
  });

  it.each([
    [-1, 0],
    [2, 0],
    [1, 1],
    [0, 3],
    [0, -1],
  ])('refuses a column drag from group %d, column %d, which the table does not have', (group, index) => {
    const { handle, onColumnMove } = setup();
    let began = true;
    act(() => {
      began = handle().startColumnDrag(group, index, press(60, 10));
    });
    pointer('pointermove', 5000, 10);
    pointer('pointerup', 5000, 10);
    expect(began).toBe(false);
    expect(onColumnMove).not.toHaveBeenCalled();
  });

  it('caps overcounting group sizes at the unpinned columns, the only ones a drag moves', () => {
    const { handle, onColumnMove } = setup({ pinnedColumnCount: 2, columnGroupSizes: [4] });
    let began = true;
    act(() => {
      began = handle().startColumnDrag(0, 2, press(360, 10));
    });
    expect(began).toBe(false);
    act(() => {
      handle().startColumnDrag(0, 0, press(260, 10)); // a2, the first unpinned column
    });
    pointer('pointermove', 5000, 10);
    pointer('pointerup', 5000, 10);
    expect(onColumnMove).toHaveBeenCalledWith(0, 0, 1);
  });

  it('moves a column one slot along a later group, past the groups before it', () => {
    const outputColumns = ['b0', 'b1', 'b2'].map((id) => ({
      id,
      name: id,
      defaultWidth: 100,
      group: outputs,
    }));
    const { handle, onColumnMove } = setup({
      columns: [...columns.slice(0, 2), ...outputColumns],
      columnGroupSizes: [2, 3],
    });
    act(() => {
      handle().startColumnDrag(1, 0, press(260, 10)); // b0, 8px into it
    });
    pointer('pointermove', 360, 10); // the copy now sits exactly on b1's slot
    pointer('pointerup', 360, 10);
    expect(onColumnMove).toHaveBeenCalledWith(1, 0, 1);
  });

  it('carries a wide column past narrow neighbours to the end of its band', () => {
    const { handle, onColumnMove } = setup({
      columns: columns.map((column, index) =>
        index === 0 ? { ...column, defaultWidth: 300 } : column
      ),
    });
    act(() => {
      handle().startColumnDrag(0, 0, press(100, 10));
    });
    pointer('pointermove', 5000, 10);
    pointer('pointerup', 5000, 10);
    expect(onColumnMove).toHaveBeenCalledWith(0, 0, 2);
  });
});

describe('DecisionTable drag: ways it ends', () => {
  it('keeps every key from the grid while a row is carried', () => {
    const { handle, onKeyDown } = setup();
    act(() => {
      handle().startRowDrag(0, press(0, H * 0.6));
    });
    pointer('pointermove', 0, H * 1.6);
    fireEvent.keyDown(container(), { key: 'a' });
    fireEvent.keyDown(container(), { key: 'Delete' });
    expect(onKeyDown).not.toHaveBeenCalled();
    pointer('pointerup');
  });

  it("blocks the browser's own key actions, cut and paste among them, while a row is carried", () => {
    const { handle } = setup();
    act(() => {
      handle().startRowDrag(0, press(0, H * 0.6));
    });
    pointer('pointermove', 0, H * 1.6);
    const cut = new KeyboardEvent('keydown', {
      key: 'x',
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });
    act(() => {
      container().dispatchEvent(cut);
    });
    expect(cut.defaultPrevented).toBe(true);
    pointer('pointerup');
  });

  it('cancels the drag when the window loses focus', () => {
    const { handle, onRowMove } = setup();
    act(() => {
      handle().startRowDrag(0, press(0, H * 0.6));
    });
    pointer('pointermove', 0, H * 2.6);
    act(() => {
      window.dispatchEvent(new Event('blur'));
    });
    pointer('pointerdown', 0, H * 2.6);
    pointer('pointerup', 0, H * 2.6);
    expect(onRowMove).not.toHaveBeenCalled();
  });

  it('ignores a second pointer lifting', () => {
    const { handle, onRowMove } = setup();
    act(() => {
      handle().startRowDrag(0, press(0, H * 0.6));
    });
    pointer('pointermove', 0, H * 2.6, { pointerId: 1 });
    pointer('pointerup', 0, 0, { pointerId: 2 });
    expect(onRowMove).not.toHaveBeenCalled();
    pointer('pointerup', 0, 0, { pointerId: 1 });
  });

  it('ignores a second pointer moving', () => {
    const { handle, onRowMove } = setup();
    act(() => {
      handle().startRowDrag(0, press(0, H * 0.6));
    });
    pointer('pointermove', 0, H * 0.6, { pointerId: 1 });
    pointer('pointermove', 0, H * 2.6, { pointerId: 2 });
    pointer('pointerup', 0, H * 0.6, { pointerId: 1 });
    expect(onRowMove).not.toHaveBeenCalled();
  });

  it('detaches every listener when the table unmounts mid-drag', () => {
    const add = vi.spyOn(document, 'addEventListener');
    const remove = vi.spyOn(document, 'removeEventListener');
    const { handle, onRowMove, unmount } = setup();
    act(() => {
      handle().startRowDrag(0, press(0, H * 0.6));
    });
    pointer('pointermove', 0, H * 2.6);
    const added = add.mock.calls.filter(
      ([t]) => String(t).startsWith('pointer') || t === 'keydown'
    );
    unmount();
    pointer('pointerup');
    const removed = remove.mock.calls.filter(
      ([t]) => String(t).startsWith('pointer') || t === 'keydown'
    );
    expect(onRowMove).not.toHaveBeenCalled();
    for (const [type, fn] of added) {
      expect(removed.some(([t, f]) => t === type && f === fn)).toBe(true);
    }
    add.mockRestore();
    remove.mockRestore();
  });

  it('drops once and cleans up under StrictMode', () => {
    const { handle, onRowMove } = setup({}, true);
    act(() => {
      handle().startRowDrag(0, press(0, H * 0.6));
    });
    pointer('pointermove', 0, H * 1.6);
    pointer('pointerup');
    expect(onRowMove).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('table-drag-preview').childElementCount).toBe(0);
    expect(screen.getByTestId('row-1').parentElement!.style.transform).toBe('');
  });
});
