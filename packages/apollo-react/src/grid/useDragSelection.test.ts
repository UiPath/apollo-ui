import { vi } from 'vitest';
import type React from 'react';
import { fireEvent, renderHook } from '@testing-library/react';
import { useDragSelection } from './useDragSelection';

const cell = (row: number, col: number) => {
  const element = document.createElement('td');
  element.dataset.row = String(row);
  element.dataset.col = String(col);
  return element;
};
const cellAt = (element: Element) =>
  element instanceof HTMLElement && element.dataset.row
    ? { row: Number(element.dataset.row), col: Number(element.dataset.col) }
    : null;

const container = document.createElement('div');
const press = (target: Element, init: { shiftKey?: boolean } = {}) =>
  ({
    button: 0,
    shiftKey: false,
    clientX: 0,
    clientY: 0,
    ...init,
    target,
    currentTarget: container,
  }) as unknown as React.PointerEvent<HTMLElement>;
const over = (target: Element) => ({ buttons: 1, target }) as unknown as React.PointerEvent;

const renderDrag = (options: { hasSelection?: boolean } = {}) => {
  const select = vi.fn();
  const extendTo = vi.fn();
  const onCellPress = vi.fn();
  const { result } = renderHook(() =>
    useDragSelection({
      editing: false,
      hasSelection: options.hasSelection ?? false,
      cellAt,
      select,
      extendTo,
      onEmptyAreaPress: vi.fn(),
      onCellPress,
    })
  );
  return { result, select, extendTo, onCellPress };
};

describe('useDragSelection', () => {
  it('anchors on the pressed cell and extends across the ones it crosses', () => {
    const { result, select, extendTo } = renderDrag();

    result.current.onPointerDown(press(cell(0, 0)));
    result.current.onPointerOver(over(cell(1, 2)));

    expect(select).toHaveBeenCalledWith({ row: 0, col: 0 });
    expect(extendTo).toHaveBeenCalledWith({ row: 1, col: 2 });
  });

  // The next pointerover would otherwise rebuild the selection Escape just cancelled.
  it('stops extending once Escape cancels the selection mid-drag', () => {
    const { result, extendTo } = renderDrag();

    result.current.onPointerDown(press(cell(0, 0)));
    fireEvent.keyDown(document, { key: 'Escape' });
    result.current.onPointerOver(over(cell(1, 2)));

    expect(extendTo).not.toHaveBeenCalled();
  });

  // `extendTo` announces nothing, so a Shift-press with nothing to extend left the other grid's selection standing.
  it('treats a Shift-press as a plain one while the grid holds no selection', () => {
    const { result, select, extendTo, onCellPress } = renderDrag({ hasSelection: false });

    result.current.onPointerDown(press(cell(1, 1), { shiftKey: true }));

    expect(select).toHaveBeenCalledWith({ row: 1, col: 1 });
    expect(extendTo).not.toHaveBeenCalled();
    expect(onCellPress).toHaveBeenCalledWith({ row: 1, col: 1 }, false);
  });

  it('extends from the existing anchor on a Shift-press when there is a selection', () => {
    const { result, select, extendTo, onCellPress } = renderDrag({ hasSelection: true });

    result.current.onPointerDown(press(cell(1, 1), { shiftKey: true }));

    expect(extendTo).toHaveBeenCalledWith({ row: 1, col: 1 });
    expect(select).not.toHaveBeenCalled();
    expect(onCellPress).toHaveBeenCalledWith({ row: 1, col: 1 }, true);
  });
});
